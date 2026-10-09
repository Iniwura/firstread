import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildEvidence, buildAiPacket, buildRulesBaseline } from '../src/research-engine.mjs';
import { buildResearchBrief } from '../src/research-brief.mjs';
const sec=JSON.parse(await readFile(new URL('../data/sec-exhibits.json',import.meta.url),'utf8'));
const releases=JSON.parse(await readFile(new URL('../data/release-evidence.json',import.meta.url),'utf8'));
const anchors=JSON.parse(await readFile(new URL('../data/verified-sec-anchors.json',import.meta.url),'utf8'));
const get=(ticker)=>({caseData:{...anchors.find(a=>a.ticker===ticker),ticker,company:ticker,symbol:'R'+ticker+'USDT'},
 release:releases.find(x=>x.ticker===ticker),exhibit:sec.find(x=>x.ticker===ticker)});
test('each company has exact matching SEC EX-99.1, at least three cited facts and an SEC file URL',()=>{
 for(const ticker of ['NVDA','AAPL','MSFT']) {
  const {caseData,release,exhibit}=get(ticker);
  assert.equal(exhibit.acceptedAt,caseData.secAcceptedAt);
  assert.equal(exhibit.exhibit,'EX-99.1');
  assert.match(exhibit.sourceURL,/^https:\/\/www\.sec\.gov\/Archives\/edgar\/data\//);
  assert.ok(exhibit.facts.length>=3);
  assert.ok(exhibit.facts.every(f=>f.label&&f.value&&f.quote));
  const ev=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',caseData.secAcceptedAt,exhibit);
  assert.ok(ev.visible.some(x=>x.id==='E3-'+ticker));
  assert.ok(ev.visible.find(x=>x.id==='E3-'+ticker).facts.length>=3);
 }
});
test('filing exhibits are NOT available one second before SEC acceptance',()=>{
 for(const ticker of ['NVDA','AAPL','MSFT']) {
  const {caseData,release,exhibit}=get(ticker);
  const before=new Date(Date.parse(caseData.secAcceptedAt)-1000).toISOString();
  const ev=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',before,exhibit);
  assert.equal(ev.visible.some(x=>x.id==='E3-'+ticker),false);
  const brief=buildResearchBrief({caseData,evidence:ev,dossier:{asOf:before,metrics:{completePreCandles:0}},sourceChecks:{}});
  assert.equal(brief.verified.some(x=>x.citation==='E3-'+ticker),false);
 }
});
test('filing facts are visible at the exact SEC acceptance but cannot create an earnings surprise claim',()=>{
 for(const ticker of ['NVDA','AAPL','MSFT']) {
  const {caseData,release,exhibit}=get(ticker);
  const ev=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',caseData.secAcceptedAt,exhibit);
  const brief=buildResearchBrief({caseData,evidence:ev,dossier:{asOf:caseData.secAcceptedAt,metrics:{completePreCandles:0}},sourceChecks:{sec:{ok:true},issuer:{ok:true},exhibit:{ok:true}}});
  const filed=brief.verified.find(x=>x.citation==='E3-'+ticker);
  assert.ok(filed);
  assert.equal(filed.facts.length,3);
  assert.match(brief.limitations.join(' '),/historical analyst-consensus/);
 }
});
test('model packet contains filed exhibits available at cutoff but no future data',()=>{
 const {caseData,release,exhibit}=get('AAPL');
 const at=caseData.secAcceptedAt;
 const before=new Date(Date.parse(at)-1000).toISOString();
 const earlier=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',before,exhibit);
 const later=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',at,exhibit);
 const market={visible:[]};
 const baseline=buildRulesBaseline({evidence:later,candles:{visible:[],visibleCount:0},asOf:at,intervalMs:3600000});
 const packet=buildAiPacket({caseData,asOf:at,evidence:later,market,baseline});
 assert.ok(packet.evidence.some(x=>x.id==='E3-AAPL'));
 const prior=buildAiPacket({caseData,asOf:before,evidence:earlier,market,baseline});
 assert.ok(!prior.evidence.some(x=>x.id==='E3-AAPL'));
 assert.equal(prior.completedCandles.length,0);
});
test('mismatched, altered or off-domain filing objects cannot create an exhibit',()=>{
 const {caseData,release,exhibit}=get('MSFT');
 for(const attack of [
  {...exhibit,acceptedAt:'2026-07-28T20:04:53.000Z'},
  {...exhibit,sourceURL:'https://malicious.example/exhibit'},
  {...exhibit,ticker:'AAPL'}
 ]) {
  const ev=buildEvidence(caseData,release,'2026-10-09T00:00:00.000Z',caseData.secAcceptedAt,attack);
  assert.ok(!ev.all.some(x=>x.id==='E3-MSFT'));
 }
});
