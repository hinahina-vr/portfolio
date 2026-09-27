import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const mode=process.argv[2]||'timing',out=process.env.OPENING_OUT||'qa/opening-before';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
try{
 const config=process.env.OPENING_MOBILE==='1'?{viewport:{width:390,height:844},deviceScaleFactor:3}:{viewport:{width:1920,height:1080},deviceScaleFactor:1};const p=await browser.newPage(config);const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(mode=>{
  window.openingAudit={frames:[],draws:[],uploads:[],tasks:[]};let last;
  const frame=t=>{openingAudit.frames.push({t,dt:last?t-last:0,entrance:document.body?.dataset.entrance});last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  new PerformanceObserver(l=>openingAudit.tasks.push(...l.getEntries().map(x=>x.toJSON()))).observe({type:'longtask',buffered:true});
  const C=WebGL2RenderingContext.prototype,draw=C.drawElements,upload=C.texSubImage2D;
  const states=new WeakMap(),programs=new WeakMap(),names=new WeakMap(),targets=new WeakMap();
  const use=C.useProgram,location=C.getUniformLocation,uniform=C.uniform1f,bind=C.bindFramebuffer;
  C.useProgram=function(program){programs.set(this,program);return use.call(this,program);};
  C.getUniformLocation=function(program,name){const loc=location.call(this,program,name);if(loc)names.set(loc,name);return loc;};
  C.uniform1f=function(loc,value){const program=programs.get(this);if(program){let state=states.get(program);if(!state){state={};states.set(program,state);}state[names.get(loc)]=value;}return uniform.call(this,loc,value);};
  C.bindFramebuffer=function(target,buffer){if(target===this.FRAMEBUFFER||target===this.DRAW_FRAMEBUFFER)targets.set(this,buffer);return bind.call(this,target,buffer);};
  C.texSubImage2D=function(...a){const t=performance.now(),r=upload.apply(this,a);const source=a.find(x=>x instanceof ImageBitmap||x instanceof HTMLImageElement);if(source)openingAudit.uploads.push({t,dt:performance.now()-t,width:source.width,canvas:this.canvas.className});return r;};
  C.drawElements=function(...args){const result=draw.apply(this,args);if(this.canvas.classList.contains('liquid-canvas')&&!targets.get(this)){
   const state=states.get(programs.get(this));if(state&&'opening' in state){const row={t:performance.now(),opening:state.opening,progress:state.emergence,wet:state.surfaceWet};
    if(mode==='pixels'&&row.progress>.9){const box=document.querySelector('.preview-image').getBoundingClientRect(),rgba=new Uint8Array(4);this.readPixels(Math.floor((box.x+box.width*.7)*this.canvas.width/innerWidth),Math.floor((innerHeight-box.y-box.height*.5)*this.canvas.height/innerHeight),1,1,this.RGBA,this.UNSIGNED_BYTE,rgba);row.pixel=[...rgba];}
    openingAudit.draws.push(row);
   }
  }return result;};
 },mode);
 const cdp=await p.context().newCDPSession(p);if(mode==='trace')await cdp.send('Tracing.start',{categories:'devtools.timeline,v8.execute,blink.user_timing,disabled-by-default-devtools.timeline,cc,gpu',transferMode:'ReturnAsStream'});
 await p.goto(process.env.OPENING_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});await p.waitForFunction(()=>!document.body.dataset.entrance);await p.waitForTimeout(350);
 if(mode==='trace'){const done=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await done;let trace='';while(true){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});await writeFile(`${out}/trace.timeline.json`,trace);}
 const data=await p.evaluate(()=>openingAudit);const active=data.draws.filter(x=>x.opening===1&&x.progress>.08),start=active[0]?.t,end=active.at(-1)?.t,frames=data.frames.filter(x=>x.t>=start&&x.t<=end);
 const settled=data.draws.filter(x=>x.t>=start&&x.progress>.93&&x.pixel),gaps=settled.filter(x=>x.pixel[3]!==255),brightness=p=>p[0]+p[1]+p[2],dimmed=settled.filter(x=>brightness(x.pixel)<brightness(settled.at(-1).pixel)*.9);
 const summary={url:process.env.OPENING_URL||'http://127.0.0.1:4173/',chrome:await browser.version(),config,bundle:await p.locator('script[type=module]').getAttribute('src'),mode,visibleStart:start,visibleEnd:end,maxInterval:Math.max(...frames.map(x=>x.dt)),over50:frames.filter(x=>x.dt>50).length,fps:1000*frames.length/frames.reduce((s,x)=>s+x.dt,0),lateUploads:data.uploads.filter(x=>x.t>=start&&x.t<=end),gaps,dimmed,errors};
 await writeFile(`${out}/${mode}.json`,JSON.stringify({summary,data},null,2));console.log(JSON.stringify(summary,null,2));
 if(process.env.OPENING_ASSERT==='1'){expect(errors).toEqual([]);expect(active.length).toBeGreaterThan(20);expect(summary.lateUploads).toHaveLength(0);if(mode==='timing'&&process.env.OPENING_BUDGET)expect(summary.maxInterval).toBeLessThan(Number(process.env.OPENING_BUDGET));if(mode==='pixels'){expect(settled.length).toBeGreaterThan(0);expect(gaps).toHaveLength(0);expect(dimmed).toHaveLength(0);}}
}finally{await browser.close();}
