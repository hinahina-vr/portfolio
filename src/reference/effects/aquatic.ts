import { makeEffect } from './glsl'

export const aquaticEffects = [
  makeEffect({
    id: 'fish-school',
    title: 'Luminous Shoal',
    titleJa: '光群遊泳',
    categoryId: 'aquatic',
    description: 'A single current of prismatic swimmers resolves into a sweeping field of light.',
    descriptionJa: 'プリズム状の群れが一方向の潮流へ収束し、大きな光の弧を描く。',
    accentColor: '#69e8ff',
    tags: ['shoal', 'flow field', 'prismatic', 'directional', 'installation'],
    field: `
float shoal = 0.0;
vec2 touch = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float touchOn = step(0.001, length(iMouse.zw));
float swipe = clamp(iHand.z, -1.0, 1.0) * iHand.w;
float flowClock = t * 0.34 + sin(t * 0.62) * 0.2 + sin(t * 1.7) * 0.035;
for (int i = 0; i < 48; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 19.7));
  float depthZ = hash11(fi * 17.31 + 4.7);
  float live = step(fi, 34.0 + uDetail * 4.2);
  float member = mod(fi, 8.0);
  float school = floor(fi / 8.0);
  float lane = member;
  float travel = fract(school / 6.0 + member * 0.013 + seed.x * 0.035 + flowClock * (0.11 + depthZ * 0.085));
  float x = travel * 4.5 - 2.25;
  float arc = (lane - 3.5) * 0.105;
  arc += sin(x * (1.18 + lane * 0.045) - flowClock * 1.12 + lane * 0.78) * (0.2 - lane * 0.009);
  arc += sin(x * 2.7 + seed.x * 5.0) * 0.024;
  arc *= mix(0.68, 1.12, depthZ);
  vec2 pos = vec2(x, arc + (seed.y - 0.5) * mix(0.13, 0.055, depthZ));
  float wake = touchOn * exp(-pow(pos.y - touch.y, 2.0) * 9.0)
    * smoothstep(-0.1, 0.75, pos.x - touch.x)
    * (1.0 - smoothstep(0.9, 1.7, pos.x - touch.x));
  pos.y += (touch.y - arc) * wake * 0.18 + swipe * wake * 0.09;
  float slope = cos(x * (1.18 + lane * 0.06) - flowClock * 1.12 + lane * 0.92) * (0.21 - lane * 0.014);
  slope += cos(x * 2.7 + seed.x * 5.0) * 0.065;
  vec2 heading = normalize(vec2(1.0, slope));
  float scale = mix(0.022, 0.078, depthZ) * mix(0.82, 1.18, seed.y);
  vec2 q = rot(-atan(heading.y, heading.x)) * (p - pos);
  float blade = exp(-pow(abs(q.x) / (scale * (2.8 + seed.x)), 3.0)
    - pow(abs(q.y) / (scale * (0.26 + seed.y * 0.12)), 2.0));
  float core = exp(-pow(abs(q.x) / (scale * 1.15), 4.0)
    - pow(abs(q.y) / (scale * 0.06), 2.0));
  vec2 tailQ = q + vec2(scale * 1.35, 0.0);
  float tail = smoothstep(1.0, 0.18, abs(tailQ.x) / (scale * 0.82) + abs(tailQ.y) / (scale * 0.54));
  float trailLength = mix(0.08, 0.38, depthZ) + seed.x * 0.08;
  float trail = lineGlow(q.y, mix(0.0025, 0.008, depthZ))
    * smoothstep(-trailLength, -trailLength * 0.72, q.x)
    * (1.0 - smoothstep(-0.018, 0.01, q.x));
  float depthGain = mix(0.24, 1.16, depthZ);
  shoal += live * depthGain * (blade * 0.3 + core * 0.58 + tail * 0.18 + trail * mix(0.08, 0.22, depthZ));
}
float convergence = lineGlow(
  p.y - sin(p.x * 1.24 - flowClock * 1.12) * 0.14,
  0.018 + 0.01 * smoothstep(1.4, 0.0, abs(p.x))
);
float currentBody = exp(-pow(abs(p.y - sin(p.x * 1.24 - flowClock * 1.12) * 0.14) / 0.52, 3.0));
float forwardWash = pow(max(0.0, sin(p.x * 2.8 - flowClock * 3.4 + p.y * 1.3)), 9.0) * currentBody;
float farCurrent = exp(-pow(abs(p.y + sin(p.x * 0.72 - flowClock * 0.55) * 0.42) / 0.62, 3.0));
v += shoal * 1.3 + convergence * 0.11 + currentBody * 0.024 + forwardWash * 0.06 + farCurrent * 0.012;
`,
    warp: `
p.x += (fbm(p * 1.2 + vec2(t * 0.025, 0.0)) - 0.5) * 0.03;
`,
    color: `mix(vec3(0.0, 0.72, 1.0), vec3(0.42, 0.24, 1.0), 0.5 + 0.5 * sin(uv.y * 2.1 - uv.x * 0.65)) * shade * 0.82 + vec3(1.0, 0.68, 0.16) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.28 + vec3(0.94, 1.0, 1.0) * pow(clamp(shade, 0.0, 1.0), 4.0) * 0.16`,
    post: `
float shoalHaze = fbm(uv * vec2(0.78, 1.6) + vec2(iTime * 0.008, -iTime * 0.01));
color += vec3(0.0, 0.014, 0.045) * shoalHaze * smoothstep(1.8, 0.0, length(uv)) * 0.1;
color *= 1.0 - smoothstep(0.72, 1.95, length(uv)) * 0.1;
`,
    intensity: 1.08,
    motion: 1.08,
    detail: 3.0,
    atmosphere: 0.05,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'bubble-rise',
    title: 'Breath Columns',
    titleJa: '呼吸する水柱',
    categoryId: 'aquatic',
    description: 'Three translucent pressure columns rise as one continuous architectural breath.',
    descriptionJa: '三本の透明な圧力柱が、建築的なひとつの呼吸として静かに上昇する。',
    accentColor: '#8ddfff',
    tags: ['columns', 'pressure', 'membrane', 'interactive', 'architecture'],
    field: `
vec2 touch = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float touchOn = step(0.001, length(iMouse.zw));
float swipe = clamp(iHand.z, -1.0, 1.0) * iHand.w;
float columns = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float lane = (fi - 2.0) * 0.39;
  float phase = p.y * (1.55 + fi * 0.08) - t * (0.58 + fi * 0.045) + fi * 1.62;
  float center = lane + sin(phase) * (0.055 + fi * 0.006);
  float downstream = touchOn * smoothstep(touch.y - 0.18, touch.y + 0.08, p.y)
    * (1.0 - smoothstep(touch.y + 0.72, touch.y + 1.3, p.y));
  float wakeWidth = exp(-pow((p.x - touch.x) / 0.42, 4.0));
  center += (touch.x - center) * downstream * wakeWidth * 0.12 + swipe * downstream * wakeWidth * 0.1;
  float d = p.x - center;
  float pressure = fbm(vec2(p.y * 1.8 - t * 0.28, fi * 4.7));
  float width = 0.15 + pressure * 0.06 + sin(p.y * 2.8 - t * 0.72 + fi) * 0.026;
  float body = exp(-pow(abs(d) / width, 4.0));
  float shell = stroke(abs(d) - width * 0.9, 0.012);
  float fold = lineGlow(d - sin(p.y * 4.4 - t * 0.78 + fi) * width * 0.44, 0.018) * body;
  float strata = pow(max(0.0, sin(p.y * 8.5 - t * 1.7 + pressure * 3.0 + fi)), 10.0) * body;
  float risingLens = exp(-pow(abs(fract(p.y * 0.42 - t * (0.18 + fi * 0.012) + fi * 0.17) - 0.5) / 0.12, 3.0)) * body;
  float depth = 0.48 + fi * 0.12;
  columns += depth * (body * 0.24 + shell * 0.13 + fold * 0.14 + strata * 0.17 + risingLens * 0.2);
}
float breathRise = p.y - touch.y;
float breathGesture = touchOn * exp(-pow((p.x - touch.x - swipe * breathRise * 0.18) / 0.12, 2.0))
  * smoothstep(0.0, 0.12, breathRise) * (1.0 - smoothstep(0.72, 1.32, breathRise));
columns += breathGesture * (0.12 + abs(swipe) * 0.16);
float bridge = exp(-pow(abs(p.y + 0.68) / 0.13, 3.0))
  * exp(-pow(abs(p.x) / 1.15, 6.0));
float ascent = pow(max(0.0, sin(p.y * 4.6 - t * 1.35 + fbm(p * 1.4) * 2.0)), 9.0);
v += columns * 1.38 + bridge * ascent * 0.12;
`,
    warp: `
p.x += (fbm(vec2(p.y * 1.2 - t * 0.03, p.x * 0.6)) - 0.5) * 0.018;
`,
    color: `mix(vec3(0.04, 0.58, 0.96), vec3(0.22, 0.9, 0.68), 0.5 + 0.5 * sin(uv.y * 2.4)) * shade * 0.76 + vec3(0.55, 0.26, 0.92) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.16 + vec3(0.92, 1.0, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.8) * 0.12`,
    post: `
float columnFog = fbm(uv * vec2(0.82, 2.1) - vec2(0.0, iTime * 0.012));
color += vec3(0.003, 0.018, 0.05) * columnFog * smoothstep(1.85, 0.0, length(uv)) * 0.1;
color *= 1.0 - smoothstep(0.76, 1.9, length(uv)) * 0.08;
`,
    intensity: 1.06,
    motion: 1,
    detail: 2.6,
    atmosphere: 0.05,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'water-caustics',
    title: 'Liquid Light Floor',
    titleJa: '液光の床',
    categoryId: 'aquatic',
    description: 'A submerged plane of liquid light receives brief sprays of refracted glass particles from each swipe.',
    descriptionJa: '沈んだ液光面へ、スワイプのたび短命な屈折ガラス粒子が走る。',
    accentColor: '#a7f4d4',
    tags: ['caustics', 'floor', 'refraction', 'interactive', 'perspective'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001), 0.16));
float depth = clamp(0.2 + (0.92 - p.y) * 0.72, 0.24, 1.9);
vec2 floorP = vec2(p.x / depth, 1.0 / depth);
floorP += (vec2(fbm(floorP * 1.15 + vec2(t * 0.035, 0.0)), fbm(floorP.yx * 1.3 - vec2(0.0, t * 0.025))) - 0.5) * 0.13;
float caustic = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 q = rot(0.46 + fi * 0.71) * floorP * (1.2 + fi * 0.26);
  q += vec2(sin(q.y * 0.82 + t * (0.62 + fi * 0.05)), cos(q.x * 0.74 - t * 0.54)) * 0.3;
  float a = abs(sin(q.x + sin(q.y * 0.86 + fi)));
  float b = abs(cos(q.y + cos(q.x * 0.72 - fi)));
  caustic += pow(max(0.0, 1.0 - min(a, b)), 13.0 + fi) * (0.26 - fi * 0.025);
}
float horizon = smoothstep(0.92, -0.62, p.y);
float floorWash = exp(-pow(abs(p.y + 0.48) / 0.58, 3.0));
float floorParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 13.0, 0.34, 0.032) * burstEnergy;
v += caustic * horizon * 1.38 + floorWash * 0.09 + floorParticles * 0.52;
`,
    warp: `
