import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const origin=(process.env.FIRSTREAD_URL||'https://firstread-psi.vercel.app').replace(/\/$/,'');
const browser=await chromium.launch({headless:true});
const report={origin,generatedAt:new Date().toISOString(),pages:[],security:{},failures:[]};
for(const {route,label,viewport} of [
 {route:'/',label:'homepage_desktop',viewport:{width:1440,height:900}},
 {route:'/desk.html?tour=off',label:'desk_desktop',viewport:{width:1440,height:900}},
 {route:'/desk.html?tour=off',label:'desk_mobile',viewport:{width:390,height:844}},
]){
 const page=await browser.newPage({viewport});
 page.on('pageerror',e=>report.failures.push(label+' JS: '+e.message));
 try {
  const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:45000});
  if(response.status()!==200)report.failures.push(label+' HTTP '+response.status());
  await page.evaluate(()=>document.fonts.ready);
  if(label.startsWith('desk')) await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),null,{timeout:45000});
  const layout=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewportWidth:window.innerWidth,bodyLength:document.body.innerText.length,hasMain:!!document.querySelector('main')}));
  if(layout.documentWidth>layout.viewportWidth+2)report.failures.push(label+' horizontal overflow');
  if(!layout.hasMain||layout.bodyLength<800)report.failures.push(label+' incomplete content');
  const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  const findings=axe.violations.map(v=>({rule:v.id,impact:v.impact,count:v.nodes.length,targets:v.nodes.slice(0,4).map(n=>n.target)}));
  const serious=findings.filter(v=>v.impact==='serious'||v.impact==='critical');
  if(serious.length)report.failures.push(label+' accessibility serious: '+serious.map(v=>v.rule+'('+v.count+')').join(','));
  report.pages.push({label,route,layout,axe:{violations:findings,passes:axe.passes.length}});
 }catch(e){report.failures.push(label+': '+e.message)}
 await page.close();
}
try {
 const statusRes=await fetch(origin+'/api/ai');
 const status=await statusRes.json();
 report.security.providerConfigured=status.configured===true;
 report.security.providerStatusCode=statusRes.status;
 report.security.privateTokenNotExposed=!('key' in status)&&!JSON.stringify(status).includes('Bearer ');
 if(!report.security.providerConfigured||!report.security.privateTokenNotExposed)report.failures.push('AI status leaked key or missing config');
 const bad=await fetch(origin+'/api/ai',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({ticker:'MSFT',asOf:'2026-07-29T22:04:53.000Z',question:'research',packet:{evidence:[{id:'FAKE'}]}})
 });
 report.security.forgedPacketStatus=bad.status;
 if(bad.status!==400)report.failures.push('model endpoint accepted forged client-side packet');
 const badDate=await fetch(origin+'/api/ai',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({ticker:'MSFT',asOf:'2026-07-29',question:'research'})
 });
 report.security.dateOnlyStatus=badDate.status;
 if(badDate.status!==400)report.failures.push('AI endpoint accepts imprecise asOf');
}catch(e){report.failures.push('API security: '+e.message)}
await browser.close();
report.pass=report.failures.length===0;
console.log(JSON.stringify(report,null,2));
if(!report.pass)process.exitCode=1;
