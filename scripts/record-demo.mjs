/**
 * Deterministic, read-only public product walkthrough.
 * Produces a captioned WEBM in GitHub Actions for manual competition use.
 * This is a browser recording, NOT a real human test or LLM response.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const url=(process.env.FIRSTREAD_URL||'https://firstread-psi.vercel.app/').replace(/\/$/,'');
const out=path.resolve(process.env.FIRSTREAD_DEMO_DIR||'artifacts/demo');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({
 viewport:{width:1440,height:900},deviceScaleFactor:1,
 recordVideo:{dir:out,size:{width:1440,height:900}}
});
const page=await context.newPage();
let filename;
try {
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
 await page.evaluate(()=>{
   const box=document.createElement('div'); box.id='firstread-demo-caption';
   box.style.cssText='position:fixed;z-index:9999;bottom:25px;left:50%;transform:translateX(-50%);max-width:min(950px,90vw);padding:14px 23px;color:#f9f9f2;background:rgba(23,35,32,.94);box-shadow:0 6px 35px rgba(0,0,0,.16);text-align:center;font:600 17px/1.4 system-ui,sans-serif;pointer-events:none;border-radius:4px;letter-spacing:.005em';
   document.body.appendChild(box);
 });
 const caption=async(label)=>page.evaluate((text)=>{document.querySelector('#firstread-demo-caption').textContent=text;},label);
 const hold=async(ms=4500)=>page.waitForTimeout(ms);
 const focus=async(selector)=>{await page.locator(selector).scrollIntoViewIfNeeded();await hold(500);};
 await caption('FIRSTREAD · Evidence-timed earnings intelligence for Bitget rTokens');
 await focus('.hero');await hold(6000);

 await caption('1/6 · Travel to 15 minutes BEFORE NVIDIA’s SEC filing');
 await page.locator('[data-replay-offset="-15"]').click();
 await page.waitForFunction(()=>document.querySelector('#evidence-count')?.textContent.includes('0 visible'),{timeout:45000});
 await focus('#evidence-timeline'); await hold(5500);

 await caption('2/6 · At filing acceptance, SEC-reported earnings become available');
 await page.locator('[data-replay-offset="0"]').click();
 await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-NVDA'),{timeout:45000});
 await focus('#evidence-timeline');await hold(4400);
 await focus('#financial-content');
 await caption('NVIDIA · Year-over-year revenue, EPS and operating income from EX-99.1');
 await hold(7500);
 await focus('#financial-drivers');
 await caption('Every thesis gets a counterargument · Demand, guidance, and missing historical consensus');
 await hold(6500);
 await page.locator('#run-crosscheck').click();
 await page.waitForFunction(()=>document.querySelector('#crosscheck-status')?.textContent.includes('DISCREPANCY'),{timeout:45000});
 await focus('#crosscheck-output');
 await caption('Bitget MCP agrees on NVIDIA revenue and EPS, but operating income differs by $269M');
 await hold(7000);

 await page.getByRole('button',{name:/AAPL/}).first().click();
 await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-AAPL'),{timeout:45000});
 await focus('#financial-content');await caption('3/6 · Apple · Compare the same fiscal quarter one year earlier');await hold(5500);
 await focus('#financial-drivers');await caption('Apple · Reported tariff-refund benefits change the interpretation of EPS');await hold(5500);
 await page.locator('#run-crosscheck').click();
 await page.waitForFunction(()=>document.querySelector('#crosscheck-status')?.textContent.includes('Different reporting periods'),{timeout:45000});
 await focus('#crosscheck-status');
 await caption('Apple · The vendor returns cumulative totals; FIRSTREAD refuses a false quarterly comparison');
 await hold(6500);

 await page.getByRole('button',{name:/MSFT/}).first().click();
 await page.waitForFunction(()=>document.querySelector('#financial-state')?.textContent.includes('E3-MSFT'),{timeout:45000});
 await focus('#financial-content');await caption('4/6 · Microsoft · Cloud growth versus declining Personal Computing');await hold(6000);
 await focus('#financial-drivers');await caption('5/6 · Challenge the headline · Discrete earnings benefits and segment divergence');await hold(6500);
 await page.locator('#run-crosscheck').click();
 await page.waitForFunction(()=>document.querySelector('#crosscheck-status')?.textContent.startsWith('Compared'),{timeout:45000});
 await focus('#crosscheck-output');
 await caption('Microsoft · Three separately reported quarterly measures agree with Bitget MCP');
 await hold(7000);

 await focus('#receipt');
 await caption('6/6 · Every read has evidence IDs, timestamps and reproducible source receipts');
 await hold(6500);
 await focus('.hero'); await caption('FIRSTREAD · Know what was available. Know what remains unproven.');
 await hold(4500);
} finally {
 const video=page.video();
 await context.close();
 if(video)filename=await video.path();
 await browser.close();
}
console.log(JSON.stringify({ok:Boolean(filename),source:url,videoPath:filename,notes:'Captioned real-browser walkthrough; not a live LLM demonstration or external human test.'},null,2));
