import { makeEffect } from './glsl'

export const gameVfxEffects = [
  makeEffect({
    id: 'arc-burst',
    title: 'Backlight Flare',
    titleJa: '逆光フレア',
    categoryId: 'game-vfx',
    description: 'A cinematic backlight burst with anamorphic streaks, lens ghosts, and drifting dust.',
    descriptionJa: '逆光の芯、横に伸びる光条、レンズゴースト、漂うダストを重ねたフレア。',
    accentColor: '#f8d35d',
    tags: ['backlight', 'lens', 'flare', 'cinematic'],
    field: `
vec2 light = vec2(-0.32 + 0.035 * sin(t * 0.21), 0.04 + 0.025 * sin(t * 0.37));
vec2 d = p - light;
float r = length(d);
float pulse = 0.82 + 0.18 * sin(t * 1.7 + fbm(d * 3.0));
float core = 0.022 / max(r * r, 0.014);
float corona = smoothstep(0.62, 0.0, r) * (0.36 + 0.64 * fbm(d * 8.0 + vec2(t * 0.08, -t * 0.05)));
float bloom = smoothstep(1.0, 0.0, r) * 0.24 + smoothstep(0.36, 0.0, r) * 0.28;
float horizontal = exp(-abs(d.y) * 18.0) * smoothstep(1.65, 0.04, abs(d.x));
float razor = exp(-abs(d.y) * 92.0) * smoothstep(1.8, 0.0, abs(d.x));
vec2 s1 = rot(0.18) * d;
vec2 s2 = rot(-0.28) * d;
float diagonal = exp(-abs(s1.y) * 28.0) * smoothstep(1.05, 0.0, abs(s1.x)) * 0.22;
diagonal += exp(-abs(s2.y) * 34.0) * smoothstep(0.85, 0.0, abs(s2.x)) * 0.16;

float ghosts = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  float k = 0.18 + fi * 0.19;
  vec2 center = -light * k + vec2(0.06 * sin(t * 0.19 + fi), 0.025 * sin(t * 0.27 + fi * 1.7));
  vec2 q = p - center;
  float gr = 0.055 + 0.032 * fi;
  float disc = smoothstep(gr, 0.0, length(q));
  float ring = stroke(length(q) - gr * (0.82 + 0.08 * sin(t + fi)), 0.014 + fi * 0.002);
  ghosts += (disc * 0.18 + ring * 0.42) * (1.0 - fi * 0.095);
}

float dust = 0.0;
vec2 grid = p * (10.0 + uDetail * 2.0) + vec2(t * 0.08, -t * 0.03);
vec2 cell = floor(grid);
vec2 fp = fract(grid) - 0.5;
dust += smoothstep(0.075, 0.0, length(fp)) * step(0.93, hash21(cell));
dust *= smoothstep(1.35, 0.0, length(p - light));

float haze = fbm(p * 2.1 + vec2(t * 0.04, -t * 0.03)) * smoothstep(1.45, 0.0, length(p));
v += (core + corona * 0.42 + bloom + horizontal * 0.42 + razor * 0.62 + diagonal + ghosts * 0.5 + dust * 0.55 + haze * 0.16) * pulse;
`,
    warp: `
p += 0.018 * vec2(
  fbm(p * 3.0 + vec2(t * 0.08, 0.0)),
  fbm(p * 2.4 + vec2(0.0, -t * 0.06))
);
`,
    color: `vec3(0.06, 0.08, 0.14) * shade * 0.25 + uPrimary * shade * 0.86 + vec3(1.0, 0.72, 0.34) * pow(shade, 1.55) * 0.42`,
    post: `
vec2 flareLight = vec2(-0.32 + 0.035 * sin(t * 0.21), 0.04 + 0.025 * sin(t * 0.37));
vec2 flareD = uv - flareLight;
float flareR = length(flareD);
float hotLine = exp(-abs(flareD.y) * 44.0) * smoothstep(1.7, 0.0, abs(flareD.x));
color += vec3(1.0, 0.55, 0.18) * hotLine * 0.24;
color += vec3(0.15, 0.45, 1.0) * smoothstep(0.72, 0.0, flareR) * 0.12;
color += vec3(1.0, 0.9, 0.66) * pow(shade, 3.2) * 0.18;
`,
    intensity: 0.78,
    motion: 0.78,
    detail: 1.7,
  }),
  makeEffect({
    id: 'hit-spark-ring',
    title: 'Aether Well',
    titleJa: 'エーテルウェル',
    categoryId: 'game-vfx',
    description: 'A layered blue magic well with swirling floor light, rising wisps, and drifting motes.',
    descriptionJa: '床に広がる青白い渦、立ち上がる流体、漂う光粒子を重ねた魔法エフェクト。',
    accentColor: '#7dd3fc',
    tags: ['magic', 'aether', 'vortex', 'blue', 'motes'],
    field: `
vec2 floorP = vec2(p.x * 1.12, (p.y + 0.5) * 2.15);
float floorR = length(floorP);
float floorMask = smoothstep(1.2, 0.18, floorR) * smoothstep(-1.1, -0.25, p.y);
float twist = t * 0.34 + 1.15 / max(floorR + 0.24, 0.24);
vec2 swirlUv = rot(twist) * floorP;
float flow = fbm(swirlUv * 2.7 + vec2(t * 0.16, -t * 0.22));
float ringBands = smoothstep(0.58, 1.0, sin(floorR * (18.0 + uDetail * 3.0) - t * 4.0 + flow * 2.4) * 0.5 + 0.5);
float floorGlow = floorMask * (0.24 + ringBands * 0.5 + flow * 0.38);
float rimWarp = sin(swirlUv.x * 4.2 - swirlUv.y * 2.8 + t) * 0.03 + flow * 0.025;
float rim = stroke(floorR - 0.8 - rimWarp, 0.055) * floorMask;

float heightMask = smoothstep(-0.78, -0.25, p.y) * smoothstep(1.08, 0.18, p.y);
float columnWidth = mix(0.42, 0.13, smoothstep(-0.55, 1.0, p.y));
float columnNoise = fbm(vec2(p.x * 2.2 + sin(p.y * 3.0), p.y * 1.4 - t * 0.45));
float columnCore = smoothstep(columnWidth * 0.62, 0.0, abs(p.x + (columnNoise - 0.5) * 0.28)) * heightMask;
columnCore *= 0.42 + 0.58 * fbm(vec2(p.x * 5.0, p.y * 2.6 - t * 0.6));
float veil = smoothstep(columnWidth * 1.65, 0.0, abs(p.x + sin(p.y * 5.0 + t) * 0.12)) * heightMask * 0.24;
float interior = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  float ribbonX = sin(p.y * (2.2 + fi * 0.31) + t * (0.46 + fi * 0.04) + fi * 2.0) * (0.12 + fi * 0.018);
  float ribbon = smoothstep(0.025, 0.0, abs(p.x - ribbonX)) * smoothstep(0.72, 0.08, abs(p.x));
  interior += ribbon * heightMask * (0.22 + hash11(fi) * 0.22);
}

float wisps = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  float lane = -0.46 + fi * 0.115 + sin(t * 0.22 + fi * 2.1) * 0.08;
  float yFlow = fract((p.y + 0.9) * 0.55 + t * (0.09 + hash11(fi) * 0.08) + fi * 0.17);
  float curl = sin(p.y * (4.2 + hash11(fi + 2.0) * 3.0) + t * (1.1 + fi * 0.05) + fi) * 0.12;
  float line = p.x - lane - curl - (columnNoise - 0.5) * 0.12;
  float strand = smoothstep(0.034, 0.0, abs(line)) * smoothstep(0.0, 0.18, yFlow) * smoothstep(1.0, 0.5, yFlow);
  wisps += strand * heightMask * (0.45 + hash11(fi + 5.0) * 0.7);
}

float motes = 0.0;
for (int i = 0; i < 18; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 7.3));
  float rise = fract(seed.y + t * (0.08 + seed.x * 0.13));
  vec2 pos = vec2((seed.x - 0.5) * (1.2 - rise * 0.35) + sin(t + fi) * 0.04, -0.58 + rise * 1.45);
  float pulse = 0.6 + 0.4 * sin(t * 4.0 + fi * 2.7);
  motes += smoothstep(0.022 + seed.x * 0.018, 0.0, length(p - pos)) * pulse * smoothstep(1.0, 0.12, rise);
}

float verticalFlash = smoothstep(0.045, 0.0, abs(p.x + sin(p.y * 4.0 + t * 1.5) * 0.08)) * heightMask * 0.18;
v += floorGlow * 0.95 + rim * 0.7 + columnCore * 0.24 + veil + interior * 0.6 + wisps * 0.62 + motes * 0.95 + verticalFlash;
`,
    warp: `
p.x += 0.04 * sin(p.y * 4.0 + t * 0.7);
p.y += 0.025 * fbm(p * 2.0 + t * 0.08);
`,
    color: `vec3(0.03, 0.09, 0.34) * shade * 0.72 + uPrimary * shade * 0.58 + vec3(0.74, 0.92, 1.0) * pow(shade, 1.7) * 0.42`,
    post: `
color += vec3(0.05, 0.12, 0.44) * smoothstep(1.25, 0.0, length(uv));
color += vec3(0.22, 0.55, 1.0) * pow(shade, 2.7) * 0.14;
`,
    intensity: 0.82,
    motion: 1.05,
    detail: 2.1,
  }),
  makeEffect({
    id: 'muzzle-star',
    title: 'Muzzle Star',
    titleJa: 'マズルスター',
    categoryId: 'game-vfx',
    description: 'A scattered muzzle flash with hot shards, sparks, and smoky fallout.',
    descriptionJa: '熱い破片、火花、煙を散らした発射フラッシュ。',
    accentColor: '#fde68a',
    tags: ['flash', 'star', 'weapon'],
    field: `
vec2 muzzle = p + vec2(-0.08, 0.02);
float r = length(muzzle);
float pulse = 0.82 + 0.18 * sin(t * 11.0);
float core = smoothstep(0.12, 0.0, r) * 0.52 + 0.006 / max(r * r, 0.04);
float smoke = fbm(muzzle * vec2(2.2, 1.6) + vec2(-t * 0.1, t * 0.045)) * smoothstep(1.24, 0.12, r);

float shards = 0.0;
for (int i = 0; i < 14; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 13.4));
  float angle = seed.x * 6.28318 + sin(t * (0.8 + seed.y * 0.7) + fi * 1.9) * 0.05;
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 side = vec2(-dir.y, dir.x);
  float dist = 0.18 + seed.y * (0.86 + uDetail * 0.07);
  vec2 pos = dir * (dist + sin(t * (1.2 + seed.x * 1.6) + fi) * 0.03);
  vec2 s = muzzle - pos;
  float along = dot(s, dir);
  float across = dot(s, side);
  float head = smoothstep(0.05 + seed.x * 0.022, 0.0, length(s));
  float tail = smoothstep(0.032 + seed.x * 0.025, 0.0, abs(across)) * smoothstep(0.36 + seed.y * 0.26, 0.0, abs(along + 0.08));
  float twinkle = 0.7 + 0.3 * sin(t * (3.0 + seed.x * 5.0) + fi * 2.4);
  shards += (head * 1.05 + tail * 0.2) * (0.55 + seed.x * 0.85) * twinkle;
}

float grit = 0.0;
vec2 grid = muzzle * (18.0 + uDetail * 6.0) + vec2(t * 0.2, -t * 0.14);
vec2 cell = floor(grid);
vec2 local = fract(grid) - 0.5;
float grainMask = step(0.91, hash21(cell)) * smoothstep(1.35, 0.14, r);
grit += smoothstep(0.13, 0.0, length(local)) * grainMask;

float crackedHalo = smoothstep(0.96, 0.1, r) * smoothstep(0.12, 0.66, r);
crackedHalo *= 0.36 + 0.64 * step(0.46, hash11(floor(atan(muzzle.y, muzzle.x) * 5.5 + 18.0)));
v += (core + shards * 0.9 + grit * 0.52 + smoke * 0.18 + crackedHalo * 0.22) * pulse;
`,
    warp: `
p += 0.025 * vec2(
  fbm(p * 3.0 + vec2(t * 0.12, 2.0)) - 0.5,
  fbm(p * 3.4 + vec2(7.0, -t * 0.1)) - 0.5
);
`,
    color: `uPrimary * shade * 0.72 + vec3(1.0, 0.48, 0.16) * pow(shade, 1.35) * 0.34 + vec3(1.0, 0.9, 0.58) * pow(shade, 2.55) * 0.16`,
    post: `
color += vec3(0.16, 0.11, 0.04) * smoothstep(1.45, 0.0, length(uv));
color *= 1.0 - smoothstep(0.7, 1.65, length(uv)) * 0.2;
`,
    intensity: 0.84,
    motion: 1.16,
    detail: 2.45,
  }),
  makeEffect({
    id: 'mana-trail',
    title: 'Mana Trail',
    titleJa: 'マナトレイル',
    categoryId: 'game-vfx',
    description: 'Curved trail strips for projectiles and dashes.',
    descriptionJa: '弾やダッシュに使う曲線トレイル。',
    accentColor: '#38bdf8',
    tags: ['trail', 'mana', 'projectile'],
    field: `
float trail = 0.0;
float glow = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  float z = 0.35 + fi * 0.18;
  vec2 q = p * (1.0 + z * 0.22) + vec2(-0.16 * z, 0.08 * sin(t * 0.35 + fi));
  float wave = sin(q.x * (3.8 + fi * 0.34) - t * (2.0 + fi * 0.18) + fi * 1.7);
  float curve = q.y + wave * (0.12 + z * 0.06) + sin(q.x * 9.0 + t + fi) * 0.025;
  float taper = smoothstep(1.42, -0.08, abs(q.x)) * (1.0 - fi * 0.085);
  float width = 0.015 + fi * 0.006;
  float core = stroke(curve, width) * taper;
  trail += core * (1.08 - fi * 0.08);
  glow += stroke(curve, width * 4.2) * taper * (0.22 - fi * 0.018);
}

float head = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 h = vec2(0.58 - fi * 0.18 + 0.05 * sin(t * 0.7 + fi), sin(t * 1.1 + fi) * 0.18);
  head += smoothstep(0.18 + fi * 0.05, 0.0, length((p - h) / vec2(1.0 + fi * 0.18, 0.7))) * (0.75 - fi * 0.12);
}

float motes = 0.0;
for (int i = 0; i < 18; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 41.0));
  float drift = fract(seed.x + t * (0.08 + seed.y * 0.12));
  vec2 pos = vec2(-1.1 + drift * 2.2, (seed.y - 0.5) * 0.9 + sin(t + fi) * 0.08);
  motes += smoothstep(0.03 + seed.x * 0.02, 0.0, length(p - pos)) * smoothstep(1.45, 0.15, length(pos));
}

float mist = fbm(p * vec2(1.6, 1.1) + vec2(-t * 0.08, t * 0.035)) * smoothstep(1.55, 0.05, length(p));
v += trail * 1.12 + glow + head * 0.86 + motes * 0.55 + mist * 0.18;
`,
    warp: `
p.x += 0.12 * sin(p.y * 3.0 + t);
p.y += 0.035 * fbm(p * 2.4 + vec2(t * 0.12, -t * 0.05));
`,
    color: `vec3(0.02, 0.08, 0.16) * shade * 0.55 + uPrimary * shade * 0.9 + vec3(0.6, 1.0, 0.95) * pow(shade, 1.7) * 0.42`,
    post: `
float trailFog = fbm(uv * vec2(1.1, 0.75) + vec2(-iTime * 0.025, iTime * 0.015));
color += vec3(0.02, 0.18, 0.28) * trailFog * smoothstep(1.5, 0.1, length(uv)) * 0.28;
color += vec3(0.22, 0.7, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.2;
`,
    intensity: 1.18,
    motion: 1.12,
    detail: 2.45,
  }),
  makeEffect({
    id: 'shield-ripple',
    title: 'Shield Ripple',
    titleJa: 'シールドリップル',
    categoryId: 'game-vfx',
    description: 'Hex shield ripples for guard and barrier feedback.',
    descriptionJa: '防御やバリアの反応に使う六角形リップル。',
    accentColor: '#67e8f9',
    tags: ['shield', 'hex', 'barrier'],
    field: `
float h = sdHex(p, 0.58 + 0.04 * sin(t * 2.0));
float cells = stroke(sdHex(fract(p * (3.0 + uDetail)) - 0.5, 0.36), 0.025);
float ripple = stroke(h, 0.035) + stroke(length(p) - fract(t * 0.32) * 1.1, 0.025);
v += ripple + cells * smoothstep(0.75, 0.1, length(p)) * 0.45;
`,
    warp: `p = rot(0.1 * sin(t)) * p;`,
  }),
  makeEffect({
    id: 'pixel-impact',
    title: 'Pixel Impact',
    titleJa: 'ピクセルインパクト',
    categoryId: 'game-vfx',
    description: 'Teal occult interface aura with smoke, sparks, and electric wisps.',
    descriptionJa: '青緑の霊気、煙、発光粒子、電気線が渦巻くUI背面エフェクト。',
    accentColor: '#38f5e5',
    tags: ['teal', 'aura', 'occult', 'interface'],
    field: `
float vignette = smoothstep(1.75, 0.18, length(p));
vec2 drift = vec2(0.16 * sin(t * 0.32), -0.11 * cos(t * 0.27));
float vaporA = fbm(p * 2.0 + drift + vec2(t * 0.04, -t * 0.06));
float vaporB = fbm(rot(0.7) * p * 3.4 - drift * 1.8 + vec2(-t * 0.08, t * 0.05));
float vein = stroke(sin((p.x + vaporA * 0.62) * 4.8 + t * 0.75) * 0.18 + p.y + vaporB * 0.2, 0.035);
float mist = smoothstep(0.24, 1.0, vaporA * 0.72 + vaporB * 0.58) * vignette;
v += mist * 0.52 + vein * 0.42 * vignette;

for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 c = vec2(
    sin(t * (0.19 + fi * 0.035) + fi * 2.1),
    cos(t * (0.16 + fi * 0.041) + fi * 1.4)
  ) * vec2(0.78, 0.46);
  float r = 0.23 + 0.14 * fi + 0.025 * sin(t + fi);
  float ring = stroke(length(p - c) - r, 0.012 + 0.006 * fi);
  float halo = smoothstep(0.38, 0.0, abs(length(p - c) - r));
  v += (ring * 0.75 + halo * 0.08) * vignette;
}

vec2 grid = p * (34.0 + uDetail * 7.0);
vec2 id = floor(grid);
vec2 local = fract(grid) - 0.5;
float star = step(0.988, hash21(id + floor(t * 1.8)));
float speck = smoothstep(0.14, 0.0, length(local)) * star;
v += speck * (0.75 + 0.25 * sin(t * 5.0 + hash21(id) * 6.28)) * vignette;

float sigil = 0.0;
vec2 sig = fract(rot(0.18) * p * 4.6 + 0.5) - 0.5;
sigil += stroke(length(sig) - 0.31, 0.01);
sigil += stroke(abs(sig.x) - 0.22, 0.008) * stroke(abs(sig.y) - 0.22, 0.22);
v += sigil * 0.07 * smoothstep(1.45, 0.0, length(p));
`,
    warp: `
p += 0.07 * vec2(
  sin(p.y * 3.0 + t * 0.48 + fbm(p * 2.0)),
  cos(p.x * 2.4 - t * 0.38 + fbm(p * 2.6))
);
p = rot(0.025 * sin(t * 0.28)) * p;
`,
    color: `uPrimary * shade * mask * 0.95 + vec3(0.02, 0.34, 0.44) * smoothstep(0.08, 1.2, shade) + vec3(0.52, 1.0, 0.92) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.75`,
    post: `
float depthGlow = smoothstep(1.7, 0.0, length(uv));
float coldFog = fbm(uv * 2.2 + vec2(iTime * 0.035, -iTime * 0.02));
color += vec3(0.0, 0.17, 0.2) * depthGlow;
color += vec3(0.08, 0.78, 0.7) * pow(coldFog, 3.0) * 0.24 * depthGlow;
color += vec3(0.5, 0.95, 0.92) * smoothstep(0.995, 1.0, hash21(floor(uv * 110.0) + floor(iTime * 2.0))) * depthGlow;
color *= 1.0 - 0.32 * smoothstep(0.45, 1.65, length(uv));
`,
    intensity: 1.35,
    motion: 0.82,
    detail: 2.65,
  }),
  makeEffect({
    id: 'ribbon-slash',
    title: 'Ribbon Slash',
    titleJa: 'リボンスラッシュ',
    categoryId: 'game-vfx',
    description: 'A dense boss-attack slash with hot blade core, shock bloom, sparks, and trailing afterimages.',
    descriptionJa: '強い光刃、衝撃の発光、火花、残像を重ねたボス攻撃風の斬撃。',
    accentColor: '#f472ff',
    tags: ['slash', 'blade', 'boss', 'impact', 'sparks'],
    field: `
vec2 q = rot(-0.68 + 0.04 * sin(t * 0.6)) * (p * 0.86 + vec2(0.04, -0.02));
q.x += 0.06 * sin(q.y * 3.0 + t);
float taper = smoothstep(1.28, 0.1, abs(q.x));
float curve = 0.1 * sin(q.x * 4.9 - t * 1.7) + 0.035 * sin(q.x * 13.0 + t * 2.6);
float cut = q.y + curve;
float bladeCore = stroke(cut, 0.012) * taper;
float bladeGlow = stroke(cut, 0.07) * taper * 0.42;
float bladeAura = stroke(cut, 0.18) * taper * 0.16;

float serration = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  float x = -0.92 + fi * 0.31 + 0.04 * sin(t * 0.9 + fi);
  float notch = smoothstep(0.12, 0.0, abs(q.x - x));
  serration += stroke(cut - 0.025 * sin(fi * 2.4 + t * 7.0), 0.018) * notch;
}

float echoes = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float lag = 0.13 + fi * 0.07;
  float offset = lag * (0.65 + 0.25 * sin(t * 0.8 + fi));
  float echoCurve = 0.08 * sin(q.x * (3.6 + fi * 0.35) - t * (1.2 + fi * 0.18));
  float echoMask = smoothstep(1.2, 0.2, abs(q.x + fi * 0.04));
  echoes += stroke(q.y + curve + offset + echoCurve, 0.035 + fi * 0.008) * echoMask * (0.42 - fi * 0.055);
}

vec2 hit = q - vec2(0.13 + 0.05 * sin(t * 0.7), 0.0);
float hitR = length(hit / vec2(1.0, 0.62));
float shock = stroke(hitR - 0.32 - 0.03 * sin(t * 2.2), 0.055) * 0.9;
shock += stroke(hitR - 0.62 - 0.04 * sin(t * 1.4), 0.035) * 0.42;
float core = 0.022 / max(dot(hit, hit), 0.025);

float sparks = 0.0;
for (int i = 0; i < 30; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 21.0));
  float side = mix(-1.0, 1.0, step(0.5, seed.x));
  float travel = fract(seed.y + t * (0.18 + seed.x * 0.24));
  vec2 pos = vec2(
    -0.82 + travel * 1.85,
    -curve + side * (0.12 + travel * 0.42) + sin(t * 2.0 + fi) * 0.035
  );
  vec2 s = q - pos;
  float tail = smoothstep(0.18, 0.0, abs(s.y + side * s.x * 0.2)) * smoothstep(0.28, 0.0, abs(s.x));
  sparks += smoothstep(0.026, 0.0, length(s)) * (0.55 + seed.x) + tail * 0.06;
}

float smoke = fbm(q * vec2(2.0, 5.0) + vec2(-t * 0.1, t * 0.04)) * stroke(cut + 0.16, 0.45) * taper;
v += bladeCore * 1.18 + bladeGlow * 0.82 + bladeAura + serration * 0.58 + echoes * 0.9 + shock * 0.72 + core * 0.18 + sparks * 0.68 + smoke * 0.18;
`,
    warp: `
p += vec2(0.04 * sin(t + p.y * 2.0), 0.018 * sin(p.x * 5.0 - t));
p *= 1.0 + 0.035 * sin(t * 1.4 + length(p) * 5.0);
`,
    color: `vec3(0.08, 0.0, 0.12) * shade * 0.42 + uPrimary * shade * 0.86 + vec3(0.48, 0.92, 1.0) * pow(shade, 1.55) * 0.38 + vec3(1.0, 0.72, 0.94) * pow(shade, 2.7) * 0.22`,
    post: `
float slashMist = fbm(uv * vec2(1.2, 3.4) + vec2(-iTime * 0.03, iTime * 0.025));
float rimDark = smoothstep(0.35, 1.45, length(uv));
color += vec3(0.14, 0.02, 0.18) * slashMist * 0.16;
color += vec3(0.16, 0.32, 0.55) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.18;
color *= 1.0 - rimDark * 0.28;
`,
    intensity: 1.36,
    motion: 1.05,
    detail: 2.7,
  }),
  makeEffect({
    id: 'charging-core',
    title: 'Charging Core',
    titleJa: 'チャージコア',
    categoryId: 'game-vfx',
    description: 'A gathering core with orbiting motes.',
    descriptionJa: '小さな光が中心に集まるチャージ表現。',
    accentColor: '#818cf8',
    tags: ['charge', 'core', 'orbit'],
    field: `
float r = length(p);
v += 0.05 / max(r * r, 0.015);
for (int i = 0; i < 10; i++) {
  float fi = float(i);
  vec2 o = vec2(cos(t * (0.8 + fi * 0.05) + fi), sin(t * (1.1 + fi * 0.04) + fi)) * (0.22 + fi * 0.035);
  v += smoothstep(0.045, 0.0, length(p - o));
}
`,
    warp: `p *= 1.0 + 0.05 * fbm(p * 3.0 + t);`,
  }),
  makeEffect({
    id: 'loot-sparkle',
    title: 'Loot Sparkle',
    titleJa: 'ルートスパークル',
    categoryId: 'game-vfx',
    description: 'Reward sparkle glints with soft collectible energy.',
    descriptionJa: '報酬やアイテムに合う柔らかなきらめき。',
    accentColor: '#f0abfc',
    tags: ['loot', 'sparkle', 'reward'],
    field: `
float stars = 0.0;
for (int i = 0; i < 16; i++) {
  float fi = float(i);
  vec2 h = hash22(vec2(fi, 3.7)) * 2.0 - 1.0;
  vec2 q = p - h * 0.85;
  float r = length(q);
  float bead = smoothstep(0.045, 0.0, r);
  float softRing = stroke(r - 0.09, 0.012) * 0.35;
  stars += (bead + softRing) * smoothstep(0.22, 0.0, r) * (0.55 + 0.45 * sin(t * 3.0 + fi));
}
v += stars;
`,
    warp: `p = rot(0.12 * sin(t * 0.7)) * p;`,
  }),
  makeEffect({
    id: 'shockwave-grid',
    title: 'Shockwave Grid',
    titleJa: 'ショックウェーブグリッド',
    categoryId: 'game-vfx',
    description: 'Grid lines bending under a circular shockwave.',
    descriptionJa: '円形衝撃波で曲がるグリッドライン。',
    accentColor: '#22d3ee',
    tags: ['shockwave', 'grid', 'impact'],
    field: `
float r = length(p);
vec2 q = p + normalize(p + 0.001) * sin(r * 16.0 - t * 6.0) * 0.05;
vec2 grid = abs(fract(q * (5.0 + uDetail)) - 0.5);
float lines = smoothstep(0.035, 0.0, min(grid.x, grid.y));
float wave = stroke(r - fract(t * 0.25) * 1.3, 0.035);
v += lines * wave + wave * 0.8;
`,
  }),
  makeEffect({
    id: 'teleport-flare',
    title: 'Teleport Flare',
    titleJa: 'テレポートフレア',
    categoryId: 'game-vfx',
    description: 'Vertical scan flare and rings for arrival effects.',
    descriptionJa: '転送到着を示す縦スキャンとリング。',
    accentColor: '#c084fc',
    tags: ['teleport', 'flare', 'scan'],
    field: `
float r = length(p);
float column = smoothstep(0.18, 0.0, abs(p.x + 0.04 * sin(p.y * 8.0 + t)));
float rings = stroke(fract(r * 4.0 - t * 0.8) - 0.5, 0.06);
float scan = smoothstep(0.05, 0.0, abs(p.y - sin(t * 1.3) * 0.75));
v += column * 0.7 + rings * smoothstep(1.1, 0.1, r) + scan * 0.55;
`,
  }),
  makeEffect({
    id: 'combo-streak',
    title: 'Combo Streak',
    titleJa: 'コンボストリーク',
    categoryId: 'game-vfx',
    description: 'Multiple offset streaks for chained attacks.',
    descriptionJa: '連続攻撃のテンポを出す複数ストリーク。',
    accentColor: '#fb923c',
    tags: ['combo', 'streak', 'action'],
    field: `
float total = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 q = rot(-0.55 + fi * 0.11) * (p + vec2(fi * 0.08 - 0.18, 0.0));
  total += stroke(q.y + sin(q.x * 5.0 + t * 4.0 + fi) * 0.04, 0.018) * smoothstep(0.8, 0.0, abs(q.x));
}
v += total;
`,
    warp: `p.x += 0.1 * sin(t * 2.0);`,
  }),
  makeEffect({
    id: 'rune-burst',
    title: 'Rune Burst',
    titleJa: 'ルーンバースト',
    categoryId: 'game-vfx',
    description: 'Arcane ring marks exploding outward.',
    descriptionJa: 'ルーン状の印が外側へ弾ける演出。',
    accentColor: '#f472b6',
    tags: ['rune', 'burst', 'magic'],
    field: `
float r = length(p);
float a = atan(p.y, p.x);
float glyph = stroke(sin(a * 12.0 + floor(r * 5.0) + t * 2.0), 0.12);
float ringA = stroke(r - 0.38, 0.025);
float ringB = stroke(r - 0.62 - 0.04 * sin(t), 0.02);
v += glyph * (ringA + ringB) + smoothstep(0.16, 0.0, r) * 0.35;
`,
  }),
]
