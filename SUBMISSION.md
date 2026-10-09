# FIRSTREAD submission materials

Status: production is deployed with an independent browser pass and **63/63 tests passing**, including browser entrypoint syntax checks. Source-reconciled SEC financial intelligence and Bitget Equity MCP integration have live validation. Live AI provider verification, independent human user trials and form acceptance remain unproven. The X post and form have NOT been submitted.

## Track

AI Trading Desk → Information Extraction & Signal Generation.

## 1. Thesis

FIRSTREAD is an evidence-timed earnings desk for Bitget Reality rTokens. It helps a human trader answer a narrower and safer question than “what should I buy?”: what was actually knowable at an exact decision time, what did the relevant rToken market show afterward, which source conflicts remain, and should the next posture be INVESTIGATE, WAIT, or REJECT?

## 2. Target user and value

The target user is an active retail or VIP rToken trader with moderate-to-high risk tolerance, roughly $1,000–$25,000 of capital, and one to five event-driven research decisions per week. FIRSTREAD reduces the risk of mixing a later filing, a future candle, or a date-only issuer page into an earlier decision. It gives the user a readable evidence receipt, a rules-only baseline, market-response context, and a constrained optional AI review while preserving the human final call.

## 3. Validation data and observed results

The data pipeline uses live public Bitget Reality REST endpoints, SEC 8-K earnings exhibits, SEC acceptance timestamps and primary issuer pages. The recorded feasibility probe found real online instruments and one-hour candle histories for `RNVDAUSDT`, `RAAPLUSDT`, and `RMSFTUSDT` near their SEC acceptance anchors. The initial Bitget Equity MCP probe received a backend HTTP 503, but an October 9 retest independently confirmed successful equity profiles and income statements. The public MCP now powers a separate current-day reconciliation, explicitly excluded from historical pre-decision evidence.

Observed engineering results:

