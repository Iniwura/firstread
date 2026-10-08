import { validateModelCitations } from '../src/research-engine.mjs';

function outputText(body) {
  if (typeof body?.output_text === 'string') return body.output_text;
  return (body?.output ?? []).flatMap((item) => item.content ?? []).map((part) => part.text ?? '').filter(Boolean).join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const packet = body.packet;
  if (!packet || !Array.isArray(packet.evidence)) return res.status(400).json({ error: 'Evidence packet required' });
  const apiKey = process.env.BITGET_QWEN_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(200).json({ configured: false, decision: 'NOT_CONFIGURED', message: 'AI provider is not configured. The rules-only baseline and evidence receipt remain available.' });
  const baseUrl = (process.env.BITGET_QWEN_API_KEY ? (process.env.BITGET_QWEN_BASE_URL || 'https://hackathon.bitgetops.com/v1') : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1')).replace(/\/$/, '');
  const model = process.env.BITGET_QWEN_API_KEY ? (process.env.BITGET_QWEN_MODEL || 'qwen3.6-plus') : (process.env.OPENAI_MODEL || 'gpt-4o-mini');
  const system = 'You are FIRSTREAD, an evidence-constrained financial research analyst. Use only the supplied packet. Cite supplied evidence with IDs like [E1-NVDA]. Never cite excluded or future evidence. Separate observation from inference, state contradictions and uncertainty, and end with one of INVESTIGATE, WAIT, or REJECT as a human research posture—not a trade order. Never claim returns, fills, profitability, or certainty.';
  try {
    const response = await fetch(`${baseUrl}/responses`, { method: 'POST', headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify({ model, input: [{ role: 'system', content: [{ type: 'input_text', text: system }] }, { role: 'user', content: [{ type: 'input_text', text: JSON.stringify({ question: body.question ?? 'What should a human investigate next?', packet }) }] }] }) });
    const result = await response.json();
    if (!response.ok) return res.status(502).json({ configured: true, decision: 'ABSTAIN', error: `AI provider HTTP ${response.status}`, provider: model });
    const text = outputText(result);
    const validation = validateModelCitations(text, packet.evidence.map((item) => item.id));
    if (!validation.valid) return res.status(200).json({ configured: true, decision: 'ABSTAIN', message: validation.reason, validation, provider: model });
    return res.status(200).json({ configured: true, decision: 'AI_REVIEW', answer: text, validation, provider: model });
  } catch (error) {
    return res.status(502).json({ configured: true, decision: 'ABSTAIN', error: error.message, provider: model });
  }
}
