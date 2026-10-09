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


test('cumulative nine-month and full-year vendor records are INCOMPARABLE, never discrepancies',()=>{
 const apple={...context,ticker:'AAPL',period:'Q3 FY2026 vs Q3 FY2025',
  quarterEnded:'2026-06-27',secAcceptedAt:'2026-07-30T20:30:28.000Z'};
 const x=reconcileSources({ticker:'AAPL',context:apple,income:{...income,records:[{
  symbol:'AAPL',fiscal_year:2026,fiscal_period:'三季报(累计)',period_ending:'2026-06-26',
  currency_code:'USD',revenue:364357000000,operating_income:122432000000
 }]}});
 assert.equal(x.status,'INCOMPARABLE_PERIOD');
 assert.equal(x.differences.length,0);
 assert.match(x.summary,/false discrepancies/);

 const microsoft={...context,ticker:'MSFT',period:'Q4 FY2026 vs Q4 FY2025',
  quarterEnded:'2026-06-30',secAcceptedAt:'2026-07-29T20:04:53.000Z'};
 const y=reconcileSources({ticker:'MSFT',context:microsoft,income:{...income,records:[{
  symbol:'MSFT',fiscal_year:2026,fiscal_period:'年报',period_ending:'2026-06-29',
  currency_code:'USD',revenue:331839000000,operating_income:155237000000
 }]}});
 assert.equal(y.status,'INCOMPARABLE_PERIOD');
 assert.equal(y.differences.length,0);
});

test('standalone fiscal-quarter record wins even alongside earlier cumulative record',()=>{
 const a={...context,ticker:'AAPL',period:'Q3 FY2026 vs Q3 FY2025',quarterEnded:'2026-06-27'};
 const data={...income,records:[
  {symbol:'AAPL',fiscal_year:2026,fiscal_period:'三季报(累计)',period_ending:'2026-06-26',currency_code:'USD',revenue:364357000000},
  {symbol:'AAPL',fiscal_year:2026,fiscal_period:'三季报',period_ending:'2026-06-26',currency_code:'USD',revenue:96221000000,operating_income:63734000000,total_dlt_earnings_common_ps:2.46}
 ]};
 const x=reconcileSources({ticker:'AAPL',context:a,income:data});
 assert.equal(x.status,'COMPARED');
 assert.equal(x.matchedPeriod.providerFiscalPeriod,'三季报');
});
