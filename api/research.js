import { runResearch } from '../src/research-service.mjs';

export default async function handler(req, res) {
  try {
    const query = req.query ?? {};
    const payload = await runResearch({ ticker: query.ticker ?? 'NVDA', asOf: query.asOf });
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(502).json({ status: 'source_error', error: error.message, noLookahead: true, items: [] });
  }
}
