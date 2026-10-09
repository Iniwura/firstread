/**
 * Bitget public equity MCP, verified against the live server October 9, 2026.
 * This is CURRENTLY RETRIEVED reference data, not an historical as-of feed.
 */
const MCP_ENDPOINT='https://agent.bitget.com/mcp';

export function parseMcpMessage(raw){
 try { return JSON.parse(raw); } catch {}
 let result=null;
 for(const line of String(raw).split('\n')){
  if(!line.startsWith('data:'))continue;
  try {
   const candidate=JSON.parse(line.slice(5).trim());
   if(candidate && (candidate.result||candidate.error))result=candidate;
  } catch {}
 }
 return result;
}

export async function getEquityIncomeMcp(ticker,{transport=fetch,clock=()=>new Date().toISOString()}={}){
 if(!['NVDA','AAPL','MSFT'].includes(ticker))throw new Error('Unsupported equity');
 let sessionId=null;
 async function rpc(id,method,params={}){
  const headers={accept:'application/json, text/event-stream','content-type':'application/json'};
  if(sessionId)headers['mcp-session-id']=sessionId;
  const response=await transport(MCP_ENDPOINT,{
   method:'POST',headers,signal:AbortSignal.timeout(7500),
   body:JSON.stringify({jsonrpc:'2.0',...(id===null?{}:{id}),method,params})
  });
  sessionId=response.headers?.get?.('mcp-session-id')||sessionId;
  if(!response.ok)throw new Error('MCP HTTP '+response.status);
  return parseMcpMessage(await response.text());
 }
 const init=await rpc(1,'initialize',{protocolVersion:'2025-03-26',capabilities:{},
  clientInfo:{name:'firstread-verification',version:'1.0.0'}});
 if(!init?.result)throw new Error('MCP initialize unavailable');
 await rpc(null,'notifications/initialized');
 const reply=await rpc(2,'tools/call',{name:'do_query',
  arguments:{entry_id:'equity_fundamental_income',params:{symbol:ticker}}});
 if(reply?.result?.isError)throw new Error('MCP equity income query failed');
 const raw=reply?.result?.content?.find(part=>part.type==='text')?.text;
 if(typeof raw!=='string')throw new Error('MCP returned no textual data');
 let body;try{body=JSON.parse(raw);}catch{throw new Error('MCP income payload invalid');}
 if(body.success!==true||body.status_code!==200||!Array.isArray(body.data?.results))throw new Error('MCP income source currently unavailable');
 const records=body.data.results.filter(x=>x&&x.symbol===ticker&&typeof x.period_ending==='string').slice(0,90);
 return {ticker,provider:'Bitget equity MCP',endpoint:MCP_ENDPOINT,entryId:'equity_fundamental_income',
  retrievedAt:clock(),records,provenance:'retrieved-now-not-historical-first-observed',recordCount:records.length};
}
