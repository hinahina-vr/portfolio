import * as THREE from 'three';
import {FluidSimulation} from 'three-fluid-fx';
import {wetGlassGLSL} from './WetGlass.js';
import {createPigmentFlow} from './PigmentFlow.js';

const vertex=`varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment=`
uniform sampler2D ocean,picture,previousPicture,density,velocity,ink;
uniform vec2 resolution,crop;
uniform vec4 frameRect;
uniform float time,emergence,opening,imageBlend,surfaceWet;
varying vec2 uvScreen;
${wetGlassGLSL}
vec3 photo(vec2 uv){return mix(texture2D(previousPicture,uv).rgb,texture2D(picture,uv).rgb,imageBlend);}
void main(){
 vec2 uv=uvScreen,px=1./resolution;
 vec3 flow=texture2D(density,uv).rgb;
 vec2 speed=texture2D(velocity,uv).xy;
 vec2 grad=vec2(texture2D(density,uv+vec2(px.x*3.,0.)).b-texture2D(density,uv-vec2(px.x*3.,0.)).b,
 texture2D(density,uv+vec2(0.,px.y*3.)).b-texture2D(density,uv-vec2(0.,px.y*3.)).b);
 vec2 refraction=clamp(grad*.027+flow.rg*.004,vec2(-.065),vec2(.065));
 vec3 environment=texture2D(ocean,uv+refraction).rgb;
 vec3 color=vec3(0.);float alpha=0.;
 vec2 local=(uv-frameRect.xy)/frameRect.zw;
 if(opening>.5){
  // The entire submerged sheet rises; no directional reveal mask.
  float rise=smoothstep(.08,.93,emergence),depth=1.-rise;
  vec2 center=frameRect.xy+frameRect.zw*.5;
  center.y-=frameRect.w*depth*.23;
  vec2 projected=(uv-center)/frameRect.zw;
  projected.y/=.36+.64*rise;
  projected.x/=mix(.75,1.,rise)+projected.y*depth*.24;
  vec2 sheet=projected+.5+refraction*(1.+depth*4.)/frameRect.zw*depth;
  float bounds=max(abs(sheet.x-.5)-.5,abs(sheet.y-.5)-.5);
  float skin=1.-smoothstep(-.007,.007,bounds);
  vec2 pictureUv=clamp((sheet-.5)*crop+.5,.001,.999);
  vec3 submerged=photo(pictureUv+clamp(refraction*depth,vec2(-.08),vec2(.08)));
  float water=clamp(depth*.9+flow.b*.08*depth,0.,.97);
  vec3 wet=mix(submerged,environment*vec3(.65,1.,1.05),water);
  float light=pow(max(0.,1.-abs(projected.y+projected.x*.22-.22+rise*.6)*5.),8.);
  wet+=vec3(.55,.83,.79)*light*depth*.25+max(0.,grad.y-grad.x)*depth*.07;
  alpha=skin*smoothstep(.025,.42,emergence);color=wet;
  float shore=exp(-abs(bounds)*40.)*sin(rise*3.14159);
  float waveRing=sin(bounds*80.-time*4.)*exp(-abs(bounds)*9.);
  vec3 sea=texture2D(ocean,uv+refraction+normalize(projected+vec2(.0001))*waveRing*.011*depth).rgb;
  float seaMask=(1.-skin)*shore*.35;
  color=mix(sea+vec3(.12,.24,.23)*shore*.2,color,alpha);alpha=max(alpha,seaMask);
 }
 if(surfaceWet>.5 && opening<.5 && local.x>0. && local.x<1. && local.y<1.){
  vec3 wet=wetGlass(local,time);
  float lane=floor(clamp((local.x-.04)/.92*16.,0.,15.));
  float center=.04+.92*(lane+.25)/16.;
  float neck=exp(-pow((local.x-center)*frameRect.z*resolution.x/7.,2.));
  float collected=texture2D(ink,vec2(uv.x,frameRect.y)).a;
  float melt=neck*min(.04,collected*.012);
  float edge=smoothstep(-melt-.002,-melt+.002,local.y);
  float dragging=(1.-smoothstep(-.02,.06,local.y))*melt;
  vec2 sampleUv=clamp((local+wet.xy*.014+vec2(0.,dragging)-.5)*crop+.5,.001,.999);
  color=photo(sampleUv)+vec3(.14,.18,.20)*wet.z;
  alpha=edge;
 }
 // Advected image pigment, not tinted water or separate droplet objects.
 vec4 paint=texture2D(ink,uv);
 float mask=smoothstep(.18,.225,paint.a);
 vec2 texel=1./resolution;
 float left=texture2D(ink,uv-vec2(texel.x,0.)).a;
 float right=texture2D(ink,uv+vec2(texel.x,0.)).a;
 float down=texture2D(ink,uv-vec2(0.,texel.y)).a;
 float up=texture2D(ink,uv+vec2(0.,texel.y)).a;
 vec3 normal=normalize(vec3((left-right)*3.,(down-up)*3.,.22));
 vec3 pigment=paint.rgb/max(paint.a,.001);
 float diffuse=max(dot(normal,normalize(vec3(-.42,.55,.72))),0.);
 float specular=pow(max(dot(normal,normalize(vec3(-.16,.22,1.))),0.),48.);
 float rim=pow(1.-normal.z,3.);
 // Highlights follow the cohesive surface instead of a screen-space glitter grid.
 pigment= pigment*(.76+diffuse*.42)+vec3(1.,.96,.87)*specular*.85;
 pigment+=texture2D(ocean,uv+normal.xy*.02).rgb*rim*.32;
 color=mix(color,pigment,mask);alpha=max(alpha,mask);
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

let instance;
export function liquidSurface(){return instance ||= createLiquid();}
function createLiquid(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let renderer,fluid,material,geometry,background,photoTexture,previousTexture,pigmentFlow;
 let surface,image,rect,raf,last=0,time=0,emerging,wring,paused=false,failed=false,attached=0,dirty=true;
 const blank=new THREE.DataTexture(new Uint8Array([6,28,32,255]),1,1);blank.needsUpdate=true;
 const scene=new THREE.Scene(),camera=new THREE.Camera();
 const uniforms={ocean:{value:blank},picture:{value:blank},previousPicture:{value:blank},density:{value:blank},velocity:{value:blank},resolution:{value:new THREE.Vector2()},crop:{value:new THREE.Vector2(1,1)},frameRect:{value:new THREE.Vector4()},time:{value:0},emergence:{value:1},opening:{value:0},imageBlend:{value:1},surfaceWet:{value:1},ink:{value:blank}};
 const pigmentUniforms={previousInk:{value:blank},velocity:uniforms.velocity,picture:uniforms.picture,previousPicture:uniforms.previousPicture,frameRect:uniforms.frameRect,crop:uniforms.crop,resolution:uniforms.resolution,dt:{value:0},time:uniforms.time,feed:{value:0},force:{value:0},imageBlend:uniforms.imageBlend};
 function resize(){if(!renderer)return;renderer.setSize(innerWidth,innerHeight);fluid.resize(innerWidth,innerHeight);uniforms.resolution.value.set(innerWidth,innerHeight);rect=image?.getBoundingClientRect();
  pigmentFlow?.resize(innerWidth,innerHeight);
 }
 function init(){
  if(renderer||failed||reduced.matches)return;
  try{
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
   renderer.domElement.className='liquid-canvas';renderer.domElement.setAttribute('aria-hidden','true');renderer.domElement.dataset.solver='three-fluid-fx';document.body.append(renderer.domElement);
   fluid=new FluidSimulation(renderer,{profile:'performance',pressureIterations:8,bfecc:true,reflectWalls:false,curlStrength:0,enableVorticity:false,densityDissipation:.989,velocityDissipation:.988,splatRadius:.0006,splatForce:4});
   geometry=new THREE.PlaneGeometry(2,2);material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms,transparent:true,depthTest:false});
   scene.add(new THREE.Mesh(geometry,material));
   pigmentFlow=createPigmentFlow(renderer,pigmentUniforms);resize();raf=requestAnimationFrame(tick);
  }catch(error){failed=true;renderer?.domElement.remove();console.warn('Liquid surface unavailable',error);}
 }
 function setSurface(next){
  dirty=true;surface=next;image=next?.querySelector('img');const current=image,generation=++attached;init();if(!renderer||failed||!current)return;
  current.decode().then(()=>{
   if(generation!==attached)return;
   current.style.opacity=reduced.matches?'':'0';
   previousTexture?.dispose();previousTexture=photoTexture;
   photoTexture=new THREE.Texture(current);photoTexture.colorSpace=THREE.SRGBColorSpace;photoTexture.needsUpdate=true;
   uniforms.picture.value=photoTexture;uniforms.previousPicture.value=previousTexture||photoTexture;
   const ratio=current.naturalWidth/current.naturalHeight/(16/9);uniforms.crop.value.set(Math.min(1,1/ratio),Math.min(1,ratio));rect=current.getBoundingClientRect();
  }).catch(()=>{});
 }
 function backgroundFrame(event){
  if(!renderer||failed||document.hidden||reduced.matches)return;
  if(background?.image!==event.detail){background?.dispose();background=new THREE.CanvasTexture(event.detail);background.colorSpace=THREE.SRGBColorSpace;uniforms.ocean.value=background;}
  // Copy while the source WebGL drawing buffer is still valid.
  background.needsUpdate=true;renderer.initTexture(background);
 }
 function endEmergence(){if(!emerging)return;const done=emerging.resolve;emerging=null;uniforms.opening.value=0;if(surface)surface.style.visibility='';renderer?.domElement.classList.remove('wet-entrance');done();}
 function emerge(next){
  setSurface(next);if(!renderer||failed||reduced.matches)return{finished:Promise.resolve(),clean:()=>{}};
  endEmergence();surface.style.visibility='hidden';const finished=new Promise(resolve=>{emerging={start:performance.now(),resolve};});
  renderer.domElement.classList.add('wet-entrance');uniforms.opening.value=1;uniforms.emergence.value=0;return{finished,clean:endEmergence};
 }
 function tick(now){
  raf=requestAnimationFrame(tick);const delta=Math.min((now-(last||now))/1000,.035);last=now;
  if(!surface?.isConnected||document.hidden||reduced.matches||document.body.classList.contains('immersed')){renderer.domElement.style.visibility='hidden';return;}
  renderer.domElement.style.visibility='';if(paused&&!emerging&&!wring&&!dirty)return;dirty=false;
  time+=delta;uniforms.time.value=time;uniforms.surfaceWet.value=wring||document.body.dataset.entrance==='playing'?0:1;rect=image.getBoundingClientRect();
  let activeRect=rect,pressure=0;if(wring){activeRect=wring.rect;pressure=wring.pressure;uniforms.imageBlend.value=wring.blend;}else uniforms.imageBlend.value=1;
  const x=activeRect.x/innerWidth,y=1-activeRect.bottom/innerHeight,w=activeRect.width/innerWidth,h=activeRect.height/innerHeight;
  uniforms.frameRect.value.set(x,y,w,h);let visibility=1;
  if(emerging){
   const progress=Math.min(1,(now-emerging.start)/3100);uniforms.emergence.value=progress;visibility=THREE.MathUtils.smoothstep(progress,.3,.8);
   if(progress>=1)endEmergence();
   for(let i=0;i<3;i++)fluid.addSplat(x+w*(i+.5)/3,y+h*(.18+progress*.6),Math.sin(time*1.4+i)*.7,.6,{radius:.003,color:[.04,.08,.32]});
  }else if(document.body.dataset.entrance==='playing'){visibility=0;}
  for(let i=0;i<6;i++){
   const lane=.09+i*.164;
   if(visibility>0)fluid.addSplat(x+w*lane,y-.018-(i%2)*.025,0,-.6-pressure*7,{radius:.0012});
  }
  fluid.step(delta);uniforms.density.value=fluid.densityTexture;uniforms.velocity.value=fluid.velocityTexture;
  pigmentUniforms.dt.value=delta;pigmentUniforms.feed.value=visibility;pigmentUniforms.force.value=pressure;
  pigmentFlow.setEmitters(wring?.emitters||Array.from({length:16},(_,i)=>({x:rect.x+rect.width*(.04+.92*(i+.25)/16),y:rect.bottom,weight:1,v:.02})));
  uniforms.ink.value=pigmentFlow.step();
  renderer.setClearColor(0x000000,0);renderer.setRenderTarget(null);renderer.render(scene,camera);
 }
 window.addEventListener('portfolio:water-frame',backgroundFrame);
 window.addEventListener('resize',()=>{endEmergence();resize();});
 reduced.addEventListener('change',()=>{endEmergence();if(reduced.matches){if(image)image.style.opacity='';if(renderer)renderer.domElement.style.visibility='hidden';}else{init();setSurface(surface);}});
 window.addEventListener('pagehide',event=>{if(event.persisted)return;cancelAnimationFrame(raf);endEmergence();fluid?.dispose();pigmentFlow?.dispose();geometry?.dispose();material?.dispose();background?.dispose();photoTexture?.dispose();previousTexture?.dispose();blank.dispose();renderer?.dispose();},{once:true});
 return{setSurface,emerge,setPaused:value=>{paused=value;},setWring:value=>{
  wring=value;dirty=true;
  if(!value && renderer && image?.isConnected && !reduced.matches){
   const box=image.getBoundingClientRect();
   uniforms.frameRect.value.set(box.x/innerWidth,1-box.bottom/innerHeight,box.width/innerWidth,box.height/innerHeight);
   uniforms.surfaceWet.value=1;uniforms.imageBlend.value=1;
   renderer.setRenderTarget(null);renderer.setClearColor(0,0);renderer.render(scene,camera);
  }
 }};
}
