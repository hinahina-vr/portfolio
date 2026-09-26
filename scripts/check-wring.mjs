import {chromium,expect as baseExpect} from '@playwright/test';
const expect=baseExpect.configure({timeout:10000});
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs','dist','4196'],{stdio:'pipe',windowsHide:true});await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.addInitScript(()=>{
 window.particleLife=[];window.panelDraws=[];window.paintForces=[];let frame=0;const step=()=>{frame++;requestAnimationFrame(step);};requestAnimationFrame(step);
 for(const Context of [window.WebGLRenderingContext,window.WebGL2RenderingContext]){
  if(!Context)continue;const original=Context.prototype.drawElements;
  Context.prototype.drawElements=function(...args){
   const result=original.apply(this,args);
   if(this.canvas.classList.contains('panel-canvas')){
    const program=this.getParameter(this.CURRENT_PROGRAM);
    if(this.getUniformLocation(program,'curl')!==null)window.panelDraws.push({frame,time:performance.now(),curl:this.getUniform(program,this.getUniformLocation(program,'curl')),blend:this.getUniform(program,this.getUniformLocation(program,'blend')),bleach:this.getUniform(program,this.getUniformLocation(program,'bleach'))});
   }
   if(this.canvas.classList.contains('liquid-canvas')){
    if(this.getParameter(this.FRAMEBUFFER_BINDING)&&this.getParameter(this.VIEWPORT)[2]===768&&this.getUniformLocation(this.getParameter(this.CURRENT_PROGRAM),'emissionTime')!==null){
     const data=new Float32Array(768*4);this.readPixels(0,0,768,1,this.RGBA,this.FLOAT,data);window.particleLife.push(Array.from(data));
    }

    const program=this.getParameter(this.CURRENT_PROGRAM),location=this.getUniformLocation(program,'force');
    if(location!==null)window.paintForces.push(this.getUniform(program,location));
   }
   return result;
  };
 }
});
try{
 await page.goto('http://127.0.0.1:4196/',{waitUntil:'networkidle'});
 await expect(page.locator('body')).not.toHaveAttribute('data-entrance','playing');
 await page.locator('.motion-toggle').click();
 await page.locator('[data-project="glsl-showcase"].project-card').click();
 await expect(page.locator('.panel-canvas')).toHaveCount(1);
 const type=await page.locator('[data-motion-layer=incoming]').first().evaluate(el=>{const animation=el.getAnimations()[0];return{ease:animation.effect.getTiming().easing,duration:animation.effect.getTiming().duration,startX:new DOMMatrix(animation.effect.getKeyframes()[0].transform).m41,width:innerWidth};});
 expect(type.startX).toBeGreaterThan(type.width);expect(type.ease).toBe('cubic-bezier(0.08, 1, 0.12, 1)');
 await page.waitForTimeout(1750);await page.screenshot({path:'qa/v2.5.13/wring-peak.png'});
 await expect(page.locator('.panel-canvas')).toHaveCount(0);
 const life=await page.evaluate(()=>window.particleLife);
 for(let f=1;f<life.length;f++)for(let i=1;i<life[f].length;i+=4){
  if(life[f-1][i]>0&&life[f-1][i]<940)expect(life[f][i]).toBeGreaterThanOrEqual(life[f-1][i]-.01);
 }
 const draws=await page.evaluate(()=>window.panelDraws);
 expect(draws.length).toBeGreaterThan(8);
 expect(draws.find(d=>d.time-draws[0].time>=650).curl).toBeGreaterThan(8);
 expect(draws.find(d=>d.time-draws[0].time>=1300).curl).toBeGreaterThan(30);
 expect(draws.every(d=>Number.isFinite(d.curl)&&Number.isFinite(d.blend))).toBe(true);
 const forces=await page.evaluate(()=>window.paintForces);expect(Math.max(...forces)).toBeGreaterThan(.99);expect(forces.some(f=>f>.2&&f<.5)).toBe(true);
 const frames=new Map();for(const draw of draws)frames.set(draw.frame,(frames.get(draw.frame)||0)+1);
 expect([...frames.values()].every(count=>count===1)).toBe(true);
 const peak=draws.reduce((a,b)=>a.curl>b.curl?a:b);
 expect(peak.curl).toBeGreaterThan(30.5);expect(peak.blend).toBeLessThan(.03);expect(draws.filter(d=>d.time-draws[0].time<2150).every(d=>d.bleach<.01)).toBe(true);
 expect(draws.some(d=>d.bleach>.99&&d.blend===0)).toBe(true);
 expect(draws.some(draw=>draw.blend>.2&&draw.blend<.8&&draw.curl<peak.curl&&draw.curl>.05)).toBe(true);
 expect(draws.at(-1).blend).toBe(1);
 expect(draws.find(d=>d.blend>.01).time-draws[0].time).toBeGreaterThan(2350);
 expect(draws.at(-1).time-draws[0].time).toBeGreaterThan(3100);
 const held=draws.filter(d=>d.curl>7.8&&d.blend<.03);expect(held.at(-1).time-held[0].time).toBeGreaterThan(1200);
 await writeFile('qa/v2.5.13/single-surface-frames.json',JSON.stringify(draws,null,2));
 await page.locator('[data-project="gaia-senseware"].project-card').click();await expect(page.locator('.panel-canvas')).toHaveCount(1);await expect(page.locator('.panel-canvas')).toHaveCount(0);
 await writeFile('qa/v2.5.13/wring-results.json',JSON.stringify({version:'2.5.13',status:'PASS',type,checks:['Title starts beyond right viewport boundary','Strong ease-out applies independently','Wring renders and returns to flat image','Reverse selection completes']},null,2));
 console.log('PASS: offscreen strong ease-out text and torsion capture');
}finally{await page.close();await browser.close();server.kill();}