p.y += (fbm(p * vec2(0.8, 1.5) + vec2(t * 0.02, 0.0)) - 0.5) * 0.018;
`,
    color: `mix(vec3(0.0, 0.56, 0.96), vec3(0.14, 0.94, 0.58), smoothstep(-0.8, 0.5, uv.y)) * shade * 0.72 + vec3(1.0, 0.58, 0.08) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.28 + vec3(0.96, 1.0, 0.98) * pow(clamp(shade, 0.0, 1.0), 4.0) * 0.14`,
    post: `
float horizonGlow = exp(-pow(abs(uv.y - 0.18) / 0.16, 3.0));
color += vec3(0.0, 0.025, 0.07) * horizonGlow * 0.12;
color *= 1.0 - smoothstep(0.82, 1.95, length(uv)) * 0.08;
`,
    intensity: 1.12,
    motion: 0.96,
    detail: 2.8,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'kelp-current',
    title: 'Botanical Tide',
    titleJa: '発光植物潮',
    categoryId: 'aquatic',
    description: 'A monumental fan of submerged leaf veins opens through negative space.',
    descriptionJa: '水中の巨大な葉脈扇が、余白を保ちながらゆっくり開いていく。',
    accentColor: '#7ce6a4',
    tags: ['botanical', 'leaf veins', 'negative space', 'monumental', 'tide'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001) * 0.38, 0.92));
float botanical = 0.0;
vec2 origin = vec2(-1.12 + sin(t * 0.18) * 0.12, -0.92);
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  float angle = 0.08 + fi * 0.18 + sin(t * 0.52 + fi * 0.72) * (0.06 + fi * 0.004);
  vec2 axis = vec2(cos(angle), sin(angle));
  vec2 normal = vec2(-axis.y, axis.x);
  vec2 rel = p - origin;
  float along = dot(rel, axis);
  float across = dot(rel, normal);
  float lengthLeaf = 1.55 + fi * 0.1;
  float taper = sin(clamp(along / lengthLeaf, 0.0, 1.0) * 3.14159);
  float curve = sin(along * (1.55 + fi * 0.06) - t * 0.72 + fi) * (0.045 + fi * 0.004) * taper;
  float halfWidth = (0.17 + fi * 0.011) * taper;
  float leaf = smoothstep(halfWidth, halfWidth * 0.35, abs(across - curve))
    * smoothstep(0.0, 0.08, along)
    * (1.0 - smoothstep(lengthLeaf - 0.16, lengthLeaf, along));
  float edge = stroke(abs(across - curve) - halfWidth * 0.88, 0.006) * leaf;
  float midrib = lineGlow(across - curve, 0.0045) * leaf;
  float veinPhase = fract(along * (7.0 + fi * 0.3) + fi * 0.17);
  float side = sign(across - curve + 0.0001);
  float diagonal = abs(across - curve) - veinPhase * halfWidth;
  float veins = lineGlow(diagonal, 0.0032)
    * smoothstep(0.08, 0.5, taper)
    * leaf
    * (0.55 + 0.45 * side);
  float tissue = noise(vec2(along * 5.0 - t * 0.2, across * 18.0) + fi * 4.2) * leaf;
  float sapPulse = pow(max(0.0, sin(along * 6.8 - t * 2.05 + fi * 0.82)), 12.0) * leaf;
  botanical += leaf * (0.18 + tissue * 0.1) + edge * 0.09 + midrib * 0.13 + veins * 0.07 + sapPulse * 0.15;
}
float leafParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 29.0, 0.42, 0.028) * burstEnergy;
botanical += leafParticles * 0.5;
float branch = glow(sdSegment(p, origin, vec2(0.54, 0.32)), 0.018);
float canopy = exp(-pow(length((p - vec2(-0.08, -0.08)) / vec2(1.35, 0.82)), 3.0));
v += botanical * 1.26 + branch * 0.11 + canopy * 0.03;
`,
    warp: `
p += (vec2(fbm(p * 0.9 + vec2(t * 0.014, 0.0)), fbm(p.yx * 1.05 - vec2(0.0, t * 0.012))) - 0.5) * 0.018;
`,
    color: `mix(vec3(0.02, 0.72, 0.36), vec3(0.0, 0.48, 0.9), 0.5 + 0.5 * sin(uv.x * 1.3 - uv.y * 1.8)) * shade * 0.74 + vec3(1.0, 0.62, 0.08) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.3 + vec3(0.92, 1.0, 0.72) * pow(clamp(shade, 0.0, 1.0), 3.8) * 0.12`,
    post: `
float canopyFog = fbm(uv * vec2(0.72, 1.2) + vec2(iTime * 0.006, -iTime * 0.008));
color += vec3(0.004, 0.025, 0.02) * canopyFog * smoothstep(1.8, 0.0, length(uv)) * 0.08;
color *= 1.0 - smoothstep(0.76, 1.85, length(uv)) * 0.1;
`,
    intensity: 1.08,
    motion: 0.92,
    detail: 2.5,
    atmosphere: 0.05,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'jelly-pulse',
    title: 'Moon Jelly Choir',
    titleJa: '月海月の合唱',
    categoryId: 'aquatic',
    description: 'Five monumental glass bells breathe in offset phases without visual clutter.',
    descriptionJa: '五つの巨大なガラス膜が位相をずらして呼吸し、静かな合唱をつくる。',
    accentColor: '#b9a7ff',
    tags: ['glass bells', 'choir', 'membrane', 'violet', 'monumental'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001) * 0.24, 0.97));
