import { chromium } from 'playwright';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
const origin=(process.env.FIRSTREAD_URL||'http://127.0.0.1:4174').replace(/\/$/,'');
const folder=path.resolve(process.env.FIRSTREAD_SCREENSHOT_DIR||'artifacts/bitget-blue');
await mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];const checks=[];
for(const [label,width,height] of [['desktop',1440,900],['laptop',1100,800],['tablet',820,1050],['phone',390,844],['small-phone',375,812]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 page.on('pageerror',err=>failures.push(label+': '+err.message));
 await page.goto(origin+'/desk.html',{waitUntil:'domcontentloaded',timeout:45000});
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
 const view=await page.evaluate(()=>{
  const masthead=document.querySelector('.masthead-body h1');
  const nav=document.querySelector('.desk-nav');
  const css=getComputedStyle(masthead);
  const selected=document.querySelector('.case-button.active');
  const originalIDs=['#run-button','#as-of-input','#baseline-decision','#evidence-timeline',
    '#financial-content','#price-chart','#brief-verified','#contradictions','#ai-form','#receipt-json'];
  return {
    width:innerWidth,
    pageScrollWidth:document.documentElement.scrollWidth,
    noOverflow:document.documentElement.scrollWidth<=innerWidth+2,
    fontFamily:css.fontFamily,fontSize:css.fontSize,
    selectedTicker:selected?.dataset.ticker,
    cyan:getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim(),
    headlineH:Math.round(masthead.getBoundingClientRect().height),
    navBackground:getComputedStyle(nav).backgroundColor,
    heroBackground:getComputedStyle(document.querySelector('.desk-masthead')).backgroundColor,
    featureBackground:getComputedStyle(document.querySelector('.masthead-aside')).backgroundColor,
    selectedBackground:getComputedStyle(selected).backgroundColor,
    archiveSVG:document.querySelector('.hero-orbit svg')!==null,
    dossierTicker:document.querySelector('#hero-ticker')?.textContent,
    dossierAccept:document.querySelector('#hero-accept-time')?.textContent,
    cutoffPhase:document.querySelector('#cutoff-tape')?.dataset.phase,
    financialBackground:getComputedStyle(document.querySelector('.financial-zone')).backgroundColor,
    briefBackground:getComputedStyle(document.querySelector('.brief-zone')).backgroundColor,
    availableBindings:originalIDs.every(id=>document.querySelector(id)!==null)
  };
 });
 checks.push({label,...view});
 if(!view.noOverflow)failures.push(label+': horizontal overflow');
 if(!view.fontFamily.includes('Chakra Petch'))failures.push(label+': missing display typeface');
 if(view.cyan.toUpperCase()!=='#00F0FF')failures.push(label+': wrong accent');
 if(view.navBackground!=='rgb(8, 8, 8)'||view.heroBackground!=='rgb(8, 8, 8)')
  failures.push(label+': page foundation not neutral black');
 if(view.featureBackground!=='rgb(22, 22, 22)' || view.selectedBackground!=='rgb(32, 32, 32)')
  failures.push(label+': giant cyan feature or selected surface still present');
 if(!view.archiveSVG || view.dossierTicker !== 'NVDA' || !view.dossierAccept.includes('UTC'))
  failures.push(label+': source-linked active filing dossier did not render');
 if(view.cutoffPhase !== 'acceptance') failures.push(label+': default replay marker did not identify SEC acceptance');
 if(!['rgb(12, 12, 12)','rgb(17, 17, 17)'].includes(view.financialBackground))
  failures.push(label+': research surfaces are blue tinted');
 if(!view.availableBindings)failures.push(label+': missing dynamic controls');
 if(view.selectedTicker!=='NVDA')failures.push(label+': NVDA selection missing');
 if(label==='desktop'||label==='phone'){
  await page.screenshot({path:path.join(folder,label+'-desk-top.png'),animations:'disabled'});
  await page.screenshot({path:path.join(folder,label+'-desk-full.png'),fullPage:true,animations:'disabled'});
  await page.locator('#financial').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(folder,label+'-financial.png'),animations:'disabled'});
  await page.locator('#market').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(folder,label+'-market.png'),animations:'disabled'});
  const spectrum = await page.locator('#earnings-spectrum').textContent();
  if(!spectrum.includes('YEAR ON YEAR') || !spectrum.includes('Revenue'))
    failures.push(label+': source-based comparison spectrum missing');
  await page.locator('[data-replay-offset="-15"]').click();
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('Held out'),{timeout:45000});
  if((await page.locator('#cutoff-tape').getAttribute('data-phase')) !== 'before')
    failures.push(label+': before filing cutoff visualization incorrect');
  if((await page.locator('#earnings-spectrum').textContent()).trim())
    failures.push(label+': financial visualization leaked before SEC acceptance');
  await page.locator('[data-replay-offset="0"]').click();
  if((await page.locator('#cutoff-tape').getAttribute('data-phase')) !== 'acceptance')
    failures.push(label+': SEC acceptance marker incorrect');
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
 }
 await page.close();
}
const homepage=await browser.newPage({viewport:{width:1440,height:900}});
await homepage.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:45000});
const home=await homepage.evaluate(()=>({
 token:getComputedStyle(document.documentElement).getPropertyValue('--signal').trim(),
 heroTitle:document.querySelector('#hero-title')?.textContent,
 photoLoaded:document.querySelector('.hero-photo')?.naturalWidth>0,
 oldGreenPresent:getComputedStyle(document.documentElement).getPropertyValue('--signal').trim()==='#b7ff65'
}));
if(home.token.toUpperCase()!=='#00F0FF')failures.push('homepage brand accent mismatch');
if(home.oldGreenPresent)failures.push('homepage lime remains');
if(!home.photoLoaded)failures.push('homepage archive photo missing');
await homepage.screenshot({path:path.join(folder,'homepage-blue-top.png'),animations:'disabled'});
await homepage.close();
await browser.close();
console.log(JSON.stringify({pass:!failures.length,checks,home,failures},null,2));
if(failures.length)process.exitCode=1;
