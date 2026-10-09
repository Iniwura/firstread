# FIRSTREAD — evidence-timed earnings intelligence

FIRSTREAD is an evidence-timed earnings desk for Bitget Reality rTokens, built for **Bitget AI Base Camp S2, AI Trading Desk → Information Extraction & Signal Generation**. It helps an active rToken trader ask: after this disclosure, what was actually knowable at the decision time, what did the rToken market show, what conflicts remain, and should a human investigate, wait, or reject the idea?

The product is intentionally a research desk, not an execution agent. It does not connect to accounts, place orders, invent performance, or turn a thin record into a confident signal.

## Run the first gate

With Node.js >= 20 and working outgoing HTTPS to `api.bitget.com`:

```bash
npm test
npm run probe
npm run probe:sources
npm run typecheck
npm run lint
npm run build
npm run dev
```

Open `http://127.0.0.1:4174/` for the full workflow: select NVDA, AAPL, or MSFT; set an exact UTC decision timestamp; run the desk; inspect the visible evidence receipt, completed pre-decision candles, separated reaction window, rules-only baseline, caveats, and reproducible hash; then optionally ask the constrained AI review step.

`npm test` checks time-locked evidence/candle handling. `npm run probe` discovers active rToken instruments using Bitget's public `/api/v3/market/instruments` endpoint, queries public historical candlesticks near three **SEC acceptance** times, and writes `reports/bitget-feasibility.json`. If no matching instrument, no coverage, or the API is unreachable, it exits nonzero. No artificial price data are used.

A PASS establishes candidate candle coverage only. It does **not** establish correct first public earnings release timestamps, historic analyst forecasts, exchange execution, trading performance, or profitability.

## Verified source anchors

- NVDA filing accepted 2026-08-26 16:21:19 ET: https://www.sec.gov/Archives/edgar/data/1045810/000104581026000073/0001045810-26-000073-index.html
- AAPL filing accepted 2026-07-30 16:30:28 ET: https://www.sec.gov/Archives/edgar/data/320193/000032019326000018/0000320193-26-000018-index.htm
- MSFT filing accepted 2026-07-29 16:04:53 ET: https://www.sec.gov/Archives/edgar/data/789019/000119312526323632/0001193125-26-323632-index.htm

These are **conservative SEC publication anchors**, not proof that earnings information was first public at that instant. Press releases may have appeared earlier; verify before any performance claim.

## Official Bitget technical docs

- Instruments: https://www.bitget.com/docs/catalog/market-market-data/market-instruments
- Candles: https://www.bitget.com/docs/catalog/market/market-data
- Reality trading guide: https://www.bitget.com/docs/uta/reality-trading-guide
- Research fundamentals: https://www.bitget.com/docs/catalog/reality/basic-info
- US stocks MCP server: https://agent.bitget.com/mcp (discover supported tools dynamically)

## What is real and verified

- Bitget public Reality instruments and historical candles were probed live for `RNVDAUSDT`, `RAAPLUSDT`, and `RMSFTUSDT`.
- Each case has real one-hour candle coverage around a verified SEC filing-acceptance timestamp.
- Bitget Reality public stock-info, market-state, market-calendar, and instrument endpoints return live data with the observed `{code,msg,requestTime,data}` envelope.
- The Bitget US-equity MCP transport initializes publicly and exposes a 22-entry equity catalog. Its backend returned HTTP 503 for a live profile query during the recorded probe; FIRSTREAD does not present unavailable MCP data as successful.
- Issuer release evidence is labeled with its actual precision. NVDA has an official approximate public-release schedule; Apple and Microsoft are date-only in the retrieved issuer pages and are excluded from precision-sensitive issuer replay.

Reports: `reports/bitget-feasibility.json`, `reports/source-feasibility.json`, and `reports/submission-status.json`.

## Architecture

```text
Bitget Reality REST ─┐
SEC + issuer IR ─────┼─> temporal evidence gate ─> rules baseline ─> optional LLM review
Bitget equity MCP ───┘             │                         │
                                  └─> receipt + human posture (INVESTIGATE / WAIT / REJECT)
```

- `src/temporal-engine.mjs` fails closed on date-only or malformed timestamps and excludes unfinished/future candles.
- `src/research-engine.mjs` creates typed evidence objects, audits gaps, builds the deterministic baseline, and validates model evidence IDs.
- `src/bitget-client.mjs` fetches live public Reality instruments, quotes, candles, session states, and calendar data with rate-limit handling.
- `src/research-service.mjs` joins the three real cases, primary links, Bitget market response, and point-in-time rules.
- `api/ai.js` keeps the LLM behind a typed packet and rejects citations to evidence not visible at the selected `asOf`.
- `index.html`, `styles.css`, and `app.js` are a zero-build editorial finance-terminal UI; no frontend package installation is required.

Optional AI configuration uses `BITGET_QWEN_API_KEY`, `BITGET_QWEN_BASE_URL=https://hackathon.bitgetops.com/v1`, and `BITGET_QWEN_MODEL=qwen3.8-max`. OpenAI-compatible variables are supported as a fallback. Keys are server-only.

