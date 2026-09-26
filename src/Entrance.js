import {wetEntrance} from './WetEntrance.js';
import {typeEase} from './MotionType.js';
// The first composition appears over the already-running world. Navigation
// stays in place; overlapping reveals never block a visitor's first action.
export function enterSite(reduced) {
  if(reduced.matches)return()=>{};
  const animations=[];
  let finished=false;
  let wet,uiFrame;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('aria-hidden','true');svg.style.cssText='position:absolute;width:0;height:0;pointer-events:none';
  svg.innerHTML='<filter id="ui-emergence" x="-35%" y="-100%" width="170%" height="300%"><feTurbulence type="fractalNoise" baseFrequency=".009 .035" numOctaves="2" seed="8" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="55" xChannelSelector="R" yChannelSelector="G"/></filter>';
  document.body.append(svg);
  const displacement=svg.querySelector('feDisplacementMap'),uiStart=performance.now();
  const distort=now=>{const t=Math.min(1,Math.max(0,(now-uiStart-1600)/1900));displacement.setAttribute('scale',String(55*Math.pow(1-t,3)));if(t<1)uiFrame=requestAnimationFrame(distort);};
  uiFrame=requestAnimationFrame(distort);
  let startWet;
  const surface=document.querySelector('.preview-surface');
  if(surface)surface.style.visibility='hidden';
  const wetFinished=new Promise(resolve=>{startWet=setTimeout(()=>{wet=wetEntrance(surface);wet.finished.then(resolve);},650);});
  const clean=()=>{
    if(finished)return;
    finished=true;
    clearTimeout(startWet);wet?.clean();if(surface)surface.style.visibility='';
    animations.forEach(animation=>animation.cancel());
    cancelAnimationFrame(uiFrame);svg.remove();
    delete document.body.dataset.entrance;
    document.removeEventListener('pointerdown',clean,true);
    document.removeEventListener('keydown',clean,true);
    reduced.removeEventListener('change',clean);
  };
  const reveal=(selector,frames,duration,delay=0)=>{
    document.querySelectorAll(selector).forEach(element=>animations.push(element.animate(frames,{duration,delay,easing:'cubic-bezier(.16,.8,.24,1)',fill:'both'})));
  };
  document.body.dataset.entrance='playing';
  reveal('.site-header,.collection',[{opacity:0},{opacity:1}],300,1400);
  reveal('.brand',[{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'blur(0)'}],1300,1700);
  for(const [selector,delay] of [['.category-tabs',1650],['.profile-links',1750],['.project-strip',1850],['.canvas-controls',2000]]){
   reveal(selector,[
    {opacity:0,transform:'perspective(700px) translateY(48px) rotateX(55deg) scale(.92,1.7)',filter:'url(#ui-emergence) blur(9px)',borderRadius:'60% 40% 45% 55% / 80% 70% 30% 20%'},
    {offset:.55,opacity:1,transform:'perspective(700px) translateY(-3px) rotateX(-6deg) scale(1.02,.92)',filter:'url(#ui-emergence) blur(.5px)'},
    {opacity:1,transform:'none',filter:'url(#ui-emergence) blur(0px)'}
   ],1700,delay);
  }
  for(const line of document.querySelectorAll('.title-line')){
    const distance=innerWidth-line.getBoundingClientRect().left+32;
    animations.push(line.animate([{transform:`translateX(${distance}px)`},{transform:'translateX(0)'}],{duration:760,delay:1700,easing:typeEase,fill:'both'}));
  }
  reveal('.project-label,.project-action-row,.project-note',[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],1100,2050);
  document.addEventListener('pointerdown',clean,true);
  document.addEventListener('keydown',clean,true);
  reduced.addEventListener('change',clean);
  Promise.all([...animations.map(animation=>animation.finished),wetFinished]).then(clean).catch(()=>{});
  return clean;
}
