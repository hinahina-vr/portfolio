const root=document.getElementById('preloader'),bar=document.getElementById('loading-progress'),fill=document.getElementById('loading-fill'),label=document.getElementById('loading-label'),percent=document.getElementById('loading-percent');
let value=0,finished=false;
// Progress follows completed preparation work, never a timer or estimated download speed.
function update(next,text,complete=false){if(finished)return;value=Math.max(value,Math.min(complete?100:98,Math.round(next)));bar.setAttribute('aria-valuenow',String(value));fill.style.transform=`scaleX(${value/100})`;percent.textContent=value+'%';if(text&&label.textContent!==text)label.textContent=text;}
function finish(){update(100,'準備ができました',true);finished=true;root.setAttribute('aria-busy','false');return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{root.classList.add('is-complete');let timer,settled=false;const hide=()=>{if(settled)return;settled=true;clearTimeout(timer);root.removeEventListener('transitionend',ended);root.hidden=true;resolve();},ended=e=>{if(e.target===root&&e.propertyName==='opacity')hide();};if(matchMedia('(prefers-reduced-motion: reduce)').matches)hide();else{root.addEventListener('transitionend',ended);timer=setTimeout(hide,850);}})));}
function fail(){root.setAttribute('aria-busy','false');label.textContent='読み込めませんでした。もう一度お試しください。';document.getElementById('loading-retry').hidden=false;}
document.getElementById('loading-retry').onclick=()=>location.reload();
export const preloader={update,finish,fail};
