import {avatarById} from './avatars.js';
import {emptyIrisJourney,irisJourney} from './iris-journey.js';
import {contactImmersion,emptyContactImmersion} from './contact-immersion.js';
import {roomMotion} from './room-motion.js';
import {pixelArtShader} from './pixel-art.js';
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {SurroundingLightPass} from './surrounding-light.js';
import {portraitStyle,PORTRAIT_STYLES,styleFrame} from './styles.js';
import {gazeForAvatar,followSphereYaw,followPupil,eyeProximity,approachDistortion} from './gaze.js';
import {INSTALLATION,createInstallation} from './installation.js';
import {AvatarWalker} from './avatar.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {meditationMotion,meditationCamera,meditationRoomCamera,meditationFov} from './motion.js';
const vertex=`varying vec3 point;varying vec2 uv0;void main(){point=position;uv0=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const body=`uniform sampler2D portrait,closedPortrait,acrylicMap,nextPortrait,nextClosedPortrait,nextAcrylicMap;uniform float phase,breath,beat,blink,pupilScale,paintStyle,nextPaintStyle,styleMix,proximity;uniform vec2 gaze,pupilOffset;uniform mat3 closeupFrame;varying vec3 point;varying vec2 uv0;
const float PI=3.141592653589793;const float TAU=6.283185307179586;
vec3 artToLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453123);}
float starPlane(vec2 q){vec2 cell=floor(q),f=fract(q);float seed=hash(vec3(cell,9.));vec2 d=f-(.22+.56*vec2(seed,hash(vec3(cell,19.))));float dotStar=exp(-dot(d,d)*280.)*step(.77,seed)*(.72+.20*sin(phase*(2.+floor(seed*4.))+seed*TAU));float cross=(exp(-abs(d.x)*160.)*exp(-abs(d.y)*20.)+exp(-abs(d.y)*160.)*exp(-abs(d.x)*20.))*step(.989,seed)*.38;return dotStar+cross;}
vec3 stars(vec3 p){vec3 w=pow(abs(p),vec3(6.));w/=max(.001,w.x+w.y+w.z);float v=dot(w,vec3(starPlane(p.yz*24.),starPlane(p.zx*24.+7.),starPlane(p.xy*24.+19.)));return vec3(.79,.73,1.)*v;}

