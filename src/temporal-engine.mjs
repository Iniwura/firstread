/**
 * FIRSTREAD point-in-time gate.
 * No live-price predictions. Do not infer publication timestamps from dates.
 * Only completed candles and evidence proven available by the cutoff can enter a replay.
 */
export const HOUR_MS = 60 * 60 * 1000;

export function parseKnownTimestamp(input, field = 'timestamp') {
  if (typeof input !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(input)) {
    throw new Error(`${field} requires an exact UTC ISO-8601 timestamp; dates without times are not accepted`);
  }
  const millis = Date.parse(input);
  if (!Number.isFinite(millis)) throw new Error(`${field} is invalid`);
  return millis;
}

export function visibleEvidence(evidence, asOf) {
  const cutoff = parseKnownTimestamp(asOf, 'asOf');
  return evidence.filter((item) => {
    try {
      const published = parseKnownTimestamp(item.publishedAt, 'publishedAt');
      const firstObserved = item.firstObservedAt ? parseKnownTimestamp(item.firstObservedAt, 'firstObservedAt') : published;
      // An item may be published before observation. Do not backdate its availability.
      return Math.max(published, firstObserved) <= cutoff;
    } catch {
      return false;
    }
  });
}

export function visibleCandles(candles, asOf, durationMs = HOUR_MS) {
  const cutoff = parseKnownTimestamp(asOf, 'asOf');
  if (!Number.isInteger(durationMs) || durationMs <= 0) throw new Error('durationMs must be positive');
  return candles.filter((candle) => {
    const start = Number(candle[0]);
    const close = Number(candle[4]);
    return Number.isSafeInteger(start) && Number.isFinite(close) && close > 0 && start + durationMs <= cutoff;
  }).sort((a, b) => Number(a[0]) - Number(b[0]));
}

export function researchGate({ evidence = [], candles = [], asOf, intervalMs = HOUR_MS }) {
  const cited = visibleEvidence(evidence, asOf);
  const market = visibleCandles(candles, asOf, intervalMs);
  const reasons = [];
  if (cited.length === 0) reasons.push('No time-verified evidence available at this decision timestamp');
  if (market.length === 0) reasons.push('No completed market candle available at this decision timestamp');
  if (reasons.length) return { decision: 'ABSTAIN', reasons, cited, market, lastPrice: null };
  return {
    decision: 'RESEARCH_READY',
    reasons: ['Human confirmation required; this is not an automatic trading recommendation'],
    cited,
    market,
    lastPrice: Number(market.at(-1)[4]),
  };
}
