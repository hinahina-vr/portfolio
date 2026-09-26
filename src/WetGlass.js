// The same moving wet lenses are used on the flat image and its wringing mesh.
export const wetGlassGLSL=`
vec3 wetGlass(vec2 uv,float clock){
 vec3 wet=vec3(0.);
 for(int i=0;i<14;i++){
  float seed=fract(sin(float(i)*127.1+4.)*43758.5453);
  float age=fract(clock/(4.2+seed*3.)+seed);
  float x=(float(i)+.25+seed*.5)/14.;
  float y=1.08-age*age*1.3;
  vec2 d=(uv-vec2(x+sin(age*8.+seed*12.)*.004,y))*vec2(1.6,1.);
  float radius=.007+seed*.006;
  vec2 q=d/vec2(radius,radius*1.5);
  float body=1.-smoothstep(.65,1.,dot(q,q));
  float tail=exp(-abs(d.x)*1100.)*smoothstep(0.,.012,d.y)*(1.-smoothstep(.04,.12,d.y))*.3;
  float life=smoothstep(0.,.08,age)*(1.-smoothstep(.90,1.,age));
  wet.xy+=q*body*life;
  wet.z+= (pow(max(0.,1.-length(q-vec2(-.25,.35))*2.),6.)+tail)*life;
 }
 return wet;
}`;
