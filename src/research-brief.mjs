/**
 * Human-actionable research brief. Every statement is grounded in either
 * a visible publication anchor or completed pre-cutoff Bitget candles.
 * This does not attempt to reconstruct historical analyst consensus.
 */
export function buildResearchBrief({ caseData, evidence, dossier, sourceChecks = {} }) {
  const visible = evidence?.visible ?? [];
  const issuer = visible.find((item) => item.id === 'E1-' + caseData.ticker);
  const secExhibit = visible.find((item) => item.id === 'E3-' + caseData.ticker);
  const financialSource = secExhibit ?? issuer;
  const sec = visible.find((item) => item.id === 'E2-' + caseData.ticker);
  const m = dossier?.metrics ?? {};
  const verified = [];
  const limitations = [];
  const actions = [];
  const percent = (value) => Number.isFinite(value) ? (value > 0 ? '+' : '') + value.toFixed(3) + '%' : 'unavailable';
  if (sec) verified.push({
    label: 'SEC filing availability', citation: sec.id,
    detail: 'The documented SEC acceptance time is within the selected cutoff. This is NOT proof of first public earnings disclosure.',
    sourceURL: sec.sourceURL,
  });
  else limitations.push('The SEC filing was not available at this selected decision cutoff.');
  if (financialSource) {
    verified.push({
      label: secExhibit ? 'SEC-filed earnings results' : 'Issuer-reported financials',
      citation: financialSource.id,
      detail: secExhibit ?
        'Financial figures are quoted from the EX-99.1 exhibit attached to the accepted SEC 8-K. This is SEC filing availability, not proof of first public announcement or earnings surprise.' :
        'The issuer release is included using an approximate, time-qualified publisher announcement. These are issuer-reported facts, not an analyst-consensus comparison.',
      facts: financialSource.facts.map(({ label, value }) => ({ label, value })),
      sourceURL: financialSource.sourceURL,
    });
  } else {
    limitations.push('Earnings figures are not time-qualified at this cutoff. Date-only issuer pages cannot be assigned invented publication times.');
  }
  if ((m.completePreCandles ?? 0) >= 2 && Number.isFinite(m.priorDriftPct)) {
    verified.push({
      label: 'Bitget pre-decision rToken tape', citation: null,
      detail: caseData.symbol + ' recorded a ' + percent(m.priorDriftPct) + ' sampled move across ' +
        m.completePreCandles + ' completed one-hour candles. This is descriptive rToken pricing, not an execution-ready signal.',
      sourceURL: null,
    });
  } else limitations.push('Not enough completed pre-decision rToken candles to establish a sampled price change.');
  if (m.candleGapCount > 0) limitations.push('Bitget historical candle data has ' + m.candleGapCount + ' missing interval gap(s).');
  if (m.candleAgeMinutes == null || m.candleAgeMinutes > 120) limitations.push('The latest completed price candle may be too old for a timely assessment.');
  limitations.push('A timestamped, historical analyst-consensus snapshot is not available. Beat/miss and surprise percentages cannot be determined.');
  if (!sourceChecks?.issuer?.ok) limitations.push('The original issuer webpage could not be checked successfully during this live request; refer to its primary link.');
  if (!sourceChecks?.sec?.ok) limitations.push('The original SEC webpage could not be checked successfully during this live request; the recorded acceptance anchor remains a historical reconstruction.');
  if (secExhibit && !sourceChecks?.exhibit?.ok) limitations.push('The SEC earnings exhibit link is archival-source verified, but the SEC server did not return its contents to the live application during this request.');
  actions.push({
    label: 'Confirm first-public release time',
    detail: 'Compare issuer dissemination time, SEC acceptance, and credible archived timestamps before interpreting price movement as an earnings reaction.',
    status: issuer?.precision === 'second' ? 'RECHECK' : 'REQUIRED',
  });
  actions.push({
    label: 'Retrieve contemporaneous expectations',
    detail: 'Use a consensus snapshot saved before this event. Without it, do not call earnings a beat or miss.',
    status: 'REQUIRED',
  });
  actions.push({
    label: 'Check tradability at the decision time',
    detail: 'Verify contemporaneous spreads, order-book depth, trading session and fees. A current live quote does not establish historical execution costs.',
    status: 'REQUIRED',
  });
  actions.push({
    label: 'Human decision',
    detail: 'Investigate, wait or reject after reviewing the time-qualified evidence and the unresolved conditions. No orders are placed.',
    status: 'HUMAN ONLY',
  });
  return {
    version: 1, ticker: caseData.ticker, symbol: caseData.symbol, asOf: dossier.asOf,
    headline: secExhibit ? 'Earnings figures are now anchored to the SEC-filed release; the consensus gap and first-public timing remain open.' :
      issuer ? 'An issuer earnings document is time-qualified, but the expectation gap is not.' :
      sec ? 'SEC availability is verified; first public earnings evidence remains incomplete.' :
        'This selected time is earlier than the independently timed SEC filing.',
    verified, limitations, actions,
    afterCutoffOutcome: {
      valuePct: m.followOnMovePct ?? null,
      label: 'Hindsight only — excluded from this research brief and from the pre-decision AI packet',
    },
    caveat: 'Publication-anchor reconstruction; these records were retrieved later. Not investment advice or a claim of historical performance.',
  };
}
