import { makeEffect, rangeControl, toggleControl } from './glsl'

export const featuredEffects = [
  makeEffect({
    id: 'fluid-chrome-stream',
    title: 'Gesture Cut Field',
    titleJa: 'ジェスチャーカット場',
    categoryId: 'interactive',
    description: 'A pointer and camera-reactive field of sliced pressure plates, built on three-fluid-fx without chrome ribbons.',
    descriptionJa: 'three-fluid-fxで、手とポインターが圧力プレートを切り裂くインタラクティブ場。',
    accentColor: '#5eead4',
    tags: ['three-fluid-fx', 'gesture', 'cuts', 'pressure', 'interactive', 'fluid-style-8', 'gpgpu-particles'],
    renderer: 'three-fluid',
    extraControls: [toggleControl('pipeline', 'Pipeline TSL / GLSL', 'uUseTsl', false)],
    field: `
vec2 q = p;
q *= rot(-0.38);
q.y += t * (0.06 + uMotion * 0.03);
float fault = sin(q.x * (8.0 + uDetail * 1.2) + q.y * 1.3 + fbm(q * 1.4) * 1.8);
float plate = stroke(fault, 0.08) * (0.55 + fbm(q * 2.2) * 0.45);
float incision = lineGlow(sin(q.x * 24.0 - q.y * 5.0 + t * 0.7), 0.028);
float grid = stroke(sin(p.x * 7.0) * sin(p.y * 5.0), 0.13) * 0.18;
v += plate * 0.72 + incision * 0.34 + grid;
`,
    warp: 'p *= 1.0;',
    color: `mix(vec3(0.005, 0.008, 0.012), vec3(0.16, 0.2, 0.23), shade * 0.72) + uPrimary * shade * 0.26`,
    post: `
float scan = pow(1.0 - abs(sin((uv.y + uv.x * 0.05) * 34.0 - iTime * 0.7)), 14.0);
color += vec3(0.02, 0.26, 0.32) * scan * 0.065;
color = min(color, vec3(0.74, 0.82, 0.86));
`,
    intensity: 1.18,
    motion: 1.05,
    detail: 2.45,
  }),
  makeEffect({
    id: 'lilian-kaleido-loom',
    title: 'Lilian Kaleido Loom',
    titleJa: 'リリアン万華織',
    categoryId: 'interactive',
    description: 'A faint aqua loom breathes at rest; thick mirrored currents stream outward and open restrained coral accents at their knots.',
    descriptionJa: '淡い青緑の織り目から太い鏡映流が外周へ流れ、節だけに抑えたコーラルの差し色が花のように開く。',
    accentColor: '#43d9e6',
    tags: ['three-fluid-fx', 'lilian', 'braid', 'kaleidoscope', 'mirror', 'interactive', 'fluid-style-11'],
    renderer: 'three-fluid',
    extraControls: [toggleControl('pipeline', 'Pipeline TSL / GLSL', 'uUseTsl', false)],
    field: `
float radius = length(p);
float angle = atan(p.y, p.x);
float spiralBreath = 0.5 + 0.5 * sin(t * 0.19);
float spiralTurn = radius * (0.43 + spiralBreath * 0.12);
spiralTurn += sin(radius * 3.8 - t * 0.34) * 0.075;
spiralTurn += t * 0.046 * smoothstep(0.1, 1.25, radius);
angle += spiralTurn;
float sector = 6.2831853 / 5.0;
float folded = abs(mod(angle + sector * 0.5, sector) - sector * 0.5);
float radialDepth = smoothstep(0.04, 1.34, radius);
float depthPhase = fract(radius * 0.9 - t * (0.24 + uMotion * 0.05));
float approachFront = exp(-pow(abs(depthPhase - 0.5) / 0.14, 2.0));
float depthLens = mix(1.22, 0.68, radialDepth) * (1.0 - approachFront * 0.1);
float depthWidth = mix(0.72, 1.34, radialDepth) * (1.0 + approachFront * 0.24);
float projectedRadius = radius + approachFront * radialDepth * 0.038;
vec2 loom = vec2(projectedRadius, folded * radius * 5.0 * depthLens);
float fiberWarp = fbm(loom * vec2(1.8, 1.15) + vec2(-t * 0.082, t * 0.036));
float twist = loom.x * (24.0 + uDetail * 1.8) - t * (1.3 + uMotion * 0.46) + fiberWarp * 2.2;
float spineA = loom.y - 0.24 - sin(loom.x * 5.2 - t * 0.32) * 0.055;
float spineB = loom.y - 0.66 + sin(loom.x * 3.8 + t * 0.26) * 0.075;
float spineC = loom.y - 1.08 - sin(loom.x * 2.8 - t * 0.19) * 0.095;
float brushWidth = depthWidth * 1.5;
float strandA = lineGlow(spineA - sin(twist) * 0.052, 0.034 * brushWidth);
float strandB = lineGlow(spineA + sin(twist) * 0.052, 0.034 * brushWidth);
float strandC = lineGlow(spineB - cos(twist * 0.74) * 0.07, 0.041 * brushWidth);
float strandD = lineGlow(spineC - sin(twist * 0.58 + 1.2) * 0.074, 0.029 * brushWidth);
float strandE = lineGlow(spineC + sin(twist * 0.58 + 1.2) * 0.074, 0.029 * brushWidth);
float tubeA = 1.0 - smoothstep(0.055 * brushWidth, 0.18 * brushWidth, abs(spineA));
float tubeB = 1.0 - smoothstep(0.068 * brushWidth, 0.215 * brushWidth, abs(spineB));
float tubeC = 1.0 - smoothstep(0.054 * brushWidth, 0.18 * brushWidth, abs(spineC));
vec2 needleGrid = vec2(
  loom.x * (14.0 + uDetail * 1.35) - t * (0.66 + uMotion * 0.2),
  loom.y * (3.7 + uDetail * 0.14) + sin(loom.x * 5.4 + fiberWarp * 2.0) * 0.22
);
vec2 needleCell = fract(needleGrid) - 0.5;
float needleSeed = hash21(floor(needleGrid) + vec2(17.3, 41.7));
needleCell.x += (needleSeed - 0.5) * 0.16;
float needleLength = 0.34 + radialDepth * 0.08 + approachFront * 0.07;
float needles = exp(-pow(abs(needleCell.x) / needleLength, 6.0) - pow(abs(needleCell.y) / (0.071 * brushWidth), 2.0));
needles *= step(0.14, needleSeed);
float centerLock = smoothstep(0.045, 0.18, radius);
float depthLight = mix(0.46, 1.0, radialDepth);
float frontWeave = approachFront * (tubeA * 0.42 + tubeB * 0.28 + tubeC * 0.18 + needles * 0.1);
v += (tubeA * 0.34 + tubeB * 0.24 + tubeC * 0.16 + strandA * 0.62 + strandB * 0.56 + strandC * 0.48 + strandD * 0.34 + strandE * 0.34 + needles * 0.26 + frontWeave * 0.2) * centerLock * depthLight;
`,
    warp: 'p *= 1.0;',
    color: `
float coolPulse = 0.5 + 0.5 * sin(shade * 3.8 + uv.x * 0.7 - uv.y * 0.5 + iTime * 0.08);
vec3 fiber = mix(vec3(0.035, 0.5, 0.64), vec3(0.32, 0.92, 0.84), coolPulse);
vec3 deep = mix(vec3(0.002, 0.009, 0.014), vec3(0.008, 0.045, 0.055), smoothstep(0.02, 0.72, shade));
float blossom = pow(max(0.0, sin(shade * 8.2 + uv.x * 4.0 - uv.y * 2.8 - iTime * 0.22)), 8.0);
vec3 petal = mix(vec3(0.96, 0.18, 0.28), vec3(1.0, 0.46, 0.34), coolPulse * 0.46);
deep + fiber * shade * 0.68 + uPrimary * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.2 + petal * blossom * shade * 0.16
`,
    post: `
float silk = pow(clamp(shade, 0.0, 1.0), 2.8);
color += vec3(0.05, 0.32, 0.34) * silk * 0.12;
color = min(color, vec3(0.78, 0.94, 0.96));
`,
    intensity: 1.2,
    motion: 1.16,
    detail: 3.15,
  }),
  makeEffect({
    id: 'chrome-liquid-audio',
    title: 'Audio Rail Reactor',
    titleJa: '音圧レールリアクター',
    categoryId: 'interactive',
    description: 'A one-direction audio reactor where bass, mids, treble, and beat drive separate rail layers.',
    descriptionJa: '低音・中域・高音・拍を別レイヤーの一方向レールに割り当てた音反応インタラクション。',
    accentColor: '#38bdf8',
    tags: ['audio', 'music', 'rails', 'spectrum', 'three-fluid-fx', 'interactive', 'fluid-style-9', 'gpgpu-particles'],
    audioReactive: true,
    renderer: 'three-fluid',
    extraControls: [toggleControl('pipeline', 'Pipeline TSL / GLSL', 'uUseTsl', false)],
    field: `
float bass = iAudio.x;
float mid = iAudio.y;
float treble = iAudio.z;
float beat = iAudio.w;
vec2 q = p;
q.x -= t * (0.18 + bass * 0.08 + mid * 0.05);
float lane = sin(q.y * 5.0);
float lowRail = lineGlow(lane, 0.18 + bass * 0.075) * (0.22 + bass * 0.9);
float flowWindow = smoothstep(0.08, 0.3, fract(q.x * 7.5)) * (1.0 - smoothstep(0.62, 0.96, fract(q.x * 7.5)));
float midRail = lineGlow(sin(q.y * 10.0), 0.05) * flowWindow * (0.16 + mid * 0.76);
float ticks = step(0.9 - treble * 0.18, hash21(floor(vec2(q.x * 38.0, q.y * 18.0))));
float beatPunch = lowRail * beat;
v += lowRail * 0.72 + midRail * 0.54 + ticks * treble * 0.18 + beatPunch * 0.38;
`,
    warp: `
p *= 1.0;
`,
    color: `vec3(0.004, 0.007, 0.012) + mix(vec3(0.035, 0.045, 0.055), vec3(0.52, 0.7, 0.78), smoothstep(0.08, 1.25, shade)) * shade * mask + uPrimary * pow(clamp(shade, 0.0, 1.0), 2.1) * (0.16 + iAudio.z * 0.18)`,
    post: `
color += vec3(0.08, 0.42, 0.52) * iAudio.y * shade * 0.08;
color += vec3(0.78, 0.94, 1.0) * iAudio.z * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.08;
color += uPrimary * iAudio.w * mask * 0.045;
color = min(color, vec3(0.82, 0.9, 0.94));
`,
    intensity: 1.16,
    motion: 1.12,
    detail: 2.55,
  }),
  makeEffect({
    id: 'ricochet-return-field',
    title: 'Ricochet Return Field',
    titleJa: '乱反射リターン場',
    categoryId: 'interactive',
    description: 'Pointer and hand cuts release danmaku-like glass shots that ricochet through fluid lanes, then return to the source.',
    descriptionJa: '手とポインターで撃った小さな光弾が弾幕のように散り、鏡面流体レーンで反射して入力点へ戻る。',
    accentColor: '#7dd3fc',
    tags: ['three-fluid-fx', 'ricochet', 'return-lines', 'mirror', 'interactive', 'fluid-style-10', 'gpgpu-particles'],
    renderer: 'three-fluid',
    extraControls: [
      toggleControl('pipeline', 'Pipeline TSL / GLSL', 'uUseTsl', false),
      rangeControl('particles', 'Particles / 粒子', 'uParticles', 0, 2, 0.01, 0.16),
    ],
    field: `
vec2 q = p;
q *= rot(-0.1);
q.x -= t * (0.035 + uMotion * 0.012);
float glassWarp = fbm(q * vec2(1.35, 2.0) + vec2(t * 0.012, 1.7));
float laneA = lineGlow(sin(q.y * 8.5 + q.x * 1.55 + glassWarp * 1.35), 0.038);
float laneB = lineGlow(sin(q.y * 14.0 - q.x * 2.1 - t * 0.22), 0.022);
vec2 orbit = q - vec2(sin(t * 0.18) * 0.46, cos(t * 0.13) * 0.22);
float angle = atan(orbit.y, orbit.x);
float radius = length(orbit);
float ring = lineGlow(sin(radius * 28.0 - t * 1.05 + glassWarp * 2.0), 0.034) * smoothstep(0.08, 0.75, radius);
float spokes = pow(abs(sin(angle * 8.0 + radius * 2.4 - t * 0.55)), 14.0) * smoothstep(0.18, 0.9, radius);
float pressure = smoothstep(0.5, 0.96, glassWarp) * 0.16;
v += laneA * 0.3 + laneB * 0.22 + ring * 0.18 + spokes * 0.1 + pressure;
`,
    warp: 'p *= 1.0;',
    color: `mix(vec3(0.004, 0.008, 0.014), vec3(0.045, 0.09, 0.12), shade * 0.82) + uPrimary * shade * 0.32`,
    post: `
float sheen = pow(clamp(shade, 0.0, 1.0), 2.35);
color += vec3(0.08, 0.34, 0.42) * sheen * 0.12;
color = min(color, vec3(0.72, 0.88, 0.94));
`,
    intensity: 1.12,
    motion: 1.08,
    detail: 2.5,
  }),
  makeEffect({
    id: 'harp-strings',
    title: 'Touch Prism Panel',
    titleJa: 'タッチプリズムパネル',
    categoryId: 'interactive',
    description: 'A hand-reactive optical panel that opens prismatic cuts and pressure blooms where the camera sees motion.',
    descriptionJa: 'カメラで手を拾い、触れた場所にプリズム状の切れ目と圧力ブルームを開くパネル。',
    accentColor: '#f5d0fe',
    tags: ['hand', 'camera', 'prism', 'panel', 'interactive'],
    field: `
vec2 hand = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 mouse = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float mouseActive = step(0.001, length(iMouse.zw));
vec2 contact = mix(hand, mouse, mouseActive);
float press = max(iHand.w * smoothstep(0.02, 0.5, abs(iHand.z)), mouseActive * 0.55);
vec2 local = p - contact;
float panel = stroke(sdBox(p * vec2(0.74, 1.0), vec2(1.05, 0.72)), 0.045);
vec2 prism = p;
prism *= rot(0.42 + sin(t * 0.12) * 0.08);
float cutA = lineGlow(sin(prism.x * (5.0 + uDetail) + prism.y * 2.1), 0.035);
float cutB = lineGlow(sin(prism.y * (6.0 + uDetail * 0.7) - prism.x * 1.7), 0.045);
float touchBloom = exp(-dot(local, local) * 7.5) * (0.22 + press * 1.15);
float shock = lineGlow(length(local) - fract(t * 0.55) * 0.72, 0.04) * press;
float facets = (cutA * 0.38 + cutB * 0.28) * (0.5 + panel);
v += panel * 0.28 + facets + touchBloom + shock * 0.55;
`,
    warp: 'p *= 1.0;',
    post: `
color += vec3(0.018, 0.026, 0.038) * (1.0 - length(uv) * 0.35);
color += vec3(0.18, 0.27, 0.36) * pow(shade, 2.2) * 0.24;
`,
  }),
]
