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
