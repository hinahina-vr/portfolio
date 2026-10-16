import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {createInstallation} from './installation.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {meditationMotion,meditationCamera,meditationRoomCamera,meditationFov} from './motion.js';
const vertex=`varying vec3 point;varying vec2 uv0;void main(){point=position;uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const body=`uniform sampler2D portrait,closedPortrait;uniform float phase,breath,beat,blink;uniform vec2 gaze;varying vec3 point;varying vec2 uv0;
const float PI=3.141592653589793;const float TAU=6.283185307179586;
vec3 artToLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
float starPlane(vec2 q){vec2 cell=floor(q),f=fract(q);float seed=hash(vec3(cell,9.));vec2 d=f-(.22+.56*vec2(seed,hash(vec3(cell,19.))));float dotStar=exp(-dot(d,d)*280.)*step(.77,seed)*(.72+.20*sin(phase*(2.+floor(seed*4.))+seed*TAU));float cross=(exp(-abs(d.x)*160.)*exp(-abs(d.y)*20.)+exp(-abs(d.y)*160.)*exp(-abs(d.x)*20.))*step(.989,seed)*.38;return dotStar+cross;}
vec3 stars(vec3 p){vec3 w=pow(abs(p),vec3(6.));w/=max(.001,w.x+w.y+w.z);float v=dot(w,vec3(starPlane(p.yz*24.),starPlane(p.zx*24.+7.),starPlane(p.xy*24.+19.)));return vec3(.79,.73,1.)*v;}

