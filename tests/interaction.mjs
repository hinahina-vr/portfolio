import {chromium,expect} from '@playwright/test';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';

const target=process.env.INTERACTION_URL||'http://127.0.0.1:4198/';
let server;
if(!process.env.INTERACTION_URL){
  server=spawn(process.execPath,['scripts/serve.mjs','dist','4198'],{stdio:'pipe',windowsHide:true});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>{if(code)reject(new Error(`Server exited ${code}`));});});
}
const output=process.env.INTERACTION_OUT||'qa/interaction-2026-10-15';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const results=[],errors=[];
page.on('pageerror',error=>errors.push(error.stack||error.message));
const record=name=>{results.push({name,status:'PASS'});console.log(`PASS ${name}`);};
const selected=()=>page.locator('#work-panel').getAttribute('data-project');
try{
 if(!process.argv.includes('--auto-pause-only')){
  await page.goto(target+'#works/web/chinameng');
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','chinameng');
  const history=await page.evaluate(()=>{window.originalPanel=document.querySelector('.work-content');return window.history.length;});
  await page.locator('.project-card[aria-pressed=true]').click({clickCount:2});
  expect(await page.evaluate(()=>window.history.length)).toBe(history);
  expect(await page.evaluate(()=>window.originalPanel===document.querySelector('.work-content'))).toBe(true);
  await page.locator('.skip-link').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#work-panel')).toBeFocused();
  expect(await selected()).toBe('chinameng');expect(new URL(page.url()).hash).toBe('#works/web/chinameng');
  record('Re-selecting a work keeps its DOM and browser history; Skip to work preserves the selected URL');

  await page.locator('#settings-toggle').click();
  await expect(page.locator('#scene-select')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('#intensity')).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('#scene-settings')).toBeHidden();
  await expect(page.locator('#settings-toggle')).toBeFocused();
  record('Settings opens at Artwork; Tab reaches Light; Escape closes and restores the trigger');

  await page.locator('#tab-web').focus();await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-visual')).toBeFocused();await expect(page.locator('#tab-visual')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('End');await expect(page.locator('#tab-experiments')).toHaveAttribute('aria-selected','true');
  await page.keyboard.press('Home');await expect(page.locator('#tab-web')).toHaveAttribute('aria-selected','true');
  record('Category arrow, Home and End navigation continue to select and focus the correct tabs');

  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','false');
  await page.locator('.motion-toggle').click();
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.motion-toggle').evaluate(element=>element.blur());
  const pausedProject=await selected();
  await page.waitForTimeout(18000);
  expect(await selected()).toBe(pausedProject);
  await expect(page.locator('.panel-canvas')).toHaveCount(0);
  await page.locator('.project-card[data-project="quiz-pal"]').click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','quiz-pal');
  await expect(page.locator('.panel-canvas')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  expect(await page.locator('body').getAttribute('data-entrance')).toBeNull();
  record('Pause prevents real-time auto advance for 18 seconds, keeps manual navigation static, survives preference changes and reload');

  await page.locator('.motion-toggle').click();
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('body')).toHaveAttribute('data-slideshow-interval','16000');
  await page.locator('.project-card[data-project="gaia-senseware"]').click();
  await page.waitForTimeout(80);
  await page.locator('.motion-toggle').click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
  await expect(page.locator('#art-stage')).toHaveAttribute('data-transition-phase','ready');
  await expect(page.locator('.panel-canvas')).toHaveCount(0);
  await expect(page.locator('.project-info')).toHaveCSS('opacity','1');
  record('Pausing during the background transition settles the requested work without a hidden caption or orphan panel');

  await page.locator('.motion-toggle').click();
  await page.locator('.project-card[data-project="glsl-showcase"]').click();
  await page.waitForTimeout(40);
  await page.locator('.project-card[data-project="chinameng"]').click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','chinameng',{timeout:15000});
  await page.waitForTimeout(5200);
  await expect(page.locator('.panel-canvas')).toHaveCount(0);
  await expect(page.locator('.project-title')).toHaveCSS('opacity','1');
  await expect(page.locator('.project-label')).toHaveCSS('opacity','1');
  expect(new URL(page.url()).hash).toBe('#works/web/chinameng');
  await page.locator('.motion-toggle').click();
  await page.locator('.motion-toggle').evaluate(element=>element.blur());
  await page.screenshot({path:output+'/settled.png'});
  record('Rapid work changes settle on the last request with visible fixed-position caption and no leftover transition canvas');

  await page.waitForTimeout(20500);
  await expect(page.locator('body')).toHaveAttribute('data-slideshow-interval','8000');
  record('The interaction interval returns from 16 seconds to 8 seconds after 20 seconds idle');
 }
  await page.addInitScript(()=>localStorage.setItem('portfolio-motion','paused'));
  await page.goto(target+'#works/web/gaia-senseware');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.motion-toggle').click();
  await page.locator('.motion-toggle').evaluate(element=>element.blur());
  await page.waitForFunction(()=>document.querySelector('#art-stage').dataset.transitionPhase==='fade-out',{},{timeout:20000});
  await page.locator('.motion-toggle').click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','glsl-showcase');
  expect(new URL(page.url()).hash).toBe('#works/web/glsl-showcase');
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.panel-canvas')).toHaveCount(0);
  record('Stopping an automatic change settles both the requested work and its URL');
  if(!process.argv.includes('--auto-pause-only')){
    await page.locator('.motion-toggle').click();
    await page.locator('.project-card[data-project="gaia-senseware"]').click();
    await page.waitForSelector('.panel-canvas');
    await page.locator('.immerse-toggle').click();
    await expect(page.locator('#interface')).toHaveJSProperty('inert',true);
    for(const selector of ['.panel-canvas','.liquid-canvas','.panel-outgoing','[data-transition-text]']){
      for(const element of await page.locator(selector).all())await expect(element).toHaveCSS('visibility','hidden');
    }
    await expect(page.locator('.restore-ui')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.immerse-toggle')).toBeFocused();
    await expect(page.locator('#interface')).toHaveJSProperty('inert',false);
    await expect(page.locator('.panel-canvas')).toHaveCount(0,{timeout:10000});
    await expect(page.locator('.project-title')).toHaveCSS('opacity','1');
    await expect(page.locator('.project-label')).toHaveCSS('opacity','1');
    await expect(page.locator('.liquid-canvas')).toHaveCSS('visibility','visible');
    record('Immersing during a wring hides photo, liquid and outgoing caption layers; Escape restores the settled artwork and controls');

    await page.emulateMedia({reducedMotion:'reduce'});
    for(const viewport of [{width:390,height:640},{width:844,height:390}]){
      await page.setViewportSize(viewport);
      await page.goto(target+'#works/web/zen-quest-map');
      await expect(page.locator('#work-panel')).toHaveAttribute('data-project','zen-quest-map');
      await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
      expect(await page.locator('.preview-image').evaluate(element=>element.getBoundingClientRect().top)).toBeLessThan(0);
      await page.locator('.project-card[data-project="gaia-senseware"]').click();
      await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
      await expect.poll(()=>page.locator('.preview-image').evaluate(element=>element.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
      const dock=await page.locator('.collection').boundingBox();
      expect(dock.y).toBeGreaterThanOrEqual(0);expect(dock.y+dock.height).toBeLessThanOrEqual(viewport.height);
      await page.screenshot({path:output+'/dock-switch-'+viewport.width+'x'+viewport.height+'.png'});
    }
    record('At 390×640 and 844×390 reduced-motion viewports, selecting Gaia from the bottom of ZEN returns its image to view and retains the dock');
  }
  expect(errors).toEqual([]);
} catch(error){results.push({name:'interaction regression',status:'FAIL',details:error.stack});console.error(error);process.exitCode=1;await page.screenshot({path:output+'/failure.png'}).catch(()=>{});}
finally{
  const appHash=createHash('sha256').update(await readFile('app.js')).digest('hex');
  await writeFile(output+'/results.json',JSON.stringify({target,testedAt:new Date().toISOString(),browser:await browser.version(),appHash,bundle:await page.locator('script[type=module]').getAttribute('src'),results,errors,limits:'Real Windows Chrome desktop. Mobile hardware and Safari not tested by this script.'},null,2));
  await browser.close();server?.kill();
}
