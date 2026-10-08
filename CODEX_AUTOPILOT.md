# FIRSTREAD — Codex autonomous implementation assignment

You are the implementation agent for FIRSTREAD, a Bitget AI Hackathon Season 2 competition entry, as of October 8, 2026. We target submission by October 10, leaving October 11 for buffer. The team is aiming to win; make technical validity and demo quality visible. Work in the user's actual local WSL directory; DO NOT assume commands, versions, paths, tool or API flags. Inspect the installed tools and docs first. User favors one fully autonomous Codex execution instead of repeated checkpoints.

## Verified competition constraints
- Primary: AI Trading Desk → Information Extraction & Signal Generation.
- Scoring: subjective on feature depth, effectiveness of data/Skill integrations, research quality, natural-language UI, and personalized thesis.
- Must have an accessible full research workflow demo (question → insight; human decides), project thesis, exact role of LLM, validation data or clearly labeled validation plan, and compliant X promotional post (tag @Bitget_AI, #BitgetHackathon, quote the specified Bitget announcement).
- Current written handbook has outdated September 27 deadline, Bitget's newer X announcement says October 11. Check current submission form acceptance ASAP; do not claim confirmed until verified.
- University special prize requires full eligible university name in form. Submission must be user-approved; do not fabricate enrollment or submit without approval.

## Product thesis
Who: retail and active rToken traders researching US-stock earnings, primarily NVDA/AAPL/MSFT.
Question: After this corporate disclosure, what changed versus existing evidence, what can be known at this decision time, what did Bitget's rToken price do, what risks or conflicting facts remain, and should the human investigate, wait, or reject a trade idea?
Key differentiator: provable point-in-time evidence isolation, with an interactive historical time-lock control. At no point include future filings/transcripts/forecasts/candle closes in an earlier replay.

## Phase 0 — falsifiable technical gate (do FIRST)
1. Install no frontend packages yet. Run `npm test` and `npm run probe` using Node >=20 with HTTPS access on user's WSL.
2. Inspect `reports/bitget-feasibility.json`. Confirm real Reality instruments and actual candles for NVDA/AAPL/MSFT surrounding each earnings SEC anchor. If fewer than three are supported, use alternative *verified* company events and instruments, never fake three cases.
3. Independently verify the time of FIRST PUBLIC earnings announcement rather than blindly treating SEC acceptance as the start. If only filing acceptance is established, label replay 'SEC filing availability' and do not claim initial market response.
4. Check the current submission form and official developer guide. Report whether extension is confirmed, and exact time zone/cutoff if published.
5. Determine which of Bitget MCP and Reality fundamentals APIs are publicly reachable and the actual returned schema. Cache raw metadata with fetchedAt and URLs, never hardcode mock results as real.
STOP concept expansion if the core sources fail. Pivot to live source-grounded research desk, but keep no-lookahead guarantee. Only once passing gates move to UI.

## Phase 1 — core engine
1. Evidence objects: sourceURL, publisher, company ticker, documentID, publishedAt, firstObservedAt, retrievedAt, sections, facts and quote locations. Timestamp precision and provenance are explicit. Exclude unknown or date-only first-availability records from precision-sensitive replays.
2. SEC 8-K original filing/exhibits, official issuer IR releases, Bitget Reality prices, US stock fundamentals via Bitget MCP; optionally Bitget Signal Skills when demonstrably useful.
3. Implement typed interface between deterministic financial validators and LLM narrative/extraction. Use AI for actual structured reasoning; do not label rule-based generation as AI. Validate LLM claims against retrieved evidence and abstain when insufficient.
4. Price replay: only completed candles before asOf are visible. Separate quoted rToken market reaction from underlying US-stock. Audit stale candles, unavailable sessions, volume holes, currency, splits and fee/slippage assumptions.
5. Generate comparison baseline (rules-only), plus sourced risk, contradiction, confidence and decision checklist. Human makes final call; no account, live funds or order execution necessary.
6. Tests: lookahead attempts, malformed documents, missing forecast evidence, quote freshness, future candles, price gaps, model extraction that cites nonexistent sources, deterministic abstention.

## Phase 2 — high-quality product interface
Only after tests: build distinctive, polished, fast, mobile-responsive full app. No generic AI gradient visuals. Strong editorial finance-terminal identity; accessible typography, warm restrained palette. Must show a complete scripted but REAL-DATA-backed research path, live ingestion status, multiple company events, as-of time scrubber, sourced evidence with clickable primary links, market response, contradictions, decision card, reproducible receipts and transparent caveats. Judge should understand value without keys/login. Include usable loading/failure/empty states. Keep visual choices consistent with the product.

## Phase 3 — validation / delivery
- Real integration tests and report for >=3 earnings workflows.
- UI tests, tests + typecheck + lint + build, preview/browser checks, mobile sanity, bad network state and fresh visit flow.
- Public GitHub, deployed Vercel production demo, honest proof screenshots/video, substantial README, architecture, limitations, tested source refs.
- 5+ independent blind task walkthroughs if genuinely possible; report observed tester counts and results only, not invented claims.
- Prepare competition six-part description, role-of-LLM description, X promo draft, links and a separate submission checklist. Do NOT post X or submit the form without user's explicit approval.
- Never claim the finished site works unless browser-verified; never claim deployed until production URL returns expected content.

## Output discipline
Track exact versioned commits, URLs, tests and evidence. Report what was achieved and what is blocked. Continue independently to completion as far as permissions allow; do not stop after scaffolding. Never reveal keys, wallets, private settings or other secrets.
