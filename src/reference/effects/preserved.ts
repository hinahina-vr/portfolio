import { effects as legacyEffects } from './legacy'
import { categoryById } from './categories'
import { makeEffect } from './glsl'
import type { CategoryId, EffectDefinition, LegacyEffectDefinition } from './types'

type LegacyMeta = {
  categoryId: CategoryId
  titleJa: string
  descriptionJa: string
  tags: string[]
}

const legacyMeta: Record<string, LegacyMeta> = {
  'particle-bloom': {
    categoryId: 'game-vfx',
    titleJa: 'パーティクルブルーム',
    descriptionJa: 'ゲーム演出向けの発光粒子とマウス重力。',
    tags: ['particle', 'spark', 'bloom', 'game'],
  },
  'fish-school': {
    categoryId: 'aquatic',
    titleJa: '魚群',
    descriptionJa: '群れとして流れる魚影のプロシージャル表現。',
    tags: ['fish', 'school', 'water', 'aquatic'],
  },
  'bubble-rise': {
    categoryId: 'aquatic',
    titleJa: '上昇する泡',
    descriptionJa: '屈折リムと水中の霞を持つ泡の流れ。',
    tags: ['bubble', 'water', 'rim', 'aquatic'],
  },
  'water-caustics': {
    categoryId: 'aquatic',
    titleJa: '水面焦線',
    descriptionJa: '水中に揺れる屈折光のパターン。',
    tags: ['caustics', 'water', 'light'],
  },
  'ember-flame': {
    categoryId: 'fire-smoke',
    titleJa: '残り火の炎',
    descriptionJa: '火柱と火の粉が剥がれていくスタイライズ炎。',
    tags: ['fire', 'ember', 'smoke', 'game'],
  },
  'nebula-dust': {
    categoryId: 'space',
    titleJa: '星雲の塵',
    descriptionJa: 'ゆっくり回転する星間雲と星屑。',
    tags: ['space', 'nebula', 'stars', 'dust'],
  },
  'warp-tunnel': {
    categoryId: 'motion-tunnels',
    titleJa: 'ワープトンネル',
    descriptionJa: '高速な放射状トンネルとリングパルス。',
    tags: ['tunnel', 'motion', 'warp', 'speed'],
  },
  'prism-glitch': {
    categoryId: 'post-fx',
    titleJa: 'プリズムグリッチ',
    descriptionJa: '走査線、色収差、画面の歪みを使うポストエフェクト。',
    tags: ['glitch', 'scanline', 'post', 'screen'],
  },
}

