import crypto from 'node:crypto';
import { parseKnownTimestamp, visibleCandles } from './temporal-engine.mjs';

export function sha256(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function evidenceAvailability(item, asOf) {
  if (!item.publishedAt) return { visible: false, reason: 'precision-sensitive replay requires an exact publication timestamp' };
  try {
    const cutoff = parseKnownTimestamp(asOf, 'asOf');
    const published = parseKnownTimestamp(item.publishedAt, 'publishedAt');
    const observed = item.firstObservedAt ? parseKnownTimestamp(item.firstObservedAt, 'firstObservedAt') : published;
    if (Math.max(published, observed) > cutoff) return { visible: false, reason: 'not yet available at asOf' };
    return { visible: true, reason: item.firstObservedAt ? 'publication and first observation verified' : 'publication-anchored reconstruction; historical first observation not recorded' };
  } catch (error) {
    return { visible: false, reason: error.message };
  }
}

export function buildEvidence(caseData, releaseData, retrievedAt, asOf) {
  const issuer = {
    id: `E1-${caseData.ticker}`,
    sourceURL: releaseData.issuerReleaseUrl,
    publisher: releaseData.publisher,
    companyTicker: caseData.ticker,
    documentID: `${caseData.ticker}-${releaseData.publicDate}-issuer-release`,
    publishedAt: releaseData.firstPublicAt,
    firstObservedAt: null,
    availabilityBasis: 'Issuer release time inferred from publisher scheduling; not a captured historical observation',
    retrievedAt,
    sections: ['earnings release'],
    facts: releaseData.facts,
    quoteLocations: releaseData.facts.map((fact) => ({ label: fact.label, quote: fact.quote, sourceURL: releaseData.issuerReleaseUrl })),
    precision: releaseData.precision,
    evidenceNote: releaseData.evidenceNote,
  };
  const sec = {
    id: `E2-${caseData.ticker}`,
    sourceURL: caseData.sourceDocument,
    publisher: 'U.S. Securities and Exchange Commission',
    companyTicker: caseData.ticker,
    documentID: caseData.sourceDocument.split('/').at(-1),
    publishedAt: caseData.secAcceptedAt,
    firstObservedAt: null,
    availabilityBasis: 'SEC acceptance time; not an archived first-observation timestamp',
    retrievedAt,
    sections: ['Form 8-K / exhibit'],
    facts: [{ label: 'Availability anchor', value: 'SEC filing accepted', quote: `SEC acceptance timestamp ${caseData.secAcceptedAt}` }],
    quoteLocations: [{ label: 'SEC acceptance', quote: caseData.secAcceptedAt, sourceURL: caseData.source }],
    precision: 'second',
    evidenceNote: caseData.timestampCaution,
  };
  const all = [issuer, sec].map((item) => ({ ...item, availability: evidenceAvailability(item, asOf) }));
  return { all, visible: all.filter((item) => item.availability.visible), excluded: all.filter((item) => !item.availability.visible) };
}

export function auditCandles(candles, asOf, durationMs) {
  const visible = visibleCandles(candles, asOf, durationMs);
  const ordered = [...candles].sort((a, b) => Number(a[0]) - Number(b[0]));
  const gaps = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const gap = Number(ordered[index][0]) - Number(ordered[index - 1][0]);
    if (gap > durationMs * 1.5) gaps.push({ from: new Date(Number(ordered[index - 1][0])).toISOString(), to: new Date(Number(ordered[index][0])).toISOString(), durationMs: gap });
  }
  const stale = ordered.filter((candle) => !Number.isFinite(Number(candle[4])) || Number(candle[4]) <= 0).length;
  return { visible, gaps, stale, inputCount: candles.length, visibleCount: visible.length, latestVisible: visible.at(-1) ?? null };
}

export function buildRulesBaseline({ evidence, candles, reactionCandles = [], asOf, intervalMs }) {
  const gate = { decision: 'ABSTAIN', reasons: [], cited: evidence.visible, market: candles.visible, lastPrice: null };
  if (!gate.cited.length) gate.reasons.push('No exact-timestamp evidence is available at this decision time');
  if (!gate.market.length) gate.reasons.push('No completed rToken candle is available at this decision time');
  if (gate.cited.length && gate.market.length) {
    gate.decision = 'RESEARCH_READY';
    gate.lastPrice = Number(gate.market.at(-1)[4]);
    gate.reasons.push('Rules-only baseline is descriptive; a human must decide whether to investigate, wait, or reject');
  }
  const first = gate.market[0];
  const last = gate.market.at(-1);
  const move = first && last ? ((Number(last[4]) / Number(first[1])) - 1) * 100 : null;
  return {
    ...gate,
    asOf,
    intervalMs,
    visibleEvidenceCount: evidence.visible.length,
    completedCandleCount: candles.visibleCount,
    preWindowMovePct: Number.isFinite(move) ? Number(move.toFixed(3)) : null,
    reactionWindowCandleCount: reactionCandles.length,
    reactionWindowSeparated: true,
    validation: 'No trade recommendation, simulated return, fill, or causal claim is produced by this baseline.',
  };
}

export function validateModelCitations(text, visibleIds = []) {
  const citations = [...String(text ?? '').matchAll(/\[(E\d+-[A-Z]+)\]/g)].map((match) => match[1]);
  const invalid = citations.filter((id) => !visibleIds.includes(id));
  if (invalid.length) return { valid: false, citations, invalid, reason: 'Model cited evidence that was not visible at the selected asOf timestamp' };
  return { valid: true, citations, invalid: [], reason: citations.length ? 'All cited evidence IDs are visible' : 'No evidence citations supplied' };
}

export function buildAiPacket({ caseData, asOf, evidence, market, baseline }) {
  return {
    thesis: 'Keep the decision attached to what was knowable at the selected time; separate the rToken market response from the underlying US-stock evidence, and abstain when provenance is thin.',
    company: caseData.company,
    ticker: caseData.ticker,
    asOf,
    evidence: evidence.visible.map(({ id, sourceURL, publisher, publishedAt, firstObservedAt, availabilityBasis, facts, quoteLocations }) => ({ id, sourceURL, publisher, publishedAt, firstObservedAt, availabilityBasis, facts, quoteLocations })),
    completedCandles: market.visible.slice(-24).map((row) => ({ timestamp: new Date(Number(row[0])).toISOString(), open: row[1], high: row[2], low: row[3], close: row[4], volume: row[5] })),
    rulesBaseline: { decision: baseline.decision, reasons: baseline.reasons, preWindowMovePct: baseline.preWindowMovePct },
    forbidden: ['future evidence', 'reactionWindow candles', 'unsupported forecasts', 'profitability claims', 'automatic buy/sell instructions'],
  };
}
