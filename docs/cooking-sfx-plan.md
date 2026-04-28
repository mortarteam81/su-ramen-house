# Wave 13 — Cooking and Eating SFX

## Goal
Add lightweight game feedback sounds without external SFX assets.

## Implemented sounds
- Gas stove ignition: on cook start.
- Boiling water/bubbles: shortly after cook start.
- Noodle slurp: when a served customer enters eating lifecycle.

## Implementation
- Uses Web Audio API synthesis in `js/main.js`.
- No extra files or external sound libraries.
- SFX shares the existing music mute toggle, so `🎵/🔇` controls both BGM and generated SFX.
- AudioContext is resumed only after user gesture to respect browser autoplay policy.

## Future replacement
The generated sounds are placeholders. If better licensed SFX files are provided later, replace these synthesis methods with short audio assets under `assets/audio/`.
