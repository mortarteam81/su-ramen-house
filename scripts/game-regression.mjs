import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    try {
      return await import('../_review/node_modules/playwright/index.mjs');
    } catch {
      throw new Error('Playwright is not available. Run `npm install playwright` or keep local `_review/node_modules/playwright` from the review setup.');
    }
  }
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function createStaticServer() {
  return createServer(async (req, res) => {
    try {
      const host = req.headers.host || 'localhost';
      const url = new URL(req.url || '/', `http://${host}`);
      const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const safePath = normalize(requested).replace(/^\.\.(\/|\\|$)/, '');
      const filePath = join(root, safePath);
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine server address');
  return `http://127.0.0.1:${address.port}`;
}

async function newRegressionPage(browser, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    let testNow = 1700000000000;
    const realDateNow = Date.now.bind(Date);
    Date.now = () => testNow;
    window.__advanceTestTime = (ms) => {
      testNow += ms;
      return testNow;
    };
    window.__realDateNow = realDateNow;
  });
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  return page;
}

async function waitForState(page, predicate, label, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(() => window.get_game_debug_state?.());
    if (state && predicate(state)) return state;
    await page.waitForTimeout(50);
  }
  const finalState = await page.evaluate(() => window.render_game_to_text?.() || 'no debug state');
  throw new Error(`Timed out waiting for ${label}\n${finalState}`);
}

async function advanceTime(page, ms) {
  await page.evaluate((amount) => window.__advanceTestTime(amount), ms);
  await page.waitForTimeout(80);
}

async function startGame(page) {
  await page.click('#btn-start');
  return waitForState(
    page,
    (s) => s.state === 'playing' && s.customers.length === 1 && s.customers[0].menuId === 'basic' && s.customers[0].type === 'child',
    'first basic child customer',
  );
}

async function clickIngredient(page, ingredientId) {
  await page.click(`.ingredient-btn[data-ingredient="${ingredientId}"]`);
}

async function makeFirstBowl(page) {
  await cookBasicBowlToDone(page, 0);
  await page.click('#pot-0 .btn-serve');
  return waitForState(page, (s) => s.served === 1 && s.money > 0, 'first bowl served');
}

async function cookBasicBowlToDone(page, potId = 0) {
  await page.click(`#pot-${potId}`);
  await waitForState(page, (s) => s.selectedPot === potId && s.guidance.guideTargets.includes('water'), 'water guidance');

  for (const ingredient of ['water', 'noodle', 'soup']) {
    await clickIngredient(page, ingredient);
    await page.waitForTimeout(80);
  }

  await waitForState(page, (s) => s.guidance.recipeHintText.includes('조리 시작'), 'basic cook confirmation');
  await page.click('.btn-confirm-cook.primary-cta');
  await waitForState(page, (s) => s.pots[potId].state === 'cooking' && s.pots[potId].targetRecipe === 'basic', 'basic cooking');
  await advanceTime(page, 5100);
  return waitForState(page, (s) => s.pots[potId].state === 'done', 'basic bowl done');
}

async function findDiscardButton(page, potId = 0) {
  const selectors = [
    `#pot-${potId} .btn-discard`,
    `#pot-${potId} .btn-pot-discard`,
    `#pot-${potId} [data-action="discard"]`,
    `#pot-${potId} [data-pot-action="discard"]`,
    `#pot-${potId} button:has-text("버리기")`,
    `#pot-${potId} button:has-text("폐기")`,
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.count() && await locator.isVisible()) return locator;
  }
  return null;
}

async function clickDiscardIfPresent(page, potId = 0) {
  await page.waitForTimeout(120);
  const button = await findDiscardButton(page, potId);
  if (!button) return false;
  await button.click();
  return true;
}

