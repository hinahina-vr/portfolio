import {chromium,expect} from '@playwright/test';
import {wringPoint,wringShapeGLSL,gripOffset} from '../src/WringShape.js';
import {sheetDrainage} from '../src/Drainage.js';
import {mkdir,writeFile} from 'node:fs/promises';
const output='qa/v2.6.1';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const page=await browser.newPage();const samples=[];for(let y=0;y<13;y++)for(let x=0;x<25;x++)samples.push([x/12-1,y/6-1]);
const states=[[0,0,0],[.4,12,.23],[1,30.6,0],[.65,8,-.18]];let worstError=0;
for(const [g,c,l] of states){const cpu=samples.map(([x,y])=>wringPoint(x,y,g,c,l));const gpu=await page.evaluate(({shader,samples,g,c,l})=>{
const gl=document.createElement('canvas').getContext('webgl2');if(!gl)throw Error('WebGL2 unavailable');
const compile=(type,code)=>{const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'#version 300 es\nprecision highp float;in vec2 position;uniform float gather,curl,gripLag;out vec3 result;'+shader+'\nvoid main(){result=wringPoint(position,gather,curl,gripLag);gl_Position=vec4(0.,0.,0.,1.);}'));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 color;void main(){color=vec4(1.);}'));gl.transformFeedbackVaryings(program,['result'],gl.INTERLEAVED_ATTRIBS);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
for(const [key,value] of Object.entries({gather:g,curl:c,gripLag:l}))gl.uniform1f(gl.getUniformLocation(program,key),value);
const input=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,input);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(samples.flat()),gl.STATIC_DRAW);const loc=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const output=gl.createBuffer();gl.bindBuffer(gl.TRANSFORM_FEEDBACK_BUFFER,output);gl.bufferData(gl.TRANSFORM_FEEDBACK_BUFFER,samples.length*3*4,gl.STREAM_READ);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,output);gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,samples.length);gl.endTransformFeedback();gl.disable(gl.RASTERIZER_DISCARD);const result=new Float32Array(samples.length*3);gl.getBufferSubData(gl.TRANSFORM_FEEDBACK_BUFFER,0,result);return Array.from(result);
},{shader:wringShapeGLSL,samples,g,c,l});cpu.forEach((p,i)=>{for(const [j,key]of ['x','y','z'].entries())worstError=Math.max(worstError,Math.abs(p[key]-gpu[i*3+j]));});
const rect={x:60,y:140,width:900,height:506.25};const outlets=sheetDrainage(rect,g,c,l);expect(outlets.reduce((sum,p)=>sum+p.flux,0)).toBe(49*25);for(const p of outlets.filter(p=>p.flux)){const point=wringPoint(p.u*2-1,p.v*2-1,g,c,l),perspective=1/(1+point.z*.22);expect(p.x).toBeCloseTo(rect.x+rect.width*(.5+point.x*perspective*.5),6);expect(p.y).toBeCloseTo(rect.y+rect.height*(.5-point.y*perspective*.5),6);}}
expect(worstError).toBeLessThan(.00002);
for(const [x,y]of samples){const p=wringPoint(x,y,0,0);expect(p.x).toBeCloseTo(x,10);expect(p.y).toBeCloseTo(y,10);expect(p.z).toBeCloseTo(0,10);}
const left=wringPoint(-.7,0,1,30.6),right=wringPoint(.7,0,1,30.6);expect(Math.abs(left.y-right.y)).toBeGreaterThan(.15);expect(gripOffset(400)).toBeGreaterThan(.1);expect(gripOffset(2650)).toBeLessThan(-.1);
const thickness=x=>{const ys=Array.from({length:101},(_,i)=>wringPoint(x,i/50-1,1,30.6).y);return Math.max(...ys)-Math.min(...ys);};expect(thickness(.18)).toBeLessThan(.06);expect(Math.abs(thickness(-.55)-thickness(.55))).toBeGreaterThan(.005);
await writeFile(`${output}/shape-results.json`,JSON.stringify({status:'PASS',worstError,left,right,thickness:[thickness(-.55),thickness(.18),thickness(.55)],checks:['GPU and drainage shapes agree','Gravity outlet flux conserved','Unequal grip heights and delayed release','Compressed off-centre neck','Flat endpoints exact']},null,2));console.log('PASS: GPU/CPU parity, asymmetric cloth shape, gravity outlet positions and flow conservation',worstError);
}finally{await browser.close();}