const legacyOverrides: Partial<Record<string, EffectDefinition>> = {
  'warp-tunnel': makeEffect({
    id: 'warp-tunnel',
    title: 'Warp Tunnel',
    titleJa: 'ワープトンネル',
    categoryId: 'motion-tunnels',
    description: 'A bright layered warp corridor with curved depth lanes, translucent fog, and velocity dust.',
    descriptionJa: '曲がる深度レーン、透明フォグ、速度粒子を重ねた明るいワープ回廊。',
    accentColor: '#60a5fa',
    tags: ['tunnel', 'motion', 'warp', 'speed'],
    field: `
vec2 q = p;
q.x += 0.1 * sin(q.y * 2.6 + t * 0.44);
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.55, 0.03, r);
float corridor = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float z = 1.0 / max(r + fi * 0.035, 0.08);
  float lane = stroke(sin(a * (12.0 + fi * 5.0 + uDetail) + z * 1.1 - t * (1.4 + fi * 0.22)), 0.052 + fi * 0.014);
  float ring = lineGlow(fract(z * 0.42 - t * (0.72 + fi * 0.08)) - 0.5, 0.038 + fi * 0.012);
  corridor += (lane * 0.7 + ring) * depth * (0.9 - fi * 0.12) / (0.74 + r);
}
vec2 g = vec2(a * 2.4, 1.0 / max(r, 0.12)) + vec2(t * 0.22, -t * 1.1);
vec2 f = fract(g * vec2(12.0, 4.5)) - 0.5;
float dust = smoothstep(0.055, 0.0, length(f)) * step(0.76, hash21(floor(g * vec2(12.0, 4.5))));
float fog = noise(q * vec2(1.2, 0.9) + vec2(t * 0.022, -t * 0.018)) * depth;
v += corridor * 1.34 + dust * 0.78 + fog * 0.32 + depth * 0.1;
`,
    color: `vec3(0.008, 0.02, 0.045) + vec3(0.055, 0.11, 0.2) * mask + mix(uPrimary, vec3(0.72, 0.98, 1.0), 0.38) * shade * 0.62 + vec3(0.86, 0.96, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.12) * 0.34`,
    post: `
color += vec3(0.035, 0.075, 0.13) * mask * (0.16 + depthCue * 0.18);
color += uPrimary * volumetric * 0.16;
`,
    intensity: 1.12,
    motion: 1.18,
    detail: 2.8,
  }),
  'prism-glitch': makeEffect({
    id: 'prism-glitch',
    title: 'Prism Glitch',
    titleJa: 'プリズムグリッチ',
    categoryId: 'post-fx',
    description: 'Transparent chromatic breakage with glossy screen shards and floating signal mist.',
    descriptionJa: '艶のある画面片と信号霧が漂う、透明な色分離グリッチ。',
    accentColor: '#a78bfa',
    tags: ['glitch', 'scanline', 'post', 'screen'],
    field: `
vec2 q = p;
float n = fbm(q * vec2(1.8, 2.4) + vec2(t * 0.08, -t * 0.06));
q.x += (n - 0.5) * 0.22;
float panes = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 c = vec2(hash11(fi * 17.0) * 1.7 - 0.85, hash11(fi * 23.0 + 4.0) * 1.2 - 0.6);
  vec2 b = rot(hash11(fi + 9.0) * 1.2 - 0.6) * (q - c);
  float tile = stroke(sdBox(b, vec2(0.15 + 0.04 * hash11(fi), 0.045 + 0.02 * hash11(fi + 2.0))), 0.018);
  float glowPane = glow(length((b) / vec2(0.36, 0.16)), 0.82) * 0.18;
  panes += (tile + glowPane) * (0.62 + 0.38 * sin(t * 0.7 + fi));
}
float tear = lineGlow(q.y + 0.18 * sin(q.x * 2.0 + t * 0.25), 0.12);
tear += lineGlow(q.y - 0.38 + 0.1 * sin(q.x * 3.0 - t * 0.2), 0.08) * 0.72;
vec2 g = q * vec2(20.0, 12.0) + vec2(t * 0.45, -t * 0.14);
vec2 f = fract(g) - 0.5;
float pixels = smoothstep(0.045, 0.0, length(f)) * step(0.86, hash21(floor(g)));
v += panes * 0.95 + tear * 0.74 + pixels * 0.78 + n * 0.22;
v *= smoothstep(1.55, 0.05, length(p));
`,
    color: `vec3(0.018, 0.01, 0.046) + vec3(0.08, 0.04, 0.16) * mask + mix(uPrimary, vec3(0.64, 0.95, 1.0), 0.36) * shade * 0.6 + vec3(1.0, 0.78, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.26`,
    post: `
color.r += shade * 0.045;
color.g += shade * 0.018;
color.b += shade * 0.052;
color += vec3(0.06, 0.035, 0.13) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.1,
    motion: 0.82,
    detail: 2.55,
  }),
  'ember-flame': makeEffect({
    id: 'ember-flame',
    title: 'Ember Flame',
    titleJa: '残り火の炎',
    categoryId: 'fire-smoke',
    description: 'A tall stylized flame stack with ember spray, blue-hot core, and smoky backlight.',
    descriptionJa: '火の粉を噴き上げる高い炎、青白い熱芯、煙の逆光を重ねたスタイライズ炎。',
    accentColor: '#ff8a2a',
    tags: ['fire', 'ember', 'smoke', 'flame'],
    field: `
vec2 q = p;
q.y += 0.72;
q.x += 0.1 * sin(q.y * 2.8 + t * 0.7) + 0.05 * sin(q.y * 7.0 - t * 1.2);

float flame = 0.0;
float core = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  vec2 s = q;
  s.y -= fi * 0.08;
  s.x += sin(s.y * (4.0 + fi * 0.35) + t * (1.2 + fi * 0.08) + fi) * (0.07 + fi * 0.01);
  float height = smoothstep(-0.95, -0.08, s.y) * (1.0 - smoothstep(0.05, 1.15, s.y));
  float width = 0.34 - s.y * 0.18 + fi * 0.012;
  float tongue = lineGlow(s.x, max(width * 0.24, 0.025)) * height;
  float burn = fbm(s * vec2(5.0 + uDetail, 2.1 + fi * 0.2) - vec2(0.0, t * 0.56));
  flame += tongue * smoothstep(0.14, 0.92, burn) * (0.7 + fi * 0.05);
  core += lineGlow(s.x, max(width * 0.12, 0.018)) * height * smoothstep(-0.78, 0.18, s.y) * (0.5 + burn * 0.5);
}

float baseCoal = glow(length((p - vec2(0.0, -0.82)) / vec2(1.0, 0.28)), 0.6);
float smoke = fbm((p + vec2(0.0, t * 0.08)) * vec2(1.4, 2.6)) * (1.0 - smoothstep(0.05, 1.45, length(p))) * smoothstep(-0.5, 0.85, p.y);
float embers = 0.0;
for (int i = 0; i < 30; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 40.8));
  float life = fract(seed.y + t * (0.1 + seed.x * 0.2));
  vec2 pos = vec2((seed.x - 0.5) * (0.5 + life * 1.25), -0.72 + life * 1.9);
  pos.x += sin(t * 0.8 + fi) * 0.08;
  vec2 e = p - pos;
  float tail = lineGlow(sdSegment(e, vec2(0.0), vec2(-0.04, 0.1)), 0.008 + seed.x * 0.006);
  embers += tail * (1.0 - life) * smoothstep(0.0, 0.14, life);
}
v += flame * 0.86 + core * 0.78 + baseCoal * 0.72 + smoke * 0.18 + embers * 0.72;
`,
    warp: `
