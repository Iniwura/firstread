import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileSources} from '../src/source-reconciliation.mjs';
const context={
 ticker:'NVDA',period:'Q2 FY2027 vs Q2 FY2026',quarterEnded:'2026-07-26',secAcceptedAt:'2026-08-26T20:21:19.000Z',
 sourceURL:'https://www.sec.gov/Archives/edgar/data/1045810/abc.htm',
 comparisons:[
  {id:'revenue',unit:'usd_millions',label:'Revenue',current:96221},
  {id:'operating_income',unit:'usd_millions',label:'GAAP operating income',current:63734},
  {id:'gaap_eps',unit:'usd_per_share',label:'GAAP diluted EPS',current:2.46}
 ]};
const income={retrievedAt:'2026-10-09T11:50:42.000Z',endpoint:'https://agent.bitget.com/mcp',records:[
 {symbol:'NVDA',period_ending:'2026-07-25',fiscal_year:2027,fiscal_period:'二季报',currency_code:'USD',
  revenue:96221000000,operating_income:64003000000,total_dlt_earnings_common_ps:2.46},
 {symbol:'NVDA',period_ending:'2024-07-25',fiscal_year:2025,currency_code:'USD',revenue:9999999999}
]};
test('flags independently verified NVIDIA operating-income disagreement instead of overwriting filed data',()=>{
 const result=reconcileSources({ticker:'NVDA',context,income});
 assert.equal(result.status,'DISCREPANCY');
 assert.equal(result.differences.find(x=>x.metric==='revenue').verdict,'AGREES');
 assert.equal(result.differences.find(x=>x.metric==='gaap_eps').verdict,'AGREES');
 const op=result.differences.find(x=>x.metric==='operating_income');
 assert.equal(op.difference,269);
 assert.equal(op.verdict,'DISAGREES');
 assert.equal(result.matchedPeriod.dayOffset,-1);
 assert.match(result.provenance,/RETRIEVED NOW/);
});
test('missing or off-fiscal-year provider rows fail closed, not deemed consistent',()=>{
 assert.equal(reconcileSources({ticker:'AAPL',context,income}).status,'UNAVAILABLE');
 assert.equal(reconcileSources({ticker:'NVDA',context,income:{...income,records:[]}}).status,'UNAVAILABLE');
 assert.equal(reconcileSources({ticker:'NVDA',context:{...context,sourceURL:'https://evil.example'},income}).status,'UNAVAILABLE');
});
test('minor dollar differences inside disclosed tolerances are agreement, never invented exact equivalence',()=>{
 const rows=income.records.map((r,i)=>i? r : {...r,operating_income:63735500000});
 const result=reconcileSources({ticker:'NVDA',context,income:{...income,records:rows}});
 assert.equal(result.status,'COMPARED');
 assert.ok(result.differences.every(x=>x.verdict==='AGREES'));
});
