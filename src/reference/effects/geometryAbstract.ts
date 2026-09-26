import { makeEffect, type ShaderRecipe } from './glsl'

export const geometryAbstractEffects = [
  ['kaleido-cells', 'Kaleido Cells', '万華鏡セル', '#c084fc', 'Mirrored cells folding into a kaleidoscope.', '鏡面反復する万華鏡セル。', `float a = atan(p.y, p.x); float r = length(p); a = mod(a, 0.785) - 0.392; vec2 q = vec2(cos(a), sin(a)) * r * (4.0 + uDetail); vec2 f = fract(q) - 0.5; v += stroke(sdHex(f, 0.28), 0.03) + smoothstep(0.12, 0.0, length(f));`],
  ['voronoi-pulse', 'Voronoi Pulse', 'ボロノイパルス', '#22d3ee', 'Layered cellular membranes drifting through depth.', '奥へ漂う複数層のセル膜。', `
vec2 camera = vec2(sin(t * 0.08), cos(t * 0.065)) * 0.18;
float field = 0.0;
float motes = 0.0;

for (int layer = 0; layer < 5; layer++) {
  float lf = float(layer);
  float z = lf / 4.0;
  float perspective = mix(1.75, 0.58, z);
  float scale = mix(8.4, 2.15, z) + uDetail * mix(1.0, 0.2, z);
  vec2 drift = vec2(
    sin(t * (0.05 + z * 0.12) + lf * 2.3),
    cos(t * (0.04 + z * 0.08) + lf * 1.7)
  ) * mix(0.08, 0.32, z);
  vec2 q = (p + camera * (z - 0.45) + drift) * scale * perspective;
  q += vec2(lf * 11.7, lf * -6.4);

  vec2 cell = floor(q);
  vec2 f = fract(q);
  float d1 = 9.0;
  float d2 = 9.0;
  vec2 nearest = vec2(0.0);

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 seed = hash22(cell + g + lf * 17.0);
      vec2 o = 0.5 + 0.32 * sin(t * (0.35 + z * 0.5) + 6.28318 * seed + lf);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        nearest = r;
      } else if (d < d2) {
        d2 = d;
      }
    }
  }

  float border = sqrt(d2) - sqrt(d1);
  float width = mix(0.024, 0.085, z);
  float membrane = smoothstep(width, 0.0, border);
  float innerGlow = exp(-d1 * mix(5.0, 1.5, z)) * 0.08;
  float lens = smoothstep(1.65, 0.15, length(p * vec2(0.78, 1.0)));
  float depthFade = mix(0.13, 1.0, z);
  float pulse = 0.74 + 0.26 * sin(t * (0.7 + z * 0.55) + lf * 1.9 + length(nearest) * 4.0);

  field += (membrane * pulse + innerGlow) * depthFade * lens;

  vec2 motePos = (hash22(cell + lf * 4.0) - 0.5) * 0.82;
  motes += smoothstep(mix(0.016, 0.052, z), 0.0, length(f - 0.5 - motePos)) * depthFade * 0.18;
}

float depthFog = fbm(p * vec2(1.2, 2.0) + vec2(t * 0.018, -t * 0.014));
v += field + motes + depthFog * 0.08 * smoothstep(1.6, 0.1, length(p));
`],
  ['moire-field', 'Moire Field', 'モアレ場', '#f472b6', 'Depth-stacked interference sheets folding into a dark optical volume.', '暗い空間へ折り重なる、奥行きのある干渉シート。', `
vec2 vp = vec2(-0.16, 0.08);
vec2 ray = p - vp;
float field = 0.0;
float haze = 0.0;

for (int i = 0; i < 8; i++) {
  float fi = float(i);
  float z = (fi + 1.0) / 8.0;
  float focus = pow(z, 1.7);
  float scale = mix(18.0 + uDetail * 3.0, 4.6 + uDetail * 0.9, focus);
  vec2 drift = vec2(
    sin(t * (0.05 + z * 0.08) + fi * 1.9),
    cos(t * (0.04 + z * 0.07) + fi * 2.4)
  ) * mix(0.05, 0.28, focus);
  vec2 q = ray * mix(0.42, 1.95, focus) + drift + vp * (0.25 + z * 0.2);
  q = rot(-0.62 + fi * 0.21 + sin(t * 0.045 + fi) * 0.08) * q;

  float lens = smoothstep(1.65, 0.12, length((p - vp) * vec2(0.78, 1.0)));
  float sheet = smoothstep(-0.9, 0.15, q.y + 0.62 + z * 0.28) * smoothstep(1.25, -0.18, q.y - 0.82 + z * 0.18);
  float edgeFade = smoothstep(1.25, 0.08, abs(q.x));
  vec2 a = q * scale;
  vec2 b = rot(0.085 + z * 0.34 + sin(t * 0.05) * 0.035) * q * (scale * (0.965 + z * 0.045));
  float l1 = sin(a.x + sin(a.y * 0.23 + t * 0.28) * 1.2);
  float l2 = sin(b.x + b.y * (0.12 + z * 0.1) - t * (0.55 + z * 0.35));
  float beat = abs(l1 - l2);
  float fringe = smoothstep(mix(0.18, 0.06, focus), 0.0, beat);
  float fiber = stroke(sin(q.y * (8.0 + z * 13.0) + fbm(q * 2.0 + fi) * 2.2), mix(0.18, 0.07, focus));
  float occlusion = 0.58 + 0.42 * fbm(q * vec2(1.4, 2.6) + vec2(fi, t * 0.035));
  float depthAlpha = mix(0.09, 0.86, focus);
  float blurHint = mix(0.45, 1.0, focus);

  field += (fringe * 0.78 + fiber * 0.18) * sheet * edgeFade * lens * depthAlpha * occlusion * blurHint;
  haze += sheet * lens * depthAlpha * (0.16 + 0.24 * fbm(q * 1.3 + t * 0.02));
}

float foreground = 0.0;
for (int i = 0; i < 5; i++) {
  float fi = float(i);
  vec2 q = rot(-0.95 + fi * 0.38) * (p - vp + vec2(sin(t * 0.08 + fi), cos(t * 0.06 + fi)) * 0.12);
  float ribbon = stroke(sin(q.x * (5.0 + fi * 0.9) + q.y * 2.2 - t * (0.35 + fi * 0.08)), 0.07);
  foreground += ribbon * smoothstep(1.25, 0.18, length(q)) * smoothstep(-0.1, 0.8, q.y + 0.65) * 0.26;
}

v += field + foreground + haze * 0.12;
`],
  ['simplex-fold', 'Simplex Fold', '単体フォールド', '#a3e635', 'Repeated triangular folds with glowing seams.', '三角フォールドの発光シーム。', `vec2 q = p; for (int i = 0; i < 5; i++) { q = abs(q) - 0.35; q = rot(1.047) * q; } v += stroke(length(q) - 0.18, 0.035) + smoothstep(0.09, 0.0, abs(q.x));`],
  ['radial-tiles', 'Radial Tiles', '放射タイル', '#fb923c', 'Perspective tile plates falling into a warm optical tunnel.', '暖色の光学トンネルへ沈む遠近感のあるタイル板。', `
vec2 vp = vec2(0.18, 0.02);
vec2 ray = p - vp;
float tileField = 0.0;
float sparks = 0.0;
float fog = 0.0;

for (int i = 0; i < 9; i++) {
  float fi = float(i);
  float z = (fi + 1.0) / 9.0;
  float depth = pow(z, 1.85);
  float scale = mix(0.52, 3.2, depth);
  vec2 q = ray * scale;
  q = rot(-0.42 + depth * 1.25 + sin(t * 0.05 + fi) * 0.08) * q;
  q += vec2(sin(t * (0.06 + depth * 0.08) + fi), cos(t * (0.04 + depth * 0.05) + fi * 1.7)) * mix(0.04, 0.22, depth);

  float plane = smoothstep(-0.95, -0.35, q.y + depth * 0.42) * smoothstep(1.18, 0.12, q.y - depth * 0.18);
  float sideFade = smoothstep(1.35, 0.05, abs(q.x));
  vec2 grid = q * vec2(5.0 + uDetail * 0.9, 2.4 + depth * 4.0);
  grid.x += 0.28 * sin(grid.y * 0.7 + t * 0.18 + fi);
  vec2 cell = fract(grid) - 0.5;
  vec2 id = floor(grid);
  float lineX = smoothstep(0.018 + depth * 0.018, 0.0, abs(cell.x));
  float lineY = smoothstep(0.018 + depth * 0.014, 0.0, abs(cell.y));
  float tileEdge = max(lineX, lineY);
  float panel = smoothstep(0.47, 0.37, max(abs(cell.x), abs(cell.y))) * (0.18 + 0.16 * hash21(id + fi));
  float broken = 0.55 + 0.45 * fbm(id * 0.32 + vec2(fi, t * 0.035));
  float alpha = mix(0.1, 0.9, depth) * plane * sideFade;

  tileField += (tileEdge * broken + panel) * alpha * (0.72 - fi * 0.045);
  fog += plane * sideFade * alpha * (0.08 + 0.16 * fbm(q * 1.7 + fi));

  vec2 mote = hash22(id + fi * 9.0) - 0.5;
  sparks += smoothstep(0.028 + depth * 0.018, 0.0, length(cell - mote * 0.65)) * alpha * 0.16;
}

float nearRibbon = 0.0;
for (int i = 0; i < 4; i++) {
  float fi = float(i);
  vec2 q = rot(-0.9 + fi * 0.42) * (ray + vec2(sin(t * 0.07 + fi), cos(t * 0.05 + fi)) * 0.1);
  float ribbon = stroke(sin(q.x * (4.5 + fi) + q.y * 2.0 - t * (0.28 + fi * 0.08)), 0.075);
  nearRibbon += ribbon * smoothstep(1.45, 0.08, length(q)) * smoothstep(-0.9, 0.35, q.y) * 0.28;
}

v += tileField + sparks + nearRibbon + fog * 0.14;
`],
  ['binary-orbit', 'Binary Orbit', '二体軌道', '#facc15', 'Two abstract bodies carving orbital interference.', '二つの抽象体が軌道干渉を刻む。', `vec2 a = vec2(cos(t), sin(t)) * 0.36; vec2 b = -a; float da = length(p - a); float db = length(p - b); v += stroke(da - db, 0.035) + smoothstep(0.09, 0.0, da) + smoothstep(0.09, 0.0, db);`],
  ['lattice-warp', 'Lattice Warp', '格子ワープ', '#60a5fa', 'A square lattice warped by slow noise fields.', '低速ノイズで歪む正方格子。', `vec2 q = p + 0.18 * vec2(fbm(p * 2.0 + t), fbm(p * 2.0 - t)); q *= 5.0 + uDetail; vec2 f = abs(fract(q) - 0.5); v += smoothstep(0.03, 0.0, min(f.x, f.y));`],
  ['glass-triangles', 'Glass Triangles', 'ガラス三角形', '#93c5fd', 'Triangular panes with refractive-like shimmer.', '屈折感のある三角形ペイン。', `vec2 q = p * (3.0 + uDetail); float tri = abs(fract(q.x + q.y * 0.58) - 0.5); float tri2 = abs(fract(q.x - q.y * 0.58) - 0.5); float edge = smoothstep(0.035, 0.0, min(tri, tri2)); v += edge + pow(fbm(q + t * 0.08), 4.0);`],
  ['contour-map', 'Contour Map', '等高線マップ', '#34d399', 'Topographic contour lines over moving terrain.', '動く地形上の等高線。', `float h = fbm(p * (2.0 + uDetail) + vec2(t * 0.06, 0.0)); float contour = stroke(fract(h * 9.0) - 0.5, 0.06); v += contour + h * 0.25;`],
  ['op-art-waves', 'Op Art Waves', 'オプアート波', '#f9a8d4', 'High contrast optical waves with a soft center.', '柔らかな中心を持つ高コントラスト波。', `float waves = sin(p.x * (12.0 + uDetail) + sin(p.y * 7.0 + t) * 2.5); float rings = sin(length(p) * 18.0 - t * 2.0); v += smoothstep(0.72, 1.0, waves * rings) * smoothstep(1.2, 0.0, length(p));`],
].map(([id, title, titleJa, accentColor, description, descriptionJa, field]) => {
  const recipe: ShaderRecipe = {
    id,
    title,
    titleJa,
    categoryId: 'geometry-abstract',
    description,
    descriptionJa,
    accentColor,
    tags: ['geometry', 'abstract', id],
    field,
  }

  if (id === 'voronoi-pulse') {
    return makeEffect({
      ...recipe,
      warp: `
float depthBreath = smoothstep(1.55, 0.1, length(p));
p += 0.018 * depthBreath * vec2(
  fbm(p * vec2(1.8, 2.5) + vec2(t * 0.025, 0.0)) - 0.5,
  fbm(p * vec2(2.4, 1.7) + vec2(0.0, -t * 0.02)) - 0.5
);
`,
      color: `vec3(0.002, 0.007, 0.012) + uPrimary * shade * 0.46 + vec3(0.58, 0.95, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.25) * 0.44`,
      post: `
float vignette = smoothstep(1.72, 0.22, length(uv * vec2(0.78, 1.0)));
float fog = fbm(uv * vec2(1.1, 1.8) + vec2(iTime * 0.012, -iTime * 0.016));
color += vec3(0.01, 0.08, 0.11) * fog * vignette * 0.16;
color += vec3(0.3, 0.8, 0.95) * pow(clamp(shade, 0.0, 1.0), 3.2) * 0.18;
color *= 1.0 - 0.44 * smoothstep(0.58, 1.85, length(uv));
`,
      intensity: 0.9,
      motion: 0.68,
      detail: 2.25,
    })
  }

  if (id === 'moire-field') {
    return makeEffect({
      ...recipe,
      warp: `
float opticalDepth = smoothstep(1.7, 0.14, length(p * vec2(0.82, 1.0)));
p += 0.016 * opticalDepth * vec2(
  fbm(p * vec2(1.4, 2.8) + vec2(t * 0.018, 0.0)) - 0.5,
  fbm(p * vec2(2.3, 1.5) + vec2(0.0, -t * 0.02)) - 0.5
);
`,
      color: `vec3(0.004, 0.003, 0.012) + vec3(0.18, 0.08, 0.28) * shade * 0.22 + uPrimary * shade * 0.48 + vec3(0.7, 0.95, 1.0) * pow(clamp(shade, 0.0, 1.0), 2.7) * 0.28`,
      post: `
vec2 vp = vec2(-0.16, 0.08);
float depthCone = smoothstep(1.75, 0.16, length((uv - vp) * vec2(0.72, 1.0)));
float fog = fbm(uv * vec2(1.0, 1.8) + vec2(iTime * 0.01, -iTime * 0.012));
float nearSweep = smoothstep(0.018, 0.0, abs(sin((uv.x * 0.62 + uv.y * 1.4) * 6.0 - iTime * 0.18)));
color += vec3(0.08, 0.015, 0.1) * fog * depthCone * 0.22;
color += vec3(0.34, 0.08, 0.28) * nearSweep * depthCone * 0.055;
color += vec3(0.28, 0.72, 0.95) * pow(clamp(shade, 0.0, 1.0), 3.5) * 0.14;
color *= 1.0 - 0.46 * smoothstep(0.58, 1.88, length(uv));
`,
      intensity: 0.88,
      motion: 0.72,
      detail: 2.15,
    })
  }

  if (id === 'radial-tiles') {
    return makeEffect({
      ...recipe,
      warp: `
vec2 radialWarpVp = vec2(0.18, 0.02);
float tunnelDepth = smoothstep(1.7, 0.08, length((p - radialWarpVp) * vec2(0.74, 1.0)));
p += 0.014 * tunnelDepth * vec2(
  fbm(p * vec2(1.6, 2.3) + vec2(t * 0.018, 0.0)) - 0.5,
  fbm(p * vec2(2.4, 1.4) + vec2(0.0, -t * 0.015)) - 0.5
);
`,
      color: `vec3(0.006, 0.004, 0.002) + vec3(0.22, 0.09, 0.02) * shade * 0.22 + uPrimary * shade * 0.46 + vec3(1.0, 0.74, 0.38) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.34`,
      post: `
vec2 radialPostVp = vec2(0.18, 0.02);
vec2 ray = uv - radialPostVp;
float cone = smoothstep(1.75, 0.14, length(ray * vec2(0.72, 1.0)));
float centerPull = exp(-length(ray) * 2.4);
float amberFog = fbm(uv * vec2(1.2, 2.1) + vec2(iTime * 0.012, -iTime * 0.015));
color += vec3(0.12, 0.045, 0.012) * amberFog * cone * 0.2;
color += vec3(0.48, 0.2, 0.04) * centerPull * 0.12;
color += vec3(0.9, 0.48, 0.13) * pow(clamp(shade, 0.0, 1.0), 3.1) * 0.16;
color *= 1.0 - 0.48 * smoothstep(0.58, 1.88, length(uv));
`,
      intensity: 0.92,
      motion: 0.7,
      detail: 2.0,
    })
  }

  return makeEffect(recipe)
})
