import test from 'node:test';
import assert from 'node:assert/strict';
import {getRealityStockInfo} from '../src/bitget-client.mjs';

test('Bitget stock-info returns only documented current trading-session metadata',async()=>{
 const orig=globalThis.fetch; let url;
 globalThis.fetch=async(input)=>{
  url=String(input);
  return {ok:true,status:200,json:async()=>({code:'00000',requestTime:1791498829034,data:[
   {symbol:'RNVDAUSDT',code:'NVDA',tradingPeriod:['overnight','pre_market','regular','after_hours'],weekendTradable:'yes'},
   {symbol:'RAAPLUSDT',code:'AAPL',tradingPeriod:['regular'],weekendTradable:'no'}
  ]})};
 };
 try {
  const data=await getRealityStockInfo('RNVDAUSDT');
  assert.match(url,/reality\/market\/stock-info/);
  assert.equal(data.stockInfo.symbol,'RNVDAUSDT');
  assert.equal(data.stockInfo.weekendTradable,true);
  assert.deepEqual(data.stockInfo.tradingPeriod,['overnight','pre_market','regular','after_hours']);
  assert.equal(data.stockInfo.underlyingExchangeHistoricalTradeable,undefined);
 }finally{globalThis.fetch=orig;}
});
test('missing symbol from response rejects instead of displaying another stock',async()=>{
 const orig=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({code:'00000',data:[{symbol:'RNVDAUSDT',code:'NVDA'}]})});
 try{ await assert.rejects(getRealityStockInfo('RMSFTUSDT'),/requested symbol/); }
 finally{globalThis.fetch=orig;}
});
