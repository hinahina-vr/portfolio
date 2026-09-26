import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';

const output='research/portfolio-wording';
await mkdir(output,{recursive:true});
const references=[
  ['yusuke-fukunaga','https://yusukefukunaga.com/'],
  ['yuki-okada','https://ykokd.com/'],
  ['shogo-tominaga','https://shogotominaga.com/'],
  ['not-here','https://www.not-here.jp/'],
  ['yoru','https://yoru.design/'],
  ['toshiyuki-hashimoto','https://toshiyukihashimoto.jp/']
];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
  const results=[];
  for(let i=0;i<references.length;i+=2){
    const batch=await Promise.allSettled(references.slice(i,i+2).map(async([name,url])=>{
      const page=await browser.newPage({viewport:{width:1440,height:900}});
      try{
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
        await page.waitForTimeout(1800);
        const content=await page.evaluate(()=>({title:document.title,url:location.href,text:document.body.innerText,headings:[...document.querySelectorAll('h1,h2,h3')].map(el=>el.innerText).filter(Boolean),actions:[...document.querySelectorAll('a,button')].filter(el=>el.getBoundingClientRect().width>0).map(el=>({text:el.innerText.trim(),href:el.getAttribute('href')})).filter(el=>el.text)}));
        await page.screenshot({path:`${output}/${name}.png`});
        await writeFile(`${output}/${name}.json`,JSON.stringify({capturedAt:new Date().toISOString(),...content},null,2));
        console.log(JSON.stringify({name,title:content.title,text:content.text.slice(0,850),actions:content.actions.slice(0,12)}));
        return{name,url,status:'captured'};
      }catch(error){console.log(`${name}: ${error.message}`);return{name,url,status:'failed',error:error.message};}
      finally{await page.close();}
    }));
    for(const result of batch)results.push(result.status==='fulfilled'?result.value:{status:'failed',error:String(result.reason)});
  }
  await writeFile(`${output}/sources.json`,JSON.stringify({gallery:'https://sankoudesign.com/category/portfoliosite/',capturedAt:new Date().toISOString(),results},null,2));
}finally{await browser.close();}
