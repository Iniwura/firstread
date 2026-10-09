import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDecisionDossier } from '../src/decision-dossier.mjs';
const asOf='2026-08-26T22:30:00.000Z';
const candle=(iso, o, h, l, c)=>[Date.parse(iso),String(o),String(h),String(l),String(c),'100'];
const pre=[
  candle('2026-08-26T19:00:00.000Z',100,105,99,104),
  candle('2026-08-26T20:00:00.000Z',104,106,102,105),
];
const reactions=[
  candle('2026-08-26T23:00:00.000Z',105,108,104,107),
  candle('2026-08-27T00:00:00.000Z',107,109,106,108),
];
const evidence={
  all:[{id:'E1-NVDA',precision:'minute-approximate',availability:{visible:true}}],
  visible:[{publisher:'U.S. Securities and Exchange Commission'}],
};
const build=(overrides={})=>buildDecisionDossier({ evidence, asOf, preWindow:{visible:pre,gaps:[]}, reactionWindow:reactions,...overrides });

test('computes pre-decision drift and range without mixing subsequent candles',()=>{
  const result=build();
  assert.equal(result.metrics.priorDriftPct,5);
  assert.equal(result.metrics.observedRangePct,Number((((106/99)-1)*100).toFixed(3)));
  assert.equal(result.metrics.followOnMovePct,Number((((108/105)-1)*100).toFixed(3)));
  assert.equal(result.checks.at(-1).phase,'after');
});

test('future-only candles never appear as pre-decision evidence',()=>{
  const result=build({preWindow:{visible:[...pre,...reactions],gaps:[]}});
  assert.equal(result.metrics.completePreCandles,2);
  assert.equal(result.metrics.priorDriftPct,5);
});

test('missing candles cannot be treated as a flat price and produce caution',()=>{
  const result=build({preWindow:{visible:[],gaps:[]}});
  assert.equal(result.metrics.priorDriftPct,null);
  assert.equal(result.researchPosture,'CAUTION');
  assert.ok(result.blockingTopics.includes('Pre-decision price behavior'));
});

test('outcome-only observation must never become pre-decision premise',()=>{
  const result=build({preWindow:{visible:pre,gaps:[]},reactionWindow:[
    candle('2026-08-26T22:00:00.000Z',105,999,105,999),
    ...reactions,
  ]});
  assert.equal(result.metrics.followOnMovePct,Number((((108/105)-1)*100).toFixed(3)));
  assert.equal(result.metrics.priorDriftPct,5);
});

test('missing contemporary analyst consensus always blocks a beat/miss claim',()=>{
  const result=build();
  assert.equal(result.checks.find((c)=>c.title==='Expectation gap').category,'NOT VERIFIED');
  assert.ok(result.blockingTopics.includes('Expectation gap'));
});

test('missing SEC anchor marks timing proof insufficient',()=>{
  const result=build({evidence:{visible:[],all:[]}});
  assert.equal(result.checks[0].category,'INSUFFICIENT');
  assert.ok(result.blockingTopics.includes('Information timing'));
});

test('reports timestamp data gaps separately from price drift',()=>{
  const result=build({preWindow:{visible:pre,gaps:[{from:'a',to:'b'}]}});
  assert.equal(result.metrics.candleGapCount,1);
  assert.equal(result.checks[3].category,'CAUTION');
});