p.x += (fbm(p * 2.4 + vec2(t * 0.08, 0.0)) - 0.5) * 0.08;
p.y += 0.03 * sin(p.x * 4.5 - t * 0.7);
`,
    color: `vec3(0.024, 0.012, 0.006) + vec3(0.18, 0.045, 0.012) * mask + uPrimary * shade * 0.7 + vec3(1.0, 0.32, 0.02) * pow(clamp(shade, 0.0, 1.0), 1.4) * 0.44 + vec3(0.4, 0.65, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.12 + vec3(1.0, 0.9, 0.55) * pow(clamp(shade, 0.0, 1.0), 3.3) * 0.2`,
    post: `
float emberHaze = fbm(uv * vec2(1.4, 2.0) + vec2(iTime * 0.02, -iTime * 0.035));
float lowBloom = smoothstep(-1.05, -0.42, uv.y) * smoothstep(1.25, 0.05, abs(uv.x));
color += vec3(0.28, 0.07, 0.015) * emberHaze * smoothstep(1.55, 0.0, length(uv)) * 0.22;
color += vec3(1.0, 0.36, 0.04) * lowBloom * 0.24;
color += vec3(1.0, 0.34, 0.04) * pow(clamp(shade, 0.0, 1.0), 2.3) * 0.12;
`,
    intensity: 1.2,
    motion: 1.08,
    detail: 3.0,
  }),
  'nebula-dust': makeEffect({
    id: 'nebula-dust',
    title: 'Nebula Dust',
    titleJa: '星雲の塵',
    categoryId: 'space',
    description: 'Transparent volumetric nebula sheets with deep star dust, color bloom, and drifting parallax.',
    descriptionJa: '透ける星雲の層、奥行きのある星屑、色づく発光霧がゆっくり漂う宇宙雲。',
    accentColor: '#b28cff',
    tags: ['space', 'nebula', 'stars', 'dust', 'depth'],
    field: `
vec2 q = p;
float depthFog = smoothstep(1.8, 0.0, length(q * vec2(0.82, 1.0)));
float cloud = 0.0;
float luminousEdges = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 s = rot(-0.42 + fi * 0.18 + 0.02 * sin(t * 0.12 + fi)) * q;
  s += vec2(t * (0.018 + fi * 0.006), -t * (0.012 + fi * 0.004));
  s.x += 0.16 * sin(s.y * (1.7 + fi * 0.16) + t * (0.16 + fi * 0.03) + fi);
  float n = fbm(s * (1.18 + fi * 0.28) + fi * 4.1);
  float sheet = smoothstep(0.34 + fi * 0.028, 0.92, n) * depthFog;
  float rim = stroke(n - (0.52 + 0.04 * sin(t * 0.35 + fi)), 0.028 + fi * 0.003) * depthFog;
  cloud += sheet * (0.24 / (1.0 + fi * 0.2));
  luminousEdges += rim * (0.22 / (1.0 + fi * 0.18));
}

