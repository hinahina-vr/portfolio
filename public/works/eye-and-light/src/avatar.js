import * as THREE from 'three';
import {advanceJump,groundedJump,launchJump} from './jump.js';
import {makeAvatarUnlit} from './avatar-material.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {EYE_PROXIMITY} from './gaze.js';
import {INSTALLATION} from './installation.js';
import {AVATAR_HEIGHT,WALK_SPEED,FAST_SPEED} from './gait.js';
import {CC0MotionPlayer,footContacts} from './cc0-motion.js';
import {movementVector,walkStep} from './locomotion.js';
const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight']);
const up=new THREE.Vector3(0,1,0),solePoint=new THREE.Vector3(),tempQ=new THREE.Quaternion(),euler=new THREE.Euler();
export class AvatarWalker{
 constructor(scene,canvas,canInput){
  this.root=new THREE.Group();this.root.name='Visitor — supplied VRM';scene.add(this.root);
  this.position=this.root.position;this.keys=new Set();this.touchKeys=new Set();this.inputKeys=new Set();this.canvas=canvas;this.canInput=canInput;this.ready=false;
  this.firstPerson=false;this.fpsYaw=0;this.fpsPitch=-.15;this.yaw=0;this.pitch=.27;this.distance=.9;this.walkPhase=0;this.walkBlend=0;this.clock=0;
  this.followTarget=new THREE.Vector3();this.followDesired=new THREE.Vector3();this.followHead=new THREE.Vector3();this.followLook=new THREE.Vector3();this.followDirection=new THREE.Vector3();
  this.velocity=new THREE.Vector3();this.legs={};this.hair=[];this.signal=new AbortController();const options={signal:this.signal.signal};
  document.addEventListener('keydown',e=>{if(!movementKeys.has(e.code)||!canInput()||e.target.closest('button,input,select,textarea,a,[contenteditable]'))return;e.preventDefault();this.keys.add(e.code);},options);
  document.addEventListener('keyup',e=>this.keys.delete(e.code),options);
  window.addEventListener('blur',()=>this.clear(),options);document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();},options);
  canvas.addEventListener('pointerdown',e=>{if(!canInput()||e.button!==0||this.pointer)return;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});},options);
  canvas.addEventListener('pointermove',e=>{const p=this.pointer;if(!p||p.id!==e.pointerId||!canInput())return;if(this.firstPerson){this.fpsYaw-=(e.clientX-p.x)*.005;this.fpsPitch=THREE.MathUtils.clamp(this.fpsPitch+(e.clientY-p.y)*.003,-1.25,1.25);}else{this.yaw-=(e.clientX-p.x)*.005;this.pitch=THREE.MathUtils.clamp(this.pitch+(e.clientY-p.y)*.003,-.22,.65);}p.x=e.clientX;p.y=e.clientY;this.cameraDirty=24;},options);
  const release=e=>{if(this.pointer?.id===e.pointerId)this.pointer=null;};for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release,options);
  canvas.addEventListener('wheel',e=>{if(!canInput())return;e.preventDefault();this.distance=THREE.MathUtils.clamp(this.distance+e.deltaY*.0008,.9,1.85);this.cameraDirty=24;},{...options,passive:false});
  this.reset();
 }
 clear(){this.velocity?.set(0,0,0);this.keys.clear();this.touchKeys.clear();this.inputKeys.clear();const id=this.pointer?.id;this.pointer=null;if(id!==undefined&&this.canvas.hasPointerCapture(id))this.canvas.releasePointerCapture(id);this.canvas.dispatchEvent(new Event('avatarinputclear',{bubbles:true}));document.querySelectorAll("[data-move].held").forEach(b=>b.classList.remove("held"));}
 jump(){if(!this.ready||!this.canInput()||this.jumpState.airborne)return false;this.jumpState=launchJump(this.jumpState);return true;}
 reset(){this.clear();this.jumpState=groundedJump();this.position.set(0,INSTALLATION.floorY,EYE_PROXIMITY.normalDistance);this.root.rotation.y=Math.PI;this.firstPerson=false;this.fpsYaw=0;this.fpsPitch=-.15;this.yaw=0;this.pitch=.27;this.distance=.9;this.walkPhase=this.walkBlend=0;this.cameraPosition=null;this.cameraDirty=24;this.root.updateMatrixWorld(true);this.vrm?.springBoneManager?.reset();if(this.motion){this.motion.reset();this.groundFeet();this.vrm.update(0);}}
 async prepare(onProgress=()=>{}){
  const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));
  const gltf=await loader.loadAsync(new URL('../assets/avatar.vrm',import.meta.url).href,onProgress);
  const vrm=this.vrm=gltf.userData.vrm;if(!vrm)throw Error('VRM avatar unavailable');VRMUtils.rotateVRM0(vrm);
  for(const material of vrm.materials)makeAvatarUnlit(material);
  this.root.add(vrm.scene);vrm.scene.updateMatrixWorld(true);
  // Lower the actual normalized arms from the file's T pose, regardless of their local axes.
  for(const side of ['left','right']){
   const bone=vrm.humanoid.getNormalizedBoneNode(side+'UpperArm'),end=vrm.humanoid.getNormalizedBoneNode(side+'LowerArm');
   if(!bone||!end)continue;
   const from=end.getWorldPosition(new THREE.Vector3()).sub(bone.getWorldPosition(new THREE.Vector3())).normalize();
   const to=new THREE.Vector3(side==='left'?.12:-.12,-1,.03).normalize();
   const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());
   const q=new THREE.Quaternion().setFromUnitVectors(from,to);
   bone.quaternion.premultiply(parent.clone().invert().multiply(q).multiply(parent));
   vrm.scene.updateMatrixWorld(true);
  }
  vrm.update(0);vrm.scene.updateMatrixWorld(true);
  for(const side of ['left','right']){
   const local=name=>vrm.scene.worldToLocal(vrm.humanoid.getNormalizedBoneNode(side+name).getWorldPosition(new THREE.Vector3()));
   const hip=local('UpperLeg'),knee=local('LowerLeg'),ankle=local('Foot');
   this.legs[side]={upper:hip.distanceTo(knee),lower:knee.distanceTo(ankle),down:hip.y-ankle.y,forward:ankle.z-hip.z};
  }
  const box=new THREE.Box3().setFromObject(vrm.scene,true),height=box.max.y-box.min.y,scale=AVATAR_HEIGHT/height;
  vrm.scene.scale.multiplyScalar(scale);this.modelScale=vrm.scene.scale.y;this.legLength=(this.legs.left.upper+this.legs.left.lower+this.legs.right.upper+this.legs.right.lower)/2;this.root.updateMatrixWorld(true);
  // Measure deformed vertices after scale; world bounds already include the parent's floor offset.
  const grounded=new THREE.Box3().setFromObject(vrm.scene,true);vrm.scene.position.y+=INSTALLATION.floorY-grounded.min.y;this.root.updateMatrixWorld(true);
  vrm.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;o.castShadow=false;o.receiveShadow=false;}});
  // Rebase springs after grounding/scaling. Root-relative simulation prevents travel/turning from flinging hair.
  const springs=vrm.springBoneManager;
  if(springs){for(const joint of [...springs.joints]){
   if(/Hair/i.test(joint.bone.name)){this.hair.push({bone:joint.bone,q:joint.bone.quaternion.clone()});springs.deleteJoint(joint);continue;}
   joint.center=this.root;joint.settings.hitRadius*=this.modelScale;joint.settings.gravityPower*=this.modelScale;joint.settings.stiffness*=this.modelScale;
  }springs.setInitState();springs.reset();}
  this.soleContacts=footContacts(vrm,INSTALLATION.floorY);this.motion=await CC0MotionPlayer.load(vrm,this.legLength);vrm.expressionManager?.setValue('happy',.08);this.ready=true;this.animate(0);this.restModelY=vrm.scene.position.y;return this;
 }
 groundFeet(){
  if(!this.soleContacts?.length)return;this.vrm.humanoid.update();this.root.updateMatrixWorld(true);let lowest=Infinity;
  for(const contact of this.soleContacts)lowest=Math.min(lowest,contact.mesh.getVertexPosition(contact.index,solePoint).applyMatrix4(contact.mesh.matrixWorld).y);
  this.groundCorrection=INSTALLATION.floorY-lowest;this.vrm.scene.position.y+=this.groundCorrection;this.root.updateMatrixWorld(true);
 }
 animate(dt){
  if(!this.ready)return;this.clock+=dt;const b=this.walkBlend;
  this.motion.update(dt,b,this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'),this.jumpState);this.walkPhase=this.motion.phase||0;
  if(this.jumpState.airborne)this.vrm.scene.position.y=this.restModelY;else this.groundFeet();
  // Unstable hair springs are replaced with a tiny bounded sway that preserves the authored shape.
  this.hair.forEach((h,i)=>h.bone.quaternion.copy(h.q).multiply(tempQ.setFromEuler(euler.set(.003*Math.sin(this.clock*1.7+i*.12)+.009*b*Math.sin(this.walkPhase-i*.18),0,.004*b*Math.sin(this.walkPhase*.5+i*.15)))));
  const blink=this.clock%4.9;this.vrm.expressionManager?.setValue('blink',Math.max(0,1-Math.abs(blink-.14)/.14));
  const steps=Math.max(1,Math.ceil(dt*60));for(let i=0;i<steps;i++)this.vrm.update(dt/steps);
 }
 update(dt,active){
  if(!this.ready)return false;if(!active){if(this.keys.size||this.touchKeys.size)this.clear();this.velocity.set(0,0,0);return false;}
  this.jumpState=advanceJump(this.jumpState,dt);this.position.y=INSTALLATION.floorY+this.jumpState.height;
  this.inputKeys.clear();for(const key of this.keys)this.inputKeys.add(key);for(const key of this.touchKeys)this.inputKeys.add(key);
  const delta=movementVector(this.inputKeys,this.firstPerson?this.fpsYaw:this.yaw),speed=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?FAST_SPEED:WALK_SPEED;
  this.velocity.x=THREE.MathUtils.damp(this.velocity.x,delta.x*speed,14,dt);this.velocity.z=THREE.MathUtils.damp(this.velocity.z,delta.z*speed,14,dt);
  if(!this.inputKeys.size&&this.velocity.length()<.002)this.velocity.set(0,0,0);
  const next=walkStep(this.position,{x:this.velocity.x*dt,z:this.velocity.z*dt});
  const dx=next.x-this.position.x,dz=next.z-this.position.z,travelled=Math.hypot(dx,dz);this.position.x=next.x;this.position.z=next.z;
  const moving=travelled>1e-6;this.walkBlend=THREE.MathUtils.damp(this.walkBlend,moving?1:0,12,dt);
  if(moving){const q=new THREE.Quaternion().setFromAxisAngle(up,Math.atan2(dx,dz));this.root.quaternion.slerp(q,1-Math.exp(-14*dt));}
  this.moving=moving;this.animate(dt);return true;
 }
 follow(camera,dt=1/60,snap=false,immersion=0,manual=0){
  const target=this.followTarget.copy(this.position);target.y+=.32;
  const horizontal=Math.cos(this.pitch)*this.distance;
  const desired=this.followDesired.set(Math.sin(this.yaw)*horizontal,Math.sin(this.pitch)*this.distance,Math.cos(this.yaw)*horizontal).add(target);
  desired.x=THREE.MathUtils.clamp(desired.x,-INSTALLATION.halfWidth+.07,INSTALLATION.halfWidth-.07);desired.z=THREE.MathUtils.clamp(desired.z,INSTALLATION.backZ+.12,INSTALLATION.frontZ-.12);desired.y=THREE.MathUtils.clamp(desired.y,INSTALLATION.floorY+.08,.91);
  if(!this.cameraPosition)this.cameraPosition=desired.clone();else if(snap)this.cameraPosition.copy(desired);else this.cameraPosition.lerp(desired,1-Math.exp(-10*dt));
  this.cameraPosition.x=THREE.MathUtils.clamp(this.cameraPosition.x,-INSTALLATION.halfWidth+.08,INSTALLATION.halfWidth-.08);this.cameraPosition.z=THREE.MathUtils.clamp(this.cameraPosition.z,INSTALLATION.backZ+.08,INSTALLATION.frontZ-.08);// Contact and F share the same continuous move into the avatar head.
  // Keep the third-person follow state separate: changing direction has no stale blend.
  const head=this.followHead;const bone=this.vrm?.humanoid.getRawBoneNode('head');
  if(bone)bone.getWorldPosition(head);else head.copy(this.position).y+=.30;
  const automatic=THREE.MathUtils.clamp(immersion,0,1);const amount=manual===0?automatic:manual===1?1:automatic+(1-automatic)*manual;
  camera.position.copy(this.cameraPosition).lerp(head,amount);
  const look=this.followLook.copy(target).multiplyScalar(1-amount);
  if(manual>0){const direction=this.followDirection.set(-Math.sin(this.fpsYaw)*Math.cos(this.fpsPitch),-Math.sin(this.fpsPitch),-Math.cos(this.fpsYaw)*Math.cos(this.fpsPitch));direction.multiplyScalar(Math.max(.6,Math.hypot(head.x,head.z))).add(head);look.lerp(direction,manual);}camera.lookAt(look);
  this.cameraTransition={amount,thirdPerson:this.cameraPosition.toArray(),head:head.toArray(),look:look.toArray(),position:camera.position.toArray(),firstPerson:amount===1};const baseFov=THREE.MathUtils.clamp(2*Math.atan(Math.tan(55*Math.PI/360)/Math.min(1,camera.aspect))*180/Math.PI,55,84);
  const firstFov=THREE.MathUtils.clamp(2*Math.atan(Math.tan(85*Math.PI/360)/Math.min(1,camera.aspect))*180/Math.PI,85,115);
  camera.fov=THREE.MathUtils.lerp(baseFov,firstFov,amount);camera.updateProjectionMatrix();
 }
 fadeForFirstPerson(amount){
  if(!this.ready)return;
  if(!this.fadeMaterials){this.fadeMaterials=new Map();this.root.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[]))if(!this.fadeMaterials.has(m))this.fadeMaterials.set(m,{opacity:m.opacity,transparent:m.transparent,depthWrite:m.depthWrite,alphaTest:m.alphaTest});});}
  for(const [m,base] of this.fadeMaterials){const fading=amount>0,transparent=fading||base.transparent;if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}m.opacity=base.opacity*(1-amount);m.depthWrite=fading?false:base.depthWrite;m.alphaTest=fading?0:base.alphaTest;}
 }
 dispose(){this.signal.abort();this.motion?.dispose();this.clear();}
}
