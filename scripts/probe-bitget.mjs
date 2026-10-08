#!/usr/bin/env node
/**
 * Execute ONLY on an environment with outgoing HTTPS access.
 * Verifies active Reality instruments and 1H candle coverage around three SEC anchors.
 * Writes evidence to reports/bitget-feasibility.json. Does not require API keys.
 * No dummy series or forced PASS values.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://api.bitget.com';
const anchors = JSON.parse(await readFile(path.join(root, 'data/verified-sec-anchors.json'), 'utf8'));

async function bitget(endpoint, params) {
  const url = new URL(endpoint, baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${url.pathname}`);
    const payload = await response.json();
    if (payload.code !== '00000') throw new Error(`Bitget ${payload.code}: ${payload.msg ?? 'unknown error'}`);
    if (!Array.isArray(payload.data)) throw new Error('Unexpected response: data is not an array');
    return { data: payload.data, endpoint: url.toString(), requestTime: payload.requestTime };
  } finally {
    clearTimeout(timer);
  }
}

const report = {
  project: 'FIRSTREAD',
  generatedAt: new Date().toISOString(),
  sourceApi: baseUrl,
  goal: 'Establish real rToken candle coverage near three SEC filing acceptance timestamps, not market outcome claims',
  cases: [],
};
try {
  const instruments = await bitget('/api/v3/market/instruments', { category: 'SPOT' });
  const reality = instruments.data.filter((x) => String(x.isReality).toLowerCase() === 'yes' && String(x.status).toLowerCase() === 'online');
  report.realityInstrumentCount = reality.length;
  for (const anchor of anchors) {
    const symbol = `r${anchor.ticker}USDT`;
    const instrument = reality.find((x) => String(x.symbol).toUpperCase() === symbol.toUpperCase());
    if (!instrument) {
      report.cases.push({ ticker: anchor.ticker, status: 'UNAVAILABLE', issue: 'No active Reality SPOT instrument with expected underlying ticker', anchor });
      continue;
    }
    const eventMs = Date.parse(anchor.secAcceptedAt);
    const start = eventMs - (8 * 3600000);
    const end = eventMs + (36 * 3600000);
    try {
      const result = await bitget('/api/v3/market/history-candles', {
        category: 'SPOT', symbol: instrument.symbol, interval: '1H',
        startTime: start, endTime: end, limit: 100,
      });
      const rows = result.data.filter((r) => Array.isArray(r) && r.length >= 7 && Number.isSafeInteger(Number(r[0])) && Number.isFinite(Number(r[4])) && Number(r[4]) > 0)
        .map((r) => ({ timestamp: new Date(Number(r[0])).toISOString(), open: r[1], high: r[2], low: r[3], close: r[4], volume: r[5], turnover: r[6] }))
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      const pre = rows.filter((r) => Date.parse(r.timestamp) + 3600000 <= eventMs);
      const post = rows.filter((r) => Date.parse(r.timestamp) >= eventMs);
      const status = pre.length && post.length ? 'COVERAGE_CANDIDATE' : 'INSUFFICIENT';
      report.cases.push({ ticker: anchor.ticker, symbol: instrument.symbol, status,
        note: 'Candles are not tick-level execution prices. Validate first-public-release time; no performance conclusion is authorized by this probe.',
        candleCount: rows.length, preCandleCount: pre.length, postCandleCount: post.length,
        sourceEndpoint: result.endpoint, secAnchor: anchor.secAcceptedAt, rows });
    } catch (error) {
      report.cases.push({ ticker: anchor.ticker, symbol: instrument.symbol, status: 'ERROR', issue: String(error.message) });
    }
  }
} catch (error) {
  report.globalError = String(error.message);
}
await mkdir(path.join(root, 'reports'), { recursive: true });
const reportPath = path.join(root, 'reports/bitget-feasibility.json');
await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ report: reportPath, totalInstruments: report.realityInstrumentCount ?? null, cases: report.cases.map(({ ticker, symbol, status, candleCount, issue }) => ({ ticker, symbol, status, candleCount, issue })), globalError: report.globalError }, null, 2));
if (report.globalError || report.cases.filter((c) => c.status === 'COVERAGE_CANDIDATE').length < 3) {
  console.error('FAIL: Three matching real price histories were not verified. DO NOT claim the historical data gate passed.');
  process.exitCode = 1;
} else {
  console.log('PASS: Three candidate candle histories found; publication-time correctness still requires separate validation.');
}
