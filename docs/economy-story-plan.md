# Economy, Discard, and Story Plan

## Context

After testing the character/sprite version, Kamiel requested four improvements:

1. Customer action/lifecycle animation feels too fast.
2. Add a way to discard incorrectly made ramen.
3. Add ingredient/production cost to ramen making.
4. Add a lightweight story line for immersion.

This plan intentionally separates **gameplay economy** from **story presentation** so we can implement safely in small waves.

---

## Design principles

### 1. Keep the game child-friendly
- Cost should teach “profit” without feeling punitive.
- Discard should recover from mistakes, not shame the player.
- Story should be short and skippable.

### 2. Make failure recoverable
A cooking game becomes frustrating if a wrong bowl blocks the pot. Discarding must be easy and obvious.

### 3. Keep feedback simple
Use simple language:
- `재료비 -800원`
- `판매 +3,000원`
- `순이익 +2,200원`
- `폐기: 재료비 손실`

Avoid complex accounting terms.

### 4. Preserve pacing
Customer eating/paying can be slower, but the game should not feel like it is waiting on cutscenes. Target total success lifecycle: about 2.4–3.0 seconds.

---

## Wave 8 — Economy and discard system

### Goals
- Slow down customer lifecycle enough to see eating/paying/leaving.
- Add discard button for unwanted ramen/pots.
- Add production cost and profit feedback.

### Scope

#### A. Customer lifecycle timing
Current success flow is too fast. Change to:

```txt
serve success
→ eating: 1.2s
→ paying: 0.8s
→ leaving: 0.7s
→ seat clears around 2.7s
```

Timeout angry leave:

```txt
angry-leaving: 1.0–1.2s
```

Acceptance criteria:
- Eating/paying state is visible long enough to notice.
- Seat does not stay blocked for too long.
- Regression tests still pass.

#### B. Discard button
Add a pot-level discard button.

Display conditions:
- Show when pot state is `filling`, `cooking`, or `done`.
- Hide when pot is `empty`.

Behavior:
- Clicking discard resets the pot.
- If cost was spent, show loss feedback.
- Chef reacts with `surprised`.
- Combo should not necessarily reset unless discarding a completed order-ready ramen. MVP: no combo reset on discard.

Button text:

```txt
🗑️ 버리기
```

Toast examples:

```txt
🗑️ 라면을 버렸어요. 재료비 손실 -800원
```

Acceptance criteria:
- Player can recover from unwanted completed ramen.
- Discard does not remove customers or lives.
- Discard works for filling/cooking/done pots.

#### C. Production cost
Add cost per recipe in `RECIPES`.

Suggested first values:

```txt
basic:    cost 800,  price 3000, profit 2200
 egg:     cost 1100, price 4000, profit 2900
 kimchi:  cost 1400, price 4500, profit 3100
 spicy:   cost 1400, price 4500, profit 3100
 tteok:   cost 1700, price 5000, profit 3300
 cheese:  cost 1900, price 5500, profit 3600
 seafood: cost 2400, price 6000, profit 3600
 special: cost 4200, price 10000, profit 5800
```

Recommended implementation:
- Charge cost when cooking starts, not when each ingredient is clicked.
- Track `pot.costSpent` and `pot.costCharged`.
- On successful serve, reward still adds sale price/tip/speed bonus.
- Net effect is cost already deducted + reward added.
- On discard, no refund.

Why cooking-start charge:
- Easier to understand: “이 라면을 끓이기 시작하면 재료비가 든다.”
- Avoids micro-accounting per ingredient.

UI:
- Recipe hint or pot status can show:
  - `재료비 800원`
- Menu encyclopedia can show:
  - `판매가 / 재료비 / 예상이익`

Acceptance criteria:
- Money decreases when cooking starts.
- Successful serve still increases money by reward.
- Discard after cooking started preserves the cost loss.
- Debug output includes pot cost state.

---

## Wave 9 — Lightweight story line

### Goals
- Add a sense of progression and place.
- Keep story short enough not to slow gameplay.

### Story structure
Use day-based micro-story cards.

Each day has:
- title
- intro text, 1–2 lines
- goal
- success text
- failure/encouragement text
- optional newly introduced customer/menu

Initial story arc:

```txt
Day 1 — 첫 영업일
오늘은 작은 라면가게의 첫 오픈날! 기본 라면으로 손님 마음을 잡아보자.
Goal: 라면 8그릇 서빙

Day 2 — 학생들의 하교 시간
학교가 끝나자 학생 손님들이 몰려왔다. 계란 라면을 빠르게 준비하자.
Goal: 계란 라면 3그릇 포함, 총 10그릇

Day 3 — 매운맛 소문
매운 라면이 맛있다는 소문이 났다. 실수 없이 주문을 맞춰보자.
Goal: 콤보 3회 달성

Day 4 — 바쁜 점심시간
급한 직장인들이 짧은 점심시간에 찾아왔다.
Goal: 손님 12명 만족시키기

Day 5 — VIP 방문
가게 소문을 듣고 특별한 손님이 찾아왔다.
Goal: VIP 주문 성공
```

MVP implementation:
- Add story card before game starts for Day 1 only first.
- Add “시작하기” button.
- Keep it skippable.
- Later expand to multiple days.

Acceptance criteria:
- Story card appears before day starts.
- It does not appear during active cooking.
- Day clear screen uses story success text.

---

## Recommended implementation order

### Step 1 — Timing tuning only
- Increase served lifecycle timing.
- Verify visuals feel better.

### Step 2 — Discard button
- Add button and pot reset flow.
- No cost yet, or show simple discard only.

### Step 3 — Cost/profit economy
- Add recipe costs.
- Charge on cooking start.
- Display cost/profit in UI.
- Update tests.

### Step 4 — Story card MVP
- Add Day 1 story intro and success/failure copy.

---

## Test plan

Commands:

```bash
node --check js/*.js
node scripts/first-bowl-regression.mjs
node scripts/game-regression.mjs
```

New test scenarios to add:
- Discard filling pot resets pot.
- Discard done ramen resets pot and does not serve customer.
- Cooking start deducts cost.
- Successful serve results in net money change.
- Story card can start the day.

---

## Risk notes

- Cost can make early game feel harsh. Keep Day 1 forgiving and maybe provide starting money if needed.
- Discard button must not be too close to serve button on mobile.
- Story should not become modal friction. Keep text short.
- Regression tests may need to account for cost deduction when checking money after serve.
