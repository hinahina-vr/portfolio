import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const sites = [
  ['gaia-senseware', 'https://gaia-senseware.pages.dev/'],
  ['chinameng', 'https://chinameng.pages.dev/'],
  ['quiz-pal', 'https://hinahina-vr.github.io/quiz-pal/']
];
await mkdir('qa/v2', {recursive:true});
await mkdir('public/assets', {recursive:true});
const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
  for(const [id,url] of sites.filter(([id])=>!process.argv[2]||id===process.argv[2])) {
    const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(3500);
    if(id==='gaia-senseware'){
      await page.getByText('サウンドなし',{exact:true}).click();
      await page.waitForTimeout(1200);
    }
    if(id==='quiz-pal'){
      // Dismiss the introduction using its accessible control at any viewport.
      await page.getByRole('button',{name:'紹介を閉じる'}).click();
      await page.waitForTimeout(700);
      const skip=page.getByText('スキップ',{exact:true});
      if(await skip.count())await skip.click();
      await page.waitForTimeout(350);
    }
    await page.screenshot({path:`public/assets/${id}.png`,type:'png'});
    const content=await page.locator('body').innerText();
    await writeFile(`qa/v2/${id}-content.txt`,content);
    console.log(JSON.stringify({id,url:page.url(),title:await page.title(),text:content.slice(0,150)}));
    await page.close();
  }
}finally{await browser.close();}
