import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {categories} from '../content.js';
const out=process.env.PHOTO_OUT||'qa/photo-solid-fixed';await mkdir(out,{recursive:true});
const server=process.env.PHOTO_URL?null:spawn(process.execPath,['scripts/serve.mjs','dist','4196'],{stdio:'pipe',windowsHide:true});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:process.platform==='linux'?['--enable-unsafe-swiftshader']:[]});
const results=[],errors=[];
try{
 const p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.badCrop=[];const C=WebGL2RenderingContext.prototype,f=C.uniform2f,draw=C.drawElements;
  C.uniform2f=function(l,x,y){if((!Number.isFinite(x)||!Number.isFinite(y))&&badCrop.length<10)badCrop.push({x,y,canvas:this.canvas.className,project:document.querySelector('#work-panel')?.dataset.project,width:document.querySelector('.preview-image')?.naturalWidth});return f.call(this,l,x,y);};
  C.drawElements=function(...args){const r=draw.apply(this,args);if(window.samplePhoto&&this.canvas.classList.contains('liquid-canvas')&&!this.getParameter(this.FRAMEBUFFER_BINDING)){
   const box=document.querySelector('.preview-image').getBoundingClientRect(),pixels=[];
   for(let y=1;y<=5;y++)for(let x=1;x<=5;x++){const rgba=new Uint8Array(4);this.readPixels(Math.floor((box.x+box.width*x/6)*this.canvas.width/innerWidth),Math.floor((innerHeight-box.y-box.height*y/6)*this.canvas.height/innerHeight),1,1,this.RGBA,this.UNSIGNED_BYTE,rgba);pixels.push([...rgba]);}
   window.photoPixels=pixels;window.samplePhoto=false;
  }return r;};
 });
 await p.goto(process.env.PHOTO_URL||'http://127.0.0.1:4196/',{waitUntil:'networkidle'});await p.waitForFunction(()=>!document.body.dataset.entrance);
 const route=Object.entries(categories).flatMap(([cat,data])=>data.projects.map(v=>({cat,id:v.id})));route.push(...categories.web.projects.map(v=>({cat:'web',id:v.id})));
 if(process.argv.includes('--quick'))route.splice(0,route.length,...categories.web.projects.map(v=>({cat:'web',id:v.id})));
 for(const {cat,id} of route){
  const tab=p.locator(`#tab-${cat}`);if(await tab.getAttribute('aria-selected')!=='true')await tab.click();
  await expect(tab).toHaveAttribute('aria-selected','true');
  if(await p.locator('#work-panel').getAttribute('data-project')!==id)await p.locator(`.project-card[data-project="${id}"]`).click();
  await expect(p.locator('#work-panel')).toHaveAttribute('data-project',id);
  await expect(p.locator('#work-panel .project-title')).toHaveCSS('opacity','1',{timeout:60000});
  await p.waitForTimeout(300);
  await p.evaluate(()=>{photoPixels=null;samplePhoto=true;});await p.waitForFunction(()=>!!window.photoPixels);
  const pixels=await p.evaluate(()=>photoPixels),bad=await p.evaluate(()=>badCrop),colors=new Set(pixels.map(v=>v.slice(0,3).join(','))).size;
  const expected=await p.locator('.preview-image').evaluate(img=>{const c=window.photoReference||=document.createElement('canvas'),gpu=document.querySelector('.liquid-canvas'),box=img.getBoundingClientRect();c.width=gpu.width;c.height=gpu.height;const sx=c.width/innerWidth,sy=c.height/innerHeight,ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,box.x*sx,box.y*sy,box.width*sx,box.height*sy);const samples=[];for(let y=1;y<=5;y++)for(let x=1;x<=5;x++)samples.push([...ctx.getImageData(Math.floor((box.x+box.width*x/6)*sx),c.height-1-Math.floor((innerHeight-box.y-box.height*y/6)*sy),1,1).data]);return samples;});
  const matching=pixels.filter((v,i)=>v.slice(0,3).every((n,c)=>Math.abs(n-expected[i][c])<25)).length;
  const result={cat,id,colors,matching,pixels,expected,bad};results.push(result);await p.screenshot({path:`${out}/${cat}-${id}.png`});
  await writeFile(`${out}/results.json`,JSON.stringify({bundle:await p.locator('script[type=module]').getAttribute('src'),url:p.url(),results,errors},null,2));
  expect(bad).toEqual([]);// Wet refraction and GPU mipmaps differ from a 2D resize; detect collapsed photos, not pixel-perfect equality.
  expect(colors).toBeGreaterThanOrEqual(Math.min(6,new Set(expected.map(v=>v.slice(0,3).join(','))).size));
  expect(matching).toBeGreaterThanOrEqual(13);expect(pixels.every(v=>v[3]===255)).toBe(true);console.log('PASS',id,'GPU reference matches:',matching+'/25');
 }
 expect(errors).toEqual([]);
}finally{await b.close();server?.kill();}
