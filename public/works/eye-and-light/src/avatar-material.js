// Keep the VRM's MToon instances: expressions, UV animation, alpha masks,
// skinning and outlines continue to use the imported material bindings.
export function makeAvatarUnlit(material){
 if(material.userData.avatarUnlit)return;
 if(!material.isMToonMaterial)throw new Error('Unsupported avatar material: '+material.type);
 const compile=material.onBeforeCompile,programKey=material.customProgramCacheKey;
 material.onBeforeCompile=function(shader,renderer){
  compile.call(this,shader,renderer);
  const output='gl_FragColor = vec4( col, diffuseColor.a );';
  if(!shader.fragmentShader.includes(output))throw new Error('VRM Unlit shader output unavailable');
  shader.fragmentShader=shader.fragmentShader.replaceAll(output,`
    // Lighting-independent base colour, with authored alpha and outline intact.
    #ifdef OUTLINE
      col = outlineColorFactor.rgb;
    #else
      col = diffuseColor.rgb;
    #endif
    ${output}`);
 };
 material.customProgramCacheKey=function(){return programKey.call(this)+',avatar-unlit-v1';};
 material.userData.avatarUnlit=true;material.needsUpdate=true;
}
