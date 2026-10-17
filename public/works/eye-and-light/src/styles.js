export const PORTRAIT_STYLES=Object.freeze({
 cel:Object.freeze({id:'cel',label:'セルアニメ',open:'face-open-v7.png',closed:'face-closed-v7.png',background:'stardust.png',paint:0}),
 acrylic:Object.freeze({id:'acrylic',label:'アクリル絵の具',open:'face-open-acrylic-v1.png',closed:'face-closed-acrylic-v1.png',background:'acrylic-field-v1.png',paint:1}),
 graphic:Object.freeze({id:'graphic',label:'ポップグラフィック',open:'graphic-eye.svg',closed:'graphic-eye-closed.svg',background:'graphic-field.svg',paint:2}),
 pc98:Object.freeze({id:'pc98',label:'PC-98・16色ディザ',open:'pixel-pc98-atlas-v2.png',closed:'pixel-pc98-atlas-v2.png',background:'pixel-pc98-atlas-v2.png',paint:3,pixel:true}),
 adv90:Object.freeze({id:'adv90',label:'90年代ADV・暖色ドット',open:'pixel-adv90-atlas-v2.png',closed:'pixel-adv90-atlas-v2.png',background:'pixel-adv90-atlas-v2.png',paint:4,pixel:true}),
 novel00:Object.freeze({id:'novel00',label:'00年代ヒロイン・淡色ドット',open:'pixel-novel00-atlas-v2.png',closed:'pixel-novel00-atlas-v2.png',background:'pixel-novel00-atlas-v2.png',paint:5,pixel:true}),
 postpixel:Object.freeze({id:'postpixel',label:'ポストモダン・ネオピクセル',open:'pixel-postpixel-atlas-v2.png',closed:'pixel-postpixel-atlas-v2.png',background:'pixel-postpixel-atlas-v2.png',paint:6,pixel:true})
});
export function portraitStyle(id){if(id==null||id==='')return PORTRAIT_STYLES.cel;return Object.hasOwn(PORTRAIT_STYLES,id)?PORTRAIT_STYLES[id]:PORTRAIT_STYLES.cel;}
export const STYLE_CYCLE=Object.freeze({hold:20,fade:10,period:210});
// A complete pair is rebound only at an already identical endpoint.
export function styleFrame(seconds,count=Object.keys(PORTRAIT_STYLES).length){
 const period=count*(STYLE_CYCLE.hold+STYLE_CYCLE.fade),t=((seconds%period)+period)%period,index=Math.floor(t/30),local=t-index*30,q=Math.max(0,Math.min(1,(local-20)/10));
 return {index,next:(index+1)%count,mix:q*q*(3-2*q)};
}

export function nextPortraitStyle(id){const ids=Object.keys(PORTRAIT_STYLES),i=ids.indexOf(id);return ids[(Math.max(0,i)+1)%ids.length];}
