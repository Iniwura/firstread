const { normalizeTickerPayload, normalizeCandleRows, spreadBps } = require('../lib/market');

const BITGET = 'https://api.bitget.com';

async function json(path) {
  const response = await fetch(new URL(path, BITGET));
  const body = await response.json();
  if (!response.ok || body.code !== '00000') {
    throw new Error(`Bitget request failed (${response.status}): ${body.msg || 'unknown error'}`);
  }
  return body;
}

module.exports = async function handler(req, res) {
  const symbol = String(req.query?.symbol || 'BTCUSDT').toUpperCase();
  if (!/^[A-Z0-9]{5,20}$/.test(symbol)) return res.status(400).json({ error: 'Invalid symbol' });
  try {
    const [tickerBody, candlesBody, orderbookBody, clockBody] = await Promise.all([
      json(`/api/v2/spot/market/tickers?symbol=${encodeURIComponent(symbol)}`),
      json(`/api/v3/market/candles?category=SPOT&symbol=${encodeURIComponent(symbol)}&interval=1m&limit=30`),
      json(`/api/v2/spot/market/orderbook?symbol=${encodeURIComponent(symbol)}&limit=5`),
      json('/api/v2/public/time'),
    ]);
    const ticker = normalizeTickerPayload(tickerBody);
    return res.status(200).json({
      source: 'Bitget public market API',
      capturedAt: new Date().toISOString(),
      exchangeTime: new Date(Number(clockBody.data.serverTime)).toISOString(),
      symbol,
      ticker: { ...ticker, spreadBps: spreadBps(ticker) },
      candles: normalizeCandleRows(candlesBody),
      orderBook: {
        bids: orderbookBody.data.bids || [],
        asks: orderbookBody.data.asks || [],
        timestamp: orderbookBody.data.ts ? new Date(Number(orderbookBody.data.ts)).toISOString() : null,
      },
    });
  } catch (error) {
    return res.status(502).json({ error: error.message, source: 'Bitget public market API' });
  }
};
