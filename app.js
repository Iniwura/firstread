const state = { cases: [], selected: null, research: null, posture: null, aiConfigured: null, requestId: 0, crosscheckId: 0 };
const $ = (selector) => document.querySelector(selector);

function fmt(value, options = {}) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: options.decimals ?? 2, minimumFractionDigits: options.minimum ?? 0 }).format(Number(value));
}

function formatUTC(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) + ' UTC';
}

function toInputValue(iso) { return iso ? iso.replace('Z', '').slice(0, 19) : ''; }
function fromInputValue(value) { return value ? new Date(`${value}Z`).toISOString() : ''; }
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function getJSON(url, options) {
  const response = await fetch(url, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

function renderCases() {
  const list = $('#case-list');
  list.replaceChildren();
  for (const item of state.cases) {
    const button = document.createElement('button');
    button.className = `case-button${state.selected?.ticker === item.ticker ? ' active' : ''}`;
    button.dataset.ticker = item.ticker;
    button.innerHTML = `<span class="ticker-chip">r${item.ticker}</span><span><strong>${item.ticker}</strong><small>${item.company}<br />${item.event}</small><span class="case-state">SEC anchor verified</span></span>`;
    button.addEventListener('click', () => selectCase(item.ticker));
    list.append(button);
  }
}

function selectCase(ticker) {
  state.selected = state.cases.find((item) => item.ticker === ticker) || state.cases[0];
  state.posture = null;
  state.crosscheckId++;
  $('#crosscheck-status').textContent = 'Independent source check not yet requested.';
  $('#crosscheck-output').replaceChildren();
  $('#run-crosscheck').disabled = true;
  $('#selected-case').textContent = `${state.selected.ticker} · ${state.selected.company}`;
  $('#selected-event').textContent = state.selected.event;
  $('#as-of-input').value = toInputValue(state.selected.secAcceptedAt);
  document.querySelectorAll('[data-replay-offset]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.replayOffset === '0')));
  $('#replay-status').textContent = 'Ready';
  $('#replay-note').textContent = `Default anchor · ${formatUTC(state.selected.secAcceptedAt)}`;
  renderCases();
  runDesk();
}

function renderEvidence(data) {
  const timeline = $('#evidence-timeline');
  timeline.replaceChildren();
  $('#evidence-count').textContent = `${data.evidence.visible.length} visible · ${data.evidence.excluded.length} held out`;
  for (const item of data.evidence.all) {
    const row = document.createElement('div');
    row.className = `evidence-item${item.availability.visible ? '' : ' excluded'}`;
    const facts = (item.facts || []).map((fact) => `<span class="fact"><b>${fact.label}</b> ${fact.value}</span>`).join('');
    const timestamp = item.publishedAt ? formatUTC(item.publishedAt) : `${item.precision} timestamp unavailable`;
    const status = item.availability.visible ? 'visible at decision time' : item.availability.reason;
    row.innerHTML = `<div class="evidence-rail"></div><div><h3>${item.publisher} · ${item.id}</h3><div class="evidence-meta"><span class="${item.availability.visible ? 'visible' : 'excluded'}">${status}</span><span>${timestamp}</span><a href="${item.sourceURL}" target="_blank" rel="noreferrer">Open source ↗</a></div><p class="evidence-copy">${item.evidenceNote || 'Primary source evidence.'}</p><div class="fact-row">${facts}</div></div>`;
    timeline.append(row);
  }
  const warning = data.replay.precisionWarning ? `${data.case.company}'s issuer evidence is date-only: no reliable public clock time was available. FIRSTREAD uses SEC filing availability for this replay and makes no initial-response claim.` : 'Issuer timing is independently anchored to an official schedule, but the timestamp remains approximate. SEC acceptance is retained as the conservative replay anchor.';
  $('#precision-caveat').textContent = warning;
}

function renderBaseline(data) {
  const baseline = data.baseline;
  const pill = $('#baseline-decision');
  pill.textContent = baseline.decision;
  pill.className = `decision-pill${baseline.decision === 'ABSTAIN' ? ' abstain' : ''}`;
  const lede = baseline.decision === 'ABSTAIN' ? 'The record is too thin for a confident posture.' : 'The record is research-ready, not trade-ready.';
  const stats = `<div class="baseline-stats"><div><strong>${baseline.visibleEvidenceCount}</strong><span>visible sources</span></div><div><strong>${baseline.completedCandleCount}</strong><span>completed candles</span></div><div><strong>${baseline.preWindowMovePct == null ? '—' : `${baseline.preWindowMovePct}%`}</strong><span>pre-window move</span></div></div>`;
  $('#baseline-body').innerHTML = `<p class="baseline-lede">${lede}</p><ul class="baseline-list">${baseline.reasons.map((reason) => `<li>${reason}</li>`).join('')}</ul>${stats}`;
}

function pointPath(rows, min, max, width, height, offsetX = 0, offsetCount = 1) {
  if (!rows.length) return '';
  return rows.map((row, index) => {
    const x = offsetX + (index / Math.max(1, offsetCount - 1)) * width;
    const value = Number(row[4]);
    const y = 18 + ((max - value) / Math.max(.0001, max - min)) * (height - 36);
    return `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function renderChart(data) {
  const pre = data.market.preWindow.visible;
  const reaction = data.market.reactionWindow;
  const all = [...pre, ...reaction];
  const values = all.flatMap((row) => [Number(row[2]), Number(row[3])]).filter((v) => Number.isFinite(v) && v > 0);
  const observedMin = values.length ? Math.min(...values) : 0;
  const observedMax = values.length ? Math.max(...values) : 1;
  const padding = Math.max((observedMax - observedMin) * .12, observedMax * .001);
  const min = Math.max(0, observedMin - padding); const max = observedMax + padding;
  const width = 1000; const height = 230; const preWidth = pre.length && all.length > 1 ? ((pre.length - 1) / (all.length - 1)) * width : width;
  $('#pre-line').setAttribute('d', pointPath(pre, min, max, preWidth, height, 0, pre.length));
  $('#pre-area').setAttribute('d', pre.length ? `${pointPath(pre, min, max, preWidth, height, 0, pre.length)} L${preWidth} ${height} L0 ${height} Z` : '');
  $('#reaction-line').setAttribute('d', pointPath(reaction, min, max, width - preWidth, height, preWidth, reaction.length));
  $('#decision-marker').setAttribute('x1', preWidth); $('#decision-marker').setAttribute('x2', preWidth);
  $('#chart-note').textContent = data.market.reactionLabel;
}

function renderMarket(data) {
  const market = data.market; const quote = market.quote || {};
  $('#market-symbol').textContent = `r${data.case.ticker}`;
  $('#market-price').textContent = quote.lastPr ? `${fmt(quote.lastPr, { decimals: 4 })} USDT` : '—';
  $('#market-source').textContent = `Live quote captured from Bitget · ${formatUTC(data.generatedAt)}`;
  $('#instrument-status').textContent = market.instrument?.status === 'online' ? 'Online' : '—';
  $('#candle-count').textContent = String(market.preWindow.visibleCount);
  $('#reaction-count').textContent = String(market.reactionWindow.length);
  $('#gap-count').textContent = String(market.preWindow.gaps.length);
  const statusText = market.status?.unavailable ? `Session state unavailable: ${market.status.error}` : `US sessions and calendar checked · ${market.status.states?.data?.market || 'US'} market`;
  $('#market-audit').textContent = `${statusText}. ${market.preWindow.gaps.length ? `${market.preWindow.gaps.length} candle gap(s) detected; inspect before inferring a move.` : 'No pre-decision interval gaps detected.'} Reaction candles are separated from the pre-decision information set.`;
  renderChart(data);
}

function renderBrief(data) {
  const brief = data.brief;
  if (!brief) {
    $('#brief-headline').textContent = 'Research brief unavailable for this response.';
    return;
  }
  $('#brief-headline').textContent = brief.headline;
  const verify = brief.verified.map((item) => {
    const link = item.sourceURL && /^https:\/\//i.test(item.sourceURL) ?
      '<a href="' + escapeHtml(item.sourceURL) + '" target="_blank" rel="noopener noreferrer">Primary source ↗</a>' : '';
    const facts = (item.facts ?? []).map((fact) =>
      '<span class="brief-fact">' + escapeHtml(fact.label) + ': ' + escapeHtml(fact.value) + '</span>').join('');
    return '<div class="brief-item"><strong>' + escapeHtml(item.label) +
      (item.citation ? ' · ' + escapeHtml(item.citation) : ' · Bitget candle data') +
      '</strong><p>' + escapeHtml(item.detail) + '</p>' + facts + link + '</div>';
  }).join('');
  $('#brief-verified').innerHTML = verify || '<p class="brief-empty">No source-qualified evidence at this decision time.</p>';
  $('#brief-limitations').innerHTML = brief.limitations.map((item) =>
    '<p class="brief-limitation">' + escapeHtml(item) + '</p>').join('');
  $('#brief-actions').innerHTML = brief.actions.map((item) =>
    '<div class="brief-item"><strong>' + escapeHtml(item.label) +
    '</strong><span class="brief-status">' + escapeHtml(item.status) +
    '</span><p>' + escapeHtml(item.detail) + '</p></div>').join('');
  $('#brief-disclaimer').textContent = brief.caveat;
}

function renderFinancial(data) {
  const financial = data.financial;
  $('#run-crosscheck').disabled = financial?.status !== 'AVAILABLE';
  if (!financial || financial.status !== 'AVAILABLE') {
    $('#financial-state').textContent = financial?.status === 'INVALID_PROVENANCE' ? 'Provenance rejected' : 'Held out at this time';
    $('#financial-note').textContent = 'The SEC earnings exhibit was not source-qualified by this cutoff. Historical comparison unavailable.';
    $('#financial-content').innerHTML = '<p class="empty-state">No time-qualified financial comparisons. Use “Filing available” to move to the actual SEC acceptance timestamp.</p>';
    $('#financial-drivers').replaceChildren();
    return;
  }
  $('#financial-state').textContent = financial.sourceId + ' · SEC filed';
  $('#financial-note').textContent = financial.period + ' · SEC Exhibit 99.1 · Calculated YoY, not consensus surprises.';
  const rows = financial.comparisons.map((x) =>
    '<tr><th scope="row">' + escapeHtml(x.label) + '</th><td>' + escapeHtml(x.priorLabel) +
    '</td><td>' + escapeHtml(x.currentLabel) + '</td><td class="' +
    (x.direction === 'DOWN' ? 'financial-down' : 'financial-up') + '">' +
    escapeHtml(x.changeLabel) + '</td></tr>').join('');
  $('#financial-content').innerHTML = '<div class="financial-scroll"><table class="financial-table"><thead><tr>' +
    '<th scope="col">Metric</th><th scope="col">Prior year</th><th scope="col">Filed quarter</th>' +
    '<th scope="col">Change</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<a class="financial-source" href="' + escapeHtml(financial.sourceURL) +
    '" target="_blank" rel="noopener noreferrer">Inspect underlying SEC filing and numbers ↗</a>';
  const groups = [
    ['Supported thesis', financial.drivers.filter((x) => x.kind === 'support')],
    ['Challenge the thesis', financial.drivers.filter((x) => x.kind === 'challenge')],
  ];
  $('#financial-drivers').innerHTML = groups.map(([title, items]) =>
    '<div class="financial-argument"><h3>' + escapeHtml(title) + '</h3>' +
    items.map((item) => '<strong>' + escapeHtml(item.label) + '</strong><p>' +
      escapeHtml(item.finding) + '</p><small>Filed source: ' + escapeHtml(item.sourceId) +
      '</small>').join('') + '</div>').join('');
  if (financial.signals?.length) {
    $('#financial-drivers').innerHTML += '<div class="financial-argument financial-watch"><h3>Quantitative stress check</h3>' +
      financial.signals.map((x) => '<strong>' + escapeHtml(x.label) +
      '</strong><p>' + escapeHtml(x.explanation) + '</p>').join('') + '</div>';
  }
}

function displayReconcileValue(value, unit) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return unit === 'usd_per_share'
    ? '$' + Number(value).toFixed(2) + '/share'
    : '$' + new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value)) + 'M';
}

async function runCrosscheck() {
  const current = state.research;
  if (!current || current.financial?.status !== 'AVAILABLE') return;
  const token=++state.crosscheckId;
  const ticker=current.case.ticker;
  const button=$('#run-crosscheck');
  button.disabled=true;
  $('#crosscheck-status').textContent = 'Fetching independent Bitget MCP income data…';
  $('#crosscheck-output').replaceChildren();
  try {
    const body=await getJSON('/api/crosscheck?ticker='+encodeURIComponent(ticker));
    if(token!==state.crosscheckId || ticker!==state.selected?.ticker)return;
    const note=body.sourceNote||'Current third-party data, not as-of evidence.';
    if(body.status==='UNAVAILABLE'||!Array.isArray(body.differences)||!body.differences.length) {
      $('#crosscheck-status').textContent = (body.status === 'INCOMPARABLE_PERIOD' ? 'Different reporting periods · ' : 'Unavailable · ') + (body.summary||'No validated comparison available.');
      $('#crosscheck-output').textContent = note;
      return;
    }
    $('#crosscheck-status').textContent = body.status==='DISCREPANCY' ?
      'DISCREPANCY · ' + body.summary : 'Compared · ' + body.summary;
    const lines=body.differences.map((item)=>
      '<tr><th scope="row">'+escapeHtml(item.label)+'</th>' +
      '<td>'+escapeHtml(displayReconcileValue(item.sec,item.unit))+'</td>' +
      '<td>'+escapeHtml(displayReconcileValue(item.mcp,item.unit))+'</td>' +
      '<td class="'+(item.verdict==='DISAGREES'?'financial-down':'')+'">'+
      escapeHtml(item.verdict)+'</td></tr>').join('');
    const period=body.matchedPeriod;
    const periodText=period ?
      ('SEC period end '+period.secQuarterEnded+' · Bitget period end '+period.mcpPeriodEnding+
       ' ('+(period.dayOffset===0?'same day':period.dayOffset+' day offset')+')') : 'Period match unavailable';
    $('#crosscheck-output').innerHTML = '<p class="reconcile-source">'+escapeHtml(periodText)+
      '</p><div class="financial-scroll"><table class="financial-table"><thead><tr>' +
      '<th>Filed line</th><th>SEC EX-99.1</th><th>Bitget MCP (now)</th><th>Check</th></tr></thead><tbody>'+
      lines+'</tbody></table></div><p class="reconcile-source">'+escapeHtml(note)+'</p>';
  } catch(error) {
    if(token===state.crosscheckId) {
      $('#crosscheck-status').textContent = 'Provider unavailable · SEC source is unchanged.';
      $('#crosscheck-output').textContent = 'Current source reconciliation could not complete. No agreement is implied.';
    }
  } finally {
    if(token===state.crosscheckId)button.disabled=false;
  }
}

function renderContradictions(data) {
  const checks = data.dossier?.checks ?? [];
  const observed = data.dossier?.metrics;
  if (!checks.length) {
    $('#contradictions').textContent = 'The decision dossier is not available.';
    return;
  }
  $('#contradictions').innerHTML = checks.map((check) => {
    const label = check.phase === 'after' ? ' · hindsight only' : '';
    return '<div class="bullet-item"><div><strong>' + escapeHtml(check.title) +
      ' · ' + escapeHtml(check.category) + label +
      '</strong><br />' + escapeHtml(check.detail) + '</div></div>';
  }).join('');
  $('#dossier-summary').textContent = data.dossier.researchPosture +
    ' · ' + (data.dossier.blockingTopics.length ?
      data.dossier.blockingTopics.length + ' unresolved checks' : 'all defined checks passed') +
    ' · ' + (observed?.completePreCandles ?? 0) + ' completed pre-decision candles';
}

async function runDesk() {
  if (!state.selected) return;
  const requestId = ++state.requestId;
  const ticker = state.selected.ticker;
  const asOf = fromInputValue($('#as-of-input').value);
  state.research = null;
  $('#run-button').disabled = true; $('#run-button').textContent = 'Reading…'; $('#replay-status').textContent = 'Fetching'; $('#replay-note').textContent = 'Holding future evidence out of the packet';
  try {
    const data = await getJSON(`/api/research?ticker=${ticker}&asOf=${encodeURIComponent(asOf)}`);
    if (requestId !== state.requestId || ticker !== state.selected?.ticker) return;
    state.research = data;
    renderEvidence(data); renderBaseline(data); renderMarket(data); renderBrief(data); renderFinancial(data); renderContradictions(data);
    $('#retrieval-clock').textContent = formatUTC(data.generatedAt);
    $('#ingestion-status').textContent = 'Live sources connected'; $('#replay-status').textContent = data.baseline.decision; $('#replay-note').textContent = `As of ${formatUTC(data.replay.asOf)}`;
    $('#evidence-hash').textContent = data.integrity.evidenceHash || '—';
    $('#source-status').textContent = `${data.sourceChecks.issuer.ok ? 'Issuer page fetched' : 'Issuer page access caveat'} · ${data.sourceChecks.sec.ok ? 'SEC filing fetched' : 'SEC source unavailable'}`;
    $('#receipt-json').textContent = JSON.stringify({ replay: data.replay, evidence: data.evidence, baseline: data.baseline, brief: data.brief, financial: data.financial, dossier: data.dossier, market: { symbol: data.market.symbol, sourceEndpoints: data.market.sourceEndpoints }, integrity: data.integrity }, null, 2);
    $('#ai-answer').textContent = state.aiConfigured === true ? 'Receipt ready. AI questions will be analyzed using a new server-verified evidence packet.' : state.aiConfigured === false ? 'Receipt ready. The live AI provider is not configured; all displayed checks are deterministic.' : 'Receipt ready. Checking AI provider availability.';
  } catch (error) {
    if (requestId !== state.requestId) return;
    $('#ingestion-status').textContent = 'Source error · no fabricated fallback'; $('#replay-status').textContent = 'ABSTAIN'; $('#replay-note').textContent = error.message; $('#ai-answer').innerHTML = `<span class="spark">!</span><span>${escapeHtml(error.message)}</span>`;
  } finally { if (requestId === state.requestId) { $('#run-button').disabled = false; $('#run-button').innerHTML = 'Run the desk <span>↗</span>'; } }
}

async function askAI(event) {
  event.preventDefault();
  if (!state.research) return;
  const answer = $('#ai-answer'); answer.innerHTML = '<span class="spark">✦</span><span>Checking the evidence packet…</span>';
  try {
    const data = await getJSON('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: $('#ai-question').value || 'What should a human investigate next?', ticker: state.research.case.ticker, asOf: state.research.replay.asOf }) });
    if (!data.configured) { answer.innerHTML = `<span class="spark">✦</span><span>${escapeHtml(data.message)}</span>`; return; }
    answer.innerHTML = `<span class="spark">✦</span><span>${escapeHtml(data.answer || data.message || data.error || 'AI abstained.').replace(/\n/g, '<br />')}</span>`;
  } catch (error) { answer.innerHTML = `<span class="spark">!</span><span>AI review unavailable: ${escapeHtml(error.message)}</span>`; }
}

document.querySelectorAll('[data-replay-offset]').forEach((button) => button.addEventListener('click', () => {
  if (!state.selected) return;
  const minutes = Number(button.dataset.replayOffset);
  if (![-15, 0, 120].includes(minutes)) return;
  const asOf = new Date(Date.parse(state.selected.secAcceptedAt) + minutes * 60000);
  $('#as-of-input').value = toInputValue(asOf.toISOString());
  document.querySelectorAll('[data-replay-offset]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  runDesk();
}));
$('#run-button').addEventListener('click', runDesk);
$('#refresh-button').addEventListener('click', runDesk);
$('#ai-form').addEventListener('submit', askAI);
$('#run-crosscheck').addEventListener('click', runCrosscheck);
document.querySelectorAll('[data-research-question]').forEach((button) => button.addEventListener('click', () => {
  $('#ai-question').value = button.dataset.researchQuestion;
  $('#ai-question').focus();
}));
$('#copy-receipt').addEventListener('click', async () => { if (state.research) { await navigator.clipboard?.writeText($('#receipt-json').textContent); $('#copy-receipt').textContent = 'Copied'; setTimeout(() => { $('#copy-receipt').textContent = 'Copy receipt'; }, 1500); } });
document.querySelectorAll('[data-posture]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-posture]').forEach((item) => item.classList.remove('selected')); button.classList.add('selected'); state.posture = button.dataset.posture; }));

try {
  const status = await getJSON('/api/ai');
  state.aiConfigured = Boolean(status.configured);
  $('#ai-provider-status').textContent = state.aiConfigured ? 'Live AI configured' : 'Rules only · AI needs key';
} catch {
  state.aiConfigured = false;
  $('#ai-provider-status').textContent = 'AI provider status unavailable';
}

try {
  state.cases = await getJSON('/api/events').then((body) => body.cases);
  selectCase('NVDA');
} catch (error) {
  $('#ingestion-status').textContent = 'Unable to load cases'; $('#replay-note').textContent = error.message;
}
