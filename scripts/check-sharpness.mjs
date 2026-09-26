import {chromium,expect} from '@playwright/test';
import {categories} from '../content.js';
import {mkdir,writeFile} from 'node:fs/promises';
const output='qa/v2.5.16';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2});const errors=[],results=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.argv[2]||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});
 await page.waitForTimeout(5500);
 await page.locator('.motion-toggle').click();
 const canvas=await page.locator('.liquid-canvas').evaluate(c=>({width:c.width,height:c.height}));
 expect(canvas).toEqual({width:3840,height:2160});
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const [category,data] of Object.entries(categories)){
  await page.locator(`#tab-${category}`).click();
  for(const project of data.projects){
   await page.locator(`.project-card[data-project="${project.id}"]`).click();
   await expect.poll(()=>page.locator('.preview-image').evaluate(i=>i.complete&&i.naturalWidth===3840&&i.naturalHeight===2160)).toBe(true);
   const box=await page.locator('.preview-image').boundingBox();expect(box.width/box.height).toBeCloseTo(16/9,2);
   await page.screenshot({path:`${output}/${project.id}-desktop.png`});results.push({id:project.id,source:'3840x2160',ratio:box.width/box.height});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#tab-web').click();
 const box=await page.locator('.preview-image').boundingBox();expect(box.width/box.height).toBeCloseTo(16/9,2);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${output}/mobile.png`,fullPage:true});expect(errors).toEqual([]);
 await writeFile(`${output}/sharpness-results.json`,JSON.stringify({canvas,results,mobile:'PASS',errors},null,2));console.log('PASS: seven 4K sources, 16:9 display, DPR2 renderer, mobile layout');
}finally{await browser.close();}
