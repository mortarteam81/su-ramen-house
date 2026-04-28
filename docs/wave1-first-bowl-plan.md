# Wave 1 — First Bowl Guarantee Plan

## Goal

Make the first 30 seconds understandable and rewarding for children. A first-time player should complete one basic ramen without reading a separate instruction screen.

Primary success metric:
- 80%+ first-time children serve the first bowl within 30 seconds without adult help.

Secondary metrics:
- Time to first correct ingredient tap: < 5 seconds
- Wrong ingredient before first serve: < 20%
- Rage quit before first serve: < 10%

## Product principle

Do not teach by explaining first. Teach by guiding the first bowl.

The first session should feel like:
1. A customer appears immediately.
2. The order bubble shows the recipe sequence: 💧 → 🍜 → 🧂.
3. The first pot pulses.
4. The next valid ingredient pulses.
5. The cooking confirmation CTA becomes obvious.
6. The serve button pulses when done.
7. The matching customer flashes green on success.

## Wave 1 scope

### P0 — Order bubble recipe icons
- Show ingredient sequence directly inside each customer order bubble.
- Keep it compact for 5-seat layout.

### P0 — Next-action highlighting
- Strongly emphasize the selected pot.
- If no pot selected, pulse an empty pot.
- If a pot is selected and filling, pulse the next likely ingredient for the current order/recipe.
- If a pot is done and matches an order, pulse the serve button and target customer.

### P0 — First customer guarantee
- At game start, spawn the first customer immediately.
- First customer should order `basic` ramen.
- First customer should use a forgiving customer type if possible.
- Avoid waiting 3–8 seconds before the first action.

### P1 — Cooking confirmation CTA hierarchy
- When `water → noodle → soup` is complete, show a clear primary CTA:
  - `🔥 기본 라면 조리 시작`
- Longer recipe possibilities should be secondary.

### P1 — Serving match feedback
- On success, target customer flashes green before leaving.
- On mismatch, selected pot shakes red and toast explains the issue.

## Deferred

- Full tutorial replay screen
- Shop/menu unlock improvements
- Broad recipe card redesign
- Advanced drag-and-drop
- Stage/day system
- Audio

## Implementation constraints

Keep architecture small:
- Use existing `Game → main.js → UI` flow.
- Do not introduce a large tutorial state machine.
- Add only small helpers to `CustomerManager`, `CookingStation`, and `UI` if needed.
- Prefer CSS classes for guidance effects.

## Target files

- `js/customer.js`
- `js/game.js`
- `js/cooking.js`
- `js/ui.js`
- `js/main.js`
- `css/game.css`
