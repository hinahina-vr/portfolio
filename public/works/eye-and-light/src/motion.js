export const EYE_SCENE={id:'eye-and-light',duration:30,fps:60,breathsPerLoop:5,beatsPerLoop:30,blinkDuration:{close:.28,hold:.10,open:.46},blinkTimes:[5.2,12.8,21.4,27]};
const smooth=(a,b,x)=>{const q=Math.max(0,Math.min(1,(x-a)/(b-a)));return q*q*(3-2*q);};
export function meditationMotion(seconds){const t=((seconds%30)+30)%30,phase=2*Math.PI*t/30;let blink=0;for(const c of EYE_SCENE.blinkTimes){const d=t-c;blink=Math.max(blink,smooth(-.32,-.04,d)*(1-smooth(.06,.52,d)));}return {phase,breath:.5+.5*Math.sin(phase*5),heartbeat:Math.exp(-Math.pow(Math.sin(phase*15),2)*80),gazeX:.006*Math.sin(phase*3)+.002*Math.sin(phase*2),gazeY:.003*Math.sin(phase*2),blink};}
export function meditationCamera(seconds){const a=2*Math.PI*seconds/60,yaw=.98*Math.pow(Math.sin(a),3),r=2.38;return {position:[r*Math.sin(yaw),.14+.035*Math.sin(2*a),r*Math.cos(yaw)],target:[0,-.12,0]};}

export function meditationRoomCamera(seconds){const a=2*Math.PI*seconds/60,yaw=.12*Math.pow(Math.sin(a),3),r=2.6;return {position:[r*Math.sin(yaw),.12+.015*Math.sin(2*a),r*Math.cos(yaw)],target:[0,-.06,-.10]};}

export function meditationFov(base,aspect){return Math.max(base,2*Math.atan(Math.tan(35*Math.PI/360)/Math.max(.1,aspect))*180/Math.PI);}
