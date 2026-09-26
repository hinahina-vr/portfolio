import type { CategoryId, EffectControl, EffectDefinition } from './types'
import { categoryById } from './categories'

export const rangeControl = (
  id: string,
  label: string,
  uniform: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number,
): EffectControl => ({
  kind: 'range',
  id,
  label,
  uniform,
  min,
  max,
  step,
  defaultValue,
})

export const colorControl = (
  id: string,
  label: string,
  uniform: string,
  defaultValue: string,
): EffectControl => ({
  kind: 'color',
  id,
  label,
  uniform,
  defaultValue,
})

export const toggleControl = (
  id: string,
  label: string,
  uniform: string,
  defaultValue: boolean,
): EffectControl => ({
  kind: 'toggle',
  id,
  label,
  uniform,
  defaultValue,
})

export type ShaderRecipe = {
  id: string
  title: string
  titleJa: string
  categoryId: CategoryId
  description: string
  descriptionJa: string
  accentColor: string
  tags: string[]
  field: string
  warp?: string
  color?: string
  post?: string
  intensity?: number
  motion?: number
  detail?: number
  atmosphere?: number
  volumetric?: number
  waterClarity?: number
  audioReactive?: boolean
  renderer?: EffectDefinition['renderer']
  extraControls?: EffectControl[]
}

const sharedGlsl = `
float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 19.19));
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += noise(p) * a;
    p = rot(0.72) * p * 2.03 + 17.3;
    a *= 0.52;
  }
  return v;
}

float stroke(float d, float width) {
  return smoothstep(width, 0.0, abs(d));
}

float glow(float d, float width) {
  return exp(-(d * d) / max(width * width, 0.0001));
}

float lineGlow(float d, float width) {
  return exp(-abs(d) / max(width, 0.0001));
}

float fill(float d) {
  return smoothstep(0.02, -0.02, d);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdHex(vec2 p, float r) {
  p = abs(p);
  return max(dot(p, normalize(vec2(1.0, 1.73))), p.x) - r;
}

float gestureBurst(
  vec2 p,
  vec2 origin,
  vec2 direction,
  float age,
  float seedOffset,
  float spread,
  float size
) {
  if (age > 1.05) {
    return 0.0;
  }
  vec2 tangent = normalize(direction + vec2(0.0001, 0.0));
  vec2 normal = vec2(-tangent.y, tangent.x);
  float particles = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 seed = hash22(vec2(fi + seedOffset, seedOffset * 2.37 + 11.0));
    float localAge = age * (0.92 + seed.y * 0.36) - seed.x * 0.22;
    float alive = smoothstep(0.0, 0.055, localAge) * (1.0 - smoothstep(0.62, 0.96, localAge));
    vec2 pos = origin + tangent * localAge * (0.42 + seed.y * 0.72);
    pos += normal * (seed.x - 0.5) * spread * (0.38 + localAge * 1.28);
    pos += normal * sin(localAge * (7.0 + seed.x * 5.0) + seed.y * 6.283) * spread * 0.15;
    vec2 q = rot((seed.x - 0.5) * 1.4) * (p - pos);
    float radius = size * mix(0.62, 1.38, seed.y) * (1.0 - localAge * 0.38);
    float shard = exp(-pow(abs(q.x) / max(radius * 2.7, 0.001), 3.0)
      - pow(abs(q.y) / max(radius * 0.42, 0.001), 2.0));
    float core = exp(-dot(q, q) / max(radius * radius * 0.16, 0.0001));
    particles += alive * (shard * 0.72 + core * 0.42);
  }
  return particles;
}

vec3 pal(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
`.trim()

const glslFloat = (value: number) => (Number.isInteger(value) ? value.toFixed(1) : String(value))

