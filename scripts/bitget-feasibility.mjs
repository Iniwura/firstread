const base = 'https://api.bitget.com';

async function probe(name, path, validate) {
  const url = new URL(path, base);
  const response = await fetch(url);
  const body = await response.json();
  const ok = response.ok && body?.code === '00000' && (!validate || validate(body));
  let sample = body?.data;
  if (name === 'spot symbols' && Array.isArray(sample)) sample = { count: sample.length, btcusdt: sample.find(item => item.symbol === 'BTCUSDT') ?? null };
  else if (Array.isArray(sample)) sample = sample.slice(0, 2);
  return { name, ok, httpStatus: response.status, apiCode: body?.code ?? null, endpoint: url.toString(), sample };
}

const checks = await Promise.all([
  probe('server time', '/api/v2/public/time', data => Boolean(data?.data?.serverTime)),
  probe('spot ticker', '/api/v2/spot/market/tickers?symbol=BTCUSDT', data => data?.data?.[0]?.symbol === 'BTCUSDT'),
  probe('spot candles v2', '/api/v2/spot/market/candles?symbol=BTCUSDT&granularity=1min&limit=5', data => Array.isArray(data?.data) && data.data.length > 0),
  probe('spot candles v3', '/api/v3/market/candles?category=SPOT&symbol=BTCUSDT&interval=1m&limit=5', data => Array.isArray(data?.data) && data.data.length > 0),
  probe('usdt futures candles', '/api/v2/mix/market/candles?symbol=BTCUSDT&productType=USDT-FUTURES&granularity=1m&limit=5', data => Array.isArray(data?.data) && data.data.length > 0),
  probe('spot order book', '/api/v2/spot/market/orderbook?symbol=BTCUSDT&limit=5', data => data?.data?.asks?.length > 0 && data?.data?.bids?.length > 0),
  probe('spot symbols', '/api/v2/spot/public/symbols?coin=USDT', data => Array.isArray(data?.data) && data.data.some(item => item.symbol === 'BTCUSDT')),
]);
const result = { capturedAt: new Date().toISOString(), base, pass: checks.every(check => check.ok), checks };
console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
