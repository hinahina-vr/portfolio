import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {categories} from '../content.js';

const before=process.argv.includes('--before');
const output='qa/v2.4.0';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
  const page=await browser.newPage({reducedMotion:'reduce'});
  for(const viewport of [{width:1920,height:1080},{width:768,height:1024}]){
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
    await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
    await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
    await page.evaluate(()=>document.fonts.ready);
    for(const [category,data] of Object.entries(categories)){
      await page.locator(`#tab-${category}`).click();
      for(const project of data.projects){
        await page.locator(`.project-card[data-project="${project.id}"]`).click();
        await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
        const metrics=await page.locator('.project-description').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return{width:el.getBoundingClientRect().width,lines:new Set([...range.getClientRects()].map(rect=>Math.round(rect.top))).size,text:el.innerText,overflow:getComputedStyle(el).overflow};});
        const pass=metrics.lines===3&&metrics.text===project.description;
        results.push({viewport,project:project.id,status:pass?'PASS':'FAIL',...metrics});
        if(!pass&&!before)process.exitCode=1;
        if(project.id==='gaia-senseware'){
          await page.screenshot({path:`${output}/${before?'before':'after'}-caption-${viewport.width}.png`,fullPage:true});
          await page.locator('.project-label').screenshot({path:`${output}/${before?'before':'after'}-label-${viewport.width}.png`});
        }
      }
    }
  }
  console.log(JSON.stringify(results.map(({viewport,project,status,width,lines})=>({viewport:viewport.width,project,status,width,lines}))));
}catch(error){results.push({status:'FAIL',details:error.stack});process.exitCode=1;console.error(error);}
finally{await writeFile(`${output}/${before?'before':'after'}-caption-lines.json`,JSON.stringify({version:before?'2.3.0':'2.4.0',artifact:'dist',testedAt:new Date().toISOString(),browser:await browser.version(),results},null,2));await browser.close();}
