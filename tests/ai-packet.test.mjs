import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAiResearchPacket } from '../src/research-service.mjs';
const at='2026-08-26T20:21:19.000Z';
const before='2026-08-26T20:21:18.000Z';
const mk=(iso,close)=>[Date.parse(iso),String(close),String(close),String(close),String(close),'1'];
const candles=[
  mk('2026-08-26T17:00:00.000Z',100),
  mk('2026-08-26T18:00:00.000Z',99),
  mk('2026-08-26T19:00:00.000Z',101),
  mk('2026-08-26T20:00:00.000Z',102),
  mk('2026-08-26T21:00:00.000Z',2000)
];
test('fast AI packet excludes in-progress candles, future reactions, and sends a cutoff-only query',async()=>{
  let called=null;
  const result=await buildAiResearchPacket({ticker:'NVDA',asOf:at},{getCandles:async(...args)=>{called=args;return {candles};}});
  assert.deepEqual(called,['RNVDAUSDT',at,12,0]);
  assert.ok(result.aiPacket.evidence.some(x=>x.id==='E3-NVDA'));
  assert.deepEqual(result.aiPacket.completedCandles.map(x=>x.close),['100','99','101']);
  assert.doesNotMatch(JSON.stringify(result.aiPacket),/2000/);
});
test('before SEC acceptedAt no earnings exhibit can leak to LLM',async()=>{
  const result=await buildAiResearchPacket({ticker:'NVDA',asOf:before},{getCandles:async()=>({candles})});
  assert.ok(!result.aiPacket.evidence.some(x=>x.id==='E3-NVDA'));
  assert.ok(!result.aiPacket.evidence.some(x=>x.id==='E2-NVDA'));
});
test('Apple and Microsoft packets use filed earnings exhibits despite issuer date-only pages',async()=>{
  for(const [ticker,asOf] of [['AAPL','2026-07-30T20:30:28.000Z'],['MSFT','2026-07-29T20:04:53.000Z']]){
    const result=await buildAiResearchPacket({ticker,asOf},{getCandles:async()=>({candles:[mk('2026-07-28T15:00:00.000Z',100)]})});
    assert.ok(result.aiPacket.evidence.some(x=>x.id==='E3-'+ticker));
    assert.ok(!result.aiPacket.evidence.some(x=>x.id==='E1-'+ticker));
  }
});
test('price-source outage does not invent market data or synthesize a result',async()=>{
  await assert.rejects(buildAiResearchPacket({ticker:'NVDA',asOf:at},{getCandles:async()=>{throw new Error('upstream 503');}}),/upstream 503/);
});
