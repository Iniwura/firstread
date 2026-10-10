# FIRSTREAD · Final judge and production audit
Audit date: October 10, 2026. Refs are actual public GitHub Actions runs or public Bitget docs. This is a risk assessment, not a claim of a contest award.

## Competition fit and requirements

**Best-fit main track:** AI Trading Desk.
**Best-fit sub-theme:** Information Extraction & Signal Generation.
**Reason:** The human makes the final research decision; Qwen summarizes server-restricted earnings evidence and the app shows source and price context without placing trades.

Official S2 handbook: https://bitget-ai.gitbook.io/bitgetai_hackathons2
- Required: public accessible demo, one full question-to-actionable-insight research task, six-part project description in form, role of LLM, compliant X post `@Bitget_AI` + `#BitgetHackathon`, official Google Form receipt.
- University Special Prize: eligible entries may enter their full university name (competing for 10 prizes). Demo Day is opt-in. Both require a valid submission.
- Deadline conflict: official handbook says Sept 27; form still said Oct 8, 23:59 UTC+8 when read on Oct 10; later user-cited social announcement mentions Oct 11. Organizer confirmation or actual form success is needed, not guesswork.

## Observed engineering evidence

- Current production URL: https://firstread-psi.vercel.app/
- Latest production code at audit start: `09ac224f8ed6983377879ab82f30e49fb57ea90f`; Vercel READY `dpl_Ffe8z8fSpUtcQZSHvjBZZXYE254U`.
- [66 automated tests PASS](https://github.com/Iniwura/firstread/actions/runs/38035374514).
- [Anonymous production Chromium PASS](https://github.com/Iniwura/firstread/actions/runs/38035374550): all three SEC cases, Bitget source reconciliation, no-lookahead, mobile, offline abstention and onboarding.
- [Real production Qwen PASS](https://github.com/Iniwura/firstread/actions/runs/38035417592): `qwen3.8-max`, `AI_REVIEW`, valid primary SEC citation `[E3-MSFT]`. This is ONE successful real model case, not a broad truthfulness benchmark.
- [Updated captioned real-user-interface recording PASS](https://github.com/Iniwura/firstread/actions/runs/38040053030), including an actual SEC/MSFT-cited Qwen response; recorded by a headless browser, NOT external people.
- Tested Bitget Equity MCP reconciliation: NVIDIA $269M independent operating-income discrepancy disclosed; Apple cumulative record rejected as incomparable to SEC standalone Q3; Microsoft three quarterly lines agree. No vendor data from today enter the reconstructed 2026 model packet.
- Public API status reveals no secret. The model endpoint rejects client-injected evidence packets (HTTP 400) and date-only timestamps (HTTP 400). Citation IDs are validated against the server-built visible packet. 
- [Independent final judge accessibility/security audit](https://github.com/Iniwura/firstread/actions/workflows/final-judge-audit.yml) screens anonymous homepage and desk in 1440px desktop and 390px mobile for WCAG 2/2.1 A/AA serious/critical violations, public horizontal overflow and forged evidence acceptance. Its results must be consulted after the final deployment.

## Known limitations and caveats, to state to judges

1. The workflow covers **three** case studies (NVIDIA, Apple, Microsoft), not a universal earnings ingestion platform.
2. SEC exhibit acceptance is a filing availability anchor, **not** a verified first public earnings release; press releases may have occurred before acceptance. Publisher dates without precise timestamps cannot be backfilled as exact times.
3. Historical analyst consensus records are unavailable. FIRSTREAD cannot prove a beat/miss against contemporaneous expectations.
4. Historical market data are hourly Bitget Reality rToken candles, not tick-level native-stock price history. Completed-candle and future-data guards matter.
5. Public SEC requests can be intermittently blocked; filed source provenance and independent document checks are shown separately from request success.
6. Model response source-ID validation prevents unknown citation IDs but **does not prove the numerical accuracy of every natural-language sentence**. Users must verify against the source-linked SEC table. Qwen may still time out under load.
7. One independently verified live model run is not sufficient for statistical accuracy or repeatability claims. No independent human participants have yet been recorded; no success rate, trading profitability, Sharpe, real order, or user adoption is claimed.
8. The AI endpoint is intentionally public for a no-login demo; requests consume Bitget provider credits. Monitor account usage and set budget/quota controls through Bitget/Vercel as available. No production-grade distributed per-IP rate limiter has been verified.
9. Node.js `url.parse()` deprecation warnings have been observed on research and reconciliation endpoints. They are noisy but are not equivalent to verified failed research responses; a dependency migration can be planned separately.
10. GitHub Actions MP4 artifacts are NOT a substitute for an anonymously viewable streaming video. Publish the verified video at an X/YouTube/Loom public URL and test logged out.

## GO / NO-GO

- **Engineering/demo: GO** based on the 66 tests, live model and production browser, subject to the latest accessibility release audit.
- **Submission eligibility: NO-GO until verified**: actual Bitget UID and complete form fields, accessible materials/video, required compliant X post, and successful form receipt.
- **Winning probability: not measurable or guaranteed.** Best differentiator is SEC-time-locked rToken research with trustworthy abstention and source discrepancy reporting. Scoring weaknesses are breadth (only three company cases), limited provider sampling, no real-user completion metrics and a still-narrow natural-language workflow. Do not add unverified features merely to claim breadth.

## Required owner actions

1. Make the compliant X quote post and keep the live post URL.
2. Upload the new validated demo MP4 to a public viewable location, keep the link.
3. Enter the six-part project description, LLM role, correct Bitget UID and public URLs in the official form; check university eligibility and Demo Day.
4. Submit immediately if the form accepts a response; preserve the receipt, and ask Bitget ops to clarify the conflicted deadline if acceptance is uncertain.
5. Monitor public Qwen credits/budget and document actual external user testing when performed.

See [SUBMISSION.md](SUBMISSION.md) for paste-ready form copy and all proof URLs.
