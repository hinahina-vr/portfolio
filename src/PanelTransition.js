import {sheetDrainage} from './Drainage.js';
import {liquidSurface} from './LiquidSurface.js';
const motionDuration=3200;
import * as THREE from 'three';
import {wetGlassGLSL} from './WetGlass.js';
import {motionType} from './MotionType.js';

// One image surface; persistent fluid runoff is coordinated by LiquidSurface.
let renderer;
const vertexShader = `
  uniform float curl;
  uniform float gather;


  uniform vec2 size;
  uniform vec2 center;

  varying vec2 imageUv;
  varying vec3 surfacePosition;
  void main() {
    imageUv = uv;
    // Gather the width into longitudinal folds before applying opposing torsion.
    // End separation decreases as the cloth becomes a compact bundle.
    float strength=clamp(abs(curl)/30.6,0.,1.);
    float fold=position.y*7.2;
    float crossY=mix(position.y,.14*sin(fold)+position.y*.035,gather);
    float crossZ=gather*(.115*cos(fold)+.026*sin(position.y*19.));
    float compression=(1.-strength*.30*(1.-position.x*position.x))*(1.-strength*.80);
    float angle=position.x*curl*.5;
    float y=(crossY*cos(angle)-crossZ*sin(angle))*compression;
    float z=(crossY*sin(angle)+crossZ*cos(angle))*compression;
    float x=position.x*(1.-gather*.16);
    y-=gather*(1.-strength)*.07*(1.-position.x*position.x);
    surfacePosition=vec3(x,y,z);
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
export function transitionPanel(surface, previous, reduced, previousRect, previousTitle) {
  if (!previous || reduced.matches) return () => {};
  const incoming = surface.querySelector('img');
  const outgoing = previous.cloneNode();
  outgoing.alt = '';
  outgoing.setAttribute('aria-hidden', 'true');
  outgoing.className = 'panel-outgoing';
  surface.append(outgoing);
  let frame, stopped = false, meshes = [], animations = [];
  let cleanType=()=>{};

  const clean = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    incoming.style.visibility = '';
    surface.style.visibility = '';
    animations.forEach(animation=>animation.cancel());
    cleanType();
    outgoing.remove();
    liquidSurface().setWring(null);
    renderer?.domElement.remove();
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      mesh.material.uniforms.picture.value.dispose();
      mesh.material.uniforms.nextPicture.value.dispose();
      mesh.material.dispose();
    }
    delete surface.dataset.transition;
    reduced.removeEventListener('change', clean);
    window.removeEventListener('resize', clean);
  };
  reduced.addEventListener('change', clean);
  window.addEventListener('resize', clean);
  surface.dataset.transition = 'loading';
  Promise.all([incoming.decode(), previous.decode()]).then(() => {
    if (stopped || !surface.isConnected) return clean();
    try {
      renderer ||= new THREE.WebGLRenderer({alpha:true, antialias:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(innerWidth, innerHeight);
      renderer.setClearColor(0x030708, 0);
      renderer.domElement.className = 'panel-canvas';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const textureFor=img=>{const texture=new THREE.Texture(img);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;};
      const cropFor=img=>{const ratio=img.naturalWidth/img.naturalHeight/(16/9);return new THREE.Vector2(Math.min(1,1/ratio),Math.min(1,ratio));};
      const material=new THREE.ShaderMaterial({
        vertexShader,fragmentShader,side:THREE.DoubleSide,depthTest:true,depthWrite:true,
        uniforms:{picture:{value:textureFor(previous)},nextPicture:{value:textureFor(incoming)},crop:{value:cropFor(previous)},nextCrop:{value:cropFor(incoming)},blend:{value:0},bleach:{value:0},time:{value:0},gather:{value:0},curl:{value:0},size:{value:new THREE.Vector2()},center:{value:new THREE.Vector2()}}
      });
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2,160,80),material);
      meshes.push(mesh);scene.add(mesh);
      const sheet=material.uniforms;
      document.body.append(renderer.domElement);
      const targetRect=incoming.getBoundingClientRect();
      const placement=rect=>({x:(rect.x+rect.width/2)/innerWidth*2-1,y:1-(rect.y+rect.height/2)/innerHeight*2,w:rect.width/innerWidth,h:rect.height/innerHeight});
      const origin=placement(previousRect||targetRect),target=placement(targetRect);
      incoming.style.visibility = 'hidden';
      surface.style.visibility = 'hidden';
      outgoing.remove();
      surface.dataset.transition = 'rolling';
      renderer.compile(scene,camera);
      let start,hasPresented=false;
      cleanType=motionType(previousTitle,document.querySelector('.project-title'));
      const smooth = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
      const animate=(selector,keyframes)=>{const element=document.querySelector(selector);if(element)animations.push(element.animate(keyframes,{duration:1000,easing:'cubic-bezier(.22,.72,.2,1)',fill:'both'}));};
      for(const selector of ['.project-label','.project-action-row','.project-note'])animate(selector,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}]);
      const tick = now => {
        if (stopped) return;
        start ??= now;
        const t = Math.min(1, (now - start) / motionDuration);
        // Tighten the old image first. Crossfade its pixels on the same
        // surface while the twist releases, never as a second silhouette.
        const elapsed=now-start;
        const release=Math.min(1,Math.max(0,(elapsed-2400)/800));
        // A sustained pull: load the sheet, bear down, hold, then release.
        const twist=elapsed<1900?1-Math.pow(1-elapsed/1900,4):
          elapsed<2400?1:Math.pow(1-release,3.4);
        sheet.curl.value=twist*30.6;
        sheet.gather.value=elapsed<2400?1-Math.pow(1-Math.min(1,elapsed/450),3):Math.pow(1-release,2.4);
        sheet.blend.value=smooth(release/.85);
        sheet.bleach.value=.92*smooth(elapsed/2200)+.08*smooth((elapsed-2200)/190);
        sheet.time.value=now/1000;
        const source=previousRect||targetRect;
        liquidSurface().setWring({rect:{x:source.x,width:source.width,bottom:source.y+source.height*(1.-sheet.gather.value*.40),height:source.height},pressure:twist,blend:sheet.blend.value,emitters:sheetDrainage(source,sheet.gather.value,sheet.curl.value)});
        const placementMix=smooth(release);
        sheet.size.value.set(THREE.MathUtils.lerp(origin.w,target.w,placementMix),THREE.MathUtils.lerp(origin.h,target.h,placementMix));
        sheet.center.value.set(THREE.MathUtils.lerp(origin.x,target.x,placementMix),THREE.MathUtils.lerp(origin.y,target.y,placementMix));
        renderer.render(scene, camera);
        if(!hasPresented){start=performance.now();hasPresented=true;}
        if (t < 1) frame = requestAnimationFrame(tick);
        else clean();
      };
      frame = requestAnimationFrame(tick);
    } catch { clean(); }
  }).catch(clean);
  return clean;
}
