import {chromium,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const before=process.argv.includes('--before');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
  if(!before)await expect(page.locator('.open-project')).toHaveText('Visit website');
  for(const [name,selector] of [['Open site','.open-project'],['Selected work','.project-card[aria-pressed=true]'],['Background controls','.canvas-controls'],['Menu','.menu-toggle']]){
    const appearance=await page.locator(selector).evaluate(el=>{const style=getComputedStyle(el),box=el.getBoundingClientRect();return{border:parseFloat(style.borderTopWidth),height:box.height,background:style.backgroundColor,decoration:style.textDecorationLine};});
    const pass=appearance.border>=1&&appearance.height>=40&&appearance.decoration==='none';
    results.push({name,status:pass?'PASS':'FAIL',appearance});
    if(!pass&&!before)process.exitCode=1;
  }
  await page.screenshot({path:`qa/v2.3.2/${before?'before':'after'}-buttons.png`,fullPage:true});
  console.log(JSON.stringify(results));
}finally{
  await writeFile(`qa/v2.3.2/${before?'before':'after'}-buttons.json`,JSON.stringify({version:'2.3.2',revision:before?'interim text-link':'restored button treatment',artifact:'dist',testedAt:new Date().toISOString(),results},null,2));
  await browser.close();
}