`+pixelArtShader+`
// Flat circular graphic art. Pixel derivatives keep every contour antialiased.
float graphicDisk(vec2 q,vec2 center,float radius){float d=length(q-center)-radius;float aa=max(.0005,fwidth(d));return 1.-smoothstep(-aa,aa,d);}
float graphicTriangle(vec2 p,vec2 a,vec2 b,vec2 c){vec2 ab=b-a,bc=c-b,ca=a-c;float x=ab.x*(p-a).y-ab.y*(p-a).x,y=bc.x*(p-b).y-bc.y*(p-b).x,z=ca.x*(p-c).y-ca.y*(p-c).x;float orient=sign(ab.x*(c-a).y-ab.y*(c-a).x);float d=min(min(x*orient/length(ab),y*orient/length(bc)),z*orient/length(ca));float aa=max(.0005,fwidth(d));return smoothstep(-aa,aa,d);}
vec3 graphicLayer(vec3 p,sampler2D field){
 vec3 weight=pow(abs(p),vec3(6.));weight/=max(.001,weight.x+weight.y+weight.z);
 vec3 paper=texture2D(field,p.yz*.38+.5).rgb*weight.x+texture2D(field,p.zx*.38+.5).rgb*weight.y+texture2D(field,p.xy*.38+.5).rgb*weight.z;
 vec2 q=p.xy/mix(1.,5.2,proximity);q.y/=max(.045,1.-.955*blink);
 vec3 ink=vec3(.075,.035,.15),pink=vec3(1.,.22,.51),lime=vec3(.79,.85,0.),yellow=vec3(1.,.91,.11);
 vec3 rgb=paper;float front=mix(smoothstep(.02,.18,p.z),1.,smoothstep(.45,1.,proximity));
 float lashes=max(graphicTriangle(q,vec2(-.50,.31),vec2(-.35,.53),vec2(-.65,.73)),max(graphicTriangle(q,vec2(-.31,.49),vec2(-.16,.60),vec2(-.30,.93)),graphicTriangle(q,vec2(-.61,.18),vec2(-.50,.36),vec2(-.86,.46))));
 rgb=mix(rgb,ink,graphicDisk(q,vec2(0.),.70)*front);rgb=mix(rgb,pink,lashes*front);
 rgb=mix(rgb,pink,graphicDisk(q,vec2(.015,-.005),.58)*front);
 rgb=mix(rgb,vec3(1.,.45,.68),graphicDisk(q,vec2(.015,-.025),.53)*front);
 rgb=mix(rgb,vec3(.055,.035,.085),graphicDisk(q,vec2(.015,-.045),.49)*front);
 vec2 center=(vec2(.025,-.015)+gaze*vec2(.43,-.37))*(1.-proximity);vec2 iq=q-center;
 rgb=mix(rgb,lime,graphicDisk(iq,vec2(0.),.315)*front);
 rgb=mix(rgb,vec3(.15,.045,.55),graphicDisk(iq,vec2(.065,-.025),.237)*front);
 rgb=mix(rgb,vec3(.06,.70,.86),graphicDisk(iq,vec2(.060,-.023),.184)*front);
 vec2 pupil=vec2(.070,-.025)+pupilOffset*4.;rgb=mix(rgb,ink,graphicDisk(iq,pupil,.119*pupilScale)*front);
 rgb=mix(rgb,yellow,graphicDisk(iq,vec2(-.068,.132),.109)*front);
 rgb=mix(rgb,yellow,graphicDisk(iq,vec2(.130,-.174),.070)*front);
 rgb=mix(rgb,pink,graphicDisk(iq,vec2(.035,.003),.041)*front);
 rgb=mix(rgb,yellow,graphicDisk(iq,vec2(.035,.003),.022)*front);
 return rgb;
}
vec3 paintLayer(vec3 p,sampler2D faceOpen,sampler2D faceClosed,sampler2D paintMap,float paintKind){if(paintKind>2.5)return pixelLayer(p,paintKind,paintMap);if(paintKind>1.5)return graphicLayer(p,paintMap);float slow=.09*sin(phase);mat2 rot=mat2(cos(slow),-sin(slow),sin(slow),cos(slow));vec3 n=p;n.xz=rot*n.xz;float mist=.5+.5*sin(n.x*5.+sin(n.z*4.+sin(phase)))*sin(n.y*5.-.5*cos(phase));vec3 space=mix(vec3(.12,.09,.26),vec3(.38,.24,.55),mist*.8);space+=vec3(.035,.04,.08)*(breath-.5);vec3 star=stars(n)+stars(n.yzx*1.53)*.45;space+=star*.85;
// An opaque moving eyelid occludes the moving iris. No open/closed image dissolve.
// Enlarge the eye itself, not the mesh or camera. Close-up crops out hair and mouth.
float eyeSpan=.53/mix(1.,.53/.095,proximity);
// Keep the iris offset proportional to the visible span, rather than magnifying it.
vec2 eyeAnchor=vec2(.692,.430)+(vec2(.52,.535)-vec2(.692,.430))*(1.-proximity)*(eyeSpan/.53);
vec2 uv=eyeAnchor+vec2(p.x,-p.y)*(eyeSpan-.002*(breath-.5)*(1.-proximity));
// Translate the iris beneath fixed eyelids; do not drag the portrait pixels.
vec2 irisCenter=vec2(.692,.430),irisRadius=vec2(.121,.139);
vec2 irisUV=irisCenter+(uv-irisCenter-gaze*vec2(.24,.22)*(1.-proximity))/1.10;
vec3 original=texture2D(faceOpen,vec2(uv.x,1.-uv.y)).rgb;
float apertureU=clamp((uv.x-.535)/.345,0.,1.),apertureArc=max(0.,sin(PI*apertureU));
float apertureTop=.43-.14*pow(apertureArc,.75),apertureBottom=.43+.14*pow(apertureArc,.45);
float aperture=smoothstep(.002,.025,apertureU)*(1.-smoothstep(.975,.998,apertureU))*smoothstep(apertureTop,apertureTop+.012,uv.y)*(1.-smoothstep(apertureBottom-.012,apertureBottom,uv.y));
vec3 whiteLeft=vec3(.987,.977,1.);
vec3 whiteRight=whiteLeft;
vec3 sclera=mix(whiteLeft,whiteRight,smoothstep(.50,.80,uv.x));
if(paintKind>.5){vec3 pigment=texture2D(paintMap,uv*4.).rgb;float paintLight=dot(pigment,vec3(.299,.587,.114));sclera=vec3(.986,.958,.917)*(.86+.14*paintLight);}
float shiftedIris=1.-smoothstep(.97,1.005,length((irisUV-irisCenter)/irisRadius));
// Deform only the small central pupil patch, leaving the iris outline and highlights fixed.
float pupilSupport=1.-smoothstep(1.15,2.2,length((irisUV-irisCenter)/vec2(.032,.050)));
vec2 pupilUV=mix(irisUV,irisCenter+(irisUV-irisCenter-pupilOffset)/pupilScale,pupilSupport);
vec3 iris=texture2D(faceOpen,vec2(pupilUV.x,1.-pupilUV.y)).rgb;
vec3 opened=mix(original,sclera,aperture);
opened=mix(opened,iris,shiftedIris*aperture);
float ex=(uv.x-.715)/.205;float edge=sqrt(max(0.,1.-ex*ex));
float originalUpper=.43-.14*edge,originalLower=.43+.14*edge;
float closedLine=.505-.075*edge;
float upper=mix(originalUpper,closedLine,blink),lower=mix(originalLower,closedLine,smoothstep(.65,1.,blink));
float sideMask=1.-smoothstep(.95,1.08,abs(ex));
float topMask=smoothstep(originalUpper-.075,originalUpper-.025,uv.y);
float bottomMask=1.-smoothstep(originalLower+.020,originalLower+.080,uv.y);
float lidActive=smoothstep(0.,.035,blink)*sideMask*topMask*bottomMask;
// Match the painted closed-lash arc to the cel arc before either touch is crossfaded.
float closedAlign=.030*edge*paintKind;
vec2 lidUV=vec2(uv.x,uv.y+closedLine-upper-closedAlign);
vec3 lid=texture2D(faceClosed,vec2(lidUV.x,1.-lidUV.y)).rgb;
float coverUpper=(1.-smoothstep(upper-.006,upper+.012,uv.y))*lidActive;
vec2 lowerUV=vec2(uv.x,uv.y+originalLower-lower);
vec3 lowerSkin=texture2D(faceOpen,vec2(lowerUV.x,1.-lowerUV.y)).rgb;
float coverLower=smoothstep(lower-.005,lower+.010,uv.y)*lidActive;
vec3 rgb=mix(mix(opened,lowerSkin,coverLower),lid,coverUpper);
// Complete opaque closure retains the original cartoon lash shape.
rgb=mix(rgb,texture2D(faceClosed,vec2(uv.x,1.-(uv.y-closedAlign))).rgb,smoothstep(.94,1.,blink)*sideMask*topMask*bottomMask);
float opening=smoothstep(upper+.008,upper+.025,uv.y)*(1.-smoothstep(lower-.025,lower-.008,uv.y));
vec2 id=(irisUV-irisCenter)/irisRadius;float irisMask=(1.-smoothstep(.85,1.,length(id)))*opening;
vec3 innerStars=stars(normalize(vec3(id*.7+gaze*8.,1.5)))*.08+stars(normalize(vec3(id*.9-gaze*5.,1.8)))*.045;
vec2 gleam=id-vec2(-.27+.04*sin(phase*2.),-.33+.025*cos(phase*3.));
float reflection=exp(-dot(gleam,gleam)*80.);
rgb+=(innerStars+vec3(.055,.065,.09)*reflection)*irisMask;
float front=mix(smoothstep(-.12,.72,p.z),1.,smoothstep(.45,1.,proximity));
vec3 veil=mix(vec3(.42,.34,.68),vec3(.75,.65,.94),mist*.8);
veil+=star*.23+vec3(.035,.025,.045)*(breath-.5);
// Triplanar paint covers the entire back and sides without a longitude cut.
if(paintKind>.5){vec3 pw=pow(abs(p),vec3(6.));pw/=max(.001,pw.x+pw.y+pw.z);
vec3 painted=texture2D(paintMap,p.yz*.60+.5).rgb*pw.x+texture2D(paintMap,p.zx*.60+.5).rgb*pw.y+texture2D(paintMap,p.xy*.60+.5).rgb*pw.z;
veil=painted;}
rgb=mix(rgb,vec3(.72,.60,.92),.035)+star*mix(.12,.025,paintKind);
vec3 color=mix(veil,rgb,front);
float rim=pow(max(0.,1.-p.z*p.z),5.);color+=vec3(.07,.06,.095)*rim*(.85+.15*breath);
return clamp(color,0.,1.);}

