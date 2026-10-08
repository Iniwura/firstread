const state = { symbol: 'BTCUSDT', latestMarket: null, evidence: [], asOf: null };
const $ = selector => document.querySelector(selector);
const formatPrice = value => value == null ? '—' : Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatTime = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '—';
const formatDate = value => value ? new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function setState(message, isError = false) { $('#connection-status').textContent = message; $('#connection-status').closest('.topbar-meta').querySelector('.status-dot').style.background = isError ? 'var(--accent)' : 'var(--teal)'; }
function drawChart(candles) {
  const line = $('#chart-line'); const area = $('#chart-area');
  if (!candles?.length) { line.setAttribute('d', ''); area.setAttribute('d', ''); return; }
  const values = candles.map(item => item.close).filter(Number.isFinite); const min = Math.min(...values); const max = Math.max(...values); const spread = Math.max(max - min, max * 0.0001);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 920},${155 - ((value - min) / spread) * 130}`);
  const d = `M${points.join(' L')}`; line.setAttribute('d', d); area.setAttribute('d', `${d} L920 180 L0 180 Z`);
}
function renderMarket(data) {
  state.latestMarket = data; const ticker = data.ticker; const base = data.symbol.replace('USDT', '');
  $('#active-symbol').textContent = base; $('#last-price').textContent = formatPrice(ticker.last); $('#high-price').textContent = formatPrice(ticker.high24h); $('#low-price').textContent = formatPrice(ticker.low24h); $('#spread').textContent = ticker.spreadBps == null ? '—' : `${ticker.spreadBps.toFixed(1)} bps`;
  const change = $('#price-change'); const changePct = ticker.change24h == null ? null : ticker.change24h * 100; change.textContent = changePct == null ? 'No 24h change supplied' : `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% over 24h`; change.className = `price-change ${changePct == null ? 'neutral' : changePct >= 0 ? 'positive' : 'negative'}`;
  $('#exchange-time').textContent = `Exchange ${formatTime(data.exchangeTime)} UTC`; $('#as-of-label').textContent = formatDate(data.exchangeTime); $('#candle-observed').textContent = `Observed ${formatTime(data.capturedAt)}`; $('#footer-captured').textContent = `Captured ${formatTime(data.capturedAt)} UTC`; drawChart(data.candles);
  document.querySelectorAll(`[data-watch-price="${data.symbol}"]`).forEach(el => { el.textContent = formatPrice(ticker.last); });
  setState('Bitget feed synced');
}
async function loadMarket(symbol = state.symbol) {
  setState('Refreshing Bitget feed');
  try { const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Market feed unavailable'); renderMarket(data); } catch (error) { setState('Bitget feed unavailable', true); $('#connection-status').title = error.message; $('#last-price').textContent = 'Unavailable'; }
}
function renderResearch(data) {
  state.evidence = data.items || []; $('#evidence-count').textContent = `${data.included || 0} included`;
  const stateEl = $('#research-state'); const results = $('#research-results'); stateEl.hidden = true; results.hidden = false;
  if (data.error) { results.innerHTML = `<p class="error-copy">${escapeHtml(data.error)}. No research result was fabricated.</p>`; return; }
  const summary = `<div class="result-summary">${data.included} items included · ${data.totalSeen} seen · cutoff ${formatDate(data.asOf)} ${formatTime(data.asOf)} UTC</div>`;
  const cards = state.evidence.map(item => `<article class="evidence-card"><h3><a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a></h3><div class="evidence-meta"><span>${escapeHtml(item.source)}</span><span>${formatDate(item.publishedAt)} ${formatTime(item.publishedAt)} UTC</span><span class="verified">✓ before cutoff</span></div></article>`).join('');
  results.innerHTML = summary + (cards || '<p class="error-copy">The source returned no items before this cutoff.</p>');
}
async function runResearch(event) { event.preventDefault(); const query = $('#research-query').value.trim(); const input = $('#as-of-input').value; const asOf = input ? new Date(input).toISOString() : new Date().toISOString(); state.asOf = asOf; $('#research-state').hidden = false; $('#research-results').hidden = true; $('#research-state').innerHTML = '<span class="empty-icon">⌁</span><strong>Reading dated sources…</strong><p>Filtering the evidence against your cutoff.</p>'; try { const response = await fetch(`/api/research?q=${encodeURIComponent(query)}&asOf=${encodeURIComponent(asOf)}`); const data = await response.json(); renderResearch(data); } catch (error) { renderResearch({ error: error.message, items: [] }); } }
async function askAi(event) { event.preventDefault(); const answer = $('#ai-answer'); answer.className = 'ai-answer'; answer.innerHTML = '<p>Assembling a grounded answer…</p>'; try { const response = await fetch('/api/ai', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: $('#ai-question').value.trim(), evidence: state.evidence }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || 'AI synthesis failed'); answer.className = 'ai-answer ready'; answer.innerHTML = `<p>${escapeHtml(data.answer || data.error || 'No answer returned.')}</p><div class="answer-meta">${data.configured ? 'Grounded with the configured Responses API' : 'AI provider not configured'} · ${data.evidenceCount || 0} evidence items supplied</div>`; } catch (error) { answer.innerHTML = `<p class="error-copy">${escapeHtml(error.message)}</p>`; } }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function escapeAttr(value) { return escapeHtml(value).replace(/javascript:/gi, ''); }

document.querySelectorAll('.watch-item').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.watch-item').forEach(item => item.classList.remove('active')); button.classList.add('active'); state.symbol = button.dataset.symbol; loadMarket(state.symbol); }));
$('#research-form').addEventListener('submit', runResearch); $('#ai-form').addEventListener('submit', askAi); $('#refresh-button').addEventListener('click', () => loadMarket());
const cutoff = new Date(Date.now() - 15 * 60 * 1000); cutoff.setSeconds(0, 0); $('#as-of-input').value = cutoff.toISOString().slice(0, 16);
loadMarket();
