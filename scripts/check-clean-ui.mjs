import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {categories} from '../content.js';
const before=process.argv.includes('--before');
const output='qa/v2.3.2';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  const inspect=async name=>{
    const decorations=await page.evaluate(()=>({
      arrows:(document.body.textContent.match(/[↗↙↖↘]/g)||[]).length,
      numbers:document.querySelectorAll('.tab-index,.category-tabs sup,.project-number,.card-number').length,
      microLabels:document.querySelectorAll('.project-kicker,.project-tech,.card-type,.collection-hint,.scene-heading,#render-status,.brand>svg').length
    }));
    const pass=Object.values(decorations).every(count=>count===0);
    results.push({name,status:pass?'PASS':'FAIL',decorations});
    if(!pass&&!before)process.exitCode=1;
  };
  await inspect('Initial view: no ornamental arrows, numbers, or technical micro-labels');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  await page.screenshot({path:`${output}/${before?'before':'after'}-clean-ui.png`,fullPage:true});
  if(!before){
    await expect(page.getByRole('tab')).toHaveText(['Web','Visual','Experiments']);
    await expect(page.locator('.menu-toggle')).toHaveText('Index');
    await expect(page.locator('.open-project')).toHaveText('Visit website');
    await expect(page.locator('.site-header h1')).toHaveText('hinahina');
    await expect(page.locator('.portfolio-intro,.gallery h1')).toHaveCount(0);
    results.push({name:'English navigation and action labels; portfolio identity belongs to the header',status:'PASS'});
    for(const category of Object.keys(categories)){
      await page.locator(`#tab-${category}`).click();
      for(const project of categories[category].projects){
        await page.locator(`.project-card[data-project="${project.id}"]`).click();
        await inspect(`${category}: ${project.title}`);
      }
    }
    await page.locator('.menu-toggle').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#menu-title')).toHaveText('Index');
    await expect(page.locator('.menu-close')).toHaveText('Close');
    await expect(page.locator('[data-menu-category]')).toHaveText(['Web','Visual','Experiments']);
    await inspect('Open menu');
    await page.screenshot({path:`${output}/clean-menu.png`,fullPage:true});
    await page.keyboard.press('Escape');
    await page.locator('#tab-web').click();
    await page.locator('#settings-toggle').click();
    await expect(page.locator('#scene-settings')).toBeVisible();
    await expect(page.locator('#art-state')).toHaveText('Playing');
    await page.keyboard.press('Escape');
    await page.locator('.motion-toggle').click();
    await page.locator('#settings-toggle').click();
    await expect(page.locator('#art-state')).toHaveText('Paused');
    results.push({name:'Background playback status remains available inside settings',status:'PASS'});
  }
  console.log(JSON.stringify(results));
}catch(error){results.push({name:'Clean UI regression',status:'FAIL',details:error.stack});process.exitCode=1;console.error(error);}
finally{
  await writeFile(`${output}/${before?'before':'after'}-clean-ui.json`,JSON.stringify({version:before?'2.1.1':'2.3.2',artifact:'dist',testedAt:new Date().toISOString(),browser:await browser.version(),results},null,2));
  await browser.close();
}
