-- Supercycle Glass Bridge: Supabase schema
-- Run this once in the Supabase SQL Editor.

create table if not exists public.glass_bridge_players (
  player_id text primary key,
  display_name text,
  avatar_url text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.glass_bridge_runs (
  id bigint generated always as identity primary key,
  player_id text not null references public.glass_bridge_players(player_id) on delete cascade,
  mode text not null default 'mixed' check (mode in ('mixed', 'avax', 'hood')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  score integer not null default 0 check (score >= 0 and score <= 12),
  stages_completed integer not null default 0 check (stages_completed >= 0 and stages_completed <= 12),
  won boolean not null default false,
  ended_reason text,
  created_at timestamptz not null default now()
);

create index if not exists glass_bridge_runs_player_idx
  on public.glass_bridge_runs(player_id, created_at desc);

create index if not exists glass_bridge_runs_leaderboard_idx
  on public.glass_bridge_runs(won, duration_ms);

alter table public.glass_bridge_players enable row level security;
alter table public.glass_bridge_runs enable row level security;

-- The browser does not access these tables directly. The Edge Function uses
-- the server-side secret key and performs the authorized writes/reads.
drop policy if exists "no direct browser access to glass bridge players"
  on public.glass_bridge_players;
drop policy if exists "no direct browser access to glass bridge runs"
  on public.glass_bridge_runs;

-- Aggregate personal stats without storing a second, potentially stale counter.
create or replace view public.glass_bridge_player_stats as
select
  p.player_id,
  p.display_name,
  p.avatar_url,
  count(r.id)::bigint as total_runs,
  count(*) filter (where r.won)::bigint as completed_runs,
  count(*) filter (where not r.won)::bigint as failed_runs,
  coalesce(max(r.score), 0)::integer as best_score,
  min(r.duration_ms) filter (where r.won and r.duration_ms is not null)::integer as best_time_ms,
  coalesce(max(r.stages_completed), 0)::integer as highest_stage,
  max(r.created_at) as last_run_at
from public.glass_bridge_players p
left join public.glass_bridge_runs r on r.player_id = p.player_id
group by p.player_id, p.display_name, p.avatar_url;

-- Public leaderboard source: fastest completed run per player.
create or replace view public.glass_bridge_leaderboard as
select
  p.player_id,
  p.display_name,
  p.avatar_url,
  min(r.duration_ms)::integer as best_time_ms,
  max(r.score)::integer as best_score,
  count(r.id)::bigint as total_runs
from public.glass_bridge_players p
join public.glass_bridge_runs r on r.player_id = p.player_id
where r.won = true
  and r.duration_ms is not null
group by p.player_id, p.display_name, p.avatar_url;

grant select on public.glass_bridge_player_stats to service_role;
grant select on public.glass_bridge_leaderboard to service_role;
grant select, insert, update on public.glass_bridge_players to service_role;
grant select, insert, update on public.glass_bridge_runs to service_role;
