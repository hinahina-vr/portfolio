// Deterministic lighting choreography: pause, seek and sixty-second loop agree.
export function roomMotion(seconds){const t=((seconds%60)+60)%60,p=t*Math.PI/30;return {ceremonyPhase:p,keyX:-1.25+.16*Math.sin(p),keyZ:1.10+.14*Math.cos(p),keyY:.72+.05*Math.sin(p*2),fillX:1.1+.12*Math.cos(p),fillZ:-1.2+.16*Math.sin(p),keyIntensity:3+.12*Math.sin(p*2),fillIntensity:3+.10*Math.cos(p*2)};}
