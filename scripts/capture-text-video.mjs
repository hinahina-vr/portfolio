import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('qa/v2.6.0',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [id,url] of [['hinahina-text','https://hinahina-vr.github.io/'],['hinahina-note','https://note.com/hinahina_vr'],['maltbc','https://www.youtube.com/@maltbc']]){
const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2});await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(5000);await page.screenshot({path:`public/assets/${id}.png`});const body=await page.locator('body').innerText();await writeFile(`qa/v2.6.0/${id}.txt`,body);console.log(JSON.stringify({id,title:await page.title(),text:body.slice(0,2300)}));await page.close();}}finally{await browser.close();}
