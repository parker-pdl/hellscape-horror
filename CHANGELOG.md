# Hellscape Horror — Changelog

## Session 08-08-2026 — Shadow figures removed, mobile controls, jump, pause menu/minimap/save, 20 new rooms

A large feature pass covering everything Parker asked for in one go. Process:
refactored the collision system to be data-driven first (regression-tested
against the existing map before changing anything else), then removed the
shadow figures, then added jump + the periodic scare, then the pause
menu/minimap/save system, then mobile controls, then the 20 new rooms
(tested last, in a batch, via the debug hook + headless Playwright).

### 1. Shadow figures removed
The whole shadow-figure system is gone — `createShadowFigure`, the
`shadowFigures` array, all 4 push() call sites (crypt watcher, cave/boiler
walkers, obsidian stalker), the scene-add loop, and the animate-loop
update/proximity block. Blood splatter, gore decals, and the hazard system
(slow zones, spike zones) are untouched and still fully working.

### 2. Collision refactor: data-driven `zones` array
`resolvePosition()` used to be a long hardcoded if/else chain, one block per
room. It's now a loop over a `zones` array — each entry is a bounding rect,
per-side wall-clearance margins (0 = open doorway into the next room, real
margin = an actual wall), an elevation (constant or a function, for
stairs/slopes), a zone name, and an optional one-time hint. Verified this
refactor was behavior-identical to the old code before building anything new
on top of it (all original zones teleport-tested with matching results).
The exact same array now also feeds the minimap (see below), so the map can
never drift out of sync with what's actually walkable.

### 3. 20 new rooms, 4 new dead ends
5 new rooms chained onto each of the 4 existing dead ends — the cave red
room, the boiler red room, the flooded crypt, and the obsidian chamber —
using the same `buildSegment` factory and material functions
(`caveMat`/`boilerMat`/`stoneMat`/`obsidianMat`) with a tint, obstacle type,
and torch-side variation per room. Each wing's chain includes two 90° turns
(real corners, using the same overlapping-rect technique the original
junction/stair corners already relied on), so the level now has real new
turns to explore, not just longer straight halls. The final room of each
chain gets the puzzle-box end door (moved here from the old, now-bypassed
dead end) — the obsidian chamber's old unique glowing-seam "true end of the
level" treatment was dropped in favor of the same door style as the other 3
wings, now that it's a mid-chain room rather than the literal end.

### 4. Space-bar jump
Space gives the player upward velocity (only while grounded); gravity pulls
them back down onto whatever floor elevation `resolvePosition` reports for
their current position, so jumping still works correctly on stairs/slopes.

### 5. Periodic jump scare (no shadow figures needed)
`triggerJumpScare()` (the white flash + 4-note dissonant stinger) now fires
on its own timer — first one 20-40s after descending, then every 45-90s
after that (randomized each time), only while actually playing (never
paused or in a menu).

### 6. Pause menu, minimap, save/resume
- **Pause**: Esc opens it. On desktop this is driven entirely by the native
  pointer-lock-exit event (Esc always releases pointer lock on its own) —
  deliberately not also wired to a separate keydown handler, to avoid any
  risk of double-firing. On touch devices (no pointer lock) a dedicated
  on-screen pause button opens/closes it instead.
- **Resume / Resume Saved Game / Start New Game / Quit to Title** — all
  present. Saves go to `localStorage` (position, facing, elapsed time,
  timestamp) — written on pause and auto-saved every ~10s during play.
- **Map** — a simple top-down canvas minimap, drawn straight from the same
  `zones` array `resolvePosition` uses, plus a player marker with a facing
  line. Not fancy — flat colored rectangles, no textures — but it can never
  go out of sync with the real geometry since it reads the same data.
- **Settings** — mouse sensitivity slider and a music volume slider.

### 7. Mobile / touch controls (the most important ask)
Touch is detected via `'ontouchstart' in window` / `navigator.maxTouchPoints`.
On touch devices: pointer lock is never requested, and on-screen controls
appear — a left-side drag joystick for movement, a right-side drag area for
look, a JUMP button, and a pause/menu button. Desktop mouse/keyboard controls
are unchanged and don't show any on-screen controls.

### 8. Testing
Regression-tested the zones refactor first (all 11 original zones,
teleport + `state()`, zero mismatches) before adding anything new. After the
20 new rooms were built, served the directory with `python3 -m http.server`
and drove headless Chromium via Playwright
(`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`):
teleported to the centerpoint of all 31 zones (11 original + 20 new) and
confirmed `zone`/`elev` resolve as expected for every one — **zero
mismatches, zero page console errors**. Also exercised jump, pause/resume,
minimap open/close, the settings sliders, and the scare-flash trigger
through the extended `window.__HELL` debug hook
(`zones()`, `pause()`, `resume()`, `jump()`, `scareNow()`), all working with
no errors. Note: this sandbox's headless Chromium falls back to software
WebGL, which makes each interaction noticeably slower than it will run on
Parker's real hardware/GPU — that's a test-environment artifact, not a game
performance issue.