vec3 paint(vec3 p){p=closeupFrame*p;if(styleMix>=1.)return paintLayer(p,nextPortrait,nextClosedPortrait,nextAcrylicMap,nextPaintStyle);vec3 first=paintLayer(p,portrait,closedPortrait,acrylicMap,paintStyle);if(styleMix<=0.)return first;return mix(first,paintLayer(p,nextPortrait,nextClosedPortrait,nextAcrylicMap,nextPaintStyle),styleMix);}
`;
export class MeditationRenderer{
 constructor(container){this.renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});this.renderer.setPixelRatio(1);this.renderer.setClearColor('#574778');container.append(this.renderer.domElement);this.uniforms={closeupFrame:{value:new THREE.Matrix3()},portrait:{value:null},closedPortrait:{value:null},acrylicMap:{value:null},paintStyle:{value:0},nextPortrait:{value:null},nextClosedPortrait:{value:null},nextAcrylicMap:{value:null},nextPaintStyle:{value:0},styleMix:{value:0},proximity:{value:0},phase:{value:0},ceremonyPhase:{value:0},breath:{value:.5},beat:{value:0},blink:{value:0},pupilScale:{value:1},pupilOffset:{value:new THREE.Vector2()},gaze:{value:new THREE.Vector2()}};this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#574778');this.camera=new THREE.PerspectiveCamera(32,16/9,.01,80);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.target.set(0,-.12,0);this.controls.minDistance=1.3;this.controls.maxDistance=8;this.controls.enableDamping=false;this.controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.PAN};
 this.sphereMaterial=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:body+'void main(){gl_FragColor=vec4(artToLinear(paint(normalize(point))),1.);\n#include <colorspace_fragment>\n}',uniforms:this.uniforms});this.sphere=new THREE.Mesh(new THREE.SphereGeometry(.5,192,128,0,TAU(),0,Math.PI),this.sphereMaterial);this.scene.add(this.sphere);
 this.style='cel';this.activeStyle='cel';this.autoStyle=false;this.styleEpoch=0;this.styleRevision=0;this.styleTextures=new Map();this.returnArtwork=new Map();this.irisJourney=emptyIrisJourney();this.closeupDirection=new THREE.Vector3();this.closeupUp=new THREE.Vector3(0,1,0);this.closeupZero=new THREE.Vector3();this.closeupMatrix=new THREE.Matrix4();this.closeupRotation=new THREE.Quaternion();this.closeupBlend=new THREE.Quaternion();this.trackedGaze=new THREE.Vector2();this.eyeHead=new THREE.Vector3();this.eyeYaw=0;this.proximity=0;this.contactImmersion=emptyContactImmersion();this.manualFirstPerson=false;this.manualImmersion=0;this.installation=createInstallation(this.scene,this.uniforms);this.view='walk';this.avatar=new AvatarWalker(this.scene,this.renderer.domElement,()=>!this.avatarChanging&&this.view==='walk'&&document.body.classList.contains('ready')&&document.body.dataset.mode==='room'&&!document.querySelector('#menu')?.open&&!document.querySelector('#avatar-menu')?.open);this.controls.enabled=false;
 this.flat=new THREE.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});this.flatScene=new THREE.Scene();this.flatCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,2);this.flatCamera.position.z=1;this.flatScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:body+'void main(){float lon=(uv0.x-.5)*TAU,lat=(uv0.y-.5)*PI;vec3 p=vec3(sin(lon)*cos(lat),sin(lat),cos(lon)*cos(lat));gl_FragColor=vec4(paint(p),1.);}',uniforms:this.uniforms})));this.composer=new EffectComposer(this.renderer);this.scenePass=new RenderPass(this.scene,this.camera);this.composer.addPass(this.scenePass);this.bloom=new UnrealBloomPass(new THREE.Vector2(1280,720),.42,.55,1.08);this.composer.addPass(this.bloom);this.surroundingLight=new SurroundingLightPass(this.sphere,this.camera);this.composer.addPass(this.surroundingLight);this.composer.addPass(new OutputPass());this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;this.setTime(0);this.cameraAt(0);this.resize(1280,720);}
 async loadStyle(config){const results=await Promise.allSettled((config.pixel?[config.background]:[config.open,config.closed,config.background]).map(async(file,i)=>{const t=await new THREE.TextureLoader().loadAsync(new URL('../assets/'+file,import.meta.url).href);t.colorSpace=THREE.NoColorSpace;t.generateMipmaps=!config.pixel;t.minFilter=config.pixel?THREE.NearestFilter:THREE.LinearMipmapLinearFilter;t.magFilter=config.pixel?THREE.NearestFilter:THREE.LinearFilter;t.anisotropy=Math.min(16,this.renderer.capabilities.getMaxAnisotropy());if(this.prepareProgress)this.prepareProgress(8+52*(++this.prepareLoaded)/this.prepareTotal,'光の素材を読み込んでいます');if(i===2||config.pixel)t.wrapS=t.wrapT=THREE.MirroredRepeatWrapping;return t;}));const failed=results.find(r=>r.status==='rejected');if(failed){for(const r of results)if(r.status==='fulfilled')r.value.dispose();throw failed.reason;}const textures=results.map(r=>r.value);const assets=config.pixel?[textures[0],textures[0],textures[0]]:textures;this.returnArtwork.set(config.id,assets);return assets;}
 styleAssets(config){let pending=this.styleTextures.get(config.id);if(!pending){pending=this.loadStyle(config).catch(error=>{this.styleTextures.delete(config.id);throw error;});this.styleTextures.set(config.id,pending);}return pending;}
 applyStylePair(config,assets,other=config,next=assets){const [open,closed,background]=assets;this.uniforms.portrait.value=open;this.uniforms.closedPortrait.value=closed;this.uniforms.acrylicMap.value=background;this.uniforms.paintStyle.value=config.paint;this.uniforms.nextPortrait.value=next[0];this.uniforms.nextClosedPortrait.value=next[1];this.uniforms.nextAcrylicMap.value=next[2];this.uniforms.nextPaintStyle.value=other.paint;this.uniforms.styleMix.value=0;this.installation.setArtwork(background,next[2]);this.style=config.id;this.activeStyle=config.id;this.otherStyle=other.id;}
 async setStyle(id){const config=portraitStyle(id),revision=++this.styleRevision,assets=await this.styleAssets(config);if(revision!==this.styleRevision)return false;this.autoStyle=false;this.applyStylePair(config,assets);return true;}
 async enableStyleCycle(time){const config=portraitStyle(this.activeStyle||this.style),all=Object.values(PORTRAIT_STYLES),start=all.indexOf(config),configs=all.map((_,i)=>all[(start+i)%all.length]),revision=++this.styleRevision;const assets=await Promise.all(configs.map(c=>this.styleAssets(c)));if(revision!==this.styleRevision)return false;this.styleCycle=configs.map((c,i)=>({config:c,assets:assets[i]}));this.stylePairIndex=0;this.applyStylePair(config,assets[0],configs[1],assets[1]);this.styleEpoch=time??this.time;this.autoStyle=true;return true;}
 updateStyleCycle(t){const frame=styleFrame(t-this.styleEpoch,this.styleCycle.length),current=this.styleCycle[frame.index],next=this.styleCycle[frame.next];if(this.stylePairIndex!==frame.index){const start=this.style;this.applyStylePair(current.config,current.assets,next.config,next.assets);this.style=start;this.stylePairIndex=frame.index;}this.uniforms.styleMix.value=frame.mix;this.activeStyle=frame.mix<.5?current.config.id:next.config.id;}
 returnFromIris(id){
  const config=portraitStyle(id),assets=this.returnArtwork.get(config.id);if(!assets)return false;
  this.surroundingLight.holdArtwork();
  if(this.autoStyle){const all=Object.values(PORTRAIT_STYLES),start=all.indexOf(config),ordered=all.map((_,i)=>all[(start+i)%all.length]);this.styleCycle=ordered.map(c=>({config:c,assets:this.returnArtwork.get(c.id)}));this.stylePairIndex=0;this.styleEpoch=this.time;this.applyStylePair(config,assets,ordered[1],this.styleCycle[1].assets);}
  else this.applyStylePair(config,assets);
  this.returnedArtwork={id:config.id,from:this.irisJourney.style,time:this.time};this.onArtworkReturn?.(config.id);return true;
 }
 async prepare(style='cel',{cycle=true,onProgress=()=>{}}={}){
  const configs=Object.values(PORTRAIT_STYLES);
  this.prepareTotal=new Set(configs.flatMap(c=>[c.open,c.closed,c.background])).size;this.prepareLoaded=0;this.prepareProgress=onProgress;
  onProgress(8,'光の素材を読み込んでいます');
  try{
   try{await this.setStyle(style);}catch(error){if(portraitStyle(style).id==='cel')throw error;this.styleLoadError=error;await this.setStyle('cel');}
   if(cycle&&!this.styleLoadError){try{await this.enableStyleCycle(0);}catch(error){this.styleLoadError=error;}}
   await Promise.allSettled(configs.map(c=>this.styleAssets(c)));onProgress(62,'空間を整えています');await this.installation.prepare(this.renderer);
   onProgress(68,'アバターを読み込んでいます');
   try{await this.avatar.prepare(e=>{if(e.lengthComputable&&e.total>0)onProgress(68+22*e.loaded/e.total,'アバターを読み込んでいます');});}catch(error){this.avatarError=error;this.view='room';console.warn('Avatar unavailable:',error.message);}
   onProgress(94,'光の描画を準備しています');await this.prepareRendering(onProgress);return this;
  }finally{this.prepareProgress=null;}
 }


 // Compile and exercise the real room/reflection/fade/post-process paths while
 // the preloader still owns the screen. First approach and F must create no programs.
 async prepareRendering(onProgress=()=>{}){
  const renderer=this.renderer,previousTarget=renderer.getRenderTarget(),view=this.view;
  const breathe=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  try{
   // Image download/decode is not GPU upload: prepare every artwork texture too,
   // so a first return or style change cannot stall on texImage2D.
   const textures=new Set([...this.returnArtwork.values()].flat());let uploaded=0;
   for(const texture of textures){renderer.initTexture(texture);onProgress(94+(++uploaded)/textures.size,'絵の光を準備しています');await breathe();}
   this.preparedArtTextures=textures.size;
   renderer.setRenderTarget(this.composer.writeBuffer);
   await renderer.compileAsync(this.scene,this.camera);
   await this.surroundingLight.prepare(renderer);
   renderer.setRenderTarget(previousTarget);
   this.render(0,{auto:false});await breathe();onProgress(96,'視点の切り替えを準備しています');
   if(this.avatar.ready){
    this.manualImmersion=.5;this.avatar.fadeForFirstPerson(.5);
    renderer.setRenderTarget(this.composer.writeBuffer);await renderer.compileAsync(this.scene,this.camera);renderer.setRenderTarget(previousTarget);
    this.render(0,{auto:false});await breathe();
    this.manualImmersion=0;this.avatar.position.z=1.15;this.trackAvatar(0);this.avatar.follow(this.camera,1/60,true);
    this.render(0,{auto:false});await breathe();onProgress(97,'瞳の奥の光を準備しています');
    this.contactImmersion={engaged:true,view:1,portal:.5};this.avatar.follow(this.camera,1/60,true,0,1);this.render(0,{auto:false});await breathe();
    this.contactImmersion.portal=1;this.render(0,{auto:false});await breathe();
   }
  }finally{
   renderer.setRenderTarget(previousTarget);this.avatar.reset();this.resetImmersion();this.proximity=0;this.eyeYaw=0;this.trackedGaze.set(0,0);this.view=view;
   this.avatar.fadeForFirstPerson(0);this.avatar.cameraPosition=null;this.cameraAt(0);this.render(0,{auto:false});
  }
  this.renderingPrepared=true;this.preparedPrograms=renderer.info.programs.length;onProgress(98,'準備を仕上げています');
 }

 // Keep loading transactional: the current visitor survives a failed replacement.
 async selectAvatar(id,onProgress=()=>{}){
  const config=avatarById(id);if(!config)throw Error('Unknown avatar');
  if(this.avatarChanging||id===this.avatar.avatarId)return false;
  const old=this.avatar,manual=this.manualImmersion,contact=this.contactImmersion,target=this.renderer.getRenderTarget();
  this.avatarChanging=true;old.clear();
  const next=new AvatarWalker(this.scene,this.renderer.domElement,()=>false);next.root.visible=false;
  try{
   onProgress(5,'アバターを読み込んでいます');
   await next.prepare(e=>{if(e.lengthComputable)onProgress(5+65*e.loaded/e.total,'アバターを読み込んでいます');},config);
   next.position.copy(old.position);next.position.y=INSTALLATION.floorY;next.root.quaternion.copy(old.root.quaternion);
   for(const key of ['yaw','pitch','distance','fpsYaw','fpsPitch','firstPerson'])next[key]=old[key];
   next.cameraPosition=old.cameraPosition?.clone()||null;next.root.updateMatrixWorld(true);next.groundFeet();next.restModelY=next.vrm.scene.position.y;
   old.root.visible=false;next.root.visible=true;this.avatar=next;this.contactImmersion=emptyContactImmersion();
   // Exercise both opaque and faded materials before exposing the new visitor.
   onProgress(78,'アバターの光を準備しています');
   for(const fade of [0,.5]){
    next.root.visible=true;next.fadeForFirstPerson(fade);
    this.renderer.setRenderTarget(this.composer.writeBuffer);
    await this.renderer.compileAsync(this.scene,this.camera);
    this.renderer.setRenderTarget(target);this.manualImmersion=fade;this.render(this.time,{auto:false});
    await new Promise(resolve=>requestAnimationFrame(resolve));
   }
   this.contactImmersion=contact;this.manualImmersion=manual;next.fadeForFirstPerson(this.immersionAmount);this.render(this.time,{auto:false});
   next.canInput=old.canInput;old.dispose();this.preparedPrograms=this.renderer.info.programs.length;
   onProgress(100,'アバターを切り替えました');return true;
  }catch(error){
   this.avatar=old;next.dispose();this.contactImmersion=contact;this.manualImmersion=manual;old.root.visible=this.view==='walk'&&this.immersionAmount<1;this.render(this.time,{auto:false});throw error;
  }finally{this.renderer.setRenderTarget(target);this.avatarChanging=false;}
 }

 setTime(t){const m={...meditationMotion(t),...roomMotion(t)};this.time=t;this.uniforms.ceremonyPhase.value=m.ceremonyPhase;if(this.autoStyle)this.updateStyleCycle(t);const weight=test=>(test(this.uniforms.paintStyle.value)?1:0)*(1-this.uniforms.styleMix.value)+(test(this.uniforms.nextPaintStyle.value)?1:0)*this.uniforms.styleMix.value;this.graphicAmount=weight(k=>k===2);this.pixelAmount=weight(k=>k>=3);this.lightAmount=weight(k=>k===2||k===5);if(this.bloom)this.bloom.strength=.42-.31*this.graphicAmount-.32*this.pixelAmount;for(const k of ['phase','breath','blink','pupilScale'])this.uniforms[k].value=m[k];this.uniforms.beat.value=m.heartbeat;this.uniforms.pupilOffset.value.set(m.pupilX,m.pupilY);this.uniforms.proximity.value=this.view==='walk'?this.proximity:0;if(this.surroundingLight){this.surroundingLight.uniforms.amount.value=this.view==='walk'?this.contactImmersion.portal:0;this.surroundingLight.uniforms.nearWarp.value=this.view==='walk'?approachDistortion(this.avatar.position):0;this.surroundingLight.enabled=this.surroundingLight.uniforms.amount.value>0||this.surroundingLight.uniforms.nearWarp.value>0;if(this.surroundingLight.uniforms.amount.value===0)this.surroundingLight.portalOrigin=null;const full=this.surroundingLight.uniforms.amount.value>=1;this.scenePass.enabled=!full;this.bloom.enabled=!full;}if(this.view==='walk'&&this.avatar?.ready){this.uniforms.gaze.value.copy(this.trackedGaze);this.sphere.rotation.y=this.eyeYaw;}else{this.uniforms.gaze.value.set(m.gazeX,m.gazeY);this.sphere.rotation.y=0;}this.installation?.update(m);return m;}
 cameraAt(t){if(this.view==='walk'){this.avatar.follow(this.camera,1/60,true,0,this.immersionAmount);return;}const room=this.view!=='sphere',c=room?meditationRoomCamera(t):meditationCamera(t);this.camera.fov=meditationFov(room?39:32,this.camera.aspect);this.camera.position.fromArray(c.position);this.camera.lookAt(...c.target);this.controls.target.fromArray(c.target);this.camera.updateProjectionMatrix();}
 resize(w,h){this.renderer.setSize(w,h,false);this.composer?.setSize(w,h);this.camera.aspect=w/h;this.camera.fov=meditationFov(this.view==='sphere'?32:39,this.camera.aspect);this.camera.updateProjectionMatrix();}
 trackAvatar(dt){
  const a=this.avatar;const head=a.vrm?.humanoid.getRawBoneNode('head');
  if(head)head.getWorldPosition(this.eyeHead);else this.eyeHead.copy(a.position).y+=.37;
  this.proximity=eyeProximity(a.position);
  const desired=gazeForAvatar(this.eyeHead,this.eyeYaw);
  this.eyeYaw=followSphereYaw(this.eyeYaw,desired.yaw,dt);
  const pupil=gazeForAvatar(this.eyeHead,this.eyeYaw);
  const next=followPupil(this.trackedGaze,pupil,dt);this.trackedGaze.set(next.x,next.y);
  this.eyeTracking={target:this.eyeHead.toArray(),yaw:this.eyeYaw,pupil:this.trackedGaze.toArray(),proximity:this.proximity,distance:Math.hypot(a.position.x,a.position.z)};
 }
 keepCameraInside(){const c=this.camera.position;c.x=THREE.MathUtils.clamp(c.x,-INSTALLATION.halfWidth+.08,INSTALLATION.halfWidth-.08);c.y=THREE.MathUtils.clamp(c.y,INSTALLATION.floorY+.08,INSTALLATION.ceilingY-.08);c.z=THREE.MathUtils.clamp(c.z,INSTALLATION.backZ+.08,INSTALLATION.frontZ-.08);}
 get immersionAmount(){return Math.max(this.manualImmersion,this.contactImmersion.view);}
 resetImmersion(){this.irisJourney=emptyIrisJourney();this.surroundingLight.releaseArtwork();this.manualFirstPerson=false;this.manualImmersion=0;this.contactImmersion=emptyContactImmersion();this.avatar.firstPerson=false;}
 aimImmersion(){this.avatar.fpsYaw=Math.atan2(this.avatar.position.x,this.avatar.position.z);this.avatar.fpsPitch=-Math.atan2(.31,Math.max(.1,Math.hypot(this.avatar.position.x,this.avatar.position.z)));}
 toggleImmersion(){if(this.view!=='walk'||!this.avatar.ready)return false;this.manualFirstPerson=!this.manualFirstPerson;if(this.manualFirstPerson)this.aimImmersion();this.avatar.firstPerson=this.manualFirstPerson||this.contactImmersion.engaged;return true;}
 step(dt,active){
  if(this.avatarChanging)return false;
  const old=this.manualImmersion,target=this.manualFirstPerson?1:0,before=this.contactImmersion;
  this.manualImmersion+=Math.sign(target-old)*Math.min(Math.abs(target-old),Math.max(0,dt)*1.8);
  this.controls.enabled=this.view!=='walk';
  if(this.view==='walk'){
   const moving=this.avatar.update(dt,active);if(active&&this.avatar.ready)this.trackAvatar(dt);
   this.contactImmersion=contactImmersion(before,Math.hypot(this.avatar.position.x,this.avatar.position.z),dt,active&&this.avatar.ready);
   this.irisJourney=irisJourney(this.irisJourney,before,this.contactImmersion,this.activeStyle,active&&this.avatar.ready);
   if(this.irisJourney.next)this.returnFromIris(this.irisJourney.next);
   if(this.contactImmersion.portal===0)this.surroundingLight.releaseArtwork();
   if(!before.engaged&&this.contactImmersion.engaged&&!this.manualFirstPerson)this.aimImmersion();
   this.avatar.firstPerson=this.manualFirstPerson||this.contactImmersion.engaged||this.contactImmersion.view>0;
   this.avatar.root.visible=this.immersionAmount<1;
   this.avatar.follow(this.camera,dt,false,0,this.immersionAmount);
   const changed=moving||this.avatar.cameraDirty>0||old!==this.manualImmersion||before.view!==this.contactImmersion.view||before.portal!==this.contactImmersion.portal;
   this.avatar.cameraDirty=Math.max(0,this.avatar.cameraDirty-1);return changed;
  }
  this.avatar.root.visible=false;this.avatar.clear();return old!==this.manualImmersion;
 }

 // At close range, roll-free artwork coordinates face the viewer, including a low first-person camera.
 updateCloseupFrame(){const u=this.uniforms.closeupFrame.value;u.identity();if(this.view!=='walk'||this.proximity<=0)return;this.sphere.updateWorldMatrix(true,false);this.sphere.worldToLocal(this.closeupDirection.copy(this.camera.position)).normalize();this.closeupMatrix.lookAt(this.closeupDirection,this.closeupZero,this.closeupUp);this.closeupRotation.setFromRotationMatrix(this.closeupMatrix);this.closeupBlend.identity().slerp(this.closeupRotation,this.proximity);this.closeupMatrix.makeRotationFromQuaternion(this.closeupBlend);u.setFromMatrix4(this.closeupMatrix).transpose();}
 render(t=this.time,{auto=true}={}){this.setTime(t);this.avatar.root.visible=this.view==='walk'&&this.immersionAmount<1;this.controls.enabled=this.view!=='walk';if(this.view==='walk'){if(!this.avatar.cameraPosition)this.avatar.follow(this.camera,1/60,true,0,this.immersionAmount);}else if(auto)this.cameraAt(t);this.keepCameraInside();this.updateCloseupFrame();this.renderer.domElement.dataset.avatarPosition=this.avatar.position.toArray().join(',');this.renderer.domElement.dataset.immersion=this.surroundingLight.uniforms.amount.value;this.avatar.fadeForFirstPerson(this.immersionAmount);this.renderer.domElement.dataset.manualImmersion=this.manualImmersion;const experience=document.getElementById('experience');experience?.style.setProperty('--iris-portal',this.surroundingLight.uniforms.amount.value);experience?.style.setProperty('--manual-immersion',this.immersionAmount);const portal=this.surroundingLight.uniforms.amount.value;experience?.style.setProperty('--graphic-style',this.lightAmount*(1-portal*portal*(3-2*portal)));this.composer.render();return this.renderer.domElement;}
 surface(t,w,h){this.setTime(t);if(this.flat.domElement.width!==w||this.flat.domElement.height!==h)this.flat.setSize(w,h,false);const frame=this.uniforms.closeupFrame.value.clone();this.uniforms.closeupFrame.value.identity();this.flat.render(this.flatScene,this.flatCamera);this.uniforms.closeupFrame.value.copy(frame);return this.flat.domElement;}
}
function TAU(){return Math.PI*2;}
