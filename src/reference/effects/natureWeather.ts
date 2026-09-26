import { makeEffect, type ShaderRecipe } from './glsl'

const natureWeatherRecipes = [
  [
    'rain-streaks',
    'Rain Streaks',
    '雨筋',
    '#93c5fd',
    'Layered storm rain with glassy droplets, backlit mist, and foreground depth.',
    '手前と奥で速度の違う雨、濡れたガラスの雫、逆光の霞が重なる嵐雨。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.18, 1.88, length(q * vec2(0.72, 1.0)));
vec2 r = rot(-0.28) * q;
vec2 g1 = r * vec2(10.0, 3.2) + vec2(0.0, t * 1.35);
vec2 f1 = fract(g1) - 0.5;
float h1 = hash21(floor(g1));
float rain1 = stroke(f1.x + (h1 - 0.5) * 0.46, 0.032) * smoothstep(0.48, -0.12, f1.y) * step(0.24, h1);
vec2 g2 = r * vec2(17.0, 5.0) + vec2(12.0, t * 1.9);
vec2 f2 = fract(g2) - 0.5;
float h2 = hash21(floor(g2));
float rain2 = stroke(f2.x + (h2 - 0.5) * 0.38, 0.022) * smoothstep(0.44, -0.1, f2.y) * step(0.42, h2);
vec2 dg = q * vec2(5.4, 3.4) + vec2(0.0, t * 0.08);
vec2 df = fract(dg) - 0.5;
float dh = hash21(floor(dg));
float drops = stroke(length(df / vec2(0.5, 0.75)) - 0.16, 0.035) * step(0.74, dh);
float mist = noise(q * vec2(1.0, 1.8) + vec2(t * 0.02, -t * 0.05));
float backlight = glow(length((q - vec2(-0.12, 0.08)) / vec2(1.25, 0.78)), 0.92) * depth;
v += rain1 * 1.38 + rain2 * 1.08 + drops * 0.85 + mist * depth * 0.58 + backlight * 0.78 + depth * 0.18;
v *= 0.38;
`,
  ],
  [
    'snow-field',
    'Snow Field',
    '雪原',
    '#e0f2fe',
    'A deep snow squall with translucent flakes, blue fog, and soft ground glow.',
    '透ける雪片、青い奥行きの霧、柔らかな雪面光を持つ吹雪。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.16, 1.85, length(q * vec2(0.74, 1.0)));
vec2 g1 = q * 5.0 + vec2(sin(t * 0.15 + q.y * 2.0) * 0.28, t * 0.18);
vec2 f1 = fract(g1) - 0.5 - (hash22(floor(g1)) - 0.5) * 0.36;
float h1 = hash21(floor(g1));
float snow1 = (smoothstep(0.14, 0.0, length(f1)) + smoothstep(0.32, 0.0, length(f1)) * 0.12) * step(0.22, h1);
vec2 g2 = q * 10.0 + vec2(sin(t * 0.22 + q.y) * 0.42, t * 0.32 + 8.0);
vec2 f2 = fract(g2) - 0.5 - (hash22(floor(g2)) - 0.5) * 0.28;
float h2 = hash21(floor(g2));
float snow2 = (smoothstep(0.11, 0.0, length(f2)) + smoothstep(0.24, 0.0, length(f2)) * 0.08) * step(0.38, h2);
float drift = lineGlow(q.y + 0.42 + 0.13 * sin(q.x * 1.8 + t * 0.25), 0.11);
drift += lineGlow(q.y - 0.05 + 0.1 * sin(q.x * 2.4 + t * 0.32), 0.13) * 0.72;
float lift = glow(length((q - vec2(0.0, -0.18)) / vec2(1.4, 0.78)), 0.72) * depth;
float ground = smoothstep(-1.05, -0.48, q.y) * (1.0 - smoothstep(0.25, 1.4, abs(q.x)));
float blueDepth = noise(q * 1.5 + t * 0.02) * depth;
v += snow1 * 1.12 + snow2 * 0.96 + drift * 0.86 + lift * 0.28 + ground * 0.12 + blueDepth * 0.14 + depth * 0.05;
v *= 0.54;
`,
  ],
  [
    'leaf-swarm',
    'Leaf Swarm',
    '葉の群れ',
    '#84cc16',
    'Foreground leaves tumbling through luminous wind ribbons and forest haze.',
    '光る風のリボンの中を、奥行き違いの葉が舞う森の突風。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.18, 1.86, length(q * vec2(0.8, 1.0)));
vec2 w = rot(-0.23) * q;
w.x += t * 0.22;
float ribbons = lineGlow(w.y + 0.44 + 0.16 * sin(w.x * 1.9 + t * 0.35), 0.13);
ribbons += lineGlow(w.y - 0.05 + 0.13 * sin(w.x * 2.2 + t * 0.45), 0.14) * 0.86;
ribbons += lineGlow(w.y - 0.46 + 0.12 * sin(w.x * 1.6 + t * 0.28), 0.16) * 0.72;
vec2 g = q * vec2(5.8, 4.3) + vec2(t * 0.34, sin(t * 0.18) * 0.25);
vec2 id = floor(g);
vec2 f = fract(g) - 0.5 - (hash22(id) - 0.5) * 0.34;
float h = hash21(id);
vec2 leaf = rot(t * 0.75 + h * 6.28) * (f / vec2(0.46, 0.18));
float body = 1.0 - smoothstep(0.55, 1.0, length(leaf / vec2(1.12, 0.48)));
float vein = lineGlow(leaf.y, 0.04) * (1.0 - smoothstep(0.04, 0.82, abs(leaf.x)));
float leaves = max(body * 0.92, vein * 0.5) * step(0.08, h);
float canopyGlow = glow(length((q - vec2(0.12, 0.05)) / vec2(1.22, 0.76)), 0.78) * depth;
float sunWash = glow(length((q - vec2(-0.24, 0.16)) / vec2(1.45, 0.92)), 0.82) * depth;
float airGrain = noise(q * 1.2 + vec2(t * 0.018, -t * 0.016)) * depth;
v += ribbons * 1.58 + leaves * 1.32 + canopyGlow * 0.34 + sunWash * 0.18 + airGrain * 0.2 + depth * 0.08;
v *= 0.46;
`,
  ],
  [
    'pollen-glow',
    'Pollen Glow',
    '花粉光',
    '#fde047',
    'Golden pollen drifting through transparent sun haze and tiny prism motes.',
    '透明な陽光の霞を漂う金色の花粉と、小さなプリズム粒。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.18, 1.86, length(q * vec2(0.78, 1.0)));
vec2 dir = normalize(vec2(0.48, -1.0));
vec2 side = vec2(-dir.y, dir.x);
float along = dot(q, dir);
float beams = lineGlow(dot(q, side) - 0.58 + 0.05 * sin(t * 0.14), 0.14);
beams += lineGlow(dot(q, side) - 0.2 + 0.04 * sin(t * 0.12 + 2.0), 0.18) * 0.72;
beams += lineGlow(dot(q, side) + 0.28 + 0.06 * sin(t * 0.1 + 4.0), 0.22) * 0.52;
beams *= smoothstep(-1.2, -0.18, along) * (1.0 - smoothstep(0.28, 1.18, along));
vec2 g = q * 8.2 + vec2(0.2 * sin(t * 0.12), t * 0.12);
vec2 id = floor(g);
vec2 f = fract(g) - 0.5 - (hash22(id) - 0.5) * 0.36;
float h = hash21(id);
float twinkle = 0.65 + 0.35 * sin(t * (0.8 + h) + h * 20.0);
float motes = (smoothstep(0.1, 0.0, length(f)) + smoothstep(0.26, 0.0, length(f)) * 0.12) * step(0.36, h) * twinkle;
float warmLift = glow(length((q - vec2(-0.28, 0.08)) / vec2(1.35, 0.84)), 0.72) * depth;
float prismAir = noise(q * 1.3 + vec2(t * 0.012, -t * 0.014)) * depth;
v += beams * 1.18 + motes * 1.42 + warmLift * 0.24 + prismAir * 0.18 + depth * 0.06;
v *= 0.58;
`,
  ],
  [
    'cloud-shelf',
    'Cloud Shelf',
    '雲棚',
    '#cbd5e1',
    'A towering layered cloud shelf with rolling billows and electric inner glow.',
    'うねる雲塊、層状の棚雲、内側の光が重なる大きな雲壁。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.2, 1.9, length(q * vec2(0.78, 1.0)));
float n = noise(q * vec2(1.15, 1.9) + vec2(t * 0.018, -t * 0.028));
float billow = glow(length((q - vec2(-0.78, -0.08)) / vec2(0.58, 0.32)), 0.86);
billow += glow(length((q - vec2(-0.18, -0.02)) / vec2(0.62, 0.34)), 0.86) * 1.1;
billow += glow(length((q - vec2(0.52, -0.12)) / vec2(0.72, 0.38)), 0.86) * 0.95;
float shelf = lineGlow(q.y + 0.22 + 0.12 * sin(q.x * 2.0 + n * 2.4), 0.15);
vec2 r = rot(-0.18) * q;
vec2 g = r * vec2(12.0, 2.4) + vec2(0.0, t * 0.8);
vec2 f = fract(g) - 0.5;
float rain = stroke(f.x, 0.022) * smoothstep(0.45, -0.1, f.y) * step(0.56, hash21(floor(g)));
float wall = glow(length((q - vec2(0.0, -0.04)) / vec2(1.42, 0.58)), 0.78);
float crown = glow(length((q - vec2(0.08, 0.22)) / vec2(1.55, 0.38)), 0.72) * depth;
float undercut = smoothstep(0.28, -0.18, q.y + 0.32 + 0.12 * sin(q.x * 2.0 + n * 2.0));
float pocket = glow(length((q - vec2(0.22, -0.16)) / vec2(0.72, 0.34)), 0.5);
float strata = lineGlow(q.y + 0.02 + 0.06 * sin(q.x * 3.2 + n * 2.4), 0.06);
strata += lineGlow(q.y + 0.42 + 0.08 * sin(q.x * 2.4 + n * 2.0), 0.08) * 0.54;
v += billow * 0.5 + shelf * 0.76 + strata * 0.42 + wall * 0.14 + crown * 0.06 + rain * 0.58 + n * depth * 0.14 + undercut * 0.12 + pocket * 0.12;
v *= 0.56;
`,
  ],
  [
    'lightning-sheet',
    'Storm Filaments',
    '嵐光フィラメント',
    '#dbeafe',
    'Layered storm filaments branching through rain and backlit cloud vapor.',
    '雨と雲の奥で枝分かれする、面状の嵐光フィラメント。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.18, 1.88, length(q * vec2(0.82, 1.0)));
float cloud = noise(q * vec2(1.0, 1.8) + vec2(t * 0.02, -t * 0.048)) * depth;
float flash = pow(0.55 + 0.45 * sin(t * 2.0 + cloud * 4.0), 5.0);
float yMask = smoothstep(-1.05, -0.35, q.y) * (1.0 - smoothstep(0.05, 1.12, q.y));
float w1 = 0.16 * sin(q.y * 2.1 + t * 0.42) + 0.05 * sin(q.y * 8.0);
float w2 = 0.15 * sin(q.y * 2.4 + t * 0.36 + 2.0);
float w3 = 0.14 * sin(q.y * 1.9 + t * 0.46 + 4.0);
float sheet = (lineGlow(q.x + 0.55 + w1, 0.018) + lineGlow(q.x + 0.05 + w2, 0.018) + lineGlow(q.x - 0.52 + w3, 0.018)) * yMask;
sheet += (lineGlow(q.x + 0.55 + w1, 0.16) + lineGlow(q.x + 0.05 + w2, 0.17) + lineGlow(q.x - 0.52 + w3, 0.16)) * yMask * 0.18;
float forks = lineGlow(sdSegment(q, vec2(-0.58, 0.66), vec2(-0.24, 0.1)), 0.007) * 0.45;
forks += lineGlow(sdSegment(q, vec2(0.1, 0.68), vec2(0.42, 0.0)), 0.007) * 0.42;
vec2 r = rot(-0.18) * q;
vec2 g = r * vec2(11.0, 2.4) + vec2(0.0, t * 0.9);
vec2 f = fract(g) - 0.5;
float rain = stroke(f.x, 0.015) * smoothstep(0.48, -0.1, f.y) * step(0.58, hash21(floor(g)));
v += sheet * (1.28 + flash * 0.72) + forks * (0.9 + flash * 0.58) + rain * 0.42 + cloud * 0.62 + depth * 0.16;
v *= 0.58;
`,
  ],
  [
    'sand-wind',
    'Sand Wind',
    '砂風',
    '#fbbf24',
    'Golden dune gusts with translucent dust curtains, heat shimmer, and flying grains.',
    '透明な砂のカーテン、熱ゆらぎ、舞う砂粒を重ねた金色の砂嵐。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.2, 1.9, length(q * vec2(0.72, 1.0)));
float heat = noise(q * vec2(1.0, 1.8) + vec2(t * 0.045, -t * 0.012)) * depth;
vec2 s = q;
s.x += t * 0.18;
s.y += 0.1 * sin(s.x * 1.7 + heat * 2.4);
float dunes = lineGlow(s.y + 0.72, 0.065);
dunes += lineGlow(s.y + 0.34 + 0.08 * sin(s.x * 2.0 + t * 0.2), 0.08) * 0.85;
dunes += lineGlow(s.y - 0.06 + 0.1 * sin(s.x * 1.5 + t * 0.28), 0.1) * 0.68;
float curtains = lineGlow(s.y - 0.42 + 0.12 * sin(s.x * 2.2 + t * 0.34), 0.18) * 0.56;
vec2 g = q * vec2(14.0, 8.0) + vec2(t * 0.9, sin(t * 0.2) * 0.2);
vec2 f = fract(g) - 0.5;
float h = hash21(floor(g));
float grains = smoothstep(0.06, 0.0, length(f)) * step(0.72, h);
float amberLift = glow(length((q - vec2(-0.1, -0.18)) / vec2(1.36, 0.72)), 0.94) * depth;
v += dunes * 1.48 + curtains * 1.58 + grains * 0.95 + heat * 0.46 + amberLift * 0.82 + depth * 0.16;
v *= 0.5;
`,
  ],
  [
    'mist-valley',
    'Mist Valley',
    '霧の谷',
    '#a7f3d0',
    'Layered valley silhouettes with luminous drifting fog and pale river light.',
    '谷の稜線、漂う発光霧、淡い川の反射が奥へ重なる霧の谷。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.2, 1.9, length(q * vec2(0.72, 1.0)));
float y1 = -0.78 + noise(vec2(q.x * 0.85, t * 0.02)) * 0.2;
float y2 = -0.52 + noise(vec2(q.x * 1.05 + 4.0, t * 0.018)) * 0.18;
float hills = smoothstep(y1 + 0.05, y1 - 0.04, q.y) * 0.32 + smoothstep(y2 + 0.05, y2 - 0.04, q.y) * 0.42;
float mist = lineGlow(q.y + 0.55 + 0.08 * sin(q.x * 1.4 + t * 0.14), 0.17);
mist += lineGlow(q.y + 0.18 + 0.08 * sin(q.x * 1.8 + t * 0.18), 0.19) * 0.78;
mist += lineGlow(q.y - 0.18 + 0.08 * sin(q.x * 1.2 + t * 0.12), 0.22) * 0.58;
float river = lineGlow(q.x + 0.18 * sin(q.y * 2.0 + t * 0.08), 0.07) * smoothstep(-1.0, -0.24, q.y) * (1.0 - smoothstep(-0.22, -0.02, q.y));
vec2 g = q * vec2(7.0, 5.0) + vec2(0.0, t * 0.08);
vec2 f = fract(g) - 0.5;
float lights = smoothstep(0.065, 0.0, length(f)) * step(0.72, hash21(floor(g)));
float lift = glow(length((q - vec2(0.18, -0.1)) / vec2(1.25, 0.72)), 0.72) * depth;
float valleyAir = depth * noise(q * 1.6 + t * 0.015);
v += hills * 0.54 + mist * 0.82 + river * 0.54 + lights * 0.72 + lift * 0.24 + valleyAir * 0.16 + depth * 0.06;
v *= 0.68;
`,
  ],
  [
    'sun-shaft',
    'Sun Shaft',
    '光芒',
    '#fef3c7',
    'Transparent forest sun shafts with dust motes and layered canopy shadows.',
    '森の影を抜ける透明な光芒、漂う塵、重なる木漏れ日。',
    `
vec2 q = p;
float depth = 1.0 - smoothstep(1.18, 1.86, length(q * vec2(0.75, 1.0)));
vec2 dir = normalize(vec2(0.45, -1.0));
vec2 side = vec2(-dir.y, dir.x);
float along = dot(q, dir);
float gate = smoothstep(-1.28, -0.22, along) * (1.0 - smoothstep(0.3, 1.24, along));
float shafts = lineGlow(dot(q, side) - 0.62 + 0.06 * sin(t * 0.14), 0.22);
shafts += lineGlow(dot(q, side) - 0.1 + 0.05 * sin(t * 0.12 + 2.0), 0.28) * 0.82;
shafts += lineGlow(dot(q, side) + 0.44 + 0.05 * sin(t * 0.1 + 4.0), 0.34) * 0.62;
shafts *= gate;
float canopy = glow(length((q - vec2(-0.68, 0.58)) / vec2(0.42, 0.18)), 0.72);
canopy += glow(length((q - vec2(0.24, 0.58)) / vec2(0.5, 0.2)), 0.72) * 0.9;
vec2 g = q * vec2(11.0, 7.0) + vec2(0.0, t * 0.08);
vec2 f = fract(g) - 0.5;
float h = hash21(floor(g));
float dust = smoothstep(0.055, 0.0, length(f)) * step(0.68, h) * (0.65 + 0.35 * sin(t + h * 20.0));
float focus = smoothstep(1.35, 0.16, length(q - vec2(-0.22, 0.08)));
shafts *= focus;
float amberEdge = lineGlow(dot(q, side) + 0.72 + 0.05 * sin(t * 0.13 + 1.6), 0.16) * gate * focus;
float warmCurtain = glow(length((q - vec2(-0.22, 0.14)) / vec2(1.25, 0.8)), 0.72) * depth;
v += shafts * 1.18 + amberEdge * 0.62 + dust * 0.82 + canopy * 0.14 + warmCurtain * 0.22 + depth * noise(q * 1.4 + t * 0.014) * 0.16 + depth * 0.04;
v *= 0.5;
`,
  ],
  [
    'frost-bloom',
    'Frost Bloom',
    '霜の花',
    '#bae6fd',
    'Transparent frost petals blooming through chilled glass haze.',
    '冷えたガラスの中で花びら状に広がる、透明な霜の膜。',
    `
vec2 q = p;
float edge = smoothstep(0.08, 1.14, max(abs(q.x), abs(q.y)));
vec2 b = (q - vec2(0.1, -0.03)) / vec2(1.08, 0.82);
float radius = length(b);
float angle = atan(b.y, b.x);
float petalRadius = 0.63 + 0.055 * sin(angle * 5.0 + t * 0.08) + 0.035 * sin(angle * 9.0 - t * 0.06);
float outerPetal = lineGlow(radius - petalRadius, 0.052) * (0.5 + edge * 0.5);
float innerPetal = lineGlow(radius - (0.42 + 0.035 * sin(angle * 6.0 - t * 0.05)), 0.042) * 0.72;
float rimMist = edge * noise(q * vec2(2.1, 2.7) + vec2(t * 0.012, -t * 0.018));
vec2 sweep = q;
sweep.y += 0.08 * sin(q.x * 2.0 + t * 0.07);
float glassBands = lineGlow(sweep.y + 0.62 + 0.08 * sin(sweep.x * 2.2), 0.105);
glassBands += lineGlow(sweep.y - 0.56 + 0.07 * sin(sweep.x * 2.0 + 1.7), 0.12) * 0.64;
glassBands *= 0.55 + edge * 0.45;
vec2 g = q * vec2(7.0, 4.0) + vec2(0.0, t * 0.02);
vec2 f = fract(g) - 0.5;
float frostDust = smoothstep(0.055, 0.0, length(f)) * step(0.78, hash21(floor(g)));
float icyMist = noise(q * vec2(2.0, 2.8) + vec2(t * 0.012, -t * 0.018));
float centerCold = glow(length((q - vec2(0.02, -0.04)) / vec2(1.12, 0.78)), 0.94);
v += outerPetal * 0.92 + innerPetal * 0.68 + glassBands * 0.54 + frostDust * 0.66 + rimMist * 0.3 + icyMist * edge * 0.26 + centerCold * 0.3 + edge * 0.1;
v *= 0.62;
`,
  ],
] as const

