export const JUMP=Object.freeze({height:.18,gravity:4.2,launchSpeed:Math.sqrt(2*4.2*.18),landingTime:.16});
export function groundedJump(){return {height:0,velocity:0,airborne:false,age:0,landAge:1};}
export function launchJump(state){return state.airborne?state:{height:0,velocity:JUMP.launchSpeed,airborne:true,age:0,landAge:1};}
export function advanceJump(state,dt){
 dt=Math.max(0,dt);if(!state.airborne)return {...state,landAge:Math.min(1,state.landAge+dt)};
 const height=state.height+state.velocity*dt-.5*JUMP.gravity*dt*dt,velocity=state.velocity-JUMP.gravity*dt;
 if(height<=0&&velocity<0)return {height:0,velocity:0,airborne:false,age:0,landAge:0};
 return {...state,height:Math.max(0,height),velocity,age:state.age+dt};
}