float choir = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 71.3));
  float rise = fract(fi / 6.0 + t * (0.026 + mod(fi, 3.0) * 0.003));
  float column = mod(fi, 3.0) - 1.0;
  vec2 pos = vec2(column * 0.82 + sin(rise * 6.283 + fi) * 0.16, rise * 2.12 - 1.06);
  float touchChord = burstEnergy * exp(-dot((pos - burstOrigin) * vec2(1.5, 2.2), (pos - burstOrigin) * vec2(1.5, 2.2)));
  pos += vec2(sign(iHand.z + 0.0001) * 0.045, 0.08) * touchChord;
  float depth = 0.82 + seed.y * 0.34;
  vec2 q = (p - pos) / depth;
  float pulse = 1.0 + sin(t * 1.42 + fi * 1.32) * 0.12 + touchChord * 0.16;
  q /= vec2(pulse, 1.0 / pulse);
  vec2 domeQ = q / vec2(0.42, 0.28);
  float domeD = length(domeQ - vec2(0.0, 0.1));
  float upper = smoothstep(-0.18, 0.08, q.y);
  float membrane = smoothstep(1.0, 0.08, domeD) * upper;
  float rim = stroke(domeD - 0.92, 0.028) * upper;
  float lowerEdge = lineGlow(q.y + 0.025 + cos(q.x * 9.0 + fi) * 0.016, 0.009)
    * smoothstep(0.4, 0.03, abs(q.x));
  float pleat = pow(max(0.0, cos(domeQ.x * 5.0 - domeQ.y * 2.0 + fi)), 12.0) * membrane;
  float volume = exp(-domeD * domeD * 1.35) * upper;
  float trailGate = smoothstep(-0.72, -0.02, q.y) * (1.0 - smoothstep(-0.04, 0.04, q.y));
  float trailA = lineGlow(q.x - sin(q.y * 7.0 - t * 1.1 + fi) * 0.045, 0.012) * trailGate;
  float trailB = lineGlow(q.x - 0.12 - sin(q.y * 5.5 - t * 0.9 + fi) * 0.035, 0.009) * trailGate;
  float trailC = lineGlow(q.x + 0.12 - sin(q.y * 6.2 - t * 1.0 + fi) * 0.035, 0.009) * trailGate;
  choir += mix(0.58, 0.96, 1.0 - seed.y) * (membrane * 0.39 + rim * 0.17 + lowerEdge * 0.13 + pleat * 0.14 + volume * 0.12 + (trailA + trailB + trailC) * 0.065);
}
float choirParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 47.0, 0.38, 0.03) * burstEnergy;
choir += choirParticles * 0.5;
v += choir * 1.3;
`,
    warp: `
