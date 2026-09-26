// Art-directed wet-cloth deformation, not a collision/cloth solver.
// Keep the CPU drainage surface and GPU silhouette identical. GPU parity is
// checked in scripts/check-wring-shape.mjs using transform feedback.
export const wringShapeGLSL = `
vec3 wringPoint(vec2 p, float gather, float curl, float gripLag) {
  float u=(p.x+1.)*.5;
  float strength=clamp(abs(curl)/30.6,0.,1.);
  float collected=1.-pow(max(0.,1.-gather),.72+.55*(1.-u));
  float fold=p.y*7.2+.68*sin(p.x*3.7+.6)+.45*p.y*sin(p.x*6.1-1.);
  float bulk=.82+.18*sin(p.x*4.8+.7)+.10*sin(p.x*11.3-.4);
  float crossY=mix(p.y,bulk*(.14*sin(fold)+p.y*.035+.026*sin(p.y*14.+p.x*3.)),collected);
  float crossZ=collected*bulk*(.115*cos(fold)+.026*sin(p.y*19.+p.x*4.1));
  float neck=exp(-pow((p.x-.18-gripLag*.12)/.36,2.));
  float compression=(1.-strength*.82)*(1.-strength*.46*neck);
  float winding=u+.14*sin(3.14159265*u)+.045*sin(9.42477796*u+.3)*u*(1.-u);
  float angle=(winding-.58)*curl+collected*gripLag*2.8*(1.-u)*(1.-u);
  float y=(crossY*cos(angle)-crossZ*sin(angle))*compression;
  float z=(crossY*sin(angle)+crossZ*cos(angle))*compression;
  float x=p.x*(1.-collected*.14)+.035*collected*sin(2.7*p.x+1.)*sin(3.14159265*u);
  // Unequal grip heights and weight between them; folds are attached to the
  // material, rather than a travelling sine wave or a symmetric centre pinch.
  y+=collected*(-.08+.17*p.x-.16*(1.-p.x*p.x)*(1.-strength*.7)+.07*sin(p.x*3.+.8)*strength);
  z+=collected*(.055*sin(3.3*p.x-.4)+.045*p.x);
  return vec3(x,y,z);
}`;

export function wringPoint(px,py,gather,curl,gripLag=0){
  const u=(px+1)*.5,strength=Math.min(1,Math.abs(curl)/30.6);
  const collected=1-Math.pow(Math.max(0,1-gather),.72+.55*(1-u));
  const fold=py*7.2+.68*Math.sin(px*3.7+.6)+.45*py*Math.sin(px*6.1-1);
  const bulk=.82+.18*Math.sin(px*4.8+.7)+.10*Math.sin(px*11.3-.4);
  const crossY=py*(1-collected)+bulk*(.14*Math.sin(fold)+py*.035+.026*Math.sin(py*14+px*3))*collected;
  const crossZ=collected*bulk*(.115*Math.cos(fold)+.026*Math.sin(py*19+px*4.1));
  const neck=Math.exp(-Math.pow((px-.18-gripLag*.12)/.36,2));
  const compression=(1-strength*.82)*(1-strength*.46*neck);
  const winding=u+.14*Math.sin(Math.PI*u)+.045*Math.sin(3*Math.PI*u+.3)*u*(1-u);
  const angle=(winding-.58)*curl+collected*gripLag*2.8*(1-u)*(1-u);
  const y=(crossY*Math.cos(angle)-crossZ*Math.sin(angle))*compression+collected*(-.08+.17*px-.16*(1-px*px)*(1-strength*.7)+.07*Math.sin(px*3+.8)*strength);
  const z=(crossY*Math.sin(angle)+crossZ*Math.cos(angle))*compression+collected*(.055*Math.sin(3.3*px-.4)+.045*px);
  const x=px*(1-collected*.14)+.035*collected*Math.sin(2.7*px+1)*Math.sin(Math.PI*u);
  return {x,y,z};
}

export function gripOffset(elapsed){
  const ease=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),4);
  if(elapsed<2400)return ease(elapsed/1500)-ease((elapsed-180)/1720);
  const release=Math.max(0,Math.min(1,(elapsed-2400)/800));
  // The leading hand lets go first; the other retains its load briefly.
  return Math.pow(1-release,3.8)-Math.pow(1-release,2.1);
}
