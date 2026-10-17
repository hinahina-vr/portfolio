import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {categories} from '../content.js';
const external=process.argv[2],base=external||'http://127.0.0.1:4191/';
const out=(process.env.QA_DIR||'qa/nijigen-dohai-1-32-1-20261018')+'/'+(external?'public':'local');await mkdir(out,{recursive:true});
const project=categories.visual.projects.find(p=>p.id==='eye-and-light');
const results=[],errors=[];let server,browser,bundle;const styleHashes=[];
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
  await expect(p.getByRole('heading',{level:2})).toHaveAccessibleName(project.title);
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
 await art.waitForFunction(()=>window.eyeAndLight?.ready&&meditationRenderer.avatar.ready&&document.querySelector('#preloader').hidden,null,{timeout:90000});
 expect(await art.evaluate(()=>eyeAndLight.fallback)).toBe(false);
 await expect(art).toHaveTitle(project.title);
 await art.setViewportSize({width:1600,height:900});
 await expect(art.locator('#menu')).toBeHidden();
 expect(await art.locator('#stage').boundingBox()).toEqual({x:0,y:0,width:1600,height:900});
 expect(await art.evaluate(()=>({prepared:meditationRenderer.renderingPrepared,view:meditationRenderer.view}))).toEqual({prepared:true,view:'walk'});
 await art.screenshot({path:out+'/artwork.png'});
 await openMenu(art);if(!await art.evaluate(()=>eyeAndLight.playing))await art.locator('#play').click();
 await art.waitForFunction(()=>eyeAndLight.time>.2);await art.locator('#play').click();
 const paused=await art.evaluate(()=>eyeAndLight.time);await art.waitForTimeout(220);expect(await art.evaluate(()=>eyeAndLight.time)).toBe(paused);
 await art.locator('#view').selectOption('sphere');await art.waitForFunction(()=>meditationRenderer.view==='sphere');
 await art.locator('#view').selectOption('walk');await art.locator('#reset').click();await art.keyboard.press('Escape');
 const resources=await art.evaluate(()=>[meditationRenderer.renderer.info.programs.length,meditationRenderer.renderer.info.memory.textures]);
 await art.locator('#stage').focus();await art.keyboard.press('KeyP');
 const z=await art.evaluate(()=>meditationRenderer.avatar.position.z);await art.keyboard.down('KeyW');
 await art.waitForFunction(z=>meditationRenderer.avatar.position.z<z-.08,z);await art.keyboard.press('Space');
 await art.waitForFunction(()=>meditationRenderer.avatar.jumpState.height>.08);await art.keyboard.up('KeyW');
 await art.waitForFunction(()=>!meditationRenderer.avatar.jumpState.airborne);
 await art.keyboard.press('KeyF');await art.waitForFunction(()=>meditationRenderer.manualImmersion===1);
 await art.keyboard.press('KeyF');await art.waitForFunction(()=>meditationRenderer.manualImmersion===0);
 await openMenu(art);await art.locator('#reset').click();await art.keyboard.press('Escape');await art.locator('#stage').focus();
 const initialStyle=await art.evaluate(()=>meditationRenderer.activeStyle);
 await art.keyboard.down('KeyW');await art.waitForFunction(()=>meditationRenderer.contactImmersion.portal===1,null,{timeout:20000});await art.keyboard.up('KeyW');
 await art.screenshot({path:out+'/pupil-interior.png'});
 await art.keyboard.down('KeyS');await art.waitForFunction(v=>meditationRenderer.activeStyle!==v&&meditationRenderer.contactImmersion.portal===0,initialStyle,{timeout:20000});await art.keyboard.up('KeyS');
 await art.keyboard.press('KeyP');
 expect(await art.evaluate(()=>[meditationRenderer.renderer.info.programs.length,meditationRenderer.renderer.info.memory.textures])).toEqual(resources);
 pass('Real avatar walking, jump, F immersion, pupil entry and return to next artwork; prewarmed GPU program and texture counts remain stable');
 for(const style of ['cel','acrylic','graphic','pc98','adv90','novel00','postpixel']){
  await openMenu(art);await art.locator('#art-style').selectOption(style);
  await art.waitForFunction(style=>meditationRenderer.activeStyle===style,style);await expect(art.locator('#art-style')).toBeEnabled();
  await art.keyboard.press('Escape');await art.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const output=await art.locator('#stage canvas').evaluate(c=>c.toDataURL());
  styleHashes.push({style,sha256:createHash('sha256').update(output).digest('hex')});
  if(['acrylic','pc98'].includes(style))await art.screenshot({path:out+'/style-'+style+'.png'});
 }
 expect(new Set(styleHashes.map(v=>v.sha256)).size).toBe(7);
 pass('All seven illustration styles produce distinct real rendered output');
 await openMenu(art);await art.locator('#film-mode').click();await art.waitForFunction(()=>eyeAndLight.mode==='film'&&document.querySelector('#sample').readyState>=2);
 await openMenu(art);await expect(art.locator('#style-note')).toBeVisible();await expect(art.locator('#style-note')).toContainText('更新前');
 await openMenu(art);if(!await art.evaluate(()=>eyeAndLight.playing))await art.locator('#play').click();
 const before=await art.locator('#sample').evaluate(v=>v.currentTime);await art.waitForFunction(t=>document.querySelector('#sample').currentTime>t+.2,before);
 await art.locator('#play').click();expect(await art.locator('#sample').evaluate(v=>v.paused)).toBe(true);
 await art.locator('#seek').fill('5.2');await art.waitForFunction(()=>Math.abs(document.querySelector('#sample').currentTime-5.2)<.1&&!document.querySelector('#sample').seeking);
 expect(await art.locator('#sample').evaluate(v=>[v.videoWidth,v.videoHeight,v.duration])).toEqual([1920,1080,60]);
 await art.locator('#film-mode').click();await art.waitForFunction(()=>eyeAndLight.mode==='room');
 pass('Old movie is labelled as a previous recording, plays, pauses, seeks and returns to updated 3D');
 for(const file of ['vendor/three/LICENSE.txt','vendor/three-vrm/LICENSE.txt','assets/animations/LICENSE-Quaternius-CC0.txt']){
  const response=await art.request.get(new URL(file,artURL).href);expect(response.ok()).toBe(true);
 }
 await art.close();
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
 const mp=await mobileContext.newPage();mp.on('pageerror',e=>errors.push(e.message));mp.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
 await mp.goto(artURL,{waitUntil:'domcontentloaded'});await mp.waitForFunction(()=>window.eyeAndLight?.ready&&meditationRenderer.avatar.ready&&document.querySelector('#preloader').hidden,null,{timeout:90000});
 expect(await mp.locator('#stage').boundingBox()).toEqual({x:0,y:0,width:390,height:844});
 expect(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect(mp.locator('#touch-actions')).toBeVisible();
 for(const selector of ['[data-move=KeyW]','[data-move=KeyS]','#touch-jump','#touch-immersion']){
  const b=await mp.locator(selector).boundingBox();expect(b.x>=210&&b.y>=0&&b.x+b.width<=390&&b.y+b.height<=844&&b.width>=44&&b.height>=44).toBe(true);
 }
 const cdp=await mobileContext.newCDPSession(mp),points=new Map();
 const centre=async selector=>{const b=await mp.locator(selector).boundingBox();return{x:b.x+b.width/2,y:b.y+b.height/2};};
 const send=async(type,id,point)=>{
  if(type==='touchStart'||type==='touchMove')points.set(id,{id,...point,radiusX:5,radiusY:5,force:1});
  else{const ended=points.get(id);points.delete(id);await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:ended?[ended]:[]});return;}
  await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:[...points.values()]});
 };
 const mz=await mp.evaluate(()=>meditationRenderer.avatar.position.z);await send('touchStart',1,await centre('[data-move=KeyS]'));
 await mp.waitForFunction(z=>meditationRenderer.avatar.position.z>z+.08,mz);
 const yaw=await mp.evaluate(()=>meditationRenderer.avatar.yaw);await send('touchStart',2,{x:195,y:360});await send('touchMove',2,{x:235,y:375});
 await mp.waitForFunction(y=>Math.abs(meditationRenderer.avatar.yaw-y)>.05,yaw);
 await send('touchStart',3,await centre('#touch-jump'));await mp.waitForFunction(()=>meditationRenderer.avatar.jumpState.height>.08);
 await send('touchEnd',3);await send('touchEnd',2);expect(await mp.evaluate(()=>meditationRenderer.avatar.touchKeys.has('KeyS'))).toBe(true);
 await send('touchEnd',1);await mp.waitForFunction(()=>meditationRenderer.avatar.touchKeys.size===0);
 await mp.locator('#touch-immersion').tap();await mp.waitForFunction(()=>meditationRenderer.manualImmersion===1);
 await mp.locator('#touch-immersion').tap();await mp.waitForFunction(()=>meditationRenderer.manualImmersion===0);
 await mp.screenshot({path:out+'/artwork-mobile.png'});
 await mp.locator('#menu-toggle').tap();await expect(mp.locator('#menu')).toBeVisible();
 const menu=await mp.locator('#menu').boundingBox();expect(menu.x>=0&&menu.y>=0&&menu.x+menu.width<=390&&menu.y+menu.height<=844).toBe(true);
 await mp.screenshot({path:out+'/artwork-mobile-menu.png'});await mp.locator('#menu-close').tap();
 await mp.reload();await mp.waitForFunction(()=>window.eyeAndLight?.ready&&document.querySelector('#preloader').hidden,null,{timeout:90000});await expect(mp).toHaveTitle(project.title);
 await mobileContext.close();pass('390px touch UI stays inside viewport; native multi-touch movement, look, jump and immersion work, menu and reload retain the updated title');
 expect(errors).toEqual([]);
} catch(e){results.push({name:'Eye and Light integration',status:'FAIL',details:e.stack});process.exitCode=1;console.error(e);}
finally{await writeFile(`${out}/results.json`,JSON.stringify({base,artURL,bundle,styleHashes,version:JSON.parse(await readFile('package.json','utf8')).version,browser:await browser?.version(),results,errors,scope:'Real Windows Chrome; mobile viewport simulation, not physical devices. Uses existing supplied movie, no video recording.'},null,2));await browser?.close();server?.kill();}
