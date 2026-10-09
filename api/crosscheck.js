import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEquityIncomeMcp } from '../src/bitget-equity-mcp.mjs';
import { reconcileSources } from '../src/source-reconciliation.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const comparisons=JSON.parse(await readFile(path.join(root,'data/sec-financial-comparisons.json'),'utf8'));

export function createCrosscheckHandler({lookup=getEquityIncomeMcp}={}){
 return async function crosscheck(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'GET required'});
  const ticker=String(req.query?.ticker??'').toUpperCase();
  if(!['NVDA','AAPL','MSFT'].includes(ticker))return res.status(400).json({error:'Select NVDA, AAPL or MSFT'});
  const context=comparisons.find(x=>x.ticker===ticker);
  try{
   const income=await lookup(ticker);
   const result=reconcileSources({ticker,context,income});
   return res.status(200).json({...result,
    historicalUse:false,
    sourceNote:'Freshly fetched Bitget income statements are a post-hoc independent cross-check and must NEVER be used as historical decision-time evidence.'});
  }catch{
   return res.status(200).json({
    ticker,status:'UNAVAILABLE',observedAt:new Date().toISOString(),
    historicalUse:false,differences:[],
    summary:'Bitget MCP income data unavailable on this attempt. SEC filing remains the source of record; no comparison is asserted.',
    sourceNote:'A provider failure is not agreement, not disagreement, and not evidence of the past.'
   });
  }
 };
}
export default createCrosscheckHandler();
