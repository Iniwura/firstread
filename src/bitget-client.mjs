const BASE_URL = 'https://api.bitget.com';

async function fetchJson(path, params = {}) {
  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' }, signal: controller.signal });
      const body = await response.json();
      if (response.status === 429 && attempt < 2) { await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1))); continue; }
      if (!response.ok) throw new Error(`Bitget HTTP ${response.status}`);
      if (body.code !== '00000') throw new Error(`Bitget ${body.code}: ${body.msg ?? 'unknown error'}`);
      return { url: url.toString(), requestTime: body.requestTime, data: body.data };
    } finally { clearTimeout(timer); }
  }
  throw new Error('Bitget request exhausted retries');
}

export async function getRealityInstrument(symbol) {
  const result = await fetchJson('/api/v3/market/instruments', { category: 'SPOT', symbol });
  return { ...result, instrument: result.data?.[0] ?? null };
}

export async function getRealityQuote(symbol) {
  const result = await fetchJson('/api/v3/market/tickers', { category: 'SPOT', symbol });
  const raw = result.data?.[0] ?? null;
  return { ...result, ticker: raw ? { ...raw, lastPr: raw.lastPr ?? raw.lastPrice, bidPr: raw.bidPr ?? raw.bid1Price, askPr: raw.askPr ?? raw.ask1Price } : null };
}

export async function getRealityCandles(symbol, asOf, hoursBefore = 12, hoursAfter = 8) {
  const cutoff = Date.parse(asOf);
  const result = await fetchJson('/api/v3/market/history-candles', {
    category: 'SPOT', symbol, interval: '1H', startTime: cutoff - hoursBefore * 3600000, endTime: cutoff + hoursAfter * 3600000, limit: 100,
  });
  return { ...result, candles: result.data ?? [] };
}

export async function getRealityStockInfo(symbol) {
  const result = await fetchJson('/api/v3/reality/market/stock-info', { symbol });
  const raw = Array.isArray(result.data) ? result.data.find((item) =>
    String(item.symbol).toUpperCase() === String(symbol).toUpperCase()) : null;
  if (!raw) throw new Error('Reality stock-info did not contain the requested symbol');
  return {
    url:result.url, requestTime:result.requestTime,
    stockInfo:{
      symbol:raw.symbol,code:raw.code,
      tradingPeriod:Array.isArray(raw.tradingPeriod) ? raw.tradingPeriod.filter((v)=>typeof v==='string') : [],
      weekendTradable:raw.weekendTradable === 'yes',
    }
  };
}

export async function getRealityStatus() {
  const states = await fetchJson('/api/v3/reality/market/states');
  await new Promise((resolve) => setTimeout(resolve, 1100));
  const calendar = await fetchJson('/api/v3/reality/market/calendar');
  return { states, calendar };
}
