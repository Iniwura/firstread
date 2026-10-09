import test from 'node:test';
import assert from 'node:assert/strict';
import { buildResearchBrief } from '../src/research-brief.mjs';
const sec={id:'E2-NVDA',sourceURL:'https://www.sec.gov/file',publisher:'U.S. Securities and Exchange Commission',facts:[]};
const issuer={id:'E1-NVDA',sourceURL:'https://investor.nvidia.com/release',precision:'minute-approximate',
  facts:[{label:'Revenue',value:'$96.2B'}]};
const base={caseData:{ticker:'NVDA',symbol:'RNVDAUSDT'},evidence:{visible:[sec,issuer]},
  dossier:{asOf:'2026-08-26T20:30:00.000Z',metrics:{priorDriftPct:1.5,completePreCandles:4,candleGapCount:0,candleAgeMinutes:30,followOnMovePct:9.1}},
  sourceChecks:{sec:{ok:true},issuer:{ok:true}}};
test('research brief labels observed versus future outcome and never uses future outcome in verified facts',()=>{
 const result=buildResearchBrief(base);
 assert.equal(result.verified.length,3);
 assert.match(result.verified[2].detail, /\+1\.500%/);
 assert.equal(result.afterCutoffOutcome.valuePct,9.1);
 assert.doesNotMatch(JSON.stringify(result.verified),/9\.1/);
 assert.match(result.limitations.join(' '), /historical analyst-consensus/);
});
test('pre-filing case holds earnings assertions out',()=>{
 const result=buildResearchBrief({...base,evidence:{visible:[]},dossier:{...base.dossier,metrics:{completePreCandles:0,priorDriftPct:null}}});
 assert.equal(result.verified.length,0);
 assert.match(result.headline,/earlier than/);
});
test('date-only issuer evidence never introduces reported numbers',()=>{
 const result=buildResearchBrief({...base,evidence:{visible:[sec]}});
 assert.equal(result.verified.some(x=>x.label==='Issuer-reported financials'),false);
 assert.match(result.limitations.join(' '),/exact publication time/);
});
test('unavailable live source checks are disclosed and cannot be counted as confirmation',()=>{
 const result=buildResearchBrief({...base,sourceChecks:{sec:{ok:false},issuer:{ok:false}}});
 assert.match(result.limitations.join(' '),/could not be checked successfully/);
});
test('research brief has no BUY, SELL, or return claim',()=>{
 const result=buildResearchBrief(base);
 assert.equal(result.actions.at(-1).status,'HUMAN ONLY');
 assert.match(result.caveat,/Not investment advice/);
});
