import {wringPoint} from './WringShape.js';
// Screen-space gravity routing over the same folded sheet as PanelTransition.
// Reuse the sampling grid; only the 16 returned outlets belong to each call.
const nx=49,ny=25;
const points=Array.from({length:nx*ny},(_,i)=>({u:(i%nx)/(nx-1),v:Math.floor(i/nx)/(ny-1),x:0,y:0,z:0,flux:1}));
const order=Array.from({length:points.length},(_,i)=>i);
const byHeight=(a,b)=>points[a].y-points[b].y;
export function sheetDrainage(rect,gather,curl,gripLag=0){
 for(let i=0;i<points.length;i++){
  const p=points[i];
  wringPoint(p.u*2-1,p.v*2-1,gather,curl,gripLag,p);
  const perspective=1/(1+p.z*.22);
  p.x=rect.x+rect.width*(.5+p.x*perspective*.5);
  p.y=rect.y+rect.height*(.5-p.y*perspective*.5);p.flux=1;
  // Restore index order so equal-height samples keep the same stable tie-break.
  order[i]=i;
 }
 order.sort(byHeight);
 const bins=Array.from({length:16},()=>({x:0,y:-1000,u:0,v:0,flux:0}));
 for(const index of order){
  const p=points[index],ix=index%nx,iy=Math.floor(index/nx);let next=-1,slope=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if((!dx&&!dy)||ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue;
   const k=index+dy*nx+dx,q=points[k];
   if(q.y<=p.y+.001)continue;
   const descent=(q.y-p.y)/Math.max(.1,Math.hypot(q.x-p.x,q.y-p.y));
   if(descent>slope){slope=descent;next=k;}
  }
  if(next>=0)points[next].flux+=p.flux;
  else{
   // Keep the true lowest outlet, including interior folds of the twisted sheet.
   const b=bins[Math.min(15,Math.floor(p.u*16))];b.flux+=p.flux;
   if(p.y>b.y){b.x=p.x;b.y=p.y;b.u=p.u;b.v=p.v;}
  }
 }
 const max=Math.max(...bins.map(b=>b.flux),1);
 return bins.map(b=>({...b,weight:b.flux/max}));
}
