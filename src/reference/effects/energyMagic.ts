import { makeEffect, type ShaderRecipe } from './glsl'

export const energyMagicEffects = [
  ['emerald-eruption', 'Emerald Eruption', '翠光噴裂', '#45ff5f', 'A dense green particle eruption with blown-out core light, magical dust, and turbulent mist.', '白飛びする核光、魔法粒子、乱流する緑霧が噴き上がる粒子爆発。', `
vec2 q = p;
vec2 source = vec2(0.12, -0.62);
vec2 blastDir = normalize(vec2(0.12, 1.0));
vec2 sideDir = vec2(-blastDir.y, blastDir.x);
vec2 rel = q - source;
float along = dot(rel, blastDir);
float across = dot(rel, sideDir);
vec2 local = vec2(across, along);
float cone = smoothstep(-0.08, 0.18, along) * smoothstep(1.72, 0.14, along);
float width = 0.11 + along * 0.54;
float plumeMask = cone * smoothstep(width, 0.0, abs(across));

float turbulentMist = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  vec2 s = q;
  s.x += 0.12 * sin(s.y * (2.4 + fi * 0.24) + t * (0.34 + fi * 0.05) + fi);
  float cloud = fbm(s * (1.55 + fi * 0.42) + vec2(t * (0.04 + fi * 0.014), -t * (0.07 + fi * 0.018)) + fi);
  float torn = smoothstep(0.38 + fi * 0.032, 0.92, cloud) * plumeMask;
  turbulentMist += torn * (0.2 / (1.0 + fi * 0.22));
}

float glassVeils = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  vec2 s = local;
  s.x += (fbm(vec2(s.y * (1.5 + fi * 0.13), fi + t * 0.07)) - 0.5) * (0.14 + s.y * 0.08);
  float lane = -0.42 + fi * 0.12 + sin(s.y * (2.4 + fi * 0.18) - t * (0.42 + fi * 0.04) + fi) * (0.06 + fi * 0.008);
  float veil = smoothstep(0.105 + fi * 0.004, 0.0, abs(s.x - lane));
  float brightEdge = smoothstep(0.016 + fi * 0.002, 0.0, abs(s.x - lane + sin(s.y * 6.6 + t * 0.8 + fi) * 0.019));
  float broken = smoothstep(-0.35, 0.8, sin(s.y * (5.0 + fi * 0.8) + t * 0.72 + fi * 2.1));
  glassVeils += (veil * 0.2 + brightEdge * 0.7) * cone * broken * (0.7 + fi * 0.03);
}

float particleWall = 0.0;
float nearSparks = 0.0;
for (int i = 0; i < 64; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 71.3));
  float depth = hash11(fi + 18.0);
  float speed = 0.26 + seed.y * 0.68;
  float life = fract(seed.x + t * speed);
  float travel = pow(life, 0.68) * (0.28 + seed.y * 1.45);
  float spread = (seed.x - 0.5) * (0.16 + travel * 0.92);
  vec2 curl = vec2(
    sin(t * (0.9 + seed.x) + fi * 2.1 + travel * 4.0),
    cos(t * (0.65 + seed.y) + fi * 1.7)
  ) * (0.028 + travel * 0.07);
  vec2 pos = source + blastDir * travel + sideDir * spread + curl;
  pos += vec2(0.08 * sin(t * 0.25 + seed.y * 6.0), 0.04 * cos(t * 0.2 + fi)) * depth;
  float size = mix(0.006, 0.03, depth) * (1.0 - life * 0.38);
  float core = smoothstep(size, 0.0, length(q - pos));
  float halo = smoothstep(size * 5.5, 0.0, length(q - pos));
  float fade = smoothstep(0.0, 0.12, life) * smoothstep(1.0, 0.58, life);
  float sideBreak = 0.52 + 0.48 * fbm(pos * 4.2 + vec2(fi, t * 0.08));
  particleWall += (core * (0.9 + depth * 1.4) + halo * 0.18) * fade * sideBreak;

  vec2 streakTail = pos - blastDir * (0.018 + depth * 0.095) - sideDir * (seed.x - 0.5) * 0.04;
  float streak = stroke(sdSegment(q, pos, streakTail), mix(0.002, 0.008, depth));
  nearSparks += streak * fade * (0.26 + depth * 0.58);
}

float fineDust = 0.0;
for (int i = 0; i < 48; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 12.6));
  float life = fract(seed.y + t * (0.08 + seed.x * 0.15));
  float travel = life * (0.25 + seed.x * 1.55);
  vec2 pos = source + blastDir * travel + sideDir * ((seed.x - 0.5) * (0.22 + travel * 1.1));
  pos += vec2(sin(fi + t * 0.7), cos(fi * 1.3 + t * 0.5)) * 0.025;
  float dust = smoothstep(0.006 + seed.y * 0.014, 0.0, length(q - pos));
  fineDust += dust * smoothstep(0.0, 0.1, life) * smoothstep(1.0, 0.42, life);
}

float sparkSheet = 0.0;
vec2 sheetUv = vec2(q.x * 74.0 + t * 1.2, q.y * 52.0 - t * 1.6);
vec2 sheetCell = floor(sheetUv);
vec2 sheetLocal = fract(sheetUv) - 0.5;
for (int y = -1; y <= 1; y++) {
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 seed = hash22(sheetCell + g);
    vec2 pos = g + seed - 0.5;
    float h = hash21(sheetCell + g + 19.0);
    float dotp = smoothstep(0.035 + seed.x * 0.022, 0.0, length(sheetLocal - pos));
    float twinkle = 0.4 + 0.6 * sin(t * (4.0 + seed.y * 8.0) + h * 18.0);
    sparkSheet += dotp * smoothstep(0.62, 0.98, h) * twinkle;
  }
}
sparkSheet *= plumeMask * smoothstep(0.0, 0.28, along) * smoothstep(1.62, 0.2, along);

float shards = 0.0;
for (int i = 0; i < 28; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 119.4));
  float life = fract(seed.y + t * (0.026 + seed.x * 0.05));
  float travel = pow(life, 0.75) * (0.2 + seed.y * 1.32);
  vec2 pos = source + blastDir * travel + sideDir * ((seed.x - 0.5) * (0.26 + travel * 0.86));
  pos += vec2(sin(t * 0.2 + fi), cos(t * 0.17 + fi * 1.3)) * 0.04;
  vec2 shardUv = rot(seed.x * 6.28318 + t * 0.12) * (q - pos);
  float shard = stroke(sdBox(shardUv, vec2(0.006 + seed.x * 0.014, 0.026 + seed.y * 0.07)), 0.004);
  shards += shard * smoothstep(0.0, 0.16, life) * smoothstep(1.0, 0.52, life) * (0.6 + seed.y);
}

float baseChips = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 151.6));
  vec2 a = vec2(-0.3 + seed.x * 0.6, 0.0 + seed.y * 0.035);
  vec2 b = a + vec2((seed.x - 0.5) * 0.08, 0.035 + seed.y * 0.08);
  float chip = stroke(sdSegment(local, a, b), 0.005 + seed.x * 0.004);
  baseChips += chip * smoothstep(-0.25, 0.8, sin(t * 0.9 + fi * 2.4));
}
float baseMist = smoothstep(0.42, 0.0, length((q - source) / vec2(0.92, 0.28))) * (0.18 + fbm(q * 3.0 + vec2(t * 0.05, 0.0)) * 0.22);
float verticalGlow = pow(max(0.0, 1.0 - length(vec2(local.x * 1.15, max(local.y - 0.48, 0.0) * 0.62))), 2.2) * cone;

v += glassVeils * 0.92 + turbulentMist * 0.6 + particleWall * 0.86 + sparkSheet * 0.82 + nearSparks * 0.5 + fineDust * 0.66 + shards * 0.76;
v += baseChips * 0.18 + baseMist * 0.26 + verticalGlow * 0.16;
`],
  ['aurora-sigil', 'Aurora Veil', 'オーロラヴェール', '#86efac', 'Layered northern-light veils with drifting magical dust.', '幾層ものオーロラ幕と漂う魔法粒子。', `
vec2 q = p;
q.x += sin(q.y * 2.4 + t * 0.42) * 0.14;
float fade = smoothstep(-1.05, -0.18, q.y) * smoothstep(1.05, 0.1, q.y);
float depth = smoothstep(1.25, 0.02, length(q * vec2(0.72, 1.0)));
float curtains = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  float lane = -0.62 + fi * 0.2 + sin(t * 0.14 + fi * 1.6) * 0.08;
  float flow = fbm(vec2(q.x * (1.4 + fi * 0.11) + fi, q.y * 2.2 - t * (0.22 + fi * 0.035)));
  float ribbonX = lane + (flow - 0.5) * (0.32 + fi * 0.025) + sin(q.y * (2.6 + fi * 0.22) + t * 0.7 + fi) * 0.09;
  float strand = smoothstep(0.11 + fi * 0.006, 0.0, abs(q.x - ribbonX));
  float inner = smoothstep(0.026, 0.0, abs(q.x - ribbonX - sin(q.y * 5.0 + t + fi) * 0.018));
  curtains += (strand * 0.26 + inner * 0.72) * fade * (0.58 + flow * 0.62);
}
float mist = fbm(q * vec2(2.2, 1.4) + vec2(t * 0.04, -t * 0.08)) * fade * depth;
float motes = 0.0;
for (int i = 0; i < 16; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 5.1));
  float rise = fract(seed.y + t * (0.045 + seed.x * 0.06));
  vec2 pos = vec2((seed.x - 0.5) * 1.25 + sin(t * 0.3 + fi) * 0.06, -0.82 + rise * 1.6);
  motes += smoothstep(0.022 + seed.x * 0.018, 0.0, length(q - pos)) * smoothstep(1.0, 0.1, rise);
}
v += curtains * 0.82 + mist * 0.28 + motes * 0.95;
`],
  ['crystal-aura', 'Crystal Aura', 'クリスタルオーラ', '#7dd3fc', 'Prismatic crystal fog with fractured light sheets and drifting shards.', '結晶霧、割れた光の膜、漂う破片が重なるプリズム状オーラ。', `
vec2 q = p;
float depth = smoothstep(1.45, 0.05, length(q * vec2(0.82, 1.05)));
float lift = smoothstep(-1.0, -0.28, q.y) * smoothstep(1.05, 0.0, q.y);
float vapor = fbm(q * 2.0 + vec2(t * 0.035, -t * 0.05));
float vapor2 = fbm(rot(0.9) * q * 3.3 + vec2(-t * 0.06, t * 0.03));

float sheets = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 s = rot(-0.62 + fi * 0.19 + 0.035 * sin(t * 0.28 + fi)) * q;
  s.x += 0.12 * sin(s.y * (2.2 + fi * 0.18) + t * (0.45 + fi * 0.04) + fi);
  float lane = -0.55 + fi * 0.18 + (fbm(s * 1.8 + fi) - 0.5) * 0.22;
  float veil = smoothstep(0.16 + fi * 0.008, 0.0, abs(s.x - lane));
  float edge = smoothstep(0.026, 0.0, abs(s.x - lane - sin(s.y * 4.7 + t + fi) * 0.025));
  sheets += (veil * 0.22 + edge * 0.72) * lift * (0.55 + vapor * 0.55);
}

float facets = 0.0;
for (int i = 0; i < 22; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 14.7));
  float ang = seed.x * 6.28318 + t * (0.035 + seed.y * 0.04);
  float orbit = 0.18 + seed.y * 0.82;
  vec2 pos = vec2(cos(ang), sin(ang)) * orbit * vec2(1.08, 0.62);
  vec2 shard = rot(ang + seed.x * 2.4) * (q - pos);
  float box = sdBox(shard, vec2(0.012 + seed.x * 0.02, 0.045 + seed.y * 0.1));
  float glint = stroke(box, 0.006) + fill(box) * 0.18;
  float twinkle = 0.45 + 0.55 * sin(t * (1.4 + seed.x) + fi * 5.1);
  facets += glint * twinkle * smoothstep(1.18, 0.08, length(pos)) * depth;
}

float fracture = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 c = rot(0.55 + fi * 0.47) * q * (2.2 + fi * 0.55);
  c += vec2(sin(t * 0.12 + fi), cos(t * 0.1 + fi)) * 0.45;
  fracture += stroke(fbm(c) - (0.54 + 0.03 * sin(t + fi)), 0.022) * (0.34 / (1.0 + fi));
}

float core = smoothstep(0.66, 0.0, length(q / vec2(0.78, 0.48)));
float heart = smoothstep(0.24, 0.0, length((q + vec2(0.04, -0.05)) / vec2(0.58, 0.25)));
float corona = pow(max(0.0, 1.0 - length(q * vec2(0.72, 1.15))), 2.8);
v += sheets * 0.86 + facets * 0.95 + fracture * depth * 0.75;
v += core * (0.18 + vapor * 0.28) + heart * (0.42 + vapor2 * 0.36) + corona * 0.2;
`],
  ['mana-lattice', 'Mana Lattice', 'マナ格子', '#60a5fa', 'Interlocked lattice lines pulsing with mana.', 'マナで脈動する連結格子。', `
vec2 q = p;
float horizon = smoothstep(-1.05, -0.15, q.y) * smoothstep(1.12, 0.12, q.y);
float lens = smoothstep(1.45, 0.04, length(q * vec2(0.88, 1.05)));
float persp = 1.0 / (1.25 + max(q.y + 0.25, -0.25) * 0.46);

float lattice = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 s = rot(-0.72 + fi * 0.48 + 0.035 * sin(t * 0.24 + fi)) * q;
  s.x *= 3.6 * persp;
  s.y = (s.y + 0.28) * 3.2 + t * (0.07 + fi * 0.025);
  s += vec2(fi * 0.37 + 0.08 * sin(t * 0.18 + fi), fi * 0.23);
  vec2 cell = abs(fract(s) - 0.5);
  float stripe = smoothstep(0.024, 0.0, cell.x);
  float curved = smoothstep(0.018, 0.0, abs(cell.y - 0.18 - 0.12 * sin(s.x * 2.2 + t * 0.35 + fi)));
  float dash = smoothstep(-0.45, 0.85, sin(s.y * (4.0 + fi) + t * 0.8 + fi * 2.0));
  float pulse = 0.42 + 0.58 * sin((s.x + s.y) * 2.2 - t * (1.1 + fi * 0.12));
  lattice += (stripe * 0.25 + curved * 0.16) * dash * pulse * horizon * lens * (0.72 - fi * 0.08);
}

float nodes = 0.0;
for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 24.6));
  float drift = fract(seed.y + t * (0.018 + seed.x * 0.028));
  vec2 pos = vec2((seed.x - 0.5) * 1.9 + 0.08 * sin(t * 0.22 + fi), -0.82 + drift * 1.7);
  float mote = smoothstep(0.014 + seed.x * 0.018, 0.0, length(q - pos));
  nodes += mote * (1.0 - drift) * lens;
}

float fog = fbm(q * vec2(1.45, 2.2) + vec2(t * 0.025, -t * 0.035)) * lens;
v += lattice * 0.88 + nodes * 0.58 + fog * 0.16;
`],
  ['spell-circle', 'Arcane Rift', '秘術裂光', '#8fb7ff', 'A floor rift of liquid magic with rising beams, smoke, shards, and turbulent inner light.', '床に広がる液状魔力、立ち上がる光柱、煙、破片、乱流する内光。', `
vec2 q = p;
vec2 floorUv = vec2(q.x * 0.95, (q.y + 0.48) * 1.85);
float pool = length(floorUv);
float poolMask = smoothstep(1.03, 0.05, pool);
float vapor = fbm(q * 2.1 + vec2(t * 0.035, -t * 0.052));
float flowNoise = fbm(floorUv * 3.0 + vec2(-t * 0.12, t * 0.05));

float liquid = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  float a = atan(floorUv.y, floorUv.x);
  float swirl = sin(a * (2.0 + fi * 0.55) + pool * (9.0 + fi * 1.7) - t * (0.9 + fi * 0.16) + flowNoise * 2.6);
  float vein = stroke(swirl, 0.14 + fi * 0.012) * smoothstep(0.98, 0.08, pool);
  liquid += vein * (0.38 / (1.0 + fi * 0.35));
}

float rim = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float rift = 0.42 + fi * 0.14 + 0.025 * sin(t * 0.45 + fi);
  float split = stroke(pool - rift - (flowNoise - 0.5) * 0.08, 0.018 + fi * 0.004);
  float broken = smoothstep(-0.35, 0.85, sin(atan(floorUv.y, floorUv.x) * (2.0 + fi * 1.4) + t * 0.45 + fi * 1.7));
  rim += split * broken * smoothstep(1.1, 0.12, pool) * (0.72 - fi * 0.1);
}

float beams = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 91.4));
  float baseX = (seed.x - 0.5) * 0.95 + 0.08 * sin(t * 0.32 + fi);
  float lean = (seed.y - 0.5) * 0.36;
  vec2 s = q;
  s.x -= baseX + lean * smoothstep(-0.55, 0.9, s.y);
  s.x += 0.07 * sin(s.y * (3.6 + seed.x * 2.0) + t * (0.9 + seed.y));
  float column = smoothstep(0.045 + seed.x * 0.035, 0.0, abs(s.x));
  float height = smoothstep(-0.72, -0.26, q.y) * smoothstep(0.96, 0.06, q.y);
  float texture = 0.35 + 0.65 * fbm(vec2(s.x * 7.0, q.y * 2.7 - t * (0.35 + seed.y * 0.25)) + fi);
  beams += column * height * texture * (0.5 + seed.y * 0.8);
}

float smoke = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = q;
  s.x += 0.18 * sin(s.y * (1.9 + fi * 0.3) + t * (0.32 + fi * 0.08) + fi);
  float plume = smoothstep(0.34 + fi * 0.06, 0.0, abs(s.x + (fi - 2.0) * 0.16));
  plume *= smoothstep(-0.55, -0.08, q.y) * smoothstep(1.12, 0.0, q.y);
  plume *= fbm(s * vec2(2.2, 3.8) + vec2(fi, -t * 0.18));
  smoke += plume * (0.24 / (1.0 + fi * 0.25));
}

float shards = 0.0;
for (int i = 0; i < 30; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 48.2));
  float rise = fract(seed.y + t * (0.025 + seed.x * 0.04));
  vec2 pos = vec2((seed.x - 0.5) * 1.25 + sin(t * 0.25 + fi) * 0.05, -0.5 + rise * 1.25);
  vec2 g = rot(seed.x * 6.28318 + t * 0.12) * (q - pos);
  float shard = stroke(sdBox(g, vec2(0.006 + seed.x * 0.012, 0.025 + seed.y * 0.05)), 0.004);
  shards += shard * (1.0 - rise) * smoothstep(0.9, 0.05, length(pos * vec2(0.8, 1.0)));
}

float core = smoothstep(0.34, 0.0, length(floorUv / vec2(1.0, 0.56))) * (0.55 + flowNoise * 0.62);
float blast = pow(max(0.0, 1.0 - length(q * vec2(0.72, 1.15) + vec2(0.0, 0.18))), 3.2);
v += liquid * 0.82 + rim * 0.62 + beams * 0.7 + smoke * 0.58 + shards * 0.86 + core * 0.65 + blast * 0.28;
`],
  ['plasma-orb', 'Plasma Storm', 'プラズマストーム', '#22d3ee', 'An unstable ion storm with torn plasma sheets, electric filaments, and hot particle embers.', '裂けたプラズマ膜、電気フィラメント、高温粒子が暴れる不安定な電離嵐。', `
vec2 q = p;
float lens = smoothstep(1.28, 0.04, length(q * vec2(0.82, 1.06)));
float density = fbm(q * 2.0 + vec2(t * 0.06, -t * 0.04));
float density2 = fbm(rot(1.1) * q * 3.4 + vec2(-t * 0.09, t * 0.035));

float sheets = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  vec2 s = rot(-0.9 + fi * 0.24 + 0.05 * sin(t * 0.28 + fi)) * q;
  s.x += 0.16 * sin(s.y * (2.1 + fi * 0.2) + t * (0.56 + fi * 0.05) + fi);
  float lane = -0.78 + fi * 0.22 + (fbm(s * 1.7 + fi) - 0.5) * 0.28;
  float veil = smoothstep(0.18 + fi * 0.006, 0.0, abs(s.x - lane));
  float hotEdge = smoothstep(0.032, 0.0, abs(s.x - lane + sin(s.y * 5.0 + t + fi) * 0.028));
  sheets += (veil * 0.2 + hotEdge * 0.7) * lens * (0.55 + density * 0.65);
}

float filaments = 0.0;
for (int i = 0; i < 10; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 62.8));
  float ang = seed.x * 6.28318 + 0.28 * sin(t * 0.25 + fi);
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 side = vec2(-dir.y, dir.x);
  float along = dot(q, dir);
  float across = dot(q, side);
  float bolt = across + 0.09 * sin(along * (7.0 + seed.y * 5.0) - t * (1.5 + seed.x) + density2 * 2.4);
  float range = smoothstep(-0.25, 0.24, along) * smoothstep(1.15, 0.2, along);
  float broken = smoothstep(-0.45, 0.85, sin(along * (8.0 + seed.y * 7.0) + fi + t * 0.7));
  filaments += stroke(bolt, 0.012 + seed.x * 0.012) * range * broken * (0.75 + seed.y * 0.6);
}

float corona = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = q * (1.0 + fi * 0.12);
  float edge = fbm(s * (2.4 + fi * 0.6) + vec2(t * (0.03 + fi * 0.02), -t * 0.04));
  float shell = stroke(length(s * vec2(0.86, 1.12)) - (0.42 + fi * 0.12 + (edge - 0.5) * 0.12), 0.045 + fi * 0.012);
  corona += shell * (0.34 / (1.0 + fi * 0.45));
}

float embers = 0.0;
for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 18.6));
  float life = fract(seed.y + t * (0.035 + seed.x * 0.06));
  float angle = seed.x * 6.28318 + life * (1.8 + seed.y);
  vec2 pos = vec2(cos(angle), sin(angle)) * (0.08 + life * 1.06) * vec2(1.0, 0.74);
  pos += vec2(sin(t * 0.3 + fi), cos(t * 0.22 + fi)) * 0.04;
  float mote = smoothstep(0.019 + seed.x * 0.016, 0.0, length(q - pos));
  embers += mote * (1.0 - life) * (0.65 + seed.x);
}

float core = smoothstep(0.36, 0.0, length((q + vec2(0.03, -0.02)) / vec2(1.0, 0.62)));
float hot = pow(max(0.0, 1.0 - length(q * vec2(0.95, 1.45))), 4.0);
float smoke = smoothstep(0.18, 1.0, density * 0.75 + density2 * 0.6) * lens;
v += sheets * 0.75 + filaments * 0.9 + corona * 0.55 + embers * 0.72 + core * (0.35 + density * 0.32) + hot * 0.38 + smoke * 0.22;
`],
  ['thunder-veins', 'Thunder Veins', '雷脈', '#fde047', 'Branching lightning veins across a dark field.', '暗い面を走る分岐した雷脈。', `
vec2 q = p;
float lens = smoothstep(1.45, 0.02, length(q * vec2(0.86, 1.06)));
float storm = fbm(q * vec2(1.7, 2.2) + vec2(t * 0.035, -t * 0.02));

float veins = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 37.1));
  vec2 dir = normalize(vec2(cos(seed.x * 6.28318), sin(seed.x * 6.28318) * 0.72));
  vec2 side = vec2(-dir.y, dir.x);
  float along = dot(q, dir) + (seed.y - 0.5) * 0.65;
  float across = dot(q, side) + 0.1 * sin(along * (5.0 + seed.x * 6.0) - t * (1.2 + seed.y) + storm * 2.6);
  float broken = smoothstep(-0.45, 0.85, sin(along * (8.0 + seed.y * 7.0) + fi * 1.8 + t * 0.85));
  float range = smoothstep(-0.95, -0.18, along) * smoothstep(1.05, 0.18, along);
  veins += stroke(across, 0.012 + seed.x * 0.012) * broken * range * (0.55 + seed.y);
}

float chargedDust = 0.0;
for (int i = 0; i < 36; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 73.8));
  float life = fract(seed.y + t * (0.04 + seed.x * 0.06));
  vec2 pos = vec2(-1.05 + seed.x * 2.1, -0.9 + life * 1.8 + 0.08 * sin(t * 0.28 + fi));
  chargedDust += smoothstep(0.014 + seed.x * 0.014, 0.0, length(q - pos)) * (1.0 - life) * lens;
}

float fog = storm * smoothstep(1.5, 0.0, length(q * vec2(0.9, 1.0)));
v += veins * 0.96 + chargedDust * 0.62 + fog * 0.18;
`],
  ['spirit-flame', 'Spirit Flame', '霊火', '#a78bfa', 'Cool ghost flame with soft internal curls.', '内側に渦を持つ冷たい霊火。', `
vec2 q = p;
vec2 anchor = vec2(-0.08, -0.68);
vec2 rel = q - anchor;
float rise = smoothstep(-0.08, 0.12, rel.y) * smoothstep(1.68, 0.12, rel.y);
float taper = smoothstep(0.78, 0.0, abs(rel.x) / (0.18 + max(rel.y, 0.0) * 0.42));
float mist = fbm(q * vec2(1.7, 2.8) + vec2(t * 0.035, -t * 0.08));

float ribbons = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 s = rel;
  s.x += (fbm(vec2(s.y * (1.8 + fi * 0.12), fi + t * 0.06)) - 0.5) * (0.16 + s.y * 0.05);
  float lane = -0.36 + fi * 0.09 + sin(s.y * (3.0 + fi * 0.18) - t * (0.58 + fi * 0.04) + fi) * (0.05 + fi * 0.006);
  float veil = smoothstep(0.075 + fi * 0.004, 0.0, abs(s.x - lane));
  float inner = smoothstep(0.015 + fi * 0.0015, 0.0, abs(s.x - lane + sin(s.y * 7.2 + t * 0.9 + fi) * 0.016));
  float broken = smoothstep(-0.28, 0.82, sin(s.y * (4.6 + fi * 0.5) + t * 0.8 + fi * 2.0));
  ribbons += (veil * 0.18 + inner * 0.68) * rise * taper * broken * (0.72 - fi * 0.035);
}

float motes = 0.0;
for (int i = 0; i < 48; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 63.4));
  float life = fract(seed.y + t * (0.035 + seed.x * 0.07));
  vec2 pos = anchor + vec2((seed.x - 0.5) * (0.28 + life * 1.05), life * 1.58);
  pos += vec2(sin(t * 0.28 + fi), cos(t * 0.22 + seed.x * 5.0)) * 0.055;
  float spark = smoothstep(0.012 + seed.x * 0.018, 0.0, length(q - pos));
  motes += spark * smoothstep(0.0, 0.14, life) * smoothstep(1.0, 0.56, life);
}

float base = 0.0;
for (int i = 0; i < 6; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 91.8));
  vec2 a = vec2(-0.25 + fi * 0.1, 0.005 + 0.016 * sin(t * 0.6 + fi));
  vec2 b = a + vec2((seed.x - 0.5) * 0.08, 0.036 + seed.y * 0.06);
  float chip = stroke(sdSegment(rel, a, b), 0.006 + seed.x * 0.004);
  base += chip * (0.52 + seed.y * 0.48);
}
float veilFog = smoothstep(1.36, 0.04, length(q * vec2(0.88, 1.08))) * mist * rise * 0.34;
float upperGlow = pow(max(0.0, 1.0 - length(vec2(rel.x * 1.4, (rel.y - 0.62) * 0.72))), 2.6) * rise * 0.22;
v += ribbons * 1.05 + motes * 0.72 + veilFog + base * 0.08 + upperGlow;
`],
  ['glyph-rain', 'Astral Downpour', '星霊雨', '#38bdf8', 'A layered astral rainstorm with falling light trails, vapor curtains, and tiny charged fragments.', '降り注ぐ光跡、蒸気の幕、帯電した微細片が重なる星霊の雨。', `
vec2 q = p;
float depth = smoothstep(1.5, 0.02, length(q * vec2(0.86, 1.05)));
float wind = 0.12 * sin(t * 0.23) + 0.08 * fbm(q * 1.3 + vec2(t * 0.025, 0.0));
float haze = fbm(q * vec2(1.6, 2.4) + vec2(t * 0.02, -t * 0.09));

float curtains = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 s = q;
  s.x += wind * smoothstep(-1.1, 1.0, s.y);
  float lane = -0.92 + fi * 0.23 + 0.07 * sin(t * (0.16 + fi * 0.02) + fi * 1.8);
  float drift = fbm(vec2(s.y * (1.8 + fi * 0.12), fi + t * 0.08)) - 0.5;
  float veil = smoothstep(0.16 + fi * 0.006, 0.0, abs(s.x - lane - drift * 0.18));
  float filament = smoothstep(0.022, 0.0, abs(s.x - lane - drift * 0.2 + sin(s.y * 5.0 + t + fi) * 0.018));
  float verticalFade = smoothstep(-1.05, -0.4, s.y) * smoothstep(1.14, -0.2, s.y);
  curtains += (veil * 0.18 + filament * 0.74) * verticalFade * (0.35 + haze * 0.65);
}

float streaks = 0.0;
for (int i = 0; i < 42; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 27.9));
  float speed = 0.34 + seed.y * 0.72;
  float life = fract(seed.y + t * speed);
  float x = (seed.x - 0.5) * 2.05 + 0.18 * sin(t * 0.18 + fi);
  float y = 1.25 - life * 2.65;
  vec2 head = vec2(x + wind * (1.0 - life), y);
  vec2 tail = head + vec2(-0.06 - seed.x * 0.12, 0.18 + seed.y * 0.3);
  float trail = stroke(sdSegment(q, head, tail), 0.006 + seed.x * 0.01);
  float headGlow = smoothstep(0.03 + seed.x * 0.025, 0.0, length(q - head));
  float fade = smoothstep(0.0, 0.18, life) * smoothstep(1.0, 0.72, life);
  float depthLayer = 0.34 + 0.66 * smoothstep(-0.2, 1.2, seed.y + 0.2 * sin(fi));
  streaks += (trail * 0.58 + headGlow * 0.48) * fade * depthLayer;
}

float chargedDust = 0.0;
for (int i = 0; i < 34; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 78.1));
  float fall = fract(seed.y + t * (0.055 + seed.x * 0.09));
  vec2 pos = vec2((seed.x - 0.5) * 2.0 + 0.1 * sin(t * 0.35 + fi), 1.12 - fall * 2.3);
  vec2 local = rot(-0.4 + seed.x * 0.8) * (q - pos);
  float dash = stroke(sdSegment(local, vec2(-0.025, 0.0), vec2(0.025 + seed.y * 0.05, 0.0)), 0.004 + seed.x * 0.004);
  float spark = smoothstep(0.017 + seed.x * 0.018, 0.0, length(local));
  chargedDust += (dash * 0.7 + spark * 0.36) * (1.0 - fall) * depth;
}

float lowMist = smoothstep(0.45, -1.05, q.y) * smoothstep(1.35, 0.0, abs(q.x));
float glowPocket = smoothstep(0.46, 0.0, length((q + vec2(0.02, 0.42)) / vec2(1.15, 0.34)));
v += curtains * 0.75 + streaks * 0.86 + chargedDust * 0.7 + lowMist * haze * 0.25 + glowPocket * (0.28 + haze * 0.3);
`],
  ['pulse-gate', 'Phase Breach', '位相裂孔', '#f0abfc', 'A torn dimensional breach with refracted light membranes, side flares, and drifting charged debris.', '裂けた次元の穴、屈折する光膜、横へ漏れるフレア、漂う帯電破片。', `
vec2 q = p;
float depth = smoothstep(1.45, 0.03, length(q * vec2(0.72, 1.05)));
float n = fbm(q * 2.0 + vec2(t * 0.035, -t * 0.045));
float n2 = fbm(rot(0.8) * q * 3.6 + vec2(-t * 0.07, t * 0.03));

float tear = 0.0;
float membrane = 0.0;
for (int i = 0; i < 7; i++) {
  float fi = float(i);
  vec2 s = q;
  s.x += 0.12 * sin(s.y * (2.4 + fi * 0.28) + t * (0.45 + fi * 0.06) + fi);
  s.x += (fbm(vec2(s.y * (1.8 + fi * 0.12), fi + t * 0.08)) - 0.5) * (0.22 + fi * 0.02);
  float width = 0.055 + fi * 0.035 + 0.025 * sin(t * 0.5 + fi);
  float edge = smoothstep(0.024 + fi * 0.004, 0.0, abs(abs(s.x) - width));
  float skin = smoothstep(width + 0.26, width, abs(s.x));
  float height = smoothstep(-1.05, -0.45, s.y) * smoothstep(1.1, -0.02, s.y);
  tear += edge * height * (0.82 - fi * 0.08);
  membrane += skin * height * (0.16 + n * 0.22) * (1.0 - fi * 0.08);
}

float flares = 0.0;
for (int i = 0; i < 9; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 59.2));
  float y = -0.78 + seed.y * 1.56 + 0.08 * sin(t * 0.4 + fi);
  float side = mix(-1.0, 1.0, step(0.5, seed.x));
  vec2 origin = vec2(side * (0.08 + seed.x * 0.08), y);
  vec2 tip = origin + vec2(side * (0.42 + seed.y * 0.55), 0.07 * sin(t + fi));
  float ray = stroke(sdSegment(q, origin, tip), 0.01 + seed.x * 0.012);
  float broken = smoothstep(-0.35, 0.85, sin(dot(q - origin, normalize(tip - origin)) * 12.0 + t * 1.2 + fi));
  flares += ray * broken * smoothstep(1.2, 0.05, length(origin)) * (0.55 + seed.y);
}

float debris = 0.0;
for (int i = 0; i < 30; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 104.8));
  float life = fract(seed.y + t * (0.035 + seed.x * 0.055));
  float side = mix(-1.0, 1.0, step(0.5, hash11(fi + 4.0)));
  vec2 pos = vec2(side * (0.12 + life * (0.85 + seed.x * 0.25)), -0.82 + seed.x * 1.7 + 0.08 * sin(t * 0.3 + fi));
  vec2 local = rot(seed.x * 6.28318 + t * 0.18) * (q - pos);
  float shard = stroke(sdBox(local, vec2(0.006 + seed.x * 0.012, 0.022 + seed.y * 0.05)), 0.004);
  float spark = smoothstep(0.016 + seed.x * 0.018, 0.0, length(local));
  debris += (shard * 0.76 + spark * 0.38) * (1.0 - life) * depth;
}

float innerFlow = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 s = q * vec2(2.1 + fi * 0.35, 1.3 + fi * 0.2);
  float vein = stroke(fbm(s + vec2(t * (0.08 + fi * 0.02), -t * 0.06)) - (0.5 + 0.04 * sin(t + fi)), 0.026);
  innerFlow += vein * smoothstep(0.44, 0.0, abs(q.x)) * smoothstep(1.02, -0.05, abs(q.y)) * (0.28 / (1.0 + fi));
}

float slit = abs(q.x + 0.035 * sin(q.y * 4.0 + t) + (n2 - 0.5) * 0.035);
float slitHeight = smoothstep(-1.04, -0.42, q.y) * smoothstep(1.12, 0.0, q.y);
float core = smoothstep(0.045, 0.0, slit) * slitHeight * (0.38 + n * 0.38);
float hotRim = smoothstep(0.14, 0.035, slit) * smoothstep(0.02, 0.09, slit) * slitHeight;
float bloom = pow(max(0.0, 1.0 - length(q * vec2(1.25, 0.78))), 2.8);
float smoke = smoothstep(0.24, 1.0, n * 0.7 + n2 * 0.62) * depth;
v += tear * 0.42 + membrane * 0.36 + flares * 0.48 + debris * 0.52 + innerFlow * 0.5 + core * 0.08 + hotRim * 0.32 + bloom * 0.07 + smoke * 0.14;
`],
  ['ether-bloom', 'Eidolon Veil', '幻光ヴェール', '#f9a8d4', 'A spectral ether veil with layered silk light, drifting motes, and fine living threads.', '絹のような光膜、漂う粒子、細い生きた光脈が重なる幽玄なエーテル。', `
vec2 q = p;
float depth = smoothstep(1.55, 0.02, length(q * vec2(0.9, 1.08)));
float haze = fbm(q * vec2(1.4, 2.0) + vec2(t * 0.028, -t * 0.038));
float haze2 = fbm(rot(-0.7) * q * 2.8 + vec2(-t * 0.055, t * 0.025));

float silk = 0.0;
for (int i = 0; i < 8; i++) {
  float fi = float(i);
  vec2 s = rot(-0.24 + fi * 0.035 + 0.025 * sin(t * 0.25 + fi)) * q;
  s.y += 0.11 * sin(s.x * (2.3 + fi * 0.22) - t * (0.38 + fi * 0.04) + fi);
  s.y += (fbm(s * 1.8 + vec2(fi, -t * 0.05)) - 0.5) * (0.24 + fi * 0.018);
  float lane = -0.72 + fi * 0.18;
  float veil = smoothstep(0.2 + fi * 0.01, 0.0, abs(s.y - lane));
  float brightEdge = smoothstep(0.025, 0.0, abs(s.y - lane + sin(s.x * 5.5 + t + fi) * 0.018));
  float taper = smoothstep(-1.24, -0.2, s.x) * smoothstep(1.34, 0.04, s.x);
  silk += (veil * 0.2 + brightEdge * 0.62) * taper * (0.42 + haze * 0.58) * (1.0 - fi * 0.045);
}

float threads = 0.0;
for (int i = 0; i < 12; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 86.4));
  vec2 s = rot(-0.58 + seed.x * 0.34) * q;
  float y = -0.92 + seed.y * 1.72 + 0.08 * sin(t * 0.34 + fi);
  float thread = s.y - y + 0.045 * sin(s.x * (6.0 + seed.x * 5.0) - t * (0.9 + seed.y) + fi);
  float segment = smoothstep(-1.1, -0.25, s.x) * smoothstep(1.15, 0.1, s.x);
  float pulse = smoothstep(-0.25, 0.8, sin(s.x * (7.0 + seed.y * 6.0) + t * 1.1 + fi));
  threads += stroke(thread, 0.006 + seed.x * 0.008) * segment * pulse * (0.35 + seed.y * 0.5);
}

float motes = 0.0;
for (int i = 0; i < 38; i++) {
  float fi = float(i);
  vec2 seed = hash22(vec2(fi, 16.2));
  float life = fract(seed.y + t * (0.026 + seed.x * 0.052));
  vec2 pos = vec2(
    -1.05 + seed.x * 2.1 + 0.08 * sin(t * 0.32 + fi),
    -0.82 + life * 1.72 + 0.06 * sin(t * 0.22 + seed.x * 6.0)
  );
  float spark = smoothstep(0.018 + seed.x * 0.018, 0.0, length(q - pos));
  vec2 dash = rot(seed.x * 6.28318) * (q - pos);
  float shard = stroke(sdSegment(dash, vec2(-0.022, 0.0), vec2(0.026 + seed.y * 0.052, 0.0)), 0.004);
  motes += (spark * 0.42 + shard * 0.58) * (1.0 - life) * depth;
}

float underglow = smoothstep(0.42, 0.0, length((q + vec2(-0.05, 0.36)) / vec2(1.05, 0.34))) * (0.32 + haze2 * 0.48);
float smoke = smoothstep(0.28, 1.0, haze * 0.65 + haze2 * 0.62) * depth;
v += silk * 0.82 + threads * 0.74 + motes * 0.66 + underglow * 0.38 + smoke * 0.18;
`],
].map(([id, title, titleJa, accentColor, description, descriptionJa, field]) => {
  const recipe: ShaderRecipe = {
    id,
    title,
    titleJa,
    categoryId: 'energy-magic',
    description,
    descriptionJa,
    accentColor,
    tags: ['energy', 'magic', id],
    field,
  }

  if (id === 'emerald-eruption') {
    return makeEffect({
      ...recipe,
      warp: `
float eruptionPull = smoothstep(1.55, 0.04, length(p - vec2(0.12, -0.62)));
p += 0.045 * eruptionPull * vec2(
  fbm(p * vec2(2.2, 3.0) + vec2(t * 0.08, 0.0)) - 0.5,
  fbm(p * vec2(3.0, 1.8) + vec2(0.0, -t * 0.12)) - 0.5
);
`,
      color: `vec3(0.0, 0.035, 0.018) + vec3(0.0, 0.3, 0.12) * shade * 0.3 + uPrimary * shade * 0.72 + vec3(0.72, 1.0, 0.86) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.62`,
      post: `
vec2 source = vec2(0.12, -0.62);
vec2 blastDir = normalize(vec2(0.12, 1.0));
vec2 sideDir = vec2(-blastDir.y, blastDir.x);
vec2 rel = uv - source;
float along = dot(rel, blastDir);
float across = dot(rel, sideDir);
float plume = smoothstep(-0.06, 0.18, along) * smoothstep(1.76, 0.16, along) * smoothstep(0.16 + along * 0.62, 0.0, abs(across));
float greenFog = fbm(uv * vec2(1.25, 2.0) + vec2(iTime * 0.02, -iTime * 0.038));
float clearPocket = smoothstep(1.45, 0.0, length(uv * vec2(0.86, 1.08)));
float baseSheen = smoothstep(0.36, 0.0, length((uv - source) / vec2(0.86, 0.3)));
color += vec3(0.0, 0.2, 0.1) * greenFog * plume * 0.34;
color += vec3(0.22, 0.85, 0.48) * baseSheen * 0.12;
color += vec3(0.76, 1.0, 0.9) * pow(clamp(shade, 0.0, 1.0), 2.55) * 0.22;
color += vec3(0.16, 0.36, 0.28) * clearPocket * greenFog * 0.12;
color *= 1.0 - 0.3 * smoothstep(0.68, 1.86, length(uv));
`,
      intensity: 1.18,
      motion: 1.0,
      detail: 2.9,
    })
  }

  if (id === 'aurora-sigil') {
    return makeEffect({
      ...recipe,
      warp: `
float veilWarp = smoothstep(1.55, 0.02, length(p * vec2(0.86, 1.06)));
p.x += 0.052 * sin(p.y * 2.6 + t * 0.34 + fbm(p * 1.8)) * veilWarp;
p.y += 0.026 * sin(p.x * 3.8 - t * 0.22) * veilWarp;
`,
      color: `vec3(0.0, 0.04, 0.045) + vec3(0.0, 0.34, 0.2) * shade * 0.24 + uPrimary * shade * 0.52 + vec3(0.58, 1.0, 0.92) * pow(clamp(shade, 0.0, 1.0), 1.9) * 0.44 + vec3(0.34, 0.58, 1.0) * pow(clamp(shade, 0.0, 1.0), 0.78) * 0.14`,
      post: `
float veilFog = fbm(uv * vec2(1.2, 1.9) + vec2(iTime * 0.016, -iTime * 0.03));
float pocket = smoothstep(1.6, 0.0, length(uv * vec2(0.9, 1.08)));
color += vec3(0.0, 0.2, 0.16) * veilFog * pocket * 0.24;
color += vec3(0.48, 0.9, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.12;
color *= 1.0 - 0.28 * smoothstep(0.7, 1.85, length(uv));
`,
      intensity: 1.2,
      motion: 0.84,
      detail: 2.75,
    })
  }

  if (id === 'crystal-aura') {
    return makeEffect({
      ...recipe,
      warp: `
p += 0.045 * vec2(
  sin(p.y * 2.7 + t * 0.42 + fbm(p * 2.0)),
  cos(p.x * 2.3 - t * 0.34 + fbm(p * 2.8))
);
p = rot(0.02 * sin(t * 0.22)) * p;
`,
      color: `vec3(0.0, 0.025, 0.055) * shade * 0.32 + uPrimary * shade * 0.72 + vec3(0.5, 1.0, 0.96) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.58 + vec3(0.18, 0.42, 1.0) * pow(clamp(shade, 0.0, 1.0), 0.8) * 0.18`,
      post: `
float coldFog = fbm(uv * 1.65 + vec2(iTime * 0.025, -iTime * 0.018));
float bloomPocket = smoothstep(1.35, 0.0, length(uv * vec2(0.82, 1.08)));
color += vec3(0.02, 0.18, 0.32) * coldFog * bloomPocket * 0.2;
color += vec3(0.55, 0.95, 1.0) * smoothstep(0.992, 1.0, hash21(floor(uv * 95.0) + floor(iTime * 2.0))) * bloomPocket;
color *= 1.0 - 0.34 * smoothstep(0.55, 1.65, length(uv));
`,
      intensity: 1.28,
      motion: 0.82,
      detail: 2.85,
    })
  }

  if (id === 'mana-lattice') {
    return makeEffect({
      ...recipe,
      warp: `
float latticeWarp = smoothstep(1.5, 0.02, length(p * vec2(0.9, 1.05)));
p.x += 0.04 * sin(p.y * 3.0 + t * 0.28 + fbm(p * 2.0)) * latticeWarp;
p.y += 0.02 * sin(p.x * 4.2 - t * 0.22) * latticeWarp;
`,
      color: `vec3(0.0, 0.035, 0.075) + vec3(0.02, 0.2, 0.42) * shade * 0.24 + uPrimary * shade * 0.55 + vec3(0.62, 0.95, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.25) * 0.42`,
      post: `
float clearFog = fbm(uv * vec2(1.35, 2.0) + vec2(iTime * 0.018, -iTime * 0.026));
float pocket = smoothstep(1.58, 0.0, length(uv * vec2(0.88, 1.08)));
color += vec3(0.0, 0.13, 0.25) * clearFog * pocket * 0.2;
color += vec3(0.52, 0.88, 1.0) * smoothstep(0.995, 1.0, hash21(floor(uv * 112.0) + floor(iTime * 2.0))) * pocket * 0.42;
color *= 1.0 - 0.32 * smoothstep(0.62, 1.76, length(uv));
`,
      intensity: 1.18,
      motion: 0.86,
      detail: 2.75,
    })
  }

  if (id === 'spell-circle') {
    return makeEffect({
      ...recipe,
      warp: `
float swirl = smoothstep(1.05, 0.02, length(p));
p = rot(0.08 * swirl * sin(t * 0.32)) * p;
p += 0.035 * swirl * vec2(
  sin(p.y * 4.0 + t * 0.55 + fbm(p * 2.5)),
  cos(p.x * 3.4 - t * 0.45 + fbm(p * 3.0))
);
`,
      color: `vec3(0.035, 0.0, 0.08) * shade * 0.34 + uPrimary * shade * 0.78 + vec3(0.25, 0.75, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.7) * 0.32 + vec3(1.0, 0.78, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.28`,
      post: `
float fog = fbm(uv * vec2(1.6, 2.4) + vec2(iTime * 0.02, -iTime * 0.028));
float pocket = smoothstep(1.45, 0.0, length(uv * vec2(0.9, 1.1)));
color += vec3(0.07, 0.02, 0.16) * fog * pocket * 0.25;
color += vec3(0.38, 0.75, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.16;
color *= 1.0 - 0.32 * smoothstep(0.6, 1.7, length(uv));
`,
      intensity: 1.22,
      motion: 0.9,
      detail: 2.65,
    })
  }

  if (id === 'plasma-orb') {
    return makeEffect({
      ...recipe,
      warp: `
float pull = smoothstep(1.35, 0.02, length(p * vec2(0.82, 1.05)));
p += 0.055 * pull * vec2(
  sin(p.y * 3.1 + t * 0.54 + fbm(p * 2.2)),
  cos(p.x * 2.7 - t * 0.46 + fbm(p * 2.9))
);
p = rot(0.035 * sin(t * 0.24)) * p;
`,
      color: `vec3(0.0, 0.055, 0.075) * shade * 0.32 + uPrimary * shade * 0.72 + vec3(0.68, 1.0, 0.96) * pow(clamp(shade, 0.0, 1.0), 2.35) * 0.55 + vec3(0.05, 0.32, 0.55) * pow(clamp(shade, 0.0, 1.0), 0.65) * 0.18`,
      post: `
float ionFog = fbm(uv * vec2(1.5, 2.0) + vec2(iTime * 0.028, -iTime * 0.018));
float pocket = smoothstep(1.55, 0.0, length(uv * vec2(0.86, 1.08)));
color += vec3(0.0, 0.23, 0.28) * ionFog * pocket * 0.22;
color += vec3(0.55, 1.0, 0.98) * smoothstep(0.994, 1.0, hash21(floor(uv * 105.0) + floor(iTime * 3.0))) * pocket;
color *= 1.0 - 0.34 * smoothstep(0.6, 1.68, length(uv));
`,
      intensity: 1.3,
      motion: 0.95,
      detail: 2.9,
    })
  }

  if (id === 'thunder-veins') {
    return makeEffect({
      ...recipe,
      warp: `
float stormWarp = smoothstep(1.55, 0.02, length(p * vec2(0.86, 1.08)));
p += 0.04 * stormWarp * vec2(
  sin(p.y * 3.4 + t * 0.42 + fbm(p * 2.2)),
  cos(p.x * 2.8 - t * 0.34 + fbm(p * 2.6))
);
`,
      color: `vec3(0.05, 0.032, 0.0) + vec3(0.42, 0.22, 0.02) * shade * 0.24 + uPrimary * shade * 0.55 + vec3(1.0, 0.96, 0.58) * pow(clamp(shade, 0.0, 1.0), 2.3) * 0.5 + vec3(0.55, 0.85, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.12`,
      post: `
float goldFog = fbm(uv * vec2(1.25, 2.1) + vec2(iTime * 0.02, -iTime * 0.032));
float pocket = smoothstep(1.58, 0.0, length(uv * vec2(0.9, 1.08)));
color += vec3(0.16, 0.1, 0.0) * goldFog * pocket * 0.24;
color += vec3(0.95, 0.86, 0.42) * smoothstep(0.995, 1.0, hash21(floor(uv * 118.0) + floor(iTime * 3.0))) * pocket * 0.36;
color *= 1.0 - 0.32 * smoothstep(0.62, 1.78, length(uv));
`,
      intensity: 1.2,
      motion: 0.94,
      detail: 2.85,
    })
  }

  if (id === 'spirit-flame') {
    return makeEffect({
      ...recipe,
      warp: `
float flameWarp = smoothstep(1.45, 0.02, length(p * vec2(0.9, 1.1)));
p.x += 0.055 * sin(p.y * 3.1 + t * 0.42 + fbm(p * 2.0)) * flameWarp;
p.y += 0.03 * sin(p.x * 4.5 - t * 0.3 + fbm(p * 2.4)) * flameWarp;
`,
      color: `vec3(0.045, 0.015, 0.08) + vec3(0.18, 0.1, 0.34) * shade * 0.26 + uPrimary * shade * 0.5 + vec3(0.64, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.85) * 0.36 + vec3(1.0, 0.78, 0.98) * pow(clamp(shade, 0.0, 1.0), 2.8) * 0.18`,
      post: `
float violetFog = fbm(uv * vec2(1.35, 2.25) + vec2(iTime * 0.018, -iTime * 0.038));
float pocket = smoothstep(1.58, 0.0, length(uv * vec2(0.9, 1.08)));
color += vec3(0.12, 0.05, 0.22) * violetFog * pocket * 0.24;
color += vec3(0.54, 0.82, 1.0) * smoothstep(0.995, 1.0, hash21(floor(uv * vec2(100.0, 128.0)) + floor(iTime * 2.0))) * pocket * 0.42;
color *= 1.0 - 0.3 * smoothstep(0.66, 1.8, length(uv));
`,
      intensity: 1.16,
      motion: 0.88,
      detail: 2.8,
    })
  }

  if (id === 'glyph-rain') {
    return makeEffect({
      ...recipe,
      warp: `
float depthWarp = smoothstep(1.45, 0.02, length(p * vec2(0.86, 1.06)));
p.x += 0.035 * sin(p.y * 3.0 + t * 0.38) * depthWarp;
p.y += 0.025 * fbm(p * vec2(2.0, 3.0) + vec2(0.0, -t * 0.2)) * depthWarp;
`,
      color: `vec3(0.0, 0.055, 0.095) * shade * 0.3 + uPrimary * shade * 0.66 + vec3(0.66, 1.0, 0.95) * pow(clamp(shade, 0.0, 1.0), 2.45) * 0.48 + vec3(0.04, 0.24, 0.5) * pow(clamp(shade, 0.0, 1.0), 0.72) * 0.16`,
      post: `
float rainFog = fbm(uv * vec2(1.2, 2.8) + vec2(iTime * 0.018, -iTime * 0.07));
float pocket = smoothstep(1.55, 0.0, length(uv * vec2(0.9, 1.08)));
color += vec3(0.0, 0.14, 0.22) * rainFog * pocket * 0.26;
color += vec3(0.44, 0.9, 1.0) * smoothstep(0.995, 1.0, hash21(floor(uv * vec2(95.0, 140.0)) + floor(iTime * 5.0))) * pocket;
color *= 1.0 - 0.36 * smoothstep(0.58, 1.7, length(uv));
`,
      intensity: 1.26,
      motion: 1.05,
      detail: 2.9,
    })
  }

  if (id === 'pulse-gate') {
    return makeEffect({
      ...recipe,
      warp: `
float breach = smoothstep(1.25, 0.0, length(p * vec2(0.76, 1.08)));
p.x += 0.05 * sin(p.y * 3.6 + t * 0.5 + fbm(p * 2.2)) * breach;
p.y += 0.025 * sin(p.x * 5.0 - t * 0.36) * breach;
`,
      color: `vec3(0.05, 0.0, 0.095) * shade * 0.32 + uPrimary * shade * 0.5 + vec3(0.5, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.9) * 0.22 + vec3(1.0, 0.68, 0.95) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.12`,
      post: `
float breachFog = fbm(uv * vec2(1.5, 2.2) + vec2(iTime * 0.018, -iTime * 0.026));
float pocket = smoothstep(1.45, 0.0, length(uv * vec2(0.78, 1.05)));
color += vec3(0.08, 0.02, 0.17) * breachFog * pocket * 0.28;
float centerVoid = smoothstep(0.19, 0.0, abs(uv.x + 0.03 * sin(uv.y * 4.0 + iTime * 0.6))) * smoothstep(1.05, 0.0, abs(uv.y));
color = mix(color, vec3(0.018, 0.002, 0.04), centerVoid * 0.5);
color += vec3(0.55, 0.86, 1.0) * smoothstep(0.995, 1.0, hash21(floor(uv * 118.0) + floor(iTime * 3.0))) * pocket * 0.62;
color *= 1.0 - 0.35 * smoothstep(0.6, 1.72, length(uv));
`,
      intensity: 0.9,
      motion: 0.88,
      detail: 2.75,
    })
  }

  if (id === 'ether-bloom') {
    return makeEffect({
      ...recipe,
      warp: `
float veilWarp = smoothstep(1.5, 0.02, length(p * vec2(0.92, 1.08)));
p.x += 0.04 * sin(p.y * 2.8 + t * 0.34 + fbm(p * 2.0)) * veilWarp;
p.y += 0.026 * sin(p.x * 4.0 - t * 0.28 + fbm(p * 2.4)) * veilWarp;
`,
      color: `vec3(0.055, 0.006, 0.072) * shade * 0.34 + uPrimary * shade * 0.48 + vec3(0.56, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 1.85) * 0.26 + vec3(1.0, 0.78, 0.94) * pow(clamp(shade, 0.0, 1.0), 2.9) * 0.12`,
      post: `
float veilFog = fbm(uv * vec2(1.25, 2.05) + vec2(iTime * 0.018, -iTime * 0.026));
float pocket = smoothstep(1.55, 0.0, length(uv * vec2(0.9, 1.08)));
color += vec3(0.1, 0.025, 0.13) * veilFog * pocket * 0.24;
color += vec3(0.48, 0.84, 1.0) * smoothstep(0.995, 1.0, hash21(floor(uv * vec2(115.0, 92.0)) + floor(iTime * 2.0))) * pocket * 0.55;
color *= 1.0 - 0.36 * smoothstep(0.58, 1.72, length(uv));
`,
      intensity: 1.02,
      motion: 0.72,
      detail: 2.85,
    })
  }

  return makeEffect(recipe)
})
