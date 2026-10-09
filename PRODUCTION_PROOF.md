# FIRSTREAD production verification · October 9, 2026

**Purpose:** independently document the current deployed behavior, not just the author's local test results.

## Anonymous production browser

- Public URL: https://firstread-psi.vercel.app/
- GitHub Actions runner: [production Chromium verification](https://github.com/Iniwura/firstread/actions/runs/37928241804)
- Result: **PASS**, zero recorded browser test failures. The combined tests exercise all three companies, research briefs, chart and temporal controls, mobile rendering, no-key fallback, and a simulated network failure.
- Title: `FIRSTREAD — Evidence before reaction`.
- Filing replay: `3 visible · 0 held out` at the NVIDIA SEC acceptance cutoff (issuer schedule, SEC 8-K acceptance, SEC Exhibit 99.1).
- Research dossier: `CAUTION · 1 unresolved checks · 12 completed pre-decision candles`.
- NVIDIA filed earnings figures visible: revenue `$96.2B`, GAAP EPS `$2.46`, Q3 outlook `$108.0B ±2%`.
- Apple filed earnings figures visible despite date-only publisher release: revenue `$109.4B`, EPS `$2.02`, gross margin `50.1%`.
- Microsoft filed earnings figures visible despite date-only publisher release: revenue `$90.0B`, GAAP EPS `$4.81`, Azure `+43% YoY`.
- Browser verified filed figures were linked to source ID `E3-NVDA`, `E3-AAPL`, `E3-MSFT`; finance records were excluded before SEC acceptance under adversarial unit tests.
- AI without provider key: truthful not-configured fallback verified.
- Simulated network failure: `ABSTAIN`.
- Narrow mobile viewport: no horizontal overflow.
- Screenshots: workflow artifact `firstread-production-browser`.

The production browser captured a source-status caveat: `Issuer page access caveat · SEC source unavailable`, reflecting that primary-source webpages were not directly fetched by the server in that run. The exhibit data and links were independently verified against SEC EDGAR; first-public earnings timestamps are not claimed. The browser test confirms real app behavior at the tested time. It does not prove a live Qwen response, market profit, historical analyst consensus, user adoption, or acceptance of an external submission.

## Automated research proof

- [Latest quality run](https://github.com/Iniwura/firstread/actions/runs/37928108573): **63/63 passed**, zero failed; JavaScript syntax and static build checks also passed.
- Server-authoritative AI packet tests isolate input, exclude future price candles, and reject client evidence and invalid source IDs.
- Public production at this proof date: Vercel deployment `dpl_CrdhZcbkdDTpNkTVvkPLMGixisF2`, browser code commit `260ddfcc97155588b3b0b5d5a6a0395e2d681029`; canonical URL remains `https://firstread-psi.vercel.app/`.
- No AI provider key was configured in the project during the test; this is not a real LLM response benchmark.

## Source reconciliation and data correctness

Bitget's public US equity MCP is working after an earlier 503 outage. [Current provider schema study](https://github.com/Iniwura/firstread/actions/runs/37926356094) independently confirmed company profile, financial income statements, ratios and quote data. These are current records retrieved on October 9, NOT first-observed historical evidence.

The [live SEC-to-Bitget reconciliation proof](https://github.com/Iniwura/firstread/actions/runs/37927430868) reports:
- **NVIDIA**: revenue and EPS agreed with the SEC exhibit; operating income differed by $269M and is flagged for source-definition review.
- **Apple**: the sampled third-quarter vendor record is **cumulative**, so it is marked **INCOMPARABLE_PERIOD** instead of a false mismatch.
- **Microsoft**: a standalone fourth-quarter vendor statement matched revenue, operating income and EPS; annual totals were excluded.

The [production Chromium proof](https://github.com/Iniwura/firstread/actions/runs/37928241804) exercised all three reconciliations, earnings comparisons, temporal controls, simulated no-network fallback, and mobile responsiveness. The browser returned **pass=true**, **failures=[]**. Current vendor records are not included in the as-of LLM packet.

## Submission-form status (read-only)

The same workflow opened the official public form without providing answers or submitting.

- Form URL: https://forms.gle/GyWZCMCPocgJdJon6
- Public form title: `Bitget AI Trading Competition Submission Form`
- Visible form fields and a Submit control were detected.
- The form's own introduction still states `The submission deadline is October 8, 23:59 (UTC+8)`.
- Status: **FORM_FIELDS_VISIBLE_NOT_PROOF_OF_ACCEPTANCE**. That cutoff is in the past on October 9.

A newer official Bitget X announcement screenshot supplied by the builder said October 11; the form and handbook have not consistently reflected that extension. The organizer or successful completion receipt must resolve eligibility. The workflow did **not** submit the form.

## Pending mandatory proof

1. A real provider-backed AI research answer with source citations, after a key is set privately in Vercel.
2. Five genuine independent research-task trials if achievable, with actual counts and failures.
3. Submission acceptance or direct organizer confirmation of the October 11 extension.
4. Correct X quote-post and project form receipt.

Do not claim a grand-prize win, trading performance, or user adoption without evidence.
