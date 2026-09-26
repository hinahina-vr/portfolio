import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const output='qa/v2.3.2';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  const response=await page.goto('https://gaia-senseware.pages.dev/concept/#depth',{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(2500);
  await page.screenshot({path:`${output}/myth-source.png`});
  await page.screenshot({path:'public/assets/myth-making-machine.jpg',type:'jpeg',quality:90});
  const text=await page.locator('body').innerText();
  await writeFile(`${output}/myth-source-content.txt`,text);
  console.log(JSON.stringify({status:response.status(),url:page.url(),title:await page.title(),text,depth:await page.locator('#depth').count(),links:await page.locator('a').evaluateAll(nodes=>nodes.map(a=>({text:a.innerText,url:a.href})))}));
}finally{await browser.close();}
