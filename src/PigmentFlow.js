import * as THREE from 'three';

// Persistent position/velocity textures, following three-fluid-fx's external
// flow-field particle architecture. Gravity/emission and the cohesive field
// below are portfolio-specific; this is not an SPH solver.
const count=768;
const quadVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const updateFragment=`
uniform sampler2D state,velocity,emitters;
uniform vec4 frameRect;
uniform vec2 resolution;
uniform float dt,time,force,feed,emissionTime;
varying vec2 vUv;
float hash(float p){return fract(sin(p*127.1)*43758.5453);}
void main(){
 float id=floor(vUv.x*768.),stream=floor(id/48.),bead=mod(id,48.);
 vec4 outlet=texture2D(emitters,vec2((stream+.5)/32.,.5));
 float seed=hash(stream+3.);
 float period=1.65+seed*1.2;
 float phase=mod(emissionTime+hash(stream+29.)*period+bead*mix(.003,period/48.,smoothstep(.08,.45,force)),period);
 vec4 s=texture2D(state,vUv);
 if(s.y<-100. && phase<dt*(1.+force*5.) && feed>.01 && outlet.z>.01 && (seed<.65 || force>.1)){
  float x=frameRect.x+frameRect.z*(.04+.92*(stream+hash(stream+10.)*.55)/16.);
  s=vec4(outlet.xy+vec2(0.,-2.),(seed-.5)*force*55.,force*155.*outlet.z);
 }
 if(s.y>-100.){
  vec2 flow=texture2D(velocity,vec2(s.x/resolution.x,1.-s.y/resolution.y)).xy;
  float edge=outlet.y;
  float attached=1.-smoothstep(4.,18.,s.y-edge);
  // Viscous neck resists gravity near the image; released mass accelerates.
  float gravity=mix(980.,95.+force*320.,attached);
  s.zw+=vec2(clamp(flow.x,-12.,12.)*12.,gravity-clamp(flow.y,-12.,12.)*6.)*dt;
  s.zw*=exp(-dt*vec2(.8,.10));
  s.xy+=s.zw*dt;
  if(s.y>resolution.y+80.)s.y=-1000.;
 }
 gl_FragColor=s;
}`;
const splatVertex=`
attribute float particle;
uniform sampler2D state,emitters,pigmentState;
uniform vec2 resolution;
uniform float force;
varying vec2 kernel,sourceUv;
varying float alive;
varying vec3 birthColor;
uniform vec4 frameRect;
float hash(float p){return fract(sin(p*127.1)*43758.5453);}
void main(){
 vec4 s=texture2D(state,vec2((particle+.5)/768.,.5));
 float stream=floor(particle/48.);
 vec4 outlet=texture2D(emitters,vec2((stream+.5)/32.,.5));
 vec4 pigment=texture2D(pigmentState,vec2((particle+.5)/768.,.5));
 float r=pigment.a;
 birthColor=pigment.rgb;
 float stretch=1.+min(s.w/1000.,.65);
 vec2 p=s.xy+position.xy*vec2(r,r*stretch)*2.;
 kernel=position.xy*2.;
 sourceUv=texture2D(emitters,vec2((stream+16.5)/32.,.5)).xy;
 alive=step(-99.,s.y);
 gl_Position=vec4(p.x/resolution.x*2.-1.,1.-p.y/resolution.y*2.,0.,1.);
}`;
const splatFragment=`
uniform sampler2D picture,previousPicture;
uniform float imageBlend;
uniform vec2 crop;
varying vec2 kernel,sourceUv;
varying float alive;
varying vec3 birthColor;
void main(){
 float r=dot(kernel,kernel);if(r>1.||alive<.5)discard;
 float mass=pow(1.-r,3.)*.38;
 gl_FragColor=vec4(birthColor*mass,mass);
}`;
const pigmentUpdateFragment=`
uniform sampler2D oldState,newState,oldPigment,emitters,picture,previousPicture;
uniform vec2 crop;
uniform float imageBlend,force;
varying vec2 vUv;
float hash(float p){return fract(sin(p*127.1)*43758.5453);}
void main(){
 vec4 pigment=texture2D(oldPigment,vUv);
 if(texture2D(oldState,vUv).y<-100. && texture2D(newState,vUv).y>-100.){
  float id=floor(vUv.x*768.),stream=floor(id/48.);
  vec4 outlet=texture2D(emitters,vec2((stream+.5)/32.,.5));
  vec2 uv=(texture2D(emitters,vec2((stream+16.5)/32.,.5)).xy-.5)*crop+.5;
  vec3 color=mix(texture2D(previousPicture,uv).rgb,texture2D(picture,uv).rgb,imageBlend);
  float radius=(7.+hash(stream+7.)*4.+force*10.*outlet.z)*mix(.60,1.,mod(id,48.)/47.);
  pigment=vec4(color,radius);
 }
 gl_FragColor=pigment;
}`;
export function createPigmentFlow(renderer,shared){
 const camera=new THREE.Camera(),updateScene=new THREE.Scene(),fieldScene=new THREE.Scene();
 const initial=new Float32Array(count*4);for(let i=0;i<count;i++)initial[i*4+1]=-1000;
 const seed=new THREE.DataTexture(initial,count,1,THREE.RGBAFormat,THREE.FloatType);seed.needsUpdate=true;
 const options={type:THREE.FloatType,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false};
 let read=new THREE.WebGLRenderTarget(count,1,options),write=read.clone(),field;
 let pigmentRead=read.clone(),pigmentWrite=read.clone();
 const pigmentScene=new THREE.Scene();
 const state={value:seed};let initialized=false;
 const emitterData=new Float32Array(32*4);
 const emitters=new THREE.DataTexture(emitterData,32,1,THREE.RGBAFormat,THREE.FloatType);emitters.needsUpdate=true;
 const uniforms={...shared,state,emitters:{value:emitters},emissionTime:{value:0},pigmentState:{value:seed},oldState:{value:seed},newState:{value:seed},oldPigment:{value:seed}};
 const plane=new THREE.PlaneGeometry(2,2);
 const updateMaterial=new THREE.ShaderMaterial({vertexShader:quadVertex,fragmentShader:updateFragment,uniforms,depthTest:false});
 updateScene.add(new THREE.Mesh(plane,updateMaterial));
 const pigmentMaterial=new THREE.ShaderMaterial({vertexShader:quadVertex,fragmentShader:pigmentUpdateFragment,uniforms,depthTest:false});
 pigmentScene.add(new THREE.Mesh(plane,pigmentMaterial));
 const base=new THREE.PlaneGeometry(1,1),geometry=new THREE.InstancedBufferGeometry();
 geometry.index=base.index;geometry.attributes.position=base.attributes.position;
 geometry.setAttribute('particle',new THREE.InstancedBufferAttribute(Float32Array.from({length:count},(_,i)=>i),1));geometry.instanceCount=count;
 const fieldMaterial=new THREE.ShaderMaterial({vertexShader:splatVertex,fragmentShader:splatFragment,uniforms,side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false,blending:THREE.CustomBlending,blendSrc:THREE.OneFactor,blendDst:THREE.OneFactor,blendEquation:THREE.AddEquation});
 const mesh=new THREE.Mesh(geometry,fieldMaterial);mesh.frustumCulled=false;fieldScene.add(mesh);
 return {
  setEmitters(points){points.forEach((p,i)=>{emitterData.set([p.x,p.y,p.weight,p.v],i*4);emitterData.set([p.u??(i+.25)/16,p.v,0,0],(i+16)*4);});emitters.needsUpdate=true;},
  resize(w,h){field?.dispose();field=new THREE.WebGLRenderTarget(w,h,{type:THREE.HalfFloatType,depthBuffer:false});},
  step(){
   uniforms.emissionTime.value+=shared.dt.value*(1+shared.force.value*5);
   state.value=initialized?read.texture:seed;
   renderer.setRenderTarget(write);renderer.render(updateScene,camera);
   uniforms.oldState.value=state.value;uniforms.newState.value=write.texture;uniforms.oldPigment.value=initialized?pigmentRead.texture:seed;
   renderer.setRenderTarget(pigmentWrite);renderer.render(pigmentScene,camera);
   [pigmentRead,pigmentWrite]=[pigmentWrite,pigmentRead];uniforms.pigmentState.value=pigmentRead.texture;
   [read,write]=[write,read];initialized=true;
   state.value=read.texture;renderer.setRenderTarget(field);renderer.setClearColor(0,0);renderer.clear();renderer.render(fieldScene,camera);
   return field.texture;
  },
  dispose(){read.dispose();write.dispose();pigmentRead.dispose();pigmentWrite.dispose();pigmentMaterial.dispose();field?.dispose();seed.dispose();emitters.dispose();plane.dispose();geometry.dispose();base.dispose();updateMaterial.dispose();fieldMaterial.dispose();}
 };
}
