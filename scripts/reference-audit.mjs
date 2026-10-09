import { chromium } from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
const output='artifacts/reference';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const measurements=[];
for(const config of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]){
 const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:1});
 await page.goto('https://monodrift.framer.website/',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForTimeout(3600);
 const info=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('h1,h2,nav,main,header,button,a')];
  const headings=els.filter(x=>/^H[12]$/.test(x.tagName)).slice(0,8).map(el=>{
    const cs=getComputedStyle(el),rect=el.getBoundingClientRect();
    return {text:el.textContent.trim().slice(0,120),size:cs.fontSize,weight:cs.fontWeight,family:cs.fontFamily,
      color:cs.color,lineHeight:cs.lineHeight,letterSpacing:cs.letterSpacing,top:Math.round(rect.top),width:Math.round(rect.width)};
  });
  const photos=[...document.querySelectorAll('img')].slice(0,9).map(img=>({alt:img.alt,src:img.currentSrc.slice(0,240),width:img.getBoundingClientRect().width}));
  return {title:document.title,bodyBackground:getComputedStyle(document.body).backgroundColor,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,
    text:document.body.innerText.slice(0,4500),headings,photos};
 });
 measurements.push({view:config.name,...info});
 await page.screenshot({path:path.join(output,config.name+'-top.png'),fullPage:false,animations:'disabled'});
 await page.screenshot({path:path.join(output,config.name+'-full.png'),fullPage:true,animations:'disabled'});
 for(const y of (config.name==='desktop'?[750,1750,3000]:[750,1700,2900])) {
  await page.evaluate(n=>scrollTo(0,n),y);await page.waitForTimeout(600);
  await page.screenshot({path:path.join(output,config.name+'-'+y+'.png'),fullPage:false,animations:'disabled'});
 }
 await page.close();
}
await browser.close();
await writeFile(path.join(output,'findings.json'),JSON.stringify(measurements,null,2));
console.log(JSON.stringify(measurements.map(({view,title,bodyBackground,width,height,headings,photos})=>({view,title,bodyBackground,width,height,headings,photos:photos.slice(0,3)})),null,2));