float stars = 0.0;
float dust = 0.0;
for (int i = 0; i < 88; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 7.7));
  float z = fract(seed.y + t * (0.01 + seed.x * 0.025));
  vec2 pos = (seed * 2.0 - 1.0) * vec2(1.65, 1.05) * mix(1.18, 0.56, z);
  pos += vec2(sin(t * 0.08 + fi), cos(t * 0.06 + fi * 1.3)) * (0.03 + z * 0.06);
  float star = smoothstep(0.004 + z * 0.018, 0.0, length(q - pos));
  float halo = smoothstep(0.026 + z * 0.08, 0.0, length(q - pos));
  float twinkle = 0.45 + 0.55 * sin(t * (0.7 + seed.x * 1.8) + fi * 2.8);
  stars += (star * (0.7 + z) + halo * 0.08) * twinkle;
  dust += smoothstep(0.003 + seed.x * 0.006, 0.0, length(q - pos * 1.04)) * smoothstep(0.4, 1.0, z) * 0.4;
}

float colorPocket = fbm(q * vec2(1.4, 2.0) + vec2(t * 0.018, -t * 0.022)) * depthFog;
v += cloud * 0.72 + luminousEdges * 0.7 + stars * 0.78 + dust * 0.42 + colorPocket * 0.18;
`,
    warp: `
p += 0.035 * vec2(
  fbm(p * vec2(1.7, 2.5) + vec2(t * 0.018, 0.0)) - 0.5,
  fbm(p * vec2(2.1, 1.8) + vec2(0.0, -t * 0.018)) - 0.5
);
`,
    color: `vec3(0.006, 0.004, 0.025) + vec3(0.08, 0.035, 0.16) * mask + uPrimary * shade * 0.42 + vec3(0.48, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.9) * 0.26 + vec3(1.0, 0.56, 0.86) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.18`,
    post: `
float nebulaFog = fbm(uv * vec2(1.2, 1.9) + vec2(iTime * 0.014, -iTime * 0.018));
float pocket = smoothstep(1.75, 0.0, length(uv * vec2(0.82, 1.0)));
color += vec3(0.055, 0.025, 0.12) * nebulaFog * pocket * 0.26;
color += vec3(0.15, 0.28, 0.42) * pocket * 0.08;
color *= 1.0 - 0.34 * smoothstep(0.72, 1.92, length(uv));
`,
    intensity: 1.16,
    motion: 0.78,
    detail: 2.85,
  }),
  'fish-school': makeEffect({
    id: 'fish-school',
    title: 'Fish School',
    titleJa: '魚群',
    categoryId: 'aquatic',
    description: 'Glass-clear fish school with prism scale glints, caustic glitter, and bright surface shafts.',
    descriptionJa: '透明な水に鱗のプリズム反射、光のゆらぎ、明るい水面光がきらめく魚群。',
    accentColor: '#7dfcf2',
    tags: ['fish', 'school', 'water', 'aquatic', 'depth'],
    field: `
float water = fbm(p * vec2(1.35, 2.2) + vec2(t * 0.028, -t * 0.044));
float currentNoise = fbm(p * 2.6 + vec2(-t * 0.04, t * 0.03));
v += water * 0.026;

float cleanCaustic = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 flow = p * (2.2 + fi * 0.55);
  flow += vec2(t * (0.035 + fi * 0.006), -t * (0.026 + fi * 0.004));
  float ribbon = sin(flow.x * (1.55 + fi * 0.18) + flow.y * (0.62 + fi * 0.11) + fbm(flow + fi) * 2.4 + fi * 1.7);
  cleanCaustic += pow(max(0.0, ribbon), 13.0) * (0.38 + fi * 0.08);
}
v += cleanCaustic * smoothstep(1.65, 0.08, length(p * vec2(0.82, 1.0))) * 0.12;

