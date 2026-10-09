const state = { cases: [], selected: null, research: null, posture: null, aiConfigured: null };
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
  $('#selected-case').textContent = `${state.selected.ticker} · ${state.selected.company}`;
  $('#selected-event').textContent = state.selected.event;
  $('#as-of-input').value = toInputValue(state.selected.secAcceptedAt);
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
  const values = all.flatMap((row) => [Number(row[2]), Number(row[3])]).filter(Number.isFinite);
  const min = Math.min(...values, 0); const max = Math.max(...values, 1);
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
  const asOf = fromInputValue($('#as-of-input').value);
  state.research = null;
  $('#run-button').disabled = true; $('#run-button').textContent = 'Reading…'; $('#replay-status').textContent = 'Fetching'; $('#replay-note').textContent = 'Holding future evidence out of the packet';
  try {
    const data = await getJSON(`/api/research?ticker=${state.selected.ticker}&asOf=${encodeURIComponent(asOf)}`);
    state.research = data;
    renderEvidence(data); renderBaseline(data); renderMarket(data); renderContradictions(data);
    $('#retrieval-clock').textContent = formatUTC(data.generatedAt);
    $('#ingestion-status').textContent = 'Live sources connected'; $('#replay-status').textContent = data.baseline.decision; $('#replay-note').textContent = `As of ${formatUTC(data.replay.asOf)}`;
    $('#evidence-hash').textContent = data.integrity.evidenceHash || '—';
    $('#source-status').textContent = `${data.sourceChecks.issuer.ok ? 'Issuer page fetched' : 'Issuer page access caveat'} · ${data.sourceChecks.sec.ok ? 'SEC filing fetched' : 'SEC source unavailable'}`;
    $('#receipt-json').textContent = JSON.stringify({ replay: data.replay, evidence: data.evidence, baseline: data.baseline, market: { symbol: data.market.symbol, sourceEndpoints: data.market.sourceEndpoints }, integrity: data.integrity }, null, 2);
    $('#ai-answer').textContent = state.aiConfigured === true ? 'Receipt ready. AI questions will be analyzed using a new server-verified evidence packet.' : state.aiConfigured === false ? 'Receipt ready. The live AI provider is not configured; all displayed checks are deterministic.' : 'Receipt ready. Checking AI provider availability.';
  } catch (error) {
    $('#ingestion-status').textContent = 'Source error · no fabricated fallback'; $('#replay-status').textContent = 'ABSTAIN'; $('#replay-note').textContent = error.message; $('#ai-answer').innerHTML = `<span class="spark">!</span><span>${escapeHtml(error.message)}</span>`;
  } finally { $('#run-button').disabled = false; $('#run-button').innerHTML = 'Run the desk <span>↗</span>'; }
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

$('#run-button').addEventListener('click', runDesk);
$('#refresh-button').addEventListener('click', runDesk);
$('#ai-form').addEventListener('submit', askAI);
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
