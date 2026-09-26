export function captureTitle(title) {
  if(!title)return null;
  const style=getComputedStyle(title);
  return {font:style.font,color:style.color,lines:[...title.querySelectorAll('.title-line')].map(line=>{const rect=line.getBoundingClientRect();return{text:line.textContent,x:rect.x,y:rect.y};})};
}

export const typeEase='cubic-bezier(.08,1,.12,1)';
// Whole title lines enter from beyond the viewport, fast at first and then
// decelerating sharply. The image shader has its own effect and timeline.
export function motionType(previous,title) {
  const next=captureTitle(title);if(!next)return()=>{};
  const layer=document.createElement('div');layer.className='motion-type';layer.setAttribute('aria-hidden','true');document.body.append(layer);
  const animations=[];let stopped=false;
  const clean=()=>{if(stopped)return;stopped=true;animations.forEach(a=>a.cancel());layer.remove();title.style.visibility='';};
  for(const [snapshot,incoming] of [[previous,false],[next,true]]){
    if(!snapshot)continue;
    for(const line of snapshot.lines){
      const span=document.createElement('span');span.textContent=line.text;span.dataset.motionLayer=incoming?'incoming':'outgoing';span.style.font=snapshot.font;span.style.color=snapshot.color;layer.append(span);
      const rest=`translate3d(${line.x}px,${line.y}px,0)`;
      const frames=incoming?[{opacity:1,transform:`translate3d(${innerWidth+32}px,${line.y}px,0)`},{opacity:1,transform:rest}]:[{opacity:1,transform:rest},{opacity:0,transform:`translate3d(${line.x-28}px,${line.y}px,0)`}];
      animations.push(span.animate(frames,{duration:incoming?760:240,easing:incoming?typeEase:'ease-out',fill:'both'}));
    }
  }
  title.style.visibility='hidden';
  Promise.all(animations.map(a=>a.finished)).then(clean).catch(()=>{});
  return clean;
}
