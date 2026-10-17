import {nextPortraitStyle} from './styles.js';
export const emptyIrisJourney=()=>({entered:false,spent:false,style:null,next:null});
// A full visit earns one new room. Re-entering the membrane cannot earn another.
export function irisJourney(state,before,after,style,advance=true){
 if(!advance)return {...state,next:null};
 if(after.portal===0)return emptyIrisJourney();
 const entered=state.entered||before.portal===1||after.portal===1;
 const origin=state.style??(entered?style:null);
 const returning=entered&&!state.spent&&!after.engaged;
 return {entered,spent:state.spent||returning,style:origin,next:returning?nextPortraitStyle(origin):null};
}
