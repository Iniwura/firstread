# FIRSTREAD · Bitget AI Hackathon S2 submission packet
Updated: October 10, 2026

**Verified:** Working public app, SEC/Bitget rToken research and reconciliation, first-visit guided tour, real source-cited Bitget Qwen response, 66 automated tests, production-browser pass, freshly recorded real-browser demo.

**Not verified:** Published compliant X quote post, Google Form acceptance/receipt, independent human tester outcomes, organizer confirmation of a new deadline. These are not represented as completed.

## Submission fields

**Project name:** FIRSTREAD

**Main track:** AI Trading Desk (AI Research Workbench)

**Sub-theme:** Information Extraction & Signal Generation

**Demo / research desk:** https://firstread-psi.vercel.app/desk.html

**Editorial homepage:** https://firstread-psi.vercel.app/

**Open-source repository:** https://github.com/Iniwura/firstread

**Read-only, real-data demo recording:** https://github.com/Iniwura/firstread/actions/runs/38040037762 (artifact: FIRSTREAD-captioned-product-demo; download and publish the MP4 to a publicly accessible video host before submission).

**Real Bitget Qwen validation:** https://github.com/Iniwura/firstread/actions/runs/38035417592

**Current production browser verification:** https://github.com/Iniwura/firstread/actions/runs/38035374550

**Automated tests:** https://github.com/Iniwura/firstread/actions/runs/38035374514 (66 passed).

**Independent SEC × Bitget fundamentals proof:** https://github.com/Iniwura/firstread/actions/runs/37927430868

### Project Description — six parts for the form

**1. Thesis.** FIRSTREAD tests whether a trader can make a better-informed human research decision when every fact is governed by when its source became verifiably available. Earnings dashboards often mix current knowledge, completed historical price candles and later outcomes. FIRSTREAD reconstructs a cutoff-qualified evidence set from real SEC filings and Bitget Reality rToken prices, then gives the trader explicit source receipts and reasons to INVESTIGATE, WAIT or REJECT. SEC filing acceptance is treated conservatively as the availability of the filed exhibit, **not** the first time an earnings announcement became public.

**2. Target user and value.** An event-driven retail or advanced rToken researcher trading or researching tokenized NVIDIA, Apple or Microsoft, with roughly $1,000–$25,000 in relevant capital exposure and one to five event analyses weekly. This is a **target segment**, not measured user adoption. The product helps avoid using future observations in historical decisions, confusing incompatible reporting periods, and treating missing consensus estimates as proven earnings surprises. The human makes the final call; there is no account connection or execution.

**3. Validation and observed metrics.** Three genuinely SEC-filed EX-99.1 earnings records are individually source-identified: NVIDIA (Q2 FY2027), Apple (Q3 FY2026) and Microsoft (Q4 FY2026). Their matched Reality symbols RNVDAUSDT, RAAPLUSDT, RMSFTUSDT have real historical one-hour candle coverage at the selected SEC anchors. Programmatic tests exercise source timestamps, incomplete/future candle exclusion, financial year-on-year arithmetic, malicious/unknown LLM citations and server-built evidence packets. Latest verified result: **66/66 automated tests passed**; public desktop/mobile browser checks passed; and a real `qwen3.8-max` response passed source-citation validation with `[E3-MSFT]`. In the live Bitget fundamentals reconciliation, NVIDIA revenue and EPS matched SEC but operating income differed by $269M; Apple returned a cumulative vendor period unsuitable for SEC standalone Q3 comparison; Microsoft SEC Q4 lines agreed with the matching vendor quarter. FIRSTREAD discloses these differences rather than forcing agreement. **No independent human user trials or profitability figures are claimed.** Next validation target: five independent first-visit research tasks, tracked without invented results.

