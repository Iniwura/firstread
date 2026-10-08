import { createRequire } from 'node:module';
const require = createRequire('/mnt/c/Users/DELL 7400/Documents/Codex/2026-10-08/read-codex-autopilot-md-in-the/outputs/firstread/package.json');
const { chromium } = require('/mnt/c/Users/DELL 7400/Documents/Codex/2026-10-08/read-codex-autopilot-md-in-the/outputs/firstread/node_modules/playwright');

const desktopShot = '/mnt/c/Users/DELL 7400/Documents/Codex/2026-10-08/read-codex-autopilot-md-in-the/outputs/firstread-starter-browser-desktop.png';
const mobileShot = '/mnt/c/Users/DELL 7400/Documents/Codex/2026-10-08/read-codex-autopilot-md-in-the/outputs/firstread-starter-browser-mobile.png';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForSelector('#evidence-count');
await page.waitForFunction(() => document.querySelector('#evidence-count')?.textContent.includes('visible'));
const title = await page.title();
const initial = {
  selected: await page.locator('#selected-case').textContent(),
  evidence: await page.locator('#evidence-count').textContent(),
  baseline: await page.locator('#baseline-decision').textContent(),
  price: await page.locator('#market-price').textContent(),
  source: await page.locator('#source-status').textContent(),
};
await page.screenshot({ path: desktopShot, fullPage: true });
await page.getByRole('button', { name: /AAPL/ }).click();
await page.waitForFunction(() => document.querySelector('#selected-case')?.textContent.includes('AAPL'));
await page.waitForFunction(() => document.querySelector('#precision-caveat')?.textContent.includes('date-only'));
const aapl = { selected: await page.locator('#selected-case').textContent(), evidence: await page.locator('#evidence-count').textContent(), caveat: await page.locator('#precision-caveat').textContent() };
await page.locator('#ai-question').fill('What should a human investigate next?');
await page.getByRole('button', { name: /Review this receipt/ }).click();
await page.waitForFunction(() => document.querySelector('#ai-answer')?.textContent.includes('not configured'));
const aiFallback = await page.locator('#ai-answer').textContent();
const badNetwork = await page.evaluate(async () => {
  const original = window.fetch;
  window.fetch = (input, init) => String(input).includes('/api/research') ? Promise.reject(new Error('simulated offline')) : original(input, init);
  return true;
});
await page.getByRole('button', { name: /Run the desk/ }).click();
await page.waitForFunction(() => document.querySelector('#ingestion-status')?.textContent.includes('Source error'));
const offline = await page.locator('#replay-status').textContent();
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle', timeout: 45000 });
await mobile.waitForFunction(() => document.querySelector('#evidence-count')?.textContent.includes('visible'));
const noHorizontalOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
await mobile.screenshot({ path: mobileShot, fullPage: true });
await browser.close();
console.log(JSON.stringify({ pass: title === 'FIRSTREAD — Evidence before reaction' && initial.baseline === 'RESEARCH_READY' && aapl.selected.includes('AAPL') && aapl.evidence.includes('1 visible') && aiFallback.includes('not configured') && offline === 'ABSTAIN' && noHorizontalOverflow && consoleErrors.length === 0, title, initial, aapl, aiFallback, offline, noHorizontalOverflow, consoleErrors, screenshots: { desktopShot, mobileShot } }, null, 2));
