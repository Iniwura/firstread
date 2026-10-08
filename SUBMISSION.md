# FIRSTREAD submission materials

Status: implementation and local verification complete; public acceptance, form submission, and open production access remain unconfirmed.

## Track

AI Trading Desk → Information Extraction & Signal Generation.

## 1. Thesis

FIRSTREAD is an evidence-timed earnings desk for Bitget Reality rTokens. It helps a human trader answer a narrower and safer question than “what should I buy?”: what was actually knowable at an exact decision time, what did the relevant rToken market show afterward, which source conflicts remain, and should the next posture be INVESTIGATE, WAIT, or REJECT?

## 2. Target user and value

The target user is an active retail or VIP rToken trader with moderate-to-high risk tolerance, roughly $1,000–$25,000 of capital, and one to five event-driven research decisions per week. FIRSTREAD reduces the risk of mixing a later filing, a future candle, or a date-only issuer page into an earlier decision. It gives the user a readable evidence receipt, a rules-only baseline, market-response context, and a constrained optional AI review while preserving the human final call.

## 3. Validation data and observed results

The data pipeline uses live public Bitget Reality REST endpoints, SEC filing anchors, and primary issuer pages. The recorded feasibility probe found real online instruments and one-hour candle histories for `RNVDAUSDT`, `RAAPLUSDT`, and `RMSFTUSDT` near their SEC acceptance anchors. The source probe initialized Bitget’s public equity MCP transport and discovered its equity catalog; live MCP backend queries returned 503 during the probe and are recorded as unavailable rather than replaced with invented fundamentals.

Observed engineering results:

- 3/3 candidate Reality instruments discovered with candle coverage near SEC anchors.
- 3/3 end-to-end live research workflows completed locally.
- 13/13 temporal/research tests passing.
- Chromium desktop and narrow-mobile smoke checks passing, with case switching, date-only evidence holdout, simulated offline abstention, and no console errors.

These are engineering observations, not user adoption or trading-performance metrics. No return, Sharpe, drawdown, fill, backtest, paper-trading, or profitability claim is made. No historical analyst-consensus snapshot is claimed because one was not provided as an as-of artifact.

## 4. Progress and limitations

Implemented: real Bitget Reality instrument/quote/candle/status/calendar reads; SEC and issuer evidence objects; point-in-time visibility gates; completed-candle and gap audit; deterministic rules-only baseline; evidence IDs and integrity hash; typed AI packet; responsive full UI; local API routes; tests; browser screenshots; README and deployment configuration.

Known limitations: NVIDIA’s issuer timing is only minute-approximate; Apple and Microsoft issuer pages are date-only and are held out of precision-sensitive issuer replay. The public Bitget MCP transport and catalog work, but its backend returned 503 for the tested equity queries. The app has no account connection, order execution, trade recommendation, live funds, historical forecast archive, or claimed performance. The local verification is real; final judge-accessible production verification still depends on deployment access.

## 5. Take on AI Trading

AI should compress and explain a source-grounded research packet, not manufacture certainty. A useful desk agent exposes what it saw, cites the exact evidence IDs, separates observation from inference, calls out missing forecasts and market-data caveats, and abstains when timing or source quality is insufficient. FIRSTREAD therefore keeps the deterministic temporal gate and rules baseline ahead of the optional model review.

## 6. Role of the LLM

The LLM receives only the typed packet assembled after the as-of filter. It may summarize visible facts, compare contradictions, propose what a human should investigate next, and choose among INVESTIGATE / WAIT / REJECT as a research posture. The server validates every returned evidence citation against the packet and rejects unknown IDs. It must not use future facts, claim a fill or return, turn an rToken move into an underlying-stock claim, or override the human decision. The integration is OpenAI-compatible and supports the Bitget hackathon Qwen endpoint when a server-side key is supplied; without a key it returns an honest not-configured state.

## Links and external submission status

- Repository: `https://github.com/Iniwura/firstread`
- Production demo: `https://firstread-psi.vercel.app/` (final deployment `dpl_E5or9WbFhY9adFg9EuSLSHnUKGkR`; anonymous HTTP and Chromium checks returned 200/pass from the verification environment).
- Form checked, not submitted: `https://forms.gle/GyWZCMCPocgJdJon6`
- Required Bitget interaction post to quote/reply: `https://x.com/Bitget_AI/status/2062506424085917944?s=20`

Draft X post (requires explicit user approval before publication):

> We built FIRSTREAD for Bitget AI Trading Desk: an evidence-timed earnings research desk for Reality rTokens. It separates what was knowable at a decision time from later filings and future candles, shows the actual rToken response, and keeps AI constrained to cited evidence. Demo: https://firstread-psi.vercel.app/ Repo: https://github.com/Iniwura/firstread #BitgetAI #AITrading

The current form text showed an October 8, 23:59 (UTC+8) deadline while the official activity page showed an earlier timeline. Team identity, Bitget UID, university, acceptance, extension, and successful form submission are not invented here. The user must confirm those fields and submit externally if desired.
