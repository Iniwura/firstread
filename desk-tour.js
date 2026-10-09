/**
 * FIRSTREAD / DESK TOUR
 * Client-only accessibility-first onboarding. No requests, account data,
 * API keys or research state are stored. Persistence is a single local flag.
 */
const seenKey = 'firstread:desk-tour:v1';
const params = new URLSearchParams(window.location.search);
const tourRoot = document.querySelector('#desk-tour');
const card = document.querySelector('#tour-card');
const outline = document.querySelector('#tour-target-outline');
const openButton = document.querySelector('#tour-launch');
const quickButton = document.querySelector('#quickstart-tour');
const closeButton = document.querySelector('#tour-close');
const skipButton = document.querySelector('#tour-skip');
const backButton = document.querySelector('#tour-back');
const nextButton = document.querySelector('#tour-next');
const count = document.querySelector('#tour-step-count');
const section = document.querySelector('#tour-step-section');
const title = document.querySelector('#tour-title');
const description = document.querySelector('#tour-description');
const progressFill = document.querySelector('#tour-progress-fill');
const shades = {
  top: document.querySelector('.tour-shade-top'),
  left: document.querySelector('.tour-shade-left'),
  right: document.querySelector('.tour-shade-right'),
  bottom: document.querySelector('.tour-shade-bottom'),
};

const steps = [
  {
    selector: '#case-list',
    label: '01 / CHOOSE A CASE',
    title: 'Start with a company.',
    body: 'Choose NVIDIA, Apple or Microsoft. Each case uses a real SEC earnings exhibit and Bitget tokenized-stock market data.',
  },
  {
    selector: '.clock-instrument',
    label: '02 / CONTROL THE CLOCK',
    title: 'Set your decision time.',
    body: 'The three shortcuts move 15 minutes before the SEC filing, to filing acceptance, or two hours after. You can also enter a UTC timestamp.',
  },
  {
    selector: '#cutoff-tape',
    label: '03 / VERIFY THE CUTOFF',
    title: 'See what becomes available.',
    body: 'The marker follows your chosen time. An SEC exhibit is held out before its acceptance timestamp. This is an evidence timeline, not a price chart.',
  },
  {
    selector: '#evidence .panel-head',
    label: '04 / FOLLOW THE SOURCES',
    title: 'Read what was knowable.',
    body: 'This is your evidence register. Open primary-source links and watch which records are included or withheld as the clock changes.',
  },
  {
    selector: '#financial .panel-head',
    label: '05 / EXAMINE THE RESULTS',
    title: 'Look beyond the headline.',
    body: 'Compare filed earnings with the prior year. The separate SEC-versus-Bitget check uses current data and never enters historical research.',
  },
  {
    selector: '#market .panel-head',
    label: '06 / READ THE MARKET',
    title: 'Separate price from hindsight.',
    body: 'The chart distinguishes completed candles before your cutoff from later price observations. These are not simulated trades or forecasts.',
  },
  {
    selector: '#ai .panel-head',
    label: '07 / CHALLENGE THE THESIS',
    title: 'Ask better questions.',
    body: 'Use the example questions to investigate uncertainties. If live Qwen access is not configured, FIRSTREAD clearly falls back to its rules-only research.',
  },
  {
    selector: '#receipt .panel-head',
    label: '08 / KEEP THE RECEIPT',
    title: 'Take the evidence with you.',
    body: 'Copy the source-linked research record and inspect its timestamp and evidence hash. You make the final decision. FIRSTREAD never places an order.',
  },
];

let active = false;
let index = 0;
let restoreFocus = null;
let originalOverflow = '';
let originalScroll = 0;
let scheduledPosition = false;
let autoStarted = false;
let observedList = null;
let locallySeen = false;

