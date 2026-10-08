import { getCases } from '../src/research-service.mjs';

export default function handler(_req, res) {
  res.status(200).json({ cases: getCases().map(({ ticker, company, event, secAcceptedAt, source, sourceDocument, release, symbol }) => ({ ticker, company, event, secAcceptedAt, source, sourceDocument, release, symbol })) });
}
