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
const a=report.cases.find(x=>x.ticker==='AAPL');
const m=report.cases.find(x=>x.ticker==='MSFT');
const nvdaOk=n.status==='DISCREPANCY' && n.historicalUse===false &&
 n.comparisons.some(x=>x.metric==='revenue'&&x.verdict==='AGREES') &&
 n.comparisons.some(x=>x.metric==='operating_income'&&x.verdict==='DISAGREES');
const appleOk=a.status==='INCOMPARABLE_PERIOD' && a.comparisons.length===0;
const microsoftOk=m.status==='COMPARED' && m.historicalUse===false &&
 m.comparisons.some(x=>x.metric==='revenue'&&x.verdict==='AGREES') &&
 m.comparisons.some(x=>x.metric==='gaap_eps'&&x.verdict==='AGREES');
report.pass=nvdaOk&&appleOk&&microsoftOk;
report.proof={nvdaOk,appleOk,microsoftOk};
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
