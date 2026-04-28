Original prompt: 카미엘이 su-ramen-house 게임의 그래픽 몰입도를 높이기 위해 요리사 캐릭터와 손님 캐릭터 애니메이션(입장→착석→식사→계산→퇴장)을 추가하고 싶다고 승인함. 목표는 게임 개발 전문가 관점에서 상태 기반 캐릭터 연출 시스템 MVP를 먼저 만들고, 이후 그래픽 리소스 고도화가 쉬운 구조를 확보하는 것.

## 2026-04-28 Wave 6 — Character Animation MVP Plan

### Product goal
- UI 카드 중심의 조작감을 “라면가게에 손님이 오고, 요리사가 만들고, 손님이 먹고 나가는” 장면으로 전환한다.
- 풀 스프라이트/복잡한 걷기 애니메이션은 아직 금지. CSS/DOM 기반 상태 전환 연출 MVP로 구현한다.

### Scope
1. Chef character
   - Gameplay scene에 요리사 캐릭터 DOM 추가.
   - 상태: `idle`, `cooking`, `happy`, `surprised`, `combo`.
   - 재료 투입/조리 시작/완성/성공/실패/콤보 이벤트에 반응.
   - 냄비와 재료 조작 영역을 가리지 않아야 함.

2. Customer lifecycle presentation
   - 기존 고객 로직은 유지하되 DOM 상태/클래스로 연출 추가.
   - 상태/연출: `entering`, `seated/waiting`, `eating`, `paying`, `leaving`, `angry-leaving`.
   - 성공 서빙 시: 손님이 먹는 말풍선/후루룩 → 계산/동전 → 퇴장.
   - 시간초과 시: 화난 말풍선 → 퇴장.

3. Tests / debug
   - `render_game_to_text()`에 chef/customer visual state를 가능한 범위에서 포함.
   - 기존 `scripts/first-bowl-regression.mjs`, `scripts/game-regression.mjs` 통과 유지.
   - Playwright screenshot으로 시작/식사/퇴장 연출 확인.

### Constraints
- Static HTML/CSS/JS only.
- No external art assets or dependencies.
- Preserve mobile layout and first-bowl flow.
- Keep animations short and non-blocking; gameplay state must not wait on animation completion except existing visual removal delays.

### Suggested files
- `index.html`: chef DOM placeholder.
- `css/game.css`, `css/animations.css`: character, lifecycle, chef animations.
- `js/ui.js`: chef state methods, customer lifecycle class/text methods.
- `js/main.js`: hook chef/customer visual states into existing game callbacks.
- `js/customer.js` only if a minimal non-breaking visual state field is useful.

### Verification commands
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- local screenshot capture for start, cooking, serve/eating/pay/leave.

## 2026-04-28 Wave 8/9 Planning — Economy, Discard, Story

User requested:
1. Slower customer action/lifecycle pacing.
2. Discard menu for incorrectly made ramen.
3. Ingredient/production cost concept.
4. Storyline for immersion.

Plan written to `docs/economy-story-plan.md`.

Recommended sequence:
1. Wave 8A: customer lifecycle timing tuning.
2. Wave 8B: pot discard button.
3. Wave 8C: recipe production cost + profit UI.
4. Wave 9: lightweight day story cards.

Key principle: failure recovery and economy first, story second.

## 2026-04-28 Wave 8/9 Implementation — Economy, Discard, Story MVP

Implemented and locally verified:
- Slowed customer success lifecycle: eating/paying/leaving now remains visible for ~2.7s; angry leaving ~1.1s.
- Added pot-level discard button for filling/cooking/done states.
- Added recipe production costs and cost tracking on pots (`costSpent`, `costCharged`).
- Charges production cost when cooking starts; discard does not refund spent cost.
- Added cost/profit display in recipe hints and shop/menu encyclopedia.
- Added Day 1 story intro overlay and day goal/success/failure text structure.
- Updated regression tests for story intro, discard recovery, production cost, and net profit.
- Adjusted toast placement/feedback to avoid blocking key UI; discard loss uses bottom-right non-blocking toast plus pot highlight.

Verification passed:
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- `_review/wave8-capture.mjs` screenshot review: no serious blocking/readability issue remaining.

## 2026-04-28 Day Progression Fix

User reported that pressing retry felt like Day 1 restarted. Root cause: story MVP only had `DAY_STAGES[0]` and `startGame()` always reset `currentDay` to Day 1.