vec2 schoolPull = vec2(0.18 * sin(t * 0.09), 0.06 * cos(t * 0.11));
for (int i = 0; i < 86; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 19.2));
  vec2 seedB = hash22(vec2(fi, 53.8));
  float live = step(fi, 40.0 + uDetail * 9.0);
  float group = floor(mod(fi, 5.0));
  float layer = pow(seed.y, 1.35);
  float orbitSpeed = (0.11 + seedB.x * 0.08) * mix(1.35, 0.58, layer);
  float angle = seed.x * 6.28318 + t * orbitSpeed + group * 0.47;
  float schoolRadius = 0.26 + pow(seedB.y, 0.58) * 0.82;
  vec2 orbit = vec2(cos(angle), sin(angle));
  vec2 shoal = orbit * vec2(0.82, 0.34) * schoolRadius;
  shoal.x += 0.1 * sin(angle * 2.0 - t * 0.18 + group);
  shoal.y += (group - 2.0) * 0.025;
  vec2 center = schoolPull + shoal * mix(1.0, 0.62, layer);

  vec2 tangent = normalize(vec2(-sin(angle) * 0.82, cos(angle) * 0.34) + vec2(-0.16, 0.05 * sin(t * 0.22 + group)));
  vec2 normal = vec2(-tangent.y, tangent.x);
  float golden = fi * 2.399963 + group * 0.7;
  float radius = pow(hash21(vec2(fi, 5.3)), 0.68);
  vec2 separation = tangent * cos(golden) * radius * 0.16 + normal * sin(golden) * radius * 0.13;
  vec2 cohesion = -shoal * (0.025 + 0.035 * sin(t * 0.16 + group));
  vec2 alignment = normal * (currentNoise - 0.5) * 0.075 + tangent * (seedB.x - 0.5) * 0.055;
  vec2 pos = center + (separation + cohesion + alignment) * mix(1.1, 0.45, layer);

  float depth = mix(1.85, 0.68, layer);
  vec2 heading = normalize(tangent + normal * (0.18 * sin(t * (2.2 + seed.x) + fi) + 0.08 * (water - 0.5)));
  vec2 q = rot(-atan(heading.y, heading.x)) * ((p - pos) * depth);
  float scale = mix(0.024, 0.07, 1.0 - layer);
  q /= scale;

  float swim = sin(t * (6.5 + seed.x * 3.0) + fi);
  q.y += 0.08 * swim * smoothstep(-1.4, -0.2, q.x);
  float body = smoothstep(1.0, 0.0, length((q - vec2(0.05, 0.0)) / vec2(1.42, 0.38)));
  float head = smoothstep(0.42, 0.0, length((q - vec2(0.82, 0.0)) / vec2(0.6, 0.42)));
  vec2 tailP = q + vec2(1.05, 0.0);
  tailP = rot(swim * 0.34) * tailP;
  float tail = smoothstep(0.48, 0.0, abs(tailP.x) * 0.95 + abs(tailP.y) * 2.1);
  float fin = stroke(q.y - 0.16 * sign(sin(fi)), 0.028)
    * smoothstep(-0.35, 0.22, q.x)
    * smoothstep(1.15, 0.35, q.x);
  float eye = smoothstep(0.08, 0.0, length(q - vec2(0.93, 0.08 * sign(sin(fi)))));
  float bodyMask = max(max(body, head * 0.75), tail * 0.72);
  float flank = stroke(q.y - 0.05, 0.035) * smoothstep(-0.7, 0.2, q.x) * smoothstep(1.05, 0.15, q.x);
  float rim = stroke(length((q - vec2(0.05, 0.0)) / vec2(1.5, 0.43)) - 0.86, 0.06);
  float scaleGlint = pow(max(0.0, sin(q.x * 4.6 - q.y * 7.8 + t * (1.6 + seed.x) + fi)), 16.0) * body;
  float prism = pow(max(0.0, dot(normalize(vec2(0.9, 0.42)), heading)), 3.0) * body;
  float wake = stroke(q.y + 0.05 * sin(q.x * 3.0 + fi), 0.028)
    * smoothstep(-2.5, -0.55, q.x)
    * smoothstep(-0.45, -1.3, q.x);
  float front = mix(0.18, 0.92, 1.0 - layer);
  v += live * bodyMask * front * 0.82;
  v += live * (flank * 0.42 + fin * 0.2 + eye * 0.24 + wake * 0.08 + rim * 0.18 + scaleGlint * 0.34 + prism * 0.16) * front;
}

for (int i = 0; i < 46; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 80.3));
  vec2 dotPos = seed * 2.25 - 1.12;
  dotPos.x *= 1.68;
  dotPos += vec2(0.08 * sin(dotPos.y * 2.3 + t * 0.24 + fi), -t * (0.012 + seed.x * 0.018));
  dotPos.y = fract(dotPos.y * 0.5 + 0.5) * 2.24 - 1.12;
  float plankton = smoothstep(0.01 + seed.y * 0.018, 0.0, length(p - dotPos));
  float twinkle = pow(max(0.0, sin(t * (2.2 + seed.x * 3.2) + fi * 1.37)), 5.0);
  v += plankton * (0.09 + 0.12 * seed.x) * (0.65 + twinkle);
}
`,
    warp: `
