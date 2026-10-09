import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const base=(process.env.FIRSTREAD_URL||'http://127.0.0.1:4174').replace(/\/$/,'');
const dir=path.resolve(process.env.FIRSTREAD_SCREENSHOT_DIR||'artifacts/landing');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const report={baseUrl:base,views:[],functional:{}};
for(const [name,width,height] of [['desktop',1440,900],['laptop',1100,800],['tablet',820,1024],['phone',390,844],['small-phone',375,812]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',e=>failures.push(name+' browser error '+e.message));
 try{
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{
   const h=document.querySelector('#hero-title'),photo=document.querySelector('.hero-photo');
   const content=document.querySelector('.hero-copy-wrap');
   const heading=h.getBoundingClientRect(),container=content.getBoundingClientRect();
   return {title:document.title,headingFont:getComputedStyle(h).fontFamily,
    headingSize:getComputedStyle(h).fontSize,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
    headingClipped:heading.right>innerWidth+5||heading.left< -5||heading.width>container.width+6,
    photoLoaded:photo.complete&&photo.naturalWidth>0,
    photoStatus:photo.complete?photo.naturalWidth:0,
    heroGrid:getComputedStyle(document.querySelector('.hero')).gridTemplateColumns,
    navColor:getComputedStyle(document.querySelector('.site-nav')).backgroundColor,
    activeTab:document.querySelector('.time-option.is-active')?.dataset.timeState
   };
  });
  report.views.push({name,width,...state});
  if(state.horizontalOverflow||state.headingClipped)failures.push(name+' overflow or clipped heading');
  if(!state.photoLoaded)failures.push(name+' archival photo failed to load');
  if(!state.headingFont.includes('Chakra Petch'))failures.push(name+' design font missing');
  if(name==='desktop'||name==='phone'){
   await page.screenshot({path:path.join(dir,name+'-top.png'),fullPage:false,animations:'disabled'});
   await page.screenshot({path:path.join(dir,name+'-full.png'),fullPage:true,animations:'disabled'});
   await page.locator('[data-time-state=after]').click();
   if(!(await page.locator('#paper-state').textContent()).includes('SEC EXHIBIT AVAILABLE'))failures.push(name+' filing reveal failed');
   if(!(await page.locator('#paper-value').textContent()).includes('$96.2B'))failures.push(name+' filing data missing');
   await page.screenshot({path:path.join(dir,name+'-after-cutoff.png'),fullPage:false});
   await page.locator('[data-time-state=before]').click();
   if(!(await page.locator('#paper-value').textContent()).includes('HELD'))failures.push(name+' cutoff reverse failed');
  }
  if(name==='phone'){
   await page.locator('#menu-button').click();
   const open=await page.locator('#menu-button').getAttribute('aria-expanded');
   if(open!=='true'||!(await page.locator('#mobile-nav').isVisible()))failures.push('mobile menu failed');
   await page.locator('#menu-button').click();
   if((await page.locator('#menu-button').getAttribute('aria-expanded'))!=='false')failures.push('mobile menu close failed');
  }
  if(name==='desktop'){
   const link=await page.locator('#story-link').getAttribute('href');
   report.functional.beforeLink=link;
   if(!link.includes('asOf=2026-08-26T20'))failures.push('deep link not present');
   const cases=await page.locator('.case-row').count();
   if(cases!==3)failures.push('three SEC cases missing');
  }
 }catch(e){failures.push(name+' '+e.message)}
 await page.close();
}
const page=await browser.newPage({viewport:{width:1440,height:900}});
try{
 await page.goto(base+'/desk.html?ticker=NVDA&asOf=2026-08-26T20%3A21%3A18.000Z',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#evidence-count')?.textContent.includes('visible'),{timeout:45000});
 const early=await page.locator('#evidence-count').textContent();
 const earlyState=await page.locator('#financial-state').textContent();
 if(!earlyState.includes('Held out'))failures.push('early SEC exhibit leaked: '+earlyState);
 report.functional.early=early;
 await page.goto(base+'/desk.html?ticker=AAPL',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#selected-case')?.textContent.includes('AAPL'),{timeout:45000});
 report.functional.apple=await page.locator('#selected-case').textContent();
}catch(e){failures.push('desk deep-link '+e.message)}
await page.close();
await browser.close();
report.failures=failures;report.pass=failures.length===0;
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
