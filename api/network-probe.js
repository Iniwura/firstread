// Temporary network diagnostic. No access to real credentials.
// The request uses a known-invalid bearer token and records only the HTTP status.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  const start = Date.now();
  try {
    const response = await fetch('https://hackathon.bitgetops.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid-diagnostic-key',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen3.8-max', stream: false,
        messages: [{ role: 'user', content: 'diagnostic only' }],
        max_tokens: 4
      }),
      signal: AbortSignal.timeout(8000)
    });
    return res.status(200).json({ reachable: true, upstreamStatus: response.status, elapsedMs: Date.now() - start });
  } catch (error) {
    return res.status(200).json({ reachable: false, errorName: error?.name ?? 'unknown', errorCode: error?.cause?.code ?? null, elapsedMs: Date.now() - start });
  }
}