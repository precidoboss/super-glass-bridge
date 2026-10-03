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
