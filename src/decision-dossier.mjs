/**
 * Deterministic rToken event dossier. No simulated fills, price targets,
 * analyst consensus or profit claims. Labels keep future observations
 * separate from the selected historical information set.
 */
function pct(start, end) {
  if (!Number.isFinite(start) || start <= 0 || !Number.isFinite(end) || end <= 0) return null;
  return Number((((end / start) - 1) * 100).toFixed(3));
}
function number(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
const display = (n) => n == null ? 'unavailable' : ((n > 0 ? '+' : '') + n.toFixed(3) + '%');

export function buildDecisionDossier({ evidence, preWindow, reactionWindow = [], asOf, intervalMs = 3600000 }) {
  const cutoff = Date.parse(asOf);
  if (!Number.isFinite(cutoff)) throw new Error('asOf must be an exact timestamp');
  const pre = [...(preWindow?.visible ?? [])].sort((a, b) => Number(a[0]) - Number(b[0]));
  const safePre = pre.filter((row) =>
    Number.isFinite(Number(row[0])) && Number(row[0]) + intervalMs <= cutoff &&
    number(row[1]) !== null && number(row[2]) !== null &&
    number(row[3]) !== null && number(row[4]) !== null
  );
  const first = safePre[0], last = safePre.at(-1);
  const priorDriftPct = first && last ? pct(number(first[1]), number(last[4])) : null;
  const high = safePre.length ? Math.max(...safePre.map((row) => Number(row[2]))) : null;
  const low = safePre.length ? Math.min(...safePre.map((row) => Number(row[3]))) : null;
  const observedRangePct = high && low ? pct(low, high) : null;
  const lastCompletedAt = last ? Number(last[0]) + intervalMs : null;
  const candleAgeMinutes = lastCompletedAt !== null ? Math.max(0, Math.round((cutoff - lastCompletedAt) / 60000)) : null;

  // The following rows are outcomes, never usable as evidence for a decision at asOf.
  const future = [...reactionWindow].filter((row) =>
    Number(row[0]) >= cutoff && Number(row[0]) < cutoff + 6 * intervalMs &&
    Number.isFinite(Number(row[0])) && number(row[1]) !== null && number(row[4]) !== null
  ).sort((a, b) => Number(a[0]) - Number(b[0]));
  const followOnMovePct = future.length >= 2 ?
    pct(number(future[0][1]), number(future.at(-1)[4])) : null;
  const gapCount = preWindow?.gaps?.length ?? 0;
  const secAnchored = (evidence?.visible ?? []).some((item) => item.publisher === 'U.S. Securities and Exchange Commission');
  const issuer = (evidence?.all ?? []).find((item) => item.id?.startsWith('E1-'));
  const issuerClockVerified = issuer?.availability?.visible === true && issuer.precision === 'second';

  const checks = [
    {
      title: 'Information timing', category: secAnchored ? 'SEC-ANCHORED' : 'INSUFFICIENT',
      detail: secAnchored ? 'A dated SEC filing is visible. This does not prove the earnings figures were first released then.' :
        'No SEC filing was verifiably available at the selected time.',
      phase: 'before', block: !secAnchored,
    },
    {
      title: 'Issuer release precision', category: issuerClockVerified ? 'VERIFIED' : 'CAUTION',
      detail: issuerClockVerified ? 'Issuer publication has a second-level availability timestamp.' :
        'Exact first-public issuer timing is unproven; avoid conclusions about the first earnings reaction.',
      phase: 'before', block: false,
    },
    {
      title: 'Pre-decision price behavior', category: safePre.length >= 2 ? 'OBSERVED' : 'INSUFFICIENT',
      detail: safePre.length >= 2 ? 'rToken sampled pre-cutoff drift: ' + display(priorDriftPct) +
        '; observed low-to-high range: ' + display(observedRangePct) + '. These are market observations, not signals.' :
        'Fewer than two complete pre-decision candles; movement comparison unavailable.',
      phase: 'before', block: safePre.length < 2,
    },
    {
      title: 'Data completeness', category: gapCount || candleAgeMinutes == null || candleAgeMinutes > 120 ? 'CAUTION' : 'CHECKED',
      detail: gapCount + ' reported candle gap(s); latest completed candle was ' +
        (candleAgeMinutes == null ? 'unavailable' : candleAgeMinutes + ' minutes') +
        ' before the cutoff. Missing bars should not be treated as zero volatility.',
      phase: 'before', block: Boolean(gapCount) || candleAgeMinutes == null || candleAgeMinutes > 120,
    },
    {
      title: 'Expectation gap', category: 'NOT VERIFIED',
      detail: 'A contemporaneous analyst-consensus snapshot is missing. FIRSTREAD cannot label an earnings beat or miss versus expectations.',
      phase: 'before', block: true,
    },
    {
      title: 'Later rToken observations', category: followOnMovePct == null ? 'INSUFFICIENT' : 'OUTCOME ONLY',
      detail: followOnMovePct == null ?
        'Insufficient separate post-cutoff candles for a descriptive follow-on move.' :
        'Subsequent rToken sampled move: ' + display(followOnMovePct) +
        '. Shown only in hindsight; excluded from model and pre-decision analysis.',
      phase: 'after', block: false,
    },
  ];
  const blocking = checks.filter((item) => item.phase === 'before' && item.block);
  return {
    version: 1, asOf,
    metrics: { priorDriftPct, observedRangePct, candleAgeMinutes, candleGapCount: gapCount,
      completePreCandles: safePre.length, followOnMovePct, postCutoffCandles: future.length },
    checks,
    researchPosture: blocking.length ? 'CAUTION' : 'RESEARCH READY',
    blockingTopics: blocking.map((item) => item.title),
    guidance: 'A descriptive evidence-quality assessment only. Not a trade recommendation or a profitability estimate.',
  };
}