p += (vec2(fbm(p * 0.82 + vec2(t * 0.012, 0.0)), fbm(p.yx * 1.1 - vec2(0.0, t * 0.01))) - 0.5) * 0.015;
`,
    color: `mix(vec3(0.38, 0.2, 0.92), vec3(0.0, 0.68, 0.86), smoothstep(-0.65, 0.62, uv.y)) * shade * 0.7 + vec3(1.0, 0.24, 0.5) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.26 + vec3(0.94, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.9) * 0.14`,
    post: `
float violetDepth = fbm(uv * vec2(0.85, 1.65) + vec2(iTime * 0.006, -iTime * 0.01));
color += vec3(0.018, 0.006, 0.055) * violetDepth * smoothstep(1.85, 0.0, length(uv)) * 0.1;
color *= 1.0 - smoothstep(0.74, 1.9, length(uv)) * 0.1;
`,
    intensity: 1.04,
    motion: 0.96,
    detail: 2.4,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'plankton-cloud',
    title: 'Surface Prism Drift',
    titleJa: '水面プリズム流',
    categoryId: 'aquatic',
    description: 'Broad daylight prism sails cross clear water and flip in sequence under a diagonal gesture.',
    descriptionJa: '昼光を含んだ大きなプリズム片が透明な水を横切り、斜めの操作で順番に面を返す。',
    accentColor: '#7af5ff',
    tags: ['surface', 'daylight', 'prism sails', 'directional', 'interactive'],
    field: `
vec2 touch = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float touchOn = step(0.001, length(iMouse.zw));
float swipe = clamp(iHand.z, -1.0, 1.0) * iHand.w;
float prismField = 0.0;
for (int i = 0; i < 18; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 31.2));
  vec2 seedB = hash22(vec2(fi, 117.4));
  float live = step(fi, 10.0 + uDetail * 2.4);
  float life = fract(seed.x + t * (0.038 + seed.y * 0.014));
  vec2 pos = vec2(life * 3.8 - 1.9, seedB.y * 1.65 - 0.82);
  pos.y += sin(pos.x * (0.82 + seed.x * 0.36) - t * 0.46 + seedB.x * 6.283) * (0.09 + seed.y * 0.08);
  float downstream = pos.x - touch.x;
  float flipLine = pos.y - touch.y - downstream * (0.22 + swipe * 0.32);
  float flip = touchOn * smoothstep(-0.08, 0.08, downstream)
    * (1.0 - smoothstep(0.85, 1.82, downstream))
    * exp(-pow(flipLine / 0.28, 2.0));
  float radius = 0.075 + seed.y * 0.09;
  vec2 q = rot(seed.x * 1.5 - 0.75 + flip * (0.8 + swipe * 0.55)) * (p - pos);
  float sailD = abs(q.x) / (radius * 1.45) + abs(q.y) / (radius * 0.62) - 1.0;
  float sail = smoothstep(0.12, -0.08, sailD);
  float rim = stroke(sailD, 0.055);
  float facetA = lineGlow(q.y - q.x * 0.28, 0.005) * sail;
  float facetB = lineGlow(q.y + q.x * 0.42, 0.004) * sail;
  float glass = exp(-dot(q / vec2(radius * 1.2, radius * 0.52), q / vec2(radius * 1.2, radius * 0.52))) * sail;
  float glint = pow(max(0.0, sin(q.x * 24.0 - t * 2.2 + fi)), 15.0) * sail;
  float wake = glow(sdSegment(p, pos - vec2(0.34 + seed.x * 0.2, 0.0), pos), 0.008) * (1.0 - sail);
  prismField += live * (sail * 0.12 + rim * 0.12 + (facetA + facetB) * 0.08 + glass * 0.11 + glint * 0.24 + wake * 0.055 + flip * sail * 0.16);
}
float sunRake = pow(max(0.0, sin((p.x + p.y * 0.42) * 6.0 - t * 1.36)), 18.0);
sunRake *= smoothstep(1.45, 0.1, length(p));
v += prismField * 1.52 + sunRake * 0.065;
`,
    warp: `
p.x += (fbm(p * 1.05 + vec2(t * 0.018, 0.0)) - 0.5) * 0.018;
`,
    color: `mix(vec3(0.0, 0.76, 0.9), vec3(0.5, 0.28, 0.98), 0.5 + 0.5 * sin(uv.y * 1.7 - uv.x)) * shade * 0.74 + vec3(1.0, 0.48, 0.12) * pow(clamp(shade, 0.0, 1.0), 2.7) * 0.26 + vec3(0.98, 1.0, 0.9) * pow(clamp(shade, 0.0, 1.0), 4.0) * 0.15`,
    post: `
float constellationDepth = fbm(uv * vec2(0.8, 1.4) + vec2(iTime * 0.007, -iTime * 0.009));
color += vec3(0.0, 0.012, 0.04) * constellationDepth * smoothstep(1.8, 0.0, length(uv)) * 0.08;
color *= 1.0 - smoothstep(0.7, 1.88, length(uv)) * 0.1;
`,
    intensity: 1.12,
    motion: 1.08,
    detail: 2.8,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'sonar-rings',
    title: 'Echo Garden',
    titleJa: '反響する水庭',
    categoryId: 'aquatic',
    description: 'Broken wavefronts cross a submerged garden, opening living light at their intersections.',
    descriptionJa: '途切れた波面が水中庭園を横切り、交点に生命の光を咲かせる。',
    accentColor: '#52c7ff',
    tags: ['echo', 'rings', 'garden', 'interactive', 'radial'],
    field: `
