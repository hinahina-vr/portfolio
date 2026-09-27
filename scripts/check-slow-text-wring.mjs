import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const output='qa/slow-text-wring';await mkdir(output,{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const checks=[];
try{
 const p=await b.newPage({viewport:{width:1200,height:850}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.draws=[];window.handoff=[];
  const draw=WebGL2RenderingContext.prototype.drawElements;
  WebGL2RenderingContext.prototype.drawElements=function(...args){const result=draw.apply(this,args);if(this.canvas.classList.contains('panel-canvas')){const program=this.getParameter(this.CURRENT_PROGRAM),loc=this.getUniformLocation(program,'curl');if(loc){const get=name=>this.getUniform(program,this.getUniformLocation(program,name));const title=document.querySelector('#work-panel .project-title'),old=document.querySelector('[data-transition-text=outgoing]');window.draws.push({time:performance.now(),curl:get('curl'),gather:get('gather'),size:[...get('size')],center:[...get('center')],opacity:Number(getComputedStyle(title).opacity),old:old?Number(getComputedStyle(old).opacity):null,held:!!document.querySelector('.panel-outgoing')});}}return result;};
  const remove=Element.prototype.remove;Element.prototype.remove=function(){if(this.classList.contains('panel-canvas'))window.handoff.push({time:performance.now(),opacity:Number(getComputedStyle(document.querySelector('#work-panel .project-title')).opacity)});return remove.call(this);};
 });
 await p.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await p.waitForFunction(()=>!document.body.dataset.entrance);
 const original=await p.locator('.preview-image').boundingBox();await p.locator('.project-card').nth(1).click();
 await p.waitForFunction(()=>window.draws.length>2);
 await p.waitForFunction(()=>window.draws.at(-1).time-window.draws[0].time>600);
 await p.screenshot({path:`output-placeholder/outgoing.png`.replace('output-placeholder',output)});
 await p.waitForFunction(()=>window.draws.at(-1).time-window.draws[0].time>1700);
 await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','0');
 await expect(p.locator('[data-transition-text=outgoing]').first()).toHaveCSS('opacity','0');
 await p.waitForSelector('.panel-canvas',{state:'detached'});
 const during=Number(await p.locator('#work-panel .project-title').evaluate(e=>getComputedStyle(e).opacity));expect(during).toBeLessThan(.8);
 await p.screenshot({path:`${output}/incoming.png`});
 await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');await expect(p.locator('[data-transition-text=outgoing]')).toHaveCount(0);
 const draws=await p.evaluate(()=>window.draws);const first=draws[0];
 expect(first.held).toBe(true);expect(first.curl).toBe(0);expect(first.gather).toBe(0);
 expect(first.size[0]).toBeCloseTo(original.width/1200,4);expect(first.center[0]).toBeCloseTo((original.x+original.width/2)/1200*2-1,4);
 const early=draws.filter(d=>d.time-first.time<100);expect(early.every(d=>d.curl<1.5&&d.gather<.16)).toBe(true);
 expect(draws.some(d=>d.old>.1&&d.old<.9)).toBe(true);expect(draws.filter(d=>d.time-first.time<2900).every(d=>d.opacity===0)).toBe(true);expect(Math.max(...draws.map(d=>d.curl))).toBeGreaterThan(30.5);
 checks.push('First GPU frame stays flat at original image bounds and is drawn before old image removal','Pull starts gently while retaining full twist strength','Old title and caption fade out slowly; next title stays hidden until release','Text fade continues after screenshot settles without snapping to opacity 1');
 await p.locator('.project-card').nth(2).click();await p.waitForSelector('.panel-canvas');await p.waitForTimeout(400);await p.locator('.project-card').nth(3).click();await expect(p.locator('#work-panel')).toHaveAttribute('data-project','quiz-pal');await expect(p.locator('[data-transition-text=outgoing]')).toHaveCount(0,{timeout:10000});await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('.project-card').first().click();await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1');await expect(p.locator('.panel-canvas')).toHaveCount(0);
 checks.push('Interrupted transition and reduced motion both restore text and image');expect(errors).toEqual([]);
 const html=await readFile('dist/index.html','utf8');await writeFile(`${output}/results.json`,JSON.stringify({build:html.match(/assets\/index-[^" ]+\.js/)?.[0],checks,errors,draws,scope:'Local Chrome desktop; screenshots, no video'},null,2));console.log(checks.join('\n'));
}finally{await b.close();}
