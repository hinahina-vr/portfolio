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
    const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForTimeout(3500);
    if(id==='gaia-senseware'){
      await page.getByText('サウンドなし',{exact:true}).click();
      await page.waitForTimeout(1200);
    }
    if(id==='quiz-pal'){
      // Close control verified in the captured 1440 x 900 introductory screen.
      await page.mouse.click(1372,60);
      await page.waitForTimeout(700);
      const skip=page.getByText('スキップ',{exact:true});
      if(await skip.count())await skip.click();
      await page.waitForTimeout(350);
    }
    await page.screenshot({path:`public/assets/${id}.jpg`,type:'jpeg',quality:88});
    const content=await page.locator('body').innerText();
    await writeFile(`qa/v2/${id}-content.txt`,content);
    console.log(JSON.stringify({id,url:page.url(),title:await page.title(),text:content.slice(0,5000)}));
    await page.close();
  }
}finally{await browser.close();}