vec3 paint(vec3 p){float slow=.09*sin(phase);mat2 rot=mat2(cos(slow),-sin(slow),sin(slow),cos(slow));vec3 n=p;n.xz=rot*n.xz;float mist=.5+.5*sin(n.x*5.+sin(n.z*4.+sin(phase)))*sin(n.y*5.-.5*cos(phase));vec3 space=mix(vec3(.12,.09,.26),vec3(.38,.24,.55),mist*.8);space+=vec3(.035,.04,.08)*(breath-.5);vec3 star=stars(n)+stars(n.yzx*1.53)*.45;space+=star*.85;
// An opaque moving eyelid occludes a fixed iris. No open/closed image dissolve.
vec2 uv=vec2(.52,.535)+vec2(p.x,-p.y)*(.53-.002*(breath-.5));
vec2 irisCenter=vec2(.567,.526);vec2 irisDelta=uv-irisCenter;
float gazeMask=exp(-pow(length(irisDelta/vec2(.195,.195)),6.));
vec2 irisUV=uv-gaze*.40*gazeMask;
vec3 opened=texture2D(portrait,vec2(irisUV.x,1.-irisUV.y)).rgb;
float ex=(uv.x-.55)/.455;float edge=sqrt(max(0.,1.-ex*ex));
float originalUpper=.48-.185*edge,originalLower=.52+.185*edge;
float closedLine=.49+.10*edge;
float upper=mix(originalUpper,closedLine,blink),lower=mix(originalLower,closedLine,smoothstep(.65,1.,blink));
float sideMask=1.-smoothstep(.95,1.08,abs(ex));
float topMask=smoothstep(originalUpper-.075,originalUpper-.025,uv.y);
float bottomMask=1.-smoothstep(originalLower+.020,originalLower+.080,uv.y);
float lidActive=smoothstep(0.,.035,blink)*sideMask*topMask*bottomMask;
vec2 lidUV=vec2(uv.x,uv.y+closedLine-upper);
vec3 lid=texture2D(closedPortrait,vec2(lidUV.x,1.-lidUV.y)).rgb;
float coverUpper=(1.-smoothstep(upper-.006,upper+.012,uv.y))*lidActive;
vec2 lowerUV=vec2(uv.x,uv.y+originalLower-lower);
vec3 lowerSkin=texture2D(portrait,vec2(lowerUV.x,1.-lowerUV.y)).rgb;
float coverLower=smoothstep(lower-.005,lower+.010,uv.y)*lidActive;
vec3 rgb=mix(mix(opened,lowerSkin,coverLower),lid,coverUpper);
float opening=smoothstep(upper+.008,upper+.025,uv.y)*(1.-smoothstep(lower-.025,lower-.008,uv.y));
vec2 id=(irisUV-irisCenter)/vec2(.21,.21);float irisMask=(1.-smoothstep(.85,1.,length(id)))*opening;
vec3 innerStars=stars(normalize(vec3(id*.7+gaze*8.,1.5)))*.08+stars(normalize(vec3(id*.9-gaze*5.,1.8)))*.045;
vec2 gleam=id-vec2(-.27+.04*sin(phase*2.),-.33+.025*cos(phase*3.));
float reflection=exp(-dot(gleam,gleam)*80.);
rgb+=(innerStars+vec3(.055,.065,.09)*reflection)*irisMask;
float front=smoothstep(-.12,.72,p.z);
vec3 veil=mix(vec3(.42,.34,.68),vec3(.75,.65,.94),mist*.8);
veil+=star*.23+vec3(.035,.025,.045)*(breath-.5);
rgb=mix(rgb,vec3(.72,.60,.92),.035)+star*.12;
vec3 color=mix(veil,rgb,front);
float rim=pow(max(0.,1.-p.z*p.z),5.);color+=vec3(.07,.06,.095)*rim*(.85+.15*breath);
return clamp(color,0.,1.);}
`;
export class MeditationRenderer{
 constructor(container){this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.setClearColor('#574778');container.append(this.renderer.domElement);this.uniforms={portrait:{value:null},closedPortrait:{value:null},phase:{value:0},breath:{value:.5},beat:{value:0},blink:{value:0},gaze:{value:new THREE.Vector2()}};this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#574778');this.camera=new THREE.PerspectiveCamera(32,16/9,.01,80);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,-.12,0);this.controls.minDistance=1.3;this.controls.maxDistance=8;this.controls.enableDamping=false;this.controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.PAN};
 this.sphereMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:body+'void main(){gl_FragColor=vec4(artToLinear(paint(normalize(point))),1.);\n#include <colorspace_fragment>\n}',uniforms:this.uniforms});this.sphere=new THREE.Mesh(new THREE.SphereGeometry(.5,192,128,0,TAU(),0,Math.PI),this.sphereMaterial);this.scene.add(this.sphere);
 this.installation=createInstallation(this.scene,this.uniforms);this.view='room';
 this.flat=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});this.flatScene=new THREE.Scene();this.flatCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);this.flatCamera.position.z=1;this.flatScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:body+'void main(){float lon=(uv0.x-.5)*TAU,lat=(uv0.y-.5)*PI;vec3 p=vec3(sin(lon)*cos(lat),sin(lat),cos(lon)*cos(lat));gl_FragColor=vec4(paint(p),1.);}',uniforms:this.uniforms})));this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(1280,720),.18,.60,.88);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;this.setTime(0);this.cameraAt(0);this.resize(1280,720);}
 async prepare(){for(const [key,file] of [['portrait','eye-open.png'],['closedPortrait','eye-closed.png']]){const t=await new THREE.TextureLoader().loadAsync(new URL('../assets/'+file,import.meta.url).href);t.colorSpace=THREE.NoColorSpace;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=Math.min(16,this.renderer.capabilities.getMaxAnisotropy());this.uniforms[key].value=t;}await this.installation.prepare(this.renderer);return this;}

 setTime(t){const m=meditationMotion(t);this.time=t;for(const k of ['phase','breath','blink'])this.uniforms[k].value=m[k];this.uniforms.beat.value=m.heartbeat;this.uniforms.gaze.value.set(m.gazeX,m.gazeY);this.installation?.update(m);return m;}
 cameraAt(t){const room=this.view!=='sphere',c=room?meditationRoomCamera(t):meditationCamera(t);this.camera.fov=meditationFov(room?39:32,this.camera.aspect);this.camera.position.fromArray(c.position);this.camera.lookAt(...c.target);this.controls.target.fromArray(c.target);this.camera.updateProjectionMatrix();}
 resize(w,h){this.renderer.setSize(w,h,false);this.composer?.setSize(w,h);this.camera.aspect=w/h;this.camera.fov=meditationFov(this.view==='sphere'?32:39,this.camera.aspect);this.camera.updateProjectionMatrix();}
 render(t=this.time,{auto=true}={}){this.setTime(t);if(auto)this.cameraAt(t);this.composer.render();return this.renderer.domElement;}
 surface(t,w,h){this.setTime(t);if(this.flat.domElement.width!==w||this.flat.domElement.height!==h)this.flat.setSize(w,h,false);this.flat.render(this.flatScene,this.flatCamera);return this.flat.domElement;}
}
function TAU(){return Math.PI*2;}
