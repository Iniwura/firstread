/**
 * Live, independent production-provider verification.
 * Does not require or print any API secrets. Does NOT run in regular CI;
 * trigger only after the production AI provider is configured.
 */
const baseUrl=(process.env.FIRSTREAD_URL||'https://firstread-psi.vercel.app').replace(/\/$/,'');
const timeout=AbortSignal.timeout(85000);
const fetchJson=async(url,init={})=>{
 const response=await fetch(url,{...init,signal:timeout,headers:{accept:'application/json',...(init.headers||{})}});
 let body;
 try{body=await response.json();}catch{throw new Error('Non-JSON production response, HTTP '+response.status);}
 if(!response.ok)throw new Error('Production request HTTP '+response.status+': '+(body.message||body.error||'provider failure'));
 return body;
};
const status=await fetchJson(baseUrl+'/api/ai');
if(!status.configured) {
 console.error('BLOCKED: Production AI provider is NOT configured. Set a private BITGET_QWEN_API_KEY or OPENAI_API_KEY in Vercel production.');
 process.exitCode=2;
} else {
 const question='At the Microsoft SEC filing acceptance, identify two issuer-reported financial figures and explain what is still unknowable without a dated consensus estimate. Cite primary evidence.';
 try{
  const payload=await fetchJson(baseUrl+'/api/ai',{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({ticker:'MSFT',asOf:'2026-07-29T22:04:53.000Z',question})
  });
  const citations=payload.validation?.citations||[];
  const valid=payload.decision==='AI_REVIEW'&&payload.validation?.valid===true&&
   citations.some(id=>id==='E3-MSFT')&&typeof payload.answer==='string'&&payload.answer.length>60;
  const report={
    pass:valid,
    provider:payload.provider||null,
    decision:payload.decision,
    validatedCitations:citations,
    completePrimarySourceCitation:citations.includes('E3-MSFT'),
    asOf:payload.asOf,
    origin:baseUrl,
    // Intentionally do not print provider keys or full model responses.
    message:valid?'Actual provider response with primary-source citations verified':'Provider response did not meet source-citation standard.'
  };
  console.log(JSON.stringify(report,null,2));
  if(!valid)process.exitCode=1;
 }catch(error){
  console.error('LIVE_AI_FAIL: '+error.message);
  process.exitCode=1;
 }
}
