function evidenceText(items) {
  return items.slice(0, 8).map((item, index) => `${index + 1}. ${item.title}\nSource: ${item.source || 'unknown'}\nPublished: ${item.publishedAt}\nURL: ${item.url}`).join('\n\n');
}

function outputText(body) {
  if (typeof body.output_text === 'string') return body.output_text;
  return (body.output || []).flatMap(item => item.content || []).map(item => item.text || '').filter(Boolean).join('\n');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const question = String(req.body?.question || '').trim().slice(0, 500);
  const evidence = Array.isArray(req.body?.evidence) ? req.body.evidence.filter(item => item && item.title).slice(0, 8) : [];
  if (!question) return res.status(400).json({ error: 'A research question is required' });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(200).json({
      configured: false,
      status: 'not-configured',
      answer: 'AI synthesis is wired to the OpenAI Responses API, but OPENAI_API_KEY is not configured in this deployment. The evidence feed is still available without it.',
      evidenceCount: evidence.length,
    });
  }
  const prompt = `Question: ${question}\n\nEvidence (use only these sources; if they do not support a claim, say so):\n${evidenceText(evidence) || 'No evidence was supplied.'}`;
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        instructions: 'You are FIRSTREAD, an evidence-first research analyst. Do not invent facts, market performance, or citations. Separate observations from inference. Cite source titles and URLs from the provided evidence. State when the evidence is insufficient. Keep the answer under 220 words.',
        input: prompt,
      }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error?.message || `OpenAI returned HTTP ${response.status}`);
    return res.status(200).json({ configured: true, status: 'complete', answer: outputText(body), evidenceCount: evidence.length });
  } catch (error) {
    return res.status(502).json({ configured: true, status: 'error', error: error.message, evidenceCount: evidence.length });
  }
};
