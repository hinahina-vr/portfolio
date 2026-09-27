import {chromium,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {categories} from '../content.js';

const start=Date.now(),errors=[],results=[];
const server=spawn(process.execPath,['scripts/serve.mjs','dist','4188'],{stdio:'pipe',windowsHide:true});
let browser;
try {
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error(`Server exited: ${code}`)));});
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),args:process.platform==='linux'?['--enable-unsafe-swiftshader']:[]});
  const page=await browser.newPage({viewport:{width:960,height:720},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:4188/')&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:4188/',{waitUntil:'networkidle'});
  await expect(page).toHaveTitle('hinahina://');
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true',{timeout:20000});
  await expect(page.getByRole('tab')).toHaveText(['Web','Visual','Words','Video','Experiments']);
  for(const [category,data] of Object.entries(categories)) {
    await page.locator(`#tab-${category}`).click();
    const project=data.projects[0];
    await expect(page.locator('#work-panel')).toHaveAttribute('data-project',project.id);
    await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName(project.title);
    await expect(page.locator('.open-project')).toHaveAttribute('href',project.url);
    await expect(page.locator('.preview-image')).toHaveCSS('opacity','0.8');
    await expect(page.locator('.preview-surface')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
    await expect.poll(()=>page.locator('.preview-image').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
    results.push(category);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#tab-web').click();
  await page.locator('.project-card').last().click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project',categories.web.projects.at(-1).id);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const selected=await page.locator('.project-card').last().boundingBox();
  expect(selected.y+selected.height).toBeLessThanOrEqual(844);
  await mkdir('qa/smoke',{recursive:true});
  await page.screenshot({path:'qa/smoke/mobile.png'});
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project',categories.web.projects.at(-1).id);
  expect(errors).toEqual([]);
  const report={bundle:await page.locator('script[type=module]').getAttribute('src'),seconds:(Date.now()-start)/1000,categories:results,mobile:true,routeReload:true,errors,scope:'Reduced-motion smoke only; full animation/GPU tests are opt-in'};
  await writeFile('qa/smoke/result.json',JSON.stringify(report,null,2));
  console.log('PASS',report);
} finally {await browser?.close();server.kill();}