vec2 touch = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float touchOn = step(0.001, length(iMouse.zw));
float garden = 0.0;
vec2 sourceA = mix(vec2(-0.82, -0.26), touch, touchOn);
vec2 sourceB = vec2(0.42, 0.38);
vec2 sourceC = vec2(0.92, -0.48);
vec2 sourceD = vec2(-0.24, 0.72);
float phaseA = sin(length(p - sourceA) * 14.0 - t * 0.86);
float phaseB = sin(length(p - sourceB) * 16.5 - t * 0.72 + 1.8);
float phaseC = sin(length(p - sourceC) * 12.5 - t * 0.8 + 3.5);
float phaseD = sin(length(p - sourceD) * 18.0 - t * 0.66 + 5.2);
float cancellationA = exp(-abs(phaseA + phaseB) * 10.0);
float cancellationB = exp(-abs(phaseB + phaseC) * 11.0);
float cancellationC = exp(-abs(phaseC + phaseD) * 9.0);
float crossing = cancellationA * cancellationB + cancellationB * cancellationC + cancellationC * cancellationA;
float waveEmbroidery = pow(max(0.0, 0.5 + 0.5 * (phaseA * 0.34 + phaseB * 0.28 + phaseC * 0.22 + phaseD * 0.16)), 15.0);
float waveWindow = smoothstep(1.55, 0.0, length(p * vec2(0.74, 1.0)));
garden += (crossing * 0.27 + waveEmbroidery * 0.075) * waveWindow;

for (int i = 0; i < 72; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 213.4));
  vec2 seedB = hash22(vec2(fi, 378.2));
  float live = step(fi, 50.0 + uDetail * 8.0);
  float lane = mod(fi, 9.0);
  float life = fract(seed.x + fi * 0.013 + t * (0.01 + seed.y * 0.012));
  float x = life * 3.5 - 1.75;
  float baseY = -0.78 + lane * 0.195 + (seedB.y - 0.5) * 0.16;
  float curveA = sin(x * (1.35 + seed.x * 0.9) + seedB.x * 6.283 - t * 0.11) * (0.055 + seed.y * 0.075);
  float curveB = sin(x * 3.1 - seed.x * 8.0 + t * 0.07) * (0.015 + seedB.y * 0.025);
  vec2 pos = vec2(x, baseY + curveA + curveB);
  float steering = sin(length(pos - sourceA) * 7.0 - t * 0.42);
  steering += sin(length(pos - sourceB) * 8.2 - t * 0.36 + 1.8);
  pos.y += steering * 0.024;
  vec2 away = pos - touch;
  float nearTouch = touchOn * exp(-dot(away, away) * 6.0);
  pos += normalize(away + vec2(0.001)) * nearTouch * (0.13 + seed.x * 0.06);
  float slope = cos(x * (1.35 + seed.x * 0.9) + seedB.x * 6.283 - t * 0.11) * (0.075 + seed.y * 0.1);
  slope += cos(x * 3.1 - seed.x * 8.0 + t * 0.07) * (0.045 + seedB.y * 0.075);
  vec2 heading = normalize(vec2(1.0, slope));
  float scale = 0.024 + pow(seedB.x, 1.5) * 0.042;
  vec2 packetQ = rot(-atan(heading.y, heading.x)) * (p - pos) / vec2(scale, scale * (0.25 + seed.y * 0.12));
  packetQ.x += abs(packetQ.y) * 0.28;
  float packet = smoothstep(1.0, 0.0, length(packetQ) - packetQ.x * 0.12);
  float core = exp(-dot(packetQ, packetQ) * 3.2);
  float fin = smoothstep(0.68, 0.0, abs(packetQ.y) + abs(packetQ.x + 0.82) * 0.42) * smoothstep(-0.1, -0.8, packetQ.x);
  float localTrail = lineGlow(packetQ.y, 0.16) * smoothstep(-3.2, -0.62, packetQ.x) * (1.0 - smoothstep(-0.48, 0.05, packetQ.x));
  float longGate = step(0.84, seedB.y) * step(0.38, seed.x);
  float trailLength = 0.1 + seed.x * 0.22;
  float longTrail = glow(sdSegment(p, pos - heading * trailLength, pos), 0.006 + seed.y * 0.005) * longGate;
  float phaseLight = 0.72 + 0.28 * sin(length(pos - sourceA) * 11.0 - t * 0.72 + seed.x * 6.283);
  float depth = mix(0.52, 1.0, 1.0 - seed.y * 0.72);
  garden += live * depth * phaseLight * (packet * 0.4 + core * 0.54 + fin * 0.18 + localTrail * 0.17 + longTrail * 0.12);
}
v += garden * 1.44;
`,
    warp: `
