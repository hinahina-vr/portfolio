import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='qa/opening-behavior';await mkdir(out,{recursive:true});const url=process.env.OPENING_URL||'http://127.0.0.1:4173/';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});const results=[],errors=[];let bundle;
const open=async(delay=0,paused=false)=>{const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));if(paused)await p.addInitScript(()=>{
 localStorage.setItem('portfolio-motion','paused');
 const draw=WebGL2RenderingContext.prototype.drawElements;
 WebGL2RenderingContext.prototype.drawElements=function(...args){const r=draw.apply(this,args);if(this.canvas.classList.contains('liquid-canvas')&&!this.getParameter(this.FRAMEBUFFER_BINDING)){const image=document.querySelector('.preview-image');if(image){const box=image.getBoundingClientRect(),pixel=new Uint8Array(4);this.readPixels(Math.floor((box.x+box.width*.7)*this.canvas.width/innerWidth),Math.floor((innerHeight-box.y-box.height*.5)*this.canvas.height/innerHeight),1,1,this.RGBA,this.UNSIGNED_BYTE,pixel);window.pausedPixel=[...pixel];}}return r;};
 });if(delay)await p.route('**/assets/gaia-senseware.png',async route=>{await new Promise(r=>setTimeout(r,delay));await route.continue();});await p.goto(url,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>document.body.dataset.entrance==='playing');bundle=await p.locator('script[type=module]').getAttribute('src');return p;};
try{
 let p=await open();
 await p.waitForFunction(()=>{const e=document.querySelector('.category-tabs'),s=getComputedStyle(e);return Number(s.opacity)>.3&&Number(s.opacity)<.99&&s.transform!=='none';});
 await p.screenshot({path:`${out}/ui-emerging.png`});
 await p.waitForFunction(()=>!document.body.dataset.entrance);
 expect(await p.locator('.preview-image').evaluate(e=>e.naturalWidth)).toBe(3840);
 for(const img of await p.locator('.project-card img').all())expect(await img.evaluate(e=>e.naturalWidth)).toBe(320);
 await p.screenshot({path:`${out}/settled.png`});
 await p.locator('.project-card').nth(1).click();await p.waitForSelector('.panel-canvas');await p.waitForSelector('.panel-canvas',{state:'detached'});await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');
 results.push('Elastic UI reveal remains; small previews are 320px, main artwork stays 3840px; next wring and text fade work');await p.close();
 p=await open(6000);await expect(p.locator('.site-header')).toHaveCSS('opacity','0');await expect(p.locator('#background-root')).toHaveCSS('opacity','0');await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','0');
 await p.waitForFunction(()=>!document.body.dataset.entrance,null,{timeout:20000});await expect(p.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');await expect(p.locator('#background-root')).toHaveCSS('opacity','1');
 await expect(p.locator('#work-panel')).toHaveAttribute('data-project','glsl-showcase',{timeout:12000});results.push('Six-second image delay keeps UI hidden until prepared; opening is not interrupted by autoplay and autoplay resumes afterward');await p.close();
 for(const type of ['input','reduced','paused']){
  p=await open(1800,type==='paused');if(type!=='reduced')await p.mouse.click(4,4);else await p.emulateMedia({reducedMotion:'reduce'});
  await p.waitForFunction(()=>!document.body.dataset.entrance);await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');await p.waitForTimeout(3000);await expect(p.locator('.liquid-canvas')).not.toHaveClass(/wet-entrance/);await expect(p.locator('.site-header')).toHaveCSS('opacity','1');
  if(type==='paused'){expect(await p.evaluate(()=>window.pausedPixel?.[3])).toBe(255);await expect(p.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');}
  results.push(`${type}: cancelling during preparation restores UI and cannot restart the opening later`);await p.close();
 }
 p=await open();await p.waitForSelector('.wet-entrance');await p.waitForTimeout(600);await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>!document.body.dataset.entrance);await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await p.screenshot({path:`${out}/resized-mobile.png`,fullPage:true});await p.close();results.push('Resize during emergence settles the image and UI cleanly at mobile width');
 expect(errors).toEqual([]);await writeFile(`${out}/results.json`,JSON.stringify({bundle,url,results,errors},null,2));console.log(results.join('\n'));
}finally{await b.close();}
