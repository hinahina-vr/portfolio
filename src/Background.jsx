import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import FluidFxCanvas from './reference/FluidFxCanvas';
import ShaderCanvas from './reference/ShaderCanvas';
import ClearwaterCanvas from './ClearwaterCanvas.jsx';
import {featuredEffects} from './reference/effects/featured';
import {aquaticEffects} from './reference/effects/aquatic';

// Creator's original effects and renderers; see reference/PROVENANCE.md for the pause fix.
const effects=[...featuredEffects,...aquaticEffects];
const choose=id=>effects.find(effect=>effect.id===id)||effects.find(effect=>effect.id==='lilian-kaleido-loom');
const defaults=effect=>Object.fromEntries(effect.controls.map(control=>[control.id,control.id==='pipeline'?false:control.defaultValue]));

export function mountBackground(element,onState){
  const probe=document.createElement('canvas');
  let supported;
  try{const gl=probe.getContext('webgl2');supported=!!gl;gl?.getExtension('WEBGL_lose_context')?.loseContext();}catch{supported=false;}
  if(!supported){document.querySelector('#art-stage').classList.add('no-webgl');onState({available:false});return{setScene(){},setPaused(){},setValue(){}};}
  const root=createRoot(element);
  let update;
  const pending={scene:'lilian-kaleido-loom',paused:false,values:{}};
  function Background(){
    const [state,setState]=useState({...pending});
    const [hidden,setHidden]=useState(document.hidden);
    update=setState;
    const effect=useMemo(()=>choose(state.scene),[state.scene]);
    const values=useMemo(()=>({...defaults(effect),...state.values}),[effect,state.values]);
    useEffect(()=>{const listener=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',listener);return()=>document.removeEventListener('visibilitychange',listener);},[]);
    const Renderer=effect.renderer==='three-fluid'?FluidFxCanvas:ShaderCanvas;
    return <><ClearwaterCanvas paused={state.paused||hidden} values={values}/><Renderer effect={effect} values={values} paused={state.paused||hidden} quality="balanced" onReady={()=>onState({available:true,ready:true,scene:effect.id})} onStats={stats=>onState({fps:stats.fps})} onCompileError={()=>{document.querySelector('#art-stage').classList.add('no-webgl');onState({available:false});}}/></>;
  }
  root.render(<Background/>);
  const change=partial=>{Object.assign(pending,partial);update?.(previous=>({...previous,...partial}));};
  return{
    setScene(id){change({scene:id,values:{}});const effect=choose(id);return{title:effect.title,accent:effect.accentColor,values:defaults(effect)};},
    setPaused(paused){change({paused});},
    setValue(key,value){change({values:{...pending.values,[key]:value}});}
  };
}
