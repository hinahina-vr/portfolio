// Reuse one live renderer: fade out, replace its scene, then fade in before wringing.
export async function fadeBackground(element,stage,scene,change,signal){
 const animate=async(from,to,duration)=>{
  const animation=element.animate([{opacity:from},{opacity:to}],{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
  const cancel=()=>animation.cancel();signal.addEventListener('abort',cancel,{once:true});
  try{await animation.finished;if(!signal.aborted)element.style.opacity=String(to);}
  catch{}finally{signal.removeEventListener('abort',cancel);animation.cancel();}
  return !signal.aborted;
 };
 stage.dataset.transitionPhase='fade-out';
 if(!await animate(Number(getComputedStyle(element).opacity),0,280))return false;
 const replacing=stage.dataset.scene!==scene;
 if(replacing)stage.dataset.ready='false';
 change();
 if(replacing&&!stage.classList.contains('no-webgl')){
  await new Promise(resolve=>{
   let timer;const finish=()=>{observer.disconnect();clearTimeout(timer);signal.removeEventListener('abort',finish);resolve();};
   const check=()=>{if(signal.aborted||stage.classList.contains('no-webgl')||stage.dataset.ready==='true'&&stage.dataset.scene===scene)finish();};
   const observer=new MutationObserver(check);observer.observe(stage,{attributes:true});
   timer=setTimeout(finish,6000);signal.addEventListener('abort',finish,{once:true});check();
  });
 }
 if(signal.aborted)return false;
 stage.dataset.transitionPhase='fade-in';
 if(!await animate(0,1,420))return false;
 stage.dataset.transitionPhase='ready';element.style.removeProperty('opacity');return true;
}
