import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {categories} from '../content.js';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
try{
 const p=await browser.newPage();await mkdir('public/assets/thumbs',{recursive:true});
 for(const project of Object.values(categories).flatMap(x=>x.projects).filter(p=>!process.argv[2]||p.id===process.argv[2])){
  const file='public/'+project.image.replace(/^\.\//,''),original=await readFile(file);
  const bytes=await p.evaluate(async base64=>{
   const raw=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
   const image=await createImageBitmap(new Blob([raw]),{resizeWidth:320,resizeHeight:180,resizeQuality:'high'});
   const canvas=new OffscreenCanvas(320,180);canvas.getContext('2d').drawImage(image,0,0);image.close();
   const blob=await canvas.convertToBlob({type:'image/webp',quality:.9});return [...new Uint8Array(await blob.arrayBuffer())];
  },original.toString('base64'));
  const target='public/'+project.thumbnail.replace(/^\.\//,'');await writeFile(target,Buffer.from(bytes));console.log(target,bytes.length);
 }
}finally{await browser.close();}
