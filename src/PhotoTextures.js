import * as THREE from 'three';

// Share decoded full-resolution pixels, but keep a bounded GPU cache per context.
const sources=new Map();
// Both WebGL contexts prepare the same work. Upload only one photo per frame.
let uploads=Promise.resolve();
function uploadPhoto(renderer,texture,isDisposed){
 const job=uploads.then(()=>new Promise(resolve=>requestAnimationFrame(resolve))).then(()=>{
  if(isDisposed()){texture.dispose();throw new Error('Photo cache disposed');}
  renderer.initTexture(texture);
 });
 uploads=job.catch(()=>{});return job;
}
export const photoKey=source=>new URL(typeof source==='string'?source:source.currentSrc||source.src,document.baseURI).href;
function retainSource(source){
 const key=photoKey(source);let entry=sources.get(key);
 if(!entry){
  entry={refs:0,promise:null};sources.set(key,entry);
  entry.promise=(async()=>{
   const image=typeof source==='string'?new Image():source;
   if(typeof source==='string'){image.decoding='async';image.src=key;}
   await image.decode();
   if(typeof createImageBitmap==='function'){
    try{return {image:await createImageBitmap(image,{imageOrientation:'flipY',premultiplyAlpha:'none',colorSpaceConversion:'none'}),bitmap:true};}catch{}
   }
   return {image,bitmap:false};
  })();
 }
 entry.refs++;
 return {promise:entry.promise,release(){if(--entry.refs===0){sources.delete(key);entry.promise.then(value=>{if(value.bitmap)value.image.close();}).catch(()=>{});}}};
}
export function photoTextures(renderer,limit=3){
 const entries=new Map();let active=new Set(),disposed=false;
 const trim=()=>{
  for(const [key,entry] of entries){
   if(entries.size<=limit)break;
   if(active.has(key)||!entry.ready)continue;
   entries.delete(key);entry.texture.dispose();entry.source.release();
  }
 };
 return {
  keep(sources){active=new Set(sources.filter(Boolean).map(photoKey));trim();},
  prepare(source){
   if(disposed)return Promise.reject(new Error('Photo cache disposed'));
   const key=photoKey(source);let entry=entries.get(key);
   if(entry){entries.delete(key);entries.set(key,entry);return entry.promise;}
   entry={source:retainSource(source),ready:false,texture:null,promise:null};entries.set(key,entry);
   entry.promise=entry.source.promise.then(async value=>{
    if(disposed)throw new Error('Photo cache disposed');
    const texture=new THREE.Texture(value.image);texture.colorSpace=THREE.SRGBColorSpace;
    // ImageBitmap has its Y orientation baked in by the off-thread decode.
    texture.flipY=!value.bitmap;texture.needsUpdate=true;entry.texture=texture;
    await uploadPhoto(renderer,texture,()=>disposed);
    entry.ready=true;trim();return texture;
   }).catch(error=>{if(entries.get(key)===entry){entries.delete(key);entry.source.release();}throw error;});
   return entry.promise;
  },
  dispose(){disposed=true;for(const entry of entries.values()){entry.texture?.dispose();entry.source.release();}entries.clear();}
 };
}