export const buildFragment = (recipe: ShaderRecipe) => `
uniform float uIntensity;
uniform float uMotion;
uniform float uDetail;
uniform vec3 uPrimary;

${sharedGlsl}

float scene(vec2 p, float t) {
  float v = 0.0;
${recipe.categoryId === 'materials-surfaces' ? `
  float materialVelocity = clamp(iPointerMotion.z, 0.0, 1.5);
  float materialInertia = iPointerMotion.w;
  vec2 materialVelocityVector = iPointerMotion.xy / max(materialVelocity, 0.001);
  vec2 materialSideVector = vec2(-materialVelocityVector.y, materialVelocityVector.x);
  float materialSpeedWeight = smoothstep(0.035, 1.15, materialVelocity);
  float materialFade = smoothstep(0.08, 0.9, pow(materialInertia, 0.64));
  float materialMomentum = materialSpeedWeight * materialFade;
  float materialFlowProgress = smoothstep(0.0, 0.92, 1.0 - materialInertia);
  float materialScreenAlong = dot(p, materialVelocityVector);
  float materialScreenAcross = dot(p, materialSideVector);
  float materialFrontCenter = mix(-1.7, 1.7, materialFlowProgress);
  float materialFlowFront = exp(-pow((materialScreenAlong - materialFrontCenter) / 0.72, 2.0))
    * materialMomentum;
  float materialFlowWake = exp(-pow((materialScreenAlong - materialFrontCenter + 0.68) / 1.28, 2.0))
    * materialMomentum;
  float materialGlobalFlow = clamp(materialMomentum * 0.24 + materialFlowFront * 0.76
    + materialFlowWake * 0.34, 0.0, 1.35);
  float materialGlobalDepth = clamp(materialMomentum * 0.16 + materialFlowFront * 0.52
    + materialFlowWake * 0.44, 0.0, 1.2);
  float materialGlobalShear = sin(materialScreenAcross * 2.15 + materialFlowProgress * 4.4)
    * materialGlobalFlow;
  vec2 materialFractalDrift = materialVelocityVector * materialFlowProgress * 1.35
    + materialSideVector * materialGlobalShear * 0.12;
  vec2 materialFractalWarp = vec2(
    fbm(p * 1.35 + materialFractalDrift + vec2(3.1, 7.4)),
    fbm(p * 1.72 - materialFractalDrift.yx + vec2(9.2, 1.8))
  ) - 0.5;
  float materialFractalCoarse = fbm(p * 1.8 + materialFractalWarp * 0.42 + materialFractalDrift);
  float materialFractalMid = fbm(p * 5.2 + materialFractalWarp * 1.35 - materialFractalDrift.yx * 1.4);
  float materialFractalFine = noise(p * 19.0 + materialFractalWarp * 4.2 + materialFractalDrift * 3.0);
  float materialFractalInterference = (
    materialFractalCoarse * 0.48 + materialFractalMid * 0.34 + materialFractalFine * 0.18 - 0.5
  ) * materialGlobalDepth;
  float materialFractalRidge = smoothstep(0.1, 0.42, abs(materialFractalMid - materialFractalCoarse))
    * materialGlobalDepth;` : ''}
${recipe.field
  .trim()
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  vec2 mouse = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
  float t = iTime * uMotion;
  float waterClarity = ${glslFloat(recipe.waterClarity ?? 0)};
  float depthCue = clamp(0.45 + uv.y * 0.28 + length(uv) * 0.16, 0.0, 1.0);
  float perspectiveDepth = clamp(1.0 + uv.y * 0.24 + length(uv) * 0.08, 0.78, 1.42);
  vec2 p = vec2(uv.x / perspectiveDepth, uv.y * mix(1.08, 0.9, depthCue));
  float pointer = step(0.001, length(iMouse.zw));
  p += pointer * (mouse - p) * ${recipe.categoryId === 'aquatic' || recipe.categoryId === 'materials-surfaces' ? '0.0' : '0.08'};
${(recipe.warp ?? 'p *= 1.0 + 0.04 * sin(t + length(uv) * 3.0);')
  .trim()
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
  float v = scene(p, t);
  float shade = clamp(v * uIntensity, 0.0, 1.8);
  float mask = smoothstep(1.65, 0.1, length(uv));
  float fogField = fbm(uv * vec2(1.25, 0.85) + vec2(t * 0.035, -t * 0.025));
  float atmoFog = smoothstep(0.26, 1.08, fogField + depthCue * 0.62) * mask;
  float volumetric = pow(max(0.0, sin((uv.x * 0.9 + uv.y * 0.22) * 4.6 + t * 0.16 + fogField * 2.1)), 5.0);
  volumetric *= smoothstep(1.75, 0.18, length(uv * vec2(0.72, 1.0))) * mask;
  float daylight = smoothstep(-1.15, 1.05, uv.y);
  vec3 clearWater = mix(vec3(0.018, 0.125, 0.205), vec3(0.045, 0.34, 0.42), daylight);
  vec3 base = mix(vec3(0.006, 0.009, 0.015), clearWater, waterClarity);
  vec3 color = base + ${recipe.color ?? 'uPrimary * shade * mask + pal(shade, vec3(0.25), vec3(0.35), vec3(1.0), vec3(0.0, 0.12, 0.24)) * shade * 0.34'};
${(recipe.post ?? 'color += vec3(0.018, 0.026, 0.038) * (1.0 - length(uv) * 0.35);')
  .trim()
  .split('\n')
  .map((line) => `  ${line}`)
  .join('\n')}
  vec3 fogColor = mix(vec3(0.012, 0.018, 0.03), uPrimary * 0.28 + vec3(0.035, 0.05, 0.075), 0.65 + depthCue * 0.35);
  color = mix(color, fogColor, atmoFog * 0.22 * ${glslFloat(recipe.atmosphere ?? (recipe.categoryId === 'aquatic' ? 0.42 : 1))});
  color += fogColor * atmoFog * 0.16 * ${glslFloat(recipe.atmosphere ?? (recipe.categoryId === 'aquatic' ? 0.42 : 1))};
  color += (uPrimary * 0.45 + vec3(0.22, 0.28, 0.36)) * volumetric * (0.14 + clamp(shade, 0.0, 1.0) * 0.18) * ${glslFloat(recipe.volumetric ?? (recipe.categoryId === 'aquatic' ? 0.2 : 1))};
  color += uPrimary * pow(clamp(shade, 0.0, 1.0), 2.0) * 0.16;
  float clearFlow = fbm(uv * vec2(1.22, 0.72) + vec2(t * 0.12, -t * 0.055));
  float broadCurrent = 0.5 + 0.5 * sin(uv.x * 2.45 + uv.y * 1.18 + clearFlow * 2.5 - t * 0.78);
  float surfaceLight = pow(max(0.0, sin(uv.x * 5.2 + uv.y * 1.65 + clearFlow * 3.2 - t * 0.72)), 9.0) * mask;
  float sunShelf = smoothstep(-0.35, 1.0, uv.y) * (0.35 + 0.65 * broadCurrent);
  color += waterClarity * (
    clearWater * (0.07 + broadCurrent * 0.08)
    + vec3(0.02, 0.16, 0.19) * clearFlow * 0.24
    + vec3(0.15, 0.42, 0.34) * surfaceLight * 0.22
    + vec3(0.06, 0.2, 0.2) * sunShelf * 0.08
  );
  color *= 1.0 - smoothstep(1.25, 1.9, length(uv)) * mix(0.38, 0.14, waterClarity);
${recipe.categoryId === 'aquatic' ? '  color = color / (vec3(1.0) + color * mix(0.62, 0.3, waterClarity));\n  color *= mix(1.22, 1.38, waterClarity);' : ''}
  fragColor = vec4(pow(max(color, 0.0), vec3(${recipe.categoryId === 'aquatic' ? 'mix(0.94, 0.86, waterClarity)' : '0.9'})), 1.0);
}
`

export const makeEffect = (recipe: ShaderRecipe): EffectDefinition => {
  const category = categoryById[recipe.categoryId]

  return {
    id: recipe.id,
    title: recipe.title,
    titleJa: recipe.titleJa,
    categoryId: recipe.categoryId,
    category: category.label,
    description: recipe.description,
    descriptionJa: recipe.descriptionJa,
    accentColor: recipe.accentColor,
    tags: recipe.tags,
    fragment: buildFragment(recipe),
    audioReactive: recipe.audioReactive,
    renderer: recipe.renderer,
    controls: [
      rangeControl('intensity', 'Intensity / 強度', 'uIntensity', 0.25, 2.5, 0.01, recipe.intensity ?? 1.1),
      rangeControl('motion', 'Motion / 動き', 'uMotion', 0.05, 2.8, 0.01, recipe.motion ?? 1),
      rangeControl('detail', 'Detail / 密度', 'uDetail', 0.4, 5.0, 0.01, recipe.detail ?? 2.2),
      colorControl('primary', 'Color / 色', 'uPrimary', recipe.accentColor),
      ...(recipe.extraControls ?? []),
    ],
  }
}
