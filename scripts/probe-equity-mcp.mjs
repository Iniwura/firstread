/**
 * Read-only probe of currently available Bitget Equity MCP records.
 * Never infers when an historical data point first became public.
 */
const endpoint='https://agent.bitget.com/mcp';
let sid=null;
async function rpc(id,method,params={}){
 const headers={'accept':'application/json, text/event-stream','content-type':'application/json'};
 if(sid)headers['mcp-session-id']=sid;
 const response=await fetch(endpoint,{method:'POST',headers,signal:AbortSignal.timeout(18000),
  body:JSON.stringify({jsonrpc:'2.0',...(id!==null?{id}:{}),method,params})});
 sid=response.headers.get('mcp-session-id')||sid;
 const raw=await response.text();
 let data=null;
 try{data=JSON.parse(raw);}catch{
  const lines=raw.split('\n').filter(line=>line.startsWith('data:'));
  for(const line of lines)try{data=JSON.parse(line.slice(5).trim());}catch{}
 }
 if(!response.ok)throw Error('MCP HTTP '+response.status+' '+method);
 return data;
}
const initialized=await rpc(1,'initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'firstread-research-probe',version:'1.0'}});
if(!initialized?.result)throw Error('Bitget MCP failed initialize');
await rpc(null,'notifications/initialized');
let id=2; const records=[];
for(const entry_id of ['equity_profile','equity_fundamental_income','equity_fundamental_metrics','equity_price_quote']){
 try{
  const response=await rpc(id++,'tools/call',{name:'do_query',arguments:{entry_id,params:{symbol:'NVDA'}}});
  const txt=response?.result?.content?.find(item=>item.type==='text')?.text??'';
  let parsed;try{parsed=JSON.parse(txt);}catch{parsed={raw:txt.slice(0,200)};}
  const root=parsed.data;
  const row=Array.isArray(root?.results)?root.results[0]:null;
  records.push({
   entry_id,isError:response?.result?.isError??null,
   success:parsed.success===true&&parsed.status_code===200,
   status_code:parsed.status_code??null,
   rowCount:root?.results?.length??null,
   rowFields:row&&typeof row==='object'?Object.keys(row).slice(0,24):[],
   firstRowSample:row?JSON.stringify(row).slice(0,580):null,
   error:parsed.error??null,
  });
 }catch(error){records.push({entry_id,success:false,error:error.message});}
}
console.log(JSON.stringify({at:new Date().toISOString(),source:endpoint,currentSnapshotOnly:true,records},null,2));
