# Hellscape Horror — Changelog

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
