import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMcpMessage,getEquityIncomeMcp} from '../src/bitget-equity-mcp.mjs';

test('parses SSE JSON-RPC results, not arbitrary status messages',()=>{
 const s='event: message\n'+'data: '+JSON.stringify({jsonrpc:'2.0',id:1,result:{serverInfo:{name:'bitget'}}})+'\n\n';
 assert.equal(parseMcpMessage(s).result.serverInfo.name,'bitget');
 assert.equal(parseMcpMessage('invalid'),null);
});

test('verified MCP transport queries real entry_id and returns ticker-filtered rows',async()=>{
 const seen=[];let calls=0;
 const transport=async(_url,options)=>{
  const payload=JSON.parse(options.body);seen.push(payload);
  const session={get:(name)=>name==='mcp-session-id'?'test-session':null};
  let obj=null;
  if(payload.method==='initialize')obj={jsonrpc:'2.0',id:1,result:{serverInfo:{name:'bitget-mcp-server'}}};
  if(payload.method==='tools/call')obj={jsonrpc:'2.0',id:2,result:{isError:false,content:[{
    type:'text',text:JSON.stringify({success:true,status_code:200,data:{results:[
      {symbol:'NVDA',period_ending:'2026-07-25',fiscal_year:2027,revenue:96221000000},
      {symbol:'AAPL',period_ending:'2026-06-27',fiscal_year:2026,revenue:109417000000},
    ]}})
  }]}};
  calls+=1;
  return {ok:true,status:200,headers:session,text:async()=>obj?JSON.stringify(obj):''};
 };
 const r=await getEquityIncomeMcp('NVDA',{transport,clock:()=> '2026-10-09T12:00:00.000Z'});
 assert.equal(calls,3);
 assert.equal(seen[2].params.entry_id,undefined);
 assert.equal(seen[2].params.name,'do_query');
 assert.equal(seen[2].params.arguments.entry_id,'equity_fundamental_income');
 assert.equal(r.records.length,1);
 assert.equal(r.records[0].revenue,96221000000);
 assert.match(r.provenance,/retrieved-now/);
});

test('invalid query and backend outage refuse to fabricate results',async()=>{
 await assert.rejects(getEquityIncomeMcp('UNKNOWN'),/Unsupported/);
 const transport=async()=>({ok:false,status:503,headers:{get:()=>null},text:async()=>''});
 await assert.rejects(getEquityIncomeMcp('NVDA',{transport}),/HTTP 503/);
});
