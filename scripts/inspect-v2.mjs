import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('qa/v2',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await page.waitForTimeout(2200);
  await page.screenshot({path:'qa/v2/desktop-idle.png'});
  await page.mouse.move(1050,260);
  await page.mouse.down();
  await page.mouse.move(820,470,{steps:20});
  await page.mouse.move(1100,500,{steps:20});
  await page.mouse.up();
  await page.waitForTimeout(100);
  await page.screenshot({path:'qa/v2/desktop-reactive.png'});
  console.log(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(0,1700),canvases:await page.locator('canvas').evaluateAll(nodes=>nodes.map(c=>({w:c.width,h:c.height,rect:c.getBoundingClientRect().toJSON()})))}));
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(700);
  await page.screenshot({path:'qa/v2/mobile-initial.png',fullPage:true});
  await page.locator('[data-project="gaia-senseware"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({path:'qa/v2/mobile-gaia.png',fullPage:true});
  await writeFile('qa/v2/inspection-errors.json',JSON.stringify(errors,null,2));
}finally{await browser.close();}
