import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {categories} from '../content.js';
const output='qa/v2.4.0';
await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','dist','4189'],{stdio:'pipe',windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({reducedMotion:'reduce'}),results=[];
try{
  for(const viewport of [{width:2560,height:1270},{width:1920,height:1080},{width:1440,height:900},{width:1440,height:700},{width:1024,height:768},{width:850,height:1000},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4189/#works/web',{waitUntil:'networkidle'});
    await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
    for(const [category,data] of Object.entries(categories)){
      await page.locator(`#tab-${category}`).click();
      for(const project of data.projects){
        await page.locator(`.project-card[data-project="${project.id}"]`).click();
        await page.evaluate(()=>document.fonts.ready);
        await expect.poll(()=>page.locator('.preview-image').evaluate(img=>img.complete&&img.naturalWidth>500)).toBe(true);
        const metrics=await page.evaluate(()=>{
          const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
          const title=document.querySelector('.project-title'),range=document.createRange();range.selectNodeContents(title);
          return{header:rect('.site-header'),gallery:rect('.gallery'),image:rect('.preview-image'),info:rect('.project-info'),label:rect('.project-label'),collection:rect('.collection'),controls:rect('.canvas-controls'),titleRight:Math.max(...[...range.getClientRects()].map(r=>r.right)),scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight};
        });
        if(project.id==='gaia-senseware'||(viewport.width===1440&&viewport.height===900))await page.screenshot({path:`${output}/layout-${viewport.width}-${viewport.height}-${project.id}.png`,fullPage:true});
        expect(metrics.scrollWidth).toBeLessThanOrEqual(viewport.width);
        expect(Math.abs(metrics.header.x-metrics.gallery.x)).toBeLessThan(2);
        expect(Math.abs(metrics.gallery.x-metrics.collection.x)).toBeLessThan(2);
        expect(Math.abs(metrics.header.right-metrics.collection.right)).toBeLessThan(2);
        expect(metrics.label.width).toBeLessThanOrEqual(440);
        expect(metrics.titleRight).toBeLessThanOrEqual(metrics.info.right+1);
        expect(metrics.controls.y).toBeGreaterThanOrEqual(metrics.collection.y);
        expect(metrics.controls.bottom).toBeLessThanOrEqual(metrics.collection.bottom);
        if(viewport.width>850){
          expect(metrics.info.x-metrics.image.right).toBeGreaterThanOrEqual(31);
          expect(metrics.info.x-metrics.image.right).toBeLessThanOrEqual(81);
          expect(metrics.scrollHeight).toBeLessThanOrEqual(viewport.height);
        }else{
          expect(metrics.info.y-metrics.image.bottom).toBeGreaterThanOrEqual(24);
        }
        results.push({viewport,project:project.id,status:'PASS',metrics});
      }
    }
    console.log('PASS: all works and shared alignment at',viewport.width,viewport.height);
  }
}catch(error){results.push({status:'FAIL',details:error.stack});await page.screenshot({path:output+'/layout-failure.png',fullPage:true});console.error(error);process.exitCode=1;}
finally{await writeFile(output+'/layout-results.json',JSON.stringify({version:'2.4.0',testedAt:new Date().toISOString(),browser:await browser.version(),results},null,2));await browser.close();server.kill();}
