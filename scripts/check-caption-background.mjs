import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out=process.env.CAPTION_OUT||'qa/caption-background';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];
try{
 const page=await browser.newPage({viewport:process.env.CAPTION_MOBILE==='1'?{width:390,height:844}:{width:1200,height:850}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.captionFrames=[];window.captionAnimations=[];
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){if(this.matches('.project-title,.title-line,.project-label,.project-action-row,.project-note,[data-transition-text]'))captionAnimations.push({frames,options});return animate.call(this,frames,options);};
  const sample=()=>{const ghost=document.querySelector('[data-transition-text=outgoing]'),title=ghost?.querySelector('.project-title'),next=document.querySelector('#work-panel .project-title');
   captionFrames.push({t:performance.now(),phase:document.querySelector('#art-stage')?.dataset.transitionPhase,old:ghost?Number(getComputedStyle(ghost).opacity):next?Number(getComputedStyle(next).opacity)*Number(getComputedStyle(next.closest('.project-info')).opacity):null,title:title?{x:title.getBoundingClientRect().x,y:title.getBoundingClientRect().y,width:title.getBoundingClientRect().width,height:title.getBoundingClientRect().height,font:getComputedStyle(title).fontSize}:null,incoming:next?Number(getComputedStyle(next).opacity):null,rolling:!!document.querySelector('.panel-canvas')});requestAnimationFrame(sample);};requestAnimationFrame(sample);
 });
 await page.goto((process.env.CAPTION_URL||'http://127.0.0.1:4173/')+'#works/text/hinahina-note',{waitUntil:'networkidle'});
 await page.waitForFunction(()=>!document.body.dataset.entrance);
 const before=await page.locator('#work-panel .project-title').evaluate(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,font:getComputedStyle(e).fontSize}));
 await page.evaluate(()=>captionFrames.length=0);
 await page.locator('.project-card').first().click();
 await page.waitForTimeout(180);
 const earlyFade=await page.evaluate(()=>captionFrames.filter(s=>s.phase==='fade-out'));
 expect(earlyFade.some(s=>s.old>0&&s.old<1)).toBe(true);
 const ghost=page.locator('[data-transition-text=outgoing]');
 await expect(ghost).toHaveCount(1);
 const mid=await ghost.evaluate(e=>Number(getComputedStyle(e).opacity));expect(mid).toBeGreaterThan(0);expect(mid).toBeLessThan(1);
 const samples=await page.evaluate(()=>captionFrames);
 const early=samples.filter(s=>s.phase==='fade-out'&&s.title);
 expect(early.length).toBeGreaterThan(0);expect(early.some(s=>s.old<1&&s.old>0)).toBe(true);
 for(const s of early){expect(s.title).toEqual(before);expect(s.rolling).toBe(false);}
 await page.screenshot({path:`${out}/background-fade.png`});
 await page.waitForSelector('.panel-canvas');
 await expect(page.locator('#work-panel .project-title')).toHaveCSS('opacity','0');
 await expect(ghost).toHaveCount(0);
 await page.waitForSelector('.panel-canvas',{state:'detached'});
 const incoming=Number(await page.locator('#work-panel .project-title').evaluate(e=>getComputedStyle(e).opacity));expect(incoming).toBeGreaterThan(0);expect(incoming).toBeLessThan(.8);
 await expect(page.locator('#work-panel .project-title')).toHaveCSS('opacity','1');
 const frames=await page.evaluate(()=>captionFrames),animations=await page.evaluate(()=>captionAnimations);
 expect(animations.every(a=>a.frames.every(f=>Object.keys(f).every(k=>k==='opacity')))).toBe(true);
 results.push('Caption fades at background fade-out before wring; title bounds/font unchanged; incoming caption waits for image release and uses opacity only');
 await page.locator('.project-card').nth(1).click();await page.waitForTimeout(150);await page.locator('.project-card').nth(2).click();
 await expect(page.locator('#work-panel')).toHaveAttribute('data-project','hinahina-x');
 await expect(page.locator('#work-panel .project-title')).toHaveCSS('opacity','1',{timeout:10000});await expect(ghost).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('.project-card').first().click();
 await expect(page.locator('#work-panel .project-title')).toHaveCSS('opacity','1');await expect(page.locator('.panel-canvas')).toHaveCount(0);
 results.push('Rapid navigation and reduced-motion navigation restore visible text without leftover overlays');
 expect(errors).toEqual([]);
 await writeFile(`${out}/results.json`,JSON.stringify({url:page.url(),bundle:await page.locator('script[type=module]').getAttribute('src'),results,errors,frames},null,2));console.log(results.join('\n'));
}finally{await browser.close();}
