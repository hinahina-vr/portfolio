import { makeEffect, type ShaderRecipe } from './glsl'

export const spaceEffects = [
  ['starfield-drift', 'Starfield Drift', '星野ドリフト', '#bfdbfe', 'Layered stars drifting at different depths.', '奥行きごとに流れる星野。', `
vec2 q = p;
float depthFog = smoothstep(1.75, 0.0, length(q * vec2(0.78, 1.0)));
float nebula = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = rot(-0.38 + fi * 0.18) * q;
  s += vec2(t * (0.018 + fi * 0.006), -t * (0.012 + fi * 0.004));
  float cloud = fbm(s * (1.15 + fi * 0.34) + fi * 3.7);
  nebula += smoothstep(0.34 + fi * 0.035, 0.9, cloud) * (0.22 / (1.0 + fi * 0.25));
}

float stars = 0.0;
float streaks = 0.0;
for (int i = 0; i < 90; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 18.7));
  float z = fract(seed.y + t * (0.012 + seed.x * 0.028));
  float scale = mix(1.7, 0.55, z);
  vec2 pos = (seed * 2.0 - 1.0) * vec2(1.75, 1.15) * scale;
  pos.x += 0.16 * sin(t * 0.08 + fi);
  float size = mix(0.004, 0.028, z);
  float point = smoothstep(size, 0.0, length(q - pos));
  float glow = smoothstep(size * 5.5, 0.0, length(q - pos));
  float twinkle = 0.48 + 0.52 * sin(t * (0.7 + seed.x * 2.0) + fi * 3.2);
  stars += (point * (0.7 + z * 1.2) + glow * 0.12) * twinkle * smoothstep(0.0, 0.18, z);

  vec2 tail = pos - vec2(0.035 + z * 0.09, -0.018 + seed.x * 0.036);
  streaks += stroke(sdSegment(q, pos, tail), 0.0025 + z * 0.004) * smoothstep(0.72, 1.0, z) * 0.35;
}

float dust = step(0.992, hash21(floor((q + t * 0.01) * vec2(76.0, 54.0)))) * depthFog;
v += nebula * 0.58 + stars * 0.92 + streaks * 0.55 + dust * 0.32 + depthFog * 0.04;
`],
  ['event-horizon', 'Event Horizon', '事象の地平', '#a78bfa', 'Bent rings falling into a black center.', '黒い中心へ歪んで落ちるリング。', `
vec2 q = p;
float r = length(q);
float a = atan(q.y, q.x);
float lens = smoothstep(1.55, 0.08, r);
float hole = 1.0 - smoothstep(0.26, 0.36, r);

float disk = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 s = q;
  s.y *= 0.42 + fi * 0.035;
  s = rot(0.16 * sin(t * 0.18 + fi)) * s;
  float rr = length(s);
  float aa = atan(s.y, s.x) + 0.52 / max(rr, 0.12) - t * (0.16 + fi * 0.025);
  float band = stroke(rr - (0.38 + fi * 0.075 + 0.025 * sin(aa * 2.0 + fi)), 0.018 + fi * 0.003);
  float broken = smoothstep(-0.35, 0.82, sin(aa * (2.4 + fi * 0.5) + t * 0.7 + fi * 2.1));
  float sideLight = 0.32 + 0.68 * smoothstep(-0.8, 0.65, sin(aa - 0.7));
  disk += band * broken * sideLight * (0.9 - fi * 0.08);
}

float lensArcs = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = rot(-0.4 + fi * 0.22) * q;
  float rr = length(s / vec2(1.0 + fi * 0.16, 0.58 + fi * 0.08));
  float arc = stroke(rr - (0.62 + fi * 0.18), 0.008 + fi * 0.002);
  float window = smoothstep(-0.65, 0.8, sin(atan(s.y, s.x) * 1.4 + t * 0.24 + fi));
  lensArcs += arc * window * (0.52 - fi * 0.06);
}

float fallingDust = 0.0;
for (int i = 0; i < 58; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 49.4));
  float life = fract(seed.y + t * (0.025 + seed.x * 0.05));
  float rr = mix(1.05, 0.36, life);
  float aa = seed.x * 6.28318 + life * (1.8 + seed.y * 1.1);
  vec2 pos = vec2(cos(aa), sin(aa) * 0.58) * rr;
  float mote = smoothstep(0.008 + seed.x * 0.014, 0.0, length(q - pos));
  fallingDust += mote * smoothstep(0.0, 0.14, life) * smoothstep(1.0, 0.62, life);
}

float innerVoid = smoothstep(0.35, 0.0, r);
float gravitationalFog = fbm(q * vec2(1.7, 2.3) + vec2(t * 0.025, -t * 0.018)) * lens * (1.0 - hole);
v += disk * (1.0 - innerVoid) + lensArcs * 0.8 + fallingDust * 0.72 + gravitationalFog * 0.24;
`],
  ['solar-wind', 'Solar Wind', '太陽風', '#fbbf24', 'Streaming charged ribbons from one side of the frame.', '画面端から流れる荷電リボン。', `
vec2 q = p;
float sourceGlow = smoothstep(0.86, 0.0, length((q + vec2(1.05, 0.0)) / vec2(0.7, 0.5)));
float depthFog = smoothstep(1.65, 0.0, length(q * vec2(0.8, 1.0)));
float streams = 0.0;

for (int i = 0; i < 11; i++) {
  float fi = float(i);
  vec2 s = q;
  float lane = -0.92 + fi * 0.19;
  s.y += sin(s.x * (2.2 + fi * 0.11) + t * (0.42 + fi * 0.035) + fi) * (0.09 + fi * 0.006);
  s.y += (fbm(vec2(s.x * (1.3 + fi * 0.08), fi + t * 0.06)) - 0.5) * 0.16;
  float veil = smoothstep(0.09 + fi * 0.004, 0.0, abs(s.y - lane));
  float hotEdge = smoothstep(0.014 + fi * 0.001, 0.0, abs(s.y - lane + sin(s.x * 7.0 + t + fi) * 0.014));
  float travel = smoothstep(-1.2, -0.54, q.x) * smoothstep(1.28, -0.08, q.x);
  float pulse = 0.55 + 0.45 * sin(q.x * (4.0 + fi * 0.4) - t * (1.0 + fi * 0.05) + fi);
  streams += (veil * 0.2 + hotEdge * 0.58) * travel * pulse * (0.9 - fi * 0.035);
}

float chargedDust = 0.0;
for (int i = 0; i < 54; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 65.3));
  float life = fract(seed.x + t * (0.07 + seed.y * 0.13));
  vec2 pos = vec2(-1.18 + life * 2.5, -0.95 + seed.y * 1.9);
  pos.y += 0.1 * sin(pos.x * 2.6 + t * 0.5 + fi);
  float spark = smoothstep(0.008 + seed.x * 0.017, 0.0, length(q - pos));
  vec2 tail = pos - vec2(0.05 + seed.y * 0.12, -0.018 + seed.x * 0.036);
  float streak = stroke(sdSegment(q, pos, tail), 0.003 + seed.x * 0.004);
  chargedDust += (spark * 0.5 + streak * 0.75) * smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.72, life);
}

float auroraFog = fbm(q * vec2(1.2, 2.0) + vec2(t * 0.018, -t * 0.028)) * depthFog;
v += streams * 0.96 + chargedDust * 0.66 + sourceGlow * 0.5 + auroraFog * 0.2;
`],
  ['comet-tail', 'Comet Tail', '彗星尾', '#67e8f9', 'A comet head dragging a turbulent ion tail.', '乱流のイオン尾を引く彗星。', `
vec2 head = vec2(0.46 + 0.12 * sin(t * 0.22), 0.12 * cos(t * 0.31));
vec2 q = p - head;
vec2 dir = normalize(vec2(-1.0, 0.1 + 0.08 * sin(t * 0.3)));
vec2 side = vec2(-dir.y, dir.x);
float along = dot(q, dir);
float across = dot(q, side);
float tailMask = smoothstep(-0.04, 0.16, along) * smoothstep(1.72, 0.12, along);

float filaments = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  float lane = (fi - 3.5) * 0.048 + sin(along * (3.0 + fi * 0.22) - t * (0.8 + fi * 0.05) + fi) * (0.035 + along * 0.035);
  lane += (fbm(vec2(along * 2.0, fi + t * 0.08)) - 0.5) * (0.05 + along * 0.04);
  float line = smoothstep(0.025 + fi * 0.002 + along * 0.018, 0.0, abs(across - lane));
  float broken = smoothstep(-0.35, 0.86, sin(along * (7.0 + fi) - t * 1.1 + fi));
  filaments += line * broken * tailMask * (0.82 - fi * 0.045);
}

float wake = fbm(vec2(along * 1.6, across * 4.0) + vec2(-t * 0.1, t * 0.03)) * tailMask * smoothstep(0.7, 0.0, abs(across));
float core = smoothstep(0.055, 0.0, length(q / vec2(1.0, 0.78)));
float halo = smoothstep(0.22, 0.0, length(q / vec2(1.0, 0.72)));

float fragments = 0.0;
for (int i = 0; i < 38; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 88.5));
  float life = fract(seed.y + t * (0.035 + seed.x * 0.08));
  float travel = life * (0.2 + seed.y * 1.5);
  vec2 pos = head + dir * travel + side * ((seed.x - 0.5) * (0.12 + travel * 0.34));
  pos += vec2(sin(t * 0.2 + fi), cos(t * 0.18 + fi)) * 0.03;
  float spark = smoothstep(0.008 + seed.x * 0.016, 0.0, length(p - pos));
  fragments += spark * smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.62, life);
}

v += filaments * 0.92 + wake * 0.42 + core * 1.0 + halo * 0.36 + fragments * 0.62;
`],
  ['galaxy-arms', 'Galaxy Arms', '銀河腕', '#f0abfc', 'Soft spiral arms with dusty star pockets.', '星のポケットを持つ柔らかな渦巻腕。', `
vec2 q = p * vec2(1.0, 0.78);
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.55, 0.0, r);
float dustNoise = fbm(vec2(a * 0.8 + t * 0.02, r * 3.1 - t * 0.02));

float arms = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  float spiral = a * (2.0 + fi * 0.08) + r * (8.5 + fi * 0.9) - t * (0.22 + fi * 0.02);
  float band = stroke(sin(spiral), 0.09 + fi * 0.012);
  float lane = stroke(sin(spiral + 0.78 + dustNoise * 1.5), 0.052);
  float fade = smoothstep(1.45, 0.05, r) * smoothstep(0.08, 0.55, r);
  arms += (band * 0.42 + lane * 0.22) * fade * (0.78 - fi * 0.08);
}

float starPockets = 0.0;
for (int i = 0; i < 70; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 24.7));
  float rr = pow(seed.y, 0.58) * 1.16;
  float aa = seed.x * 6.28318 + rr * 4.2 - t * 0.06;
  vec2 pos = vec2(cos(aa), sin(aa) * 0.78) * rr;
  float size = 0.005 + hash11(fi + 11.0) * 0.018;
  float spark = smoothstep(size, 0.0, length(p - pos));
  starPockets += spark * smoothstep(1.35, 0.0, length(pos)) * (0.5 + seed.y);
}

float core = smoothstep(0.28, 0.0, length(q / vec2(1.0, 0.7)));
float fog = fbm(q * 2.2 + vec2(t * 0.025, -t * 0.018)) * depth;
v += arms * (0.75 + dustNoise * 0.55) + starPockets * 0.76 + core * 0.58 + fog * 0.18;
`],
  ['asteroid-static', 'Asteroid Static', '小惑星静電', '#94a3b8', 'Rocky fragments with electric static between them.', '岩片の間を走る静電ノイズ。', `
vec2 q = p;
float depthFog = smoothstep(1.65, 0.0, length(q * vec2(0.82, 1.0)));
float rocks = 0.0;
float staticBolts = 0.0;

vec2 prev = vec2(10.0);
for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 12.9));
  float z = hash11(fi + 9.0);
  vec2 pos = (seed * 2.0 - 1.0) * vec2(1.25, 0.82) * mix(1.15, 0.58, z);
  pos += vec2(sin(t * 0.08 + fi), cos(t * 0.06 + fi * 1.4)) * (0.03 + z * 0.05);
  vec2 local = rot(seed.x * 6.28318 + t * (0.02 + z * 0.025)) * (q - pos);
  float body = fill(sdBox(local, vec2(0.022 + seed.x * 0.05, 0.018 + seed.y * 0.04)));
  float rim = stroke(sdBox(local, vec2(0.026 + seed.x * 0.052, 0.022 + seed.y * 0.042)), 0.006);
  rocks += (body * 0.18 + rim * 0.62) * (0.45 + z) * depthFog;

  if (i > 0) {
    float link = stroke(sdSegment(q, pos, prev), 0.004 + z * 0.004);
    float pulse = smoothstep(-0.35, 0.9, sin(t * (1.1 + z) + fi * 2.2));
    staticBolts += link * pulse * smoothstep(0.8, 0.05, length(pos - prev)) * 0.6;
  }
  prev = pos;
}

float ionMist = fbm(q * vec2(1.6, 2.4) + vec2(t * 0.02, -t * 0.026)) * depthFog;
float scanDust = step(0.993, hash21(floor(q * vec2(90.0, 64.0)) + floor(t * 1.5))) * depthFog;
v += rocks * 0.86 + staticBolts * 0.72 + ionMist * 0.18 + scanDust * 0.26;
`],
  ['eclipse-corona', 'Eclipse Corona', '日食コロナ', '#fde68a', 'Corona rays shining around a dark occulting disk.', '黒い円盤の周囲で輝くコロナ光。', `
vec2 q = p;
float r = length(q);
float a = atan(q.y, q.x);
float outside = smoothstep(0.37, 0.43, r);
float coronaMask = outside * smoothstep(1.65, 0.38, r);
float surfaceNoise = fbm(vec2(cos(a), sin(a)) * 2.0 + vec2(t * 0.026, -t * 0.018));
float rim = stroke(r - (0.405 + (surfaceNoise - 0.5) * 0.02), 0.012) * (0.5 + surfaceNoise * 0.7);

float streamers = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 flow = vec2(a * (0.65 + fi * 0.12) + fi * 4.1, r * (2.3 + fi * 0.26) - t * (0.04 + fi * 0.01));
  float plasma = fbm(flow + vec2(fbm(flow * 0.8 + fi) * 1.7, 0.0));
  float lane = smoothstep(0.58 + fi * 0.012, 0.96, plasma);
  float feather = exp(-max(0.0, r - 0.4) * (1.6 + fi * 0.16));
  float asym = 0.44 + 0.56 * smoothstep(-0.5, 0.8, sin(a * 1.7 + fi * 1.4 + t * 0.05));
  streamers += lane * feather * asym * (0.46 / (1.0 + fi * 0.14));
}

float beads = 0.0;
for (int i = 0; i < 48; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 41.5));
  float rr = 0.42 + seed.y * 0.72;
  float aa = seed.x * 6.28318 + t * (0.018 + seed.y * 0.016);
  vec2 pos = vec2(cos(aa), sin(aa)) * rr;
  beads += smoothstep(0.008 + seed.x * 0.012, 0.0, length(q - pos)) * smoothstep(1.24, 0.4, rr);
}

float softHalo = exp(-max(0.0, r - 0.41) * 2.4) * outside;
v += (rim * 0.72 + streamers * 0.86 + beads * 0.4 + softHalo * 0.18) * coronaMask;
`],
  ['orbital-grid', 'Orbital Grid', '軌道グリッド', '#38bdf8', 'Elliptical orbit lines with moving satellite points.', '動く衛星点を持つ楕円軌道グリッド。', `
vec2 center = vec2(0.06, -0.04);
vec2 q = p - center;
float planetR = length(q / vec2(1.0, 0.82));
vec2 planetN = q / max(length(q), 0.001);
float limbLight = smoothstep(-0.28, 0.78, dot(planetN, normalize(vec2(-0.42, 0.92))));
float limb = stroke(planetR - 0.42, 0.01) * (0.12 + limbLight * 0.36);
float orbitField = 0.0;
float satellites = 0.0;
float telemetry = 0.0;

for (int i = 0; i < 10; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 37.1));
  float angle = -0.98 + fi * 0.27 + (seed.x - 0.5) * 0.42;
  vec2 axes = vec2(0.62 + seed.x * 0.72, 0.18 + seed.y * 0.44);
  vec2 s = rot(angle) * q;
  float orbit = length(s / axes) - 1.0;
  float theta = atan(s.y / axes.y, s.x / axes.x);
  float phase = fract(theta / 6.28318 + 0.5 + seed.y * 0.72 + t * (0.02 + seed.x * 0.016));
  float arcWindow = smoothstep(0.02, 0.12, phase) * (1.0 - smoothstep(0.58, 0.88, phase));
  float depth = smoothstep(-0.62, 0.56, s.y) * 0.72 + 0.14;
  orbitField += stroke(orbit, 0.004 + seed.x * 0.004) * arcWindow * depth * (0.58 - fi * 0.028);

  float satA = t * (0.18 + seed.x * 0.14) + seed.y * 6.28318;
  vec2 satLocal = vec2(cos(satA), sin(satA)) * axes;
  vec2 sat = rot(-angle) * satLocal;
  float front = smoothstep(-0.22, 0.52, satLocal.y);
  float satCore = smoothstep(0.024, 0.0, length(q - sat));
  float satGlow = smoothstep(0.12, 0.0, length(q - sat));
  satellites += (satCore * 1.15 + satGlow * 0.22) * front * (0.68 + seed.y * 0.5);

  vec2 prevLocal = vec2(cos(satA - 0.22), sin(satA - 0.22)) * axes;
  vec2 prev = rot(-angle) * prevLocal;
  telemetry += stroke(sdSegment(q, sat, prev), 0.003) * front * 0.46;
}

float starDust = 0.0;
for (int i = 0; i < 44; i++) {
  float fi = float(i);
  vec2 star = hash22(vec2(fi, 12.8)) * 2.4 - 1.2;
  float twinkle = 0.45 + 0.55 * sin(t * (0.6 + hash11(fi) * 1.4) + fi);
  starDust += smoothstep(0.015, 0.0, length(p - star)) * step(0.64, hash11(fi + 3.0)) * twinkle;
}

v += orbitField + satellites + telemetry + limb + starDust * 0.16;
`],
  ['cosmic-web', 'Cosmic Web', '宇宙網', '#c4b5fd', 'Filaments linking bright nodes across deep space.', '深宇宙の明るい節点を結ぶフィラメント。', `
vec2 q = p;
float depthFog = smoothstep(1.65, 0.0, length(q * vec2(0.82, 1.0)));
float web = 0.0;
float nodes = 0.0;

for (int i = 0; i < 24; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 5.4));
  vec2 pos = (seed * 2.0 - 1.0) * vec2(1.3, 0.9);
  pos += vec2(sin(t * 0.05 + fi), cos(t * 0.04 + fi * 1.6)) * 0.04;
  float node = smoothstep(0.032 + seed.x * 0.025, 0.0, length(q - pos));
  float halo = smoothstep(0.16 + seed.y * 0.08, 0.0, length(q - pos));
  nodes += node * (0.8 + seed.y) + halo * 0.1;

  for (int j = 0; j < 3; j++) {
    float fj = float(j);
    vec2 targetSeed = hash22(vec2(fi + fj * 9.0 + 3.0, 16.8));
    vec2 target = (targetSeed * 2.0 - 1.0) * vec2(1.3, 0.9);
    float d = length(pos - target);
    float thread = stroke(sdSegment(q, pos, target), 0.004 + seed.x * 0.004);
    float pulse = smoothstep(-0.35, 0.85, sin(t * 0.6 + fi * 1.7 + fj));
    web += thread * smoothstep(0.68, 0.12, d) * pulse * 0.32;
  }
}

float gas = fbm(q * vec2(1.5, 2.4) + vec2(t * 0.018, -t * 0.024)) * depthFog;
v += web * 0.82 + nodes * 0.86 + gas * 0.18;
`],
].map(([id, title, titleJa, accentColor, description, descriptionJa, field]) => {
  const recipe: ShaderRecipe = {
    id,
    title,
    titleJa,
    categoryId: 'space',
    description,
    descriptionJa,
    accentColor,
    tags: ['space', id],
    field,
  }

  const tuned: Record<string, Partial<ShaderRecipe>> = {
    'starfield-drift': {
      warp: `
p += 0.018 * vec2(
  fbm(p * vec2(1.8, 2.4) + vec2(t * 0.02, 0.0)) - 0.5,
  fbm(p * vec2(2.2, 1.6) + vec2(0.0, -t * 0.02)) - 0.5
);
`,
      color: `vec3(0.002, 0.008, 0.025) + vec3(0.03, 0.06, 0.18) * mask + uPrimary * shade * 0.48 + vec3(0.62, 0.88, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.42 + vec3(0.45, 0.28, 0.72) * pow(clamp(mask, 0.0, 1.0), 1.3) * 0.16`,
      post: `
float fog = fbm(uv * vec2(1.2, 1.8) + vec2(iTime * 0.014, -iTime * 0.02));
float pocket = smoothstep(1.75, 0.0, length(uv * vec2(0.82, 1.0)));
color += vec3(0.025, 0.055, 0.12) * fog * pocket * 0.28;
color *= 1.0 - 0.34 * smoothstep(0.7, 1.92, length(uv));
`,
      intensity: 1.16,
      motion: 0.82,
      detail: 2.75,
    },
    'event-horizon': {
      warp: `
float horizonWarpR = length(p);
float horizonLens = smoothstep(1.35, 0.05, horizonWarpR);
p = rot(0.06 * horizonLens / max(horizonWarpR, 0.18) + t * 0.012) * p;
p += 0.025 * horizonLens * vec2(
  fbm(p * 2.0 + vec2(t * 0.03, 0.0)) - 0.5,
  fbm(p * 1.7 + vec2(0.0, -t * 0.03)) - 0.5
);
`,
      color: `vec3(0.004, 0.003, 0.018) + vec3(0.16, 0.07, 0.28) * mask + uPrimary * shade * 0.5 + vec3(0.82, 0.88, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.42 + vec3(1.0, 0.5, 0.82) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.16`,
      post: `
float r = length(uv);
float hole = 1.0 - smoothstep(0.29, 0.36, r);
color *= 1.0 - hole * 0.98;
float lensFog = fbm(uv * vec2(1.4, 2.0) + vec2(iTime * 0.018, -iTime * 0.014));
color += vec3(0.08, 0.035, 0.14) * lensFog * smoothstep(1.55, 0.28, r) * smoothstep(0.34, 0.5, r) * 0.35;
color += vec3(0.42, 0.28, 0.78) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.12;
color *= 1.0 - 0.36 * smoothstep(0.75, 1.88, r);
`,
      intensity: 1.12,
      motion: 0.9,
      detail: 2.7,
    },
    'solar-wind': {
      warp: `
p.x += 0.03 * sin(p.y * 2.4 + t * 0.22);
p.y += 0.035 * (fbm(p * vec2(1.5, 2.5) + vec2(t * 0.04, 0.0)) - 0.5);
`,
      color: `vec3(0.04, 0.024, 0.003) + vec3(0.26, 0.12, 0.015) * mask + uPrimary * shade * 0.62 + vec3(1.0, 0.86, 0.38) * pow(clamp(shade, 0.0, 1.0), 2.3) * 0.44 + vec3(0.45, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.1) * 0.1`,
      post: `
float fog = fbm(uv * vec2(1.1, 2.0) + vec2(iTime * 0.018, -iTime * 0.02));
float leftGlow = smoothstep(0.9, 0.0, length((uv + vec2(1.05, 0.0)) / vec2(0.72, 0.52)));
color += vec3(0.34, 0.16, 0.02) * fog * smoothstep(1.75, 0.0, length(uv)) * 0.26;
color += vec3(1.0, 0.52, 0.08) * leftGlow * 0.2;
color *= 1.0 - 0.32 * smoothstep(0.7, 1.9, length(uv));
`,
      intensity: 1.16,
      motion: 1.02,
      detail: 2.9,
    },
    'comet-tail': {
      warp: `
float cometWarp = smoothstep(1.45, 0.02, length(p * vec2(0.85, 1.05)));
p += 0.026 * cometWarp * vec2(
  fbm(p * vec2(2.0, 2.8) + vec2(t * 0.05, 0.0)) - 0.5,
  fbm(p * vec2(1.6, 2.2) + vec2(0.0, -t * 0.05)) - 0.5
);
`,
      color: `vec3(0.001, 0.016, 0.026) + vec3(0.0, 0.12, 0.17) * mask + uPrimary * shade * 0.58 + vec3(0.72, 1.0, 0.96) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.44`,
      post: `
float ionFog = fbm(uv * vec2(1.5, 2.3) + vec2(iTime * 0.02, -iTime * 0.03));
color += vec3(0.0, 0.16, 0.22) * ionFog * smoothstep(1.65, 0.0, length(uv)) * 0.23;
color += vec3(0.52, 0.95, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.12;
color *= 1.0 - 0.34 * smoothstep(0.72, 1.9, length(uv));
`,
      intensity: 1.18,
      motion: 1.0,
      detail: 2.75,
    },
    'galaxy-arms': {
      warp: `
float galaxyWarpR = length(p);
p = rot(0.025 * sin(t * 0.12) * smoothstep(1.5, 0.0, galaxyWarpR)) * p;
p += 0.018 * vec2(fbm(p * 1.8 + t * 0.02), fbm(p.yx * 1.6 - t * 0.02)) * smoothstep(1.5, 0.0, galaxyWarpR);
`,
      color: `vec3(0.018, 0.006, 0.026) + vec3(0.12, 0.04, 0.16) * mask + uPrimary * shade * 0.42 + vec3(0.56, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.8) * 0.26 + vec3(1.0, 0.78, 0.9) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.2`,
      post: `
float gas = fbm(uv * vec2(1.3, 1.8) + vec2(iTime * 0.014, -iTime * 0.012));
float pocket = smoothstep(1.6, 0.0, length(uv * vec2(0.9, 1.05)));
color += vec3(0.09, 0.04, 0.14) * gas * pocket * 0.24;
color *= 1.0 - 0.34 * smoothstep(0.68, 1.86, length(uv));
`,
      intensity: 1.1,
      motion: 0.72,
      detail: 2.8,
    },
    'asteroid-static': {
      warp: `
p += 0.015 * vec2(
  fbm(p * vec2(2.1, 2.8) + vec2(t * 0.025, 0.0)) - 0.5,
  fbm(p * vec2(1.7, 2.2) + vec2(0.0, -t * 0.02)) - 0.5
);
`,
      color: `vec3(0.006, 0.008, 0.012) + vec3(0.12, 0.13, 0.18) * mask + uPrimary * shade * 0.48 + vec3(0.68, 0.9, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.42 + vec3(0.9, 0.56, 0.22) * pow(clamp(shade, 0.0, 1.0), 3.2) * 0.08`,
      post: `
float fog = fbm(uv * vec2(1.4, 2.2) + vec2(iTime * 0.018, -iTime * 0.022));
color += vec3(0.05, 0.08, 0.12) * fog * smoothstep(1.6, 0.0, length(uv)) * 0.22;
color *= 1.0 - 0.32 * smoothstep(0.72, 1.9, length(uv));
`,
      intensity: 1.18,
      motion: 0.85,
      detail: 2.7,
    },
    'eclipse-corona': {
      warp: `
float lensDrift = smoothstep(1.45, 0.22, length(p));
p += 0.014 * lensDrift * vec2(
  fbm(p * vec2(1.8, 2.6) + vec2(t * 0.018, 0.0)) - 0.5,
  fbm(p * vec2(2.1, 1.7) + vec2(0.0, -t * 0.02)) - 0.5
);
`,
      color: `vec3(0.006, 0.004, 0.001) + vec3(0.42, 0.28, 0.055) * mask + vec3(0.78, 0.58, 0.18) * shade * 0.38 + vec3(1.0, 0.94, 0.68) * pow(clamp(shade, 0.0, 1.0), 2.35) * 0.55 + vec3(0.42, 0.75, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.2) * 0.08`,
      post: `
float r = length(uv);
float occult = 1.0 - smoothstep(0.36, 0.42, r);
color *= 1.0 - occult * 0.96;
float halo = exp(-max(0.0, r - 0.4) * 2.2) * smoothstep(0.38, 0.48, r);
color += vec3(0.18, 0.11, 0.025) * halo * 0.38;
color += vec3(0.75, 0.55, 0.18) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.16;
color *= 1.0 - 0.38 * smoothstep(0.65, 1.85, r);
`,
      intensity: 1.08,
      motion: 0.7,
      detail: 2.8,
    },
    'orbital-grid': {
      warp: `
float orbitalParallax = smoothstep(1.5, 0.18, length(p));
p += 0.012 * orbitalParallax * vec2(
  sin(p.y * 2.2 + t * 0.08),
  cos(p.x * 1.8 - t * 0.07)
);
`,
      color: `vec3(0.002, 0.008, 0.014) + vec3(0.0, 0.09, 0.16) * mask + uPrimary * shade * 0.58 + vec3(0.55, 0.92, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.5) * 0.48`,
      post: `
vec2 q = uv - vec2(0.06, -0.04);
float planetR = length(q / vec2(1.0, 0.82));
float planet = 1.0 - smoothstep(0.385, 0.435, planetR);
float nightTexture = fbm(q * vec2(5.0, 3.6) + vec2(0.0, iTime * 0.01));
color *= 1.0 - planet * 0.92;
color += planet * vec3(0.004, 0.014, 0.026) * (0.9 + nightTexture * 0.55);
float limbGlow = stroke(planetR - 0.43, 0.018);
vec2 planetN = q / max(length(q), 0.001);
float limbSide = smoothstep(-0.25, 0.72, dot(planetN, normalize(vec2(-0.38, 0.92))));
color += vec3(0.08, 0.42, 0.72) * limbGlow * (0.05 + limbSide * 0.2);
float horizonScatter = smoothstep(0.34, 0.46, planetR) * smoothstep(0.74, 0.25, abs(q.y + q.x * 0.18));
color += vec3(0.02, 0.2, 0.3) * horizonScatter * 0.14;
color += vec3(0.2, 0.58, 0.82) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.18;
color *= 1.0 - 0.36 * smoothstep(0.65, 1.86, length(uv));
`,
      intensity: 0.96,
      motion: 0.78,
      detail: 2.5,
    },
    'cosmic-web': {
      warp: `
p += 0.018 * vec2(
  fbm(p * vec2(1.7, 2.4) + vec2(t * 0.018, 0.0)) - 0.5,
  fbm(p * vec2(2.2, 1.7) + vec2(0.0, -t * 0.018)) - 0.5
);
`,
      color: `vec3(0.012, 0.006, 0.028) + vec3(0.08, 0.04, 0.18) * mask + uPrimary * shade * 0.54 + vec3(0.6, 0.88, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.34`,
      post: `
float gas = fbm(uv * vec2(1.3, 2.0) + vec2(iTime * 0.014, -iTime * 0.02));
color += vec3(0.06, 0.035, 0.14) * gas * smoothstep(1.68, 0.0, length(uv)) * 0.22;
color *= 1.0 - 0.34 * smoothstep(0.72, 1.9, length(uv));
`,
      intensity: 1.14,
      motion: 0.74,
      detail: 2.7,
    },
  }

  return makeEffect({ ...recipe, ...tuned[recipe.id] })
})
