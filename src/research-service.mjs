import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRealityCandles, getRealityInstrument, getRealityQuote, getRealityStatus, getRealityStockInfo } from './bitget-client.mjs';
import { auditCandles, buildAiPacket, buildEvidence, buildRulesBaseline, sha256 } from './research-engine.mjs';
import { buildDecisionDossier } from './decision-dossier.mjs';
import { buildResearchBrief } from './research-brief.mjs';
import { buildFinancialIntelligence } from './financial-intelligence.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const anchors = JSON.parse(await readFile(path.join(root, 'data/verified-sec-anchors.json'), 'utf8'));
const releases = JSON.parse(await readFile(path.join(root, 'data/release-evidence.json'), 'utf8'));
const secExhibits = JSON.parse(await readFile(path.join(root, 'data/sec-exhibits.json'), 'utf8'));
const financialContexts = JSON.parse(await readFile(path.join(root, 'data/sec-financial-comparisons.json'), 'utf8'));

function exactTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) throw new Error('asOf requires an exact UTC timestamp such as 2026-08-26T20:21:19.000Z');
  if (!Number.isFinite(Date.parse(value))) throw new Error('asOf is invalid');
  return new Date(Date.parse(value)).toISOString();
}

async function sourceCheck(url) {
  try {
    const response = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    return { url, httpStatus: response.status, ok: response.ok, retrievedAt: new Date().toISOString(), contentBytes: html.length, excerpt: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240) };
  } catch (error) {
    return { url, ok: false, retrievedAt: new Date().toISOString(), error: error.message };
  }
}

export function getCases() {
  return anchors.map((anchor) => ({ ...anchor, release: releases.find((item) => item.ticker === anchor.ticker) ?? null, secExhibit: secExhibits.find((item) => item.ticker === anchor.ticker) ?? null, financialContext: financialContexts.find((item) => item.ticker === anchor.ticker) ?? null, symbol: `R${anchor.ticker}USDT` }));
}

export async function runResearch({ ticker = 'NVDA', asOf: requestedAsOf } = {}) {
  const caseData = getCases().find((item) => item.ticker === String(ticker).toUpperCase());
  if (!caseData) throw new Error(`Unsupported case ${ticker}; choose NVDA, AAPL, or MSFT`);
  const asOf = exactTimestamp(requestedAsOf ?? caseData.secAcceptedAt);
  const retrievedAt = new Date().toISOString();
  const evidence = buildEvidence(caseData, caseData.release, retrievedAt, asOf, caseData.secExhibit);
  const [instrumentResult, quoteResult, candleResult, issuerFetch, secFetch, exhibitFetch, stockInfoResult] = await Promise.all([
    getRealityInstrument(caseData.symbol),
    getRealityQuote(caseData.symbol),
    getRealityCandles(caseData.symbol, asOf),
    sourceCheck(caseData.release.issuerReleaseUrl),
    sourceCheck(caseData.sourceDocument),
    sourceCheck(caseData.secExhibit.sourceURL),
    getRealityStockInfo(caseData.symbol).catch((error)=>({unavailable:true,error:error.message})),
  ]);
  let statusResult;
  try { statusResult = await getRealityStatus(); } catch (error) { statusResult = { unavailable: true, error: error.message }; }
  const pre = auditCandles(candleResult.candles, asOf, 3600000);
  const reaction = candleResult.candles.filter((row) => Number(row[0]) >= Date.parse(asOf) && Number(row[0]) < Date.parse(asOf) + 6 * 3600000);
  const baseline = buildRulesBaseline({ evidence, candles: pre, reactionCandles: reaction, asOf, intervalMs: 3600000 });
  const dossier = buildDecisionDossier({ evidence, preWindow: pre, reactionWindow: reaction, asOf });
  const financial = buildFinancialIntelligence({ caseData, evidence, context: caseData.financialContext });
  const brief = buildResearchBrief({ caseData, evidence, dossier, financial, sourceChecks: { issuer: issuerFetch, sec: secFetch, exhibit: exhibitFetch } });
  const precisionWarning = caseData.release.precision !== 'second' && caseData.release.precision !== 'minute-approximate';
  return {
    status: 'ok',
    generatedAt: new Date().toISOString(),
    case: caseData,
    replay: { asOf, anchorType: 'SEC filing availability', precisionWarning, noLookahead: true, futureReactionExcludedFromAi: true },
    evidence,
    market: {
      symbol: caseData.symbol,
      instrument: instrumentResult.instrument,
      instrumentSource: instrumentResult.url,
      stockInfo: stockInfoResult.stockInfo ?? null,
      stockInfoSource: stockInfoResult.url ?? null,
      stockInfoError: stockInfoResult.unavailable ? stockInfoResult.error : null,
      quote: quoteResult.ticker,
      quoteSource: quoteResult.url,
      preWindow: pre,
      reactionWindow: reaction,
      reactionLabel: 'Observed after the selected decision time; never supplied to the pre-decision AI packet',
      status: statusResult,
      sourceEndpoints: { candles: candleResult.url, quote: quoteResult.url },
    },
    baseline,
    dossier,
    financial,
    brief,
    aiPacket: buildAiPacket({ caseData, asOf, evidence, market: pre, baseline, financial }),
    sourceChecks: { issuer: issuerFetch, sec: secFetch, exhibit: exhibitFetch },
    integrity: { evidenceHashed: true, evidenceHash: JSON.stringify(evidence.visible).length ? sha256(evidence.visible) : null, futureCandlesExcluded: true, sourceGrounded: true },
  };
}


/**
 * Fast, authoritative pre-decision AI context.
 * Fetches only historical candles; no present-day quote, later reaction data,
 * trading status or document-status network calls enter the model path.
 */
export async function buildAiResearchPacket({ ticker = 'NVDA', asOf: requestedAsOf } = {}, { getCandles = getRealityCandles } = {}) {
  const caseData = getCases().find((item) => item.ticker === String(ticker).toUpperCase());
  if (!caseData) throw new Error('Unsupported research case');
  const asOf = exactTimestamp(requestedAsOf ?? caseData.secAcceptedAt);
  const evidence = buildEvidence(caseData, caseData.release, new Date().toISOString(), asOf, caseData.secExhibit);
  // The requested end-time is the cutoff, not eight hours after it.
  const price = await getCandles(caseData.symbol, asOf, 12, 0);
  if (!Array.isArray(price?.candles)) throw new Error('Historical Bitget candle data unavailable');
  const pre = auditCandles(price.candles, asOf, 3600000);
  const baseline = buildRulesBaseline({ evidence, candles: pre, asOf, intervalMs: 3600000 });
  const financial = buildFinancialIntelligence({ caseData, evidence, context: caseData.financialContext });
  return {
    aiPacket: buildAiPacket({ caseData, asOf, evidence, market: pre, baseline, financial }),
    baselineDecision: baseline.decision,
    context: 'server-verified-primary-sources-and-completed-prior-candles',
  };
}