function seen() {
  try { return window.localStorage.getItem(seenKey) === 'seen'; }
  catch { return locallySeen; }
}
function markSeen() {
  locallySeen = true;
  try { window.localStorage.setItem(seenKey, 'seen'); } catch { /* private mode */ }
}
function targetForStep() {
  return document.querySelector(steps[index].selector);
}
function setFrame(el, left, top, width, height) {
  el.style.left = Math.round(left) + 'px';
  el.style.top = Math.round(top) + 'px';
  el.style.width = Math.round(Math.max(0, width)) + 'px';
  el.style.height = Math.round(Math.max(0, height)) + 'px';
}
function positionTour() {
  if (!active) return;
  const element = targetForStep();
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const left = Math.max(7, Math.min(w - 40, rect.left - 7));
  const right = Math.min(w - 7, Math.max(left + 40, rect.right + 7));
  // Large sections are deliberately clipped to the visible portion.
  const top = Math.max(72, Math.min(h - 85, rect.top - 7));
  const bottom = Math.min(h - 7, Math.max(top + 48, rect.bottom + 7));
  setFrame(shades.top, 0, 0, w, top);
  setFrame(shades.left, 0, top, left, bottom - top);
  setFrame(shades.right, right, top, w - right, bottom - top);
  setFrame(shades.bottom, 0, bottom, w, h - bottom);
  setFrame(outline, left, top, right - left, bottom - top);
  // On wide viewports alternate the card's vertical side to avoid
  // covering the source being explained; mobile always uses a bottom sheet.
  card.dataset.position = rect.top > h * .49 ? 'top' : 'bottom';
}
function schedulePosition() {
  if (scheduledPosition || !active) return;
  scheduledPosition = true;
  window.requestAnimationFrame(() => {
    scheduledPosition = false;
    positionTour();
  });
}
function show(indexToShow) {
  if (!active) return;
  index = Math.max(0, Math.min(steps.length - 1, indexToShow));
  const step = steps[index];
  title.textContent = step.title;
  description.textContent = step.body;
  section.textContent = step.label;
  count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
  progressFill.style.width = ((index + 1) / steps.length * 100).toFixed(2) + '%';
  backButton.disabled = index === 0;
  nextButton.innerHTML = index === steps.length - 1 ? 'START EXPLORING <span>✓</span>' : 'NEXT <span>→</span>';
  const target = targetForStep();
  if (target) {
    const y = target.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 650 ? 90 : 135);
    window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
  }
  window.requestAnimationFrame(() => {
    positionTour();
    window.requestAnimationFrame(positionTour);
  });
  card.focus({ preventScroll: true });
}
function startTour() {
  if (active) return;
  if (!document.querySelector('.case-button.active')) return;
  if (observedList) { observedList.disconnect(); observedList = null; }
  restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : openButton;
  originalOverflow = document.body.style.overflow;
  originalScroll = window.scrollY;
  active = true;
  tourRoot.hidden = false;
  document.body.style.overflow = 'hidden';
  document.body.classList.add('is-touring');
  show(0);
}
function stopTour(complete = false) {
  if (!active) return;
  active = false;
  tourRoot.hidden = true;
  document.body.classList.remove('is-touring');
  document.body.style.overflow = originalOverflow;
  markSeen();
  if (complete) {
    const input = document.querySelector('#as-of-input');
    document.querySelector('#clock')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    input?.focus({ preventScroll: true });
  } else {
    window.scrollTo({ top: originalScroll, behavior: 'instant' });
    restoreFocus?.focus?.({ preventScroll: true });
  }
}
function handleKeys(event) {
  if (!active) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    stopTour(false);
    return;
  }
  if (event.key === 'ArrowRight' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    if (index < steps.length - 1) show(index + 1);
    else stopTour(true);
    return;
  }
  if (event.key === 'ArrowLeft' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    show(index - 1);
    return;
  }
  if (event.key === 'Tab') {
    const available = [...card.querySelectorAll('button:not(:disabled)')];
    const first = available[0];
    const last = available[available.length - 1];
    if (!available.length) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === card)) {
      event.preventDefault(); first.focus();
    }
  }
}
openButton.addEventListener('click', startTour);
quickButton.addEventListener('click', startTour);
closeButton.addEventListener('click', () => stopTour(false));
skipButton.addEventListener('click', () => stopTour(false));
backButton.addEventListener('click', () => show(index - 1));
nextButton.addEventListener('click', () => index === steps.length - 1 ? stopTour(true) : show(index + 1));
document.addEventListener('keydown', handleKeys);
window.addEventListener('resize', schedulePosition);
window.addEventListener('scroll', schedulePosition, { passive: true });
// Click outside the card means skip, never click a live trading/data control.
for (const shade of Object.values(shades)) {
  shade.addEventListener('click', () => stopTour(false));
}

function tryAutoStart() {
  if (autoStarted || params.get('tour') === 'off') return;
  if (params.get('tour') !== 'start' && seen()) return;
  if (document.querySelector('.case-button.active')) {
    autoStarted = true;
    window.requestAnimationFrame(() => window.requestAnimationFrame(startTour));
    return;
  }
  const list = document.querySelector('#case-list');
  observedList?.disconnect();
  observedList = new MutationObserver(() => {
    if (!document.querySelector('.case-button.active')) return;
    observedList.disconnect();
    observedList = null;
    tryAutoStart();
  });
  observedList.observe(list, { childList: true, subtree: true });
}
tryAutoStart();
