import { createHash } from 'node:crypto';
const base = 'https://api.bitget.com';
async function json(path) { const response = await fetch(new URL(path, base)); const body = await response.json(); return { response, body, url: new URL(path, base).toString() }; }
const clock = await json('/api/v2/public/time');
const serverTime = Number(clock.body?.data?.serverTime);
const asOf = serverTime - 20 * 60 * 1000;
const query = `/api/v3/market/history-candles?category=SPOT&symbol=BTCUSDT&interval=1m&endTime=${asOf}&limit=5`;
const first = await json(query); const second = await json(query);
const rows = first.body?.data || []; const timestamps = rows.map(row => Number(row[0]));
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const result = { capturedAt: new Date().toISOString(), source: first.url, asOf: new Date(asOf).toISOString(), rows: rows.length, maxReturnedCandle: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null, cutoffRespected: rows.length > 0 && Math.max(...timestamps) < asOf, repeatStable: hash(rows) === hash(second.body?.data || []), payloadSha256: hash(rows) };
result.pass = first.response.ok && first.body?.code === '00000' && result.cutoffRespected && result.repeatStable;
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
