import React,{useEffect,useRef} from 'react';
import {mountClearwater} from './ClearwaterRenderer.js';

export default function ClearwaterCanvas({paused,values,onReady,onCompileError}){
  const canvas=useRef(null),renderer=useRef(null),callbacks=useRef({onReady,onCompileError});
  callbacks.current={onReady,onCompileError};
  useEffect(()=>{
    const fail=message=>{canvas.current.dataset.error=message;canvas.current.style.display='none';callbacks.current.onCompileError?.();};
    try{renderer.current=mountClearwater(canvas.current,{paused,onReady:()=>callbacks.current.onReady?.(),onError:fail});}
    catch(error){fail(error?.message||'WebGL2 floating-point rendering unavailable');canvas.current.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();}
    return()=>{renderer.current?.dispose();renderer.current=null;};
  },[]);
  useEffect(()=>renderer.current?.setPaused(paused),[paused]);
  useEffect(()=>{for(const [key,value]of Object.entries(values))renderer.current?.setValue(key,value);},[values]);
  return <div className="water-fusion-stage"><canvas ref={canvas} className="clearwater-canvas" aria-hidden="true"/></div>;
}
