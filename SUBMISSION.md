# FIRSTREAD submission materials

Status: production deployed; 42/42 automated tests passed and independent full-browser research checks passed for all three SEC exhibits. Live provider verification, independent user trials and form acceptance remain unproven. The X post and form have NOT been submitted.

## Track

AI Trading Desk → Information Extraction & Signal Generation.

## 1. Thesis

FIRSTREAD is an evidence-timed earnings desk for Bitget Reality rTokens. It helps a human trader answer a narrower and safer question than “what should I buy?”: what was actually knowable at an exact decision time, what did the relevant rToken market show afterward, which source conflicts remain, and should the next posture be INVESTIGATE, WAIT, or REJECT?

## 2. Target user and value

The target user is an active retail or VIP rToken trader with moderate-to-high risk tolerance, roughly $1,000–$25,000 of capital, and one to five event-driven research decisions per week. FIRSTREAD reduces the risk of mixing a later filing, a future candle, or a date-only issuer page into an earlier decision. It gives the user a readable evidence receipt, a rules-only baseline, market-response context, and a constrained optional AI review while preserving the human final call.

## 3. Validation data and observed results

The data pipeline uses live public Bitget Reality REST endpoints, SEC 8-K earnings exhibits, SEC acceptance timestamps and primary issuer pages. The recorded feasibility probe found real online instruments and one-hour candle histories for `RNVDAUSDT`, `RAAPLUSDT`, and `RMSFTUSDT` near their SEC acceptance anchors. The source probe initialized Bitget’s public equity MCP transport and discovered its equity catalog; live MCP backend queries returned 503 during the probe and are recorded as unavailable rather than replaced with invented fundamentals.

Observed engineering results:

- 3/3 candidate Reality instruments discovered with candle coverage near SEC anchors.
- 3/3 end-to-end research workflows completed locally and three distinct SEC EX-99.1 financial-exhibit cases independently verified in production Chromium.
- GitHub CI passed the expanded automated suite covering original temporal rules, server-authoritative AI, decision dossiers, filed earnings exhibits, research briefs, and timing attacks.
- [Production Chromium proof](https://github.com/Iniwura/firstread/actions/runs/37903867098): pass for NVIDIA/Apple/Microsoft financial facts, time-locked replay, rules-only AI fallback, simulated offline abstention, and mobile no-overflow.

These are engineering observations, not user adoption or trading-performance metrics. No return, Sharpe, drawdown, fill, backtest, paper-trading, or profitability claim is made. No historical analyst-consensus snapshot is claimed because one was not provided as an as-of artifact.

## 4. Progress and limitations

Implemented: real Bitget Reality instrument/quote/candle/status/calendar reads; three SEC-filed EX-99.1 earnings exhibits with nine verified reported figures, SEC and issuer evidence objects; point-in-time visibility gates; completed-candle and gap audit; quantified evidence-and-market decision dossier (pre-decision drift, price range, freshness, gaps, missing consensus, hindsight-only results); deterministic baseline; source hashes; server-authoritative typed AI packet that rejects client evidence and invalid citations; responsive UI and natural-language question starters; automated CI, local API routes, tests, browser screenshots and deployment configuration.

Known limitations: NVIDIA’s issuer timing is only minute-approximate; Apple and Microsoft issuer pages are date-only and are held out of precision-sensitive issuer replay. The public Bitget MCP transport and catalog work, but its backend returned 503 for the tested equity queries. SEC requests from the production runtime can also fail, so filed-exhibit provenance is visible but direct live SEC retrieval is not claimed. The app has no account connection, order execution, trade recommendation, live funds, historical forecast archive, or claimed performance. Independent production Chromium verification passed across all three cases; live provider-based analysis still requires a server key.

## 5. Take on AI Trading

AI should compress and explain a source-grounded research packet, not manufacture certainty. A useful desk agent exposes what it saw, cites the exact evidence IDs, separates observation from inference, calls out missing forecasts and market-data caveats, and abstains when timing or source quality is insufficient. FIRSTREAD therefore keeps the deterministic temporal gate and rules baseline ahead of the optional model review.

## 6. Role of the LLM

The LLM receives only the typed packet assembled server-side after the as-of filter; it rejects client-submitted evidence packets. It may summarize visible facts, compare contradictions, propose what a human should investigate next, and choose among INVESTIGATE / WAIT / REJECT as a research posture. The server validates every returned evidence citation against the packet and rejects unknown IDs. It must not use future facts, claim a fill or return, turn an rToken move into an underlying-stock claim, or override the human decision. The integration is OpenAI-compatible and supports the Bitget hackathon Qwen endpoint when a server-side key is supplied; without a key it returns an honest not-configured state.

## Links and external submission status

- Repository: `https://github.com/Iniwura/firstread`
- Production demo: `https://firstread-psi.vercel.app/` (validated deployed version `dpl_5pyCtndFLevnW8JbrU8ZqDQboAvR`; independent Chromium passed with three earnings cases).
- Form checked, not submitted: `https://forms.gle/GyWZCMCPocgJdJon6`
- Required Bitget S2 promotional post to quote: `https://x.com/Bitget_AI/status/2100519318824055159?s=20`

Draft X **quote post** (requires explicit user approval before publication):

> An earnings release isn't a trading signal until you know what was available when the price moved. We built FIRSTREAD for @Bitget_AI: an evidence-timed rToken research desk using Bitget Reality candles, SEC filing timestamps, source receipts and transparent reasons to wait. Human makes the final call. https://firstread-psi.vercel.app/ #BitgetHackathon

Quote Bitget's designated S2 post: https://x.com/Bitget_AI/status/2100519318824055159?s=20

The project submission requires a complete description, role-of-LLM field, publicly accessible demo, repo/material links, compliant X quote post, and the user's actual Bitget UID/team identity. Select the university field only with confirmed eligibility. The October 11 X extension conflicts with an earlier October 8 form deadline. **Check whether the form accepts responses immediately; do not claim submission or extension without confirmation.**

See [EVALUATION.md](EVALUATION.md) for the full judge walkthrough, observed engineering proof boundaries, and external user-testing protocol.

## Engineering and source evidence

- Three SEC exhibits and the verified factual anchors: [`data/sec-exhibits.json`](data/sec-exhibits.json)
- Independent browser proof: [`PRODUCTION_PROOF.md`](PRODUCTION_PROOF.md)
- No-lookahead/adversarial tests: [`tests/`](tests/)
- Limitations and blind-user protocol: [`EVALUATION.md`](EVALUATION.md)
- The rules-only fallback is NOT a successful AI model demonstration; mark as pending until a live provider is configured and tested. See [AI_ACTIVATION.md](AI_ACTIVATION.md) for the exact secure setup and an opt-in automated real-model test.
