import { runResearch } from '../src/research-service.mjs';
import { validateModelCitations } from '../src/research-engine.mjs';

function modelText(body) {
  if (typeof body?.output_text === 'string') return body.output_text;
  return (body?.output ?? []).flatMap((item) => item.content ?? [])
    .map((part) => part.text ?? '').filter(Boolean).join('\n');
}

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body);
  return body ?? {};
}

/**
 * A browser can request a case and cutoff, but cannot provide evidence to the LLM.
 * Research is independently assembled server-side on every model call.
 * Dependency injection allows fully offline, adversarial tests.
 */
export function createAiHandler({ research = runResearch, transport = fetch, env = process.env } = {}) {
  return async function aiHandler(req, res) {
    const key = env.BITGET_QWEN_API_KEY || env.OPENAI_API_KEY;
    if (req.method === 'GET') {
      return res.status(200).json({ configured: Boolean(key), mode: 'server-verified-evidence', humanDecision: true });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    let body;
    try { body = parseBody(req.body); }
    catch { return res.status(400).json({ error: 'Invalid JSON request' }); }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Object request required' });
    }
    if (Object.hasOwn(body, 'packet') || Object.hasOwn(body, 'evidence')) {
      return res.status(400).json({ error: 'Client-provided evidence is not accepted; evidence is fetched and verified on the server.' });
    }

    const ticker = String(body.ticker ?? '').toUpperCase();
    const asOf = body.asOf;
    const question = body.question ?? 'What should a human investigate next?';
    if (!['NVDA', 'AAPL', 'MSFT'].includes(ticker) ||
        typeof asOf !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(asOf) ||
        !Number.isFinite(Date.parse(asOf)) ||
        typeof question !== 'string' || question.length > 500) {
      return res.status(400).json({ error: 'Specify a supported ticker, an exact UTC cutoff and a question of at most 500 characters.' });
    }
    if (!key) {
      return res.status(200).json({ configured: false, decision: 'NOT_CONFIGURED', message: 'Live AI review is not configured. The rules-only research and evidence receipt remain available.' });
    }

    let packet;
    try {
      const report = await research({ ticker, asOf });
      packet = report.aiPacket;
      if (!packet || !Array.isArray(packet.evidence) || !Array.isArray(packet.completedCandles)) throw new Error('Research evidence unavailable');
    } catch {
      return res.status(502).json({ configured: true, decision: 'ABSTAIN', message: 'The server could not independently verify this research request.' });
    }
    if (packet.evidence.length === 0 || packet.completedCandles.length === 0) {
      return res.status(200).json({ configured: true, decision: 'ABSTAIN', message: 'Insufficient time-verified evidence or completed pre-decision market data.' });
    }

    const isQwen = Boolean(env.BITGET_QWEN_API_KEY);
    const baseUrl = (isQwen ? (env.BITGET_QWEN_BASE_URL || 'https://hackathon.bitgetops.com/v1') :
      (env.OPENAI_BASE_URL || 'https://api.openai.com/v1')).replace(/\/$/, '');
    const model = isQwen ? (env.BITGET_QWEN_MODEL || 'qwen3.6-plus') : (env.OPENAI_MODEL || 'gpt-4o-mini');
    const system = [
      'You are FIRSTREAD, a source-constrained US equities research assistant, not an execution agent.',
      'Use only facts and time-verified candles from the supplied server-built packet; do not use external market knowledge.',
      'Provide four short sections: What is verified, What is missing, What could invalidate the thesis, Human next step.',
      'Cite exact evidence IDs in square brackets, e.g. [E2-NVDA], after factual assertions.',
      'A citation is required. Do not cite source IDs not in the packet. Separate observed facts from inference.',
      'Never claim beat/miss versus analyst consensus without a dated consensus record.',
      'Never present post-decision market movement as information knowable before asOf.',
      'Do not claim returns, executions, trading profitability or guaranteed results.',
      'Close with one research posture: INVESTIGATE, WAIT, or REJECT. The human decides.',
    ].join(' ');

    try {
      const response = await transport(baseUrl + '/responses', {
        method: 'POST',
        headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          model,
          max_output_tokens: 1100,
          input: [
            { role: 'system', content: [{ type: 'input_text', text: system }] },
            { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ question, packet }) }] },
          ],
        }),
      });
      if (!response.ok) return res.status(502).json({ configured: true, decision: 'ABSTAIN', message: 'AI provider request failed (HTTP ' + response.status + ').' });
      const data = await response.json();
      const answer = modelText(data);
      if (!answer || answer.length > 8000) return res.status(200).json({ configured: true, decision: 'ABSTAIN', message: 'AI response was missing or exceeded the safety limit.' });
      const validation = validateModelCitations(answer, packet.evidence.map((item) => item.id));
      const allBrackets = [...answer.matchAll(/\[([^\]]+)\]/g)].map((match) => match[1]);
      const known = new Set(packet.evidence.map((item) => item.id));
      if (!validation.valid || validation.citations.length === 0 || allBrackets.some((id) => !known.has(id))) {
        return res.status(200).json({ configured: true, decision: 'ABSTAIN', message: 'Model response had missing, unverified or future evidence references.', validation });
      }
      return res.status(200).json({ configured: true, decision: 'AI_REVIEW', answer, validation, provider: model, mode: 'server-verified-evidence', asOf });
    } catch {
      return res.status(502).json({ configured: true, decision: 'ABSTAIN', message: 'AI provider connection timed out or failed.' });
    }
  };
}

export default createAiHandler();
