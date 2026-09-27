import {chromium} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
const out=process.env.PERF_OUT||'qa/performance-current',url=process.env.PERF_URL||'https://hinahina-vr.github.io/portfolio/';
await mkdir(out,{recursive:true});
const modes=process.argv.slice(2);const mode=modes[0]||'desktop';
const config={uncached:{width:1920,height:1080,dpr:1},desktop2:{width:1920,height:1080,dpr:1},desktop:{width:1920,height:1080,dpr:1},retina:{width:1920,height:1080,dpr:2},mobile:{width:390,height:844,dpr:3},detail:{width:1920,height:1080,dpr:1},cpu4:{width:1920,height:1080,dpr:1,cpu:4}}[mode];
const detail=mode==='detail';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
try{
 const info=await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo');
 const p=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:config.dpr});const cdp=await p.context().newCDPSession(p);
 if(config.cpu)await cdp.send('Emulation.setCPUThrottlingRate',{rate:config.cpu});
 await p.addInitScript(({detail})=>{
  const audit=window.audit={frames:[],longtasks:[],loafs:[],events:[],paint:[],lcp:[],cls:[],calls:[],contexts:[],phase:'loading',case:'load'};
  const nativeRAF=window.requestAnimationFrame.bind(window);let last;
  function frame(t){const now=performance.now();audit.frames.push({t,now,dt:last===undefined?0:t-last,case:audit.case,bg:document.querySelector('#art-stage')?.dataset.transitionPhase||'initial',panel:document.querySelector('.preview-surface')?.dataset.transition||'idle'});last=t;nativeRAF(frame);}nativeRAF(frame);
  for(const [type,key,options] of [['longtask','longtasks',{}],['long-animation-frame','loafs',{}],['event','events',{durationThreshold:16}],['paint','paint',{}],['largest-contentful-paint','lcp',{}],['layout-shift','cls',{}]])try{new PerformanceObserver(list=>audit[key].push(...list.getEntries().map(e=>({case:audit.case,...e.toJSON()})))).observe({type,buffered:true,...options});}catch{}
  if(!detail)return;
  const ids=new WeakMap();let serial=0;
  const id=gl=>{if(!ids.has(gl)){ids.set(gl,++serial);audit.contexts.push({id:serial,canvas:gl.canvas.className});}return ids.get(gl);};
  for(const Context of [WebGLRenderingContext,WebGL2RenderingContext]){
   for(const name of ['compileShader','linkProgram','getProgramParameter','getShaderParameter','getUniformLocation','texImage2D','texSubImage2D','generateMipmap','bufferData','drawElements','drawArrays','drawElementsInstanced']){
    const orig=Context.prototype[name];if(!orig)continue;
    Context.prototype[name]=function(...args){const t=performance.now(),result=orig.apply(this,args),end=performance.now();const entry={t,dt:end-t,fn:name,context:id(this),canvas:this.canvas.className,case:audit.case};
     if(name.startsWith('draw')){entry.count=args[name==='drawArrays'?2:1];entry.w=this.drawingBufferWidth;entry.h=this.drawingBufferHeight;}
     if(name.includes('tex')){const source=args.find(x=>x instanceof HTMLImageElement||x instanceof HTMLCanvasElement||x instanceof ImageBitmap);if(source)entry.source={kind:source.constructor.name,w:source.naturalWidth||source.width,h:source.naturalHeight||source.height,url:source.currentSrc||source.className};}
     audit.calls.push(entry);return result;};
   }
  }
 },{detail});
 if(detail){await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});}
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const response=await p.goto(url,{waitUntil:'networkidle'});
 await p.waitForFunction(()=>!document.body.dataset.entrance&&document.querySelector('#art-stage')?.dataset.ready==='true',{},{timeout:30000});
 // Real interaction resets the idle timer without changing the artwork.
 await p.mouse.move(10,10);
 await p.evaluate(()=>{audit.case='steady';performance.mark('audit-steady');});await p.waitForTimeout(1800);
 if(detail){await cdp.send('Tracing.start',{categories:'devtools.timeline,v8.execute,blink.user_timing,gpu,cc,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});await cdp.send('Profiler.start');}
 for(const [label,index] of (mode==='uncached'?[['first',3],['second',2],['third',0]]:[['first',1],['second',0],['third',1]])){
  await p.evaluate(label=>{audit.case=label;performance.mark(`audit-${label}`);},label);
  await p.locator('.project-card').nth(index).click();
  await p.waitForFunction(()=>document.querySelector('.panel-canvas'),{},{timeout:15000});
  await p.waitForFunction(()=>!document.querySelector('.panel-canvas'),{},{timeout:15000});
  await p.waitForTimeout(1500);
  console.log(mode,label,'done');
 }
 if(detail){const {profile}=await cdp.send('Profiler.stop');await writeFile(`${out}/${mode}.cpuprofile`,JSON.stringify(profile));const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');const {stream}=await done;let trace='';while(true){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});await writeFile(`${out}/${mode}.trace.json`,trace);}
 const data=await p.evaluate(()=>({audit:window.audit,resources:performance.getEntriesByType('resource').map(x=>x.toJSON()),navigation:performance.getEntriesByType('navigation').map(x=>x.toJSON()),canvas:[...document.querySelectorAll('canvas')].map(c=>({class:c.className,w:c.width,h:c.height})),userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory}));
 const buildResponse=await p.request.get(url+'build.json');const revision=buildResponse.ok()?await buildResponse.json():{local:true,bundle:await p.locator('script[type=module]').getAttribute('src')};await writeFile(`${out}/${mode}.json`,JSON.stringify({mode,config,revision,chrome:await browser.version(),gpu:info.gpu,http:response.status(),errors,...data}));
 console.log(mode,'saved',data.audit.frames.length,'frames',data.audit.longtasks.length,'long tasks');
}finally{await browser.close();}
