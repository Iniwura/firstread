import { mkdir } from 'node:fs/promises';
import path from 'node:path';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { throw new Error('Playwright is required for browser verification. Install it in the local development environment before running this script.'); }

const baseUrl = (process.env.FIRSTREAD_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const outputDir = path.resolve(process.env.FIRSTREAD_SCREENSHOT_DIR || 'artifacts');
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
const details = {};
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => failures.push('browser error: ' + error.message));
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('#evidence-count')?.textContent.includes('visible'), { timeout: 45000 });
  details.title = await page.title();
  details.case = await page.locator('#selected-case').textContent();
  details.source = await page.locator('#source-status').textContent();
  details.provider = await page.locator('#ai-provider-status').textContent();
  if (details.title !== 'FIRSTREAD — Evidence before reaction') failures.push('wrong page title');
  if (!details.case.includes('NVDA')) failures.push('NVDA case failed to initialize');

  await page.locator('[data-replay-offset="-15"]').click();
  await page.waitForFunction(() => document.querySelector('#replay-status')?.textContent !== 'Fetching', { timeout: 45000 });
  const before = await page.locator('#evidence-count').textContent();
  if (!before.includes('0 visible')) failures.push('pre-filing replay unexpectedly exposes evidence');

  await page.locator('[data-replay-offset="0"]').click();
  await page.waitForFunction(() => document.querySelector('#evidence-count')?.textContent.includes('3 visible'), { timeout: 45000 });
  await page.waitForFunction(() => document.querySelector('#dossier-summary')?.textContent.includes('completed pre-decision candles'), { timeout: 45000 });
  details.filingEvidence = await page.locator('#evidence-count').textContent();
  details.dossier = await page.locator('#dossier-summary').textContent();
  if (!details.filingEvidence.includes('3 visible')) failures.push('NVIDIA SEC-attached release missing');
  details.nvdaBrief = await page.locator('#brief-verified').textContent();
  if (!details.nvdaBrief.includes('SEC-filed earnings results') ||
      !details.nvdaBrief.includes('$96.2B')) failures.push('NVIDIA financial-source proof missing');
  await page.screenshot({ path: path.join(outputDir, 'firstread-desktop.png'), fullPage: true });

  await page.locator('[data-replay-offset="120"]').click();
  await page.waitForFunction(() => document.querySelector('#replay-note')?.textContent.includes('22:21'), { timeout: 45000 });
  if (!(await page.locator('#as-of-input').inputValue()).includes('22:21:19')) failures.push('later replay preset failed');

  await page.getByRole('button', { name: /AAPL/ }).first().click();
  await page.waitForFunction(() => document.querySelector('#precision-caveat')?.textContent.includes('date-only'), { timeout: 45000 });
  details.aaplPrecision = await page.locator('#precision-caveat').textContent();
  await page.waitForFunction(() => document.querySelector('#brief-verified')?.textContent.includes('$109.4B'), { timeout: 45000 });
  details.aaplBrief = await page.locator('#brief-verified').textContent();
  if (!details.aaplBrief.includes('E3-AAPL')) failures.push('Apple SEC Exhibit 99.1 was not used');
  await page.getByRole('button', { name: /MSFT/ }).first().click();
  await page.waitForFunction(() => document.querySelector('#brief-verified')?.textContent.includes('$90.0B'), { timeout: 45000 });
  details.msftBrief = await page.locator('#brief-verified').textContent();
  if (!details.msftBrief.includes('E3-MSFT')) failures.push('Microsoft SEC Exhibit 99.1 was not used');

  const status = await page.evaluate(async () => (await (await fetch('/api/ai')).json()));
  if (status.mode !== 'server-verified-evidence') failures.push('AI server evidence isolation mode missing');
  if (!status.configured) {
    await page.locator('#ai-question').fill('What is verifiably known at this time?');
    await page.getByRole('button', { name: /Review verified evidence/ }).click();
    await page.waitForFunction(() => document.querySelector('#ai-answer')?.textContent.toLowerCase().includes('not configured'), { timeout: 20000 });
    details.aiFallback = 'verified';
  } else {
    details.aiFallback = 'provider configured; requires separate cited live-model check';
  }
  await page.evaluate(() => {
    const original = window.fetch;
    window.fetch = (input, init) => String(input).includes('/api/research') ?
      Promise.reject(new Error('simulated offline')) : original(input, init);
  });
  await page.getByRole('button', { name: /Run the desk/ }).click();
  await page.waitForFunction(() => document.querySelector('#replay-status')?.textContent === 'ABSTAIN', { timeout: 20000 });
  details.offline = await page.locator('#replay-status').textContent();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobile.on('pageerror', (error) => failures.push('mobile browser error: ' + error.message));
  await mobile.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await mobile.waitForFunction(() => document.querySelector('#evidence-count')?.textContent.includes('visible'), { timeout: 45000 });
  details.mobileNoOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  if (!details.mobileNoOverflow) failures.push('mobile horizontal overflow');
  await mobile.screenshot({ path: path.join(outputDir, 'firstread-mobile.png'), fullPage: true });
} catch (error) { failures.push(error.message); }
finally { await browser.close(); }
const report = { pass: failures.length === 0, baseUrl, details, failures, screenshots: outputDir };
console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exitCode = 1;
