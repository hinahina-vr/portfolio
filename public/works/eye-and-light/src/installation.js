import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';

// Concept proportions, with the existing one-metre LED sphere as the focal point.
export const INSTALLATION={floorY:-.61,ceilingY:1.0,halfWidth:1.5,backZ:-2.1};
const vertex=`varying vec3 world;varying vec2 vUv;void main(){vUv=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`;
const fragment=`uniform sampler2D artwork;uniform float phase,breath,beat,surface;varying vec3 world;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 linearRGB(vec3 c){return mix(c/12.92,pow(max(vec3(0.),(c+.055)/1.055),vec3(2.4)),step(vec3(.04045),c));}
void main(){vec2 uv=vec2((world.x+world.z)*.22+.5,world.y*.53+.35);if(surface>.5)uv=world.xz*.22+.5;
uv+=vec2(.002*sin(phase),.002*cos(phase));
vec3 art=texture2D(artwork,uv).rgb;
vec2 q=uv*vec2(130.,85.),cell=floor(q);float seed=hash(cell);vec2 center=.15+.70*vec2(seed,hash(cell+91.));vec2 d=fract(q)-center;
float twinkle=.60+.40*sin(phase*(1.+floor(seed*4.))+seed*6.2831853);
float stars=exp(-dot(d,d)*190.)*step(.72,seed)*twinkle;
float cross=(exp(-abs(d.x)*160.-abs(d.y)*16.)+exp(-abs(d.y)*160.-abs(d.x)*16.))*step(.994,seed)*twinkle;
vec3 c=mix(art,vec3(.76,.71,.96),.30)*(.93+.07*breath)+vec3(.80,.70,1.)*(stars*.62+cross*.85);
// Fine, irregular light trails rather than four dominant parallel waves.
float waves=0.;for(int i=0;i<3;i++){float fi=float(i);float line=.26+fi*.22+.04*sin(vUv.x*10.+phase+fi*2.)+.016*sin(vUv.x*31.-phase*2.+fi);waves+=exp(-pow((vUv.y-line)*520.,2.));}
c+=vec3(.12,.10,.17)*waves;
if(surface>1.5){c=art*.16+vec3(.7,.6,.94)*(stars*.18+cross*.24);gl_FragColor=vec4(linearRGB(c),.5);}else gl_FragColor=vec4(linearRGB(c),1.);
#include <colorspace_fragment>
}`;
export function createInstallation(scene,uniforms){
 const group=new THREE.Group();group.name='Stardust immersive room';scene.add(group);
 const rings=[],mirrors=[],ledMaterials=[];
 const panelMaterial=surface=>{const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{artwork:{value:null},phase:uniforms.phase,breath:uniforms.breath,beat:uniforms.beat,surface:{value:surface}}});ledMaterials.push(m);return m;};
 const led=panelMaterial(0),ceiling=panelMaterial(1),floorLight=panelMaterial(2);floorLight.transparent=true;floorLight.blending=THREE.AdditiveBlending;floorLight.depthWrite=false;
 const panel=(w,h,pos,rotation,material=led)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(...pos);m.rotation.set(...rotation);group.add(m);return m;};
 const f=INSTALLATION.floorY,c=INSTALLATION.ceilingY,h=c-f,cy=(c+f)/2;
 panel(3,h,[0,cy,-2.1],[0,0,0]);panel(3.7,h,[-1.5,cy,-.25],[0,Math.PI/2,0]);panel(3.7,h,[1.5,cy,-.25],[0,-Math.PI/2,0]);panel(3,3.7,[0,c,-.25],[Math.PI/2,0,0],ceiling);
 const trim=new THREE.MeshStandardMaterial({color:'#e1d9f4',metalness:.55,roughness:.25});const lightMat=new THREE.MeshBasicMaterial({color:'#f2e8ff'});
 const beam=(a,b,width=.008,material=trim)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const m=new THREE.Mesh(new THREE.CylinderGeometry(width,width,va.distanceTo(vb),8),material);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());group.add(m);};
 for(const x of [-1.5,1.5]){beam([x,f,-2.09],[x,c,-2.09]);for(const y of [f+.01,c-.01]){beam([x,y,-2.09],[x,y,1.6]);beam([x+(x<0?.018:-.018),y+(y<f+.1?.012:-.012),-2.08],[x+(x<0?.018:-.018),y+(y<f+.1?.012:-.012),1.6],.0018,lightMat);}}
 for(const y of [f+.01,c-.01]){beam([-1.5,y,-2.09],[1.5,y,-2.09]);beam([-1.48,y+(y<f+.1?.012:-.012),-2.08],[1.48,y+(y<f+.1?.012:-.012),-2.08],.0018,lightMat);}
 // No interior grid or broad mirror strips cutting through the wall artwork.
 const mirror=new Reflector(new THREE.PlaneGeometry(2.98,8),{textureWidth:1536,textureHeight:1024,color:0xd8cbea,clipBias:.003});mirror.name='Mirror floor';mirror.rotation.x=-Math.PI/2;mirror.position.set(0,f,-.25);group.add(mirror);mirrors.push(mirror);
 panel(2.97,3.67,[0,f+.001,-.25],[-Math.PI/2,0,0],floorLight);
 const foreground=panel(2.97,4,[0,f+.001,3.585],[-Math.PI/2,0,0],floorLight);
 const ring=(radius,y,thin=.0012,opacity=.7,z=0)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(radius,thin,6,256),new THREE.MeshBasicMaterial({color:'#eee4ff',transparent:true,opacity}));m.rotation.x=Math.PI/2;m.position.set(0,y,z);group.add(m);rings.push(m);const points=[];for(let i=0;i<360;i++){const a=i*Math.PI*2/360;points.push(radius*Math.cos(a),y+.0008,z+radius*Math.sin(a));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const dots=new THREE.Points(g,new THREE.PointsMaterial({color:'#f7efff',size:.004,transparent:true,opacity:.85,depthWrite:false}));group.add(dots);return m;};
 for(let i=0;i<9;i++){ring(.69+i*.12,f+.003,i%3===0?.0012:.00045,i%3===0?.6:.26);ring(.10+i*.14,c-.004,i%3===0?.0012:.0004,i%3===0?.6:.28,-.65);}
 const white=new THREE.MeshStandardMaterial({color:'#f0eafa',metalness:.18,roughness:.24,emissive:'#76609b',emissiveIntensity:.15});
 const polished=new THREE.MeshStandardMaterial({color:'#ded5f4',metalness:.65,roughness:.13});
 const pedestal=new THREE.Group();pedestal.name='Low luminous circular plinth';group.add(pedestal);
 const cylinder=(rt,rb,height,y,material)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,height,160),material);m.position.y=y;pedestal.add(m);};
 cylinder(.62,.64,.035,f+.021,polished);cylinder(.55,.57,.035,f+.055,white);cylinder(.18,.27,.045,-.515,white);
 for(const [r,y] of [[.632,f+.037],[.562,f+.072]])ring(r,y,.002,.85);
 scene.add(new THREE.HemisphereLight('#f3eaff','#967cab',2.7));
 for(const [x,z] of [[-1,1],[1,-1]]){const l=new THREE.PointLight('#d2bcff',3,5);l.position.set(x,.75,z);scene.add(l);}
 // Sparse motes float in real depth; fixed seeds and integer harmonics close the loop.
 const pos=[],seeds=[];for(let i=0;i<420;i++){const u=(Math.sin(i*127.1+34.7)*43758.5453)%1;const x=Math.sin(i*2.399963)*1.4,y=f+.08+(i%97)/97*(h-.16),z=-1.95+(i%131)/131*3.3;if(x*x+y*y+z*z<.43)continue;pos.push(x,y,z);seeds.push(Math.abs(u));}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
 const moteMat=new THREE.ShaderMaterial({uniforms:{phase:uniforms.phase},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`uniform float phase;attribute float seed;varying float alpha;void main(){vec3 p=position;p.x+=.013*sin(phase+seed*30.);p.y+=.014*cos(phase*2.+seed*20.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(16.,(2.+seed*2.)/max(.5,-mv.z));alpha=.22+.4*pow(.5+.5*sin(phase*(1.+floor(seed*3.))+seed*40.),3.);}`,fragmentShader:`varying float alpha;void main(){vec2 p=gl_PointCoord-.5;float v=exp(-dot(p,p)*35.);gl_FragColor=vec4(.78,.69,1.,v*alpha);\n#include <colorspace_fragment>\n}`});group.add(new THREE.Points(g,moteMat));
 return {group,rings,mirrors,pedestal,polished,update(m){rings.forEach((r,i)=>r.material.opacity=(i%3===0?.44:.24)+.1*m.breath);},async prepare(renderer){
 const art=await new THREE.TextureLoader().loadAsync(new URL('../assets/stardust.png',import.meta.url).href);art.colorSpace=THREE.NoColorSpace;art.wrapS=art.wrapT=THREE.MirroredRepeatWrapping;art.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());ledMaterials.forEach(m=>m.uniforms.artwork.value=art);
 const target=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});const cube=new THREE.CubeCamera(.02,12,target);cube.position.set(0,-.35,0);pedestal.visible=mirror.visible=foreground.visible=false;try{cube.update(renderer,scene);}finally{pedestal.visible=mirror.visible=foreground.visible=true;}scene.environment=target.texture;this.environmentTarget=target;
 }};
}
