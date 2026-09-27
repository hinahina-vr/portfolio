// Keep the entire caption's typography and layout while the next panel mounts.
export function fadeCaption(panel,signal){
  const original=panel.querySelector('.project-info');
  if(!original)return;
  const rect=original.getBoundingClientRect();
  const shell=panel.cloneNode(false),caption=original.cloneNode(true);
  shell.removeAttribute('id');shell.removeAttribute('role');shell.removeAttribute('aria-labelledby');
  shell.setAttribute('aria-hidden','true');shell.inert=true;shell.dataset.transitionText='outgoing';
  Object.assign(shell.style,{position:'fixed',inset:'0',zIndex:'14',pointerEvents:'none'});
  Object.assign(caption.style,{position:'absolute',left:`${rect.x}px`,top:`${rect.y}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:'0'});
  shell.append(caption);document.body.append(shell);
  original.style.opacity='0';
  const animation=shell.animate([{opacity:1},{opacity:0}],{duration:1400,easing:'ease-in-out',fill:'forwards'});
  const remove=()=>{animation.cancel();shell.remove();};
  const restore=()=>{remove();original.style.removeProperty('opacity');signal.removeEventListener('abort',restore);window.removeEventListener('resize',restore);};
  signal.addEventListener('abort',restore,{once:true});
  window.addEventListener('resize',restore,{once:true});
  animation.finished.then(remove).catch(()=>{});
}
