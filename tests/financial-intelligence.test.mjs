import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEvidence} from '../src/research-engine.mjs';
import {buildFinancialIntelligence} from '../src/financial-intelligence.mjs';
const get=async(file)=>JSON.parse(await readFile(new URL('../data/'+file,import.meta.url),'utf8'));
const [ctx,exhibits,releases,anchors]=await Promise.all([
get('sec-financial-comparisons.json'),get('sec-exhibits.json'),get('release-evidence.json'),get('verified-sec-anchors.json')]);
function fixture(ticker,after=true){
 const a=anchors.find(x=>x.ticker===ticker),e=exhibits.find(x=>x.ticker===ticker);
 const r=releases.find(x=>x.ticker===ticker), context=ctx.find(x=>x.ticker===ticker);
 const cutoff=after?a.secAcceptedAt:new Date(Date.parse(a.secAcceptedAt)-1000).toISOString();
 const evidence=buildEvidence(a,r,'2026-10-09T10:00:00.000Z',cutoff,e);
 return {caseData:{...a,symbol:'R'+ticker+'USDT'},evidence,context};
}
test('all three original SEC exhibits support internally consistent growth calculations',()=>{
 for(const ticker of ['NVDA','AAPL','MSFT']){
  const r=buildFinancialIntelligence(fixture(ticker));
  assert.equal(r.status,'AVAILABLE');
  assert.ok(r.comparisons.length>=4);
  assert.ok(r.drivers.some(x=>x.kind==='support'));
  assert.ok(r.drivers.some(x=>x.kind==='challenge'));
  assert.ok(r.comparisons.every(x=>x.sourceId==='E3-'+ticker&&x.sourceURL===r.sourceURL));
 }
});
test('growth and percentage point calculations match reported source values',()=>{
 const nvda=buildFinancialIntelligence(fixture('NVDA'));
 assert.equal(nvda.comparisons.find(x=>x.id==='revenue').changePct,105.85);
 assert.equal(nvda.comparisons.find(x=>x.id==='gaap_gross_margin').changeLabel,'+2.60 pp');
 const aapl=buildFinancialIntelligence(fixture('AAPL'));
 assert.equal(aapl.comparisons.find(x=>x.id==='gaap_eps').changePct,28.66);
 const msft=buildFinancialIntelligence(fixture('MSFT'));
 assert.ok(msft.comparisons.find(x=>x.id==='personal_computing_revenue').changePct<0);
 assert.ok(msft.signals.some(x=>x.type==='DECLINING_LINE_ITEMS'));
});
test('before SEC acceptance all financial facts, interpretation and drivers are withheld',()=>{
 for(const ticker of ['NVDA','AAPL','MSFT']){
  const r=buildFinancialIntelligence(fixture(ticker,false));
  assert.equal(r.status,'HELD_OUT'); assert.equal(r.comparisons.length,0);
  assert.equal(r.drivers.length,0); assert.equal(r.signals.length,0);
 }
});
test('tampered context source URL and acceptance timestamps fail closed',()=>{
 const f=fixture('MSFT');
 assert.equal(buildFinancialIntelligence({...f,context:{...f.context,secAcceptedAt:'2026-07-28T00:00:00.000Z'}}).status,'INVALID_PROVENANCE');
 assert.equal(buildFinancialIntelligence({...f,context:{...f.context,sourceURL:'https://attacker.example'}}).status,'INVALID_PROVENANCE');
});
test('these are period-to-period calculations not earnings surprise, execution or alpha predictions',()=>{
 const r=buildFinancialIntelligence(fixture('AAPL'));
 assert.ok(r.method.includes('no archived analyst-consensus'));
 assert.ok(!Object.keys(r).includes('buySignal'));
 assert.ok(!Object.keys(r).includes('predictedReturn'));
});