### Known limitations / judgment calls
- New rooms are flat (no additional slopes) — variety comes from tint,
  obstacle type, and turns, not elevation changes, to keep the collision
  math simple and low-risk.
- The crypt-wing extension includes a purely visual `spikes` obstacle
  without a paired hazard trigger in one room (the original crypt hazard
  pairing wasn't extended to the new rooms) — cosmetic only, doesn't affect
  the (untouched) hazard system.
- Settings are intentionally minimal: mouse sensitivity + music volume only.
- Minimap is a simple flat-rectangle top-down view, not textured/detailed.

---

## Session 30-07-2026 (evening) — Major expansion: new zones, hazards, smarter scares

Built on top of the earlier same-day session (center corridor, obstacles,
shadow figures v1). This pass went big across every axis: new explorable
areas, obstacles that actually affect the player instead of just decoration,
a rewritten shadow-figure system with real behavior variety, and a scripted
jump scare.

### New areas

- **Flooded crypt** — a new branch off the main hall (second junction,
  `JZ3`, opens only on the right wall — the left wall stays solid there).
  Knee-deep translucent water, five mossy stone coffins, two spike-trap
  hazards visible poking up through the water, teal-tinted ceiling drips,
  a cold blue-green torch, and a watcher figure standing among the coffins.
- **Obsidian chamber** — the true end of the level now, continuing straight
  past where the center corridor's descent bottoms out. Glassy near-black
  walls (low roughness, high metalness — catches the point lights like wet
  stone), magenta/pink accent lighting, jagged floor obstacles, and a
  glowing sealed wall with pulsing seams (visually distinct from the
  puzzle-box door motif used in the red rooms, since this is the actual
  dead end of the map, not a side room).

### Shadow figures — rewritten, not just extended

The previous session's shadow figures had a bug: their world position was
hardcoded to a small `±4` offset near the center of the map regardless of
which wing they were supposed to patrol, so they weren't really standing
in the red rooms as intended. This pass rewrote the system with real world
coordinates and three distinct behaviors:

- **Walker** — patrols back and forth along an assigned line (now correctly
  positioned in the cave and boiler red rooms).
- **Watcher** — stands still in the flooded crypt among the coffins, and
  slowly turns to face the player as they approach. Never moves, never
  chases — just watches.
- **Stalker** — waits motionless at the far end of the obsidian chamber.
  The first time the player gets close, it fires the scripted jump scare
  exactly once (not repeatedly).

### Jump scare

A dedicated full-screen white flash overlay (`#scareFlash`) plus a loud
four-note dissonant stinger (Web Audio, no audio file), triggered once by
the obsidian-chamber stalker. Decays smoothly over about half a second
rather than cutting instantly.

### Hazards that actually affect the player

Previously "obstacles" were purely visual — you could walk right through
their collision the same as open floor. This pass adds a real hazard
layer:

- **Slow zones** — the flooded crypt's water cuts movement speed to half
  while you're in it.
- **Spike zones** — two spike-trap clusters in the crypt trigger a red pain
  flash (reusing the existing `#dmg` damage-vignette element) and a sharp
  stinger sound on entry, with a 1.4s cooldown so it doesn't spam while
  you're standing near one.

### Other additions

- New obstacle types: `coffin` (crypt dressing) and `spikes` (paired with
  the spike hazard).
- `addBloodDrips()` now takes an optional texture override, used for teal
  water drips in the crypt instead of the default blood-red.
- A debug hook (`window.__HELL.state()` / `.teleport(x,z)`) for verifying
  zone/collision behavior without playing through the whole map by hand.

### Verification

Tested headless via Playwright against a locally-served copy (CDN-blocked
sandbox, same approach as the previous session): teleported through every
new and existing zone and confirmed `zone`/`elev` resolve correctly at each
one, confirmed zero page errors across the whole pass, and confirmed both
the spike hazard (hit-count check) and the jump scare (flash-opacity check)
actually fire. Screenshots were used to visually sanity-check the crypt and
obsidian chamber renders correctly (coffins, water, spikes, seams, magenta
lighting all visible and positioned as intended).

---

## Session 30-07-2026 (earlier) — Center corridor, obstacles, shadow figures v1

See git history for the original changelog entry — center descending
corridor, obstacle scattering (boxes/barrels/debris), procedural floor
cracks, and the first (buggy) shadow-figure pass, replaced above.
