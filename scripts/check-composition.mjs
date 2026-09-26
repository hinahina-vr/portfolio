import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const before=process.argv.includes('--before');
const output='qa/v2.3.2';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
let measurements;
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const preview=await page.locator('.preview-image').boundingBox();
  const info=await page.locator('.project-info').boundingBox();
  const header=await page.locator('.site-header').boundingBox();
  const controls=await page.locator('.canvas-controls').boundingBox();
  measurements={previewWidth:preview.width,previewHeight:preview.height,titleOffsetX:preview.x-info.x,titleOffsetY:info.y-preview.y,headingInHeader:await page.locator('.site-header h1').count()===1,titleBelowHeader:info.y>=header.y+header.height,headingOutsideWork:await page.locator('.gallery h1,.portfolio-intro').count()===0,controlsGap:controls.y-(preview.y+preview.height)};
  await page.screenshot({path:`${output}/${before?'before':'after'}-composition.png`,fullPage:true});
  for(const [name,verify] of [
    ['Main screenshot is larger than 800 px without leaving the viewport',()=>{expect(preview.width).toBeGreaterThan(800);expect(preview.x+preview.width).toBeLessThanOrEqual(1440);}],
    ['Title sits lower and to the left of the image',()=>{expect(measurements.titleOffsetX).toBeGreaterThan(300);expect(measurements.titleOffsetY).toBeGreaterThan(100);}],
    ['Portfolio identity is in the header, leaving the work area clear',()=>{expect(measurements.headingInHeader).toBe(true);expect(measurements.titleBelowHeader).toBe(true);expect(measurements.headingOutsideWork).toBe(true);}],
    ['Background controls have breathing room below the image',()=>expect(measurements.controlsGap).toBeGreaterThan(10)]
  ]){try{verify();results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',details:error.message});if(!before)process.exitCode=1;}}
  console.log(JSON.stringify({measurements,results}));
}finally{
  await writeFile(`${output}/${before?'before':'after'}-composition.json`,JSON.stringify({version:before?'2.1.1':'2.3.2',artifact:'dist',testedAt:new Date().toISOString(),browser:await browser.version(),measurements,results},null,2));
  await browser.close();
}
