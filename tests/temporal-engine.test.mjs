import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleEvidence, visibleCandles, researchGate, parseKnownTimestamp } from '../src/temporal-engine.mjs';
import { auditCandles, buildEvidence, buildRulesBaseline, validateModelCitations } from '../src/research-engine.mjs';

const decisionAt = '2026-08-26T21:30:00.000Z';
const prior = '2026-08-26T20:21:19.000Z';
const later = '2026-08-26T22:00:00.000Z';
const hour = 3600000;
const candle = (iso, close = '100') => [String(Date.parse(iso)), '100', '101', '99', close, '3', '300'];

test('accepts exact timestamp only; date alone fails closed', () => {
  assert.throws(() => parseKnownTimestamp('2026-08-26'), /exact UTC/);
  assert.throws(() => parseKnownTimestamp('2026-08-26T20:21:19-04:00'), /exact UTC/);
  assert.equal(parseKnownTimestamp(prior), Date.parse(prior));
});
test('future documents are invisible to replay', () => {
  const docs = [{ id: 'filing', publishedAt: prior }, { id: 'transcript', publishedAt: later }];
  assert.deepEqual(visibleEvidence(docs, decisionAt).map((d) => d.id), ['filing']);
});
test('late observation prevents backdated information leakage', () => {
  const docs = [{ id: 'late-ingest', publishedAt: prior, firstObservedAt: later }];
  assert.deepEqual(visibleEvidence(docs, decisionAt), []);
});
test('date-only news reports are excluded rather than assigned invented times', () => {
  assert.deepEqual(visibleEvidence([{ id: 'date-only', publishedAt: '2026-08-26' }], decisionAt), []);
});
test('excludes current unfinished candle and future candle', () => {
  const candles = [candle('2026-08-26T20:00:00.000Z'), candle('2026-08-26T21:00:00.000Z'), candle('2026-08-26T22:00:00.000Z')];
  assert.deepEqual(visibleCandles(candles, decisionAt, hour).map((c) => c[0]), [String(Date.parse('2026-08-26T20:00:00.000Z'))]);
});
test('ABSTAIN when evidence is missing even with prices', () => {
  const result = researchGate({ asOf: decisionAt, evidence: [{ publishedAt: later }], candles: [candle('2026-08-26T20:00:00.000Z')] });
  assert.equal(result.decision, 'ABSTAIN');
});
test('ABSTAIN when no completed candle exists even with evidence', () => {
  const result = researchGate({ asOf: decisionAt, evidence: [{ publishedAt: prior }], candles: [candle('2026-08-26T21:00:00.000Z')] });
  assert.equal(result.decision, 'ABSTAIN');
});
test('valid inputs produce RESEARCH_READY, not a fabricated buy or sell', () => {
  const result = researchGate({ asOf: decisionAt, evidence: [{ id: 'a', publishedAt: prior }], candles: [candle('2026-08-26T20:00:00.000Z', '102.20')] });
  assert.equal(result.decision, 'RESEARCH_READY');
  assert.equal(result.lastPrice, 102.2);
  assert.equal(result.cited.length, 1);
});
test('malformed candle and publication timestamps fail closed', () => {
  assert.deepEqual(visibleCandles([['bad', 100, 101, 99, 100, 0, 0]], decisionAt), []);
  assert.deepEqual(visibleEvidence([{ id: 1, publishedAt: 'not a time' }], decisionAt), []);
});

test('audits missing candle intervals and excludes the unfinished candle', () => {
  const asOf = '2026-08-26T22:21:19.000Z';
  const candles = [
    [Date.parse('2026-08-26T19:00:00.000Z'), '10', '11', '9', '10.5', '1'],
    [Date.parse('2026-08-26T21:00:00.000Z'), '11', '12', '10', '11.5', '1'],
    [Date.parse('2026-08-26T22:00:00.000Z'), '11.5', '13', '11', '12', '1'],
  ];
  const audit = auditCandles(candles, asOf, 3600000);
  assert.equal(audit.visibleCount, 2);
  assert.equal(audit.gaps.length, 1);
  assert.equal(audit.latestVisible[0], Date.parse('2026-08-26T21:00:00.000Z'));
});

test('date-only issuer evidence is excluded while the exact SEC anchor remains usable', () => {
  const caseData = { ticker: 'AAPL', company: 'Apple', secAcceptedAt: '2026-07-30T20:30:28.000Z', source: 'https://sec.example/index', sourceDocument: 'https://sec.example/doc' };
  const release = { issuerReleaseUrl: 'https://apple.example/release', publisher: 'Apple', publicDate: '2026-07-30', firstPublicAt: null, precision: 'date-only', evidenceNote: 'clock time unavailable', facts: [] };
  const result = buildEvidence(caseData, release, '2026-10-08T00:00:00.000Z', caseData.secAcceptedAt);
  assert.deepEqual(result.visible.map((item) => item.id), ['E2-AAPL']);
  assert.equal(result.excluded[0].precision, 'date-only');
});

test('rules baseline abstains when evidence is thin and reaction candles stay separate', () => {
  const baseline = buildRulesBaseline({ evidence: { visible: [] }, candles: { visible: [], visibleCount: 0 }, reactionCandles: [[1, 1, 1, 1, 1]], asOf: '2026-08-26T20:21:19.000Z', intervalMs: 3600000 });
  assert.equal(baseline.decision, 'ABSTAIN');
  assert.equal(baseline.reactionWindowSeparated, true);
  assert.match(baseline.reasons.join(' '), /exact-timestamp evidence/);
});

test('model output citing a nonexistent or future evidence ID is rejected', () => {
  const result = validateModelCitations('Observation [E2-NVDA]. Future claim [E9-NVDA].', ['E2-NVDA']);
  assert.equal(result.valid, false);
  assert.deepEqual(result.invalid, ['E9-NVDA']);
});
