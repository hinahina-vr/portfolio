import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#art-stage')).toHaveAttribute('data-scene','kelp-current');
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.locator('.immerse-toggle').click();
  const previousWidth=await page.locator('.shader-canvas').evaluate(canvas=>canvas.width);
  await page.setViewportSize({width:1024,height:768});
  await expect.poll(()=>page.locator('.shader-canvas').evaluate(canvas=>canvas.width)).not.toBe(previousWidth);
  await page.waitForTimeout(500);
  const output=async()=>createHash('sha256').update(await page.screenshot({clip:{x:350,y:180,width:500,height:350}})).digest('hex');
  const before=await output();
  await page.keyboard.press('Escape');
  await page.locator('#settings-toggle').click();
  await page.locator('#intensity').fill('2.4');
  await page.keyboard.press('Escape');
  await page.locator('.immerse-toggle').click();
  await page.waitForTimeout(500);
  expect(await output()).not.toBe(before);
  await expect(page.locator('.motion-toggle')).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'qa/v2.3.2/paused-settings.png'});
  results.push({status:'PASS',name:'Paused shader redraws after viewport resize and intensity change, while remaining paused'});
  console.log(results[0].name);
}catch(error){results.push({status:'FAIL',details:error.stack});process.exitCode=1;console.error(error);}
finally{
  await writeFile('qa/v2.3.2/paused-controls-results.json',JSON.stringify({version:'2.3.2',artifact:'dist',testedAt:new Date().toISOString(),browser:await browser.version(),results},null,2));
  await browser.close();
}
