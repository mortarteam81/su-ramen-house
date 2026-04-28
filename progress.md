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