p.x += 0.038 * fbm(p * 1.45 + vec2(t * 0.038, 0.0));
p.y += 0.018 * sin(p.x * 2.0 - t * 0.24);
`,
    color: `vec3(0.004, 0.035, 0.055) + vec3(0.018, 0.18, 0.22) * mask + mix(uPrimary, vec3(0.75, 1.0, 0.96), 0.46) * shade * 0.52 + vec3(0.98, 1.0, 0.9) * pow(clamp(shade, 0.0, 1.0), 2.35) * 0.42`,
    post: `
float depthFog = smoothstep(2.0, 0.0, length(uv * vec2(0.72, 1.0)));
float glassHaze = fbm(uv * vec2(1.5, 2.7) + vec2(iTime * 0.018, -iTime * 0.026));
float caustic = pow(max(0.0, sin((uv.x * 1.7 + uv.y * 0.33) * 5.8 + glassHaze * 2.6 + iTime * 0.24)), 10.0);
float surfaceShaft = pow(max(0.0, sin((uv.x * 0.82 - uv.y * 0.2) * 6.2 + glassHaze * 2.1 + iTime * 0.18)), 7.0);
vec2 sparkleGrid = floor((uv + vec2(iTime * 0.018, -iTime * 0.012)) * 88.0);
vec2 sparkleLocal = fract((uv + vec2(iTime * 0.018, -iTime * 0.012)) * 88.0) - 0.5;
float sparkleSeed = hash21(sparkleGrid);
float sparkle = smoothstep(0.018, 0.0, length(sparkleLocal - (hash22(sparkleGrid + 17.0) - 0.5) * 0.38))
  * step(0.966, sparkleSeed)
  * pow(max(0.0, sin(iTime * (2.2 + sparkleSeed * 4.5) + sparkleSeed * 19.0)), 4.0);
color += vec3(0.025, 0.17, 0.23) * depthFog * (0.36 + glassHaze * 0.18);
color += vec3(0.22, 0.95, 1.0) * caustic * depthFog * 0.26;
color += vec3(0.1, 0.4, 0.5) * surfaceShaft * depthFog * 0.16;
color += vec3(0.95, 1.0, 0.86) * sparkle * depthFog * 0.42;
color = mix(color, vec3(0.01, 0.055, 0.08), smoothstep(1.15, 2.0, length(uv)) * 0.2);
color *= 1.0 - 0.22 * smoothstep(0.9, 1.95, length(uv));
`,
    intensity: 1.16,
    motion: 0.86,
    detail: 3.2,
  }),
  'bubble-rise': makeEffect({
    id: 'bubble-rise',
    title: 'Bubble Rise',
    titleJa: '泡の上昇',
    categoryId: 'aquatic',
    description: 'Transparent bubble rims, prismatic highlights, and slow layered upward drift.',
    descriptionJa: '透明な泡の縁、虹色のハイライト、奥行きのあるゆっくりした上昇。',
    accentColor: '#78bfff',
    tags: ['bubble', 'water', 'rim', 'aquatic', 'depth'],
    field: `
float fog = fbm(p * vec2(1.4, 2.8) + vec2(t * 0.018, -t * 0.048));
float source = smoothstep(-1.12, -0.62, p.y) * smoothstep(1.25, 0.05, abs(p.x));
v += fog * 0.08 + source * fbm(p * vec2(5.0, 1.6) - vec2(0.0, t * 0.25)) * 0.08;

for (int layer = 0; layer < 2; layer++) {
  float fl = float(layer);
  vec2 grid = p * vec2(6.2 + fl * 3.5, 8.0 + fl * 4.0);
  grid.y -= t * (0.18 + fl * 0.07);
  grid.x += 0.28 * sin(grid.y * 0.42 + t * 0.22 + fl);
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  vec2 jitter = hash22(cell + fl * 23.7) - 0.5;
  float present = step(0.82 - fl * 0.08, hash21(cell + vec2(4.1, 8.7)));
  float d = length(local - jitter * 0.46);
  float microR = 0.055 + 0.035 * hash21(cell + 9.4);
  float micro = stroke(d - microR, 0.012) * present * (0.16 + fl * 0.08);
  float glint = smoothstep(0.035, 0.0, length(local - jitter * 0.46 - vec2(-microR * 0.45, microR * 0.42)));
  v += (micro + glint * 0.08) * smoothstep(1.7, 0.0, length(p));
}

