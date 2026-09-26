import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{const p=await b.newPage({viewport:{width:3840,height:2160}});await p.setContent('<style>body{margin:0}</style>'+await readFile('public/assets/hinahina-x.svg','utf8'));await p.screenshot({path:'public/assets/hinahina-x.png'});}finally{await b.close();}
