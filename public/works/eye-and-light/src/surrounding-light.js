import {irisRefractionShader} from './iris-refraction.js';
import * as THREE from 'three';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const fragment=irisRefractionShader+`
uniform sampler2D tDiffuse,portrait,nextPortrait;
uniform float paintStyle,nextPaintStyle,styleMix;
uniform float amount,nearWarp,phase,breath,pupilScale,blink,aspect;
uniform vec2 portalCenter;
uniform mat4 inverseProjection,cameraWorld;
uniform vec3 cameraPositionWorld,eyeAxis,eyeRight,eyeUp;
varying vec2 vUv;
const float PI=3.141592653589793;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
vec3 toLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
// Read the iris ring from the same artwork the globe is displaying, including fades.
vec3 irisPigment(sampler2D art,float kind){
 if(kind>1.5&&kind<2.5)return vec3(.06,.70,.86);
 vec3 sum=vec3(0.);float weight=0.;
 for(int i=0;i<12;i++){float a=float(i)*6.2831853/12.;vec2 d=vec2(cos(a),sin(a));vec2 uv;
  if(kind>2.5){float ring=kind>5.5?.23:.31;uv=vec2((.5+d.x*ring)*.5,1.-(1.5+d.y*ring)*.5);}
  else uv=vec2(.692,.570)+d*vec2(.077,.088);
  vec3 c=texture2D(art,uv).rgb;float hi=max(c.r,max(c.g,c.b)),lo=min(c.r,min(c.g,c.b));
  float w=smoothstep(.09,.34,hi-lo)*smoothstep(.10,.36,hi)*(1.-smoothstep(.83,.98,lo));sum+=c*w;weight+=w;
 }
 vec3 c=sum/max(.001,weight);c=max(vec3(.001),c-min(c.r,min(c.g,c.b))*.65);return c/max(.20,max(c.r,max(c.g,c.b)));
}
// Preserve the graphic eye's simultaneous pink, cyan, lime and yellow bands.
// Position follows curved geometry; phase only bends it, never swaps the palette.
vec3 graphicPigment(float position){
 float band=fract(position)*4.,blend=smoothstep(.16,.84,fract(band));
 vec3 pink=vec3(1.,.235,.529),cyan=vec3(.06,.70,.86),lime=vec3(.788,.855,0.),yellow=vec3(1.,.906,.169);
 if(band<1.)return mix(pink,cyan,blend);
 if(band<2.)return mix(cyan,lime,blend);
 if(band<3.)return mix(lime,yellow,blend);
 return mix(yellow,pink,blend);
}
vec3 universePigment(vec3 current,vec3 next,float position){
 float graphic=1.-step(.5,abs(paintStyle-2.)),nextGraphic=1.-step(.5,abs(nextPaintStyle-2.));
 vec3 palette=graphicPigment(position);
 return mix(mix(current,palette,graphic),mix(next,palette,nextGraphic),styleMix);
}
// These are the same iris coordinates used on the outside globe, not a substitute sky.
vec3 retinalArt(sampler2D art,float kind,vec2 d){
 if(kind>2.5)return texture2D(art,vec2(.25,.25)+d*.2175).rgb;
 if(kind<1.5)return texture2D(art,vec2(.692,.570)+d*vec2(.121,.139)).rgb;
 // The graphic globe is procedural; extend its actual nested colour discs here too.
 vec2 q=d*.70;vec3 c=vec3(.075,.035,.15);
 float aa=max(.001,fwidth(length(q)));
 c=mix(c,vec3(1.,.22,.51),1.-smoothstep(.58-aa,.58+aa,length(q-vec2(.015,-.005))));
 c=mix(c,vec3(1.,.45,.68),1.-smoothstep(.53-aa,.53+aa,length(q-vec2(.015,-.025))));
 c=mix(c,vec3(.055,.035,.085),1.-smoothstep(.49-aa,.49+aa,length(q-vec2(.015,-.045))));
 c=mix(c,vec3(.79,.85,0.),1.-smoothstep(.315-aa,.315+aa,length(q)));
 c=mix(c,vec3(.15,.045,.55),1.-smoothstep(.237-aa,.237+aa,length(q-vec2(.065,-.025))));
 c=mix(c,vec3(.06,.70,.86),1.-smoothstep(.184-aa,.184+aa,length(q-vec2(.060,-.023))));
 c=mix(c,vec3(.075,.035,.15),1.-smoothstep(.119*pupilScale-aa,.119*pupilScale+aa,length(q-vec2(.070,-.025))));
 c=mix(c,vec3(1.,.91,.11),1.-smoothstep(.109-aa,.109+aa,length(q-vec2(-.068,.132))));
 c=mix(c,vec3(1.,.91,.11),1.-smoothstep(.070-aa,.070+aa,length(q-vec2(.130,-.174))));
 return c;
}
vec3 retinalPair(vec2 d){return mix(retinalArt(portrait,paintStyle,d),retinalArt(nextPortrait,nextPaintStyle,d),styleMix);}
// Use the painted iris as the illumination seen through every cut of the optical volume.
// The annular map stays inside the iris, so the full field never falls out to black sky.
vec3 irisEnvironment(vec3 direction,vec2 origin,vec3 currentPigment,vec3 nextPigment){
 vec3 d=normalize(direction);float a=atan(d.y,d.x),latitude=acos(clamp(d.z,-1.,1.));
 a+=.32*sin(phase+latitude*2.)+.14*sin(a*6.-phase*2.);
 float r=.28+.61*(.5+.5*sin(latitude*3.2+origin.x*.4+.32*sin(phase)));
 vec2 uv=vec2(cos(a),sin(a))*r;
 vec3 art=retinalPair(uv);
 // Keep local pigment visible even when the source ray passes through the painted pupil.
 vec3 tint=universePigment(currentPigment,nextPigment,a/6.2831853+r*.15);
 return art*1.15+tint*.16;
}
vec3 facetedIris(vec2 screen,vec2 origin,vec3 currentPigment,vec3 nextPigment){
 float turn=.12*sin(phase);mat2 spin=mat2(cos(turn),-sin(turn),sin(turn),cos(turn));
 vec2 q=spin*(screen+origin*.12);
 q+=.075*vec2(sin(q.y*4.+phase),sin(q.x*4.-phase));
 vec3 entry=normalize(vec3(q*2.4,-1.))*.94;
 vec3 normal=irisGemHit(vec3(0.),normalize(entry)).xyz;
 vec3 incoming=normalize(entry-vec3(0.,0.,-3.));
 float ior=2.1+.025*sin(phase*2.);
 vec3 green=irisInternalReflection(entry,incoming,normal,ior);
 vec3 red=irisInternalReflection(entry,incoming,normal,ior*.994);
 vec3 blue=irisInternalReflection(entry,incoming,normal,ior*1.006);
 vec3 transmitted=vec3(irisEnvironment(red,origin,currentPigment,nextPigment).r,irisEnvironment(green,origin,currentPigment,nextPigment).g,irisEnvironment(blue,origin,currentPigment,nextPigment).b);
 vec3 reflected=irisEnvironment(reflect(incoming,normal),origin,currentPigment,nextPigment);
 float f0=pow((ior-1.)/(ior+1.),2.);
 float fresnel=f0+(1.-f0)*pow(1.-clamp(dot(-incoming,normal),0.,1.),5.);
 // Large soft light sources reflect as sharp cut faces, rather than pasted sparkle shapes.
 vec3 lightDirection=normalize(vec3(.65*cos(phase),.45*sin(phase),-1.));
 vec3 halfVector=normalize(lightDirection-incoming);
 float flash=pow(max(0.,dot(normal,halfVector)),80.);
 float faceLight=.65+.35*abs(dot(normal,normalize(vec3(.4,.8,-.6))));
 return mix(transmitted,reflected,fresnel)*faceLight+vec3(.93,.97,1.)*flash*.45;
}
// A depth-resolved light volume. No star sprites, polygon outlines or screen ornaments.
// Each stratum carries an advected field of pinlights; perspective and camera translation
// resolve the currents into a continuous space rather than a stack of graphic mandalas.
vec3 pupilUniverse(vec3 ray){
 vec3 currentPigment=irisPigment(portrait,paintStyle),nextPigment=irisPigment(nextPortrait,nextPaintStyle);
 float facing=dot(ray,eyeAxis);vec3 rd=vec3(dot(ray,eyeRight),dot(ray,eyeUp),facing);
 vec2 origin=vec2(dot(cameraPositionWorld,eyeRight),dot(cameraPositionWorld,eyeUp))*.62;
 vec2 screen=rd.xy/max(.16,rd.z);
 float front=smoothstep(-.16,.5,facing);
 vec3 color=facetedIris(screen,origin,currentPigment,nextPigment)*.90;
 // The iris itself opens into a series of transparent, refractive retinal folds.
 // Actual painted veins, pixel blocks and catchlights become the volume's material.
 for(int j=0;j<12;j++){
  float id=float(j),travel=fract(phase/6.2831853+id/12.);
  float z=exp(mix(log(19.),log(.72),travel));
  float life=smoothstep(0.,.10,travel)*(1.-smoothstep(.85,1.,travel));
  vec2 q=screen*z+origin;
  float r=length(q),a=atan(q.y,q.x),sourceAngle=a;
  float turn=.24*sin(phase+z*.18)+id*.31;
  a+=turn+.20*sin(r*5.-phase*2.+z*.13);
  // Far folds are mirrored into hard sectors; near folds still read as the original eye.
  float mirrored=abs(mod(a+PI/6.,PI/3.)-PI/6.);
  float folding=.25+.60*(1.-travel)+.10*sin(phase+z*.22);
  vec2 normalPoint=vec2(cos(a),sin(a));
  vec2 mirrorPoint=vec2(cos(mirrored),sin(mirrored));
  vec2 d=mix(normalPoint,mirrorPoint,folding)*r;
  d*=1.+.24*sin(sourceAngle*6.+phase+z*.27);
  vec3 art=retinalPair(d);
  float aperture=smoothstep(.18,.29,r)*(1.-smoothstep(.83,.98,r));
  float luma=dot(art,vec3(.299,.587,.114));
  float contrast=smoothstep(.12,.78,luma);
  // Dark pupils in the source material open tears in the folds; painted catchlights emit light.
  float graphic=mix(1.-step(.5,abs(paintStyle-2.)),1.-step(.5,abs(nextPaintStyle-2.)),styleMix);
  float specular=pow(max(0.,min(art.r,min(art.g,art.b))-.64)*2.7,2.);
  vec3 pigment=universePigment(currentPigment,nextPigment,sourceAngle/6.2831853+z*.018);
  color+=life*aperture*(art*contrast*mix(.30,.65,graphic)+mix(pigment,art,.7)*specular*.12);
 }
 // Slow orbital advection preserves the continuous 30-second phase at the loop seam.
 for(int i=0;i<36;i++){
  float id=float(i),travel=fract(phase/6.2831853+id/36.);
  float z=exp(mix(log(32.),log(.85),travel));
  float life=smoothstep(0.,.08,travel)*(1.-smoothstep(.88,1.,travel));
  vec2 q=screen*z+origin;
  float turn=.32*sin(phase+z*.055)+z*.035;
  q=mat2(cos(turn),-sin(turn),sin(turn),cos(turn))*q;
  // Two broad, interleaving currents: fine light is concentrated in their folds.
  float bend=.86*sin(q.x*.42+z*.16-phase)+.36*sin(q.x*.83-z*.10+phase*2.);
  float river=q.y-bend;
  float river2=q.y+1.25-1.25*sin(q.x*.27-z*.12+phase);
  float density=exp(-river*river*.7)+.48*exp(-river2*river2*.60);
  vec2 field=vec2(q.x+.21*sin(q.y*.8+phase+id*.41),river);
  field+=vec2(.45*cos(phase+id*.73),.26*sin(phase+id*.51));
  vec2 grid=field*8.5,cell=floor(grid),local=fract(grid)-.5;
  float seed=hash(vec3(cell,id));
  vec2 jitter=(vec2(hash(vec3(cell,id+13.)),hash(vec3(cell,id+71.)))-.5)*.62;
  vec2 d=local-jitter;
  float width=max(.026,length(fwidth(grid))*.36);
  // Circular optical cores with a restrained soft shoulder. Near grains drift out of focus.
  float focus=.026+.055*pow(1.-travel,2.)+.045*pow(travel,10.);
  float core=exp(-dot(d,d)/max(.0003,focus*focus+width*width))*focus*focus/(focus*focus+width*width);
  float halo=exp(-dot(d,d)*16.)*.026;
  float selected=smoothstep(.23,.62,seed);
  float pulse=.48+.52*pow(.5+.5*sin(phase*2.+seed*6.2831853+z*.08),3.);
  // Below the pixel footprint, integrate the field instead of aliasing it into glitter.
  float resolved=1.-smoothstep(.16,.60,width);
  float grain=mix(.024,(core*3.2+halo)*selected,resolved);
  pulse=mix(.64,pulse,resolved);
  float intensity=grain*pulse*density*life;
  vec3 ink=universePigment(currentPigment,nextPigment,atan(q.y,q.x)/6.2831853+z*.018);
  // Rare, neutral specular cores read as light reflected inside an iris, never symbols.
  vec3 light=mix(ink,vec3(.88,.95,1.),.13+.52*pow(seed,12.));
  color+=light*intensity*.32;
  // Continuous refractive veils between the particles, shaped by the same current.
  float folded=river+.09*sin(q.x*3.+z*.6+phase);
  float caustic=exp(-abs(folded)*26.)*(.5+.5*sin(q.x*1.2-z*.5+phase));
  float veil=exp(-river*river*2.4)*(.5+.5*sin(q.x*.6-z*.3-phase));
  color+=ink*life*(caustic*.05+veil*.009);
 }
 // A distant living source: luminous depths remain visible through the dark centre.
 float rr=length(screen),a=atan(screen.y,screen.x);
 vec3 pigment=universePigment(currentPigment,nextPigment,a/6.2831853+.12);
 color+=pigment*.065*exp(-rr*rr*25.)*(.75+.25*sin(phase*2.));
 color*=mix(.85,1.,front)*(1.-blink*.03);
 return toLinear(1.-exp(-color*1.7));
}

void main(){
 float progress=clamp(amount,0.,1.);
 // A refractive throat pulls the room through a folded, liquid membrane.
 // The deformation vanishes at both endpoints; no edge jump or white flash.
 vec2 q=(vUv-portalCenter)*vec2(aspect,1.);
 float r=length(q),a=atan(q.y,q.x),membrane=sin(PI*progress),presage=clamp(nearWarp,0.,1.40)*(1.-progress);
 float throat=exp(-r*1.45),twist=membrane*(1.52*throat+.40*sin(a*3.+r*5.-phase)+.22*sin(q.x*5.-q.y*3.+phase*2.))+presage*(.24*sin(r*5.-phase)+.16*sin(q.y*5.+phase*2.));
 mat2 turn=mat2(cos(twist),-sin(twist),sin(twist),cos(twist));
 vec2 folded=turn*q;
 float waves=sin(a*3.+r*9.-phase)+.45*sin(a*5.-r*6.+phase);
 folded*=1.-progress*.72*throat+membrane*.23*waves*throat+presage*.13*sin(r*6.+.8*sin(a*3.+phase)-phase)*exp(-r*.6);
 vec2 flow=vec2(sin(folded.y*6.+phase),sin(folded.x*5.-phase));
 vec2 undertow=vec2(sin(flow.y*2.4+folded.y*3.-phase),cos(flow.x*2.2-folded.x*4.+phase));
 folded+=(flow*.22+undertow*.135)*membrane*(1.-exp(-r*7.))*exp(-r*.7);
 // A separate distance-controlled lens bends the room before any portal opens.
 folded+=vec2(sin(q.y*5.+.8*sin(q.x*3.-phase)+phase),sin(q.x*4.+.7*cos(q.y*5.+phase)-phase*2.))*.13*presage*(1.-exp(-r*5.))*exp(-r*.4);
 vec2 uv=portalCenter+folded/vec2(aspect,1.);
 // Keep the approaching lens inside the available image, without clamped edge streaks.
 vec2 displacement=uv-vUv,clearance=mix(vUv,1.-vUv,step(vec2(0.),displacement));
 vec2 bounded=displacement/(1.+abs(displacement)/max(vec2(.0001),clearance*.88));
 uv=mix(vUv+bounded,uv,smoothstep(0.,.35,progress));
 float reach=length(vec2(max(portalCenter.x,1.-portalCenter.x)*aspect,max(portalCenter.y,1.-portalCenter.y)));
 float radius=mix(-.18,reach+.30,progress);
 float liquidEdge=r+membrane*.135*waves*smoothstep(0.,.25,r);
 float opening=(1.-smoothstep(radius-.16,radius+.16,liquidEdge))*smoothstep(0.,.16,progress);
 vec4 scene=vec4(0.,0.,0.,1.);
 if(progress<1.){
  vec2 dispersion=normalize(q+vec2(.0001))*.0028*membrane/vec2(aspect,1.);
  scene=texture2D(tDiffuse,clamp(uv,vec2(.001),vec2(.999)));
  scene.r=texture2D(tDiffuse,clamp(uv+dispersion,vec2(.001),vec2(.999))).r;
  scene.b=texture2D(tDiffuse,clamp(uv-dispersion,vec2(.001),vec2(.999))).b;
 }
 // The event horizon absorbs light instead of drawing a bright circular wipe.
 float horizon=exp(-abs(liquidEdge-radius)*14.)*membrane;
 scene.rgb*=1.-.66*horizon-.16*membrane*throat;
 if(opening<=0.){gl_FragColor=scene;return;}
 // Keep the light currents legible while the surrounding room undergoes the larger refraction.
 vec2 abyssUv=vUv+(folded-q)/vec2(aspect,1.)*.10*membrane;
 vec4 view=inverseProjection*vec4(abyssUv*2.-1.,1.,1.);
 vec3 ray=normalize((cameraWorld*vec4(view.xyz/view.w,0.)).xyz);
 gl_FragColor=vec4(mix(scene.rgb,pupilUniverse(ray),opening),scene.a);
}
`;
// The approach uses exactly the same lens math, without compiling the optical
// universe into every pre-contact pixel. Keep the shared source to prevent drift.
const approachFragment=`uniform sampler2D tDiffuse;
uniform float amount,nearWarp,phase,aspect;
uniform vec2 portalCenter;
varying vec2 vUv;
const float PI=3.141592653589793;
`+fragment.slice(fragment.lastIndexOf('void main(){'),fragment.indexOf(' // Keep the light currents legible'))+'gl_FragColor=scene;\n}';
// Retain the diagnostic property name; this pass now opens the iris without white.
export class SurroundingLightPass extends ShaderPass{
 constructor(sphere,camera){
  super({uniforms:{tDiffuse:{value:null},amount:{value:0},nearWarp:{value:0},aspect:{value:1},portalCenter:{value:new THREE.Vector2(.5,.5)},phase:{value:0},breath:{value:.5},pupilScale:{value:1},blink:{value:0},inverseProjection:{value:new THREE.Matrix4()},cameraWorld:{value:new THREE.Matrix4()},cameraPositionWorld:{value:new THREE.Vector3()},eyeAxis:{value:new THREE.Vector3()},eyeRight:{value:new THREE.Vector3()},eyeUp:{value:new THREE.Vector3()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:fragment});
  this.irisMaterial=this.material;this.approachMaterial=new THREE.ShaderMaterial({name:'Approach lens',uniforms:this.uniforms,vertexShader:this.material.vertexShader,fragmentShader:approachFragment});this.source=sphere;this.camera=camera;this.portalOrigin=null;this.worldUp=new THREE.Vector3(0,1,0);this.center=new THREE.Vector3();
  for(const name of ['phase','breath','pupilScale','blink','portrait','nextPortrait','paintStyle','nextPaintStyle','styleMix'])this.uniforms[name]=sphere.material.uniforms[name];
 }
 holdArtwork(){if(this.artworkHeld)return;for(const name of ['portrait','nextPortrait','paintStyle','nextPaintStyle','styleMix'])this.uniforms[name]={value:this.uniforms[name].value};this.artworkHeld=true;}
 releaseArtwork(){if(!this.artworkHeld)return;for(const name of ['portrait','nextPortrait','paintStyle','nextPaintStyle','styleMix'])this.uniforms[name]=this.source.material.uniforms[name];this.artworkHeld=false;}
 setSize(w,h){this.uniforms.aspect.value=w/h;}
 async prepare(renderer){
  const geometry=new THREE.PlaneGeometry(2,2),scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);camera.position.z=1;
  scene.add(new THREE.Mesh(geometry,this.approachMaterial),new THREE.Mesh(geometry,this.irisMaterial));
  try{await renderer.compileAsync(scene,camera);}finally{geometry.dispose();}
 }
 dispose(){this.approachMaterial.dispose();this.material=this.irisMaterial;super.dispose();}
 render(renderer,writeBuffer,readBuffer,dt,maskActive){
  this.material=this.uniforms.amount.value===0?this.approachMaterial:this.irisMaterial;
  this.camera.updateMatrixWorld(true);this.uniforms.inverseProjection.value.copy(this.camera.projectionMatrixInverse);this.uniforms.cameraWorld.value.copy(this.camera.matrixWorld);
  this.camera.getWorldPosition(this.uniforms.cameraPositionWorld.value);this.source.getWorldPosition(this.center);
  const axis=this.uniforms.eyeAxis.value;
  // Anchor the universe at entry; translating/turning the camera must not drag the volume.
  if(!this.portalOrigin){axis.copy(this.center).sub(this.uniforms.cameraPositionWorld.value).normalize();if(this.uniforms.amount.value>0)this.portalOrigin=this.uniforms.cameraPositionWorld.value.clone();}
  this.uniforms.eyeRight.value.crossVectors(axis,this.worldUp).normalize();if(this.uniforms.eyeRight.value.lengthSq()<.01)this.uniforms.eyeRight.value.set(1,0,0);
  this.uniforms.eyeUp.value.crossVectors(this.uniforms.eyeRight.value,axis).normalize();
  this.center.project(this.camera);this.uniforms.portalCenter.value.set(THREE.MathUtils.clamp(this.center.x*.5+.5,0,1),THREE.MathUtils.clamp(this.center.y*.5+.5,0,1));
  super.render(renderer,writeBuffer,readBuffer,dt,maskActive);
 }
}
