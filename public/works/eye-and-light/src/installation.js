import * as THREE from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {createSanctuary,installationFieldShader} from './sanctuary.js';

// Concept proportions, with the existing one-metre LED sphere as the focal point.
export const INSTALLATION={floorY:-.61,ceilingY:1.0,halfWidth:3,backZ:-4.2,frontZ:3.2};
const vertex=`varying vec3 world;varying vec2 vUv;void main(){vUv=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`;
const fragment=`uniform sampler2D artwork,nextArtwork;uniform float artMix,phase,breath,beat,surface,paintStyle,nextPaintStyle;varying vec3 world;varying vec2 vUv;
${installationFieldShader}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec3 linearRGB(vec3 c){return mix(c/12.92,pow(max(vec3(0.),(c+.055)/1.055),vec3(2.4)),step(vec3(.04045),c));}
void main(){vec2 uv=vec2((world.x+world.z)*.22+.5,world.y*.53+.35);if(surface>.5)uv=world.xz*.22+.5;
uv+=vec2(.002*sin(phase),.002*cos(phase));
vec3 art=installationArtwork(world,surface);
vec2 q=uv*vec2(130.,85.),cell=floor(q);float seed=hash(cell);vec2 center=.15+.70*vec2(seed,hash(cell+91.));vec2 d=fract(q)-center;
float twinkle=.60+.40*sin(phase*(1.+floor(seed*4.))+seed*6.2831853);
float stars=exp(-dot(d,d)*190.)*step(.72,seed)*twinkle;
float cross=(exp(-abs(d.x)*160.-abs(d.y)*16.)+exp(-abs(d.y)*160.-abs(d.x)*16.))*step(.994,seed)*twinkle;
vec3 c=mix(art,vec3(.28,.17,.50),.18)*(.77+.06*breath)+vec3(.80,.70,1.)*(stars*.62+cross*.85);
float graphic=mix(step(1.5,paintStyle),step(1.5,nextPaintStyle),artMix);c=mix(c,art,graphic);
// Fine physical LED cells fade out below pixel resolution.
vec2 pixelUV=vUv*vec2(240.,78.);vec2 cellUV=fract(pixelUV);float resolve=1.-smoothstep(.25,.8,max(fwidth(pixelUV.x),fwidth(pixelUV.y)));float diode=pow(max(0.,sin(3.14159265*cellUV.x)*sin(3.14159265*cellUV.y)),.45);c*=1.-.13*resolve*(1.-diode);
// The same world-space lanes pass through the wall glyphs without panel edges.
if(surface<.5){vec2 lanes=installationLanes(world);float thread=installationStroke(world.y-lanes.x,.0007)*.12+installationStroke(world.y-lanes.y,.0007)*.09;c=mix(c,installationInk(art),thread);}
if(surface>1.5){c=art*.16+vec3(.7,.6,.94)*(stars*.18+cross*.24);gl_FragColor=vec4(linearRGB(c),.5);}else gl_FragColor=vec4(linearRGB(c),1.);
#include <colorspace_fragment>
}`;
export function createInstallation(scene,uniforms){
 const group=new THREE.Group();group.name='Stardust immersive room';scene.add(group);
 const rings=[],mirrors=[],ledMaterials=[];
 const panelMaterial=surface=>{const m=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{artwork:{value:null},nextArtwork:{value:null},artMix:uniforms.styleMix,phase:uniforms.phase,breath:uniforms.breath,beat:uniforms.beat,surface:{value:surface},paintStyle:uniforms.paintStyle,nextPaintStyle:uniforms.nextPaintStyle}});ledMaterials.push(m);return m;};
 const led=panelMaterial(0),ceiling=panelMaterial(1),floorLight=panelMaterial(2);floorLight.transparent=true;floorLight.blending=THREE.AdditiveBlending;floorLight.depthWrite=false;
 const panel=(w,h,pos,rotation,material=led)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(...pos);m.rotation.set(...rotation);group.add(m);return m;};
 const f=INSTALLATION.floorY,c=INSTALLATION.ceilingY,h=c-f,cy=(c+f)/2,w=INSTALLATION.halfWidth*2,back=INSTALLATION.backZ,front=INSTALLATION.frontZ,depth=front-back,cz=(front+back)/2;
 panel(w,h,[0,cy,back],[0,0,0]).name='LED wall back';panel(w,h,[0,cy,front],[0,Math.PI,0]).name='LED wall front';panel(depth,h,[-w/2,cy,cz],[0,Math.PI/2,0]).name='LED wall left';panel(depth,h,[w/2,cy,cz],[0,-Math.PI/2,0]).name='LED wall right';panel(w,depth,[0,c,cz],[Math.PI/2,0,0],ceiling).name='LED ceiling';
 const trim=new THREE.MeshStandardMaterial({color:'#e1d9f4',metalness:.55,roughness:.25});const lightMat=new THREE.MeshBasicMaterial({color:'#f2e8ff'});
 const beam=(a,b,width=.004,material=trim)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b);const m=new THREE.Mesh(new THREE.CylinderGeometry(width,width,va.distanceTo(vb),8),material);m.position.copy(va).add(vb).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vb.sub(va).normalize());group.add(m);};
 for(const x of [-w/2,w/2]){for(const y of [f+.01,c-.01]){beam([x,y,back+.01],[x,y,front]);beam([x+(x<0?.018:-.018),y+(y<f+.1?.012:-.012),back+.02],[x+(x<0?.018:-.018),y+(y<f+.1?.012:-.012),front],.0018,lightMat);}}
 for(const y of [f+.01,c-.01]){beam([-w/2,y,back+.01],[w/2,y,back+.01]);beam([-w/2+.02,y+(y<f+.1?.012:-.012),back+.02],[w/2-.02,y+(y<f+.1?.012:-.012),back+.02],.0018,lightMat);}
 for(const y of [f+.01,c-.01])beam([-w/2,y,front-.01],[w/2,y,front-.01]);
 // No interior grid or broad mirror strips cutting through the wall artwork.
 // Unbroken LED walls and ceiling: no opaque coves or vertical corner posts.
 const mirror=new Reflector(new THREE.PlaneGeometry(w,depth),{textureWidth:1536,textureHeight:1024,color:0xd8cbea,clipBias:.003});mirror.name='Mirror floor';mirror.rotation.x=-Math.PI/2;mirror.position.set(0,f,cz);group.add(mirror);mirrors.push(mirror);
 const floorGlow=panel(w,depth,[0,f+.001,cz],[-Math.PI/2,0,0],floorLight);
 const ring=(radius,y,thin=.0012,opacity=.7,z=0)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(radius,thin,6,256),new THREE.MeshBasicMaterial({color:'#eee4ff',transparent:true,opacity}));m.rotation.x=Math.PI/2;m.position.set(0,y,z);group.add(m);rings.push(m);const points=[];for(let i=0;i<360;i++){const a=i*Math.PI*2/360;points.push(radius*Math.cos(a),y+.0008,z+radius*Math.sin(a));}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const dots=new THREE.Points(g,new THREE.PointsMaterial({color:'#f7efff',size:.004,transparent:true,opacity:.85,depthWrite:false}));group.add(dots);return m;};
 for(const radius of [.77,1.06,2.63])ring(radius,f+.003,.0005,.10);
 for(const radius of [.75,2.62])ring(radius,c-.004,.0005,.07);
 const white=new THREE.MeshStandardMaterial({color:'#eae0fa',metalness:.28,roughness:.22,emissive:'#77608f',emissiveIntensity:.08});
 const polished=new THREE.MeshStandardMaterial({color:'#ded5f4',metalness:.65,roughness:.13});
 const pedestal=new THREE.Group();pedestal.name='Low luminous circular plinth';group.add(pedestal);
 const cylinder=(rt,rb,height,y,material)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,height,160),material);m.position.y=y;pedestal.add(m);};
 cylinder(.72,.75,.026,f+.017,polished);cylinder(.66,.69,.024,f+.044,white);cylinder(.60,.64,.021,f+.067,white);cylinder(.40,.42,.010,f+.083,white);
 for(const [radius,y] of [[.738,f+.030],[.618,f+.079]]){const rim=ring(radius,y,.0022,.86);rim.material.color.setRGB(2.5,1.8,3.5);rim.material.opacity=.86;}
 const sanctuary=createSanctuary(group,uniforms,INSTALLATION,led.uniforms);
 scene.add(new THREE.HemisphereLight('#f3eaff','#967cab',2.1));
 const movingLights=[];
 for(const [x,z] of [[-1,1],[1,-1]]){const l=new THREE.PointLight('#d2bcff',3,5);l.position.set(x,.75,z);scene.add(l);movingLights.push(l);}
 // Sparse motes float in real depth; fixed seeds and integer harmonics close the loop.
 const pos=[],seeds=[];for(let i=0;i<420;i++){const u=(Math.sin(i*127.1+34.7)*43758.5453)%1;const x=Math.sin(i*2.399963)*(w/2-.1),y=f+.08+(i%97)/97*(h-.16),z=back+.15+(i%131)/131*(depth-.3);if(x*x+y*y+z*z<.43)continue;pos.push(x,y,z);seeds.push(Math.abs(u));}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('seed',new THREE.Float32BufferAttribute(seeds,1));
 const moteMat=new THREE.ShaderMaterial({uniforms:{phase:uniforms.phase},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`uniform float phase;attribute float seed;varying float alpha;void main(){vec3 p=position;p.x+=.013*sin(phase+seed*30.);p.y+=.014*cos(phase*2.+seed*20.);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(16.,(2.+seed*2.)/max(.5,-mv.z));alpha=.22+.4*pow(.5+.5*sin(phase*(1.+floor(seed*3.))+seed*40.),3.);}`,fragmentShader:`varying float alpha;void main(){vec2 p=gl_PointCoord-.5;float v=exp(-dot(p,p)*35.);gl_FragColor=vec4(.78,.69,1.,v*alpha);\n#include <colorspace_fragment>\n}`});group.add(new THREE.Points(g,moteMat));
 return {group,rings,mirrors,pedestal,polished,sanctuary,movingLights,setArtwork(texture,next=texture){this.artwork=texture;ledMaterials.forEach(m=>{m.uniforms.artwork.value=texture;m.uniforms.nextArtwork.value=next;});},update(m){sanctuary.update(m);rings.forEach((r,i)=>r.material.opacity=(i<5?.34:.76)+.1*m.breath);movingLights[0].position.set(m.keyX,m.keyY,m.keyZ);movingLights[1].position.set(m.fillX,.68,m.fillZ);movingLights[0].intensity=m.keyIntensity;movingLights[1].intensity=m.fillIntensity;},async prepare(renderer){
 if(!this.artwork){const art=await new THREE.TextureLoader().loadAsync(new URL('../assets/stardust.png',import.meta.url).href);art.colorSpace=THREE.NoColorSpace;art.wrapS=art.wrapT=THREE.MirroredRepeatWrapping;art.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());this.setArtwork(art);}
 const target=new THREE.WebGLCubeRenderTarget(256,{type:THREE.HalfFloatType});const cube=new THREE.CubeCamera(.02,12,target);cube.position.set(0,-.35,0);pedestal.visible=mirror.visible=floorGlow.visible=false;try{cube.update(renderer,scene);}finally{pedestal.visible=mirror.visible=floorGlow.visible=true;}scene.environment=target.texture;this.environmentTarget=target;
 }};
}
