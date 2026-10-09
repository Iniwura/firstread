# FIRSTREAD · Judge demo and independent evaluation plan

**Track:** Bitget AI Hackathon S2 → AI Trading Desk → Information Extraction & Signal Generation

**Core research question:** For an event-driven rToken trader, what can be established about an earnings disclosure at a selected historical time, what is missing, and which later observations must stay out of that decision?

## Five-minute demonstration

1. Open the public FIRSTREAD production alias in a fresh private browsing session, without Vercel login.
2. Select **NVDA**. Start just before the verified SEC acceptance timestamp (2026-08-26T20:21:19Z), then move the UTC cutoff to the SEC timestamp and run again.
3. Inspect the **What was knowable** receipt: NVDA's issuer schedule, SEC filing, and filed EX-99.1 are visible at the acceptance time. Confirm the attached **$96.2B** revenue and **$2.46** EPS source IDs. Move one second before SEC acceptance to confirm the SEC evidence disappears. Do not equate SEC acceptance with first public earnings disclosure.
4. Inspect the **Evidence-based decision brief**: issuer facts, conditions missing from the record, historical analyst consensus not available, and what a human must verify next. Then inspect the **Bitget Reality** chart: real RNVDAUSDT data, completed pre-decision candles and visually separate later observations. The post-cutoff price must not appear inside the AI packet.
5. Read **Where the thesis breaks**: measured pre-decision move, high/low range, data gaps and last-bar age, source precision, missing contemporaneous analyst expectations, and strictly hindsight-only movement.
6. Change to **AAPL** and **MSFT**. Confirm Apple revenue **$109.4B** and Microsoft revenue **$90.0B** both appear from their **SEC-filed EX-99.1** exhibits, while date-only original issuer webpages are not transformed into invented earlier release times.
7. With the live model configured, ask: “What is verified versus unknown at this cutoff? Cite the evidence.” The response must cite only packet IDs and explain uncertainty. With no key, the UI must visibly say live AI is not configured.
8. Copy the evidence receipt. Compare the timestamp, source IDs, evidence hash, and market endpoint references.

## Falsifiable research claims

| Claim | Procedure | Pass condition |
|---|---|---|
| No-lookahead isolation | Set a cutoff before a documented SEC filing; inspect visible evidence and AI input | Filing source not available to pre-cutoff model |
| Date precision is real | Examine AAPL and MSFT issuer source records | Date-only issuer publications excluded; SEC-filed EX-99.1 facts visible only at the documented SEC acceptance |
| Bitget market linkage | Trace rToken symbol and API source URL | Real RNVDAUSDT/RAAPLUSDT/RMSFTUSDT instruments; no fabricated bars |
| Outcome separation | Compare pre-market analysis with later chart results | Subsequent movement never provided to pre-decision LLM |
| Citation trust | Submit a forged evidence packet to /api/ai | Request rejected before model call |
| Provider honesty | Load without configured model credentials | App labels rules-only mode and does not display invented AI analysis |
| Research quality | Present an unavailable consensus estimate | App explicitly refuses to label earnings beat/miss |
| SEC exhibits | Review sources E3-NVDA, E3-AAPL and E3-MSFT | Correct issuer-reported figures are shown only from SEC acceptance; no fabricated first-public time |

## What is and is not measured

- **Engineering validation**: automated tests, live Bitget source probes, browser-smoke tests, time-boundary tests, simulated provider behavior. These must be accompanied by actual CI/test outputs.
- **Source coverage**: three historical SEC filing cases, three independently verified SEC EX-99.1 exhibits containing financial figures, and Bitget candidate Reality candle coverage. This is not an earnings-reaction success rate.
- **Model evaluation**: pending actual provider configuration and a repeatable, evidence-labeled prompt suite. Do not call mocked-provider tests a live model benchmark.
- **User validation**: pending five independent blind tasks (unless actually conducted). Do not invent participants, completion rates or testimonials.
- **Trading performance**: not applicable; FIRSTREAD does not execute or backtest trades. No Sharpe, PnL, portfolio results or outperformance claim.

## Five-tester protocol (fill only after real tests)

Give each tester a fresh demo link and the task: “For NVIDIA at the SEC filing acceptance time, identify one verified fact, one uncertainty, and one reason to wait before acting.” Do not give navigation hints.

Record tester identifier (non-sensitive), completion time, whether all three answers have valid sources, confusing UI elements, and whether the result changed the tester's interpretation. Summarize actual observed n/N, median completion time and most common failure mode. Record 'not conducted' rather than putting in placeholder scores.

## Production blockers

- **Live provider key:** add `BITGET_QWEN_API_KEY` and optionally `BITGET_QWEN_MODEL=qwen3.8-max`, or an OpenAI-compatible provider key, to Vercel encrypted production environment. Redeploy and verify a real cited answer. Never commit or share API keys.
- **Bitget MCP fundamentals:** documented transport/catalog pass, backend data call 503 during recorded feasibility probe. Do not count this as working fundamentals integration. Retest and preserve returned timestamps/status.
- **Competition cutoff:** Bitget's newer X post claimed October 11; its form audit reported October 8 at 23:59 UTC+8, with older site showing an earlier cutoff. Submission acceptance must be verified from the actual Google Form or organizer, never inferred from a running site.
- **X post and form:** user approval and identity/UID inputs required; no automatic posting or form submission.

## Source of truth

- [Bitget S2 developer handbook](https://bitget-ai.gitbook.io/bitgetai_hackathons2)
- [FIRSTREAD README](README.md)
- [Submission draft](SUBMISSION.md)
- [Real market feasibility](reports/bitget-feasibility.json)
- [Source feasibility](reports/source-feasibility.json)

## Verified engineering artifacts

- [Production Chromium test for all three SEC exhibits](https://github.com/Iniwura/firstread/actions/runs/37903207802)
- [Three SEC source exhibit records](data/sec-exhibits.json)
- [Independent production proof](PRODUCTION_PROOF.md)
- [Unit tests for no-lookahead and malicious SEC metadata](tests/sec-exhibits.test.mjs)
