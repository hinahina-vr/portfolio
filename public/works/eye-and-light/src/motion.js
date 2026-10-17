export const BLINK_PATTERNS={
 normal:{label:'ふつうの瞬き',pulses:[{offset:0,close:.15,hold:.07,open:.23,depth:1}]},
 slow:{label:'ゆっくり閉じる',pulses:[{offset:0,close:.48,hold:.10,open:.72,depth:1}]},
 double:{label:'二度瞬き',pulses:[{offset:0,close:.11,hold:.045,open:.16,depth:1},{offset:.425,close:.12,hold:.04,open:.20,depth:1}]},
 soft:{label:'浅い瞬き',pulses:[{offset:0,close:.18,hold:.06,open:.30,depth:.55}]},
 restful:{label:'長めに閉じる',pulses:[{offset:0,close:.24,hold:.52,open:.62,depth:1}]}
};
export const EYE_SCENE={id:'eye-and-light',duration:30,fps:60,breathsPerLoop:5,beatsPerLoop:30,blinkEvents:[{start:5.05,pattern:'normal'},{start:10.1,pattern:'slow'},{start:16.3,pattern:'double'},{start:21.9,pattern:'soft'},{start:26.4,pattern:'restful'}]};
const smooth=(a,b,x)=>{const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);};
export function patternBlink(pattern,elapsed){let value=0;for(const p of BLINK_PATTERNS[pattern].pulses){const t=elapsed-p.offset;value=Math.max(value,p.depth*smooth(0,p.close,t)*(1-smooth(p.close+p.hold,p.close+p.hold+p.open,t)));}return value;}
// Slow, bounded pupil changes; integer harmonics keep the thirty-second loop continuous.
export function pupilMotion(seconds){const t=((seconds%30)+30)%30,a=2*Math.PI*t/30;return {pupilScale:1+.065*Math.sin(a*2)+.025*Math.sin(a*3+.7),pupilX:.0016*Math.sin(a*2)+.0006*Math.sin(a*5),pupilY:.0010*Math.sin(a*3)+.00035*Math.sin(a*5)};}
export function meditationMotion(seconds){const t=((seconds%30)+30)%30,phase=2*Math.PI*t/30;let blink=0;for(const event of EYE_SCENE.blinkEvents){blink=Math.max(blink,patternBlink(event.pattern,((t-event.start)%30+30)%30));}return {...pupilMotion(seconds),phase,breath:.5+.5*Math.sin(phase*5),heartbeat:Math.exp(-Math.pow(Math.sin(phase*15),2)*80),gazeX:.006*Math.sin(phase*3)+.002*Math.sin(phase*2),gazeY:.003*Math.sin(phase*2),blink};}
export function meditationCamera(seconds){const a=2*Math.PI*(((seconds%60)+60)%60)/60,yaw=.98*Math.pow(Math.sin(a),3),r=2.38;return {position:[r*Math.sin(yaw),.14+.035*Math.sin(2*a),r*Math.cos(yaw)],target:[0,-.12,0]};}

export function meditationRoomCamera(seconds){const a=2*Math.PI*(((seconds%60)+60)%60)/60,yaw=.12*Math.pow(Math.sin(a),3),r=2.85;return {position:[r*Math.sin(yaw),.12+.015*Math.sin(2*a),r*Math.cos(yaw)],target:[0,-.06,-.10]};}

export function meditationFov(base,aspect){return Math.max(base,2*Math.atan(Math.tan(35*Math.PI/360)/Math.max(.1,aspect))*180/Math.PI);}
