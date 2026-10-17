import * as THREE from 'three';
import {JUMP} from './jump.js';
export class CC0MotionPlayer{
 constructor(vrm,data,legLength){
  this.data=data;this.mixer=new THREE.AnimationMixer(vrm.scene);this.actions={};this.clips={};
  const hips=vrm.humanoid.getNormalizedBoneNode('hips'),base=hips.position.clone(),ratio=legLength/data.legLength;
  for(const [name,c] of Object.entries(data.clips)){
   const tracks=[];for(const [bone,values] of Object.entries(c.rotations)){const node=vrm.humanoid.getNormalizedBoneNode(bone);if(node)tracks.push(new THREE.QuaternionKeyframeTrack(node.uuid+'.quaternion',c.times,values));}
   const isJump=name.startsWith('Jump_');const positions=c.hips.map((v,i)=>(isJump?0:v*ratio)+base.getComponent(i%3));tracks.push(new THREE.VectorKeyframeTrack(hips.uuid+'.position',c.times,positions));
   const clip=new THREE.AnimationClip(name,c.duration,tracks);this.clips[name]=clip;this.actions[name]=this.mixer.clipAction(clip).setLoop(isJump?THREE.LoopOnce:THREE.LoopRepeat,isJump?1:Infinity).play();if(isJump){this.actions[name].paused=true;this.actions[name].clampWhenFinished=true;}
  }
  this.reset();
 }
 static async load(vrm,legLength){const data=await Promise.all(['quaternius-locomotion.json','quaternius-jump.json'].map(async file=>{const response=await fetch(new URL('../assets/animations/'+file,import.meta.url));if(!response.ok)throw Error('CC0 motion unavailable');return response.json();}));return new CC0MotionPlayer(vrm,{...data[0],clips:{...data[0].clips,...data[1].clips}},legLength);}
 reset(){for(const [name,a] of Object.entries(this.actions))a.reset().play().setEffectiveWeight(name==='Idle_Loop'?1:0);this.mixer.setTime(0);this.activeClip='Idle_Loop';this.fastBlend=0;this.lastBlend=0;}
 update(dt,blend,fast,jump){
  if(blend>.02&&this.lastBlend<=.02){this.actions.Walk_Loop.reset();this.actions.Jog_Fwd_Loop.reset();}
  this.fastBlend=THREE.MathUtils.damp(this.fastBlend,fast?1:0,8,dt);this.lastBlend=blend;
  const ease=x=>{const q=THREE.MathUtils.clamp(x,0,1);return q*q*(3-2*q);},air=jump?.airborne,jumpWeight=air?ease(jump.age/.08):jump?1-ease(jump.landAge/JUMP.landingTime):0,walkWeight=1-jumpWeight;
  this.actions.Idle_Loop.setEffectiveWeight((1-blend)*walkWeight).setEffectiveTimeScale(1);
  this.actions.Walk_Loop.setEffectiveWeight(blend*(1-this.fastBlend)*walkWeight).setEffectiveTimeScale(1.15);
  this.actions.Jog_Fwd_Loop.setEffectiveWeight(blend*this.fastBlend*walkWeight).setEffectiveTimeScale(1.25);
  const loop=air?ease((jump.age-.10)/.10):0;for(const [name,weight,t]of [['Jump_Start',air?(1-loop)*jumpWeight:0,Math.min(1,(jump?.age||0)/.16)],['Jump_Loop',air?loop*jumpWeight:0,((jump?.age||0)*1.5)%1],['Jump_Land',air?0:jumpWeight,Math.min(1,(jump?.landAge??1)/JUMP.landingTime)]]){const action=this.actions[name];action.enabled=true;action.paused=true;action.setEffectiveWeight(weight);action.time=t*this.clips[name].duration;}
  this.jumpWeight=jumpWeight;this.mixer.update(dt);this.activeClip=jumpWeight>.5?(air?(loop>.5?'Jump_Loop':'Jump_Start'):'Jump_Land'):blend<.05?'Idle_Loop':this.fastBlend>.5?'Jog_Fwd_Loop':'Walk_Loop';
  this.phase=this.actions.Walk_Loop.time/this.clips.Walk_Loop.duration*Math.PI*2;
 }
 dispose(){this.mixer.stopAllAction();}
}
// Sole samples come from the supplied VRM's actual skinned boot vertices.
export function footContacts(vrm,floorY){
 vrm.scene.updateMatrixWorld(true);const wanted=new Set(['leftFoot','leftToes','rightFoot','rightToes'].map(n=>vrm.humanoid.getRawBoneNode(n)).filter(Boolean)),groups=new Map();
 vrm.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const index=mesh.geometry.attributes.skinIndex,weight=mesh.geometry.attributes.skinWeight;if(!index||!weight)return;
  for(let i=0;i<index.count;i++){let k=0;for(let j=1;j<4;j++)if(weight.getComponent(i,j)>weight.getComponent(i,k))k=j;if(weight.getComponent(i,k)<.7)continue;const bone=mesh.skeleton.bones[index.getComponent(i,k)];if(!wanted.has(bone))continue;const p=mesh.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(mesh.matrixWorld);if(p.y>floorY+.012)continue;if(!groups.has(bone))groups.set(bone,[]);p.mesh=mesh;p.vertexIndex=i;groups.get(bone).push(p);}
 });
 const probes=[];for(const [bone,points] of groups){const selected=new Set();for(let i=0;i<12;i++){const x=Math.cos(i*Math.PI/6),z=Math.sin(i*Math.PI/6);let best=points[0];for(const p of points)if(p.x*x+p.z*z>best.x*x+best.z*z)best=p;selected.add(best);}selected.add(points.reduce((a,b)=>a.y<b.y?a:b));for(const p of selected)probes.push({mesh:p.mesh,index:p.vertexIndex});}
 if(!probes.length)throw Error('No VRM sole contacts found');return probes;
}
