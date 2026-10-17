import {WALK_AREA} from './locomotion.js';
export const CONTACT_IMMERSION={enterDistance:WALK_AREA.obstacleRadius+.001,exitDistance:WALK_AREA.obstacleRadius+.09,viewSpeed:1.8,portalSpeed:1.25,portalStartsAt:.7};
export const emptyContactImmersion=()=>({engaged:false,view:0,portal:0});
const towards=(value,target,step)=>value+Math.sign(target-value)*Math.min(Math.abs(target-value),step);
// Start only at the physical plinth. Hysteresis prevents contact jitter from retriggering.
export function contactImmersion(state,distance,dt,advance=true){
 if(!advance)return {...state};
 const seconds=Math.max(0,Math.min(.1,dt));
 const engaged=state.engaged?distance<CONTACT_IMMERSION.exitDistance:distance<=CONTACT_IMMERSION.enterDistance;
 const view=towards(state.view,engaged?1:0,seconds*CONTACT_IMMERSION.viewSpeed);
 const portal=towards(state.portal,engaged&&view>=CONTACT_IMMERSION.portalStartsAt?1:0,seconds*CONTACT_IMMERSION.portalSpeed);
 return {engaged,view,portal};
}
