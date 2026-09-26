import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {categories} from '../content.js';

const target=new URL(process.argv[2]||'https://hinahina-vr.github.io/portfolio/');
if(!target.pathname.endsWith('/'))throw new Error('Supply the site URL with a trailing slash');
const output='qa/deployment';
await mkdir(output,{recursive:true});
const {version}=JSON.parse(await readFile('package.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true,args:process.platform==='linux'?['--enable-unsafe-swiftshader']:[]});
const results=[],errors=[];
let revision;
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS:',name);};
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().startsWith(target.href)&&response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  const response=await page.goto(target.href+'#works/web',{waitUntil:'networkidle'});
  expect(response.status()).toBe(200);
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
  await expect(page.locator('.site-header h1')).toHaveText('hinahina://');
  await expect(page).toHaveTitle('hinahina://');
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','glsl-showcase',{timeout:12000});
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  pass('Public site loads real WebGL; Gaia is first and actual elapsed time advances to GLSL');
  for(const [category,data] of Object.entries(categories)){
    await page.locator(`#tab-${category}`).click();
    for(const project of data.projects){
      await page.locator(`.project-card[data-project="${project.id}"]`).click();
      await expect(page.getByRole('heading',{level:2})).toHaveAccessibleName(project.title);
      await expect(page.locator('.project-description')).toHaveText(project.description);
      await expect(page.locator('.open-project')).toHaveAttribute('href',project.url);
      await expect(page.locator('.preview-link')).toHaveAttribute('href',project.url);
      await expect(page.locator('.preview-image')).toHaveAttribute('src',project.image);
      const sourceWidth=3840;
      await expect.poll(()=>page.locator('.preview-image').evaluate((img,width)=>img.complete&&img.naturalWidth===width,sourceWidth)).toBe(true);
    }
  }
  await expect(page.locator('#slideshow-toggle')).toHaveCount(0);
  await page.reload({waitUntil:'networkidle'});
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','myth-making-machine');
  const opened=page.waitForEvent('popup');await page.locator('.open-project').click();const popup=await opened;
  await popup.waitForLoadState('domcontentloaded');
  expect(popup.url()).toBe('https://gaia-senseware.pages.dev/concept/#depth');
  await expect(popup.getByRole('heading',{name:'神話製作機械',exact:true})).toBeInViewport();
  await popup.close();
  pass('All twelve public previews and Japanese captions load; new concept link opens its actual section and selection survives reload');
  await expect(page.locator('.menu-toggle,#site-menu')).toHaveCount(0);
  await page.locator('#tab-web').click();
  await expect(page.locator('#work-panel')).toHaveAttribute('data-project','gaia-senseware');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  await page.screenshot({path:`${output}/public-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:`${output}/public-mobile.png`,fullPage:true});
  await page.locator('#tab-experiments').click();
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.open-project')).toBeVisible();
  await page.screenshot({path:`${output}/public-experiment-mobile.png`,fullPage:true});
  pass('Category navigation without Index and mobile layout work at the public subpath');
  const build=await page.request.get(new URL('build.json',target).href,{headers:{'Cache-Control':'no-cache'}});
  expect(build.ok()).toBe(true);revision=await build.json();expect(revision.version).toBe(version);
  if(process.env.EXPECTED_DEPLOY_COMMIT)expect(revision.commit).toBe(process.env.EXPECTED_DEPLOY_COMMIT);
  pass('Public build metadata matches the expected release');
  expect(errors).toEqual([]);pass('No application errors or failed public asset requests');
}catch(error){results.push({name:'Published site verification',status:'FAIL',details:error.stack});console.error(error);process.exitCode=1;}
finally{await writeFile(`${output}/public-results.json`,JSON.stringify({version,url:target.href,revision,testedAt:new Date().toISOString(),browser:await browser.version(),results,errors},null,2));await browser.close();}
