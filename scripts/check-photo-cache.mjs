import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='qa/photo-cache';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.photoAudit={uploads:[],samples:[],frames:[],textures:[],marks:[]};let last;
  const frame=t=>{photoAudit.frames.push({t,dt:last?t-last:0,phase:document.querySelector('.preview-surface')?.dataset.transition});last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  const textureIds=new WeakMap(),contextIds=new WeakMap();let seq=0,ctxSeq=0;const context=gl=>{if(!contextIds.has(gl))contextIds.set(gl,++ctxSeq);return contextIds.get(gl);};
  for(const Context of [WebGLRenderingContext,WebGL2RenderingContext]){
   const upload=Context.prototype.texSubImage2D;
   Context.prototype.texSubImage2D=function(...args){const t=performance.now(),r=upload.apply(this,args),source=args.find(a=>a instanceof ImageBitmap||a instanceof HTMLImageElement);if(source&&source.width>=3000)photoAudit.uploads.push({t,dt:performance.now()-t,canvas:this.canvas.className,width:source.width,height:source.height,kind:source.constructor.name,rolling:document.querySelector('.preview-surface')?.dataset.transition==='rolling'});return r;};
   const create=Context.prototype.createTexture,remove=Context.prototype.deleteTexture;
   Context.prototype.createTexture=function(){const r=create.call(this);textureIds.set(r,++seq);photoAudit.textures.push({op:'create',id:seq,ctx:context(this),canvas:this.canvas.className});return r;};
   Context.prototype.deleteTexture=function(t){photoAudit.textures.push({op:'delete',id:textureIds.get(t),ctx:context(this),canvas:this.canvas.className});return remove.call(this,t);};
   const draw=Context.prototype.drawElements;
   Context.prototype.drawElements=function(...args){const r=draw.apply(this,args);if(window.samplePhoto&&this.canvas.classList.contains('liquid-canvas')&&!this.getParameter(this.FRAMEBUFFER_BINDING)){
    const program=this.getParameter(this.CURRENT_PROGRAM),location=this.getUniformLocation(program,'surfaceWet');if(location&&this.getUniform(program,location)===1){
     const img=document.querySelector('.preview-image'),rect=img.getBoundingClientRect(),points=[[.23,.31],[.71,.47],[.44,.76]],canvas=document.createElement('canvas');canvas.width=this.canvas.width;canvas.height=this.canvas.height;const c=canvas.getContext('2d',{willReadFrequently:true}),sx=canvas.width/innerWidth,sy=canvas.height/innerHeight;c.drawImage(img,rect.x*sx,rect.y*sy,rect.width*sx,rect.height*sy);
     const pixels=points.map(([x,y])=>{const actual=new Uint8Array(4);this.readPixels(Math.floor((rect.x+x*rect.width)*this.canvas.width/innerWidth),Math.floor((innerHeight-rect.y-y*rect.height)*this.canvas.height/innerHeight),1,1,this.RGBA,this.UNSIGNED_BYTE,actual);return{actual:[...actual],expected:[...c.getImageData(Math.floor((rect.x+x*rect.width)*sx),canvas.height-1-Math.floor((innerHeight-rect.y-y*rect.height)*sy),1,1).data]};});photoAudit.samples.push({id:document.querySelector('#work-panel').dataset.project,pixels});window.samplePhoto=false;
    }
   }return r;};
  }
 });
 await p.goto(process.argv[2]||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});await p.waitForFunction(()=>!document.body.dataset.entrance);
 // Skip the prefetched second work, then cross the cache capacity and revisit.
 for(const index of [3,1,2,0,3]){
  await p.evaluate(index=>photoAudit.marks.push({index,t:performance.now()}),index);
  await p.locator('.project-card').nth(index).click();await p.waitForSelector('.panel-canvas');await p.waitForSelector('.panel-canvas',{state:'detached'});await p.waitForFunction(()=>!document.querySelector('[data-transition-text]'));
  await p.evaluate(()=>window.samplePhoto=true);await p.waitForFunction(()=>!window.samplePhoto);
 }
 const data=await p.evaluate(()=>photoAudit);
 await writeFile(`${out}/audit.json`,JSON.stringify(data,null,2));await p.screenshot({path:`${out}/desktop.png`});
 expect(data.uploads.every(u=>u.width===3840&&u.height===2160)).toBe(true);expect(data.uploads.filter(u=>u.rolling)).toHaveLength(0);
 for(const sample of data.samples){const close=sample.pixels.filter(({actual,expected})=>actual[3]===255&&actual.slice(0,3).every((v,i)=>Math.abs(v-expected[i])<22));expect(close.length,`${sample.id} color and orientation`).toBeGreaterThanOrEqual(2);}
 const live=new Map();for(const event of data.textures){const set=live.get(event.ctx)||new Set();if(event.op==='create')set.add(event.id);else set.delete(event.id);live.set(event.ctx,set);}
 const panelContext=data.textures.find(x=>x.canvas==='panel-canvas')?.ctx;expect(live.get(panelContext).size).toBeLessThanOrEqual(8);
 results.push('Unprepared selection, 4-work cache eviction and revisit all show the correct 4K image','GPU pixel samples preserve original image orientation and color','No 4K image upload during wringing; bounded panel texture count after repeated navigation');
 await p.locator('.project-card').nth(1).click();await p.waitForSelector('.panel-canvas');await p.setViewportSize({width:390,height:844});await expect(p.locator('.panel-canvas')).toHaveCount(0);await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');await p.locator('.project-card').nth(2).click();await p.waitForSelector('.panel-canvas');await p.waitForSelector('.panel-canvas',{state:'detached'});await expect(p.locator('[data-transition-text]')).toHaveCount(0);await p.locator('.collection').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/mobile.png`,fullPage:true});
 results.push('Resize during wringing cancels cleanly; next mobile transition completes');expect(errors).toEqual([]);
 await writeFile(`${out}/results.json`,JSON.stringify({results,errors,data},null,2));console.log(results.join('\n'));
}finally{await browser.close();}
