# Wave 11 — Mobile No-Scroll Cooking Flow

## Goal

Reduce mobile gameplay scrolling by keeping the current order and primary cooking action visible while the player works.

Current user feedback after Wave 10:

> Mobile works, but the player checks the customer order, scrolls down to select a pot, then scrolls again to tap the cook button.

Wave 11 should make the core loop feel like a mobile game, not a long web page.

---

## Approved design direction

Apply:

1. **Sticky order summary** — full application.
2. **Bottom mobile cooking action bar** — full application.
3. **Mobile game-board layout** — partial application only.

Do not do a full mobile UI rebuild yet.

---

## Scope

### A. Sticky mobile order summary

On portrait mobile, show a compact always-visible current/urgent order summary near the top of gameplay:

```txt
현재 주문: 🍜 기본 라면  💧 → 🍜 → 🧂
```

Rules:
- Show the most urgent active unserved customer.
- Prefer customer with the lowest patience remaining.
- Keep it compact and readable.
- Hide or de-emphasize on desktop.

### B. Bottom mobile action bar

On portrait mobile, show a fixed/sticky primary action bar near the bottom, above or integrated with ingredients.

States:

```txt
No pot selected:
냄비를 선택하세요

Empty/filling pot:
선택 냄비: 물+면+스프
[🔥 조리 시작 · 800원] if recipe is confirmable

Cooking:
보글보글 조리 중... N초
[🗑️ 버리기]

Done:
🍜 기본 라면 완성
[✅ 서빙하기] [🗑️ 버리기]
```

Rules:
- The action bar becomes the primary mobile control.
- Pot-card buttons may remain, but the bottom action bar should remove the need to scroll to reach actions.
- Destructive discard remains secondary/muted.
- Buttons must be 44px+ and separated.

### C. Partial mobile board layout

Only adjust enough to reduce scroll dependence:
- Customer character area can be more compact.
- Order summary takes priority over full customer display.
- Pots remain visible as the main board area.
- Ingredients remain bottom-accessible.

Do not create a separate mobile DOM or full app shell.

---

## Implementation notes

Likely files:
- `index.html`: add `mobile-order-summary` and `mobile-action-bar` elements.
- `css/game.css`: mobile-only positioning/layout styles.
- `js/ui.js`: render mobile summary/action bar from game state.
- `js/main.js`: wire mobile action buttons to existing game methods.
- `_review/`: update/add screenshot capture for Wave 11.

Recommended UI APIs:

```js
ui.updateMobileOrderSummary(game)
ui.updateMobileActionBar(game, handlers)
```

Handlers can call existing game methods:
- `game.confirmCook(recipeId)`
- `game.tryServe(potId)`
- `game.discardPot(potId)`

---

## Acceptance criteria

On 375x667 portrait:
- Current order is visible while selecting pot/ingredients.
- Cook CTA is reachable without scrolling after ingredients are added.
- Serve/discard are reachable without scrolling when ramen is done.
- Ingredients remain tappable.
- No horizontal scroll.
- Existing first-bowl guide still works.

On 390x844 / 412x915:
- Same flow with more breathing room.

On desktop/tablet:
- No significant regression.

---

## Verification

Required:

```bash
node --check js/*.js
node scripts/first-bowl-regression.mjs
node scripts/game-regression.mjs
```

Visual checks:
- 375x667 start
- 375x667 after pot selected
- 375x667 after ingredients added / cook CTA
- 375x667 done / serve-discard
- 390x844 sanity
- 768x1024 sanity

---

## Risk

- Action duplication can confuse players. Keep mobile action bar clearly primary; pot-card buttons can remain but should not visually dominate.
- Fixed bars can cover content. Use safe-area padding and enough bottom spacing.
- Too much compression could hide character charm. Accept this tradeoff on small phones; gameplay clarity wins.
