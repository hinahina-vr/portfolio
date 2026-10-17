// Room coordinates are metres; the round plinth is a solid obstacle.
export const WALK_AREA={minX:-2.88,maxX:2.88,minZ:-4.04,maxZ:3.04,obstacleRadius:.76};
export function movementVector(keys,yaw){
 const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
 const z=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
 const length=Math.hypot(x,z)||1;
 return {x:(x*Math.cos(yaw)+z*Math.sin(yaw))/length,z:(z*Math.cos(yaw)-x*Math.sin(yaw))/length};
}
export function walkStep(position,delta){
 let x=Math.max(WALK_AREA.minX,Math.min(WALK_AREA.maxX,position.x+delta.x));
 let z=Math.max(WALK_AREA.minZ,Math.min(WALK_AREA.maxZ,position.z+delta.z));
 const d=Math.hypot(x,z),radius=WALK_AREA.obstacleRadius;
 if(d<radius){const angle=d>1e-7?Math.atan2(x,z):Math.atan2(position.x,position.z);x=Math.sin(angle)*radius;z=Math.cos(angle)*radius;}
 return {x,z};
}
