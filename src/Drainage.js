import {wringPoint} from './WringShape.js';
// Screen-space gravity routing over the same folded sheet as PanelTransition.
// Water follows the steepest descending neighbour; outlet flux determines feed.
export function sheetDrainage(rect,gather,curl,gripLag=0){
 const nx=49,ny=25,points=[];
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
  const u=i/(nx-1),v=j/(ny-1);
  const {x,y,z}=wringPoint(u*2-1,v*2-1,gather,curl,gripLag);
  const perspective=1/(1+z*.22);
  points.push({x:rect.x+rect.width*(.5+x*perspective*.5),y:rect.y+rect.height*(.5-y*perspective*.5),u,v,flux:1});
 }
 const order=points.map((_,i)=>i).sort((a,b)=>points[a].y-points[b].y);
 const outlets=[];
 for(const index of order){
  const p=points[index],ix=index%nx,iy=Math.floor(index/nx);let next=-1,slope=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   if((!dx&&!dy)||ix+dx<0||ix+dx>=nx||iy+dy<0||iy+dy>=ny)continue;
   const k=index+dy*nx+dx,q=points[k];
   const descent=(q.y-p.y)/Math.max(.1,Math.hypot(q.x-p.x,q.y-p.y));
   if(q.y>p.y+.001&&descent>slope){slope=descent;next=k;}
  }
  if(next>=0)points[next].flux+=p.flux;else outlets.push(p);
 }
 // Aggregate catchment flux into 16 emission regions, retaining the actual
 // lowest outlet rather than inventing a rectangular lower edge.
 const bins=Array.from({length:16},()=>({x:0,y:-1000,u:0,v:0,flux:0}));
 for(const p of outlets){const b=bins[Math.min(15,Math.floor(p.u*16))];b.flux+=p.flux;if(p.y>b.y){b.x=p.x;b.y=p.y;b.u=p.u;b.v=p.v;}}
 const max=Math.max(...bins.map(b=>b.flux),1);
 return bins.map(b=>({...b,weight:b.flux/max}));
}
