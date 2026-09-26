import { makeEffect, type ShaderRecipe } from './glsl'

const motionRecipes: ShaderRecipe[] = [
  {
    id: 'speed-lines',
    title: 'Speed Lines',
    titleJa: 'スピードライン',
    categoryId: 'motion-tunnels',
    description: 'Layered photon lanes rushing through a bright atmospheric speed corridor.',
    descriptionJa: '明るい霞の回廊を抜ける、多層のフォトンレーン。',
    accentColor: '#93c5fd',
    tags: ['motion', 'tunnel', 'speed-lines'],
    field: `
vec2 q = p;
q.x += 0.14 * sin(q.y * 2.2 + t * 0.38) + 0.04 * sin(q.y * 7.0 - t * 0.9);
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.55, 0.03, r);
float rays = 0.0;
for (int i = 0; i < 3; i++) {
  float fi = float(i);
  float laneCount = 18.0 + fi * 9.0 + uDetail * 2.4;
  float pulse = pow(0.5 + 0.5 * sin(9.0 / max(r, 0.08) - t * (4.4 + fi * 0.9) + fi * 1.8), 3.2);
  float lane = stroke(sin(a * laneCount + t * (1.35 + fi * 0.3) + fi * 2.1), 0.045 + fi * 0.016);
  rays += lane * pulse * depth / (0.42 + r * 0.7) * (0.92 - fi * 0.18);
}
vec2 g = q * vec2(9.0, 6.0) / (0.5 + r) + vec2(t * 0.35, -t * 1.4);
vec2 f = fract(g) - 0.5;
float motes = smoothstep(0.07, 0.0, length(f)) * step(0.7, hash21(floor(g)));
float air = noise(q * vec2(1.4, 0.9) + vec2(t * 0.03, -t * 0.02)) * depth;
float gate = lineGlow(r - (0.72 + 0.08 * sin(t * 0.7)), 0.08) * 0.5;
v += rays * 1.35 + motes * 0.82 + gate + air * 0.28 + depth * 0.12;
`,
    color: `vec3(0.012, 0.022, 0.042) + vec3(0.08, 0.15, 0.24) * mask + mix(uPrimary, vec3(0.78, 0.96, 1.0), 0.42) * shade * 0.58 + vec3(0.9, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.34`,
    post: `
color += vec3(0.05, 0.1, 0.16) * mask * (0.16 + depthCue * 0.2);
color += uPrimary * volumetric * 0.18;
`,
    intensity: 1.12,
    motion: 1.18,
    detail: 2.65,
  },
  {
    id: 'vortex-rings',
    title: 'Vortex Rings',
    titleJa: '渦リング',
    categoryId: 'motion-tunnels',
    description: 'Glass rings folding into a luminous vortex with floating depth motes.',
    descriptionJa: '浮遊粒子を抱えながら奥へ折り込まれる、透明な渦リング。',
    accentColor: '#22d3ee',
    tags: ['motion', 'tunnel', 'vortex-rings'],
    field: `
vec2 q = p;
float r = length(q);
float a = atan(q.y, q.x);
float swirl = a + r * (4.2 + uDetail * 0.45) - t * 0.72 + 0.2 * sin(r * 7.0 - t);
float depth = smoothstep(1.28, 0.05, r);
float rings = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float phase = fract(1.0 / max(r + fi * 0.065, 0.09) * 0.55 - t * (0.42 + fi * 0.05));
  float ring = lineGlow(phase - 0.5, 0.035 + fi * 0.012);
  float blade = 0.38 + 0.62 * pow(0.5 + 0.5 * sin(swirl * (3.0 + fi) + fi * 1.6), 1.8);
  rings += ring * blade * depth * (0.86 - fi * 0.12);
}
float innerFog = glow(r, 0.78) * (0.4 + 0.6 * noise(q * 2.2 + t * 0.04));
vec2 g = vec2(a * 1.8, 1.2 / max(r, 0.12)) + vec2(0.0, -t * 0.9);
vec2 f = fract(g * vec2(11.0, 5.0)) - 0.5;
float motes = smoothstep(0.05, 0.0, length(f)) * step(0.78, hash21(floor(g * vec2(11.0, 5.0))));
v += rings * 1.25 + innerFog * 0.34 + motes * 0.68 + depth * 0.08;
`,
    color: `vec3(0.006, 0.025, 0.04) + vec3(0.025, 0.12, 0.18) * mask + mix(uPrimary, vec3(0.72, 1.0, 0.94), 0.42) * shade * 0.62 + vec3(0.78, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.34`,
    post: `
color += vec3(0.02, 0.09, 0.12) * mask * (0.16 + depthCue * 0.16);
`,
    intensity: 1.12,
    motion: 0.82,
    detail: 2.75,
  },
  {
    id: 'hyperspace-grid',
    title: 'Hyperspace Grid',
    titleJa: 'ハイパースペース格子',
    categoryId: 'motion-tunnels',
    description: 'A curved neon grid diving toward a foggy vanishing point.',
    descriptionJa: '霧の消失点へ沈み込む、曲面ネオングリッド。',
    accentColor: '#818cf8',
    tags: ['motion', 'tunnel', 'hyperspace-grid'],
    field: `
vec2 q = p;
float r = length(q);
float a = atan(q.y, q.x);
float z = 1.0 / max(r + 0.06, 0.08);
float depth = smoothstep(1.45, 0.05, r);
vec2 tunnel = vec2(a * 2.2 + 0.2 * sin(z * 0.4 + t), z - t * 1.25);
vec2 cell = abs(fract(tunnel * vec2(6.0 + uDetail, 0.92)) - 0.5);
float radial = lineGlow(cell.x - 0.48, 0.025);
float rings = lineGlow(cell.y - 0.48, 0.035);
float grid = (radial * 0.72 + rings) * depth / (0.8 + r);
float horizon = lineGlow(q.y + 0.18 * sin(q.x * 1.3 + t * 0.2), 0.1) * smoothstep(1.15, 0.12, abs(q.y));
vec2 g = tunnel * vec2(7.0, 2.0);
vec2 f = fract(g) - 0.5;
float ticks = smoothstep(0.045, 0.0, length(f)) * step(0.83, hash21(floor(g)));
v += grid * 1.35 + horizon * 0.64 + ticks * 0.78 + depth * noise(q * 1.5 + t * 0.02) * 0.2;
`,
    color: `vec3(0.012, 0.015, 0.045) + vec3(0.07, 0.08, 0.2) * mask + mix(uPrimary, vec3(0.62, 0.9, 1.0), 0.32) * shade * 0.58 + vec3(0.86, 0.8, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.28`,
    post: `
color += vec3(0.035, 0.05, 0.13) * mask * (0.18 + depthCue * 0.16);
`,
    intensity: 1.08,
    motion: 0.95,
    detail: 2.5,
  },
  {
    id: 'flow-tube',
    title: 'Flow Tube',
    titleJa: 'フローチューブ',
    categoryId: 'motion-tunnels',
    description: 'Liquid ribbons sliding inside a transparent tubular corridor.',
    descriptionJa: '透明な筒状回廊の内側を滑る、液体リボン。',
    accentColor: '#2dd4bf',
    tags: ['motion', 'tunnel', 'flow-tube'],
    field: `
vec2 q = p / vec2(1.0, 0.66);
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.32, 0.08, r);
float tube = lineGlow(r - (0.66 + 0.035 * sin(a * 5.0 + t * 0.24)), 0.06);
float ribbons = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float path = sin(a * (4.0 + fi) + r * (8.5 + uDetail) - t * (1.7 + fi * 0.25) + fi * 1.4);
  float lane = lineGlow(path, 0.055 + fi * 0.012);
  float dash = pow(0.5 + 0.5 * sin(r * 16.0 - t * (3.0 + fi * 0.7)), 3.0);
  ribbons += lane * dash * depth * (0.86 - fi * 0.13);
}
vec2 g = vec2(a * 1.5, r * 4.0 - t * 0.8);
vec2 f = fract(g * vec2(8.0, 4.0)) - 0.5;
float droplets = smoothstep(0.055, 0.0, length(f)) * step(0.72, hash21(floor(g * vec2(8.0, 4.0))));
float fog = noise(p * vec2(1.3, 1.0) + vec2(t * 0.015, -t * 0.018)) * depth;
v += tube * 0.82 + ribbons * 1.28 + droplets * 0.62 + fog * 0.32 + depth * 0.08;
`,
    color: `vec3(0.005, 0.032, 0.032) + vec3(0.035, 0.13, 0.12) * mask + mix(uPrimary, vec3(0.76, 1.0, 0.92), 0.38) * shade * 0.62 + vec3(0.75, 1.0, 0.96) * pow(clamp(shade, 0.0, 1.0), 2.15) * 0.26`,
    post: `
color += vec3(0.02, 0.1, 0.09) * mask * (0.12 + depthCue * 0.18);
`,
    intensity: 1.1,
    motion: 0.92,
    detail: 2.4,
  },
  {
    id: 'elastic-spiral',
    title: 'Elastic Spiral',
    titleJa: '弾性スパイラル',
    categoryId: 'motion-tunnels',
    description: 'A prismatic elastic helix shedding translucent particles into fog.',
    descriptionJa: '透明な粒子を霧へ散らす、プリズム状の弾性ヘリックス。',
    accentColor: '#f472b6',
    tags: ['motion', 'tunnel', 'elastic-spiral'],
    field: `
vec2 q = p;
q *= 1.0 + 0.05 * sin(t * 0.6 + q.y * 3.0);
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.36, 0.04, r);
float helix = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float phase = a * (2.2 + fi * 0.35) + r * (11.0 + uDetail * 1.2) - t * (2.1 + fi * 0.28) + sin(t * 0.65 + r * 5.0 + fi);
  helix += lineGlow(sin(phase), 0.07 + fi * 0.016) * depth * (0.86 - fi * 0.14);
}
float membrane = glow(abs(r - (0.54 + 0.08 * sin(a * 3.0 - t * 0.5))), 0.18) * depth * 0.32;
vec2 g = q * vec2(7.5, 6.0) + vec2(t * 0.38, -t * 0.22);
vec2 f = fract(g) - 0.5;
float particles = smoothstep(0.06, 0.0, length(f)) * step(0.74, hash21(floor(g)));
v += helix * 1.18 + membrane + particles * 0.68 + depth * noise(q * 1.6 + t * 0.02) * 0.18;
`,
    color: `vec3(0.035, 0.01, 0.04) + vec3(0.13, 0.05, 0.16) * mask + mix(uPrimary, vec3(0.88, 0.76, 1.0), 0.38) * shade * 0.6 + vec3(1.0, 0.82, 0.98) * pow(clamp(shade, 0.0, 1.0), 2.18) * 0.28`,
    post: `
color += vec3(0.1, 0.04, 0.12) * mask * (0.14 + depthCue * 0.16);
`,
    intensity: 1.12,
    motion: 0.96,
    detail: 2.55,
  },
  {
    id: 'tunnel-scan',
    title: 'Tunnel Scan',
    titleJa: 'トンネルスキャン',
    categoryId: 'motion-tunnels',
    description: 'Volumetric scan curtains slicing through a glowing depth tunnel.',
    descriptionJa: '光る深度トンネルを切る、ボリューム感のあるスキャン幕。',
    accentColor: '#facc15',
    tags: ['motion', 'tunnel', 'tunnel-scan'],
    field: `
vec2 q = p;
float r = length(q);
float a = atan(q.y, q.x);
float depth = smoothstep(1.38, 0.05, r);
float tunnel = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float wave = fract(1.0 / max(r + fi * 0.05, 0.08) * 0.5 - t * (0.55 + fi * 0.08));
  tunnel += lineGlow(wave - 0.5, 0.04 + fi * 0.012) * depth * (0.82 - fi * 0.12);
}
float sweep = lineGlow(a + 0.7 * sin(t * 0.65) + 0.24 * sin(r * 4.0 - t), 0.13) * depth;
float curtain = lineGlow(q.x + 0.28 * sin(q.y * 2.2 + t * 0.34), 0.16) * smoothstep(1.2, -0.2, abs(q.y));
vec2 g = vec2(a * 2.4, 1.0 / max(r, 0.12)) + vec2(t * 0.2, -t * 1.0);
vec2 f = fract(g * vec2(8.0, 4.0)) - 0.5;
float motes = smoothstep(0.055, 0.0, length(f)) * step(0.78, hash21(floor(g * vec2(8.0, 4.0))));
v += tunnel * 1.08 + sweep * 1.05 + curtain * 0.52 + motes * 0.62 + depth * 0.08;
`,
    color: `vec3(0.04, 0.028, 0.006) + vec3(0.16, 0.11, 0.025) * mask + mix(uPrimary, vec3(1.0, 0.9, 0.48), 0.42) * shade * 0.58 + vec3(1.0, 0.92, 0.62) * pow(clamp(shade, 0.0, 1.0), 2.1) * 0.32`,
    post: `
color += vec3(0.16, 0.1, 0.025) * mask * (0.14 + depthCue * 0.18);
`,
    intensity: 1.08,
    motion: 0.9,
    detail: 2.45,
  },
  {
    id: 'drift-corridor',
    title: 'Drift Corridor',
    titleJa: 'ドリフト回廊',
    categoryId: 'motion-tunnels',
    description: 'Curved translucent corridor panels drifting through layered mist.',
    descriptionJa: '層状の霧の中をドリフトする、半透明の回廊パネル。',
    accentColor: '#a7f3d0',
    tags: ['motion', 'tunnel', 'drift-corridor'],
    field: `
vec2 q = p;
q.x += 0.22 * sin(q.y * 2.2 + t * 0.44) + 0.06 * sin(q.y * 7.0 - t);
float depth = smoothstep(1.18, -0.08, abs(q.y));
float walls = 0.0;
float panelVeil = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  float width = 0.32 + fi * 0.18 + 0.04 * sin(t * 0.3 + fi);
  float wall = lineGlow(abs(q.x) - width, 0.05 + fi * 0.012);
  float panel = lineGlow(fract((q.y + t * (0.32 + fi * 0.08)) * (1.45 + fi * 0.22)) - 0.5, 0.22);
  float corridorMask = smoothstep(width + 0.25, width - 0.08, abs(q.x));
  walls += wall * depth * (0.8 - fi * 0.12);
  panelVeil += panel * corridorMask * depth * (0.16 - fi * 0.02);
}
float floorFog = lineGlow(q.y + 0.62 + 0.08 * sin(q.x * 2.0 + t * 0.18), 0.2);
vec2 g = q * vec2(6.0, 7.0) + vec2(t * 0.18, -t * 0.42);
vec2 f = fract(g) - 0.5;
float fragments = smoothstep(0.055, 0.0, length(f / vec2(1.0, 0.5))) * step(0.8, hash21(floor(g)));
v += walls * 1.02 + panelVeil * 0.26 + floorFog * 0.5 + fragments * 0.68 + depth * noise(q * 1.2 + t * 0.02) * 0.2;
`,
    color: `vec3(0.006, 0.032, 0.03) + vec3(0.035, 0.12, 0.1) * mask + mix(uPrimary, vec3(0.8, 1.0, 0.9), 0.42) * shade * 0.54 + vec3(0.82, 1.0, 0.92) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.24`,
    post: `
color += vec3(0.02, 0.09, 0.07) * mask * (0.16 + depthCue * 0.18);
`,
    intensity: 1.1,
    motion: 0.78,
    detail: 2.6,
  },
]

export const motionTunnelEffects = motionRecipes.map((recipe) => makeEffect(recipe))
