# Wave 10 — Mobile Playability Upgrade Plan

## Goal

Make `su-ramen-house` comfortably playable on a portrait mobile browser for the first day.

Target outcome:

> A first-time player can complete Day 1 on a phone without UI overlap, tiny buttons, accidental discard/serve taps, or hidden guidance.

This is not a full mobile-app redesign. It is a focused web-mobile playability pass.

---

## Delegation mode

User selected the real Telegram specialist-bot workflow for better records and role separation.

Planned roles:

1. `design / davinciavatar`
   - Mobile UX layout review and target layout spec.
2. `worker / muskeron`
   - CSS/JS implementation.
3. `reviewer / windmageranian`
   - Mobile QA, regression, release readiness.
4. `main / Rel`
   - Orchestration, conflict resolution, final verification, commit/push, user report.

`architect / andrejkarpathyavatar` is optional for this wave because the target is layout/playability, not a large architecture change.

---

## Current known state

The project already has baseline responsive CSS from earlier work, but later additions increased mobile pressure:

- character sprites
- chef sprite
- customer lifecycle states
- discard button
- cost/profit text
- story card
- day progression
- first-bowl guide
- toasts and feedback

So this wave focuses on the real current UI, not the older responsive baseline.

---

## Mobile target devices

Use these viewport classes for review and test:

1. Small phone
   - `375x667` / iPhone SE-ish
2. Common phone
   - `390x844` / iPhone 12/13-ish
3. Android mid-size
   - `412x915`
4. Small tablet / landscape sanity
   - `768x1024`

Primary target is portrait phone.

---

## UX principles

### 1. One clear vertical flow

Mobile screen should read top-to-bottom:

```txt
HUD / Day progress
Story or first-bowl guide, compact
Customers / orders
Pots / cooking state
Recipe hint / primary action
Ingredients / touch controls
```

### 2. Touch targets over decoration

Minimum target guideline:

- primary buttons: 44px+ height
- ingredient buttons: 48px+ height when possible
- serve/discard separated enough to avoid accidental taps

### 3. Keep feedback non-blocking

Avoid toasts, speech bubbles, and guide bars covering:

- ingredient shelf
- serve button
- discard button
- recipe CTA

### 4. Preserve first-bowl guarantee

Mobile layout must still make the first bowl obvious:

- first customer visible
- pot selection clear
- next ingredient clear
- cook CTA readable
- serve button reachable

---

## Implementation scope

### A. Mobile layout restructuring

Expected CSS work:

- reduce vertical gaps in `#screen-game`
- make HUD wrap cleanly with day progress readable
- make customer seats horizontally scrollable or compact grid if needed
- reduce customer sprite/card height on small screens
- keep chef non-interactive and non-blocking
- pot cards become compact but readable
- ingredient shelf becomes sticky or bottom-prioritized if feasible

Acceptance criteria:

- No horizontal page scroll.
- No key UI hidden below fold in normal first-bowl flow.
- Customer order, selected pot, and ingredient shelf are visible without excessive scrolling.

### B. Touch-first controls

- enlarge ingredient hit areas
- increase button spacing
- visually separate `서빙하기` and `버리기`
- ensure buttons do not overlap pot text/progress

Acceptance criteria:

- ingredient buttons are comfortably tappable
- discard is available but not dangerously close to serve
- pot selection is obvious

### C. Mobile guide/toast behavior

- compact first-bowl guide on mobile
- place toasts away from bottom ingredient controls
- story modal must fit on small screens
- pause/gameover overlays must fit without clipping

Acceptance criteria:

- first-bowl guide is readable but not dominant
- toast never blocks primary action for long
- story CTA visible on 375x667

### D. Mobile regression/capture scripts

Add or update Playwright scripts to capture:

- mobile story intro
- mobile first-bowl start
- mobile cooking + recipe CTA
- mobile done + serve/discard buttons
- mobile after discard feedback
- tablet sanity screenshot

Acceptance criteria:

- script artifacts are saved under `_review/`
- reviewer can inspect screenshots
- existing regression tests remain green

---

## Out of scope for Wave 10

- New gameplay systems
- New art generation
- PWA install/offline mode
- Full landscape redesign
- Advanced accessibility audit
- Sound/music
- New Day/story content

---

## Test plan

Required commands:

```bash
node --check js/*.js
node scripts/first-bowl-regression.mjs
node scripts/game-regression.mjs
```

Required visual checks:

- `375x667` first-bowl flow
- `390x844` cook/serve/discard flow
- `412x915` day progression/story flow
- `768x1024` tablet sanity

Recommended manual checks:

1. Start Day 1 on mobile viewport.
2. Select pot.
3. Add water/noodle/soup.
4. Confirm cook.
5. Confirm cost text remains readable.
6. Confirm discard button is visible but separated.
7. Serve first bowl.
8. Confirm customer lifecycle does not cover controls.
9. Trigger gameover/retry screen if possible.

---

## Done definition

Wave 10 is done when:

- Day 1 can be played on 375x667 without serious layout blockers.
- First-bowl guidance still works.
- Serve/discard/cook/ingredient controls are touch-friendly.
- Mobile screenshots pass review.
- Existing regression scripts pass.
- Changes are committed and pushed to `main`.
