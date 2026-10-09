# FIRSTREAD · Activate and verify live AI

The public FIRSTREAD app intentionally displays **rules-only mode** until a real server-side AI provider is configured. The source-grounded research workflow works without a key; that is not proof of LLM capability.

## 1. Add private provider credentials (project owner)

In the **firstread** Vercel project, visit **Settings → Environment Variables**.

Recommended for the Bitget hackathon:

| Name | Setting |
|---|---|
| `BITGET_QWEN_API_KEY` | The actual private Bitget hackathon Qwen token |
| `BITGET_QWEN_MODEL` | `qwen3.8-max` (optional; code default) |
| `BITGET_QWEN_BASE_URL` | `https://hackathon.bitgetops.com/v1` (optional; code default) |

Mark the key **Sensitive** / **Encrypted** and target **Production**. Never put the value in source code, GitHub, chat, screenshots or issue logs.

If Qwen access was not granted, supported fallback is `OPENAI_API_KEY` with optional `OPENAI_MODEL` and `OPENAI_BASE_URL`. Do not configure an undocumented fake Qwen key or claim provider credits.

Redeploy the **firstread** project after adding the key. The `/api/ai` GET response must then show `configured: true`.

## 2. Verify actual model intelligence

Go to [GitHub Actions → FIRSTREAD live AI proof](https://github.com/Iniwura/firstread/actions/workflows/live-ai.yml) and select **Run workflow**. This only calls the public production API and cannot access the secret.

It submits an authentic question about Microsoft FY2026 Q4 SEC-accepted earnings, using the historical cutoff `2026-07-29T22:04:53.000Z`. Success requires:

- Model response comes from a real configured provider, not a rule-based fallback.
- `decision === AI_REVIEW`, with non-empty natural-language answer.
- Server validates returned source IDs against time-qualified evidence.
- The answer cites SEC-filed Exhibit 99.1 as `[E3-MSFT]`.
- Model never receives post-cutoff candles or browser-supplied evidence.
- No trade orders, fabricated consensus estimates, performance claims or secrets are included.

If the provider returns an HTTP failure, timeout, no citations, or invalid citations, the verification must **fail**. Debug based on the recorded HTTP status and model API documentation; do not bypass evidence validation to force a pass.

The equivalent direct check is `npm run verify:ai` from a clone with internet access. It does not need a local API key. Report only observed success/failure.

## 3. Complete independent user research

The next uncompleted proof is **five genuine first-visit research tasks**, not simulated users. Follow the task script in [EVALUATION.md](EVALUATION.md). Report outcomes only after the people actually use the live app. Zero unrun tests should be claimed as user completion.

## 4. Submission gate

An accessible demo and a published X quote-post are required by the Bitget S2 handbook. The official form was still fillable on October 9 but still printed the outdated October 8 cutoff. The October 11 extension requires organizer or successful form confirmation.

Before submission, add your actual team details and Bitget UID. Publish the X post only with your explicit approval and include the valid X URL. No submission was made by this repository work.

**Do not call FIRSTREAD fully live-AI-verified until step 2 passes.**