p += (vec2(fbm(p * 1.35 + t * 0.02), fbm(p.yx * 1.55 - t * 0.018)) - 0.5) * 0.026;
`,
    color: `vec3(0.0004, 0.0015, 0.009) + vec3(0.002, 0.012, 0.045) * mask + mix(mix(vec3(0.0, 0.82, 1.0), vec3(0.52, 0.16, 1.0), 0.5 + 0.5 * sin(uv.y * 2.8 - uv.x * 0.7)), mix(vec3(1.0, 0.08, 0.58), vec3(1.0, 0.75, 0.06), 0.5 + 0.5 * sin(uv.x * 3.1 + uv.y)), 0.5 + 0.5 * sin(uv.y * 1.5 + iTime * 0.018)) * shade * 0.88 + vec3(0.7, 0.96, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.36 + vec3(1.0) * pow(clamp(shade, 0.0, 1.0), 4.2) * 0.14`,
    post: `
float deepGarden = fbm(uv * vec2(1.1, 1.8) + vec2(iTime * 0.008, -iTime * 0.012));
float gardenDepth = smoothstep(1.8, 0.0, length(uv));
color += vec3(0.0, 0.018, 0.06) * deepGarden * gardenDepth * 0.13;
color += vec3(0.05, 0.0, 0.12) * pow(deepGarden, 4.0) * gardenDepth * 0.06;
color *= 1.0 - smoothstep(0.78, 1.9, length(uv)) * 0.34;
`,
    intensity: 1.18,
    motion: 0.82,
    detail: 2.8,
    atmosphere: 0.08,
  }),
  makeEffect({
    id: 'reef-shimmer',
    title: 'Koi Confluence',
    titleJa: '錦流の合流',
    categoryId: 'aquatic',
    description: 'Vermilion and pearl currents braid through clear sunlit water.',
    descriptionJa: '朱と真珠の二つの流れが、透明な陽光水の中で鮮やかに編み合わさる。',
    accentColor: '#ff765d',
    tags: ['koi', 'lacquer', 'confluence', 'ribbon', 'japanese'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001), 0.22));
float flowA = p.y - 0.16 - (0.3 * sin(p.x * 1.35 - t * 0.82) + 0.12 * sin(p.x * 3.0 + t * 0.46));
float flowB = p.y + 0.16 + (0.28 * sin(p.x * 1.35 - t * 0.76 + 1.2) + 0.11 * sin(p.x * 2.7 - t * 0.42));
float flowC = p.y - 0.42 * sin(p.x * 0.82 - t * 0.56 + 2.3) - 0.06 * sin(p.x * 3.6 + t * 0.72);
float widthA = 0.17 + 0.04 * sin(p.x * 2.2 - t * 0.48);
float widthB = 0.15 + 0.035 * cos(p.x * 2.0 + t * 0.44);
float ribbonA = smoothstep(widthA, widthA * 0.22, abs(flowA));
float ribbonB = smoothstep(widthB, widthB * 0.2, abs(flowB));
float ribbonC = smoothstep(0.09, 0.018, abs(flowC));
float edgeA = stroke(abs(flowA) - widthA * 0.88, 0.008);
float edgeB = stroke(abs(flowB) - widthB * 0.88, 0.008);
float lacquerA = pow(max(0.0, sin(p.x * 5.2 + flowA * 14.0 - t * 1.42)), 10.0) * ribbonA;
float lacquerB = pow(max(0.0, cos(p.x * 4.8 - flowB * 15.0 - t * 1.18)), 10.0) * ribbonB;
float crossing = ribbonA * ribbonB;
float braidLight = pow(max(0.0, sin((flowA - flowB) * 18.0 + p.x * 2.2)), 10.0) * crossing;
float pearlRun = pow(max(0.0, sin(p.x * 7.0 - t * 1.7)), 14.0) * ribbonC;
float wakeA = lineGlow(flowA - sign(flowA + 0.0001) * widthA * 0.46, 0.016) * ribbonA;
float wakeB = lineGlow(flowB + sign(flowB + 0.0001) * widthB * 0.4, 0.016) * ribbonB;
float koiParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 61.0, 0.32, 0.041) * burstEnergy;
v += ribbonA * 0.34 + ribbonB * 0.29 + ribbonC * 0.18 + edgeA * 0.14 + edgeB * 0.12;
v += lacquerA * 0.22 + lacquerB * 0.2 + braidLight * 0.22 + pearlRun * 0.2 + wakeA * 0.08 + wakeB * 0.07 + koiParticles * 0.82;
`,
    warp: `
p.x += (fbm(p * vec2(1.0, 1.45) + vec2(t * 0.018, 0.0)) - 0.5) * 0.03;
`,
    color: `mix(vec3(1.0, 0.05, 0.08), vec3(0.04, 0.24, 0.94), 0.5 + 0.5 * sin(uv.x * 1.8 - uv.y * 3.0 + shade)) * shade * 0.78 + vec3(1.0, 0.68, 0.08) * pow(clamp(shade, 0.0, 1.0), 2.25) * 0.3 + vec3(1.0, 0.96, 0.86) * pow(clamp(shade, 0.0, 1.0), 3.8) * 0.14`,
    post: `
float lacquerDepth = fbm(uv * vec2(0.82, 1.35) + vec2(iTime * 0.006, -iTime * 0.008));
color += vec3(0.008, 0.004, 0.02) * lacquerDepth * smoothstep(1.8, 0.0, length(uv)) * 0.09;
color *= 1.0 - smoothstep(0.72, 1.9, length(uv)) * 0.08;
`,
    intensity: 1.1,
    motion: 1,
    detail: 2.5,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'tide-lines',
    title: 'Current Calligraphy',
    titleJa: '潮流書',
    categoryId: 'aquatic',
    description: 'Decisive translucent brush strokes sweep through clear moving water.',
    descriptionJa: '透明感のある力強い筆致が、明るく動く水を一方向へ駆け抜ける。',
    accentColor: '#9dd7ff',
    tags: ['calligraphy', 'ink', 'pressure', 'brush', 'directional'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001), 0.18));
float flowClock = t * 0.31 + sin(t * 0.56) * 0.24 + sin(t * 1.4) * 0.05;
float ink = 0.0;
for (int i = 0; i < 12; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 83.1));
  float layer = floor(fi / 4.0);
  float depthZ = layer / 2.0;
  float member = mod(fi, 4.0);
  float travel = fract(layer / 3.0 + member * 0.026 + seed.x * 0.025 + flowClock * (0.1 + depthZ * 0.105));
  vec2 pos = vec2(travel * 4.55 - 2.28, -0.7 + member * 0.46 + (depthZ - 0.5) * 0.16 + sin(travel * 6.283 + fi) * mix(0.045, 0.11, depthZ));
  float angle = -0.82 + seed.x * 1.42 + (depthZ - 0.5) * 0.18;
  vec2 q = rot(angle) * (p - pos);
  float lengthStroke = mix(0.38, 1.42, depthZ) * mix(0.86, 1.12, seed.x);
  float window = smoothstep(-lengthStroke - 0.08, -lengthStroke + 0.08, q.x) * (1.0 - smoothstep(-0.03, 0.08, q.x));
  float along = clamp((-q.x) / lengthStroke, 0.0, 1.0);
  float pressure = mix(0.016, 0.19, depthZ) * mix(0.76, 1.2, seed.y) * pow(max(0.0, sin(along * 3.14159)), 0.62);
  float curve = sin(q.x * (4.0 + seed.x * 2.0) - flowClock * mix(1.4, 3.1, depthZ) + fi) * pressure * 0.25;
  float d = q.y - curve;
  float body = smoothstep(pressure, pressure * 0.2, abs(d)) * window;
  float edge = stroke(abs(d) - pressure * 0.86, mix(0.003, 0.007, depthZ)) * window;
  float dry = smoothstep(0.38, 0.7, noise(vec2(q.x * 11.0 - flowClock * 1.8, q.y * 18.0 + fi * 3.7)));
  float bristles = pow(max(0.0, sin(q.y * 108.0 + seed.x * 12.0)), 14.0) * body * smoothstep(0.32, 0.94, along);
  float splitBristle = lineGlow(d - pressure * 0.58, 0.004) * window * smoothstep(0.48, 0.94, along);
  float depthGain = mix(0.1, 1.28, depthZ);
  ink += depthGain * (body * (0.34 + dry * 0.11) + edge * 0.075 + bristles * 0.16 + splitBristle * 0.07);
}
float inkParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 97.0, 0.36, 0.046) * burstEnergy;
float distantWash = exp(-pow(abs(p.y + sin(p.x * 0.62 - flowClock * 0.48) * 0.48) / 0.7, 3.0));
v += ink * 1.34 + inkParticles * 1.06 + distantWash * 0.012;
`,
    warp: `