## Primary SEC earnings exhibits for three companies

The following exact SEC 8-K exhibits were independently inspected and added as time-qualified `E3` evidence. They are included **only from their respective SEC acceptance timestamps** (never before). Apple and Microsoft publisher pages remain date-only, so FIRSTREAD does not invent their earlier public release times.

| Case | Accepted at (UTC) | Filed exhibit | Verified reported data |
|---|---|---|---|
| NVIDIA | 2026-08-26 20:21:19 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000073/q2fy27pr.htm) | $96.2B quarterly revenue; $2.46 GAAP EPS; $108B ±2% forward revenue outlook |
| Apple | 2026-07-30 20:30:28 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/320193/000032019326000018/a8-kex991q3202606272026.htm) | $109.4B quarterly revenue; $2.02 diluted EPS; 50.1% gross margin |
| Microsoft | 2026-07-29 20:04:53 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/789019/000119312526323632/msft-ex99_1.htm) | $90B quarterly revenue; $4.81 GAAP EPS; +43% Azure growth |

The `data/sec-exhibits.json` records the source URLs, reported facts, quotes, SEC acceptance anchors and verification date. The application distinguishes a publisher's first-public time from later filing availability and never infers first public release solely from SEC acceptance. A filed source may be web-inspectable independently even when SEC blocks a particular live server request; that retrieval failure is disclosed, not hidden.

Research reports now include an **actionable human brief**: which financial facts are time-qualified, what remains unverified, what the historical rToken prices actually establish, and what evidence or checks a trader must obtain next. The future/hindsight market response stays outside the pre-decision model packet. Five additional SEC timing tests guard against false historical availability.

## Competition-grade research improvements (October 9)

FIRSTREAD now includes a **decision dossier** in the research response and in the UI. It calculates pre-cutoff price drift, observed intrawindow range, candle-age/gap quality, source-timing precision, and a separate outcome-only market observation. It does not label returns, fills, historical consensus comparisons, or profitability. Later price observations are never included in the model's pre-decision packet.

The optional AI endpoint is server-authoritative: the browser submits only the company, exact UTC cutoff, and natural-language question. The server reconstructs the evidence independently, rejects client evidence payloads, and requires model evidence IDs to match the time-filtered packet. An unconfigured provider is shown clearly as rules-only mode; it is **not** represented as live AI analysis.

Historical research is reconstructed from issuer/SEC publication anchors. `firstObservedAt` is **not** fabricated to equal historical publication time. These reconstructed sources do not establish that FIRSTREAD actually observed a release in 2026 at the displayed historical time. Approximate and date-only publisher timestamps remain labeled accordingly.

[Automated quality checks](https://github.com/Iniwura/firstread/actions) now run on push. The GitHub checks cover Node tests, JavaScript syntax, and build verification; a passing workflow does not substitute for a live provider test, an independent external-user study, or production-browser validation.

For a judge-ready walkthrough and proof checklist, see [EVALUATION.md](EVALUATION.md). Real AI answers in the public demo require a configured `BITGET_QWEN_API_KEY` (or `OPENAI_API_KEY`) on the Vercel project. A provider key must remain in Vercel encrypted environment variables, never committed to this repository or submitted in chat.

## Scope and responsible proof

- AI research desk: human takes final decision; no live funds required.
- Strong showcase: SEC/issuer evidence → what was known when → Bitget reaction → conflicting evidence → ABSTAIN or structured human-research report.
- No historical expectations without archived as-of snapshots.
- No causal claim from simple price movement; no simulated fills labelled real.
- Zero fabricated credentials, customers, outcomes, metrics, reviews, or API results.

Observed validation initially included 13 automated temporal/research tests; further research-brief, SEC-exhibit and AI-boundary tests have since been added, live API probes for all three cases, all three end-to-end research workflows, desktop/mobile Chromium verification, case switching, no-lookahead separation, and a simulated bad-network abstention. These are engineering observations, not user adoption or trading-performance metrics. No historical analyst-consensus snapshot, live trading, paper trading, backtest, return, Sharpe, drawdown, fill, or profitability claim is made.

## Competition materials

- [Submission description and role of LLM](SUBMISSION.md)
- [Submission status](reports/submission-status.json)
- Live demo: https://firstread-psi.vercel.app/

The live form was checked and appeared fillable, but was not submitted. It currently states an October 8, 23:59 (UTC+8) deadline; the official activity page shows a conflicting earlier timeline. Acceptance and any extension are not claimed. The X promotional draft is in `SUBMISSION.md` and requires user approval before posting.

## Primary references

- Bitget Reality market data: https://www.bitget.com/docs/catalog/reality/market-data
- Bitget Agent Hub / equity MCP: https://www.bitget.com/docs/uta/agent-hub
- Required Bitget interaction post: https://x.com/Bitget_AI/status/2062506424085917944?s=20

The handbook-defined implementation is represented by this tree; see `SUBMISSION.md` for the current honest delivery status and remaining external actions.