**4. Progress and limitations.** Built: public editorial introduction, guided research desk, replayable SEC acceptance cutoff, three source-grounded earnings comparisons, pre-decision market charts, after-cutoff price segregation, completeness/gap audits, deterministic research posture, independent current-day Bitget MCP comparison, source hash receipt and working optional Qwen analysis. The backend rebuilds the AI packet independently; the browser cannot supply facts to the model. Responses with absent/unknown evidence IDs abstain. Limits: only three fixed companies; market candles are one-hour intervals, not tick data; genuine historical analyst consensus is not available; earlier issuer publication may predate the SEC filing; some SEC/issuer sites resist live automated retrieval; Qwen citation validation does not mathematically prove every prose statement. Public AI calls consume limited provider credits, so operating limits should be monitored.

**5. Deliverables.** Working no-login app; public GitHub repo with reproducible Node tests and source data; first-visit tour; engineering/proof notes; real provider proof; independent production-browser proof; fresh captioned product walkthrough. Links are given above. The MP4 should be placed at a stable public viewing URL in this form before final submission.

**6. View on AI Trading.** AI research is useful when it can identify source-backed financial drivers and uncertainty, challenge assumptions, and recommend a human next research step. It should never fabricate unavailable consensus, imply a historical price move was knowable before a filing, or silently transform commentary into a live order.

### Role of the LLM in Your Project — separate form field

FIRSTREAD uses **Bitget Hackathon Qwen 3.8 Max** for a constrained natural-language research review. A user asks about earnings, risk, missing information or the next investigation step. The server rebuilds a typed, timestamp-filtered research packet of permitted SEC/issuer evidence, financial comparisons and completed historical Bitget Reality candles. Qwen receives this packet, drafts source-cited explanations of year-over-year changes, business drivers, opposing thesis and a human research posture. The backend checks that cited evidence IDs were present before the decision cutoff; invalid or missing references cause the model analysis to abstain. Current live verification demonstrates a real Qwen response citing Microsoft's SEC Exhibit 99.1 `[E3-MSFT]`. Qwen cannot order, connect accounts or override the human research decision. Citation existence alone is not a guarantee of perfect factual accuracy; the underlying SEC evidence and numbers remain available for independent verification.

## Unfinished external actions — mandatory before eligible submission

1. Publish a substantive X **quote post** of https://x.com/Bitget_AI/status/2100519318824055159?s=20 introducing FIRSTREAD with `@Bitget_AI`, `#BitgetHackathon`, and the live demo URL. Keep the actual resulting X post link.
2. Download the demo MP4 from the GitHub Actions artifact and place it where judges can view it **without a GitHub login** (X video, public YouTube or public Loom link). Confirm viewability anonymously.
3. Open https://forms.gle/GyWZCMCPocgJdJon6, fill in the complete Project Description **inside the form**, role-of-LLM field, public submission links, X post link, matching Bitget UID and true team details. If eligible as a university entrant, enter your full school name and consider opting into Demo Day.
4. Submit and retain the success confirmation/receipt. Field visibility alone does **not** confirm entry acceptance.
5. Check the deadline urgently with Bitget. The public S2 handbook lists September 27; the form read by Chromium on October 10 still printed **October 8 23:59 UTC+8**, whereas a later social announcement had indicated October 11. These remain unresolved; do not assume the newer time was applied.

## Reproducible judge walkthrough

Open `/desk.html` in a private/incognito browser session. Follow the first-visit tour. Select NVIDIA and move the decision clock to **15 minutes before** its SEC acceptance to see the filed exhibit withheld. At the exact cutoff, verify the source ID `E3-NVDA`, financial year-on-year comparisons and Bitget Reality price chart; later price movements are presented separately. Run the current Bitget Equity MCP source check and examine the discrepancy. Switch to Microsoft, set **+2h** after SEC acceptance, and ask Qwen to identify two filed figures, missing dated consensus and the next human research step. Verify the answer cites `[E3-MSFT]`. Copy the reproducible research receipt. This is research, not trade execution or an investment recommendation.

Additional details: [EVALUATION.md](EVALUATION.md), [PRODUCTION_PROOF.md](PRODUCTION_PROOF.md), [AI_ACTIVATION.md](AI_ACTIVATION.md), [USER_TEST_PROTOCOL.md](USER_TEST_PROTOCOL.md).
