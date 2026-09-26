import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const output='qa/v2.3.3';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[],errors=[];
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS:',name);};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',error=>errors.push(error.message));
  // A previously saved pause must not leave users stuck after removing its control.
  await page.addInitScript(()=>localStorage.setItem('portfolio-slideshow','paused'));
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  const panel=page.locator('#work-panel');
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  await expect(page.getByRole('button',{name:/slideshow/i})).toHaveCount(0);
  await page.screenshot({path:output+'/without-slideshow-button-desktop.png'});
  const historyLength=await page.evaluate(()=>history.length);
  await expect(panel).toHaveAttribute('data-project','glsl-showcase',{timeout:12000});
  expect(await page.evaluate(()=>history.length)).toBe(historyLength);
  pass('Removed control; real timed autoplay works even with a saved legacy pause, without adding history');
  await page.locator('.menu-toggle').click();
  await page.waitForTimeout(8500);
  await expect(panel).toHaveAttribute('data-project','glsl-showcase');
  await page.locator('.menu-close').click();
  await expect(panel).toHaveAttribute('data-project','chinameng',{timeout:11000});
  pass('Index holds the slide and closing it resumes autoplay');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#tab-web').click();
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:output+'/without-slideshow-button-mobile.png',fullPage:true});
  await page.waitForTimeout(8500);
  await expect(panel).toHaveAttribute('data-project','gaia-senseware');
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  pass('Mobile has no control or leftover gap; reduced-motion stops autoplay');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(panel).toHaveAttribute('data-project','glsl-showcase',{timeout:11000});
  await page.locator('#tab-experiments').click();
  await page.waitForTimeout(8500);
  await expect(panel).toHaveAttribute('data-project','myth-making-machine');
  pass('Autoplay resumes when motion is enabled; the single-work category stays on its work');
  expect(errors).toEqual([]);
  pass('No runtime errors');
}catch(error){results.push({name:'Slideshow regression',status:'FAIL',details:error.stack});console.error(error);process.exitCode=1;}
finally{await writeFile(output+'/slideshow-results.json',JSON.stringify({version:'2.3.3',artifact:'dist',clock:'real elapsed time',testedAt:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));await browser.close();}
