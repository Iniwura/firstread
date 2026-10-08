import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { normalizeTickerPayload, normalizeCandleRows, spreadBps } = require('../lib/market');

test('normalizes the live Bitget spot ticker shape', () => {
  const ticker = normalizeTickerPayload({ data: [{ symbol: 'BTCUSDT', lastPr: '100', bidPr: '99.9', askPr: '100.1', change24h: '-0.01', ts: '1791462000000' }] });
  assert.equal(ticker.last, 100);
  assert.equal(ticker.symbol, 'BTCUSDT');
  assert.ok(Math.abs(spreadBps(ticker) - 20) < 0.001);
});

test('normalizes OHLCV rows without making performance claims', () => {
  const [candle] = normalizeCandleRows({ data: [['1791462000000', '99', '101', '98', '100', '12', '1200']] });
  assert.equal(candle.close, 100);
  assert.equal(candle.volume, 12);
});
