import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,realpath} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';

const root=await realpath(resolve(process.argv[2]||'.'));
const port=Number(process.argv[3]||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json','.txt':'text/plain; charset=utf-8','.mp4':'video/mp4'};
createServer(async(req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let file=resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
  if((await stat(file)).isDirectory())file=resolve(file,'index.html');
  file=await realpath(file);
  if(!file.startsWith(root+sep)){res.writeHead(403);return res.end();}
  const info=await stat(file);
  if(!info.isFile()){res.writeHead(404);return res.end();}
  let start=0,end=info.size-1,status=200;
  const headers={'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  // Native video seeking needs byte ranges, including suffix and open ranges.
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   let valid=!!match&&(match[1]!==''||match[2]!=='');
   if(valid){
    if(match[1]==='')start=Math.max(0,info.size-Number(match[2]));
    else{start=Number(match[1]);if(match[2]!=='')end=Math.min(end,Number(match[2]));}
    valid=Number.isSafeInteger(start)&&Number.isSafeInteger(end)&&start>=0&&start<=end&&start<info.size;
   }
   if(!valid){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
  if(req.method==='HEAD'||info.size===0)return res.end();
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){if(!res.headersSent){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}else res.destroy();}
}).listen(port,'127.0.0.1',()=>console.log(`Portfolio: http://127.0.0.1:${port} (${root})`));
