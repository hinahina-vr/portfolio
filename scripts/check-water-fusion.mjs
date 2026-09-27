import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:4173/';
const dir='qa/water-fusion';await mkdir(dir,{recursive:true});
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[],passed=[];const pass=s=>{passed.push(s);console.log('PASS',s);};
try{
 const p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'#works/web',{waitUntil:'networkidle'});
 const water=p.locator('.clearwater-canvas');const frames=()=>water.getAttribute('data-frames').then(Number);
 await expect.poll(frames).toBeGreaterThan(0);expect(await water.evaluate(c=>c.getContext('webgl2').getError())).toBe(0);
 expect(Number(await water.getAttribute('data-source-frames'))).toBeGreaterThan(0);
 await p.screenshot({path:dir+'/botanical.png'});pass('Original live GLSL frames feed the real water renderer without GL errors');
 await p.waitForTimeout(400);const frozen=await frames();await p.waitForTimeout(600);expect(await frames()).toBe(frozen);
 await p.locator('.motion-toggle').click();await expect.poll(frames,{timeout:30000}).toBeGreaterThan(frozen+3);
 await p.locator('.motion-toggle').click();await p.waitForTimeout(500);const stopped=await frames();await p.waitForTimeout(500);expect(await frames()).toBe(stopped);pass('Both scene and optics pause/resume together');
 await p.locator('#tab-visual').click();await expect(p.locator('.project-card')).toHaveCount(2);await expect(p.locator('.project-card[data-project="clearwater"]')).toHaveCount(0);
 await p.waitForTimeout(800);await p.screenshot({path:dir+'/lilian.png'});expect(await water.evaluate(c=>c.getContext('webgl2').getError())).toBe(0);pass('Visual retains two original works, source switches to Lilian');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(600);await p.screenshot({path:dir+'/mobile.png'});expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);pass('Mobile viewport and texture resize');
 await water.evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await expect(water).toBeHidden();await expect(p.locator('.shader-canvas')).toBeVisible();await p.locator('#tab-web').click();pass('Lost optical context falls back to original live background and navigation remains usable');
 expect(errors).toEqual([]);await writeFile(dir+'/results.json',JSON.stringify({base,passed,errors,limitations:'Desktop Chrome, mobile viewport emulation, no video'},null,2));
}finally{await b.close();}
