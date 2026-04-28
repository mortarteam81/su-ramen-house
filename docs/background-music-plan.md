# Wave 12 — Background Music

## Goal
Add the user-provided MP3 as looping background music without breaking browser autoplay policies or mobile controls.

## Source
- Uploaded source: `/Users/mortarteam81/.openclaw/media/inbound/The_Cartographer_s_Desk---9debca19-cc67-4f03-9424-0caf695f9ec5.mp3`
- Game asset: `assets/audio/background-music.mp3`

## Implementation
- Copy MP3 into `assets/audio/`.
- Create one looping `Audio` instance in `js/main.js`.
- Start playback only after user gestures (`게임 시작`, story start/retry/resume), so browser autoplay policy is respected.
- Add HUD music toggle button `#btn-music`.
- Persist mute state in localStorage key `ramen_shop_bgm_muted`.
- Keep volume moderate at 0.32.

## Verification
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- Confirm audio asset served with HTTP 200.
