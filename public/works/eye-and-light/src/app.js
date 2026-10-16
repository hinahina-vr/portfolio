const $=id=>document.getElementById(id);
const stage=$('stage'),status=$('status'),play=$('play'),seek=$('seek'),auto=$('auto'),view=$('view'),experience=$('experience'),menu=$('menu'),video=$('sample');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let r=null,playing=!reduced,time=0,previous=null,dirty=true,mode='room',idleTimer,mediaLoad,modeRevision=0;
const state=window.eyeAndLight={ready:false,fallback:false,get time(){return time;},get playing(){return playing;},get mode(){return mode;},get renderer(){return r;}};
function wake(){document.body.classList.remove('idle');clearTimeout(idleTimer);idleTimer=setTimeout(()=>{if(!menu.open)document.body.classList.add('idle');},4000);}
for(const event of ['pointermove','pointerdown','keydown'])document.addEventListener(event,wake,{passive:true});
$('menu-toggle').onclick=()=>{wake();menu.showModal();$('menu-toggle').setAttribute('aria-expanded','true');};
$('menu-close').onclick=()=>menu.close();menu.addEventListener('close',()=>{$('menu-toggle').setAttribute('aria-expanded','false');wake();});
menu.addEventListener('click',e=>{const b=menu.getBoundingClientRect();if(e.target===menu&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))menu.close();});
function update(){play.textContent=playing?'一時停止':'再生';play.setAttribute('aria-pressed',String(playing));$('time').value=(time%30).toFixed(1)+' / 30秒';seek.value=time%30;seek.setAttribute('aria-valuetext',(time%30).toFixed(1)+'秒');}
async function setPlaying(value){playing=value;previous=null;dirty=true;if(mode==='film'){if(value){try{await video.play();}catch{playing=false;status.textContent='メニューから再生してください';}}else video.pause();}update();}
function ensureMedia(){if(video.readyState>=1)return Promise.resolve();if(!mediaLoad)mediaLoad=new Promise((resolve,reject)=>{video.addEventListener('loadedmetadata',resolve,{once:true});video.addEventListener('error',()=>reject(Error('Video unavailable')),{once:true});video.preload='auto';video.load();});return mediaLoad;}
async function setMode(next){if(next==='room'&&!r)return;const revision=++modeRevision;if(mode==='film'&&video.readyState>=1)time=video.currentTime;mode=next;document.body.dataset.mode=next;$('film').hidden=next!=='film';stage.setAttribute('aria-hidden',String(next==='film'));stage.tabIndex=next==='film'?-1:0;$('film-mode').textContent=next==='film'?'3D空間に戻る':'映像で見る';view.disabled=auto.disabled=next==='film';dirty=true;previous=null;
 if(next==='film'){try{await ensureMedia();if(revision!==modeRevision)return;video.currentTime=time%60;await setPlaying(playing);}catch{playing=false;status.textContent='映像を読み込めませんでした';update();}}else{video.pause();update();}}
play.onclick=()=>setPlaying(!playing);seek.oninput=()=>{time=Number(seek.value);if(mode==='film'&&video.readyState>=1)video.currentTime=time;dirty=true;update();};
view.onchange=()=>{if(r){r.view=view.value;auto.checked=true;dirty=true;}};auto.onchange=()=>dirty=true;
$('reset').onclick=()=>{time=0;if(r)r.view=view.value='room';auto.checked=true;if(mode==='film'&&video.readyState>=1)video.currentTime=0;dirty=true;update();};
$('film-mode').onclick=async()=>{await setMode(mode==='film'?'room':'film');menu.close();};
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!menu.open&&!e.target.closest('button,input,select,a,summary')){e.preventDefault();setPlaying(!playing);}});
$('fullscreen').onclick=async()=>{menu.close();try{if(document.fullscreenElement)await document.exitFullscreen();else await experience.requestFullscreen();}catch{status.textContent='全画面表示はこの環境では使えません';}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'全画面を終了':'全画面にする';dirty=true;});
document.addEventListener('visibilitychange',()=>{previous=null;dirty=true;});
function enable(){for(const e of menu.querySelectorAll('button,input,select'))e.disabled=false;if(!document.fullscreenEnabled)$('fullscreen').hidden=true;document.body.classList.add('ready');state.ready=true;update();wake();}
function frame(now){requestAnimationFrame(frame);if(document.hidden){previous=null;return;}if(mode==='film'){if(video.readyState>=1){time=video.currentTime;update();}return;}if(!r)return;if(previous===null)previous=now;const dt=Math.min(.1,(now-previous)/1000);previous=now;if(playing){time=(time+dt)%60;dirty=true;}if(dirty){r.render(time,{auto:auto.checked});update();dirty=false;}}
try{const {MeditationRenderer}=await import('./renderer.js');r=new MeditationRenderer(stage);window.meditationRenderer=r;await r.prepare();const resize=()=>{const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const scale=Math.min(devicePixelRatio||1,2,1920/w,1080/h);r.resize(Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));dirty=true;};new ResizeObserver(resize).observe(stage);resize();r.render(0);r.controls.addEventListener('start',()=>{auto.checked=false;dirty=true;});r.controls.addEventListener('change',()=>dirty=true);enable();status.textContent='';if(location.hash==='#movie')await setMode('film');}
catch(error){r=null;state.fallback=true;enable();$('fallback').hidden=false;$('film-mode').hidden=true;await setMode('film');status.textContent='';console.warn('3D unavailable; fullscreen film enabled.',error.message);}
requestAnimationFrame(frame);