p.y += (fbm(p * vec2(1.2, 0.8) + vec2(t * 0.016, 0.0)) - 0.5) * 0.024;
`,
    color: `-clearWater * shade * 0.58 + mix(vec3(0.015, 0.04, 0.22), vec3(0.18, 0.035, 0.32), 0.5 + 0.5 * sin(uv.x * 1.2 - uv.y * 2.0)) * shade * 0.62 + vec3(0.0, 0.76, 0.92) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.22 + vec3(0.94, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.9) * 0.1`,
    post: `
float inkWash = fbm(uv * vec2(0.72, 1.2) + vec2(iTime * 0.007, -iTime * 0.006));
color += vec3(0.002, 0.01, 0.026) * inkWash * smoothstep(1.8, 0.0, length(uv)) * 0.08;
float inkBody = smoothstep(0.055, 0.72, shade);
color = mix(color, vec3(0.012, 0.035, 0.13), inkBody * 0.64);
color += vec3(0.0, 0.34, 0.44) * pow(inkBody, 3.2) * 0.12;
color *= 1.0 - smoothstep(0.7, 1.88, length(uv)) * 0.1;
`,
    intensity: 1.06,
    motion: 1.02,
    detail: 2.6,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'deep-vent',
    title: 'Sunlit Gyre',
    titleJa: '陽光プリズム渦',
    categoryId: 'aquatic',
    description: 'Sunlit prism bands cross three water depths while each swipe releases a brief crystal spray.',
    descriptionJa: '三層の水深を陽光プリズム帯が横切り、スワイプごと短い結晶粒子を放つ。',
    accentColor: '#62e8ff',
    tags: ['sunlight', 'prism', 'gyre', 'clear water', 'interactive'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001), 0.42));
float flowClock = t * 0.29 + sin(t * 0.52) * 0.25 + sin(t * 1.36) * 0.045;
vec2 q = rot(-0.34 + sin(flowClock * 0.72) * 0.09) * p;
q += (vec2(fbm(q * 1.18 + vec2(flowClock * 0.32, 0.0)), fbm(q.yx * 1.08 - vec2(0.0, flowClock * 0.24))) - 0.5) * 0.075;
float gyre = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  float layer = floor(fi / 3.0);
  float depthZ = layer / 2.0;
  float member = mod(fi, 3.0);
  vec2 layerQ = q * mix(0.72, 1.32, depthZ);
  layerQ.x += flowClock * mix(0.16, 0.62, depthZ);
  vec2 beamQ = rot((member - 1.0) * 0.11 + (depthZ - 0.5) * 0.13) * layerQ;
  float offset = (member - 1.0) * mix(0.34, 0.26, depthZ) + (layer - 1.0) * 0.07;
  float curve = beamQ.y - offset - sin(beamQ.x * (1.08 + member * 0.11) - flowClock * mix(0.72, 2.1, depthZ) + fi * 0.72) * mix(0.22, 0.12, depthZ);
  float width = mix(0.17, 0.075, depthZ) * mix(0.92, 1.08, member / 2.0);
  float window = smoothstep(width, width * 0.14, abs(curve));
  float rim = stroke(abs(curve) - width * 0.86, mix(0.018, 0.006, depthZ));
  float packet = pow(max(0.0, sin(beamQ.x * mix(2.6, 5.2, depthZ) - flowClock * mix(1.1, 3.8, depthZ) + fi)), mix(7.0, 15.0, depthZ)) * window;
  float split = lineGlow(curve - width * 0.38, mix(0.016, 0.006, depthZ)) + lineGlow(curve + width * 0.38, mix(0.014, 0.005, depthZ));
  float depthGain = mix(0.2, 1.06, depthZ);
  gyre += depthGain * (window * mix(0.07, 0.14, depthZ) + rim * 0.07 + packet * 0.24 + split * window * 0.04);
}
float prismParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 113.0, 0.4, 0.034) * burstEnergy;
float depthMist = exp(-pow(abs(p.y + sin(p.x * 0.54 - flowClock * 0.42) * 0.52) / 0.78, 3.0));
v += gyre * 1.42 + prismParticles * 0.6 + depthMist * 0.014;
`,
    warp: `
p += (vec2(fbm(p * 1.05 + vec2(t * 0.04, 0.0)), fbm(p.yx * 1.2 - vec2(0.0, t * 0.032))) - 0.5) * 0.025;
`,
    color: `mix(vec3(0.0, 0.82, 1.0), vec3(0.22, 1.0, 0.56), 0.5 + 0.5 * sin(uv.x * 1.8 - uv.y * 2.4 + iTime * 0.12)) * shade * 0.78 + vec3(1.0, 0.34, 0.12) * pow(clamp(shade, 0.0, 1.0), 2.45) * 0.3 + vec3(1.0, 0.98, 0.72) * pow(clamp(shade, 0.0, 1.0), 3.8) * 0.15`,
    post: `
float sunWash = fbm(uv * vec2(1.1, 0.75) + vec2(iTime * 0.1, -iTime * 0.05));
color += vec3(0.025, 0.11, 0.13) * sunWash * smoothstep(1.9, 0.0, length(uv)) * 0.09;
color *= 1.0 - smoothstep(1.05, 2.0, length(uv)) * 0.12;
`,
    intensity: 1.18,
    motion: 1.06,
    detail: 2.5,
    atmosphere: 0.14,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'pearl-drift',
    title: 'Nacre Membranes',
    titleJa: '真珠干渉膜',
    categoryId: 'aquatic',
    description: 'Three broad nacre sheets slide across one another under a directional touch shear.',
    descriptionJa: '三枚の大きな真珠膜が重なり、ポインタの一方向剪断で静かにずれる。',
    accentColor: '#a6e7ff',
    tags: ['nacre', 'membrane', 'interference', 'interactive', 'shear'],
    field: `
vec2 touch = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
float touchOn = step(0.001, length(iMouse.zw));
float swipe = clamp(iHand.z, -1.0, 1.0) * iHand.w;
vec2 delta = p - touch;
float shear = touchOn * exp(-delta.y * delta.y * 12.0)
  * smoothstep(-0.08, 0.1, delta.x) * (1.0 - smoothstep(0.7, 1.42, delta.x));
float nacre = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 q = rot(-0.38 + fi * 0.24) * p;
  q.x += shear * (0.18 + fi * 0.05 + abs(swipe) * 0.1);
  q.y += shear * (0.025 + swipe * 0.035);
  q += (vec2(fbm(q * (0.72 + fi * 0.12) + vec2(t * 0.07, fi)), fbm(q.yx * (0.9 + fi * 0.1) - vec2(0.0, t * 0.06))) - 0.5) * (0.12 + fi * 0.022);
  float center = -0.48 + fi * 0.31;
  float curve = q.y - center - sin(q.x * (1.18 + fi * 0.16) + t * (0.42 + fi * 0.055) + fi) * (0.13 + fi * 0.022);
  float width = 0.23 + fi * 0.03;
  float sheet = smoothstep(width, width * 0.2, abs(curve));
  float edge = stroke(abs(curve) - width * 0.9, 0.008);
  float spectral = pow(max(0.0, cos(curve / width * 7.0 + q.x * 3.1 + t * 1.18 + fi + shear * swipe * 2.4)), 8.0) * sheet;
  float fold = lineGlow(curve - sin(q.x * 1.45 + fi) * width * 0.42, 0.014) * sheet;
  float grain = noise(q * vec2(5.0, 8.0) + fi * 3.7);
  float movingFold = exp(-pow((fract(q.x * 0.22 - t * (0.11 + fi * 0.012) + fi * 0.2) - 0.5) / 0.12, 2.0)) * sheet;
  nacre += (0.56 + fi * 0.1) * (sheet * (0.36 + grain * 0.12) + edge * 0.045 + spectral * 0.18 + fold * 0.09 + movingFold * 0.14);
}
v += nacre * 1.26;
`,
    warp: `
p += (vec2(fbm(p * 0.82 + vec2(t * 0.01, 0.0)), fbm(p.yx * 0.95 - vec2(0.0, t * 0.009))) - 0.5) * 0.018;
`,
    color: `mix(vec3(0.04, 0.62, 0.9), vec3(0.82, 0.12, 0.58), 0.5 + 0.5 * sin(uv.x * 1.9 - uv.y * 2.4 + shade)) * shade * 0.65 + vec3(1.0, 0.62, 0.1) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.28 + vec3(0.94, 1.0, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.9) * 0.14`,
    post: `
float nacreFog = fbm(uv * vec2(0.82, 1.55) + vec2(iTime * 0.006, -iTime * 0.008));
color += vec3(0.008, 0.014, 0.045) * nacreFog * smoothstep(1.85, 0.0, length(uv)) * 0.08;
color *= 1.0 - smoothstep(0.8, 1.94, length(uv)) * 0.08;
`,
    intensity: 1.02,
    motion: 1.02,
    detail: 2.4,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
  makeEffect({
    id: 'wave-silk',
    title: 'Waterfall Veil',
    titleJa: '光瀑の帳',
    categoryId: 'aquatic',
    description: 'A continuous optical curtain falls in broad folds, without droplets or decorative noise.',
    descriptionJa: '粒や装飾ノイズを使わず、大きな光学膜だけが連続して落下する。',
    accentColor: '#72cfff',
    tags: ['waterfall', 'curtain', 'optical', 'continuous', 'vertical'],
    field: `
float burstEnergy = iHand.w;
float burstAge = min(1.2, -log(max(burstEnergy, 0.001)) / 2.4);
vec2 burstOrigin = (iHand.xy * 2.0 - iResolution.xy) / iResolution.y;
vec2 burstDirection = normalize(vec2(sign(iHand.z + 0.0001) * 0.16, -1.0));
vec2 q = p;
float curtain = 0.0;
float bodyNoise = fbm(q * vec2(1.25, 2.4) - vec2(0.0, t * 0.42));
float body = exp(-pow(abs(q.x) / (1.08 + bodyNoise * 0.12), 8.0));
float fallingSheet = 0.58 + 0.42 * pow(max(0.0, sin(q.y * 5.0 - t * 2.15 + bodyNoise * 2.0)), 4.0);
curtain += body * (0.2 + bodyNoise * 0.15 + fallingSheet * 0.09);
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  float lane = -0.86 + fi * 0.34;
  float flow = q.x - lane;
  flow += sin(q.y * (1.1 + fi * 0.08) - t * (0.62 + fi * 0.05) + fi) * (0.045 + fi * 0.004);
  flow += sin(q.y * 3.8 - t * 1.08 + fi * 1.7) * 0.012;
  float ridge = lineGlow(flow, 0.02 + fi * 0.002) * body;
  float core = lineGlow(flow, 0.004) * body;
  float verticalPulse = 0.28 + 0.72 * pow(max(0.0, sin(q.y * 3.6 - t * 2.05 + fi)), 4.0);
  curtain += ridge * 0.045 + core * verticalPulse * 0.09;
}
float lowerMist = exp(-pow(abs(q.y + 0.82 + sin(q.x * 2.2 - t * 0.9) * 0.035) / 0.17, 3.0))
  * exp(-pow(abs(q.x) / 1.2, 5.0));
float foldLight = pow(max(0.0, 1.0 - abs(sin(q.x * 4.2 + bodyNoise * 2.5))), 12.0) * body;
float veilParticles = gestureBurst(p, burstOrigin, burstDirection, burstAge, 79.0, 0.26, 0.03) * burstEnergy;
curtain += lowerMist * 0.18 + foldLight * 0.07 + veilParticles * 0.56;
v += curtain * 1.18;
`,
    warp: `
p.x += (fbm(p * vec2(0.9, 1.8) - vec2(0.0, t * 0.02)) - 0.5) * 0.024;
`,
    color: `mix(vec3(0.0, 0.58, 0.94), vec3(0.08, 0.86, 0.72), 0.5 + 0.5 * sin(uv.x * 1.5 - uv.y * 0.8)) * shade * 0.72 + vec3(0.48, 0.22, 0.9) * pow(clamp(shade, 0.0, 1.0), 2.55) * 0.2 + vec3(0.94, 1.0, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.9) * 0.16`,
    post: `
float veilFog = fbm(uv * vec2(0.72, 1.85) - vec2(0.0, iTime * 0.012));
color += vec3(0.006, 0.02, 0.055) * veilFog * smoothstep(1.85, 0.0, length(uv)) * 0.1;
color *= 1.0 - smoothstep(0.74, 1.9, length(uv)) * 0.08;
`,
    intensity: 1.06,
    motion: 1.04,
    detail: 2.6,
    atmosphere: 0.04,
    waterClarity: 1,
  }),
]
