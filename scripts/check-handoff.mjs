import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const output='qa/v2.5.13';await mkdir(output,{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs','dist','4194'],{stdio:'pipe',windowsHide:true});await new Promise(r=>server.stdout.once('data',r));
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.addInitScript(()=>{
 window.handoffs=[];window.lastLiquid=null;
 const draw=WebGL2RenderingContext.prototype.drawElements;
 WebGL2RenderingContext.prototype.drawElements=function(...args){
  const result=draw.apply(this,args);
  if(this.canvas.classList.contains('liquid-canvas')&&!this.getParameter(this.FRAMEBUFFER_BINDING)){
   const program=this.getParameter(this.CURRENT_PROGRAM),loc=this.getUniformLocation(program,'surfaceWet');
   if(loc){const pixel=new Uint8Array(4),box=document.querySelector('.preview-image').getBoundingClientRect();
    this.readPixels(Math.floor((box.x+box.width*.75)*this.canvas.width/innerWidth),Math.floor((innerHeight-box.y-box.height*.5)*this.canvas.height/innerHeight),1,1,this.RGBA,this.UNSIGNED_BYTE,pixel);
    window.lastLiquid={surface:this.getUniform(program,loc),pixel:[...pixel]};}
  }return result;
 };
 const remove=Element.prototype.remove;
 Element.prototype.remove=function(){if(this.classList.contains('panel-canvas'))window.handoffs.push(window.lastLiquid);return remove.call(this);};
});
try{
 await page.goto('http://127.0.0.1:4194/',{waitUntil:'networkidle'});
 await expect(page.locator('body')).not.toHaveAttribute('data-entrance','playing',{timeout:10000});
 await page.locator('.motion-toggle').click();
 for(const id of ['glsl-showcase','gaia-senseware']){
  await page.locator(`[data-project="${id}"].project-card`).click();
  await expect(page.locator('.panel-canvas')).toHaveCount(1);
  await expect(page.locator('.panel-canvas')).toHaveCount(0,{timeout:10000});
 }
 const frames=await page.evaluate(()=>window.handoffs);
 await writeFile(output+'/handoff-results.json',JSON.stringify(frames,null,2));console.log(frames);
 expect(frames.length).toBe(2);expect(frames.every(f=>f.surface===1&&f.pixel[3]===255)).toBe(true);
 await page.screenshot({path:output+'/handoff.png'});
 console.log('PASS: opaque replacement already rendered when transition canvas is removed');
}finally{await browser.close();server.kill();}
