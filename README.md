# FIRSTREAD

FIRSTREAD is an evidence-first market and research workspace. It reads live public Bitget market data, lets a user set an as-of cutoff for research, and passes only the dated evidence set to an optional OpenAI Responses API synthesis step.

## Current scope

- Live Bitget public market data for spot ticker, one-minute candles, order book, and exchange time.
- Point-in-time research via Google News RSS with publication-time filtering, retrieval timestamps, and SHA-256 evidence hashes.
- Optional AI synthesis through `OPENAI_API_KEY`; the UI is explicit when the provider is not configured.
- No trading, private account access, backtest, return, or performance claims.

The requested `CODEX_AUTOPILOT.md` was not present in the supplied workspace, so this implementation follows the explicit objective and records that missing-handbook assumption rather than pretending handbook compliance.

## Run locally

The project is deployable as a zero-build Vercel project. For local static preview, use any HTTP server from this directory. The `/api` functions require a Vercel runtime or a compatible serverless adapter.

```bash
npm test
npm run test:live
```

Set `OPENAI_API_KEY` in the deployment environment to enable synthesis. Optionally set `OPENAI_MODEL` to choose a compatible Responses API model.

## Evidence contract

Market responses include `capturedAt` and exchange time. Research responses include `asOf`, `retrievedAt`, source URLs, publication timestamps, `evidenceStatus`, and `contentHash`. Future-dated source items are excluded from the returned evidence set.