for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 91.7));
  float layer = pow(seed.y, 1.35);
  float detailGate = step(fi, 16.0 + uDetail * 5.2);
  float riseSpeed = 0.022 + seed.x * 0.044 + (1.0 - layer) * 0.018;
  float life = fract(seed.y + t * riseSpeed + fi * 0.013);
  float edgeFade = smoothstep(0.02, 0.12, life) * (1.0 - smoothstep(0.88, 1.0, life));
  vec2 pos = vec2(mix(-1.42, 1.42, seed.x), -1.24 + life * 2.62);
  float current = sin(pos.y * (1.6 + seed.y * 1.2) + t * (0.3 + seed.x * 0.35) + fi);
  current += 0.42 * sin(pos.y * 4.2 - t * 0.46 + fi * 1.7);
  current += 0.35 * (fbm(vec2(pos.y * 1.25 + fi, t * 0.08 + seed.x * 3.0)) - 0.5);
  pos.x += current * (0.045 + (1.0 - layer) * 0.11);
  float depth = mix(1.7, 0.58, layer);
  vec2 q = (p - pos) * depth;
  q = rot(0.06 * sin(t * 0.4 + fi)) * q;
  q.x *= 0.9 + 0.16 * sin(t * 0.52 + fi);
  float r = mix(0.018, 0.12, pow(seed.x, 1.7)) * mix(0.72, 1.15, 1.0 - layer);
  float d = length(q);
  float shell = smoothstep(r * 1.12, r * 0.74, d);
  float outerRim = stroke(d - r, 0.005 + 0.006 * (1.0 - layer));
  float innerRim = stroke(d - r * (0.66 + 0.08 * sin(t * 0.7 + fi)), 0.0035) * 0.22;
  float crescentMask = smoothstep(-0.85, 0.2, q.x / max(r, 0.001)) * smoothstep(1.0, -0.35, q.y / max(r, 0.001));
  float crescent = stroke(d - r * 0.86, 0.0038 + seed.x * 0.003) * crescentMask;
  float softFilm = shell * (0.08 + 0.12 * fbm(q * (14.0 + seed.x * 10.0) + vec2(t * 0.12, fi)));
  vec2 highlightA = vec2(-r * 0.34, r * 0.36);
  vec2 highlightB = vec2(r * 0.24, -r * 0.22);
  float glintA = smoothstep(r * 0.24, 0.0, length(q - highlightA));
  float glintB = smoothstep(r * 0.13, 0.0, length(q - highlightB)) * 0.38;
  float wake = stroke(q.x + 0.035 * sin(q.y * 10.5 + t * 0.8 + fi), 0.0035 + seed.x * 0.003)
    * smoothstep(0.02, 0.24, q.y)
    * smoothstep(0.78, 0.0, q.y);
  float causticPinch = pow(max(0.0, 1.0 - abs(d - r * 0.92) / max(r * 0.28, 0.001)), 2.4) * (0.25 + 0.25 * sin(fi + t));
  float front = mix(0.32, 1.0, 1.0 - layer);
  v += detailGate * edgeFade * front * (outerRim * 0.56 + innerRim + crescent * 0.38 + softFilm + glintA * 0.58 + glintB + wake * 0.12 + causticPinch * 0.16);
}
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 c = vec2(-0.48 + fi * 0.32, -0.58 + 0.07 * sin(t * 0.24 + fi));
  float pressure = stroke(fract(length(p - c) * (2.7 + fi * 0.32) - t * 0.16) - 0.5, 0.018)
    * smoothstep(0.62, 0.0, length(p - c));
  v += pressure * 0.08 * source;
}
`,
    warp: `
p.x += (fbm(p * 1.6 + vec2(t * 0.035, 0.0)) - 0.5) * 0.07;
p.y += (fbm(p.yx * 1.9 - vec2(0.0, t * 0.04)) - 0.5) * 0.035;
`,
    color: `vec3(0.003, 0.018, 0.035) + vec3(0.015, 0.09, 0.13) * mask + mix(uPrimary, vec3(0.72, 1.0, 0.94), 0.45) * shade * 0.42 + pal(shade * 0.22 + length(uv) * 0.08 + fbm(uv * 2.4 + iTime * 0.035) * 0.16, vec3(0.28), vec3(0.18), vec3(0.8, 0.58, 0.45), vec3(0.02, 0.2, 0.36)) * pow(clamp(shade, 0.0, 1.0), 1.8) * 0.2 + vec3(0.9, 1.0, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.4) * 0.22`,
    post: `