const tuned: Record<string, Partial<ShaderRecipe>> = {
  'rain-streaks': {
    color: `vec3(0.018, 0.04, 0.075) + vec3(0.08, 0.14, 0.22) * mask + uPrimary * shade * 0.58 + vec3(0.74, 0.92, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.48`,
    post: `
color += vec3(0.04, 0.08, 0.13) * mask * (0.18 + depthCue * 0.16);
color += vec3(0.36, 0.58, 0.86) * pow(clamp(shade, 0.0, 1.0), 2.4) * 0.14;
color *= 1.0 - 0.22 * smoothstep(0.78, 1.9, length(uv));
`,
    intensity: 1.1,
    motion: 0.9,
    detail: 2.3,
  },
  'snow-field': {
    color: `vec3(0.018, 0.035, 0.07) + vec3(0.06, 0.12, 0.2) * mask + mix(uPrimary, vec3(0.68, 0.9, 1.0), 0.45) * shade * 0.44 + vec3(0.9, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.18`,
    post: `
color += vec3(0.03, 0.065, 0.12) * mask * (0.1 + depthCue * 0.12);
color *= 1.0 - 0.22 * smoothstep(0.78, 1.9, length(uv));
`,
    intensity: 1.08,
    motion: 0.66,
    detail: 2.35,
  },
  'leaf-swarm': {
    color: `vec3(0.018, 0.052, 0.02) + vec3(0.065, 0.16, 0.045) * mask + mix(uPrimary, vec3(0.92, 0.68, 0.18), 0.28) * shade * 0.5 + vec3(0.9, 1.0, 0.6) * pow(clamp(shade, 0.0, 1.0), 2.25) * 0.18`,
    post: `
color += vec3(0.045, 0.12, 0.035) * mask * (0.12 + depthCue * 0.18);
color += vec3(0.26, 0.16, 0.02) * smoothstep(-0.85, 0.55, uv.y) * 0.08;
`,
    intensity: 1.12,
    motion: 0.84,
    detail: 2.4,
  },
  'pollen-glow': {
    color: `vec3(0.05, 0.03, 0.004) + vec3(0.2, 0.12, 0.02) * mask + uPrimary * shade * 0.48 + vec3(1.0, 0.86, 0.42) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.24 + vec3(0.5, 0.9, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.08`,
    post: `
color += vec3(0.2, 0.12, 0.026) * mask * (0.1 + depthCue * 0.12);
`,
    intensity: 1.08,
    motion: 0.7,
    detail: 2.35,
  },
  'cloud-shelf': {
    color: `vec3(0.022, 0.032, 0.05) + vec3(0.09, 0.13, 0.19) * mask + mix(uPrimary, vec3(0.68, 0.8, 0.94), 0.36) * shade * 0.38 + vec3(0.82, 0.92, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.1`,
    post: `
color += vec3(0.055, 0.075, 0.1) * mask * (0.16 + depthCue * 0.16);
color *= 1.0 - 0.2 * smoothstep(0.82, 1.92, length(uv));
`,
    intensity: 1.08,
    motion: 0.68,
    detail: 2.2,
  },
  'lightning-sheet': {
    color: `vec3(0.02, 0.032, 0.055) + vec3(0.08, 0.13, 0.24) * mask + uPrimary * shade * 0.62 + vec3(0.66, 0.9, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.56`,
    post: `
color += vec3(0.025, 0.055, 0.1) * mask * (0.14 + depthCue * 0.18);
color += vec3(0.62, 0.88, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.2;
`,
    intensity: 1.1,
    motion: 0.8,
    detail: 2.25,
  },
  'sand-wind': {
    color: `vec3(0.055, 0.03, 0.006) + vec3(0.3, 0.16, 0.026) * mask + uPrimary * shade * 0.62 + vec3(1.0, 0.76, 0.28) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.42`,
    post: `
color += vec3(0.22, 0.12, 0.025) * mask * (0.16 + depthCue * 0.18);
`,
    intensity: 1.1,
    motion: 0.86,
    detail: 2.25,
  },
  'mist-valley': {
    color: `vec3(0.012, 0.045, 0.04) + vec3(0.04, 0.105, 0.09) * mask + mix(uPrimary, vec3(0.62, 1.0, 0.82), 0.42) * shade * 0.42 + vec3(0.78, 1.0, 0.9) * pow(clamp(shade, 0.0, 1.0), 2.12) * 0.12`,
    post: `
color += vec3(0.035, 0.12, 0.09) * mask * (0.16 + depthCue * 0.2);
`,
    intensity: 1.08,
    motion: 0.56,
    detail: 2.25,
  },
  'sun-shaft': {
    color: `vec3(0.055, 0.034, 0.01) + vec3(0.22, 0.16, 0.055) * mask + uPrimary * shade * 0.42 + vec3(1.0, 0.9, 0.58) * pow(clamp(shade, 0.0, 1.0), 2.05) * 0.26 + vec3(0.58, 0.86, 1.0) * pow(clamp(shade, 0.0, 1.0), 3.0) * 0.08`,
    post: `
color += vec3(0.22, 0.13, 0.035) * mask * (0.16 + depthCue * 0.18);
`,
    intensity: 1.1,
    motion: 0.6,
    detail: 2.25,
  },
  'frost-bloom': {
    color: `vec3(0.015, 0.035, 0.05) + vec3(0.08, 0.17, 0.24) * mask + uPrimary * shade * 0.72 + vec3(0.78, 0.95, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.58`,
    post: `
color += vec3(0.03, 0.09, 0.13) * mask * (0.14 + depthCue * 0.18);
`,
    intensity: 1.08,
    motion: 0.44,
    detail: 2.25,
  },
}

export const natureWeatherEffects = natureWeatherRecipes.map(
  ([id, title, titleJa, accentColor, description, descriptionJa, field]) =>
    makeEffect({
      id,
      title,
      titleJa,
      categoryId: 'nature-weather',
      description,
      descriptionJa,
      accentColor,
      tags: ['nature', 'weather', id],
      field,
      ...tuned[id],
    }),
)