Implemented:
- Added Day 2–5 story/goal/fail/clear data.
- Added persisted `currentDayIndex` and `completedDays` to save data.
- `Game.startGame({ dayIndex })` now starts the requested/saved day.
- Clearing a day advances saved `currentDayIndex`; failing does not advance it.
- Retry button text now distinguishes `same day retry`, `next day`, and final reset.
- Menu subtitle shows which day will start.
- Regression coverage verifies saved Day 2 progression starts Day 2.

Verification passed:
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- `_review/day-progression-capture.mjs` screenshot review for Day 2 intro: no serious issue.

## 2026-04-28 Wave 10 Planning — Mobile Playability

User approved Wave 10 goal: make `su-ramen-house` playable on mobile for Day 1 without discomfort.

Delegation mode selected by user: real Telegram specialist-bot workflow, not internal isolated sub-agents.

Plan written to `docs/mobile-playability-plan.md`.
GitHub issue created: #24 `Wave 10: 모바일 첫날 플레이성 최적화`.

Recommended role sequence:
1. design / davinciavatar: mobile UX layout review/spec.
2. worker / muskeron: CSS/JS implementation.
3. reviewer / windmageranian: mobile QA/regression.
4. Rel/main: final integration, commit/push, server for testing.

Scope cap: mobile portrait browser playability for Day 1; no new gameplay systems, no new art, no full app/PWA work.

## 2026-04-28 Wave 10 Implementation — Mobile Playability

Completed with real specialist-agent workflow:
- design / davinciavatar reviewed current mobile density and produced a layout spec.
- worker / muskeron implemented the mobile pass.
- reviewer / windmageranian QA'd mobile screenshots, found a 375x667 CTA/order visibility issue, and applied a short-screen compression fix plus capture-script fix.
- Rel/main performed final QA and added a final fixed bottom recipe/ingredient layout for 375x667 CTA state.

Implemented:
- 2-row mobile HUD.
- Compact first-bowl guide behavior on phones.
- Reduced customer/chef sprite footprint on phones.
- Phone-focused customer zone, 2-column pots, separated serve/discard action group.
- Compact mobile recipe CTA with cost attached.
- Safe-area-aware ingredient tray; on very short phones with recipe CTA open, ingredients become a one-row horizontal tray and recipe CTA is fixed above it.
- Mobile toast/story fitting improvements.
- `_review/wave10-mobile-capture.mjs` for mobile/tablet screenshots.

Verification passed:
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- `node _review/wave10-mobile-capture.mjs`
- Vision QA for 375x667 start/CTA/done and 768x1024 tablet sanity: no serious blockers after final fixes.

## 2026-04-28 Wave 11 Implementation — Mobile No-Scroll Cooking Flow

User tested Wave 10 on mobile and confirmed it worked, but reported the main usability problem: checking the customer order, scrolling to select the pot, then scrolling again to tap cook was too web-page-like.

Approved approach: apply sticky order summary + bottom mobile action bar, and only partially apply mobile-board restructuring.

Implemented:
- Added `docs/mobile-no-scroll-flow-plan.md`.
- Added mobile-only current order summary (`#mobile-order-summary`) showing the most urgent active order and recipe icons.
- Added mobile-only bottom action bar (`#mobile-action-bar`) with state-aware actions:
  - no pot selected: select pot prompt
  - empty/filling: selected pot summary and cook CTA when confirmable
  - cooking: remaining time + discard
  - done: serve + discard
- Reused existing game handlers for confirm cook, serve, and discard so desktop behavior remains consistent.
- Added stable mobile action rendering signature to avoid replacing buttons every animation frame.
- Adjusted small-phone layout so empty customer seats are hidden, active order remains compact, ingredients become horizontal tray, and pot area remains tappable.
- Added `_review/wave11-mobile-capture.mjs` for 375/390/tablet screenshots.

Verification passed:
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- `node _review/wave11-mobile-capture.mjs`
- Vision QA for 375x667 start/CTA/done and 390x844 CTA found no no-scroll flow blockers.

## 2026-04-28 Wave 12 Implementation — Background Music

User uploaded MP3 source and approved Rel solo implementation.

Implemented:
- Copied uploaded MP3 to `assets/audio/background-music.mp3`.
- Added HUD music toggle button `#btn-music`.
- Added looping background music in `js/main.js` with `preload='none'` to avoid Playwright/networkidle hangs before user gesture.
- Playback starts after user interactions such as game start/retry/resume/story flow, respecting browser autoplay policy.
- Mute state persists via localStorage key `ramen_shop_bgm_muted`.
- Added `docs/background-music-plan.md`.

Verification passed:
- `node --check js/*.js`
- `node scripts/first-bowl-regression.mjs`
- `node scripts/game-regression.mjs`
- Local HTTP check: `/assets/audio/background-music.mp3` returns 200 `audio/mpeg`.
