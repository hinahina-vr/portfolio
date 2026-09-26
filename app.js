import {categories} from './content.js';
import {mountBackground} from './src/Background.jsx';
import {transitionPanel} from './src/PanelTransition.js';
import {captureTitle} from './src/MotionType.js';
import {liquidSurface} from './src/LiquidSurface.js';
import {enterSite} from './src/Entrance.js';

const $=selector=>document.querySelector(selector);
const panel=$('#work-panel'),strip=$('#project-strip');
const tabs=[...document.querySelectorAll('[role=tab]')];
const tabRail=$('.category-tabs');
function positionTabSurface(){const active=tabs.find(tab=>tab.getAttribute('aria-selected')==='true');if(active){tabRail.style.setProperty('--tab-x',`${active.offsetLeft}px`);tabRail.style.setProperty('--tab-width',`${active.offsetWidth}px`);}}
new ResizeObserver(positionTabSurface).observe(tabRail);
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>{try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'#works/web';}catch{return '#works/web';}};
let category='web',immersed=false,available=true;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reduced.matches;
try{paused ||= localStorage.getItem('portfolio-motion')==='paused';}catch{}
const slideshowInterval=8000;
let slideshowPaused=reduced.matches,slideshowTimer;
let disposeTransition=()=>{};
let disposeEntrance=()=>{};
function cancelSlideshow(){clearTimeout(slideshowTimer);slideshowTimer=undefined;}
function slideshowHeld(){return document.hidden||!$('#scene-settings').hidden||immersed;}
function syncSlideshow(){
  cancelSlideshow();
  if(!slideshowPaused&&categories[category].projects.length>1&&!slideshowHeld())slideshowTimer=setTimeout(advanceSlideshow,slideshowInterval);
}
function advanceSlideshow(){
  if(slideshowPaused||slideshowHeld())return syncSlideshow();
  const focused=document.activeElement;
  if(getSelection()?.toString()||focused?.matches(':focus-visible')&&(panel.contains(focused)||strip.contains(focused)))return syncSlideshow();
  const projects=categories[category].projects;
  const index=projects.findIndex(project=>project.id===panel.dataset.project);
  const next=projects[(index+1)%projects.length];
  const change=()=>{
    render(category,next.id);
    history.replaceState(null,'',`#works/${category}/${next.id}`);
    const selected=strip.querySelector('[aria-pressed=true]');
    if(selected){const left=selected.offsetLeft-strip.offsetLeft;strip.scrollTo({left:Math.max(0,left-(strip.clientWidth-selected.offsetWidth)/2),behavior:reduced.matches?'instant':'smooth'});}
  };
  change();
}
const art=mountBackground($('#background-root'),state=>{
  if(state.available!==undefined){available=state.available;$('#art-stage').dataset.ready=String(state.ready||false);$('#art-stage').dataset.scene=state.scene||'';$('#art-state').textContent=available?(paused?'Paused':'Playing'):'Still';$('.motion-toggle').hidden=!available;$('#settings-toggle').hidden=!available;}
});
function setScene(id){const scene=art.setScene(id);if(!scene)return;$('#scene-select').value=id;document.documentElement.style.setProperty('--accent',scene.accent);for(const key of ['intensity','motion']){$(`#${key}`).value=scene.values[key];$(`#${key}-value`).textContent=Number(scene.values[key]).toFixed(2);}}
function render(nextCategory='web',id,updateHistory=false){
  disposeEntrance();
  cancelSlideshow();
  disposeTransition();
  const previous=panel.querySelector('.preview-image');
  const previousRect=previous?.getBoundingClientRect();
  const previousTitle=captureTitle(panel.querySelector('.project-title'));
  const previousId=panel.dataset.project;
  if(!Object.hasOwn(categories,nextCategory))nextCategory='web';
  category=nextCategory;
  const data=categories[category];
  const project=data.projects.find(project=>project.id===id)||data.projects[0];
  tabs.forEach(tab=>{const active=tab.dataset.category===category;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  positionTabSurface();
  panel.setAttribute('aria-labelledby',`tab-${category}`);panel.dataset.project=project.id;
  panel.innerHTML=`<article class="work-content">
    <div class="project-info">
      <h2 class="project-title ${project.japanese?'japanese':''}" aria-label="${escapeHtml(project.title)}">${project.lines.map(line=>`<span class="title-line">${escapeHtml(line)}</span>`).join('')}</h2>
      <div class="project-label" lang="en">
        ${project.subtitle?`<p class="project-subtitle" lang="${project.subtitleLang||'en'}">${escapeHtml(project.subtitle)}</p>`:''}
        <p class="project-medium">${escapeHtml(project.medium)}</p>
        <p class="project-description" lang="ja">${escapeHtml(project.description)}</p>
      </div>
      <div class="project-action-row"><a class="open-project" href="${escapeHtml(safeUrl(project.url))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(project.title)}を開く（新しいタブ）">${escapeHtml(project.actionLabel||(category==='web'?'Visit website':'Open showcase'))}</a></div>
      ${project.note?`<p class="project-note">${escapeHtml(project.note)}</p>`:''}
    </div>
    <figure class="project-preview">
      <a class="preview-link" href="${escapeHtml(safeUrl(project.url))}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(project.title)}のプレビューからサイトを開く（新しいタブ）"><span class="preview-surface"><img class="preview-image" src="${escapeHtml(project.image)}" alt="${escapeHtml(project.imageAlt||`${project.title}の実際の画面`)}" width="3840" height="2160" fetchpriority="high"></span></a>
    </figure>
  </article>`;
  liquidSurface().setSurface(panel.querySelector('.preview-surface'));
  disposeTransition=transitionPanel(panel.querySelector('.preview-surface'),previousId!==project.id?previous:null,reduced,previousRect,previousTitle);
  strip.dataset.count=String(data.projects.length);
  strip.innerHTML=data.projects.map(item=>`<button class="project-card" data-project="${item.id}" aria-pressed="${item.id===project.id}" aria-label="${escapeHtml(item.title)}を選択"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt||`${item.title}の実際の画面`)}" width="3840" height="2160"><span class="card-meta"><span class="card-title">${escapeHtml(item.title)}</span></span></button>`).join('');
  setScene(project.scene);
  if(updateHistory)history.pushState(null,'',`#works/${category}/${project.id}`);
  document.title=`${project.title} — hinahina`;
  syncSlideshow();
}
strip.addEventListener('click',event=>{const button=event.target.closest('[data-project]');if(!button)return;const id=button.dataset.project;const scroll=strip.scrollLeft;render(category,id,true);strip.scrollLeft=scroll;strip.querySelector(`[data-project="${id}"]`).focus({preventScroll:true});});
function syncHash(){const [,cat,id]=location.hash.match(/^#works\/([^/]+)(?:\/([^/]+))?$/)||[];render(cat||'web',id);}
window.addEventListener('hashchange',syncHash);
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>render(tab.dataset.category,undefined,true));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();tabs[next].focus();render(tabs[next].dataset.category,undefined,true);}});});
function updateMotion(){art.setPaused(paused);liquidSurface().setPaused(paused);$('.motion-toggle').setAttribute('aria-pressed',String(paused));$('.motion-toggle').setAttribute('aria-label',paused?'アニメーションを再生':'アニメーションを一時停止');$('.motion-toggle').innerHTML=paused?'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 8 5-8 5Z" fill="currentColor"/></svg>':'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="1.5"/></svg>';$('#art-state').textContent=available?(paused?'Paused':'Playing'):'Still';}
$('.motion-toggle').addEventListener('click',()=>{paused=!paused;try{localStorage.setItem('portfolio-motion',paused?'paused':'playing');}catch{}updateMotion();});reduced.addEventListener('change',event=>{paused=event.matches;updateMotion();});
function immerse(value){immersed=value;document.body.classList.toggle('immersed',value);$('#interface').inert=value;$('.restore-ui').hidden=!value;$('.immerse-toggle').setAttribute('aria-pressed',String(value));if(value){$('#scene-settings').hidden=true;$('#settings-toggle').setAttribute('aria-expanded','false');$('.restore-ui').focus({preventScroll:true});}else $('.immerse-toggle').focus({preventScroll:true});syncSlideshow();}
$('.immerse-toggle').addEventListener('click',()=>immerse(true));$('.restore-ui').addEventListener('click',()=>immerse(false));
function settings(open){$('#scene-settings').hidden=!open;$('#settings-toggle').setAttribute('aria-expanded',String(open));syncSlideshow();}
$('#settings-toggle').addEventListener('click',()=>settings($('#scene-settings').hidden));$('#settings-close').addEventListener('click',()=>{settings(false);$('#settings-toggle').focus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(immersed)immerse(false);if(!$('#scene-settings').hidden){settings(false);$('#settings-toggle').focus();}}});
$('#scene-select').addEventListener('change',event=>setScene(event.target.value));for(const key of ['intensity','motion']){$(`#${key}`).addEventListener('input',event=>{const value=Number(event.target.value);$(`#${key}-value`).textContent=value.toFixed(2);art.setValue(key,value);});}
const reflectPaused=()=>document.body.classList.toggle('art-paused',$('.motion-toggle').getAttribute('aria-pressed')==='true');
document.addEventListener('visibilitychange',syncSlideshow);
reduced.addEventListener('change',event=>{slideshowPaused=event.matches;syncSlideshow();});
new MutationObserver(reflectPaused).observe($('.motion-toggle'),{attributes:true,attributeFilter:['aria-pressed']});
syncHash();updateMotion();reflectPaused();
disposeEntrance=enterSite(reduced);
