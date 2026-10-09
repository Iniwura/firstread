/**
 * Source-bound earnings interpretation. This module never consults current
 * forecasts, stock quotes or post-event price changes.
 *
 * All comparisons are read from ONE filed SEC EX-99.1 that is part of the
 * evidence visible at asOf. Growth is calculated, not guessed by the LLM.
 */
const round=(n,d=2)=>Number(n.toFixed(d));
function format(value,unit){
 if(unit==='usd_millions') return '$'+(value/1000).toFixed(2)+'B';
 if(unit==='usd_per_share') return '$'+value.toFixed(2);
 if(unit==='percent') return value.toFixed(1)+'%';
 return String(value);
}
export function buildFinancialIntelligence({caseData,evidence,context}){
 const asOf=evidence?.all?.find(x=>x.id==='E2-'+caseData.ticker)?.publishedAt??caseData.secAcceptedAt;
 const filing=(evidence?.visible??[]).find(x=>x.id==='E3-'+caseData.ticker);
 const empty={status:'HELD_OUT',sourceId:null,asOf,period:null,comparisons:[],drivers:[],signals:[],method:'Comparison facts withheld until their SEC filing is available at the chosen time.'};
 if(!filing || !context) return empty;
 if(context.ticker!==caseData.ticker || context.sourceURL!==filing.sourceURL ||
    context.secAcceptedAt!==caseData.secAcceptedAt ||
    filing.publishedAt!==context.secAcceptedAt ||
    !/^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//.test(context.sourceURL))
   return {...empty,status:'INVALID_PROVENANCE',method:'Source or timestamp metadata does not match the verified filed exhibit.'};

 const comparisons=[];
 for(const row of context.comparisons??[]){
  if(!['usd_millions','usd_per_share','percent'].includes(row.unit)||
    !Number.isFinite(row.current)||!Number.isFinite(row.prior)||row.prior<=0||
    typeof row.sourceQuote!=='string'||!row.sourceQuote.trim()) continue;
  const pct=round((row.current/row.prior-1)*100);
  const delta=round(row.current-row.prior);
  comparisons.push({
    id:row.id,label:row.label,unit:row.unit,priorValue:row.prior,currentValue:row.current,
    priorLabel:format(row.prior,row.unit),currentLabel:format(row.current,row.unit),
    changePct:pct,changeLabel:row.unit==='percent' ?
      (delta>0?'+':'')+delta.toFixed(2)+' pp':
      (pct>0?'+':'')+pct.toFixed(2)+'% YoY',
    direction:delta>0?'UP':delta<0?'DOWN':'FLAT',
    explanation:row.importance,sourceId:filing.id,sourceURL:filing.sourceURL,
    sourceQuote:row.sourceQuote,
  });
 }
 const drivers=(context.drivers??[]).filter(x=>['support','challenge'].includes(x.kind)&&
   typeof x.finding==='string'&&typeof x.quote==='string'&&x.quote.trim()).map(x=>({
   kind:x.kind,label:x.label,finding:x.finding,quote:x.quote,sourceId:filing.id,sourceURL:filing.sourceURL
 }));
 const revenue=comparisons.find(x=>x.id==='revenue');
 const operating=comparisons.find(x=>x.id==='operating_income');
 const signals=[];
 if(revenue&&operating){
  const divergence=round(operating.changePct-revenue.changePct);
  signals.push({
   type:'OPERATING_VS_REVENUE_GROWTH',
   severity:divergence<0?'WATCH':'CONTEXT',
   label:'Operating-income growth versus revenue',
   explanation:'Operating income '+(operating.changePct>0?'grew ':'changed ')+operating.changeLabel+
    ' compared with revenue '+revenue.changeLabel+'. The difference is '+
    (divergence>0?'+':'')+divergence.toFixed(2)+' percentage points; it does not explain cause.',
   sourceId:filing.id,sourceURL:filing.sourceURL,
  });
 }
 const down=comparisons.filter(x=>x.direction==='DOWN');
 if(down.length)signals.push({
   type:'DECLINING_LINE_ITEMS',severity:'WATCH',
   label:'Segments or margins moving against the headline',
   explanation:down.map(x=>x.label+' '+x.changeLabel).join('; ')+' while other results may rise.',
   sourceId:filing.id,sourceURL:filing.sourceURL,
 });
 return {
  status:'AVAILABLE',sourceId:filing.id,sourceURL:filing.sourceURL,
  asOf,period:context.period,comparisons,drivers,signals,
  method:'Numbers are taken from a time-qualified SEC-filed exhibit. Year-over-year comparisons are deterministic; no archived analyst-consensus or first-public-release time is inferred.',
 };
}
