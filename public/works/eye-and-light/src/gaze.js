const clamp=(value,limit)=>Math.max(-limit,Math.min(limit,value));
// Gaze target retains its range; the iris approaches it with bounded speed.
export function gazeForAvatar(position,eyeYaw=0){
 const angle=Math.atan2(position.x,position.z);
 const relative=Math.atan2(Math.sin(angle-eyeYaw),Math.cos(angle-eyeYaw));
 const pitch=Math.atan2(position.y,Math.max(.05,Math.hypot(position.x,position.z)));
 return {yaw:angle,x:clamp(relative*1.05,.52),y:clamp(-pitch*.40,.14)};
}
export function followSphereYaw(current,target,dt){
 const difference=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 const seconds=Math.max(0,dt),step=difference*(1-Math.exp(-.55*seconds));
 return current+clamp(step,.32*seconds);
}

// Half of the 1.6 units/s nominal fast pursuit: no abrupt iris jumps.
export const PUPIL_SPEED=1.6*.5;
export function followPupil(current,target,dt){const seconds=Math.max(0,dt),dx=target.x-current.x,dy=target.y-current.y,d=Math.hypot(dx,dy);if(!seconds||!d)return {x:current.x,y:current.y};const fraction=Math.min(1-Math.exp(-12*seconds),PUPIL_SPEED*seconds/d);return {x:current.x+dx*fraction,y:current.y+dy*fraction};}

// Floor-plane distance is a direct spatial control, independent of head bob and camera.
// No temporal easing: stopping or reversing a step stops or reverses the enlargement.
export const EYE_PROXIMITY={normalDistance:2.05,fullDistance:.78};
export function eyeProximity(position){return Math.max(0,Math.min(1,(EYE_PROXIMITY.normalDistance-Math.hypot(position.x,position.z))/(EYE_PROXIMITY.normalDistance-EYE_PROXIMITY.fullDistance)));}

// Begin bending the view before physical contact, while preserving third person.
export const APPROACH_DISTORTION=Object.freeze({startDistance:2.05,fullDistance:.78,maxStrength:1.40});
export function approachDistortion(position){
 const a=APPROACH_DISTORTION,distance=Math.max(a.fullDistance,Math.hypot(position.x,position.z));
 const farField=1/(a.startDistance*a.startDistance),nearField=1/(a.fullDistance*a.fullDistance);
 return Math.max(0,Math.min(1,(1/(distance*distance)-farField)/(nearField-farField)))*a.maxStrength;
}
