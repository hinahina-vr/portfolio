import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const output='qa/v2.3.2';
const motionOnly=process.argv.includes('--motion-only');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];
const pass=(name,details)=>{results.push({name,status:'PASS',details});console.log('PASS:',name);};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  const panel=page.locator('#work-panel'),control=page.locator('#slideshow-toggle');
  await expect(panel).toHaveAttribute('data-project','gaia-senseware');
  await expect(control).toHaveAccessibleName('Pause slideshow');
  const historyLength=await page.evaluate(()=>history.length);
  await page.waitForFunction(()=>{const el=document.querySelector('#work-panel'),style=getComputedStyle(el);return el.getAnimations().some(animation=>animation.playState==='running'&&animation.currentTime>90)&&new DOMMatrixReadOnly(style.transform).m41 < -2;},{},{timeout:10000,polling:'raf'});
  const motion=await panel.evaluate(el=>({x:new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,opacity:Number(getComputedStyle(el).opacity)}));
  expect(motion.x).toBeLessThan(-2);expect(motion.opacity).toBeGreaterThan(0);expect(motion.opacity).toBeLessThan(1);
  await page.screenshot({path:`${output}/slideshow-moving.png`});
  await expect(panel).toHaveAttribute('data-project','glsl-showcase',{timeout:2000});
  const entering=await page.locator('.work-content').evaluate(el=>({x:new DOMMatrixReadOnly(getComputedStyle(el).transform).m41,animations:el.getAnimations().length}));
  expect(entering.animations).toBeGreaterThan(0);
  expect(await page.evaluate(()=>history.length)).toBe(historyLength);
  expect(page.url()).toContain('#works/web/glsl-showcase');
  await expect(page.locator('.project-card[aria-pressed=true]')).toHaveAttribute('data-project','glsl-showcase');
  await expect(page.locator('.open-project')).toHaveAttribute('href','https://glsl-effects-showcase.pages.dev/');
  pass('Real elapsed time advances Gaia to GLSL with horizontal animation and no extra history entry',{motion,entering,interval:8000});

  if(!motionOnly){
  await page.waitForTimeout(2500);
  await page.locator('.project-card[data-project="chinameng"]').click();
  await page.waitForTimeout(6000);
  await expect(panel).toHaveAttribute('data-project','chinameng');
  await expect(panel).toHaveAttribute('data-project','quiz-pal',{timeout:4000});
  pass('Manual selection resets the full eight-second interval, then continues from that work');

  await control.click();
  await expect(control).toHaveAccessibleName('Play slideshow');
  await page.waitForTimeout(8500);
  await expect(panel).toHaveAttribute('data-project','quiz-pal');
  await page.reload({waitUntil:'networkidle'});
  await expect(control).toHaveAttribute('aria-pressed','true');
  await expect(panel).toHaveAttribute('data-project','quiz-pal');
  pass('Pause holds the work beyond an interval and is saved across reload');

  await control.click();
  await page.locator('.menu-toggle').click();
  await page.waitForTimeout(8500);
  await expect(panel).toHaveAttribute('data-project','quiz-pal');
  await page.locator('.menu-close').click();
  await expect(panel).toHaveAttribute('data-project','gaia-senseware',{timeout:10000});
  pass('Opening the Index holds the slide; closing resumes and the final web work wraps to Gaia');

  await page.locator('#tab-visual').click();
  await expect(panel).toHaveAttribute('data-project','lilian-loom');
  await expect(panel).toHaveAttribute('data-project','botanical-tide',{timeout:10000});
  await expect(page.locator('#tab-visual')).toHaveAttribute('aria-selected','true');
  await page.locator('#tab-experiments').click();
  await expect(control).toBeHidden();
  await expect(panel).toHaveAttribute('data-project','myth-making-machine');
  pass('Autoplay stays within the selected category; a single-work category hides its playback control');

  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await reduced.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(reduced.locator('#slideshow-toggle')).toHaveAttribute('aria-pressed','true');
  await expect(reduced.locator('#slideshow-toggle')).toHaveAccessibleName('Play slideshow');
  await reduced.screenshot({path:`${output}/slideshow-reduced-motion.png`,fullPage:true});
  await reduced.close();
  pass('Reduced-motion preference starts the slideshow paused');
  }
  expect(errors).toEqual([]);
  pass('No slideshow runtime errors');
}catch(error){results.push({name:'Slideshow regression',status:'FAIL',details:error.stack});console.error(error);process.exitCode=1;}
finally{await writeFile(`${output}/${motionOnly?'slideshow-motion-results':'slideshow-results'}.json`,JSON.stringify({version:'2.3.2',artifact:'dist',clock:'real elapsed time; no timer mocking',testedAt:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));await browser.close();}
