import { makeEffect } from './glsl'

export const materialSurfaceEffects = [
  makeEffect({
    id: 'chrome-liquid',
    title: 'Chrome Liquid',
    titleJa: '液体クローム',
    categoryId: 'materials-surfaces',
    description: 'Reflective liquid chrome ripples.',
    descriptionJa: '反射感のある液体クロームの波紋。',
    accentColor: '#dbeafe',
    tags: ['material', 'surface', 'chrome-liquid'],
    field: `
vec2 chromeDomain = p;
vec2 q = chromeDomain + (0.12 + materialGlobalDepth * 0.025)
  * vec2(fbm(chromeDomain * 3.0 + t), fbm(chromeDomain * 3.0 - t));
float chromePhase = q.x * 8.0 + sin(q.y * 6.0 + t) * 3.0 + materialFractalInterference * 3.6;
float waves = sin(chromePhase);
float highlightPower = mix(12.0, 8.5, clamp(materialGlobalDepth + materialFractalRidge * 0.3, 0.0, 1.0));
float chromeMicro = 0.5 + 0.5 * sin(q.x * 23.0 - q.y * 15.0
  + materialFractalFine * 4.0 + materialFlowProgress * 4.0);
float highlight = pow(abs(waves), highlightPower) * mix(1.0, 0.72 + chromeMicro * 0.52, materialGlobalDepth);
float chromeBody = stroke(length(q) - 0.62, 0.04 + materialGlobalDepth * 0.012);
v += highlight + chromeBody;
v += highlight * chromeMicro * materialGlobalDepth * 0.28;
`,
  }),
  makeEffect({
    id: 'brushed-metal',
    title: 'Brushed Metal',
    titleJa: 'ヘアライン金属',
    categoryId: 'materials-surfaces',
    description: 'Layered steel hairlines catch a broad anisotropic studio light.',
    descriptionJa: '幾層もの金属ヘアラインが、幅広い異方性スタジオ光を受ける。',
    accentColor: '#a8b5c4',
    tags: ['material', 'surface', 'brushed-metal', 'anisotropic', 'steel'],
    field: `
vec2 brushedDomain = p;
vec2 q = rot(-0.08) * brushedDomain;
float coarse = fbm(vec2(q.x * 1.25 + t * 0.018, q.y * 42.0) + materialFractalWarp * 0.8);
float fine = noise(vec2(q.x * 3.0 - t * 0.035, q.y * (118.0 + uDetail * 8.0))
  + materialFractalWarp * vec2(2.0, 7.0));
float scratches = pow(max(0.0, fine - mix(0.58, 0.5, materialGlobalDepth)), 3.0) * 3.2;
float sweepCenter = sin(t * 0.34) * 1.08;
float sweep = exp(-pow((dot(q, normalize(vec2(0.88, 0.48))) - sweepCenter) / 0.34, 2.0));
float secondary = exp(-pow((dot(q, normalize(vec2(-0.72, 0.7))) + sweepCenter * 0.45) / 0.72, 2.0));
float longGrain = 0.5 + 0.5 * sin(q.y * (86.0 + uDetail * 4.0) + coarse * 5.0
  + materialFractalInterference * 8.0);
float satin = 0.5 + 0.5 * sin(q.y * 24.0 + coarse * 7.0);
v += 0.14 + coarse * 0.17 + longGrain * 0.055 + satin * 0.045 + scratches * 0.2;
v += sweep * (0.5 + longGrain * 0.28) + secondary * (0.12 + satin * 0.08);
v *= 1.0 - materialFlowWake * 0.08;
v += materialGlobalDepth * (0.035 + longGrain * 0.08);
`,
    color: `vec3(0.035, 0.045, 0.058) + mix(vec3(0.18, 0.23, 0.29), vec3(0.58, 0.68, 0.76), smoothstep(0.12, 1.0, shade)) * shade * 0.76 + vec3(0.84, 0.91, 0.96) * pow(clamp(shade, 0.0, 1.0), 3.2) * 0.34 + vec3(0.32, 0.2, 0.1) * pow(clamp(shade, 0.0, 1.0), 5.0) * 0.08`,
    post: `color *= 1.0 - smoothstep(0.92, 1.92, length(uv)) * 0.12;`,
    intensity: 1.08,
    motion: 0.78,
    detail: 2.7,
    atmosphere: 0.04,
    volumetric: 0,
  }),
  makeEffect({
    id: 'velvet-noise',
    title: 'Velvet Noise',
    titleJa: 'ベルベットノイズ',
    categoryId: 'materials-surfaces',
    description: 'Deep velvet folds reveal their nap only where a slow grazing light passes.',
    descriptionJa: '深いベルベットの襞を、ゆっくり横切る斜光だけが毛足ごと浮かび上がらせる。',
    accentColor: '#c45b8f',
    tags: ['material', 'surface', 'velvet-noise', 'fabric', 'nap', 'folds'],
    field: `
vec2 velvetDomain = p;
vec2 q = rot(-0.14) * velvetDomain;
float foldPhase = q.x * 4.65 + sin(q.y * 1.24 - t * 0.1) * 0.86;
foldPhase += materialFractalInterference * 0.34;
float fold = 0.5 + 0.5 * sin(foldPhase);
float subFold = 0.5 + 0.5 * sin(q.x * 8.7 - q.y * 0.82 + sin(q.y * 2.1) * 0.46
  + materialFractalInterference * 2.0);
float valley = pow(1.0 - fold, 2.65);
vec2 napSample = vec2(q.x * 9.0 + fold * 1.5, q.y * (36.0 + uDetail * 2.0) - t * 0.025);
napSample += materialFractalWarp * vec2(3.0, 10.0) + materialSideVector * materialFractalInterference * 4.0;
float nap = fbm(napSample);
float fiber = pow(max(0.0, noise(vec2(q.x * 31.0, q.y * 92.0) + materialFractalWarp * 8.0) - 0.66), 4.0) * 7.0;
float lightCenter = sin(t * 0.21) * 1.15;
float grazing = 0.19 + 0.81 * exp(-pow((q.x - lightCenter + valley * 0.18) / 0.62, 2.0));
float rim = pow(max(0.0, fold - 0.5), 3.0) * 2.3;
v += 0.065 + fold * 0.16 + subFold * 0.055 + valley * 0.045;
v += grazing * (0.24 + nap * 0.25 + rim * 0.24) + fiber * grazing * 0.09;
v *= 1.0 - materialFlowWake * 0.14;
v += materialGlobalDepth * (0.06 + grazing * 0.14 + nap * 0.08);
`,
    color: `vec3(0.024, 0.006, 0.018) + mix(vec3(0.16, 0.015, 0.055), vec3(0.48, 0.045, 0.22), smoothstep(0.08, 0.82, shade)) * shade * 0.9 + vec3(0.82, 0.18, 0.42) * pow(clamp(shade, 0.0, 1.0), 2.6) * 0.24 + vec3(0.96, 0.66, 0.38) * pow(clamp(shade, 0.0, 1.0), 5.0) * 0.12`,
    post: `
float clothFalloff = smoothstep(1.72, 0.18, length(uv * vec2(0.82, 1.0)));
color *= 0.7 + clothFalloff * 0.3;
`,
    intensity: 1.12,
    motion: 0.72,
    detail: 2.6,
    atmosphere: 0.03,
    volumetric: 0,
  }),
  makeEffect({
    id: 'marble-veins',
    title: 'Marble Veins',
    titleJa: '大理石脈',
    categoryId: 'materials-surfaces',
    description: 'Warm stone strata carry broad mineral veins and hairline fractures at different depths.',
    descriptionJa: '温かな石層の中を、深さの異なる鉱物脈と細い亀裂が走る。',
    accentColor: '#d8d3c8',
    tags: ['material', 'surface', 'marble-veins', 'stone', 'strata'],
    field: `
vec2 marbleDomain = p;
vec2 q = rot(0.16) * marbleDomain * (1.75 + uDetail * 0.06);
vec2 warp = vec2(fbm(q * 0.72 + vec2(t * 0.01, 3.2)), fbm(q * 0.86 + vec2(8.1, -t * 0.008))) - 0.5;
warp += materialFractalWarp * materialGlobalDepth * 0.52;
float stone = fbm(q + warp * 1.45);
float broadField = fbm(q * 1.08 + warp * (2.2 + materialGlobalDepth * 0.35) + 4.7)
  + materialFractalInterference * 0.42;
float broadVein = exp(-pow(abs(broadField - 0.48) / 0.055, 2.0));
float hairField = fbm(q * (2.35 + materialFractalRidge * 0.32) - warp * 1.4 + 12.0
  + materialFractalInterference * 1.8) + materialFractalInterference * 0.28;
float hairVein = exp(-pow(abs(hairField - 0.53) / 0.022, 2.0));
float pressureVein = exp(-pow(abs(broadField - mix(0.48, 0.43, materialGlobalDepth)) / 0.046, 2.0));
broadVein = mix(broadVein, max(broadVein, pressureVein), materialGlobalDepth * 0.72);
hairVein *= 1.0 + materialGlobalDepth * 0.42;
float mineralCloud = smoothstep(0.52, 0.82, fbm(q * 0.42 + warp * 0.8));
float studio = exp(-pow((dot(marbleDomain, normalize(vec2(0.78, 0.62))) - sin(t * 0.12) * 1.1) / 0.82, 2.0));
v += 0.3 + stone * 0.22 + mineralCloud * 0.12;
v += broadVein * 0.72 + hairVein * 0.32 + studio * 0.12;
v += materialGlobalDepth * (0.05 + pressureVein * 0.18);
`,
    color: `vec3(0.28, 0.27, 0.245) + mix(vec3(0.42, 0.4, 0.35), vec3(0.08, 0.11, 0.12), smoothstep(0.62, 1.05, shade)) * 0.72 + vec3(0.55, 0.44, 0.31) * smoothstep(0.48, 0.8, shade) * 0.12 + vec3(0.96, 0.94, 0.88) * pow(clamp(shade, 0.0, 1.0), 4.0) * 0.16`,
    post: `color *= 1.0 - smoothstep(1.08, 1.95, length(uv)) * 0.1;`,
    intensity: 1.04,
    motion: 0.42,
    detail: 2.4,
    atmosphere: 0.025,
    volumetric: 0,
  }),
  makeEffect({
    id: 'wet-asphalt',
    title: 'Wet Asphalt',
    titleJa: '濡れたアスファルト',
    categoryId: 'materials-surfaces',
    description: 'Continuous rain-dark asphalt holds broken cyan and amber street reflections.',
    descriptionJa: '雨で暗く沈んだ連続面に、シアンと琥珀の街灯反射が途切れながら映る。',
    accentColor: '#6fb7c8',
    tags: ['material', 'surface', 'wet-asphalt', 'puddles', 'street-light'],
    field: `
float asphaltRipple = materialFractalInterference
  + sin(materialScreenAcross * 3.2 - materialFlowProgress * 4.6) * materialFractalRidge * 0.28;
vec2 asphaltDomain = p;
vec2 q = rot(-0.06) * asphaltDomain;
float aggregate = fbm(q * (13.0 + uDetail * 1.6) + materialFractalWarp * 5.0);
float micro = noise(q * vec2(42.0, 56.0) + materialFractalWarp * 11.0);
float puddleField = fbm(q * 1.5 + vec2(t * 0.016, -t * 0.01) + materialFractalWarp * 0.7);
float puddle = 0.2 + 0.8 * smoothstep(0.38, 0.69, puddleField + asphaltRipple * 0.16);
float wetFilm = 0.2 + 0.8 * smoothstep(0.24, 0.72, fbm(q * 3.1 - vec2(t * 0.025, 0.0)));
float laneA = exp(-pow((q.x + 0.62 + sin(q.y * 1.3) * 0.08 + asphaltRipple * 0.1) / 0.16, 2.0));
float laneB = exp(-pow((q.x - 0.42 + sin(q.y * 1.1 + 2.0) * 0.1) / 0.2, 2.0));
float brokenA = pow(max(0.0, sin(q.y * 4.8 - t * 0.42 + aggregate * 2.6 + materialFractalInterference * 5.0)), 5.0);
float brokenB = pow(max(0.0, cos(q.y * 4.2 - t * 0.35 + micro * 1.8 - materialFractalInterference * 4.0)), 5.5);
float reflection = puddle * (laneA * (0.22 + brokenA) + laneB * (0.18 + brokenB) * 0.84);
float skySheen = exp(-pow((q.y + 0.18 + puddleField * 0.24) / 0.48, 2.0)) * wetFilm;
v += 0.105 + aggregate * 0.15 + micro * 0.04 + wetFilm * 0.13;
v += reflection * 0.9 + puddle * wetFilm * 0.11 + skySheen * 0.18;
v *= 1.0 - materialFlowWake * 0.1;
v += materialGlobalDepth * reflection * 0.22;
`,
    color: `vec3(0.012, 0.015, 0.018) + vec3(0.05, 0.065, 0.072) * shade + mix(vec3(0.0, 0.46, 0.62), vec3(0.95, 0.46, 0.08), smoothstep(-0.05, 0.55, uv.x)) * pow(clamp(shade, 0.0, 1.0), 2.2) * 0.72 + vec3(0.8, 0.9, 0.92) * pow(clamp(shade, 0.0, 1.0), 5.0) * 0.12`,
    post: `
float nearWet = smoothstep(1.0, -0.72, uv.y);
color *= 0.82 + nearWet * 0.18;
`,
    intensity: 1.1,
    motion: 0.74,
    detail: 2.7,
    atmosphere: 0.04,
    volumetric: 0,
  }),
  makeEffect({
    id: 'holographic-foil',
    title: 'Holographic Foil',
    titleJa: 'ホログラム箔',
    categoryId: 'materials-surfaces',
    description: 'Crumpled triangular foil facets split a moving white light into spectral color.',
    descriptionJa: '折れた三角箔の面が、移動する白色光をスペクトルへ分解する。',
    accentColor: '#e7b4ff',
    tags: ['material', 'surface', 'holographic-foil', 'facets', 'iridescence'],
    field: `
vec2 foilDomain = p;
vec2 q = rot(0.12) * foilDomain * (2.55 + uDetail * 0.08);
q += (vec2(fbm(q * 0.58 + 4.0), fbm(q * 0.64 + 11.0)) - 0.5) * 0.28
  + materialFractalWarp * materialGlobalDepth * 0.18;
vec2 cell = floor(q);
vec2 f = fract(q) - 0.5;
float diagonal = mix(f.x + f.y, f.x - f.y, step(0.5, hash21(cell)));
float ridgeA = lineGlow(abs(f.x) - 0.48, 0.025);
float ridgeB = lineGlow(abs(f.y) - 0.48, 0.025);
float ridgeC = lineGlow(abs(diagonal) - 0.48, 0.03);
float facetTilt = hash21(cell + 7.3) * 2.0 - 1.0;
facetTilt += materialFractalInterference * 2.4 + materialFractalRidge * facetTilt * 0.7;
float facetLight = 0.5 + 0.5 * sin(facetTilt * 2.4 + dot(f, normalize(vec2(0.78, 0.62))) * 2.2 - t * 0.46);
float sweep = exp(-pow((dot(foilDomain, normalize(vec2(0.72, -0.69))) - sin(t * 0.3) * 1.25) / 0.36, 2.0));
float crease = max(ridgeA, max(ridgeB, ridgeC));
v += 0.1 + facetLight * 0.42 + crease * 0.26 + sweep * (0.36 + facetLight * 0.46);
v *= 1.0 - materialFlowWake * 0.12;
v += materialGlobalDepth * facetLight * 0.16;
`,
    color: `vec3(0.03, 0.025, 0.045) + pal(uv.x * 0.42 - uv.y * 0.36 + shade * 0.52 + iTime * 0.065, vec3(0.44), vec3(0.38), vec3(1.0), vec3(0.02, 0.28, 0.58)) * shade * 0.86 + vec3(0.95, 0.98, 1.0) * pow(clamp(shade, 0.0, 1.0), 4.4) * 0.24`,
    post: `color *= 1.0 - smoothstep(1.12, 1.98, length(uv)) * 0.1;`,
    intensity: 1.06,
    motion: 0.82,
    detail: 2.5,
    atmosphere: 0.025,
    volumetric: 0,
  }),
  makeEffect({
    id: 'carbon-fiber',
    title: 'Carbon Fiber',
    titleJa: 'カーボンファイバー',
    categoryId: 'materials-surfaces',
    description: 'Alternating over-under carbon bundles form a raised twill beneath a moving clear coat.',
    descriptionJa: '上下に交差するカーボン束が綾織の段差を作り、透明層の反射がその上を走る。',
    accentColor: '#8391a2',
    tags: ['material', 'surface', 'carbon-fiber', 'twill', 'clear-coat'],
    field: `
vec2 carbonDomain = p;
vec2 q = rot(0.785398) * carbonDomain * (8.5 + uDetail * 0.55);
q += materialFractalWarp * materialGlobalDepth * 0.52;
vec2 cell = floor(q);
vec2 f = fract(q) - 0.5;
float compressedWidth = 0.16 + materialFractalInterference * 0.12 + materialFractalRidge * 0.045;
float warpBand = smoothstep(0.34, compressedWidth, abs(f.x));
float weftBand = smoothstep(0.34, compressedWidth, abs(f.y));
float over = mod(cell.x + cell.y, 2.0);
float warpTop = warpBand * mix(0.34, 0.72, over);
float weftTop = weftBand * mix(0.72, 0.34, over);
float bundleRidge = pow(max(0.0, cos(f.x * 8.4 + materialFractalInterference * 4.2)), 5.0) * warpTop;
bundleRidge += pow(max(0.0, cos(f.y * 8.4 - materialFractalInterference * 3.6)), 5.0) * weftTop;
float resinCenter = sin(t * 0.28) * 1.2;
float resinSweep = exp(-pow((dot(carbonDomain, normalize(vec2(0.8, 0.6))) - resinCenter) / 0.28, 2.0));
float micro = fbm(q * 2.4) * 0.08;
v += 0.08 + warpTop * 0.2 + weftTop * 0.18 + bundleRidge * 0.22 + micro;
v += resinSweep * (0.42 + (warpTop + weftTop) * 0.24);
v *= 1.0 - materialFlowWake * 0.08;
v += materialGlobalDepth * (0.045 + bundleRidge * 0.12);
`,
    color: `vec3(0.009, 0.012, 0.016) + vec3(0.08, 0.1, 0.13) * shade + vec3(0.28, 0.34, 0.4) * pow(clamp(shade, 0.0, 1.0), 2.3) * 0.48 + vec3(0.72, 0.82, 0.9) * pow(clamp(shade, 0.0, 1.0), 5.0) * 0.22 + vec3(0.18, 0.08, 0.035) * pow(clamp(shade, 0.0, 1.0), 3.4) * 0.1`,
    post: `color *= 1.0 - smoothstep(0.92, 1.92, length(uv)) * 0.18;`,
    intensity: 1.12,
    motion: 0.68,
    detail: 2.8,
    atmosphere: 0.02,
    volumetric: 0,
  }),
  makeEffect({
    id: 'ceramic-crackle',
    title: 'Ceramic Crackle',
    titleJa: '陶器の貫入',
    categoryId: 'materials-surfaces',
    description: 'Fine Voronoi crackle sits beneath a thick warm porcelain glaze.',
    descriptionJa: '細いVoronoi状の貫入を、厚く温かな磁器釉が覆う。',
    accentColor: '#f3d9aa',
    tags: ['material', 'surface', 'ceramic-crackle', 'porcelain', 'glaze'],
    field: `
vec2 ceramicDomain = p;
vec2 q = ceramicDomain * (6.35 + uDetail * 0.44);
vec2 cell = floor(q);
vec2 f = fract(q);
float nearest = 10.0;
float secondNearest = 10.0;
for (int y = -1; y <= 1; y++) {
  for (int x = -1; x <= 1; x++) {
    vec2 offset = vec2(float(x), float(y));
    vec2 feature = offset + hash22(cell + offset);
    feature += (hash22(cell + offset + 17.0) - 0.5)
      * (materialFractalInterference * 0.28 + materialFractalRidge * 0.09);
    float distanceToFeature = length(feature - f);
    if (distanceToFeature < nearest) {
      secondNearest = nearest;
      nearest = distanceToFeature;
    } else if (distanceToFeature < secondNearest) {
      secondNearest = distanceToFeature;
    }
  }
}
float edgeDistance = secondNearest - nearest;
float stressWave = (0.5 + 0.5 * sin(materialFractalMid * 8.0 - materialFlowProgress * 4.2))
  * materialFractalRidge;
edgeDistance -= stressWave * 0.032 + materialFractalInterference * 0.038;
float crack = 1.0 - smoothstep(0.014, 0.048, edgeDistance);
float clayCloud = fbm(ceramicDomain * 1.55 + vec2(t * 0.008, -t * 0.005));
float glazeSweep = exp(-pow((dot(ceramicDomain, normalize(vec2(0.74, 0.67))) - sin(t * 0.18) * 1.05) / 0.58, 2.0));
float glaze = (0.61 + clayCloud * 0.16 + glazeSweep * 0.2)
  * (1.0 - materialFlowWake * 0.1);
v += glaze * (1.0 - crack * 0.82) + crack * 0.055;
v += materialGlobalDepth * glazeSweep * 0.08;
`,
    color: `mix(vec3(0.028, 0.024, 0.021), vec3(0.68, 0.69, 0.61), smoothstep(0.07, 0.66, shade)) + vec3(0.34, 0.19, 0.08) * smoothstep(0.18, 0.5, shade) * 0.08 + vec3(1.0, 0.92, 0.74) * pow(clamp(shade, 0.0, 1.0), 4.4) * 0.15`,
    post: `color *= 1.0 - smoothstep(1.0, 1.92, length(uv)) * 0.14;`,
    intensity: 1.04,
    motion: 0.48,
    detail: 2.5,
    atmosphere: 0.025,
    volumetric: 0,
  }),
]
