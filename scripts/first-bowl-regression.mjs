import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT || 4173);

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
      const url = new URL(req.url || '/', `http://localhost:${port}`);
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

async function waitForState(page, predicate, label, timeoutMs = 12000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(() => window.get_game_debug_state?.());
    if (state && predicate(state)) return state;
    await page.waitForTimeout(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

const { chromium } = await loadPlaywright();
const server = createStaticServer();
await new Promise((resolve) => server.listen(port, resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleMessages = [];
const errors = [];
page.on('console', (msg) => consoleMessages.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => errors.push(err.message));

try {
  await page.goto(`http://localhost:${port}`, { waitUntil: 'networkidle' });
  await page.click('#btn-start');

  let state = await waitForState(
    page,
    (s) => s.customers.length === 1 && s.customers[0].menuId === 'basic' && s.customers[0].type === 'child',
    'first basic child customer',
  );

  if (!state.guidance.firstBowlGuideText.includes('냄비 선택')) throw new Error('First-bowl guide is not visible');
  if (!state.guidance.guideTargets.includes('pot-0')) throw new Error('First empty pot is not guided');

  await page.click('#pot-0');
  state = await waitForState(page, (s) => s.selectedPot === 0 && s.guidance.guideTargets.includes('water'), 'water guidance');

  for (const ingredient of ['water', 'noodle', 'soup']) {
    await page.click(`.ingredient-btn[data-ingredient="${ingredient}"]`);
    await page.waitForTimeout(150);
  }

  await waitForState(page, (s) => s.guidance.recipeHintText.includes('조리 시작'), 'cook confirmation CTA');
  await page.click('.btn-confirm-cook.primary-cta');
  await waitForState(page, (s) => s.pots[0].state === 'done' && s.guidance.guideTargets.some((x) => String(x).includes('btn-serve')), 'serve guidance', 15000);

  await page.click('#pot-0 .btn-serve');
  state = await waitForState(page, (s) => s.served === 1 && s.money > 0, 'successful first serve');

  if (state.selectedPot !== null) throw new Error('Pot should be deselected after serving');
  if (state.customers.some((customer) => !customer.served && customer.menuId !== 'basic')) {
    throw new Error('Unexpected active customer appeared before first bowl flow completed');
  }
  if (errors.length) throw new Error(`Page errors: ${errors.join('; ')}`);

  console.log(JSON.stringify({ ok: true, money: state.money, served: state.served, consoleMessages }, null, 2));
} finally {
  await browser.close().catch(() => {});
  await new Promise((resolve) => server.close(resolve));
}
