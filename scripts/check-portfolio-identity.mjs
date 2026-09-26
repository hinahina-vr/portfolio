import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const before=process.argv.includes('--before');
const output='qa/v2.3.2';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  const current=await page.evaluate(()=>({heading:document.querySelector('h1').innerText,title:document.title,subtitle:document.querySelector('.project-subtitle').innerText,description:document.querySelector('.project-description').innerText,descriptionLang:document.querySelector('.project-description').lang,action:document.querySelector('.open-project').innerText}));
  await page.screenshot({path:`${output}/${before?'before':'after'}-identity.png`,fullPage:true});
  results.push({name:'The creator is identified by their supplied name',status:current.heading==='hinahina'?'PASS':'FAIL',current});
  results.push({name:'Exhibition description is Japanese',status:/[ぁ-んァ-ヶ一-龯]/.test(current.description)&&current.descriptionLang==='ja'?'PASS':'FAIL'});
  if(!before){
    expect(current.description).toMatch(/[ぁ-んァ-ヶ一-龯]/);
    expect(current.descriptionLang).toBe('ja');
    expect(current.heading).toBe('hinahina');
    expect(current.title).toBe('惑星の放課後 — hinahina');
    await expect(page.locator('.brand-description')).toHaveText('Web & interactive works');
    for(const cat of ['web','visual','experiments']){
      await page.locator(`#tab-${cat}`).click();
      for(const id of await page.locator('.project-card').evaluateAll(cards=>cards.map(card=>card.dataset.project))){
        await page.locator(`.project-card[data-project="${id}"]`).click();
        const copy=await page.locator('.project-subtitle,.project-medium').allTextContents();
        expect(copy.join(' ')).not.toMatch(/[ぁ-んァ-ヶ一-龯]/);
        await expect(page.locator('.project-description')).toHaveAttribute('lang','ja');
        expect(await page.locator('.project-description').innerText()).toMatch(/[ぁ-んァ-ヶ一-龯]/);
        await expect(page.locator('.open-project')).toHaveText(cat==='web'?'Visit website':cat==='experiments'?'Open concept':'Open showcase');
        expect(await page.title()).toMatch(/ — hinahina$/);
        if(cat!=='web'){
          const popupEvent=page.waitForEvent('popup');await page.locator('.open-project').click();const popup=await popupEvent;
          await popup.waitForLoadState('domcontentloaded');
          if(cat==='visual'){
            expect(new URL(popup.url()).hostname).toBe('glsl-effects-showcase.pages.dev');
            await expect(page.locator('.project-note')).toContainText('GLSL Effects Showcase');
          }else{
            expect(popup.url()).toBe('https://gaia-senseware.pages.dev/concept/#depth');
            await expect(popup.getByRole('heading',{name:'神話製作機械',exact:true})).toBeInViewport();
          }
          await popup.close();
        }
        results.push({name:`${id}: Japanese exhibition description, destination-specific action and author in page title`,status:'PASS'});
      }
    }
  }
  console.log(JSON.stringify(results));
}catch(error){results.push({name:'Author and wording regression',status:'FAIL',details:error.stack});process.exitCode=1;console.error(error);}
finally{await writeFile(`${output}/${before?'before':'after'}-identity.json`,JSON.stringify({version:before?'2.2.1':'2.3.2',artifact:'dist',testedAt:new Date().toISOString(),results},null,2));await browser.close();}
