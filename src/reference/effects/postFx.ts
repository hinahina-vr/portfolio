import { makeEffect, type ShaderRecipe } from './glsl'

const postFxRecipes: ShaderRecipe[] = [
  {
    id: 'crt-bleed',
    title: 'CRT Bleed',
    titleJa: 'CRTブリード',
    categoryId: 'post-fx',
    description: 'Luminous phosphor bloom with transparent scan fields and drifting signal dust.',
    descriptionJa: '透明な走査フィールドと信号粒子を重ねた、発光CRTブリード。',
    accentColor: '#fb7185',
    tags: ['post', 'screen', 'crt-bleed'],
    field: `
vec2 q = p;
float barrel = length(q);
q *= 1.0 + barrel * barrel * 0.12;
float picture = fbm(q * vec2(2.2, 1.35) + vec2(t * 0.08, -t * 0.03));
float scanA = 0.5 + 0.5 * sin((q.y + t * 0.024) * 250.0);
float scanB = 0.5 + 0.5 * sin((q.y - t * 0.018) * 92.0 + picture * 2.0);
float phosphor = 0.5 + 0.5 * sin(q.x * 150.0 + sin(q.y * 10.0) * 0.8);
float bands = lineGlow(q.y + 0.28 * sin(q.x * 1.7 + t * 0.18), 0.11);
bands += lineGlow(q.y - 0.42 + 0.22 * sin(q.x * 1.2 - t * 0.12), 0.14) * 0.72;
vec2 g = q * vec2(18.0, 12.0) + vec2(t * 0.4, -t * 0.08);
vec2 f = fract(g) - 0.5;
float dust = smoothstep(0.06, 0.0, length(f)) * step(0.84, hash21(floor(g)));
v += picture * (0.42 + scanA * 0.26 + scanB * 0.16 + phosphor * 0.12) + bands * 0.7 + dust * 0.62;
v *= smoothstep(1.55, 0.05, barrel);
`,
    color: `vec3(0.04, 0.006, 0.022) + vec3(0.16, 0.035, 0.07) * mask + mix(uPrimary, vec3(0.6, 0.92, 1.0), 0.22) * shade * 0.5 + vec3(1.0, 0.72, 0.78) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.28`,
    post: `
color += vec3(0.12, 0.025, 0.05) * mask * (0.14 + depthCue * 0.18);
color.r += shade * 0.035;
color.b += shade * 0.025;
`,
    intensity: 1.08,
    motion: 0.58,
    detail: 2.45,
  },
  {
    id: 'datamosh-blocks',
    title: 'Datamosh Blocks',
    titleJa: 'データモッシュブロック',
    categoryId: 'post-fx',
    description: 'Prismatic compression shards drifting through glossy broken video haze.',
    descriptionJa: '割れた映像の霞を漂う、プリズム状の圧縮ブロック。',
    accentColor: '#a78bfa',
    tags: ['post', 'screen', 'datamosh-blocks'],
    field: `
vec2 q = p;
float smear = fbm(q * vec2(1.2, 3.0) + vec2(t * 0.22, -t * 0.08));
q.x += (smear - 0.5) * 0.32;
vec2 grid = q * (6.0 + uDetail * 1.8);
vec2 cell = floor(grid);
vec2 f = fract(grid) - 0.5;
float jump = step(0.62, hash21(cell + floor(t * 3.0)));
float offset = (hash21(cell + 4.0) - 0.5) * jump * 0.72;
f.x += offset;
float block = smoothstep(0.5, 0.04, max(abs(f.x), abs(f.y)));
float sliver = lineGlow(f.y + 0.24 * sin(hash21(cell) * 6.28 + t), 0.04) * jump;
vec2 fine = q * vec2(22.0, 14.0) + vec2(t * 0.5, -t * 0.16);
vec2 ff = fract(fine) - 0.5;
float pixels = smoothstep(0.045, 0.0, length(ff)) * step(0.86, hash21(floor(fine)));
float wash = lineGlow(q.y + 0.4 * sin(q.x * 1.5 + t * 0.16), 0.18);
v += block * (0.55 + jump * 0.5) + sliver * 0.9 + pixels * 0.76 + wash * 0.38 + smear * 0.16;
v *= smoothstep(1.55, 0.04, length(p));
`,
    color: `vec3(0.018, 0.01, 0.042) + vec3(0.07, 0.04, 0.16) * mask + mix(uPrimary, vec3(0.72, 0.96, 1.0), 0.34) * shade * 0.58 + vec3(1.0, 0.8, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.05) * 0.24`,
    post: `
color.r += shade * 0.04;
color.b += shade * 0.055;
color += vec3(0.06, 0.035, 0.13) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.12,
    motion: 0.88,
    detail: 2.45,
  },
  {
    id: 'heat-distortion',
    title: 'Heat Distortion',
    titleJa: 'ヒート歪み',
    categoryId: 'post-fx',
    description: 'Transparent hot-air membranes with bright refractive amber fog.',
    descriptionJa: '琥珀色の屈折霧をまとった、透明な熱気の膜。',
    accentColor: '#fb923c',
    tags: ['post', 'screen', 'heat-distortion'],
    field: `
vec2 q = p;
float heat = fbm(q * vec2(2.0, 5.0) + vec2(t * 0.08, -t * 0.42));
q.x += (heat - 0.5) * 0.34;
float veil = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float y = q.y + 0.62 - fi * 0.38 + 0.08 * sin(q.x * (2.0 + fi) + t * (0.34 + fi * 0.06));
  veil += lineGlow(y, 0.105 + fi * 0.02) * (0.9 - fi * 0.12);
}
vec2 g = q * vec2(11.0, 8.0) + vec2(t * 0.28, -t * 0.22);
vec2 f = fract(g) - 0.5;
float cinders = smoothstep(0.055, 0.0, length(f / vec2(1.0, 0.55))) * step(0.82, hash21(floor(g)));
float brightFold = lineGlow(q.x + 0.22 * sin(q.y * 2.5 + t * 0.5), 0.16) * smoothstep(1.0, -0.12, abs(q.y));
v += veil * 0.95 + brightFold * 0.58 + cinders * 0.7 + heat * 0.28;
v *= smoothstep(1.55, 0.06, length(p));
`,
    color: `vec3(0.06, 0.022, 0.004) + vec3(0.2, 0.09, 0.018) * mask + mix(uPrimary, vec3(1.0, 0.78, 0.32), 0.34) * shade * 0.6 + vec3(1.0, 0.88, 0.56) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.24`,
    post: `
color += vec3(0.18, 0.08, 0.02) * mask * (0.16 + depthCue * 0.18);
`,
    intensity: 1.08,
    motion: 0.74,
    detail: 2.4,
  },
  {
    id: 'lens-split',
    title: 'Lens Split',
    titleJa: 'レンズ分離',
    categoryId: 'post-fx',
    description: 'Clean prismatic lens membranes with liquid chromatic rings and no hard flare spikes.',
    descriptionJa: '硬い十字フレアを使わない、液体のようなプリズムレンズ膜。',
    accentColor: '#67e8f9',
    tags: ['post', 'screen', 'lens-split'],
    field: `
vec2 q = p;
float r = length(q / vec2(1.0, 0.84));
float a = atan(q.y, q.x);
float lens = glow(r, 0.92);
float rings = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float wobble = 0.025 * sin(a * (4.0 + fi) + t * (0.2 + fi * 0.05));
  rings += lineGlow(r - (0.22 + fi * 0.16 + wobble), 0.024 + fi * 0.012) * (0.92 - fi * 0.14);
}
float membrane = lineGlow(q.y + 0.16 * sin(q.x * 2.2 + t * 0.2), 0.22) * lens;
vec2 g = q * vec2(7.0, 5.0) + vec2(t * 0.08, -t * 0.04);
vec2 f = fract(g) - 0.5;
float bubbles = smoothstep(0.06, 0.0, length(f)) * step(0.82, hash21(floor(g)));
float edge = lineGlow(r - 0.76, 0.04);
v += rings * 1.05 + membrane * 0.52 + edge * 0.72 + bubbles * 0.5 + lens * 0.12;
`,
    color: `vec3(0.006, 0.028, 0.042) + vec3(0.03, 0.11, 0.15) * mask + mix(uPrimary, vec3(0.9, 0.78, 1.0), 0.36) * shade * 0.52 + vec3(0.75, 1.0, 0.98) * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.28`,
    post: `
