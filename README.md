# Hellscape Horror

A first-person descent into a burning dungeon — a **Parker Data Link** game.
Built with Three.js (r128), self-contained, installable as a PWA, and playable offline.

Live: https://hellscape.parkerdata.link

## Play
Open `index.html` (or the live URL). **Descend**, then:
- **W A S D / Arrows** — move
- **Mouse** — look
- **Shift** — run
- **Esc** — release cursor

## Install
Visit the site and use your browser's **Install app** option. It runs fullscreen and works offline.

## Music
Background music is optional. Drop a royalty-free track named **`music.mp3`** into this
folder (e.g. from Pixabay) and it plays on descent, looping, with the top-right mute toggle.
The game also has built-in procedural audio (drone, wind, embers, distant roars).

## Files
- `index.html` — the game
- `three.min.js` — 3D engine (r128), loaded locally with a CDN fallback
- `manifest.webmanifest`, `sw.js` — PWA install + offline cache
- `icon-192.png`, `icon-512.png` — app icons

© Parker Data Link. Engine: three.js (MIT).
