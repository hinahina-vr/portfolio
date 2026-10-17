// Generated open/closed portraits, independent iris and room field share one atlas.
export const pixelArtShader=`
float pxBayer(vec2 cell){vec2 a=mod(floor(cell),2.),b=mod(floor(cell/2.),2.);return (4.*(2.*a.x+3.*a.y-4.*a.x*a.y)+(2.*b.x+3.*b.y-4.*b.x*b.y)+.5)/16.;}
vec3 pxPC98(vec3 c,float dither){
 c=clamp(c+(dither-.5)*.12,0.,1.);vec3 best=vec3(.055,.045,.12);float distance=100.;
 for(int i=0;i<16;i++){vec3 v;
 if(i==0)v=vec3(.055,.045,.12);else if(i==1)v=vec3(.12,.10,.26);else if(i==2)v=vec3(.22,.15,.40);else if(i==3)v=vec3(.36,.22,.50);
 else if(i==4)v=vec3(.16,.31,.42);else if(i==5)v=vec3(.20,.49,.52);else if(i==6)v=vec3(.39,.68,.65);else if(i==7)v=vec3(.63,.83,.78);
 else if(i==8)v=vec3(.65,.29,.49);else if(i==9)v=vec3(.87,.41,.63);else if(i==10)v=vec3(1.,.64,.73);else if(i==11)v=vec3(.62,.40,.45);
 else if(i==12)v=vec3(.84,.58,.55);else if(i==13)v=vec3(.97,.75,.65);else if(i==14)v=vec3(1.,.88,.77);else v=vec3(1.,.97,.88);
 float e=dot(c-v,c-v);if(e<distance){best=v;distance=e;}}
 return best;
}

vec3 pxAtlas(sampler2D atlas,vec2 uv,vec2 quadrant){
 uv=clamp(uv,vec2(.0016),vec2(.9984));
 return texture2D(atlas,vec2((uv.x+quadrant.x)*.5,1.-(uv.y+quadrant.y)*.5)).rgb;
}
vec3 pxField(sampler2D atlas,vec2 uv){return pxAtlas(atlas,fract(uv),vec2(1.,1.));}
vec3 pxEye(vec3 original,vec2 uv,vec2 center,vec2 halfEye,vec2 irisRadius,float closeY,float graphic,sampler2D atlas){
 vec2 d=uv-center;
 float ex=d.x/halfEye.x,arc=sqrt(max(0.,1.-ex*ex));
 float top=-halfEye.y*pow(arc,.70),bottom=halfEye.y*.86*pow(arc,.55);
 float aperture=step(abs(ex),1.)*step(top,d.y)*step(d.y,bottom);
 vec2 shift=gaze*vec2(.13,.09)*(1.-proximity);shift.y=-shift.y;
 vec2 irisUV=(d-shift)/irisRadius;
 float pupilWeight=1.-smoothstep(.25,.60,length(irisUV));
 irisUV=mix(irisUV,(irisUV-pupilOffset*18.)/pupilScale,pupilWeight);
 vec2 irisSample=vec2(.5)+irisUV*.435;
 float irisMask=step(length(irisUV),1.);
 vec3 sclera=graphic>.5?vec3(.02,.79,.84):vec3(1.,.966,.897);
 float originalIris=step(length(d/irisRadius),1.);
 float paintedWhite=step(.83,original.b)*step(.86,original.g);
 aperture*=graphic>.5?1.:max(originalIris,paintedWhite);
 vec3 opened=mix(original,sclera,aperture*originalIris);
 opened=mix(opened,pxAtlas(atlas,irisSample,vec2(0.,1.)),irisMask*aperture);
 // A painted eyelid rolls down continuously. Only the eye patch is affected.
 float line=closeY-center.y+.022*(1.-arc);
 float upper=mix(top,line,blink),lower=mix(bottom,line,smoothstep(.65,1.,blink));
 vec2 support=halfEye+vec2(graphic>.5?.11:.043,graphic>.5?.12:.045);
 float region=step(abs(d.x),support.x)*step(abs(d.y),support.y);
 float eyelidWeight=smoothstep(0.,.025,blink)*region;
 vec2 upperUV=uv+vec2(0.,line-upper);
 vec3 closed=pxAtlas(atlas,upperUV,vec2(1.,0.));
 float coverTop=step(d.y,upper)*eyelidWeight;
 vec3 rgb=mix(opened,closed,coverTop);
 rgb=mix(rgb,pxAtlas(atlas,uv+vec2(0.,bottom-lower),vec2(0.,0.)),step(lower,d.y)*eyelidWeight);
 // The last portion uses the registered generated closed-eye drawing.
 rgb=mix(rgb,pxAtlas(atlas,uv,vec2(1.,0.)),smoothstep(.88,1.,blink)*region);
 return rgb;
}
vec3 pixelLayer(vec3 p,float kind,sampler2D atlas){
 float mode=kind-3.,density=mode<.5?128.:mode<1.5?160.:mode<2.5?192.:64.;
 vec2 cell=floor(p.xy*density),point=(cell+.5)/density;
 vec2 center=vec2(.660,.400),halfEye=vec2(.105,.090),irisRadius=vec2(.071,.083);float closed=.425,graphic=0.;
 if(mode>.5&&mode<1.5){center=vec2(.686,.416);halfEye=vec2(.113,.087);irisRadius=vec2(.071,.083);closed=.442;}
 if(mode>1.5&&mode<2.5){center=vec2(.692,.410);halfEye=vec2(.114,.090);irisRadius=vec2(.074,.085);closed=.423;}
 if(mode>2.5){center=vec2(.5,.493);halfEye=vec2(.342,.157);irisRadius=vec2(.174,.177);closed=.546;graphic=1.;}
 float span=.5/mix(1.,graphic>.5?3.0:8.6,proximity);
 vec2 anchor=center+(vec2(.5)-center)*(1.-proximity)*(span/.5);
 vec2 uv=anchor+vec2(point.x,-point.y)*span;
 vec3 c=pxAtlas(atlas,uv,vec2(0.,0.));
 c=pxEye(c,uv,center,halfEye,irisRadius,closed,graphic,atlas);
 if(mode>.5&&mode<1.5)c=pxEye(c,uv,vec2(.325,.435),vec2(.105,.084),vec2(.068,.080),.461,0.,atlas);
 vec3 w=pow(abs(p),vec3(6.));w/=max(.001,w.x+w.y+w.z);
 vec3 field=pxField(atlas,p.yz*.45+.5)*w.x+pxField(atlas,p.zx*.45+.5)*w.y+pxField(atlas,p.xy*.45+.5)*w.z;
 float front=mix(smoothstep(.02,.65,p.z),1.,smoothstep(.45,1.,proximity));
 c=mix(field,c,front);
 if(mode<.5)return pxPC98(c,pxBayer(cell));
 return c;
}
`;
