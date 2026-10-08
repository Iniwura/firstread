function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTickerPayload(payload) {
  const item = Array.isArray(payload?.data) ? payload.data[0] : null;
  if (!item || !item.symbol) throw new Error('Bitget ticker payload is missing its symbol');
  return {
    symbol: item.symbol,
    last: asNumber(item.lastPr ?? item.lastPrice),
    open24h: asNumber(item.open ?? item.openPrice24h),
    high24h: asNumber(item.high24h ?? item.highPrice24h),
    low24h: asNumber(item.low24h ?? item.lowPrice24h),
    change24h: asNumber(item.change24h ?? item.price24hPcnt),
    bid: asNumber(item.bidPr ?? item.bid1Price),
    ask: asNumber(item.askPr ?? item.ask1Price),
    timestamp: item.ts ? new Date(Number(item.ts)).toISOString() : null,
  };
}

function normalizeCandleRows(payload) {
  if (!Array.isArray(payload?.data)) throw new Error('Bitget candle payload is missing data');
  return payload.data
    .map(row => ({
      timestamp: new Date(Number(row[0])).toISOString(),
      open: asNumber(row[1]),
      high: asNumber(row[2]),
      low: asNumber(row[3]),
      close: asNumber(row[4]),
      volume: asNumber(row[5]),
      turnover: asNumber(row[6]),
    }))
    .filter(row => row.timestamp !== 'Invalid Date' && row.close !== null);
}

function spreadBps(ticker) {
  if (ticker.bid === null || ticker.ask === null || ticker.last === null || ticker.last === 0) return null;
  return ((ticker.ask - ticker.bid) / ticker.last) * 10000;
}

module.exports = { normalizeTickerPayload, normalizeCandleRows, spreadBps };
