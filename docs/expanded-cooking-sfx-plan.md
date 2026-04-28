# Wave 16 — Expanded Cooking SFX

## Goal
Make cooking feedback more concrete with generated placeholder sound effects.

## Added / refined sounds
- Gas stove: stronger two-click ignition + short flame burst.
- Water: pouring/dripping sound when `water` is added.
- Egg: crack + small shell/noise burst when `egg` is added.
- Boiling: longer, more bubbly boil sound after cooking starts.
- Slurping: longer multi-pulse noodle slurp when customer starts eating.

## Implementation
- Extends `RamenSfx` in `js/main.js`.
- Uses Web Audio API only; no external SFX files.
- Existing music toggle still mutes BGM and generated SFX together.

## Future note
These are temporary generated effects. If better licensed audio files are uploaded later, replace individual `RamenSfx` methods with asset playback.
