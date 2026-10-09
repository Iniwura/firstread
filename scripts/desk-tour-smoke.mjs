import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const base=(process.env.FIRSTREAD_URL||'http://127.0.0.1:4174').replace(/\/$/,'');
const out=path.resolve(process.env.FIRSTREAD_SCREENSHOT_DIR||'artifacts/tour');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results={};const failures=[];
try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>failures.push('desktop JS '+e.message));
  await page.goto(base+'/desk.html',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#desk-tour:not([hidden])',{timeout:45000});
  results.autoOpens=await page.locator('#tour-title').textContent();
  if(!results.autoOpens.includes('company'))failures.push('first-visit onboarding did not begin at the cases');
  if(await page.locator('#tour-target-outline').evaluate(el=>el.getBoundingClientRect().width)<100)failures.push('spotlight does not highlight a visible target');
  await page.screenshot({path:path.join(out,'desktop-first-visit.png'),animations:'disabled'});
  await page.locator('#tour-next').click();
  results.second=await page.locator('#tour-title').textContent();
  if(!results.second.includes('decision time'))failures.push('Next does not advance tour');
  await page.locator('#tour-back').click();
  if(!(await page.locator('#tour-step-count').textContent()).startsWith('01'))failures.push('Back fails');
  await page.keyboard.press('Escape');
  if(await page.locator('#desk-tour').isVisible())failures.push('Escape did not close tour');
  results.afterEscape=await page.evaluate(()=>localStorage.getItem('firstread:desk-tour:v1'));
  if(results.afterEscape!=='seen')failures.push('tour completion state not persisted');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#selected-case')?.textContent.includes('NVDA'),{timeout:45000});
  await page.waitForTimeout(800);
  if(await page.locator('#desk-tour').isVisible())failures.push('tour unexpectedly auto-repeats after visit');
  await page.locator('#tour-launch').click();
  if(!(await page.locator('#desk-tour').isVisible()))failures.push('manual replay did not open');
  await page.keyboard.press('Tab');
  let tabInside=await page.evaluate(()=>document.querySelector('#tour-card').contains(document.activeElement));
  if(!tabInside)failures.push('focus escaped modal on Tab');
  for(let i=0;i<7;i++)await page.locator('#tour-next').click();
  results.finalStep=await page.locator('#tour-title').textContent();
  if(!results.finalStep.includes('receipt')&&!results.finalStep.includes('evidence'))failures.push('last step not reached');
  await page.screenshot({path:path.join(out,'desktop-final-step.png'),animations:'disabled'});
  await page.locator('#tour-next').click();
  if(await page.locator('#desk-tour').isVisible())failures.push('finish did not close modal');
  results.finishFocus=await page.evaluate(()=>document.activeElement?.id);
  if(results.finishFocus!=='as-of-input')failures.push('finish did not guide focus to clock');
  await page.locator('#quickstart-tour').click();
  if(!await page.locator('#desk-tour').isVisible())failures.push('contextual quickstart does not open');
  await page.locator('#tour-skip').click();
  if(await page.locator('#desk-tour').isVisible())failures.push('Skip did not close tour');
  await ctx.close();

  const mobileCtx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=await mobileCtx.newPage();
  mobile.on('pageerror',e=>failures.push('mobile JS '+e.message));
  await mobile.goto(base+'/desk.html',{waitUntil:'domcontentloaded',timeout:45000});
  await mobile.waitForSelector('#desk-tour:not([hidden])',{timeout:45000});
  results.mobile=await mobile.evaluate(()=>{
    const card=document.querySelector('#tour-card');
    const r=card.getBoundingClientRect();
    const highlight=document.querySelector('#tour-target-outline').getBoundingClientRect();
    return {visible:!document.querySelector('#desk-tour').hidden,
      screenWidth:innerWidth,cardWidth:r.width,cardBottom:Math.round(innerHeight-r.bottom),
      highlightHeight:highlight.height,
      pageOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
  });
  if(!results.mobile.visible||results.mobile.cardWidth<380||results.mobile.cardBottom>5||results.mobile.pageOverflow)failures.push('mobile tour is not a usable bottom sheet');
  await mobile.screenshot({path:path.join(out,'mobile-first-visit.png'),animations:'disabled'});
  await mobile.locator('#tour-next').click();
  await mobile.locator('#tour-skip').click();
  if(await mobile.locator('#desk-tour').isVisible())failures.push('mobile Skip fails');
  await mobileCtx.close();

  const cleanCtx=await browser.newContext({viewport:{width:1100,height:850}});
  const clean=await cleanCtx.newPage();
  await clean.goto(base+'/desk.html?tour=off',{waitUntil:'domcontentloaded',timeout:45000});
  await clean.waitForFunction(()=>document.querySelector('#selected-case')?.textContent.includes('NVDA'),{timeout:45000});
  await clean.waitForTimeout(600);
  if(await clean.locator('#desk-tour').isVisible())failures.push('automated/no-tour mode still opens guide');
  await clean.locator('#tour-launch').click();
  if(!(await clean.locator('#desk-tour').isVisible()))failures.push('no-tour URL disabled manual replay');
  await cleanCtx.close();
} catch(e) {
 failures.push('unhandled '+e.message);
} finally {
 await browser.close();
}
console.log(JSON.stringify({pass:failures.length===0,results,failures},null,2));
if(failures.length)process.exitCode=1;
