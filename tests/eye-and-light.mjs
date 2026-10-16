import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {categories} from '../content.js';
const external=process.argv[2],base=external||'http://127.0.0.1:4191/';
const out=`qa/eye-and-light-20261016/${external?'public':'local'}`;await mkdir(out,{recursive:true});
const project=categories.visual.projects.find(p=>p.id==='eye-and-light');
const results=[],errors=[];let server,browser,bundle;
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS',name);};
const artURL=new URL('works/eye-and-light/',base).href;
const openMenu=async p=>{if(!await p.locator('#menu').evaluate(e=>e.open))await p.locator('#menu-toggle').click();};
try{
 if(!external){server=spawn(process.execPath,['scripts/serve.mjs','dist','4191'],{stdio:'pipe',windowsHide:true});await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});}
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined)});
 const context=await browser.newContext({reducedMotion:'reduce'});
 context.on('page',p=>{p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});});
 const p=await context.newPage();
 for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
  await p.setViewportSize(viewport);await p.goto(base+'#works/visual/eye-and-light',{waitUntil:'networkidle',timeout:60000});
  bundle=await p.locator('script[type=module]').getAttribute('src');
  await expect(p.locator('#work-panel')).toHaveAttribute('data-project','eye-and-light');
  await expect(p.getByRole('heading',{level:2})).toHaveAccessibleName('眼と光');
  await expect(p.locator('.project-card')).toHaveCount(3);
  await expect(p.locator('.project-description')).toHaveText(project.description);
  await expect(p.locator('.open-project')).toHaveText('Enter artwork');
  await expect(p.locator('.open-project')).toHaveAttribute('href',project.url);
  await expect(p.locator('.preview-image')).toHaveCSS('opacity','0.8');
  await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  expect(await p.locator('.preview-image').evaluate(i=>[i.naturalWidth,i.naturalHeight])).toEqual([3840,2160]);
  const bounds=await p.locator('.preview-image').boundingBox();expect(Math.abs(bounds.width/bounds.height-16/9)).toBeLessThan(.005);
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await p.locator('.open-project').scrollIntoViewIfNeeded();
  expect(await p.locator('.open-project').evaluate(e=>{const b=e.getBoundingClientRect();return e.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})).toBe(true);
  await p.screenshot({path:`${out}/portfolio-${viewport.width}.png`,fullPage:true});
  pass(`${viewport.width}x${viewport.height}: Visual entry, 4K 16:9 photo, 80% opacity, Japanese caption and accessible action`);
 }
 await p.setViewportSize({width:1440,height:900});await p.evaluate(()=>scrollTo(0,0));
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.locator('#tab-web').click();await expect(p.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
 await p.waitForSelector('.panel-canvas',{state:'detached'});await expect(p.locator('.project-title')).toHaveCSS('opacity','1');
 await p.locator('#tab-visual').click();await p.waitForSelector('.panel-canvas');await p.waitForSelector('.panel-canvas',{state:'detached'});
 await expect(p.locator('.project-title')).toHaveCSS('opacity','1');
 await p.locator('.motion-toggle').click();
 await p.screenshot({path:`${out}/portfolio-rendered.png`});pass('Normal WebGL transition into Eye and Light settles on the correct image and caption');
 let art;
 if(external){const opened=p.waitForEvent('popup');await p.locator('.open-project').click();art=await opened;await art.waitForLoadState('domcontentloaded');expect(art.url()).toBe(artURL);}
 else{art=await context.newPage();await art.goto(artURL);}
 const range=await art.request.get(new URL('media/eye-and-light-web.mp4',artURL).href,{headers:{Range:'bytes=0-1023'}});
 expect(range.status()).toBe(206);expect(range.headers()['content-type']).toContain('video/mp4');expect((await range.body()).length).toBe(1024);
 pass('Hosted MP4 supports byte-range requests for native seeking');
 await art.waitForFunction(()=>window.eyeAndLight?.ready);
 expect(await art.evaluate(()=>eyeAndLight.fallback)).toBe(false);
 await expect(art).toHaveTitle('眼と光 — EYE & LIGHT');
 await art.setViewportSize({width:1600,height:900});
 await expect(art.locator('#menu')).toBeHidden();
 expect(await art.locator('#stage').boundingBox()).toEqual({x:0,y:0,width:1600,height:900});
 await art.screenshot({path:`${out}/artwork.png`});
 await openMenu(art);if(!await art.evaluate(()=>eyeAndLight.playing))await art.locator('#play').click();
 await art.waitForFunction(()=>eyeAndLight.time>.2);await art.locator('#play').click();
 const paused=await art.evaluate(()=>eyeAndLight.time);await art.waitForTimeout(220);expect(await art.evaluate(()=>eyeAndLight.time)).toBe(paused);
 await art.locator('#view').selectOption('sphere');await art.waitForFunction(()=>meditationRenderer.view==='sphere');
 await art.locator('#view').selectOption('room');await art.locator('#reset').click();await art.keyboard.press('Escape');
 await art.mouse.move(800,450);await art.mouse.down();await art.mouse.move(880,470,{steps:5});await art.mouse.up();
 await openMenu(art);expect(await art.locator('#auto').isChecked()).toBe(false);
 pass('Hosted artwork: real 3D, full viewport, play/pause, view selection, reset, drag and Escape');
 await art.locator('#film-mode').click();await art.waitForFunction(()=>eyeAndLight.mode==='film'&&document.querySelector('#sample').readyState>=2);
 await openMenu(art);if(!await art.evaluate(()=>eyeAndLight.playing))await art.locator('#play').click();
 const before=await art.locator('#sample').evaluate(v=>v.currentTime);await art.waitForFunction(t=>document.querySelector('#sample').currentTime>t+.2,before);
 await art.locator('#play').click();expect(await art.locator('#sample').evaluate(v=>v.paused)).toBe(true);
 await art.locator('#seek').fill('5.2');await art.waitForFunction(()=>Math.abs(document.querySelector('#sample').currentTime-5.2)<.1&&!document.querySelector('#sample').seeking);
 expect(await art.locator('#sample').evaluate(v=>[v.videoWidth,v.videoHeight,v.duration])).toEqual([1920,1080,60]);
 await art.locator('#film-mode').click();await art.waitForFunction(()=>eyeAndLight.mode==='room');
 pass('Existing movie plays, pauses, seeks and returns to 3D from the deployed subpath');
 await art.setViewportSize({width:390,height:844});
 expect(await art.locator('#stage').boundingBox()).toEqual({x:0,y:0,width:390,height:844});
 expect(await art.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await openMenu(art);const menu=await art.locator('#menu').boundingBox();expect(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=390&&menu.y+menu.height<=844).toBe(true);
 await art.keyboard.press('Escape');await art.screenshot({path:`${out}/artwork-mobile.png`});
 await art.reload();await art.waitForFunction(()=>window.eyeAndLight?.ready);expect(await art.evaluate(()=>eyeAndLight.mode)).toBe('room');
 const license=await art.request.get(new URL('vendor/three/LICENSE.txt',artURL).href);expect(license.ok()).toBe(true);expect(await license.text()).toContain('MIT');
 pass('390px artwork and menu fit, reload starts in 3D, bundled Three license is reachable');
 expect(errors).toEqual([]);
} catch(e){results.push({name:'Eye and Light integration',status:'FAIL',details:e.stack});process.exitCode=1;console.error(e);}
finally{await writeFile(`${out}/results.json`,JSON.stringify({base,artURL,bundle,version:JSON.parse(await readFile('package.json','utf8')).version,browser:await browser?.version(),results,errors,scope:'Real Windows Chrome; mobile viewport simulation, not physical devices. Uses existing supplied movie, no video recording.'},null,2));await browser?.close();server?.kill();}
