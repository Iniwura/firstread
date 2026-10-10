# FIRSTREAD

**Evidence-timed earnings research for Bitget Reality tokenized equities.**

**What did you actually know when you had to make the decision?**

FIRSTREAD links real SEC earnings filings, Bitget Reality rToken market observations and constrained Qwen research. Set a historical decision timestamp and inspect which evidence was eligible *then*, what remained unknown, and which market observations came later. Every review keeps its sources and uncertainty visible.

**FIRSTREAD is a human-controlled research tool.** It does not connect exchange accounts, place trades or promise returns.

[**Live Website**](https://firstread-psi.vercel.app/) · [**Open Research Desk**](https://firstread-psi.vercel.app/desk.html) · [**Watch the 3:28 Judging Demo**](https://youtu.be/yZq9-JpuQco)

**Bitget AI Base Camp Hackathon S2** · AI Trading Desk → **Information Extraction & Signal Generation**

---

## The problem FIRSTREAD solves

A historical earnings explanation can accidentally mix information from different moments: filings, later prices, present-day vendor fundamentals, and commentary. That creates hindsight disguised as research.

FIRSTREAD uses an explicit decision-time cutoff to separate:

- **Eligible evidence:** SEC / issuer documents with qualifying timestamp precision.
- **Pre-decision market data:** completed Bitget Reality price candles available by the cutoff.
- **Later observations:** price reactions displayed separately, never included in the historical AI packet.
- **Present-day fundamentals:** an independent Bitget Equity MCP check clearly identified as a *current* reconciliation, not historical knowledge.
- **Unknowns and disagreements:** missing archived consensus, imprecise release timing, inconsistent vendor data and retrieval failures.

The result is a linked, inspectable research brief with one human posture: **INVESTIGATE, WAIT or REJECT**.

## Try the complete research flow

1. **Choose a company.** Select NVIDIA, Apple or Microsoft. Each case is anchored to a verified SEC 8-K Exhibit 99.1 and a Bitget Reality rToken.
2. **Rewind the decision clock.** For NVIDIA, go to **15 minutes before** the SEC filing acceptance (2026-08-26 20:21:19 UTC). The filed earnings exhibit and its figures remain withheld.
3. **Move to SEC acceptance.** The exhibit becomes eligible at the exact filing time. Read the source-linked financial comparison and completed historical candles.
4. **Check independent data.** Run the SEC ↔ Bitget fundamentals reconciliation. NVIDIA has a reported operating-income discrepancy; Apple's sampled vendor data cover a cumulative period and cannot be treated as standalone Q3; Microsoft's sampled matching quarter agrees.
5. **Ask Bitget Qwen.** On Microsoft, choose a cutoff two hours after SEC acceptance and ask for filed figures, unavailable consensus, and next research steps. A real provider test returned a source-cited review including **[E3-MSFT]**.
6. **Copy the research receipt.** Inspect the UTC cutoff, source identifiers, evidence hash and limits.

First-time visitors can follow the guided tour and replay it with **DESK TOUR**.

[Open NVIDIA before the filing](https://firstread-psi.vercel.app/desk.html?ticker=NVDA&asOf=2026-08-26T20%3A21%3A18.000Z) · [NVIDIA](https://firstread-psi.vercel.app/desk.html?ticker=NVDA) · [Apple](https://firstread-psi.vercel.app/desk.html?ticker=AAPL) · [Microsoft](https://firstread-psi.vercel.app/desk.html?ticker=MSFT)

> **Important timing caveat:** SEC acceptance is a conservative availability anchor for the *filed exhibit*. It does not prove the earnings announcement was first made public at that moment. Earlier issuer announcements may exist.

## Features at a glance

| Feature | What is implemented |
|---|---|
| Temporal evidence gate | Exact UTC cutoff; future documents and incomplete/future candles excluded |
| SEC earnings research | Three source-identified 8-K Exhibit 99.1 cases |
| Financial comparison | Filed revenue, EPS, operating income, year-over-year changes and caveats |
| Bitget Reality markets | Real rToken symbols, instruments and historical one-hour candles |
| Independent source check | Current-day Bitget Equity MCP fundamentals, outside the historical AI packet |
| Live constrained AI | Bitget Qwen 3.8 Max, using server-built and cutoff-qualified evidence |
| Citation guardrail | Model evidence IDs validated against eligible sources |
| Research receipt | Source references, decision time and evidence hash |
| Product experience | No-login responsive desk, first-visit tour, clear rules-only fallback |

### Verified SEC filing anchors

| Company | Acceptance time (UTC) | Primary exhibit | Selected filed results |
|---|---|---|---|
| NVIDIA · Q2 FY2027 | 2026-08-26 20:21:19 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/1045810/000104581026000073/q2fy27pr.htm) | $96.2B revenue; $2.46 GAAP diluted EPS |
| Apple · Q3 FY2026 | 2026-07-30 20:30:28 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/320193/000032019326000018/a8-kex991q3202606272026.htm) | $109.4B revenue; $2.02 diluted EPS |
| Microsoft · Q4 FY2026 | 2026-07-29 20:04:53 | [EX-99.1](https://www.sec.gov/Archives/edgar/data/789019/000119312526323632/msft-ex99_1.htm) | $90.0B revenue; $4.81 GAAP diluted EPS |

Source metadata and reported facts: [SEC exhibits](data/sec-exhibits.json) · [Verified anchors](data/verified-sec-anchors.json) · [Financial comparison data](data/sec-financial-comparisons.json).

## How it works

```text
              SEC filings / issuer evidence
                           │
     Historical UTC cutoff ┼── Bitget Reality completed candles
                           │
                 Temporal evidence gate
                           │
                  Server research packet
                           │
            ┌──────────────┴──────────────┐
            │                             │
     Deterministic brief          Bitget Qwen review
            │                             │
            └──────────────┬──────────────┘
                           │
               Source IDs + evidence receipt
                           │
                   Human decision

   Bitget Equity MCP ─→ Separate present-day source check
```

- [src/temporal-engine.mjs](src/temporal-engine.mjs) handles publication precision and historical price-candle boundaries.
- [src/research-engine.mjs](src/research-engine.mjs) creates typed evidence, deterministic research and validates citation IDs.
- [src/research-service.mjs](src/research-service.mjs) constructs source-qualified cases and the server-authoritative AI packet.
- [src/bitget-client.mjs](src/bitget-client.mjs) retrieves Bitget Reality market observations.
- [api/ai.js](api/ai.js) invokes the server-side model and rejects unpermitted evidence references.

The browser sends only the company, UTC cutoff and question. **It cannot provide its own source packet.**

Citation checks validate source *IDs and historical eligibility*, not every number in the model's prose. If the model fails, times out or lacks sufficient evidence, the app can abstain. It does not invent a successful AI answer.

## Run locally

**Requires:** Node.js 20 or newer. Real market-data functions and feasibility probes require access to external HTTPS endpoints.

```bash
git clone https://github.com/Iniwura/firstread.git
cd firstread
npm test
npm run typecheck
npm run build
npm run dev
```

Open [http://127.0.0.1:4174/](http://127.0.0.1:4174/) or [the local research desk](http://127.0.0.1:4174/desk.html).

To check live external data availability:

```bash
npm run probe
npm run probe:sources
```

These probes can fail during API outages or rate limits; successful candle coverage is not a strategy-backtest or profitability result.

**Optional local AI:** Configure a private `BITGET_QWEN_API_KEY` on the server. Provider defaults are `BITGET_QWEN_BASE_URL=https://hackathon.bitgetops.com/v1` and `BITGET_QWEN_MODEL=qwen3.8-max`. Never commit secrets. Without a provider key, the desk operates in rules-only mode.

## Verified engineering evidence

| Test | Verified result | Evidence |
|---|---|---|
| Automated and adversarial research tests | **66 passed, 0 failed** | [CI run](https://github.com/Iniwura/firstread/actions/runs/38040776566) |
| Production end-to-end browser checks | **Passed** for all three cases, desktop/mobile and historical replay | [Browser run](https://github.com/Iniwura/firstread/actions/runs/38040776529) |
| Responsive visual inspection | **Passed** across tested breakpoints | [Visual QA](https://github.com/Iniwura/firstread/actions/runs/38040776588) |
| Accessibility and API-boundary checks | **Passed** on tested pages | [Judge audit](https://github.com/Iniwura/firstread/actions/runs/38040776573) |
| Actual Qwen provider request | **Passed** with Microsoft SEC citation `[E3-MSFT]` | [Live AI proof](https://github.com/Iniwura/firstread/actions/runs/38035417592) |
| SEC versus Bitget fundamentals | NVIDIA mismatch, Apple incomparable period, Microsoft agreement observed | [Live source audit](https://github.com/Iniwura/firstread/actions/runs/37927430868) |

[**Watch the final narrated product demo (YouTube)**](https://youtu.be/yZq9-JpuQco)

These are engineering observations. They do **not** establish user adoption, trading performance, independent model accuracy or guaranteed returns.

## Honest limitations

- Three fixed supported earnings cases, not arbitrary ticker coverage.
- Historical market replay uses one-hour candles, not tick-level execution.
- SEC acceptance does not establish when issuer earnings information first became publicly available.
- No independently archived historical analyst-consensus series; no unsupported beat/miss claims.
- Present-day vendor financials and later market observations are excluded from historical AI input.
- Some source websites resist programmatic retrieval. The desk discloses retrieval failures rather than counting them as corroboration.
- Checking a model's evidence IDs is not independent numeric fact-checking.
- No independent human-user study or trading-performance results are claimed.

## Further documentation

- [Submission description and role of the LLM](SUBMISSION.md)
- [Evaluation protocol](EVALUATION.md)
- [Production and source verification](PRODUCTION_PROOF.md)
- [Independent user-test protocol](USER_TEST_PROTOCOL.md)
- [AI configuration](AI_ACTIVATION.md)
- [Recorded submission status](reports/submission-status.json)

**Official references:** [Bitget AI Base Camp S2 handbook](https://bitget-ai.gitbook.io/bitgetai_hackathons2) · [Bitget Reality market data](https://www.bitget.com/docs/catalog/reality/market-data) · [Bitget Agent Hub](https://www.bitget.com/docs/uta/agent-hub)

**Read the record before making the call.**
