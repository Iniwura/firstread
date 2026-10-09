import test from 'node:test';
import assert from 'node:assert/strict';
import {createCrosscheckHandler} from '../api/crosscheck.js';
function res(){return{code:200,body:null,status(n){this.code=n;return this},json(x){this.body=x;return this}};}
test('GET only, supported company only',async()=>{
 const handler=createCrosscheckHandler({lookup:async()=>({})});
 const a=res(),b=res();
 await handler({method:'POST',query:{ticker:'NVDA'}},a);
 await handler({method:'GET',query:{ticker:'SCAM'}},b);
 assert.equal(a.code,405);assert.equal(b.code,400);
});
test('temporary MCP outage is visible and does not generate fake financial verification',async()=>{
 const h=createCrosscheckHandler({lookup:async()=>{throw new Error('HTTP 503')}});
 const out=res();await h({method:'GET',query:{ticker:'NVDA'}},out);
 assert.equal(out.body.status,'UNAVAILABLE');
 assert.equal(out.body.historicalUse,false);
 assert.deepEqual(out.body.differences,[]);
});
test('reconciled MCP data is explicitly current and excluded from as-of model context',async()=>{
 const h=createCrosscheckHandler({lookup:async()=>({
  retrievedAt:'2026-10-09T12:00:00Z',endpoint:'https://agent.bitget.com/mcp',
  records:[{symbol:'NVDA',period_ending:'2026-07-25',fiscal_year:2027,currency_code:'USD',
   revenue:96221000000,operating_income:64003000000,total_dlt_earnings_common_ps:2.46}]
 })});
 const out=res();await h({method:'GET',query:{ticker:'NVDA'}},out);
 assert.equal(out.body.status,'DISCREPANCY');
 assert.equal(out.body.historicalUse,false);
 assert.ok(out.body.differences.some(x=>x.verdict==='DISAGREES'));
});
