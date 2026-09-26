import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.addInitScript(()=>{
  window.shaderTimes=[];
  const names=new WeakMap();const proto=WebGL2RenderingContext.prototype;
  const locate=proto.getUniformLocation,uniform=proto.uniform1f;
  proto.getUniformLocation=function(program,name){const value=locate.call(this,program,name);if(value)names.set(value,name);return value;};
  proto.uniform1f=function(location,value){if(names.get(location)==='uTime')window.shaderTimes.push(value);return uniform.call(this,location,value);};
});
try{
 await page.goto('http://127.0.0.1:4173',{waitUntil:'networkidle'});await page.waitForTimeout(700);
 await page.mouse.move(1090,240);await page.mouse.down();await page.mouse.move(780,400,{steps:15});await page.mouse.move(1140,440,{steps:15});await page.mouse.up();
 await page.locator('.motion-toggle').click();await page.waitForTimeout(200);
 const info=()=>page.evaluate(()=>({classes:document.body.className,pressed:document.querySelector('.motion-toggle').getAttribute('aria-pressed'),events:getComputedStyle(document.querySelector('.shader-canvas')).pointerEvents,times:window.shaderTimes.slice(-8)}));
 console.log('before',await info());await page.screenshot({path:'qa/v2/pause-before.png'});
 await page.mouse.move(820,250);await page.mouse.down();await page.mouse.move(1170,450,{steps:12});await page.mouse.up();await page.waitForTimeout(200);
 console.log('after',await info());await page.screenshot({path:'qa/v2/pause-after.png'});
}finally{await browser.close();}
