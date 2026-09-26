import {chromium,expect as baseExpect} from '@playwright/test';
const expect=baseExpect.configure({timeout:10000});
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {categories} from '../content.js';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {PNG}=require('../node_modules/playwright-core/lib/utilsBundle.js');

const server=spawn(process.execPath,['scripts/serve.mjs','dist','4187'],{stdio:'pipe',windowsHide:true});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>{if(code)reject(new Error(`Server: ${code}`));});});
await mkdir('qa/v2.5.13',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:process.platform==='linux'?['--enable-unsafe-swiftshader']:[]});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const results=[],errors=[],url='http://127.0.0.1:4187/';
const record=(name,details='')=>{results.push({name,status:'PASS',details});console.log('PASS:',name);};
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
function pixelDifference(a,b){const left=PNG.sync.read(a),right=PNG.sync.read(b);expect(left.width).toBe(right.width);expect(left.height).toBe(right.height);let max=0,changed=0;for(let i=0;i<left.data.length;i++){const delta=Math.abs(left.data[i]-right.data[i]);max=Math.max(max,delta);if(delta>2)changed++;}return{max,changed};}
const artImage=()=>page.screenshot({clip:{x:650,y:170,width:650,height:380}});
const screenshot=async name=>{await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));return page.screenshot({path:`qa/v2.5.13/${name}.png`,fullPage:true});};
page.on('pageerror',e=>errors.push(e.message));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
page.on('response',response=>{if(response.url().startsWith(url)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
async function ready(scene){await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true',{timeout:20000});if(scene)await expect(page.locator('#art-stage')).toHaveAttribute('data-scene',scene,{timeout:20000});}
try{
  await page.goto(url+'#works/web',{waitUntil:'networkidle'});
  await ready('kelp-current');
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  // Hold slides with the supported motion preference; test background motion separately.
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.motion-toggle').click();
  await expect(page.locator('.site-header h1')).toHaveText('hinahina');
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.fonts.check('400 16px "Portfolio Grotesk"')&&document.fonts.check('700 16px "Portfolio Grotesk"'))).toBe(true);
  await expect(page.locator('.gallery h1,.portfolio-intro')).toHaveCount(0);
  await expect(page.getByRole('tab')).toHaveText(['Web','Visual','Experiments']);
  await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName('惑星の放課後');
  await expect(page.locator('.project-card').first()).toHaveAttribute('data-project','gaia-senseware');
  await expect(page.locator('.preview-image')).toHaveAttribute('src','./assets/gaia-senseware.jpg');
  expect(await page.locator('.preview-image').evaluate(img=>img.complete&&img.naturalWidth===1440)).toBe(true);
  const previewBox=await page.locator('.preview-image').boundingBox();
  expect(previewBox.width).toBeGreaterThan(500);
  expect(previewBox.height).toBeGreaterThan(300);
  await expect(page.locator('.preview-image')).toHaveCSS('opacity','1');
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await expect(page.locator('.project-card')).toHaveCount(4);
  await expect(page.locator('#tab-web')).toHaveAttribute('aria-selected','true');
  const box=await page.locator('.shader-canvas').boundingBox();
  expect(box).toMatchObject({x:0,y:0,width:1440,height:900});
  expect(await page.locator('.project-card img').evaluateAll(nodes=>nodes.every(img=>img.complete&&img.naturalWidth>500))).toBe(true);
  await screenshot('desktop-idle');
  record('Exhibition layout: hinahina identity, Gaia first, opaque borderless preview, full-screen shader and all four work buttons fit desktop');

  await page.locator('.immerse-toggle').click();await page.waitForTimeout(500);
  const before=hash(await artImage());
  await page.mouse.move(1090,240);await page.mouse.down();await page.mouse.move(780,400,{steps:15});await page.mouse.move(1140,440,{steps:15});await page.mouse.up();
  const after=hash(await artImage());expect(after).not.toBe(before);
  await screenshot('desktop-reactive');
  await page.keyboard.press('Escape');
  await page.locator('.motion-toggle').click();
  await page.locator('.immerse-toggle').click();await page.waitForTimeout(500);
  const still=await artImage();
  await page.mouse.move(820,250);await page.mouse.down();await page.mouse.move(1170,450,{steps:12});await page.mouse.up();await page.waitForTimeout(150);
  // GPU compositing can round a few channels by 1/255 between screenshots.
  expect(pixelDifference(still,await artImage()).max).toBeLessThanOrEqual(2);
  await page.reload({waitUntil:'networkidle'});await ready();
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.motion-toggle').click();
  await page.locator('.immerse-toggle').click();await page.waitForTimeout(500);
  const resumed=hash(await artImage());await page.waitForTimeout(180);expect(hash(await artImage())).not.toBe(resumed);
  await page.keyboard.press('Escape');
  record('Actual fluid output reacts; pause freezes output during pointer input, persists on reload, and resumes');

  for(const project of categories.web.projects){
    await page.locator(`.project-card[data-project="${project.id}"]`).click();
    await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName(project.title);
    await expect(page.locator('.open-project')).toHaveAttribute('href',project.url);
    await ready(project.scene);
    await expect(page.locator('.preview-image')).toHaveAttribute('src',project.image);
    await expect(page.locator('.preview-link')).toHaveAttribute('href',project.url);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await page.waitForTimeout(300);
    await screenshot(`project-${project.id}`);
    const popupPromise=page.waitForEvent('popup');await page.locator('.preview-link').click();const popup=await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).hostname).toBe(new URL(project.url).hostname);
    expect(await popup.title()).not.toBe('');
    await popup.close();
    if(project.id==='gaia-senseware'){const ctaPopup=page.waitForEvent('popup');await page.locator('.open-project').click();const actual=await ctaPopup;await actual.waitForLoadState('domcontentloaded');expect(new URL(actual.url()).hostname).toBe('gaia-senseware.pages.dev');await actual.close();}
  }
  record('Four projects: selection, titles, large preview image/URL mapping, and screenshot links open actual external sites in new tabs');
  await page.goBack();await expect(page.locator('#work-panel')).toHaveAttribute('data-project','chinameng');
  await page.reload({waitUntil:'networkidle'});await ready();await expect(page.locator('#work-panel')).toHaveAttribute('data-project','chinameng');
  await page.locator('#tab-web').click();await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
  await page.goto(url);await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
  record('Project-specific URLs, browser Back and reload preserve selection; Web tab and root URL open Gaia');

  await page.locator('#tab-visual').click();await expect(page.locator('.project-card')).toHaveCount(2);
  await page.locator('.project-card[data-project="botanical-tide"]').click();await ready('kelp-current');
  await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName('Botanical Tide');
  await page.locator('#tab-experiments').click();await expect(page.locator('.project-card')).toHaveCount(1);await ready('fluid-chrome-stream');
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','myth-making-machine');
  await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName('神話製作機械');
  await expect(page.locator('.project-card')).toHaveText('神話製作機械');
  await expect(page.locator('.open-project')).toHaveText('Open concept');
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  await expect(page.locator('#work-panel, #project-strip').getByText('Gesture Cut Field',{exact:true})).toHaveCount(0);
  await expect.poll(()=>page.locator('.preview-image').evaluate(img=>img.complete&&img.naturalWidth===1440)).toBe(true);
  await screenshot('experiment-desktop');
  for(const selector of ['.preview-link','.open-project']){
    await expect(page.locator(selector)).toHaveAttribute('href','https://gaia-senseware.pages.dev/concept/#depth');
    const opened=page.waitForEvent('popup');await page.locator(selector).click();const actual=await opened;
    await actual.waitForLoadState('domcontentloaded');
    expect(actual.url()).toBe('https://gaia-senseware.pages.dev/concept/#depth');
    const title=actual.getByRole('heading',{name:'神話製作機械',exact:true});
    await expect(title).toBeInViewport({timeout:15000});
    await actual.close();
  }
  await page.reload({waitUntil:'networkidle'});await ready('fluid-chrome-stream');
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','myth-making-machine');
  record('Experiments replaces Gesture Cut Field with 神話製作機械; real screenshot and Open concept both open the live #depth heading, and selection survives reload');
  await page.locator('#tab-experiments').focus();await page.keyboard.press('Home');await expect(page.locator('#tab-web')).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(page.locator('#tab-visual')).toHaveAttribute('aria-selected','true');
  record('All categories, keyboard navigation, and original shader switching');

  await expect(page.locator('.menu-toggle,#site-menu')).toHaveCount(0);
  await page.locator('#tab-web').click();
  record('Index removed; category tabs retain direct navigation');

  await page.locator('#settings-toggle').click();await expect(page.locator('#scene-settings')).toBeVisible();
  for(const scene of ['kelp-current','fluid-chrome-stream','lilian-kaleido-loom']){await page.locator('#scene-select').selectOption(scene);await ready(scene);}
  await page.locator('#intensity').fill('1.8');await expect(page.locator('#intensity-value')).toHaveText('1.80');
  await page.locator('#motion').fill('0.8');await expect(page.locator('#motion-value')).toHaveText('0.80');
  await page.keyboard.press('Escape');await expect(page.locator('#scene-settings')).not.toBeVisible();
  await page.locator('.immerse-toggle').click();await expect(page.locator('#interface')).toHaveJSProperty('inert',true);await expect(page.locator('.restore-ui')).toBeVisible();
  await page.waitForTimeout(500);await screenshot('immersive-mode');
  await page.keyboard.press('Escape');await expect(page.locator('.immerse-toggle')).toBeFocused();await expect(page.locator('#interface')).toHaveJSProperty('inert',false);
  record('Background controls, intensity/speed, immersive view and Escape return');

  // Motion is verified above. Freeze continuous GPU work during the layout matrix;
  // scene changes and resizing still produce real rendered frames while paused.
  if(await page.locator('.motion-toggle').getAttribute('aria-pressed')==='false')await page.locator('.motion-toggle').click();
  for(const viewport of [{width:1920,height:1080},{width:1440,height:700},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
    await page.setViewportSize(viewport);await page.goto(url,{waitUntil:'networkidle'});await ready();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const canvasBox=await page.locator('.shader-canvas').boundingBox();expect(canvasBox.width).toBe(viewport.width);expect(canvasBox.height).toBe(viewport.height);
    for(const cat of ['web','visual','experiments']){
      await page.locator(`#tab-${cat}`).click();
      for(const project of categories[cat].projects){
        await page.locator(`.project-card[data-project="${project.id}"]`).click();
        await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName(project.title);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        await expect(page.locator('.preview-image')).toHaveAttribute('src',project.image);
        await expect.poll(()=>page.locator('.preview-image').evaluate(img=>img.complete&&img.naturalWidth>500)).toBe(true);
        await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
        const preview=await page.locator('.preview-image').boundingBox();expect(preview.width).toBeGreaterThan(viewport.width<=700?viewport.width*.8:viewport.width<=850?viewport.width*.68:300);
        const label=page.locator('.project-label');
        await expect(label).toHaveAttribute('lang','en');
        await expect(label.locator('.project-medium')).toHaveText(project.medium);
        await expect(label.locator('.project-description')).toHaveAttribute('lang','ja');
        await expect(label.locator('.project-description')).toHaveText(project.description);
        expect(project.description).toMatch(/[ぁ-んァ-ヶ一-龯]/);
        const captionBounds=await label.boundingBox(), proseBounds=await label.locator('.project-description').boundingBox();
        expect(captionBounds.width).toBeLessThanOrEqual(440);
        if(viewport.width>850){expect(captionBounds.x-(preview.x+preview.width)).toBeGreaterThanOrEqual(31);}else{expect(captionBounds.width).toBeGreaterThan(viewport.width<700?viewport.width-70:430);}
        expect(proseBounds.x).toBeGreaterThanOrEqual(captionBounds.x);
        expect(proseBounds.x+proseBounds.width).toBeLessThanOrEqual(captionBounds.x+captionBounds.width+1);
        expect(proseBounds.y+proseBounds.height).toBeLessThanOrEqual(captionBounds.y+captionBounds.height+1);
        expect(await label.locator('.project-description').evaluate(el=>getComputedStyle(el).fontFamily)).toContain('Yu Mincho');
        const caption=await page.locator('.site-header').boundingBox();const info=await page.locator('.project-info').boundingBox();expect(info.y).toBeGreaterThan(caption.y+caption.height);
        if(viewport.width>850){expect(info.x).toBeGreaterThanOrEqual(preview.x+preview.width+31);expect(info.x-preview.x-preview.width).toBeLessThanOrEqual(81);}else{expect(info.y).toBeGreaterThanOrEqual(preview.y+preview.height+24);}
        const anchor=await page.locator('.open-project').boundingBox();const controls=await page.locator('.canvas-controls').boundingBox();
        expect(anchor.x+anchor.width<=controls.x || anchor.y+anchor.height<=controls.y || anchor.y>=controls.y+controls.height).toBe(true);
        if(project.id==='myth-making-machine')await screenshot(`experiment-${viewport.width}`);
      }
    }
    await page.locator('#tab-web').click();await ready();await screenshot(`viewport-${viewport.width}`);
    if(viewport.width===390){await page.locator('#tab-web').click();await page.locator('[data-project="gaia-senseware"].project-card').click();await ready('kelp-current');await screenshot('mobile-gaia');}
    record(`Responsive ${viewport.width}×${viewport.height}: full-screen WebGL, portfolio identity in the header, all 7 large previews, no overflow or heading/CTA overlap`);
  }

  const reduced=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await reduced.goto(url,{waitUntil:'networkidle'});await expect(reduced.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await reduced.locator('.immerse-toggle').click();
  await reduced.waitForTimeout(250);const clip={x:650,y:180,width:500,height:350};const reducedImage=await reduced.screenshot({clip});await reduced.waitForTimeout(180);expect(pixelDifference(reducedImage,await reduced.screenshot({clip})).max).toBeLessThanOrEqual(2);await reduced.close();
  record('Reduced-motion preference produces a static real shader render');

  const fallback=await browser.newPage();
  await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};Object.defineProperty(window,'localStorage',{get(){throw new Error('Test storage denial');}});});
  await fallback.goto(url,{waitUntil:'networkidle'});await expect(fallback.locator('.art-fallback')).toBeVisible();await expect(fallback.locator('.motion-toggle')).not.toBeVisible();
  await fallback.locator('.project-card[data-project="quiz-pal"]').click();await expect(fallback.getByRole('heading',{level:2})).toHaveAccessibleName('Quiz Pal');await fallback.close();
  record('Simulated unavailable WebGL and denied storage: fallback image and project navigation work');
  const noJs=await browser.newPage({javaScriptEnabled:false});await noJs.goto(url);await expect(noJs.locator('noscript a')).toHaveCount(4);await noJs.close();
  record('JavaScript disabled: all four live-site links remain available');
  expect(errors).toEqual([]);record('No runtime, shader compile, or local asset request errors');
}catch(error){results.push({name:'v2.5.13 browser validation',status:'FAIL',details:error.stack});await screenshot('failure').catch(()=>{});console.error(error);process.exitCode=1;}
finally{await writeFile('qa/v2.5.13/test-results.json',JSON.stringify({version:'2.5.13',artifact:'dist',testedAt:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));await browser.close();server.kill();}
