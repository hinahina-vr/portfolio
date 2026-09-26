import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();
 for(const viewport of [{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(viewport);
  await page.goto('http://127.0.0.1:4173/#works/web',{waitUntil:'networkidle'});
  await expect(page.locator('#art-stage')).toHaveAttribute('data-ready','true');
  await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
  await page.screenshot({path:`qa/v2.3.2/viewport-${viewport.width}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('.project-card[data-project="quiz-pal"]').click();
 await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
 expect(await page.locator('.project-card[data-project="quiz-pal"] img').evaluate(img=>img.complete&&img.naturalWidth>500)).toBe(true);
 await page.screenshot({path:'qa/v2.3.2/project-quiz-pal.png'});
 await page.locator('.project-card[data-project="glsl-showcase"]').click();
 await page.mouse.move(1100,240);await page.mouse.down();await page.mouse.move(780,450,{steps:20});await page.mouse.move(1100,480,{steps:20});await page.mouse.up();
 await page.locator('.work-content').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
 await page.screenshot({path:'qa/v2.3.2/desktop-reactive.png'});
 console.log('Balanced portfolio composition captured at desktop, tablet, and phone widths.');
}finally{await browser.close();}
