// Add future avatars here. IDs stay stable; files resolve relative to this module.
export const AVATARS=Object.freeze([
 Object.freeze({id:'ginkgo',name:'まめまめ',shortName:'まめまめ',file:'../assets/avatar-ginkgo.vrm',thumbnail:'./assets/avatars/ginkgo.png',slot:'デフォルト'}),
 Object.freeze({id:'ferret',name:'ポン子3号',shortName:'ポン子3号',file:'../assets/avatar.vrm',thumbnail:'./assets/avatars/ferret.png',slot:'サブ'})
]);
export const DEFAULT_AVATAR=AVATARS[0];
export function avatarById(id){return AVATARS.find(a=>a.id===id)||null;}
