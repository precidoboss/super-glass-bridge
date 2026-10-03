# Supercycle — Glass Bridge

A Three.js glass-bridge survival game inspired by the Supercycle character and community. Pick the real ✳ pane and jump across all 12 stages. Choose the wrong pane and fall.

## Play

Open `index.html` in a modern browser, or deploy the repository as a static site (for example, with GitHub Pages or Vercel). Three.js is loaded from jsDelivr, so an internet connection is required.

## Controls

- `←` / `A`: jump to the left pane
- `→` / `D`: jump to the right pane
- On mobile, use the on-screen arrow buttons
- Sound can be toggled in the footer

The hero is the green-caped back-view sprite, cut from the sprite sheet (`sprites/back_a_1..4.png`, 224×256 cells, feet anchored at the bottom; `back_b_*` is a spare second set). The four frames used in game are embedded in `index.html` as WebP data URIs, so the game works as a single file. Frames: 1 crouch/idle, 2 jump up, 3 coming down, 4 landing.

Press **MARKS** in the footer to hide the ✳/× marks and play with identical-looking panes (hard mode).

The previous note about the avatar: it was formerly built from Three.js geometry. The referenced X profile is linked in the game context; its images could not be reliably fetched here, so no profile image is represented as an official asset.

## Chain coins mode

Every step has two glass panes, each carrying a coin logo: one Avalanche coin and one Robinhood Chain coin. The HUD tells you which chain to find (`FIND THE AVALANCHE COIN` / `FIND THE ROBINHOOD CHAIN COIN`). Land on the right chain's coin to advance; the wrong one shatters.

- Logos are fetched at page load from GeckoTerminal's public API (networks `avax` and `robinhood`) and re-randomized every run. If the fetch or an image is blocked, drawn badges are used instead.
- `MODE` in the footer cycles MIXED / AVAX ONLY / ROBINHOOD ONLY.
- `$SUPER` is pinned into the pool. Set `SUPER_CHAIN` near the top of the coin block in `index.html` (`'avax'` or `'hood'`) to match where it lives.
- Perf: glass no longer uses transmission (it forced a second scene render), lighter environment, capped pixel ratio, and adaptive resolution/bloom that backs off if FPS drops. Jumps are faster (0.4s) and one input is buffered during the landing.

## Home page and zoom

- The game opens on a home page (play, chain mode picker, how to play, best score, live/offline logo status). `HOME` in the footer returns to it.
- `ZOOM` button or `Z`: cinematic swoop onto the next two panes (FOV tighten, slight roll, letterbox bars), then eases back to the default chase camera. Press again to leave early; jumping also exits it.

## Music, zoom, skin

- In-game music: `Avalanche_Route.mp3` loops from the first click/keypress, ducks when you fall and swells on a win. The SOUND button mutes both music and effects.
- Zoom camera now sits ahead of the hero looking down at the next two panes, so the character never blocks the view (the hero also fades while zoomed).
- UI skin: Supercycle green with Avalanche red and Robinhood Chain neon-lime accents, 12-pip progress bar, chain-tinted prompt pill, brand gradient rail under the header.

## Leaderboard, runs and profile (Supabase + Grotto Runtime)

- Players are identified by the **Grotto runtime session** (name + avatar come from their Grotto profile). The browser never sends an identity: the server calls Grotto `/session/me` with the session token and trusts only that.
- Every run is tracked server-side: `POST /api/run-start` starts the clock on the server, `POST /api/run-finish` stops it on win or death. Finish times are therefore measured by the server, not reported by the browser.
- `GET /api/leaderboard` returns the fastest completed crossing per player (name, avatar, time, wins). `GET /api/me` returns the signed-in player's runs, wins, best time and rank.
- Outside The Grotto the game plays exactly as before; the leaderboard is viewable but runs are not recorded.

### Setup

1. Run `supabase/schema.sql` once in the Supabase SQL Editor.
2. In Vercel -> Project -> Settings -> Environment Variables add (Production + Preview):
   - `SUPABASE_URL` - Supabase Project Settings -> API -> Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - the `service_role` / secret key (server only, never put it in `index.html`)
   - `GROTTO_GAME_ID` - this game's Grotto game id (recommended; rejects sessions from other Grotto games)
3. Redeploy. The API lives in `/api` and needs Vercel (GitHub Pages cannot run it). `API_BASE` at the top of the SGB script in `index.html` points at the Vercel domain, so the game can also run on The Grotto.

## Red Light · Green Light

A second mode, opened from the home page (RED LIGHT · GREEN LIGHT). Hold Space / → / D (or the on-screen RUN button) while the sentinel looks away; let go the moment the lamp turns red. Five rounds, each with shorter greens, fake warnings and snap reds. It reuses the hero sprite frames and runs entirely in the browser: nothing is sent to Supabase yet (only the best round is kept in `localStorage`).
