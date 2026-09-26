import {chromium,expect as baseExpect} from '@playwright/test';
const expect=baseExpect.configure({timeout:10000});
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const output='qa/v2.5.13';await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','dist','4198'],{stdio:'pipe',windowsHide:true});
await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
 window.liquidFrames=[];window.particleStates=[];window.liquidSolverPasses=0;
 const original=WebGL2RenderingContext.prototype.drawElements;
 WebGL2RenderingContext.prototype.drawElements=function(...args){
  const result=original.apply(this,args);
  if(this.canvas.classList.contains('liquid-canvas')){
   if(this.getParameter(this.FRAMEBUFFER_BINDING)){
    window.liquidSolverPasses++;
    if(this.getParameter(this.VIEWPORT)[2]===768 && this.getUniformLocation(this.getParameter(this.CURRENT_PROGRAM),'emissionTime')!==null){const data=new Float32Array(768*4);this.readPixels(0,0,768,1,this.RGBA,this.FLOAT,data);window.particleStates.push({at:performance.now(),data:Array.from(data)});}
   }
   else{
    const p=this.getParameter(this.CURRENT_PROGRAM),loc=this.getUniformLocation(p,'opening');
    if(loc!==null){
     const image=document.querySelector('.preview-image').getBoundingClientRect();
     const ratio=this.canvas.height/innerHeight;
     const y=Math.max(0,Math.floor((innerHeight-image.bottom-90)*ratio));
     const w=Math.min(this.canvas.width,300),h=60;
     const pixels=new Uint8Array(w*h*4);this.readPixels(Math.floor(image.x*ratio),y,w,h,this.RGBA,this.UNSIGNED_BYTE,pixels);
     const colors=new Set();let visible=0,hash=0;for(let i=3;i<pixels.length;i+=4){if(pixels[i]>20){visible++;colors.add([pixels[i-3]>>4,pixels[i-2]>>4,pixels[i-1]>>4].join());}hash=(hash+pixels[i]*(i+1))%1000000007;}
     window.liquidFrames.push({at:performance.now(),opening:this.getUniform(p,loc),progress:this.getUniform(p,this.getUniformLocation(p,'emergence')),visible,hash,colors:colors.size});
    }
   }
  }
  return result;
 };
});
try{
 await page.goto('http://127.0.0.1:4198/',{waitUntil:'domcontentloaded'});
 await expect(page.locator('.site-header')).toHaveCSS('opacity','0');
 await expect(page.locator('.wet-entrance')).toHaveCount(1);
 await page.waitForTimeout(900);await page.screenshot({path:output+'/submerged.png'});
 await page.waitForTimeout(800);await page.screenshot({path:output+'/surfacing.png'});
 await expect(page.locator('body')).not.toHaveAttribute('data-entrance','playing',{timeout:8000});
 await page.locator('.open-project').focus();
 await page.screenshot({path:output+'/idle-drips-a.png'});
 await page.waitForTimeout(1100);await page.screenshot({path:output+'/idle-drips-b.png'});
 const samples=await page.evaluate(()=>({frames:window.liquidFrames,solverPasses:window.liquidSolverPasses,states:window.particleStates}));
  expect(errors).toEqual([]);
 expect(samples.solverPasses).toBeGreaterThan(100);
 const accelerated=samples.states.slice(1).some((frame,index)=>{
  const prior=samples.states[index];return frame.data.some((value,i)=>i%4===3 && prior.data[i]>80 && value>prior.data[i]+2 && frame.data[i-2]>prior.data[i-2]);
 });
 expect(accelerated).toBe(true);
 const opening=samples.frames.filter(f=>f.opening===1);expect(opening.length).toBeGreaterThan(8);
 expect(opening.some(f=>f.progress>.2&&f.progress<.8)).toBe(true);
 const idle=samples.frames.filter(f=>f.opening===0&&f.progress>=.99);
 expect(idle.length).toBeGreaterThan(8);expect(idle.some(f=>f.colors>3)).toBe(true);expect(idle.some(f=>f.visible>10)).toBe(true);
 expect(new Set(idle.map(f=>f.hash)).size).toBeGreaterThan(5);

 await page.locator('.motion-toggle').click();
 await page.waitForTimeout(120);
 const frozen=await page.evaluate(()=>window.liquidFrames.length);
 await page.waitForTimeout(350);
 expect(await page.evaluate(()=>window.liquidFrames.length)).toBe(frozen);
 await page.locator('.motion-toggle').click();await page.waitForTimeout(250);
 expect(await page.evaluate(()=>window.liquidFrames.length)).toBeGreaterThan(frozen);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);
 await page.screenshot({path:output+'/mobile-liquid.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.liquid-canvas')).toHaveCSS('visibility','hidden');
 expect(errors).toEqual([]);
 await writeFile(output+'/liquid-results.json',JSON.stringify({version:'2.5.13',status:'PASS',checks:['Real solver offscreen draws','Submerged emergence','Visible persistent image pigment after entrance','Pause freezes liquid; resume restarts','390px no horizontal overflow','Reduced motion hides liquid'],...samples,errors},null,2));
 console.log('PASS: actual solver passes, submerged emergence, persistent advected image pigment changing after entrance, no shader errors');
}finally{await page.close();await browser.close();server.kill();}
