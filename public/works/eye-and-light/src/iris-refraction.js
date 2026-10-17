// Refraction/total-internal-reflection loop adapted from pmndrs/drei,
// MeshRefractionMaterial.tsx by N8Programs. MIT, copyright (c) 2020 react-spring.
// See vendor/iris-refraction/LICENSE-drei.txt and docs/REFRACTION-SOURCES.md.
// The BVH mesh query is replaced with this site's analytic convex cut-gem intersection.
export const irisRefractionShader=`
vec4 irisGemHit(vec3 ro,vec3 rd){
 float nearest=1.e5;vec3 face=vec3(0.,0.,1.);
 // Thirty-two planar cuts enclose a convex optical volume. No triangle/BVH dependency.
 for(int i=0;i<32;i++){
  float k=float(i),y=1.-2.*(k+.5)/32.,r=sqrt(max(0.,1.-y*y));
  float a=k*2.39996322973;
  vec3 n=vec3(cos(a)*r,y,sin(a)*r);
  float denom=dot(rd,n);
  float t=(1.-dot(ro,n))/max(.00001,denom);
  if(denom>.00001&&t>.0001&&t<nearest){nearest=t;face=n;}
 }
 return vec4(face,nearest);
}
vec3 irisInternalReflection(vec3 entry,vec3 direction,vec3 normal,float ior){
 vec3 rayDirection=refract(direction,normal,1./ior);
 vec3 rayOrigin=entry+rayDirection*.002;
 for(int i=0;i<3;i++){
  vec4 hit=irisGemHit(rayOrigin,rayDirection);
  vec3 hitPos=rayOrigin+rayDirection*max(hit.w-.001,0.);
  vec3 exitDirection=refract(rayDirection,-hit.xyz,ior);
  if(length(exitDirection)>.0001){rayDirection=exitDirection;break;}
  rayDirection=reflect(rayDirection,hit.xyz);
  rayOrigin=hitPos+rayDirection*.002;
 }
 return normalize(rayDirection);
}
`;
