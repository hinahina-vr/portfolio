import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('qa/v2.6.1',{recursive:true});const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{for(const [id,url] of [['hinahina-github','https://github.com/hinahina-vr'],['hinahina-x','https://x.com/hinahina_vr']]){const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2});try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(3000);console.log(id,await p.title());if(!p.url().startsWith('chrome-error:'))await p.screenshot({path:`public/assets/${id}.png`});}catch(e){console.log(id,e.message.split('\n')[0]);}await p.close();}}finally{await b.close();}
