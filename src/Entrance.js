import {wetEntrance} from './WetEntrance.js';
// The first composition appears over the already-running world. Navigation
// stays in place; overlapping reveals never block a visitor's first action.
export function enterSite(reduced,preparation=Promise.resolve(),onFinished=()=>{}) {
  if(reduced.matches)return()=>{};
  const animations=[];
  let finished=false;
  let wet,startWet,backgroundTimer;
  const surface=document.querySelector('.preview-surface');
  if(surface)surface.style.visibility='hidden';
  let finishWet;
  const wetFinished=new Promise(resolve=>{finishWet=resolve;});
  const stage=document.querySelector('#art-stage');
  let stopWaiting=()=>{};
  const backgroundReady=new Promise(resolve=>{
    const done=()=>{observer.disconnect();clearTimeout(backgroundTimer);resolve();};
    const check=()=>{if(stage.dataset.ready==='true'||stage.classList.contains('no-webgl'))done();};
    const observer=new MutationObserver(check);observer.observe(stage,{attributes:true});
    stopWaiting=done;backgroundTimer=setTimeout(done,8000);check();
  });
  const clean=()=>{
    if(finished)return;
    finished=true;
    clearTimeout(startWet);wet?.clean();if(surface)surface.style.visibility='';
    animations.forEach(animation=>animation.cancel());
    stopWaiting();finishWet();
    delete document.body.dataset.entrance;
    document.removeEventListener('pointerdown',clean,true);
    document.removeEventListener('keydown',clean,true);
    reduced.removeEventListener('change',clean);onFinished();
  };
  const reveal=(selector,frames,duration,delay=0)=>{
    document.querySelectorAll(selector).forEach(element=>{const animation=element.animate(frames,{duration,delay,easing:'cubic-bezier(.16,.8,.24,1)',fill:'both'});animation.pause();animations.push(animation);});
  };
  document.body.dataset.entrance='playing';
  reveal('#background-root',[{opacity:0},{opacity:1}],650);
  reveal('.site-header,.collection',[{opacity:0},{opacity:1}],300,1400);
  reveal('.brand',[{opacity:0},{opacity:1}],1300,1700);
  for(const [selector,delay] of [['.category-tabs',1650],['.profile-links',1750],['.project-strip',1850],['.canvas-controls',2000]]){
   reveal(selector,[
    {opacity:0,transform:'perspective(700px) translateY(48px) rotateX(55deg) scale(.92,1.7)'},
    {offset:.55,opacity:1,transform:'perspective(700px) translateY(-3px) rotateX(-6deg) scale(1.02,.92)'},
    {opacity:1,transform:'none'}
   ],1700,delay);
  }
  reveal('.project-title,.project-label,.project-action-row,.project-note',[{opacity:0},{opacity:1}],1600,2050);
  document.addEventListener('pointerdown',clean,true);
  document.addEventListener('keydown',clean,true);
  reduced.addEventListener('change',clean);
  // Prepare decoding, GPU uploads and first background draw while reveals are held.
  const decoded=[...document.querySelectorAll('.preview-image,.project-card img')].map(image=>image.decode().catch(()=>{}));
  Promise.all([preparation,backgroundReady,document.fonts.ready,...decoded]).catch(()=>{}).then(()=>{
    if(finished)return;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(finished)return;
      animations.forEach(animation=>animation.play());
      startWet=setTimeout(()=>{if(finished)return;wet=wetEntrance(surface);wet.finished.then(finishWet);},650);
    }));
  });
  Promise.all([...animations.map(animation=>animation.finished),wetFinished]).then(clean).catch(()=>{});
  return clean;
}
