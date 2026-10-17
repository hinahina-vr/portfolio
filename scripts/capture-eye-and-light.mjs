import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.argv[2]||'http://127.0.0.1:4191/works/eye-and-light/';
const out=process.env.CAPTURE_OUT||'qa/nijigen-dohai-20261017';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disk-cache-dir=E:/CodexData/temp/portfolio-eye-capture']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'});
 page.setDefaultTimeout(90000);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
 await page.goto(url,{waitUntil:'networkidle',timeout:60000});
 await page.waitForFunction(()=>window.eyeAndLight?.ready&&!eyeAndLight.fallback&&meditationRenderer.avatar.ready&&document.querySelector('#preloader').hidden);
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>document.body.classList.contains('idle'));
 await page.waitForTimeout(1800);
 const dimensions=await page.evaluate(()=>{const r=window.meditationRenderer;const fov=r.camera.fov;r.resize(3840,2160);r.camera.fov=fov;r.camera.updateProjectionMatrix();r.render(0);return {width:r.renderer.domElement.width,height:r.renderer.domElement.height,time:r.time,fov};});
 expect(dimensions).toMatchObject({width:3840,height:2160,time:0});
 await page.screenshot({path:`${out}/source-4k.png`});
 expect(errors).toEqual([]);
 await writeFile(`${out}/capture.json`,JSON.stringify({url,browser:await browser.version(),viewport:{width:1920,height:1080},deviceScaleFactor:2,sourceRendering:dimensions,pixels:{width:3840,height:2160},errors},null,2));
 console.log('PASS real 3840x2160 WebGL screenshot',dimensions);
}finally{await browser.close();}
