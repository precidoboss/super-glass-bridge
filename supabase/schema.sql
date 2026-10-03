-- Super Glass Bridge: Supabase schema (v1)
-- Run the whole file once in Supabase -> SQL Editor. Safe to re-run.
-- Tables use the sgb_ prefix so they never collide with your other projects.

create table if not exists public.sgb_players (
  player_id      text primary key check (char_length(player_id) between 1 and 100),
  display_name   text check (display_name is null or char_length(display_name) <= 40),
  avatar_url     text check (avatar_url is null or char_length(avatar_url) <= 500),
  total_runs     integer not null default 0,
  completed_runs integer not null default 0,
  best_stage     integer not null default 0 check (best_stage between 0 and 12),
  best_time_ms   integer check (best_time_ms is null or best_time_ms > 0),
  best_time_at   timestamptz,
  last_played_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.sgb_runs (
  id            uuid primary key default gen_random_uuid(),
  player_id     text not null references public.sgb_players(player_id) on delete cascade,
  mode          text not null default 'mixed' check (mode in ('mixed','avax','hood')),
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  duration_ms   integer,
  stage_reached integer not null default 0 check (stage_reached between 0 and 12),
  completed     boolean not null default false
);

create index if not exists sgb_runs_player_started_idx
  on public.sgb_runs (player_id, started_at desc);
create index if not exists sgb_players_best_time_idx
  on public.sgb_players (best_time_ms, best_time_at) where best_time_ms is not null;

-- Start a run. The SERVER clock starts here, so finish times cannot be faked by the browser.
create or replace function public.sgb_start_run(
  p_player_id text, p_display_name text, p_avatar_url text, p_mode text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
  insert into public.sgb_players as p (player_id, display_name, avatar_url, total_runs, last_played_at)
  values (p_player_id, p_display_name, p_avatar_url, 1, now())
  on conflict (player_id) do update set
    display_name   = coalesce(excluded.display_name, p.display_name),
    avatar_url     = coalesce(excluded.avatar_url, p.avatar_url),
    total_runs     = p.total_runs + 1,
    last_played_at = now(),
    updated_at     = now();

  insert into public.sgb_runs (player_id, mode)
  values (p_player_id, case when p_mode in ('mixed','avax','hood') then p_mode else 'mixed' end)
  returning id into v_id;

  return v_id;
end $$;

-- Finish a run (win or death). Duration = server time since sgb_start_run.
create or replace function public.sgb_finish_run(
  p_run_id uuid, p_player_id text, p_stage integer, p_completed boolean
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_run      public.sgb_runs%rowtype;
  v_old      public.sgb_players%rowtype;
  v_new      public.sgb_players%rowtype;
  v_ms       integer;
  v_stage    integer;
  v_comp     boolean := coalesce(p_completed, false);
  v_new_best boolean;
  v_rank     bigint;
begin
  select * into v_run from public.sgb_runs
   where id = p_run_id and player_id = p_player_id for update;
  if not found then raise exception 'run_not_found'; end if;
  if v_run.finished_at is not null then raise exception 'run_already_finished'; end if;

  v_ms := least(floor(extract(epoch from (clock_timestamp() - v_run.started_at)) * 1000), 2147483647)::integer;
  if v_ms > 7200000 then raise exception 'run_expired'; end if;
  -- 12 jumps at 0.4s each plus the final hop cannot be done faster than this.
  if v_comp and v_ms < 5000 then raise exception 'run_too_fast'; end if;

  v_stage := greatest(0, least(coalesce(p_stage, 0), 12));
  if v_comp then v_stage := 12; end if;

  select * into v_old from public.sgb_players where player_id = p_player_id for update;
  v_new_best := v_comp and (v_old.best_time_ms is null or v_ms < v_old.best_time_ms);

  update public.sgb_runs
     set finished_at = now(), duration_ms = v_ms, stage_reached = v_stage, completed = v_comp
   where id = p_run_id;

  update public.sgb_players set
    completed_runs = completed_runs + case when v_comp then 1 else 0 end,
    best_stage     = greatest(best_stage, v_stage),
    best_time_ms   = case when v_new_best then v_ms else best_time_ms end,
    best_time_at   = case when v_new_best then now() else best_time_at end,
    updated_at     = now()
  where player_id = p_player_id
  returning * into v_new;

  if v_new.best_time_ms is not null then
    select count(*) + 1 into v_rank from public.sgb_players q
     where q.best_time_ms is not null
       and (q.best_time_ms < v_new.best_time_ms
            or (q.best_time_ms = v_new.best_time_ms and q.best_time_at < v_new.best_time_at));
  end if;

  return jsonb_build_object(
    'duration_ms', v_ms,
    'completed',   v_comp,
    'stage',       v_stage,
    'new_best',    v_new_best,
    'stats', jsonb_build_object(
      'total_runs',     v_new.total_runs,
      'completed_runs', v_new.completed_runs,
      'best_stage',     v_new.best_stage,
      'best_time_ms',   v_new.best_time_ms,
      'rank',           v_rank
    )
  );
end $$;

-- Leaderboard: fastest completed crossing per player. Includes player_id for the
-- server only (it marks "you" and strips it before replying to browsers).
create or replace function public.sgb_leaderboard(p_limit integer default 20)
returns table (rank bigint, player_id text, display_name text, avatar_url text,
               best_time_ms integer, completed_runs integer)
language sql stable security definer set search_path = public, pg_temp as $$
  select row_number() over (order by p.best_time_ms asc, p.best_time_at asc, p.player_id asc),
         p.player_id, p.display_name, p.avatar_url, p.best_time_ms, p.completed_runs
    from public.sgb_players p
   where p.best_time_ms is not null
   order by 1
   limit greatest(1, least(coalesce(p_limit, 20), 100));
$$;

-- One player's personal stats and rank.
create or replace function public.sgb_player_stats(p_player_id text)
returns table (total_runs integer, completed_runs integer, best_stage integer,
               best_time_ms integer, rank bigint)
language sql stable security definer set search_path = public, pg_temp as $$
  select p.total_runs, p.completed_runs, p.best_stage, p.best_time_ms,
         case when p.best_time_ms is null then null else
           (select count(*) + 1 from public.sgb_players q
             where q.best_time_ms is not null
               and (q.best_time_ms < p.best_time_ms
                    or (q.best_time_ms = p.best_time_ms and q.best_time_at < p.best_time_at)))
         end
    from public.sgb_players p
   where p.player_id = p_player_id;
$$;

-- Lock everything down: only your server (service_role key) can touch data.
alter table public.sgb_players enable row level security;
alter table public.sgb_runs    enable row level security;
revoke all on public.sgb_players, public.sgb_runs from public, anon, authenticated;

revoke all on function public.sgb_start_run(text,text,text,text)       from public, anon, authenticated;
revoke all on function public.sgb_finish_run(uuid,text,integer,boolean) from public, anon, authenticated;
revoke all on function public.sgb_leaderboard(integer)                  from public, anon, authenticated;
revoke all on function public.sgb_player_stats(text)                    from public, anon, authenticated;

grant execute on function public.sgb_start_run(text,text,text,text)        to service_role;
grant execute on function public.sgb_finish_run(uuid,text,integer,boolean) to service_role;
grant execute on function public.sgb_leaderboard(integer)                  to service_role;
grant execute on function public.sgb_player_stats(text)                    to service_role;
