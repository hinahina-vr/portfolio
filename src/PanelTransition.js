import * as THREE from 'three';
import {motionType} from './MotionType.js';

// One viewport-sized GPU surface: the sheets leave their layout slots and
// sweep across the whole screen before settling into the opaque resting frame.
let renderer;
const vertexShader = `
  uniform float curl;
  uniform float time;
  uniform float layer;
  uniform vec2 size;
  uniform vec2 center;
  uniform float rotation;
  varying vec2 imageUv;
  varying float light;
  void main() {
    imageUv = uv;
    float angle = (uv.x - .5) * curl;
    float radius = 2.0 / max(abs(curl), .001);
    float x = abs(curl) < .001 ? position.x : sin(angle) * radius;
    float z = (1.0 - cos(angle)) * radius;
    float flex = sin(uv.x * 7.0 - time * 8.0) * sin(uv.y * 3.14159);
    float strength = min(abs(curl), 1.0);
    float y = position.y * (1.0 - strength * .09) + flex * strength * .075;
    x += sin(uv.y * 4.0 + time * 5.0) * strength * .035;
    float perspective = 1.0 / (1.0 + z * .22);
    light = .56 + .44 * abs(cos(angle));
    vec2 p = vec2(x, y) * perspective * size;
    p = mat2(cos(rotation), sin(rotation), -sin(rotation), cos(rotation)) * p;
    gl_Position = vec4(p + center, -.2 * z + layer, 1.0);
  }
`;
const fragmentShader = `
  uniform sampler2D picture;
  uniform vec2 crop;
  uniform float opacity;
  varying vec2 imageUv;
  varying float light;
  void main() {
    vec2 uv = (imageUv - .5) * crop + .5;
    vec3 color = texture2D(picture, uv).rgb;
    // Grazing light makes the curved display read as a surface, not a dissolve.
    color = color * light + vec3(.065, .085, .09) * pow(1.0 - light, 2.0);
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
export function transitionPanel(surface, previous, reduced, previousRect, previousTitle) {
  if (!previous || reduced.matches) return () => {};
  const incoming = surface.querySelector('img');
  const outgoing = previous.cloneNode();
  outgoing.alt = '';
  outgoing.setAttribute('aria-hidden', 'true');
  outgoing.className = 'panel-outgoing';
  surface.append(outgoing);
  let frame, stopped = false, meshes = [], animations = [];
  let cleanType=()=>{};
  const clean = () => {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    incoming.style.visibility = '';
    surface.style.visibility = '';
    animations.forEach(animation=>animation.cancel());
    cleanType();
    outgoing.remove();
    renderer?.domElement.remove();
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      mesh.material.uniforms.picture.value.dispose();
      mesh.material.dispose();
    }
    delete surface.dataset.transition;
    reduced.removeEventListener('change', clean);
    window.removeEventListener('resize', clean);
  };
  reduced.addEventListener('change', clean);
  window.addEventListener('resize', clean);
  surface.dataset.transition = 'loading';
  Promise.all([incoming.decode(), previous.decode()]).then(() => {
    if (stopped || !surface.isConnected) return clean();
    try {
      renderer ||= new THREE.WebGLRenderer({alpha:true, antialias:true});
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(innerWidth, innerHeight);
      renderer.setClearColor(0x030708, 0);
      renderer.domElement.className = 'panel-canvas';
      renderer.domElement.setAttribute('aria-hidden', 'true');
      const scene = new THREE.Scene();
      const camera = new THREE.Camera();
      const sheet = (img, layer) => {
        const texture = new THREE.Texture(img);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        const ratio = img.naturalWidth / img.naturalHeight / 1.6;
        const material = new THREE.ShaderMaterial({
          vertexShader, fragmentShader, transparent:true, side:THREE.DoubleSide,
          depthTest:false, depthWrite:false,
          uniforms:{picture:{value:texture},crop:{value:new THREE.Vector2(Math.min(1,1/ratio),Math.min(1,ratio))},curl:{value:0},time:{value:0},layer:{value:layer},opacity:{value:1},size:{value:new THREE.Vector2()},center:{value:new THREE.Vector2()},rotation:{value:0}}
        });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2,128,32),material);
        meshes.push(mesh);
        scene.add(mesh);
        return material.uniforms;
      };
      const next = sheet(incoming, .1), old = sheet(previous, 0);
      document.body.append(renderer.domElement);
      const targetRect=incoming.getBoundingClientRect();
      const placement=rect=>({x:(rect.x+rect.width/2)/innerWidth*2-1,y:1-(rect.y+rect.height/2)/innerHeight*2,w:rect.width/innerWidth,h:rect.height/innerHeight});
      const origin=placement(previousRect||targetRect),target=placement(targetRect);
      incoming.style.visibility = 'hidden';
      surface.style.visibility = 'hidden';
      outgoing.remove();
      surface.dataset.transition = 'rolling';
      const start = performance.now();
      cleanType=motionType(previousTitle,document.querySelector('.project-title'));
      const smooth = t => {t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
      const animate=(selector,keyframes)=>{const element=document.querySelector(selector);if(element)animations.push(element.animate(keyframes,{duration:1800,easing:'cubic-bezier(.22,.72,.2,1)',fill:'both'}));};
      animate('.site-header',[{transform:'none'},{transform:'perspective(1000px) translateY(-9vh) rotateX(38deg) scaleX(.88)',offset:.35},{transform:'perspective(1000px) translateY(4px) rotateX(-3deg)',offset:.8},{transform:'none'}]);
      animate('.collection',[{transform:'none'},{transform:'perspective(1000px) translateY(12vh) rotateX(-32deg) scaleX(.85)',offset:.35},{transform:'perspective(1000px) translateY(-5px) rotateX(3deg)',offset:.8},{transform:'none'}]);
      animate('.project-info',[{opacity:0,transform:'perspective(1000px) translateX(40vw) rotateY(-65deg) scaleX(.6)'},{opacity:0,transform:'perspective(1000px) translateX(25vw) rotateY(-45deg)',offset:.35},{opacity:1,transform:'perspective(1000px) translateX(-8px) rotateY(3deg)',offset:.85},{opacity:1,transform:'none'}]);
      animate('.art-stage',[{transform:'none'},{transform:'scale(1.14) skewY(-2deg)',offset:.45},{transform:'none'}]);
      const tick = now => {
        if (stopped) return;
        const t = Math.min(1, (now - start) / 1800);
        const depart=smooth(t/.68),arrive=smooth((t-.2)/.8);
        old.curl.value = depart * 5.8;
        next.curl.value = (1-arrive) * -5.8;
        old.opacity.value = 1-smooth((t-.52)/.16);
        next.opacity.value = smooth((t-.18)/.12);
        old.size.value.set(origin.w*(1+Math.sin(depart*Math.PI)*1.1),origin.h*(1+Math.sin(depart*Math.PI)*1.1));
        old.center.value.set(origin.x-depart*2.8,origin.y+Math.sin(depart*Math.PI)*.55);
        old.rotation.value=depart*.5;
        const swell=Math.sin(arrive*Math.PI)*.8;
        next.size.value.set(target.w*(1+swell),target.h*(1+swell));
        next.center.value.set(target.x+(1-arrive)*2.8,target.y-Math.sin(arrive*Math.PI)*.35);
        next.rotation.value=-(1-arrive)*.48;
        old.time.value = next.time.value = t;
        renderer.render(scene, camera);
        if (t < 1) frame = requestAnimationFrame(tick);
        else clean();
      };
      frame = requestAnimationFrame(tick);
    } catch { clean(); }
  }).catch(clean);
  return clean;
}
