/**
 * Live independent Bitget MCP-to-SEC reconciliation proof.
 * Read-only. No API keys or account access.
 */
const origin=(process.env.FIRSTREAD_URL||'https://firstread-psi.vercel.app').replace(/\/$/,'');
async function req(ticker){
 const r=await fetch(origin+'/api/crosscheck?ticker='+ticker,{signal:AbortSignal.timeout(50000),
  headers:{accept:'application/json'}});
 const data=await r.json();
 if(!r.ok)throw Error('crosscheck returned HTTP '+r.status);
 return data;
}
const report={origin,checkedAt:new Date().toISOString(),historicalUse:false,cases:[]};
for(const ticker of ['NVDA','AAPL','MSFT']){
 try{
  const data=await req(ticker);
  report.cases.push({
   ticker,status:data.status,observedAt:data.observedAt,
   sourceId:data.sourceId,
   period:data.matchedPeriod,
   comparisons:(data.differences||[]).map(x=>({metric:x.metric,verdict:x.verdict,
    sec:x.sec,mcp:x.mcp,difference:x.difference})),
   historicalUse:data.historicalUse,
   summary:data.summary
  });
 }catch(e){report.cases.push({ticker,status:'REQUEST_FAILED',message:e.message})}
}
const n=report.cases.find(x=>x.ticker==='NVDA');
const passed=n.status==='DISCREPANCY' && n.historicalUse===false &&
 n.comparisons.some(x=>x.metric==='revenue'&&x.verdict==='AGREES') &&
 n.comparisons.some(x=>x.metric==='operating_income'&&x.verdict==='DISAGREES');
report.pass=passed;
console.log(JSON.stringify(report,null,2));
if(!passed)process.exitCode=1;
