# Supabase + Grotto setup

This pass adds cloud run tracking without changing the existing game loop.

## 1. Create the Supabase database objects

Run supabase/migrations/20261003_glass_bridge_stats.sql in the Supabase SQL Editor.

It creates:
- glass_bridge_players — Grotto player profile snapshot (player ID, display name, avatar).
- glass_bridge_runs — one row per run.
- glass_bridge_player_stats — personal totals/best score/best time.
- glass_bridge_leaderboard — fastest completed run per player.

The browser does not get direct write access to these tables. The Edge Function uses Supabase's server-side admin client.

## 2. Put the browser-safe Supabase values in supabase-config.js

Copy your project's URL and publishable key from Supabase Settings → API Keys:

    window.SUPABASE_CONFIG = {
      url: 'https://YOUR_PROJECT_REF.supabase.co',
      publishableKey: 'sb_publishable_...',
      functionName: 'glass-bridge-stats'
    };

The publishable key is allowed in browser code. Do not put an sb_secret_..., service_role, database password, or other secret here.

## 3. Set the only custom Edge Function secret

    GROTTO_GAME_ID=YOUR_GROTTO_GAME_ID

The value must be the exact runtime.gameId for this game.

With the current Supabase server SDK, the project's Supabase secret key is provisioned to the Edge Function automatically; it is not copied into the game or committed to GitHub.

CLI example:

    supabase secrets set GROTTO_GAME_ID="YOUR_GROTTO_GAME_ID"

Then deploy:

    supabase functions deploy glass-bridge-stats

## 4. Deploy the game

Make sure the edited supabase-config.js is present in the deployed static site.

The game remains playable if Grotto or Supabase is unavailable. Cloud profile/run sync happens in the background and never gates Three.js boot or input.

## What is trusted

- Player identity: fetched from the Grotto runtime session; the game does not ask the player to type a wallet.
- Profile fields: display name/avatar are taken from the Grotto session and stored with the Grotto player ID.
- Run ownership: the Edge Function checks the active Grotto session before creating or finishing a run.
- Finish time: calculated from server-observed started_at/finish time, not the browser's timer.
- Score/stage/win status: currently reported by the game client. This pass does not implement authoritative server-side replay validation.

## Recovery behavior

- No Supabase config: game continues locally.
- No Grotto runtime: game continues locally; cloud run creation is skipped.
- Expired/missing Grotto session: cloud operation fails closed; gameplay is not blocked.
- Cloud finish failure: local game result remains intact; the failed cloud write is logged for diagnosis.

A future pass is warranted if the service contract, run schema, score-validation model, or Grotto capability requirements change.