color.r += shade * 0.02;
color.b += shade * 0.05;
color += vec3(0.02, 0.08, 0.1) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.05,
    motion: 0.52,
    detail: 2.3,
  },
  {
    id: 'scan-noise',
    title: 'Scan Noise',
    titleJa: 'スキャンノイズ',
    categoryId: 'post-fx',
    description: 'Bright layered scan curtains with soft signal particles and depth haze.',
    descriptionJa: '柔らかい信号粒子と奥行き霞を持つ、明るいスキャン幕。',
    accentColor: '#facc15',
    tags: ['post', 'screen', 'scan-noise'],
    field: `
vec2 q = p;
float waves = fbm(q * vec2(1.6, 3.0) + vec2(t * 0.06, -t * 0.22));
float lines = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float row = fract((q.y + 1.0 + t * (0.06 + fi * 0.02)) * (32.0 + fi * 18.0));
  float line = lineGlow(row - 0.5, 0.022 + fi * 0.01);
  float gate = 0.45 + 0.55 * hash11(floor((q.y + 1.0) * (22.0 + fi * 9.0)) + floor(t * 8.0));
  lines += line * gate * (0.9 - fi * 0.14);
}
float curtain = lineGlow(q.x + 0.2 * sin(q.y * 2.8 + t * 0.32), 0.22);
vec2 g = q * vec2(28.0, 14.0) + vec2(t * 0.8, -t * 0.16);
vec2 f = fract(g) - 0.5;
float pixels = smoothstep(0.055, 0.0, length(f)) * step(0.88, hash21(floor(g)));
v += lines * (0.48 + waves * 0.34) + curtain * 0.52 + pixels * 0.84 + waves * 0.18;
v *= smoothstep(1.55, 0.04, length(p));
`,
    color: `vec3(0.045, 0.034, 0.006) + vec3(0.16, 0.12, 0.028) * mask + mix(uPrimary, vec3(0.88, 1.0, 0.62), 0.34) * shade * 0.56 + vec3(1.0, 0.96, 0.68) * pow(clamp(shade, 0.0, 1.0), 2.05) * 0.26`,
    post: `
color += vec3(0.14, 0.1, 0.025) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.08,
    motion: 0.92,
    detail: 2.5,
  },
  {
    id: 'analog-tear',
    title: 'Analog Tear',
    titleJa: 'アナログティア',
    categoryId: 'post-fx',
    description: 'Rolling glossy video tears with neon signal fog and broken color membranes.',
    descriptionJa: 'ネオン信号霧と壊れた色膜が流れる、艶のあるアナログ裂け。',
    accentColor: '#f472b6',
    tags: ['post', 'screen', 'analog-tear'],
    field: `
vec2 q = p;
float bands = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float y = -0.72 + fi * 0.36 + 0.08 * sin(t * (0.42 + fi * 0.05) + fi);
  float tear = lineGlow(q.y - y + 0.11 * sin(q.x * (2.0 + fi * 0.3) + t * (0.7 + fi * 0.1)), 0.07 + fi * 0.012);
  float signal = pow(0.5 + 0.5 * sin(q.x * (8.0 + fi * 2.0) + t * (2.0 + fi * 0.2)), 2.8);
  bands += tear * (0.45 + signal * 0.65) * (0.9 - fi * 0.1);
}
float veil = fbm(q * vec2(1.6, 2.4) + vec2(t * 0.08, -t * 0.12));
vec2 g = q * vec2(13.0, 8.0) + vec2(t * 0.2, -t * 0.08);
vec2 f = fract(g) - 0.5;
float debris = smoothstep(0.055, 0.0, length(f / vec2(1.4, 0.5))) * step(0.84, hash21(floor(g)));
v += bands * 1.05 + veil * 0.32 + debris * 0.62;
v *= smoothstep(1.55, 0.05, length(p));
`,
    color: `vec3(0.04, 0.006, 0.042) + vec3(0.14, 0.035, 0.15) * mask + mix(uPrimary, vec3(0.72, 0.92, 1.0), 0.26) * shade * 0.58 + vec3(1.0, 0.76, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.28`,
    post: `
color.r += shade * 0.045;
color.b += shade * 0.035;
color += vec3(0.1, 0.035, 0.12) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.1,
    motion: 0.82,
    detail: 2.55,
  },
  {
    id: 'bloom-meter',
    title: 'Bloom Meter',
    titleJa: 'ブルームメーター',
    categoryId: 'post-fx',
    description: 'A glass HUD bloom analyzer with curved halos, floating lenses, and atmospheric feedback.',
    descriptionJa: '曲面の光輪、浮遊レンズ、空気感を持つガラスHUDブルーム解析表示。',
    accentColor: '#fef08a',
    tags: ['post', 'screen', 'bloom-meter'],
    field: `
vec2 q = p;
float panel = lineGlow(length(q / vec2(1.0, 0.72)) - 0.68, 0.032) * 0.46;
float petals = 0.0;
for (int i = 0; i < 18; i++) {
  float fi = float(i);
  float a = -2.55 + fi * 0.3;
  float amp = 0.16 + 0.22 * (0.5 + 0.5 * sin(t * (1.0 + hash11(fi) * 0.35) + fi * 0.75));
  vec2 dir = vec2(cos(a), sin(a));
  vec2 pos = dir * (0.42 + amp);
  vec2 b = rot(a + 1.57) * (q - pos);
  float lens = glow(length(b / vec2(0.055 + amp * 0.08, 0.18 + amp * 0.38)), 0.72);
  float rim = stroke(sdBox(b, vec2(0.042 + amp * 0.08, 0.09 + amp * 0.28)), 0.026);
  petals += (lens * 0.22 + rim * 0.34) * smoothstep(0.98, 0.12, length(q));
}
float arc = lineGlow(length(q / vec2(1.0, 0.72)) - 0.5, 0.038) * (0.55 + 0.45 * sin(atan(q.y, q.x) * 4.0 + t * 0.7));
arc += lineGlow(length(q / vec2(0.86, 0.6)) - 0.32, 0.04) * 0.6;
float feedback = lineGlow(q.y + 0.12 * sin(q.x * 3.0 + t * 0.2), 0.16);
vec2 g = q * vec2(13.0, 8.0) + vec2(t * 0.16, -t * 0.05);
vec2 f = fract(g) - 0.5;
float dust = smoothstep(0.05, 0.0, length(f)) * step(0.82, hash21(floor(g)));
v += petals * 1.16 + panel + arc * 0.82 + feedback * 0.46 + dust * 0.62;
v *= smoothstep(1.55, 0.05, length(p));
`,
    color: `vec3(0.045, 0.035, 0.008) + vec3(0.16, 0.13, 0.035) * mask + mix(uPrimary, vec3(0.65, 1.0, 0.9), 0.25) * shade * 0.58 + vec3(1.0, 0.96, 0.72) * pow(clamp(shade, 0.0, 1.0), 2.05) * 0.3`,
    post: `
color += vec3(0.14, 0.11, 0.03) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.08,
    motion: 0.9,
    detail: 2.35,
  },
]

export const postFxEffects = postFxRecipes.map((recipe) => makeEffect(recipe))