- 3/3 candidate Reality instruments discovered with candle coverage near SEC anchors.
- 3/3 end-to-end research workflows completed locally and three distinct SEC EX-99.1 financial-exhibit cases independently verified in production Chromium.
- [GitHub CI passed 63/63 tests](https://github.com/Iniwura/firstread/actions/runs/37928108573), with zero failures, browser root-script syntax checking, SEC financial comparison tests and temporal/AI adversarial checks.
- [Independent production Chromium proof](https://github.com/Iniwura/firstread/actions/runs/37928241804): pass for all three SEC financial records and live Bitget source reconciliation, time-locked replay, AI fallback, simulated source failure, and mobile no-overflow.

These are engineering observations, not user adoption or trading-performance metrics. No return, Sharpe, drawdown, fill, backtest, paper-trading, or profitability claim is made. No historical analyst-consensus snapshot is claimed because one was not provided as an as-of artifact.

## 4. Progress and limitations

Implemented: real Bitget Reality instrument/quote/candle/status/calendar reads and current trading-window metadata; three SEC-filed EX-99.1 earnings exhibits; numerical year-over-year financial comparison, earnings-quality counterarguments, independent Bitget MCP reconciliation that checks compatible fiscal periods; SEC and issuer evidence objects; point-in-time visibility gates; completed-candle and gap audit; quantified evidence-and-market decision dossier (pre-decision drift, price range, freshness, gaps, missing consensus, hindsight-only results); deterministic baseline; source hashes; server-authoritative typed AI packet that rejects client evidence and invalid citations; responsive UI and natural-language question starters; automated CI, local API routes, tests, browser screenshots and deployment configuration.

Known limitations: NVIDIA’s issuer timing is only minute-approximate; Apple and Microsoft issuer pages are date-only and are held out of precision-sensitive issuer replay. The Bitget Equity MCP backend now responds to tested current-profile and financial-income queries; the initial 503 is documented as an earlier limitation. Apple only returned cumulative records for Q3 in the sampled vendor result, which FIRSTREAD rejects rather than comparing to an SEC quarter. SEC requests from the production runtime can also fail, so filed-exhibit provenance is visible but direct live SEC retrieval is not claimed. The app has no account connection, order execution, trade recommendation, live funds, historical forecast archive, or claimed performance. Independent production Chromium verification passed across all three cases; live provider-based analysis still requires a server key.

## 5. Take on AI Trading

AI should compress and explain a source-grounded research packet, not manufacture certainty. A useful desk agent exposes what it saw, cites the exact evidence IDs, separates observation from inference, calls out missing forecasts and market-data caveats, and abstains when timing or source quality is insufficient. FIRSTREAD therefore keeps the deterministic temporal gate and rules baseline ahead of the optional model review.

## 6. Role of the LLM

The LLM receives only the typed packet assembled server-side after the as-of filter; it rejects client-submitted evidence packets. It may summarize visible facts, compare contradictions, propose what a human should investigate next, and choose among INVESTIGATE / WAIT / REJECT as a research posture. The server validates every returned evidence citation against the packet and rejects unknown IDs. It must not use future facts, claim a fill or return, turn an rToken move into an underlying-stock claim, or override the human decision. The integration is OpenAI-compatible and supports the Bitget hackathon Qwen endpoint when a server-side key is supplied; without a key it returns an honest not-configured state.

## Links and external submission status

- Repository: `https://github.com/Iniwura/firstread`
- Production demo: `https://firstread-psi.vercel.app/` (validated deployed version `dpl_CrdhZcbkdDTpNkTVvkPLMGixisF2`; independent Chromium passed with three earnings cases).
- Form checked, not submitted: `https://forms.gle/GyWZCMCPocgJdJon6`
- Required Bitget S2 promotional post to quote: `https://x.com/Bitget_AI/status/2100519318824055159?s=20`

Draft X **quote post** (requires explicit user approval before publication):

> An earnings release isn't a trading signal until you know what was available when the price moved. We built FIRSTREAD for @Bitget_AI: an evidence-timed rToken research desk using Bitget Reality candles, SEC filing timestamps, source receipts and transparent reasons to wait. Human makes the final call. https://firstread-psi.vercel.app/ #BitgetHackathon

Quote Bitget's designated S2 post: https://x.com/Bitget_AI/status/2100519318824055159?s=20

The project submission requires a complete description, role-of-LLM field, publicly accessible demo, repo/material links, compliant X quote post, and the user's actual Bitget UID/team identity. Select the university field only with confirmed eligibility. The October 11 X extension conflicts with an earlier October 8 form deadline. **Check whether the form accepts responses immediately; do not claim submission or extension without confirmation.**

See [EVALUATION.md](EVALUATION.md) for the full judge walkthrough, observed engineering proof boundaries, and external user-testing protocol.

## Site navigation and 2026 visual refresh

- **First impression / project explanation:** https://firstread-psi.vercel.app/
- **Functional SEC/Bitget research workspace:** https://firstread-psi.vercel.app/desk.html
- **Conservative pre-SEC evidence demonstration:** https://firstread-psi.vercel.app/desk.html?ticker=NVDA&asOf=2026-08-26T20%3A21%3A18.000Z
- The landing page has a verified before/after SEC cut-off control, three authentic case entrypoints, and a locally hosted public-domain Library of Congress image.
- Do not call the landing interaction a live trade. The AI provider still requires a private server key.

## Demo video and what judges can verify

- **Full working product:** https://firstread-psi.vercel.app/
- **Captioned product demonstration (MP4 artifact):** https://github.com/Iniwura/firstread/actions/runs/37927622231/artifacts/11614679622
- **Independent production browser QA:** https://github.com/Iniwura/firstread/actions/runs/37928241804
- **63/63 automated temporal, financial, MCP and UI syntax checks:** https://github.com/Iniwura/firstread/actions/runs/37928108573
- **Independent live SEC-versus-Bitget MCP data validation:** https://github.com/Iniwura/firstread/actions/runs/37927430868
- **Real user research protocol (pending actual participants):** [USER_TEST_PROTOCOL.md](USER_TEST_PROTOCOL.md)

This video shows a scripted research workflow, not a working Qwen response. The Bitget Qwen credit request has been submitted by the builder but a provider token and live model validation remain pending.

## Engineering and source evidence

- Three SEC exhibits and the verified factual anchors: [`data/sec-exhibits.json`](data/sec-exhibits.json)
- Independent browser proof: [`PRODUCTION_PROOF.md`](PRODUCTION_PROOF.md)
- No-lookahead/adversarial tests: [`tests/`](tests/)
- Limitations and blind-user protocol: [`EVALUATION.md`](EVALUATION.md)
- The rules-only fallback is NOT a successful AI model demonstration; mark as pending until a live provider is configured and tested. See [AI_ACTIVATION.md](AI_ACTIVATION.md) for the exact secure setup and an opt-in automated real-model test.

## Differentiating technical result verified live

Bitget Equity MCP independent reconciliation is now working through its public `equity_fundamental_income` entry. NVIDIA's reported revenue and GAAP EPS agree with its SEC quarterly exhibit; the vendor's operating-income value differs by $269M (definition unresolved). Apple returned a cumulative nine-month record rather than standalone Q3 in the sampled result, so the comparison was correctly withheld. Microsoft supplied a standalone Q4 result agreeing with the SEC filing on revenue, operating income and EPS. The system labels all vendor results **retrieved now**, and no such material enters a historical AI decision packet. [Live comparison proof](https://github.com/Iniwura/firstread/actions/runs/37927430868).

The full research engine and headless app have [independent browser proof](https://github.com/Iniwura/firstread/actions/runs/37928241804). The Qwen key application has been submitted by the project owner, but no token or live LLM result has been confirmed. Do not claim a Qwen success prematurely.
