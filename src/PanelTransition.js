import {wringShapeGLSL,gripOffset} from './WringShape.js';
import {sheetDrainage} from './Drainage.js';
import {liquidSurface} from './LiquidSurface.js';
const motionDuration=3200;
import * as THREE from 'three';
import {wetGlassGLSL} from './WetGlass.js';
import {photoTextures} from './PhotoTextures.js';

// One image surface; persistent fluid runoff is coordinated by LiquidSurface.
let renderer,photos,stage,ready;
const vertexShader = `
  uniform float curl;
  uniform float gripLag;
  uniform float gather;


  uniform vec2 size;
  uniform vec2 center;

  varying vec2 imageUv;
  varying vec3 surfacePosition;
  ${wringShapeGLSL}
  void main() {
    imageUv = uv;
    vec3 shape=wringPoint(position.xy,gather,curl,gripLag);
    float x=shape.x,y=shape.y,z=shape.z;
    surfacePosition=shape;
    float perspective=1./(1.+z*.22);
    vec2 p=vec2(x,y)*perspective*size+center;
    gl_Position=vec4(p,-z*.15,1.);
  }
`;
const fragmentShader = `
  uniform sampler2D picture;
  uniform vec2 crop;
  uniform sampler2D nextPicture;
  uniform vec2 nextCrop;
  uniform float blend;
  uniform float bleach;
  uniform float time;
  uniform float gather;

  varying vec2 imageUv;
  varying vec3 surfacePosition;
  ${wetGlassGLSL}
  void main() {
    vec3 wet=wetGlass(imageUv,time);
    vec2 wetUv=imageUv+wet.xy*.014;
    vec2 uv = (wetUv - .5) * crop + .5;
    vec2 nextUv = (wetUv - .5) * nextCrop + .5;
    vec3 drained=mix(texture2D(picture,uv).rgb,vec3(1.),bleach);
    vec3 color=mix(drained,texture2D(nextPicture,nextUv).rgb,blend);
    vec3 normal=normalize(cross(dFdx(surfacePosition),dFdy(surfacePosition)));
    if(!gl_FrontFacing)normal=-normal;
    float lambert=abs(dot(normal,normalize(vec3(-.25,.65,1.))));
    float shade=.56+.44*lambert;
    color*=mix(1.,shade,gather);
    color+=vec3(.14,.18,.20)*wet.z*(1.-bleach);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
function prepareStage(){
 if(ready)return ready;
 renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
 renderer.setClearColor(0x030708,0);renderer.domElement.className='panel-canvas';renderer.domElement.setAttribute('aria-hidden','true');
 photos=photoTextures(renderer);
 const scene=new THREE.Scene(),camera=new THREE.Camera();
 const material=new THREE.ShaderMaterial({vertexShader,fragmentShader,side:THREE.DoubleSide,depthTest:true,depthWrite:true,
  uniforms:{picture:{value:null},nextPicture:{value:null},crop:{value:new THREE.Vector2(1,1)},nextCrop:{value:new THREE.Vector2(1,1)},blend:{value:0},bleach:{value:0},time:{value:0},gather:{value:0},curl:{value:0},gripLag:{value:0},size:{value:new THREE.Vector2()},center:{value:new THREE.Vector2()}}});
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2,160,80),material);scene.add(mesh);stage={scene,camera,mesh};
 ready=renderer.compileAsync(scene,camera).then(()=>stage);
 return ready;
}
export async function preparePanel(previous,next){
 await prepareStage();photos.keep([previous,next]);
 await photos.prepare(previous);await photos.prepare(next);
}
window.addEventListener('pagehide',event=>{if(event.persisted)return;photos?.dispose();stage?.mesh.geometry.dispose();stage?.mesh.material.dispose();renderer?.dispose();},{once:true});
export function transitionPanel(surface, previous, reduced, previousRect) {
  if (!previous || reduced.matches) return () => {};
  const incoming = surface.querySelector('img');
  const outgoing = previous.cloneNode();
  outgoing.alt = '';
  outgoing.setAttribute('aria-hidden', 'true');
  outgoing.className = 'panel-outgoing';
  // Keep the old pixels at their original viewport position until the GPU has
  // presented the first flat frame. New text can change the incoming layout.
  if(previousRect)Object.assign(outgoing.style,{position:'fixed',left:`${previousRect.x}px`,top:`${previousRect.y}px`,width:`${previousRect.width}px`,height:`${previousRect.height}px`,opacity:'.9',zIndex:'15'});
  document.body.append(outgoing);
  let frame, stopped = false, animations = [];
  const captions=[...document.querySelectorAll('#work-panel .project-title,#work-panel .project-label,#work-panel .project-action-row,#work-panel .project-note')];
  captions.forEach(element=>element.style.opacity='0');


  let pictureFinished=false;
  const finishPicture=()=>{
    if(pictureFinished)return;
    pictureFinished=true;
    incoming.style.visibility='';surface.style.visibility='';
    outgoing.remove();liquidSurface().setWring(null);renderer?.domElement.remove();
    delete surface.dataset.transition;
  };
  const clean = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    finishPicture();
    animations.forEach(animation=>animation.cancel());
    captions.forEach(element=>element.style.removeProperty('opacity'));
    reduced.removeEventListener('change', clean);
    window.removeEventListener('resize', clean);
  };
  reduced.addEventListener('change', clean);
  window.addEventListener('resize', clean);
  surface.dataset.transition = 'loading';
  Promise.all([incoming.decode(), previous.decode(),preparePanel(previous,incoming)]).then(async () => {
    if (stopped || !surface.isConnected) return clean();
    try {
      const {scene,camera,mesh}=stage;
      const material=mesh.material,sheet=material.uniforms;
      sheet.picture.value=await photos.prepare(previous);sheet.nextPicture.value=await photos.prepare(incoming);
      if(stopped)return;
      const cropFor=img=>{const ratio=img.naturalWidth/img.naturalHeight/(16/9);return new THREE.Vector2(Math.min(1,1/ratio),Math.min(1,ratio));};
      sheet.crop.value.copy(cropFor(previous));sheet.nextCrop.value.copy(cropFor(incoming));
      if(renderer.domElement.width!==Math.floor(innerWidth*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(innerHeight*renderer.getPixelRatio()))renderer.setSize(innerWidth,innerHeight);
      const targetRect=incoming.getBoundingClientRect();
      const placement=rect=>({x:(rect.x+rect.width/2)/innerWidth*2-1,y:1-(rect.y+rect.height/2)/innerHeight*2,w:rect.width/innerWidth,h:rect.height/innerHeight});
      const origin=placement(previousRect||targetRect),target=placement(targetRect);
      document.body.append(renderer.domElement);
      surface.dataset.transition = 'rolling';
      let start,hasPresented=false;
      // Ramp the pulling velocity up from zero, then retain the firm ease-out.
      const pull=(elapsed,duration)=>{
        const ramp=240;
        const travel=elapsed<ramp?elapsed*elapsed/(2*ramp):elapsed-ramp/2;
        return 1-Math.pow(1-Math.max(0,Math.min(1,travel/(duration-ramp/2))),4);
      };
      const smooth = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
      let captionsRevealed=false;
      const tick = now => {
        if (stopped) return;
        start ??= now;
        const t = Math.max(0, Math.min(1, (now - start) / motionDuration));
        // Tighten the old image first. Crossfade its pixels on the same
        // surface while the twist releases, never as a second silhouette.
        const elapsed=Math.max(0,now-start);
        if(elapsed>=3000&&!captionsRevealed){
          captionsRevealed=true;
          for(const element of captions)animations.push(element.animate([{opacity:0},{opacity:1}],{duration:1600,easing:'ease-in-out',fill:'forwards'}));
        }
        const release=Math.min(1,Math.max(0,(elapsed-2400)/800));
        // A sustained pull: load the sheet, bear down, hold, then release.
        const twist=elapsed<1900?pull(elapsed,1900):
          elapsed<2400?1:Math.pow(1-release,3.4);
        sheet.curl.value=twist*30.6;
        sheet.gripLag.value=gripOffset(elapsed);
        sheet.gather.value=elapsed<2400?pull(elapsed,700):Math.pow(1-release,2.4);
        sheet.blend.value=smooth(release/.85);
        sheet.bleach.value=.92*smooth(elapsed/2200)+.08*smooth((elapsed-2200)/190);
        sheet.time.value=now/1000;
        const source=previousRect||targetRect;
        liquidSurface().setWring({rect:{x:source.x,width:source.width,bottom:source.y+source.height*(1.-sheet.gather.value*.40),height:source.height},pressure:twist,blend:sheet.blend.value,emitters:sheetDrainage(source,sheet.gather.value,sheet.curl.value,sheet.gripLag.value)});
        const placementMix=smooth(release);
        sheet.size.value.set(THREE.MathUtils.lerp(origin.w,target.w,placementMix),THREE.MathUtils.lerp(origin.h,target.h,placementMix));
        sheet.center.value.set(THREE.MathUtils.lerp(origin.x,target.x,placementMix),THREE.MathUtils.lerp(origin.y,target.y,placementMix));
        renderer.render(scene, camera);
        if(!hasPresented){
          incoming.style.visibility='hidden';surface.style.visibility='hidden';
          outgoing.remove();start=performance.now();hasPresented=true;
        }
        if (t < 1) frame = requestAnimationFrame(tick);
        else {
          finishPicture();
          // The image settles first; let the slower text fade finish naturally.
          Promise.all(animations.map(animation=>animation.finished)).then(clean).catch(()=>{});
        }
      };
      tick(performance.now());
    } catch { clean(); }
  }).catch(clean);
  return clean;
}
