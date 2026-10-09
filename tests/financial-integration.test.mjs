import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAiResearchPacket} from '../src/research-service.mjs';
import {buildResearchBrief} from '../src/research-brief.mjs';
import {buildEvidence} from '../src/research-engine.mjs';
import {buildFinancialIntelligence} from '../src/financial-intelligence.mjs';
import {readFile} from 'node:fs/promises';

const files=await Promise.all(['verified-sec-anchors.json','release-evidence.json','sec-exhibits.json','sec-financial-comparisons.json'].map(async name=>JSON.parse(await readFile(new URL('../data/'+name,import.meta.url),'utf8'))));
const [anchors,releases,exhibits,contexts]=files;
const get=(ticker)=>({
  caseData:{...anchors.find(x=>x.ticker===ticker),symbol:'R'+ticker+'USDT'},
  release:releases.find(x=>x.ticker===ticker),
  exhibit:exhibits.find(x=>x.ticker===ticker),
  context:contexts.find(x=>x.ticker===ticker)
});
const price={candles:[
 [Date.parse('2026-07-28T16:00:00Z'),'100','101','99','100','10'],
 [Date.parse('2026-07-28T17:00:00Z'),'100','103','99','102','10'],
]};
test('fast AI research includes filed growth calculations only after filing acceptance',async()=>{
 for(const ticker of ['AAPL','MSFT','NVDA']){
  const {caseData}=get(ticker);
  const now=await buildAiResearchPacket({ticker,asOf:caseData.secAcceptedAt},{getCandles:async()=>price});
  assert.ok(now.aiPacket.financial);
  assert.ok(now.aiPacket.financial.comparisons.length>=4);
  assert.equal(now.aiPacket.financial.sourceId,'E3-'+ticker);
  assert.equal(now.aiPacket.financial.drivers.some(x=>x.kind==='challenge'),true);
  const earlier=new Date(Date.parse(caseData.secAcceptedAt)-1000).toISOString();
  const pre=await buildAiResearchPacket({ticker,asOf:earlier},{getCandles:async()=>price});
  assert.equal(pre.aiPacket.financial,null);
  assert.ok(!JSON.stringify(pre.aiPacket).includes('year-over-year growth drivers'));
 }
});
test('brief includes source-grounded financial comparisons and material caveats',()=>{
 const {caseData,release,exhibit,context}=get('AAPL');
 const asOf=caseData.secAcceptedAt;
 const evidence=buildEvidence(caseData,release,'2026-10-09T12:00:00Z',asOf,exhibit);
 const financial=buildFinancialIntelligence({caseData,evidence,context});
 const brief=buildResearchBrief({caseData,evidence,financial,dossier:{asOf,metrics:{completePreCandles:0}},sourceChecks:{}});
 assert.ok(brief.verified.some(x=>x.label==='Deterministic year-over-year comparisons'));
 assert.ok(brief.limitations.some(x=>x.includes('tariff')));
 assert.ok(brief.actions.some(x=>x.label==='Stress-test the filing’s earnings drivers'));
 assert.ok(brief.verified.every(x=>!x.citation || evidence.visible.some(e=>e.id===x.citation)));
});
test('early research brief refuses early filing comparisons and source drivers',()=>{
 const {caseData,release,exhibit,context}=get('MSFT');
 const asOf=new Date(Date.parse(caseData.secAcceptedAt)-1000).toISOString();
 const evidence=buildEvidence(caseData,release,'2026-10-09T12:00:00Z',asOf,exhibit);
 const financial=buildFinancialIntelligence({caseData,evidence,context});
 const brief=buildResearchBrief({caseData,evidence,financial,dossier:{asOf,metrics:{completePreCandles:0}},sourceChecks:{}});
 assert.equal(brief.verified.some(x=>x.label==='Deterministic year-over-year comparisons'),false);
 assert.equal(brief.limitations.some(x=>x.includes('Anthropic')),false);
});
