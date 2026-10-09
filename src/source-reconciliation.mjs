/**
 * Post-hoc source discrepancy audit. The MCP query is fetched now.
 * It is NEVER an event-time evidence source or included in the LLM replay.
 */
const DAY=86400000;
const round=(n)=>Number(n.toFixed(4));
export function reconcileSources({ticker,context,income}){
 const base={ticker,observedAt:income?.retrievedAt??null,
  secAcceptedAt:context?.secAcceptedAt??null,
  provenance:'Contemporaneous SEC exhibit compared with Bitget data RETRIEVED NOW. MCP data is excluded from historical replay, source timing is not reconstructed.',
  endpoint:income?.endpoint??null,sourceId:'E3-'+ticker,
  status:'UNAVAILABLE',differences:[],matchedPeriod:null,summary:null};
 if(!context||context.ticker!==ticker||!/^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//.test(context.sourceURL))return base;
 const date=Date.parse(context.quarterEnded),fy=Number(context.period?.match(/FY(\d{4})/)?.[1]);
 if(!Number.isFinite(date)||!Number.isFinite(fy))return base;
 const matches=(income?.records??[]).filter(r=>{
  const delta=Math.abs(Date.parse(r.period_ending)-date);
  return r.symbol===ticker&&Number(r.fiscal_year)===fy&&r.currency_code==='USD'&&
    Number.isFinite(delta)&&delta<=7*DAY &&
    Number(r.revenue)>0;
 }).sort((a,b)=>{
  const da=Math.abs(Date.parse(a.period_ending)-date);
  const db=Math.abs(Date.parse(b.period_ending)-date);
  return da-db;
 });
 const quarter=Number(context.period?.match(/^Q([1-4])\s/)?.[1]);
 const quarterCharacter=['','一','二','三','四'][quarter];
 const compatible=quarterCharacter ? matches.filter(row=>{
  const type=String(row.fiscal_period??'');
  return type.includes(quarterCharacter+'季报') && !/累计|年报/.test(type);
 }) : [];
 const record=compatible[0];
 if(!record){
  return {...base,
   status:matches.length?'INCOMPARABLE_PERIOD':'UNAVAILABLE',
   summary:matches.length ?
    'Bitget returned fiscal-year or cumulative reporting records, but no explicitly standalone fiscal-quarter statement. Comparing those directly with the SEC quarterly exhibit would produce false discrepancies.' :
    'No matching USD income statement for this SEC fiscal quarter was returned by Bitget MCP.',
   providerPeriodTypes:[...new Set(matches.map(x=>String(x.fiscal_period??'unspecified')))].slice(0,7),
  };
 }
 const mapping=[
  ['revenue','revenue','usd_millions'],
  ['operating_income','operating_income','usd_millions'],
  ['gaap_eps','total_dlt_earnings_common_ps','usd_per_share']
 ];
 const checks=[];
 for(const [secId,mcpField,unit] of mapping){
  const cmp=context.comparisons?.find(c=>c.id===secId&&c.unit===unit);
  if(!cmp)continue;
  const num=Number(record[mcpField]);
  const valid=Number.isFinite(num)&&num>0;
  const mcpValue=valid?(unit==='usd_millions'?num/1e6:num):null;
  const secValue=cmp.current;
  const diff=valid?round(mcpValue-secValue):null;
  const pct=valid&&secValue>0?round(diff/secValue*100):null;
  // USD millions may differ slightly with vendor normalization; label material divergences only.
  const tolerance=unit==='usd_per_share'?0.015:Math.max(2,secValue*0.001);
  const verdict=!valid?'MISSING':Math.abs(diff)<=tolerance?'AGREES':'DISAGREES';
  checks.push({
   metric:secId,label:cmp.label,unit,sec:secValue,mcp:mcpValue,
   difference:diff,relativeDifferencePct:pct,verdict,
   secSource:context.sourceURL,secSourceId:'E3-'+ticker,mcpField
  });
 }
 const disagreements=checks.filter(c=>c.verdict==='DISAGREES');
 const count=checks.filter(c=>c.verdict==='AGREES').length;
 return {...base,status:disagreements.length?'DISCREPANCY':count?'COMPARED':'INCOMPLETE',
  differences:checks,
  matchedPeriod:{secQuarterEnded:context.quarterEnded,mcpPeriodEnding:record.period_ending,
   dayOffset:Math.round((Date.parse(record.period_ending)-date)/DAY),
   fiscalYear:fy,providerFiscalPeriod:record.fiscal_period??null},
  summary:disagreements.length ?
   disagreements.length+' reported figure(s) differ between independent sources. Preserve the SEC-filed figure and inspect definitions before acting.' :
   count+' filed figure(s) agree within the stated tolerance; this does not prove historical first availability.'};
}
