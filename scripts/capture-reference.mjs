import { chromium } from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2});
 await page.goto('https://glsl-effects-showcase.pages.dev/',{waitUntil:'networkidle',timeout:60000});
 await page.waitForTimeout(5000);
 await page.screenshot({path:'public/assets/glsl-showcase.png'});
 const capture=async name=>{
  await page.getByTestId('fullscreen-toggle').click();
  const style=await page.addStyleTag({content:'.preview-header,.frame-readout,.pipeline-status{visibility:hidden!important}'});
  await page.waitForTimeout(3000);
  await page.screenshot({path:`public/assets/${name}.png`});
  await style.evaluate(el=>el.remove());
  await page.getByTestId('fullscreen-toggle').click();
 };
 await capture('lilian-loom');
 await page.getByRole('button',{name:/Aquatic/}).click();
 await page.getByTestId('effect-kelp-current').click();
 await page.waitForTimeout(2500);
 await capture('botanical-tide');
 console.log('Captured showcase and two fullscreen studies at 3840 x 2160');
}finally{await browser.close();}
