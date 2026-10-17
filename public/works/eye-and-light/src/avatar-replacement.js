import {AvatarWalker} from './avatar.js';
import {INSTALLATION} from './installation.js';

const cameraProperties=['yaw','pitch','distance','fpsYaw','fpsPitch','firstPerson'];

// Own one replacement attempt. The current avatar stays available until the
// replacement has loaded and its renderer has prepared both material variants.
export class AvatarReplacement{
 constructor(current,scene,canvas){
  this.previous=current;
  this.next=new AvatarWalker(scene,canvas,()=>false);
  this.next.root.visible=false;
 }

 async prepare(config,onProgress){
  onProgress(5,'アバターを読み込んでいます');
  await this.next.prepare(event=>{
   if(event.lengthComputable)onProgress(5+65*event.loaded/event.total,'アバターを読み込んでいます');
  },config);
  this.transferPose();
 }

 transferPose(){
  const previous=this.previous,next=this.next;
  next.position.copy(previous.position);
  // A replacement starts grounded, even when the previous visitor was jumping.
  next.position.y=INSTALLATION.floorY;
  next.root.quaternion.copy(previous.root.quaternion);
  for(const key of cameraProperties)next[key]=previous[key];
  next.cameraPosition=previous.cameraPosition?.clone()||null;
  next.root.updateMatrixWorld(true);
  next.groundFeet();
  next.restModelY=next.vrm.scene.position.y;
 }

 activate(){
  this.previous.root.visible=false;
  this.next.root.visible=true;
  return this.next;
 }

 commit(){
  this.next.canInput=this.previous.canInput;
  this.previous.dispose();
 }

 rollback(){
  this.next.dispose();
 }
}
