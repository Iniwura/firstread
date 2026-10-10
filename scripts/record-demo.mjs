/**
 * FIRSTREAD / Final competition judge walkthrough, October 10, 2026.
 *
 * Real public production, real Bitget/SEC responses, real Qwen evidence review.
 * Read-only. No fabricated model answers, simulated trades, or private keys.
 * Fails if the model does not cite the real SEC source.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const origin=(process.env.FIRSTREAD_URL||'https://firstread-psi.vercel.app').replace(/\/$/,'');
const dir=path.resolve(process.env.FIRSTREAD_DEMO_DIR||'artifacts/demo');
await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
 viewport:{width:1440,height:900},deviceScaleFactor:1,
 recordVideo:{dir,size:{width:1440,height:900}},
 reducedMotion:'reduce',
});
const page=await context.newPage();
page.setDefaultTimeout(55000);
const summary={origin,source:'REAL_PUBLIC_DATA',modelOutput:'PENDING',integrity:'NOT_VERIFIED'};
let video=null;
let failed=null;
try {
  const wait=async(ms=2800)=>page.waitForTimeout(ms);
  const caption=async(text)=>page.evaluate((value)=>{
    let banner=document.querySelector('#fr-judge-caption');
    if(!banner){
      banner=document.createElement('div');
      banner.id='fr-judge-caption';
      banner.style.cssText='position:fixed;z-index:699;right:20px;bottom:22px;max-width:640px;padding:13px 20px;color:#fff;background:#080808ed;border:1px solid #616161;border-left:5px solid #00f0ff;font:600 15px/1.5 system-ui,sans-serif;pointer-events:none';
      document.body.appendChild(banner);
    }
    banner.textContent=value;
  },text);
  const focus=async(selector)=>{
    await page.locator(selector).scrollIntoViewIfNeeded();
    await wait(600);
  };
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.evaluate(()=>document.fonts.ready);
  await caption('FIRSTREAD · The information divide. Bitget Reality × SEC earnings research.');
  await wait(3800);
  await page.screenshot({path:path.join(dir,'01-homepage.png')});

  await page.goto(origin+'/desk.html?tour=off',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
  await caption('A real research desk · Three SEC filing cases · No wallet or order execution');
  await focus('.desk-masthead');
  await wait(3600);
  await page.screenshot({path:path.join(dir,'02-desk.png')});
  await page.locator('#tour-launch').click();
  await page.locator('#desk-tour:not([hidden])').waitFor();
  await caption('First-visit help · A guided tour explains every research step');
  await wait(2500);
  await page.screenshot({path:path.join(dir,'03-guided-tour.png')});
  await page.locator('#tour-skip').click();

  await caption('01 / The decision clock · Rewind to BEFORE the SEC filing');
  await focus('#clock');
  await page.locator('[data-replay-offset="-15"]').click();
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('Held out'),{timeout:45000});
  await focus('#evidence');
  await wait(3100);
  await page.screenshot({path:path.join(dir,'04-before-filing.png')});
  if(!(await page.locator('#financial-state').textContent()).includes('Held out')) throw new Error('Evidence exclusion check failed');

  await caption('02 / At SEC acceptance · The filed earnings exhibit becomes visible');
  await page.locator('[data-replay-offset="0"]').click();
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
  await focus('#evidence');
  await wait(2900);
  await focus('#financial');
  await caption('Real SEC EX-99.1 · Same-quarter financials and common-scale year-on-year growth');
  await wait(3400);
  await page.screenshot({path:path.join(dir,'05-sec-financials.png')});
  await focus('#financial-drivers');
  await caption('Every bullish line has a caveat · Read the driver and opposing thesis');
  await wait(2400);

  await page.locator('#run-crosscheck').click();
  await page.waitForFunction(()=>!document.querySelector('#crosscheck-status')?.textContent.includes('Fetching'),{timeout:45000});
  const reconciliation=await page.locator('#crosscheck-status').textContent();
  summary.sourceReconciliation=reconciliation;
  await focus('.source-reconcile');
  await caption('03 / Independent Bitget US equity MCP check · Different source, current-day data');
  await wait(3100);
  await page.screenshot({path:path.join(dir,'06-mcp-crosscheck.png')});
  await focus('#market');
  await caption('The real rToken market chart keeps later observations OUT of the historical decision');
  await wait(3100);
  await page.screenshot({path:path.join(dir,'07-market-replay.png')});

  await page.getByRole('button',{name:/MSFT/}).first().click();
  await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-MSFT'),{timeout:45000});
  await page.locator('[data-replay-offset="120"]').click();
  await page.waitForFunction(()=>document.querySelector('#replay-note')?.textContent.includes('22:04'),{timeout:45000});
  await focus('#ai');
  const provider=await page.locator('#ai-provider-status').textContent();
  if(!provider.toLowerCase().includes('live ai configured')) throw new Error('Live Qwen not configured in production');
  const question='For Microsoft Q4 FY2026, identify two SEC-filed financial figures, a limitation without dated analyst consensus, and the next human research step. Cite exact evidence IDs.';
  await page.locator('#ai-question').fill(question);
  await caption('04 / Ask Qwen · The model receives only the server-verified historical packet');
  await wait(1700);
  await page.locator('#ai-form button[type="submit"]').click();
  await page.waitForFunction(()=>{
    const result=document.querySelector('#ai-answer')?.textContent||'';
    return result.length>90 && !result.includes('Checking the evidence packet');
  },null,{timeout:95000});
  const modelAnswer=await page.locator('#ai-answer').textContent();
  if(!modelAnswer.includes('[E3-MSFT]') || /AI review unavailable|AI abstained|unverified or future evidence/i.test(modelAnswer))
    throw new Error('Live Qwen answer did not cite approved MSFT SEC exhibit');
  summary.modelOutput='REAL_QWEN_WITH_E3_MSFT_CITATION';
  await focus('#ai-answer');
  await caption('Verified live Qwen answer · Primary SEC citation [E3-MSFT] · Human retains control');
  await wait(5700);
  await page.screenshot({path:path.join(dir,'08-real-qwen-citation.png')});
  await focus('#receipt');
  await caption('05 / Reproducible receipts · Source IDs, exact cutoff, evidence hash');
  await wait(3000);
  await page.screenshot({path:path.join(dir,'09-research-receipt.png')});
  await focus('.desk-masthead');
  await caption('FIRSTREAD · A complete research task, from question to source-cited next step.');
  await wait(3400);
  summary.integrity='PASS';
} catch(error){
  failed=error;
  summary.integrity='FAILED';
  summary.failure=error.message;
} finally {
  try{video=page.video();await context.close();}finally{await browser.close();}
}
summary.videoWebm=video?await video.path():null;
console.log(JSON.stringify(summary,null,2));
if(failed)process.exitCode=1;
