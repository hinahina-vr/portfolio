import { makeEffect } from './glsl'

export const fireSmokeEffects = [
  makeEffect({
    id: 'smoke-column',
    title: 'Smoke Column',
    titleJa: '煙柱',
    categoryId: 'fire-smoke',
    description: 'A furnace throat throwing bright flame tongues, ember spray, and backlit smoke depth.',
    descriptionJa: '炉口から明るい炎の舌と火の粉が噴き、逆光の煙が奥に重なる。',
    accentColor: '#f97316',
    tags: ['smoke', 'column', 'ember', 'fire'],
    field: `
float smoke = 0.0;
float rim = 0.0;
float flame = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float y = p.y + 0.78 - fi * 0.08;
  float lane = (fi - 2.0) * 0.11;
  float x = p.x - lane;
  x += sin(y * (2.9 + fi * 0.3) - t * (0.85 + fi * 0.08) + fi) * (0.12 + fi * 0.01);
  x += (fbm(vec2(y * 2.2 + fi, t * 0.12)) - 0.5) * 0.12;
  float rise = smoothstep(-0.96, -0.56, y) * (1.0 - smoothstep(0.72, 1.28, y));
  float taper = smoothstep(0.9, -0.7, y);
  float hotWidth = 0.025 + taper * 0.075;
  float smokeWidth = 0.07 + smoothstep(-0.45, 0.95, y) * 0.14 + fi * 0.012;
  float turbulence = 0.45 + 0.7 * fbm(vec2(x * (3.2 + uDetail), y * 2.6 - t * 0.34 + fi));
  flame += lineGlow(x, hotWidth) * rise * taper * (0.82 + fi * 0.05);
  smoke += lineGlow(x, smokeWidth) * rise * turbulence * (0.46 + fi * 0.045);
  rim += lineGlow(abs(x) - smokeWidth * 0.62, 0.035) * rise * turbulence * 0.6;
}

float furnaceMouth = glow(length((p - vec2(0.0, -0.76)) / vec2(0.72, 0.2)), 0.34);
float innerWhite = glow(length((p - vec2(0.0, -0.7)) / vec2(0.34, 0.12)), 0.28);
float blast = glow(length((p - vec2(0.0, -0.36)) / vec2(0.34, 0.7)), 0.42);
float amberHalo = glow(length((p - vec2(0.0, -0.42)) / vec2(1.0, 0.9)), 0.68);
float heatBands = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float band = p.y + 0.64 - fi * 0.16 + sin(p.x * (4.2 + fi) + t * (1.0 + fi * 0.2)) * 0.035;
  heatBands += lineGlow(band, 0.026) * smoothstep(1.22, 0.12, abs(p.x)) * (0.7 - fi * 0.08);
}

float embers = 0.0;
for (int i = 0; i < 24; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 31.4));
  float life = fract(seed.y + t * (0.16 + seed.x * 0.22));
  vec2 pos = vec2((seed.x - 0.5) * (0.34 + life * 1.45), -0.76 + life * 1.9);
  pos.x += 0.22 * sin(pos.y * 3.1 + t * 0.7 + fi);
  vec2 e = p - pos;
  float trail = lineGlow(sdSegment(e, vec2(0.0, -0.028), vec2(-0.045, 0.105)), 0.009 + seed.x * 0.007);
  embers += trail * (1.0 - life) * smoothstep(0.02, 0.22, life);
}

float pressure = lineGlow(length((p - vec2(0.0, -0.62)) / vec2(0.9, 0.42)) - (0.42 + 0.05 * sin(t * 1.8)), 0.034);
v += flame * 1.62 + smoke * 0.16 + rim * 0.28 + furnaceMouth * 0.86 + innerWhite * 1.12 + blast * 0.28 + amberHalo * 0.06 + heatBands * 0.52 + pressure * 0.22 + embers * 1.26;
`,
    warp: `
p.x += (fbm(p * 1.6 + vec2(t * 0.05, 0.0)) - 0.5) * 0.085;
p.y += (fbm(p.yx * 1.4 - vec2(0.0, t * 0.045)) - 0.5) * 0.03;
`,
    color: `vec3(0.026, 0.009, 0.004) + vec3(0.22, 0.026, 0.006) * mask * 0.42 + uPrimary * shade * 0.58 + vec3(1.0, 0.17, 0.018) * pow(clamp(shade, 0.0, 1.0), 1.16) * 0.8 + vec3(1.0, 0.44, 0.055) * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.42 + vec3(1.0, 0.9, 0.58) * pow(clamp(shade, 0.0, 1.0), 3.4) * 0.32`,
    post: `
float smokeGlow = 1.0 - smoothstep(0.15, 1.72, length(uv * vec2(0.62, 1.0)));
float emberFloor = smoothstep(-1.12, -0.42, uv.y) * (1.0 - smoothstep(0.0, 1.45, abs(uv.x)));
float liftGlow = smoothstep(-0.9, 0.95, uv.y) * (1.0 - smoothstep(0.0, 1.1, abs(uv.x)));
color += vec3(0.42, 0.055, 0.012) * smokeGlow * 0.18;
color += vec3(1.0, 0.22, 0.02) * emberFloor * 0.44;
color += vec3(1.0, 0.32, 0.04) * liftGlow * pow(clamp(shade, 0.0, 1.0), 1.55) * 0.18;
`,
    intensity: 1.24,
    motion: 1.12,
    detail: 2.7,
  }),
  makeEffect({
    id: 'ash-vortex',
    title: 'Ash Vortex',
    titleJa: '灰の渦',
    categoryId: 'fire-smoke',
    description: 'A molten ash cyclone with depth sparks, furnace glow, and turbulent spiral bands.',
    descriptionJa: '溶けた灰のサイクロン、奥行きの火花、炉の光、乱流の渦帯。',
    accentColor: '#ff7a1a',
    tags: ['ash', 'vortex', 'ember', 'cyclone'],
    field: `
float r = length(p * vec2(0.9, 1.08));
float a = atan(p.y, p.x);
float arms = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float lane = sin(a * (2.0 + fi * 0.35) + r * (8.2 + fi * 0.65) - t * (1.15 + fi * 0.15) + fbm(p * 2.0 + fi) * 2.2);
  arms += lineGlow(lane, 0.09) * (1.0 - smoothstep(0.1, 1.45, r)) * smoothstep(0.08, 0.42, r) * (0.28 + fi * 0.04);
}

float core = glow(r, 0.38) * (0.55 + 0.45 * fbm(p * 4.8 + t * 0.18));
float halo = lineGlow(r - (0.62 + 0.04 * sin(t * 0.9)), 0.055);
float ash = 0.0;
for (int i = 0; i < 42; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 9.8));
  float rr = 0.2 + seed.x * 1.18;
  float aa = seed.y * 6.28318 + t * (0.4 + seed.x * 0.8) + rr * 1.6;
  vec2 pos = vec2(cos(aa), sin(aa)) * rr * vec2(1.0, 0.82);
  vec2 spark = p - pos;
  ash += lineGlow(sdSegment(spark, vec2(0.0), vec2(-sin(aa), cos(aa)) * (0.035 + seed.y * 0.07)), 0.007 + seed.x * 0.005) * (1.0 - smoothstep(0.2, 1.5, rr));
}
v += arms * 0.85 + core * 0.72 + halo * 0.44 + ash * 0.55;
`,
    warp: `
float vr = length(p);
p = rot(0.08 * sin(t * 0.5) + 0.05 / max(vr + 0.28, 0.28)) * p;
p += 0.025 * vec2(fbm(p * 2.0 + t * 0.08), fbm(p.yx * 2.1 - t * 0.07));
`,
    color: `vec3(0.022, 0.012, 0.008) + vec3(0.24, 0.055, 0.018) * mask + uPrimary * shade * 0.72 + vec3(1.0, 0.24, 0.035) * pow(clamp(shade, 0.0, 1.0), 1.45) * 0.4 + vec3(1.0, 0.78, 0.35) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.22`,
    post: `
float air = fbm(uv * vec2(1.7, 1.0) + vec2(iTime * 0.02, -iTime * 0.014));
color += vec3(0.25, 0.06, 0.018) * air * (1.0 - smoothstep(0.0, 1.55, length(uv))) * 0.24;
`,
    intensity: 1.16,
    motion: 1.08,
    detail: 2.6,
  }),
  makeEffect({
    id: 'lava-cracks',
    title: 'Lava Cracks',
    titleJa: '溶岩の亀裂',
    categoryId: 'fire-smoke',
    description: 'Molten plates splitting open with flowing orange seams and hot glass pockets.',
    descriptionJa: '溶けた地殻板が割れ、橙の亀裂と熱いガラス溜まりが流れる。',
    accentColor: '#ff4d12',
    tags: ['lava', 'crack', 'rock', 'molten'],
    field: `
vec2 q = p * (3.0 + uDetail * 0.45);
q += vec2(fbm(q * 0.75 + t * 0.04), fbm(q.yx * 0.8 - t * 0.035)) * 0.38;
vec2 cell = fract(q) - 0.5;
float plate = sdHex(cell, 0.37 + 0.03 * fbm(floor(q)));
float seams = lineGlow(plate, 0.024) * (0.65 + 0.65 * fbm(q * 1.7 + vec2(t * 0.25, -t * 0.12)));
float rivers = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = p * (1.25 + fi * 0.22) + vec2(fi * 1.3, -t * (0.05 + fi * 0.012));
  float vein = sin(s.x * (3.0 + fi * 0.3) + s.y * (2.0 + fi * 0.15) + fbm(s * 2.0) * 2.4);
  rivers += lineGlow(vein, 0.04) * (1.0 - smoothstep(0.2, 1.45, length(p))) * 0.12;
}
float pockets = 0.0;
for (int i = 0; i < 10; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 72.0));
  vec2 pos = seed * 2.2 - 1.1;
  pos.x *= 1.5;
  pockets += glow(length((p - pos) / vec2(1.0, 0.55)), 0.12 + seed.x * 0.06) * step(0.55, seed.y);
}
v += seams * 0.95 + rivers + pockets * 0.38;
`,
    warp: `
p += 0.025 * vec2(fbm(p * 2.2 + t * 0.05), fbm(p.yx * 2.0 - t * 0.05));
`,
    color: `vec3(0.035, 0.012, 0.006) + vec3(0.2, 0.035, 0.01) * mask + uPrimary * shade * 0.7 + vec3(1.0, 0.32, 0.02) * pow(clamp(shade, 0.0, 1.0), 1.35) * 0.46 + vec3(1.0, 0.9, 0.42) * pow(clamp(shade, 0.0, 1.0), 3.2) * 0.2`,
    post: `
color += vec3(0.12, 0.03, 0.01) * fbm(uv * 2.0 + iTime * 0.012) * 0.12;
`,
    intensity: 1.18,
    motion: 0.86,
    detail: 2.8,
  }),
  makeEffect({
    id: 'candle-heat',
    title: 'Candle Heat',
    titleJa: 'ろうそくの熱',
    categoryId: 'fire-smoke',
    description: 'A larger living flame with blue core, gold mantle, smoke curls, and tiny embers.',
    descriptionJa: '青い芯、金色の外炎、煙のカール、小さな火の粉を持つ生きた炎。',
    accentColor: '#fbbf24',
    tags: ['candle', 'heat', 'flame', 'ember'],
    field: `
vec2 q = p;
q.y += 0.55;
q.x += 0.05 * sin(q.y * 8.0 + t * 2.6) + 0.03 * fbm(vec2(q.y * 4.0, t * 0.8));
float outer = glow(length(q / vec2(0.46, 0.88)) + q.y * 0.18, 0.48);
float mantle = glow(length((q - vec2(0.0, -0.05)) / vec2(0.28, 0.62)) + q.y * 0.12, 0.35);
float blueCore = glow(length((q - vec2(0.02, -0.28)) / vec2(0.16, 0.34)) + q.y * 0.06, 0.24);
float halo = glow(length((q - vec2(0.0, -0.14)) / vec2(0.82, 1.0)), 0.72) * 0.32;
float curls = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 s = p - vec2((fi - 1.5) * 0.08, -0.04 + fi * 0.09);
  s.x += sin(s.y * (5.0 + fi) + t * (0.7 + fi * 0.08)) * 0.09;
  curls += lineGlow(s.x, 0.013 + fi * 0.003) * smoothstep(0.05, 0.7, s.y) * (1.0 - smoothstep(0.7, 1.2, length(s)));
}
v += outer * 0.58 + mantle * 0.86 + blueCore * 0.6 + halo + curls * 0.16;
`,
    warp: `
p.x += 0.045 * fbm(vec2(p.y * 4.2, t * 0.75));
p.y += 0.016 * sin(p.x * 5.0 - t * 0.8);
`,
    color: `vec3(0.018, 0.012, 0.006) + uPrimary * shade * 0.65 + vec3(1.0, 0.42, 0.03) * pow(clamp(shade, 0.0, 1.0), 1.32) * 0.45 + vec3(0.48, 0.72, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.16 + vec3(1.0, 0.92, 0.52) * pow(clamp(shade, 0.0, 1.0), 3.4) * 0.22`,
    post: `
float tableGlow = smoothstep(-1.1, -0.58, uv.y) * (1.0 - smoothstep(0.0, 1.1, abs(uv.x)));
color += vec3(0.22, 0.08, 0.015) * tableGlow * 0.22;
`,
    intensity: 1.16,
    motion: 1.05,
    detail: 2.3,
  }),
  makeEffect({
    id: 'volcanic-glow',
    title: 'Volcanic Glow',
    titleJa: '火山光',
    categoryId: 'fire-smoke',
    description: 'An erupting volcanic horizon with lava fountains, smoke banks, and red sky glow.',
    descriptionJa: '噴き上がる火山地平、溶岩の噴泉、煙の層、赤く染まる空。',
    accentColor: '#ef2a18',
    tags: ['volcano', 'horizon', 'glow', 'eruption'],
    field: `
float ridge = p.y + 0.36 + fbm(vec2(p.x * 2.1, t * 0.12)) * 0.18;
float lavaLine = lineGlow(ridge, 0.08) * (1.0 - smoothstep(-0.25, 1.0, p.y));
float horizonGlow = glow(ridge, 0.28) * (1.0 - smoothstep(-0.1, 1.1, p.y));
float smoke = fbm(p * vec2(1.5, 2.8) + vec2(-t * 0.04, t * 0.16)) * smoothstep(-0.1, 0.75, p.y);
float fountains = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 51.3));
  vec2 base = vec2(-0.68 + fi * 0.22 + (seed.x - 0.5) * 0.06, -0.34);
  vec2 s = p - base;
  s.x += sin(s.y * (3.0 + seed.x * 2.0) - t * (0.9 + seed.y)) * 0.07;
  fountains += lineGlow(s.x, 0.024 + seed.x * 0.014) * smoothstep(0.0, 0.14, s.y) * (1.0 - smoothstep(0.28, 0.9 + seed.y * 0.42, s.y)) * (0.45 + seed.y);
}
float bombs = 0.0;
for (int i = 0; i < 22; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 18.0));
  float life = fract(seed.y + t * (0.08 + seed.x * 0.12));
  vec2 pos = vec2((seed.x - 0.5) * 1.8, -0.24 + life * (0.75 + seed.y * 0.65));
  pos.x += (life - 0.5) * (seed.x - 0.5) * 0.62;
  bombs += glow(length(p - pos), 0.03 + seed.x * 0.02) * (1.0 - life);
}
v += lavaLine * 0.72 + horizonGlow * 0.48 + smoke * 0.18 + fountains * 0.64 + bombs * 0.68;
`,
    warp: `
p.y += 0.03 * fbm(p * 2.0 + vec2(0.0, t * 0.06));
p.x += 0.026 * sin(p.y * 2.4 + t * 0.4);
`,
    color: `vec3(0.028, 0.012, 0.009) + vec3(0.22, 0.035, 0.018) * mask + uPrimary * shade * 0.7 + vec3(1.0, 0.3, 0.02) * pow(clamp(shade, 0.0, 1.0), 1.42) * 0.42 + vec3(1.0, 0.74, 0.25) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.18`,
    post: `
float skyBurn = (1.0 - smoothstep(-0.1, 1.2, uv.y)) * (1.0 - smoothstep(0.0, 1.7, length(uv * vec2(0.65, 1.0))));
color += vec3(0.28, 0.045, 0.025) * skyBurn * 0.26;
`,
    intensity: 1.18,
    motion: 0.9,
    detail: 2.7,
  }),
  makeEffect({
    id: 'soot-wisps',
    title: 'Soot Wisps',
    titleJa: '煤の筋',
    categoryId: 'fire-smoke',
    description: 'Backlit black-gold soot ribbons with drifting embers and smoky depth.',
    descriptionJa: '黒金の逆光を受けた煤リボン、漂う火の粉、煙の奥行き。',
    accentColor: '#f59e0b',
    tags: ['soot', 'wisp', 'ribbon', 'ember'],
    field: `
float wisps = 0.0;
float glowField = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 q = p - vec2((fi - 4.0) * 0.13, -0.15 + sin(fi) * 0.07);
  q.x += sin(q.y * (3.4 + fi * 0.34) + t * (0.72 + fi * 0.06) + fi) * (0.08 + fi * 0.006);
  q.x += (fbm(vec2(q.y * 2.0 + fi, t * 0.07)) - 0.5) * 0.08;
  float height = smoothstep(-0.82, -0.08, q.y) * (1.0 - smoothstep(0.86, 1.22, q.y));
  wisps += lineGlow(q.x, 0.015 + fi * 0.0025) * height * (0.55 + fi * 0.06);
  glowField += lineGlow(q.x, 0.07 + fi * 0.006) * height * 0.12;
}
float sootCloud = fbm(p * vec2(1.5, 2.3) + vec2(t * 0.02, -t * 0.08)) * (1.0 - smoothstep(0.1, 1.55, length(p)));
float embers = 0.0;
for (int i = 0; i < 18; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 67.2));
  float rise = fract(seed.y + t * (0.06 + seed.x * 0.14));
  vec2 pos = vec2((seed.x - 0.5) * 1.8 + sin(t + fi) * 0.06, -0.85 + rise * 1.9);
  embers += glow(length(p - pos), 0.02 + seed.x * 0.012) * (1.0 - rise);
}
v += wisps * 0.75 + glowField + sootCloud * 0.18 + embers * 0.44;
`,
    warp: `
p.x += (fbm(p * 1.8 + vec2(t * 0.035, 0.0)) - 0.5) * 0.07;
p.y += (fbm(p.yx * 1.7 - vec2(0.0, t * 0.05)) - 0.5) * 0.03;
`,
    color: `vec3(0.02, 0.014, 0.01) + vec3(0.2, 0.07, 0.018) * mask + uPrimary * shade * 0.58 + vec3(1.0, 0.33, 0.04) * pow(clamp(shade, 0.0, 1.0), 1.55) * 0.28 + vec3(1.0, 0.78, 0.35) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.14`,
    post: `
float backlight = 1.0 - smoothstep(0.0, 1.6, length(uv * vec2(0.7, 1.0)));
color += vec3(0.18, 0.07, 0.018) * backlight * 0.2;
`,
    intensity: 1.16,
    motion: 0.94,
    detail: 2.6,
  }),
  makeEffect({
    id: 'furnace-breath',
    title: 'Furnace Breath',
    titleJa: '炉の息',
    categoryId: 'fire-smoke',
    description: 'A glowing furnace mouth with pressure pulses, molten grates, and heat jets.',
    descriptionJa: '発光する炉口、圧力パルス、溶けた格子、熱の噴き返し。',
    accentColor: '#fb7185',
    tags: ['furnace', 'heat', 'pulse', 'industrial'],
    field: `
vec2 chamber = vec2(p.x * 0.92, p.y * 1.2);
float cr = length(chamber / vec2(1.25, 0.58));
float mouth = glow(cr, 0.58);
float inner = glow(cr, 0.34);
float pressure = lineGlow(cr - (0.42 + 0.08 * sin(t * 2.0)), 0.055) + lineGlow(cr - (0.68 + 0.04 * sin(t * 1.4)), 0.05) * 0.45;
float grate = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  float x = -0.55 + fi * 0.155;
  grate += lineGlow(p.x - x - 0.02 * sin(t + fi), 0.012) * (1.0 - smoothstep(0.0, 0.62, abs(p.y)));
}
float jets = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  vec2 q = p - vec2((fi - 2.5) * 0.18, -0.52);
  q.x += sin(q.y * (4.0 + fi * 0.2) + t * (1.1 + fi * 0.1)) * 0.05;
  jets += lineGlow(q.x, 0.035) * smoothstep(0.0, 0.16, q.y) * (1.0 - smoothstep(0.18, 1.0, q.y));
}
float heat = fbm(p * vec2(2.0, 3.0) - vec2(0.0, t * 0.3)) * mouth;
v += mouth * 0.38 + inner * 0.82 + pressure * 0.46 + grate * 0.34 + jets * 0.52 + heat * 0.24;
`,
    warp: `
p.y += 0.035 * fbm(p * 2.2 + vec2(0.0, t * 0.08));
p.x += 0.03 * sin(p.y * 5.0 + t * 0.9);
`,
    color: `vec3(0.028, 0.01, 0.012) + vec3(0.2, 0.035, 0.04) * mask + uPrimary * shade * 0.62 + vec3(1.0, 0.25, 0.05) * pow(clamp(shade, 0.0, 1.0), 1.45) * 0.36 + vec3(1.0, 0.78, 0.5) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.18`,
    post: `
float chamberGlow = 1.0 - smoothstep(0.0, 1.35, length(uv * vec2(0.8, 1.0)));
color += vec3(0.32, 0.04, 0.04) * chamberGlow * 0.22;
`,
    intensity: 1.16,
    motion: 1.02,
    detail: 2.5,
  }),
  makeEffect({
    id: 'wildfire-front',
    title: 'Wildfire Front',
    titleJa: '山火事の前線',
    categoryId: 'fire-smoke',
    description: 'A wide roaring fireline with layered flame tongues, smoke canopy, and flying embers.',
    descriptionJa: '広く唸る火線、重なる炎の舌、煙の天蓋、飛び散る火の粉。',
    accentColor: '#ff7a1a',
    tags: ['wildfire', 'front', 'flame', 'embers'],
    field: `
float terrain = p.y + 0.42 + fbm(p * vec2(2.2, 1.2) - vec2(0.0, t * 0.18)) * 0.16;
float baseFront = lineGlow(terrain, 0.13) * (1.0 - smoothstep(-0.1, 1.0, p.y));
float flames = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  vec2 s = p;
  s.x += fi * 0.17 + sin(t * 0.4 + fi) * 0.06;
  float lane = fract(s.x * (2.4 + fi * 0.08)) - 0.5;
  float height = 0.32 + hash11(fi) * 0.58;
  float tongue = lineGlow(lane + sin(s.y * 3.0 + t + fi) * 0.1, 0.055);
  tongue *= smoothstep(-0.84, -0.18, s.y) * (1.0 - smoothstep(-0.16, height, s.y + 0.48));
  flames += tongue * (0.45 + hash11(fi + 4.0));
}
float smokeBank = fbm(p * vec2(1.4, 2.4) + vec2(t * 0.02, -t * 0.2)) * smoothstep(-0.18, 0.5, p.y);
float embers = 0.0;
for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 14.5));
  float rise = fract(seed.y + t * (0.08 + seed.x * 0.2));
  vec2 pos = vec2(-1.4 + seed.x * 2.8 + sin(t + fi) * 0.08, -0.48 + rise * 1.55);
  pos.x += rise * (seed.x - 0.5) * 0.6;
  embers += glow(length(p - pos), 0.022 + seed.x * 0.014) * (1.0 - rise);
}
v += baseFront * 0.58 + flames * 0.68 + smokeBank * 0.2 + embers * 0.45;
`,
    warp: `
p.y += 0.05 * fbm(p * 2.0 - vec2(0.0, t * 0.16));
p.x += 0.035 * sin(p.y * 4.0 + t);
`,
    color: `vec3(0.03, 0.012, 0.006) + vec3(0.24, 0.04, 0.01) * mask + uPrimary * shade * 0.72 + vec3(1.0, 0.27, 0.02) * pow(clamp(shade, 0.0, 1.0), 1.38) * 0.42 + vec3(1.0, 0.83, 0.28) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.2`,
    post: `
float smokeSky = (1.0 - smoothstep(-0.05, 1.2, uv.y)) * (1.0 - smoothstep(0.0, 1.7, length(uv * vec2(0.72, 1.0))));
color += vec3(0.24, 0.055, 0.02) * smokeSky * 0.24;
`,
    intensity: 1.2,
    motion: 1.08,
    detail: 2.8,
  }),
  makeEffect({
    id: 'cinder-rain',
    title: 'Cinder Rain',
    titleJa: '火の粉雨',
    categoryId: 'fire-smoke',
    description: 'A storm of falling cinders with hot tails, smoky parallax, and glowing depth.',
    descriptionJa: '熱い尾を引く火の粉の嵐、煙のパララックス、奥行きの発光。',
    accentColor: '#ff4f6e',
    tags: ['cinder', 'rain', 'fall', 'storm'],
    field: `
float haze = fbm(p * vec2(1.3, 1.8) + vec2(t * 0.025, -t * 0.05)) * (1.0 - smoothstep(0.0, 1.65, length(p)));
float rain = 0.0;
for (int i = 0; i < 54; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 4.4));
  float depth = pow(seed.x, 1.25);
  float fall = fract(seed.y + t * (0.16 + depth * 0.28));
  vec2 pos = vec2(-1.7 + seed.x * 3.4, 1.22 - fall * 2.65);
  pos.x += sin(t * 0.5 + fi) * 0.08 - fall * (0.12 + seed.y * 0.22);
  vec2 q = p - pos;
  vec2 tail = vec2(0.05 + depth * 0.08, -0.15 - depth * 0.14);
  float streak = lineGlow(sdSegment(q, vec2(0.0), tail), 0.009 + depth * 0.008);
  float head = glow(length(q), 0.035 + depth * 0.02);
  rain += (streak * 0.78 + head * 0.5) * (0.25 + depth * 0.9);
}
float groundGlow = smoothstep(-1.12, -0.55, p.y) * (1.0 - smoothstep(0.0, 1.35, abs(p.x)));
v += haze * 0.2 + rain * 0.72 + groundGlow * 0.3;
`,
    warp: `
p.x += (fbm(p * 1.8 + vec2(t * 0.05, 0.0)) - 0.5) * 0.055;
`,
    color: `vec3(0.02, 0.011, 0.014) + vec3(0.18, 0.035, 0.045) * mask + uPrimary * shade * 0.7 + vec3(1.0, 0.28, 0.05) * pow(clamp(shade, 0.0, 1.0), 1.45) * 0.34 + vec3(1.0, 0.78, 0.45) * pow(clamp(shade, 0.0, 1.0), 2.9) * 0.16`,
    post: `
float hotAir = fbm(uv * vec2(1.6, 1.0) + vec2(iTime * 0.03, -iTime * 0.02));
color += vec3(0.2, 0.035, 0.035) * hotAir * (1.0 - smoothstep(0.0, 1.55, length(uv))) * 0.2;
`,
    intensity: 1.16,
    motion: 1.12,
    detail: 2.6,
  }),
]