async function scenarioFirstBowl(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  try {
    const initial = await startGame(page);
    if (!initial.guidance.firstBowlGuideText.includes('냄비 선택')) throw new Error('First-bowl guide did not start at pot selection');
    if (!initial.guidance.guideTargets.includes('pot-0')) throw new Error('First empty pot was not guided');

    const served = await makeFirstBowl(page);
    if (served.selectedPot !== null) throw new Error('Pot should be deselected after serving');
    if (served.guidance.firstBowlGuideVisible) throw new Error('First-bowl guide should complete after serving');
    if (served.customers.some((customer) => !customer.served && customer.menuId !== 'basic')) {
      throw new Error('Unexpected non-basic customer appeared during first-bowl flow');
    }
    if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);
    return { money: served.money, served: served.served };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scenarioWrongIngredientRejection(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  try {
    await startGame(page);
    await page.click('#pot-0');
    await clickIngredient(page, 'water');
    await waitForState(page, (s) => s.pots[0].state === 'filling' && s.pots[0].addedIngredients.join(',') === 'water', 'water in selected pot');

    // Let the legitimate water throw animation finish, then click an invalid next ingredient.
    await page.waitForTimeout(650);
    await clickIngredient(page, 'egg');
    await page.waitForTimeout(80);

    const state = await waitForState(
      page,
      (s) => s.pots[0].state === 'empty' && s.pots[0].addedIngredients.length === 0 && s.selectedPot === 0,
      'wrong ingredient resets pot but keeps selection',
    );
    const flyingCount = await page.locator('.flying-ingredient').count();
    const potReceive = await page.locator('#pot-0.pot-receive').count();
    if (flyingCount !== 0 || potReceive !== 0) {
      throw new Error(`Wrong ingredient should not fake a throw animation (flying=${flyingCount}, receive=${potReceive})`);
    }
    if (state.served !== 0 || state.lives !== 3) throw new Error('Wrong ingredient should not serve a bowl or cost a life');
    return { potState: state.pots[0].state, selectedPot: state.selectedPot, lives: state.lives };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scenarioCookingCostAndDiscard(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  try {
    await startGame(page);
    await page.click('#pot-0');

    for (const ingredient of ['water', 'noodle', 'soup']) {
      await clickIngredient(page, ingredient);
      await page.waitForTimeout(80);
    }

    await waitForState(page, (s) => s.guidance.recipeHintText.includes('재료비 800원'), 'basic cost shown in recipe hint');
    await page.click('.btn-confirm-cook.primary-cta');
    let state = await waitForState(
      page,
      (s) => s.pots[0].state === 'cooking' && s.pots[0].costSpent === 800 && s.pots[0].costCharged === true && s.money === -800,
      'cooking cost charged',
    );
    if (!state.pots[0].visibleText.includes('버리기')) throw new Error('Discard button should be visible while cooking');

    await page.click('#pot-0 .btn-discard');
    state = await waitForState(
      page,
      (s) => s.pots[0].state === 'empty' && s.pots[0].costSpent === 0 && s.pots[0].costCharged === false && s.money === -800,
      'discard resets pot without refunding cost',
    );
    if (state.served !== 0 || state.lives !== 3) throw new Error('Discard should not serve a bowl or cost a life');
    await waitForState(page, (s) => !s.pots[0].visibleText.includes('버리기'), 'discard button hidden on empty pot');
    return { money: state.money, potState: state.pots[0].state, lives: state.lives };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scenarioCustomerTimeoutLifeLoss(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  try {
    await startGame(page);

    let state = null;
    for (let elapsed = 0; elapsed <= 90000; elapsed += 5000) {
      await advanceTime(page, 5000);
      state = await page.evaluate(() => window.get_game_debug_state?.());
      if (state?.lives === 2 && state.customers.length === 0 && state.state === 'playing') break;
    }

    if (!(state?.lives === 2 && state.customers.length === 0 && state.state === 'playing')) {
      throw new Error(`Timed out waiting for first customer timeout life loss\n${await page.evaluate(() => window.render_game_to_text?.() || 'no debug state')}`);
    }
    if (!state.hud.lives.includes('🖤')) throw new Error('HUD hearts did not reflect the lost life');
    return { lives: state.lives, customers: state.customers.length };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scenarioDiscardRecoveryIfAvailable(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  try {
    await startGame(page);
    await page.click('#pot-0');
    await clickIngredient(page, 'water');
    await waitForState(page, (s) => s.pots[0].state === 'filling' && s.pots[0].addedIngredients.join(',') === 'water', 'filling pot before discard');

    if (!await clickDiscardIfPresent(page, 0)) {
      return { skipped: 'discard button is not present in this build' };
    }

    let state = await waitForState(
      page,
      (s) => s.pots[0].state === 'empty' && s.pots[0].addedIngredients.length === 0,
      'discard resets filling pot',
    );
    if (state.served !== 0 || state.lives !== 3 || state.customers.length !== 1) {
      throw new Error('Discarding a filling pot should not serve, cost a life, or remove the customer');
    }

    await cookBasicBowlToDone(page, 0);
    if (!await clickDiscardIfPresent(page, 0)) {
      throw new Error('Discard button disappeared for a done pot');
    }

    state = await waitForState(
      page,
      (s) => s.pots[0].state === 'empty' && s.pots[0].addedIngredients.length === 0,
      'discard resets done pot',
    );
    if (state.served !== 0 || state.lives !== 3 || state.customers.length !== 1) {
      throw new Error('Discarding a done pot should not serve, cost a life, or remove the customer');
    }
    return { filling: 'discarded', done: 'discarded', served: state.served, lives: state.lives, customers: state.customers.length };
  } finally {
    await page.close().catch(() => {});
  }
}

async function scenarioProductionCostIfAvailable(browser, baseUrl) {
  const page = await newRegressionPage(browser, baseUrl);
  try {
    await startGame(page);
    const startingMoney = (await page.evaluate(() => window.get_game_debug_state?.()))?.money;

    await page.click('#pot-0');
    for (const ingredient of ['water', 'noodle', 'soup']) {
      await clickIngredient(page, ingredient);
      await page.waitForTimeout(80);
    }

    await waitForState(page, (s) => s.guidance.recipeHintText.includes('조리 시작'), 'basic cook confirmation');
    await page.click('.btn-confirm-cook.primary-cta');
    const cooking = await waitForState(page, (s) => s.pots[0].state === 'cooking' && s.pots[0].targetRecipe === 'basic', 'basic cooking with cost check');

    if (!(cooking.money < startingMoney)) {
      return { skipped: 'production cost is not charged on cooking start in this build', startingMoney, cookingMoney: cooking.money };
    }

    const costDeducted = startingMoney - cooking.money;
    await advanceTime(page, 5100);
    const done = await waitForState(page, (s) => s.pots[0].state === 'done' && s.customers.length === 1, 'basic bowl done before cost/profit serve');
    const customer = done.customers[0];
    const expectedGrossReward = Math.floor(3000 * 0.7) + Math.floor(3000 * customer.patienceRemaining * 0.5);

    await page.click('#pot-0 .btn-serve');
    const served = await waitForState(page, (s) => s.served === 1, 'costed bowl served');
    const netGain = served.money - startingMoney;

    if (served.money <= cooking.money) throw new Error('Serving after production cost should still add the sale reward');
    if (netGain !== expectedGrossReward - costDeducted) {
      throw new Error(`Net money mismatch after cost and reward: expected ${expectedGrossReward - costDeducted}, got ${netGain}`);
    }

    return { startingMoney, costDeducted, expectedGrossReward, finalMoney: served.money, netGain };
  } finally {
    await page.close().catch(() => {});
  }
}

const { chromium } = await loadPlaywright();
const server = createStaticServer();
const baseUrl = await listen(server);
const browser = await chromium.launch({ headless: true });

const results = {};
try {
  results.firstBowl = await scenarioFirstBowl(browser, baseUrl);
  results.wrongIngredient = await scenarioWrongIngredientRejection(browser, baseUrl);
  results.cookingCostAndDiscard = await scenarioCookingCostAndDiscard(browser, baseUrl);
  results.customerTimeout = await scenarioCustomerTimeoutLifeLoss(browser, baseUrl);
  results.discard = await scenarioDiscardRecoveryIfAvailable(browser, baseUrl);
  results.productionCost = await scenarioProductionCostIfAvailable(browser, baseUrl);
  console.log(JSON.stringify({ ok: true, results }, null, 2));
} finally {
  await browser.close().catch(() => {});
  await new Promise((resolve) => server.close(resolve));
}