float haze = fbm(uv * vec2(1.8, 3.2) + vec2(iTime * 0.018, -iTime * 0.032));
float shaft = pow(max(0.0, sin((uv.x * 1.2 + uv.y * 0.25) * 5.4 + haze * 2.0 + iTime * 0.16)), 8.0);
float bottomBloom = smoothstep(-1.1, -0.35, uv.y) * (1.0 - smoothstep(-0.25, 0.25, uv.y));
color += vec3(0.018, 0.08, 0.115) * haze * smoothstep(1.8, 0.0, length(uv));
color += vec3(0.04, 0.15, 0.17) * shaft * smoothstep(1.7, 0.0, length(uv)) * 0.14;
color += vec3(0.01, 0.08, 0.1) * bottomBloom * 0.16;
color *= 1.0 - 0.34 * smoothstep(0.68, 1.9, length(uv * vec2(0.8, 1.0)));
`,
    intensity: 1.02,
    motion: 0.72,
    detail: 2.6,
  }),
  'water-caustics': makeEffect({
    id: 'water-caustics',
    title: 'Water Caustics',
    titleJa: '水面焦線',
    categoryId: 'aquatic',
    description: 'Layered refracted light sheets sweeping across underwater haze.',
    descriptionJa: '水中の霞を横切る層状の屈折光。',
    accentColor: '#bbf7d0',
    tags: ['caustics', 'water', 'light', 'aquatic'],
    field: `
vec2 q = p;
q += vec2(fbm(q * 1.5 + t * 0.04), fbm(q.yx * 1.7 - t * 0.035)) * 0.18;
float caustic = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 s = q * (1.8 + fi * 0.28);
  s += vec2(sin(s.y * 0.9 + t * (0.38 + fi * 0.04)), cos(s.x * 0.8 - t * (0.34 + fi * 0.03))) * 0.42;
  float fold = abs(sin(s.x + sin(s.y + t * 0.24 + fi)));
  float line = pow(1.0 - fold, 8.0 + fi * 0.8);
  float drift = smoothstep(-0.9, 0.2, q.y) * (1.0 - smoothstep(0.7, 1.3, q.y));
  caustic += line * drift * (0.22 - fi * 0.018);
}
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  float shaft = pow(max(0.0, sin((q.x * (1.2 + fi * 0.08) + q.y * 0.2) * 3.8 + t * 0.2 + fi)), 12.0);
  caustic += shaft * smoothstep(1.1, -0.2, q.y) * 0.06;
}
v += caustic + fbm(q * 2.2 - t * 0.04) * 0.08;
`,
    warp: `
p += vec2(fbm(p * 1.6 + t * 0.05), fbm(p * 1.4 - t * 0.04)) * 0.07;
`,
    color: `vec3(0.006, 0.035, 0.035) + vec3(0.02, 0.12, 0.1) * mask + uPrimary * shade * 0.52 + vec3(0.98, 1.0, 0.8) * pow(clamp(shade, 0.0, 1.0), 3.1) * 0.36`,
    post: `
float floorShade = smoothstep(-0.95, 0.55, uv.y);
float depthFog = smoothstep(2.0, 0.0, length(uv * vec2(0.75, 1.0)));
color += vec3(0.015, 0.07, 0.06) * depthFog;
color *= 0.82 + floorShade * 0.32;
color *= 1.0 - 0.36 * smoothstep(0.65, 1.95, length(uv));
`,
    intensity: 1.14,
    motion: 0.72,
    detail: 2.8,
  }),
}

export const preservedEffects: EffectDefinition[] = (legacyEffects as LegacyEffectDefinition[]).map((effect) => {
  const override = legacyOverrides[effect.id]
  if (override) {
    return override
  }

  const meta = legacyMeta[effect.id]
  const category = categoryById[meta.categoryId]

  return {
    ...effect,
    categoryId: meta.categoryId,
    category: category.label,
    titleJa: meta.titleJa,
    descriptionJa: meta.descriptionJa,
    tags: meta.tags,
  }
})
