export function captureTitle(title) {
  if (!title) return null;
  const style=getComputedStyle(title),glyphs=[];
  const lines=[...title.querySelectorAll('.title-line')];
  lines.forEach((line,lineIndex)=>{
    const text=line.firstChild;
    if (!text || text.nodeType!==Node.TEXT_NODE) return;
    let offset=0;
    for (const character of [...text.textContent]) {
      const range=document.createRange();range.setStart(text,offset);offset+=character.length;range.setEnd(text,offset);
      const rect=range.getBoundingClientRect();
      glyphs.push({character,x:rect.x,y:rect.y,width:rect.width,height:rect.height,line:lineIndex});
    }
  });
  return {glyphs,lines:lines.length,font:style.font,fontSize:parseFloat(style.fontSize),color:style.color};
}

// DOM lettering stays sharp at display scale and remains separate from the
// accessible heading. Each letter follows a delayed, elastic wave, then docks.
export function motionType(previous,title,duration=1800) {
  const next=captureTitle(title);
  if (!next) return ()=>{};
  const layer=document.createElement('div');layer.className='motion-type';layer.setAttribute('aria-hidden','true');
  document.body.append(layer);
  const animations=[];
  const add=(snapshot,incoming)=>{
    if (!snapshot) return;
    snapshot.glyphs.forEach((glyph,index)=>{
      if (!glyph.character.trim()) return;
      const line=snapshot.glyphs.filter(item=>item.line===glyph.line);
      const left=Math.min(...line.map(item=>item.x)),right=Math.max(...line.map(item=>item.x+item.width));
      const scale=Math.min(3.8,innerWidth*.88/(right-left),innerHeight*.42/(snapshot.fontSize*snapshot.lines));
      const displayX=(innerWidth-(right-left)*scale)/2+(glyph.x-left)*scale;
      const displayY=innerHeight*.40+(glyph.line-(snapshot.lines-1)/2)*snapshot.fontSize*scale*1.13;
      const span=document.createElement('span');span.textContent=glyph.character;
      span.style.font=snapshot.font;span.style.color=snapshot.color;
      layer.append(span);
      const rest=`translate3d(${glyph.x}px,${glyph.y}px,0)`;
      const wave=`translate3d(${displayX}px,${displayY+Math.sin(index*.65)*32}px,0) scale(${scale}) skewY(${Math.sin(index*.65)*9}deg)`;
      const display=`translate3d(${displayX}px,${displayY}px,0) scale(${scale})`;
      const delay=index*18;
      const frames=incoming?[
        {opacity:0,transform:`translate3d(${displayX+innerWidth*.55}px,${displayY+120}px,0) scale(${scale*.6},${scale*1.4}) rotateY(-80deg)`,offset:0},
        {opacity:1,transform:wave,offset:.32},
        {opacity:1,transform:display,offset:.52},
        {opacity:1,transform:`translate3d(${glyph.x-5}px,${glyph.y+3}px,0) scale(1.025,.98)`,offset:.91},
        {opacity:1,transform:rest,offset:1}
      ]:[
        {opacity:1,transform:rest,offset:0},
        {opacity:1,transform:wave,offset:.45},
        {opacity:0,transform:`translate3d(${displayX-innerWidth*.8}px,${displayY-140}px,0) scale(${scale*.8},${scale*1.15}) rotateY(70deg)`,offset:1}
      ];
      animations.push(span.animate(frames,{duration:incoming?duration-300-delay:650,delay:incoming?300+delay:delay,easing:'cubic-bezier(.2,.72,.2,1)',fill:'both'}));
    });
  };
  add(previous,false);add(next,true);
  title.style.visibility='hidden';
  return ()=>{animations.forEach(animation=>animation.cancel());layer.remove();title.style.visibility='';};
}
