import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiHandler } from '../api/ai.js';

const asOf = '2026-08-26T20:21:19.000Z';
function mockRes() {
  return { code: 200, payload: null, status(code) { this.code = code; return this; },
    json(payload) { this.payload = payload; return this; } };
}
const serverPacket = {
  evidence: [{ id: 'E2-NVDA', publisher: 'SEC', publishedAt: asOf }],
  completedCandles: [{ timestamp: '2026-08-26T19:00:00.000Z', close: '100' }],
  rulesBaseline: { decision: 'RESEARCH_READY' },
};
function harness({ env = { OPENAI_API_KEY: 'test-key' }, output = 'SEC record available [E2-NVDA]. WAIT.', packet = serverPacket } = {}) {
  let calls = 0; let sent = null; let read = null;
  const handler = createAiHandler({
    env, research: async ({ ticker, asOf: clock }) => {
      read = { ticker, asOf: clock };
      return { aiPacket: packet };
    },
    transport: async (_url, options) => {
      calls += 1; sent = JSON.parse(options.body);
      return { ok: true, json: async () => ({ output_text: output }) };
    },
  });
  return { handler, get calls() { return calls; }, get sent() { return sent; }, get read() { return read; } };
}
const input = { ticker: 'NVDA', asOf, question: 'Summarize the evidence' };

test('AI status reveals configuration only, never a secret', async () => {
  const h = harness();
  const res = mockRes();
  await h.handler({ method: 'GET' }, res);
  assert.equal(res.payload.configured, true);
  assert.doesNotMatch(JSON.stringify(res.payload), /test-key/);
});

test('rejects all user-supplied research packets', async () => {
  const h = harness();
  const res = mockRes();
  await h.handler({ method: 'POST', body: { ...input, packet: { evidence: [{ id: 'E9-NVDA' }] } } }, res);
  assert.equal(res.code, 400);
  assert.equal(h.calls, 0);
});

test('rejects invalid timestamps and excessively long prompts', async () => {
  const h = harness();
  for (const body of [{ ...input, asOf: '2026-08-26' }, { ...input, question: 'x'.repeat(501) }]) {
    const res = mockRes(); await h.handler({ method: 'POST', body }, res); assert.equal(res.code, 400);
  }
  assert.equal(h.calls, 0);
});

test('fetches authoritative packet instead of trusting the browser', async () => {
  const h = harness(); const res = mockRes();
  await h.handler({ method: 'POST', body: input }, res);
  assert.equal(res.code, 200);
  assert.equal(res.payload.decision, 'AI_REVIEW');
  assert.deepEqual(h.read, { ticker: 'NVDA', asOf });
  assert.deepEqual(h.sent.input[1].content[0].text.includes('E2-NVDA'), true);
});

test('rejects fake evidence IDs even when a valid one is also cited', async () => {
  const h = harness({ output: 'SEC [E2-NVDA]. Fake [E9-NVDA].' }); const res = mockRes();
  await h.handler({ method: 'POST', body: input }, res);
  assert.equal(res.payload.decision, 'ABSTAIN');
});

test('abstains when LLM provides zero citations', async () => {
  const h = harness({ output: 'The company beat earnings. Buy now.' }); const res = mockRes();
  await h.handler({ method: 'POST', body: input }, res);
  assert.equal(res.payload.decision, 'ABSTAIN');
});

test('abstains with no historical evidence rather than calling a model', async () => {
  const h = harness({ packet: { evidence: [], completedCandles: [] } }); const res = mockRes();
  await h.handler({ method: 'POST', body: input }, res);
  assert.equal(res.payload.decision, 'ABSTAIN');
  assert.equal(h.calls, 0);
});

test('reports no-key fallback truthfully', async () => {
  const h = harness({ env: {} }); const res = mockRes();
  await h.handler({ method: 'POST', body: input }, res);
  assert.equal(res.payload.configured, false);
  assert.equal(h.calls, 0);
});
