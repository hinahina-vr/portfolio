import * as THREE from 'three';
export const SANCTUARY={haloRadii:[.517,.543],nimbusRadii:[.552,.581],displayWidth:1.22,displayHeight:.70,mandalaRadius:2.70};
const hdr=(r,g,b)=>new THREE.Color(r,g,b);
const vertex=`varying vec2 vUv;varying vec3 world;void main(){vUv=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
function labelTexture(){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;const c=canvas.getContext('2d');
 const text=(str,x,y,size,color='#c4d0da',tracking=0)=>{c.font=`400 ${size}px Arial,sans-serif`;c.fillStyle=color;for(const char of str){c.fillText(char,x,y);x+=c.measureText(char).width+tracking;}};
 text('RHYTHM',280,172,28,'#ffffff',6);
 const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.NoColorSpace;t.anisotropy=8;return t;
}
// The artwork, contrast and respiratory lanes are shared by walls and their signals.
export const installationFieldShader=`
vec3 installationArtwork(vec3 position,float surface){
 vec2 uv=vec2((position.x+position.z)*.22+.5,position.y*.53+.35);if(surface>.5)uv=position.xz*.22+.5;
 uv+=vec2(.002*sin(phase),.002*cos(phase));
 vec2 graphicUV=vec2((position.x+position.z)*.38+.5,position.y*.38+.35);if(surface>.5)graphicUV=position.xz*.38+.5;
 vec2 firstUV=mix(uv,graphicUV,step(1.5,paintStyle)),secondUV=mix(uv,graphicUV,step(1.5,nextPaintStyle));
 if(paintStyle>2.5)firstUV=vec2(.5)+fract(firstUV)*.5-vec2(0.,.5);
 if(nextPaintStyle>2.5)secondUV=vec2(.5)+fract(secondUV)*.5-vec2(0.,.5);
 vec3 art=texture2D(artwork,firstUV).rgb;
 if(artMix>0.)art=mix(art,texture2D(nextArtwork,secondUV).rgb,artMix);
 return art;
}
vec3 installationInk(vec3 art){
 float paper=smoothstep(.24,.66,dot(art,vec3(.2126,.7152,.0722)));
 return mix(vec3(.78,.68,.95),vec3(.24,.16,.34),paper);
}
vec2 installationLanes(vec3 position){
 float along=(position.x+position.z)/1.22,u=fract(along*2.-phase*30./6.283185307179586);
 float ecg=.006*sin(u*6.283185307179586)-.032*exp(-pow((u-.40)/.024,2.))+.115*exp(-pow((u-.46)/.018,2.))-.055*exp(-pow((u-.50)/.025,2.));
 return vec2(.229+ecg*.70,.068+.0238*sin(along*6.283185307179586*1.4-phase*5.));
}
float installationStroke(float distance,float width){return 1.-smoothstep(width,width+max(fwidth(distance),.0007),abs(distance));}
`;
const panelFragment=`uniform sampler2D labels;uniform float phase,ceremonyPhase,breath,beat,offset;uniform sampler2D artwork,nextArtwork;uniform float artMix,paintStyle,nextPaintStyle;uniform vec3 wallOffset;varying vec2 vUv;varying vec3 world;
${installationFieldShader}
const float TAU=6.283185307179586;
vec3 linearRGB(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
void main(){vec3 surfacePosition=world-wallOffset;vec2 edge=min(vUv,1.-vUv);
 vec2 lanes=installationLanes(surfacePosition);
 float thin=installationStroke(surfacePosition.y-lanes.x,.0008)*.74+installationStroke(surfacePosition.y-lanes.y,.0008)*.55;
 float scan=.5+.5*cos((surfacePosition.x+surfacePosition.z)*3.-phase*2.+offset);
 float hot=installationStroke(surfacePosition.y-lanes.x,.0012)*pow(scan,8.)*.36;
 // Only engraved strokes exist. The empty surface is exactly transparent.
 vec3 art=installationArtwork(surfacePosition,0.),ink=installationInk(art);
 vec4 label=texture2D(labels,vUv);
 float fade=smoothstep(.015,.20,edge.x)*smoothstep(.015,.18,edge.y);
 float alpha=clamp(thin*.70+hot*.48+label.a*.20,0.,.72)*fade*(.92+.08*breath);
 gl_FragColor=vec4(linearRGB(ink),alpha);
#include <colorspace_fragment>
}`;
const floorFragment=`uniform float ceremonyPhase,breath,beat,ceiling;varying vec2 vUv;
const float TAU=6.283185307179586;
float stroke(float d,float width){return 1.-smoothstep(width,width+max(fwidth(d),.0008),abs(d));}
void main(){vec2 p=(vUv-.5)*5.6;float r=length(p),a=atan(p.y,p.x);float engraving=0.,flow=0.;
 // Concentric layers move independently; the base engraving remains registered.
 engraving+=stroke(r-.86,.0016)*.20+stroke(r-1.03,.0011)*.16+stroke(r-2.58,.0012)*.14;
 for(int i=0;i<4;i++){float k=float(i),radius=1.15+k*.37,theta=a+ceremonyPhase*(mod(k,2.)<.5?1.:-1.)+k*.8;
 float sectors=step(.17,fract(theta/TAU*(5.+k)));float gate=step(fract(theta/TAU*2.),.34);
 engraving+=stroke(r-radius,.0016)*sectors*.34;flow+=stroke(r-radius,.003)*pow(max(0.,cos(theta-k*.7)),24.)*.85;
 float ticks=step(.86,fract(theta/TAU*(84.+k*12.)));engraving+=stroke(r-radius-.025,.007)*ticks*.14;
 flow+=stroke(r-radius-.075,.0015)*gate*.14;
 }
 float petal=1.78+.045*cos(a*12.+ceremonyPhase);engraving+=stroke(r-petal,.0012)*.22;
 float angle=fract(a/TAU*12.);float radial=stroke(angle-.5,.004)*step(1.15,r)*step(r,2.43);engraving+=radial*.08;
 float ripple=fract(ceremonyPhase/TAU*2.)*1.7+.88;flow+=exp(-pow((r-ripple)/.055,2.))*.045*pow(sin(fract(ceremonyPhase/TAU*2.)*3.141592653589793),2.);
 vec3 rgb=vec3(1.45,1.16,2.05)*engraving+vec3(2.0,1.55,2.9)*flow;rgb*=mix(1.,.60,ceiling)*(.90+.10*breath);float alpha=clamp(max(max(rgb.r,rgb.g),rgb.b),0.,.72);
 gl_FragColor=vec4(rgb,mix(.60,.36,ceiling));
#include <colorspace_fragment>
}`;
export function createSanctuary(parent,uniforms,layout,wallUniforms){
 const root=new THREE.Group();root.name='Sanctuary — cinematic light chamber';parent.add(root);
 const halo=new THREE.Group();halo.name='LED sphere luminous halo';root.add(halo);
 const haloVertex=`varying vec3 n,v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=-p.xyz;gl_Position=projectionMatrix*p;}`;
 const haloFragment=`uniform float breath,beat,strength;varying vec3 n,v;void main(){float rim=pow(clamp(1.-abs(dot(normalize(n),normalize(v))),0.,1.),3.);gl_FragColor=vec4(vec3(3.7,2.25,5.)*(.94+.06*breath+.025*beat),rim*strength);
#include <colorspace_fragment>
}`;
 SANCTUARY.haloRadii.forEach((radius,i)=>{const m=new THREE.ShaderMaterial({vertexShader:haloVertex,fragmentShader:haloFragment,uniforms:{breath:uniforms.breath,beat:uniforms.beat,strength:{value:i?.11:.53}},side:THREE.BackSide,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});const shell=new THREE.Mesh(new THREE.SphereGeometry(radius,96,64),m);shell.name='Omnidirectional atmospheric rim '+i;shell.renderOrder=2;halo.add(shell);});
 const nimbus=new THREE.Group();nimbus.name='Double nimbus behind LED sphere';halo.add(nimbus);
 SANCTUARY.nimbusRadii.forEach((radius,i)=>{const m=new THREE.MeshBasicMaterial({color:hdr(2.4,1.8,3.4),transparent:true,opacity:i?.46:.76,depthWrite:false});const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,i?.00065:.0012,6,256),m);ring.position.z=-.09;ring.name='Nimbus luminous circle '+i;nimbus.add(ring);});
 const mandalas=[];for(const [name,y,flip]of [['Floor',layout.floorY+.004,-1],['Ceiling',layout.ceilingY-.004,1]]){const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:floorFragment,uniforms:{ceremonyPhase:uniforms.ceremonyPhase,breath:uniforms.breath,beat:uniforms.beat,ceiling:{value:flip>0?1:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5.6,5.6),material);mesh.rotation.x=flip*Math.PI/2;mesh.position.y=y;mesh.name=name+' radial mandala';root.add(mesh);mandalas.push(mesh);}
 const textures=[labelTexture()],displays=[];
 const display=(x,z,yaw,index)=>{if(index%2)return;const material=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:panelFragment,uniforms:{wallOffset:{value:new THREE.Vector3(Math.sin(yaw)*.025,0,Math.cos(yaw)*.025)},artwork:wallUniforms.artwork,nextArtwork:wallUniforms.nextArtwork,artMix:wallUniforms.artMix,paintStyle:wallUniforms.paintStyle,nextPaintStyle:wallUniforms.nextPaintStyle,labels:{value:textures[0]},phase:uniforms.phase,ceremonyPhase:uniforms.ceremonyPhase,breath:uniforms.breath,beat:uniforms.beat,offset:{value:index*.63}},transparent:true,depthWrite:false});const mesh=new THREE.Mesh(new THREE.PlaneGeometry(SANCTUARY.displayWidth,SANCTUARY.displayHeight),material);mesh.position.set(x,.18,z);mesh.rotation.y=yaw;mesh.name='LED HEART / BREATH display';root.add(mesh);displays.push(mesh);};
 for(const x of [-1.65,1.65]){display(x,layout.backZ+.025,0,x<0?0:1);display(-x,layout.frontZ-.025,Math.PI,x<0?0:1);}
 for(const x of [-layout.halfWidth+.025,layout.halfWidth-.025])for(const [index,z]of [-2.8,-.55,1.7].entries())display(x,z,x<0?Math.PI/2:-Math.PI/2,index);

 return {root,halo,nimbus,mandalas,displays,textures,update(m){nimbus.rotation.z=.025*Math.sin(m.ceremonyPhase);}};
}
