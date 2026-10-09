# FIRSTREAD · Independent user validation

This is a ready-to-run **five-person evaluation protocol** for the Bitget AI Hackathon. No participants have been reported or invented. The project owner must invite real people and preserve their answers.

## The task (give each participant exactly this)

Open https://firstread-psi.vercel.app/ in a new private/incognito browser window.

> You are considering trading a tokenized US stock after earnings. Use FIRSTREAD to investigate NVIDIA's Q2 FY2027 results at the SEC filing timestamp. Without external research, find (1) a financial figure and its primary evidence, (2) a company-specific reason the headline could mislead, and (3) a reason FIRSTREAD might tell you to wait. Change the replay to BEFORE the filing and explain what disappears. Lastly, use Reconcile SEC ↔ Bitget and tell us whether every source agrees.

Do not coach testers. Ask them to narrate where they click and what confuses them.

## Record observed results, not hopes

Keep one row per actual participant in a private testing log, collecting:
- Anonymous participant identifier (e.g. T01), device category and new/existing trading-research experience.
- Session date/time and total duration.
- Completed all five substeps without assistance? Yes/No.
- Quoted a valid **E3-NVDA SEC** source for the financial figure? Yes/No.
- Correctly identified at least one risk about China's exclusion from guidance, AI infrastructure growth, or missing analyst consensus? Yes/No.
- Correctly recognized that the earlier replay excludes the SEC source? Yes/No.
- Correctly identified that SEC operating income and Bitget MCP differed by **$269 million**, while revenue/EPS agree? Yes/No (if MCP available).
- First confusing point, exact user's own words, and whether the issue prevented completion.
- Single highest-impact suggestion from the participant.

After five genuine participants, compute and report actual task success `n/5`, median time (based on actual durations), and top issue counts. If fewer than five participated, report `n/N` for actual N; do not claim 5/5.

## Acceptance and triage

A usability failure is severe if a new visitor cannot select a company, understand the time cutoff, identify a primary filing link, or distinguish a current MCP cross-check from as-of evidence.

When fixing:
1. Keep the underlying test recording as evidence.
2. Reproduce the UI issue on the current production build.
3. Fix only the demonstrated problem.
4. Run GitHub unit/build CI and independent production-browser checks.
5. Record the exact commit and URL.

Do not send test results containing private account or trading identifiers to the competition.

## Distinction from automation

The passing [63-test CI suite](https://github.com/Iniwura/firstread/actions/runs/37928108573), [production Chromium proof](https://github.com/Iniwura/firstread/actions/runs/37928241804) and [captioned demo](https://github.com/Iniwura/firstread/actions/runs/37927622231) verify engineering, NOT human comprehension. A video script is not a genuine tester.

The Qwen model research test is still separate: see [AI_ACTIVATION.md](AI_ACTIVATION.md).
