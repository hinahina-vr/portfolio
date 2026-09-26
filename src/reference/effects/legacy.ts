export type RangeControl = {
  kind: 'range'
  id: string
  label: string
  uniform: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export type ColorControl = {
  kind: 'color'
  id: string
  label: string
  uniform: string
  defaultValue: string
}

export type ToggleControl = {
  kind: 'toggle'
  id: string
  label: string
  uniform: string
  defaultValue: boolean
}

export type EffectControl = RangeControl | ColorControl | ToggleControl
export type ControlValue = number | string | boolean
export type ControlValues = Record<string, ControlValue>

export type EffectDefinition = {
  id: string
  title: string
  category: string
  description: string
  accentColor: string
  fragment: string
  controls: EffectControl[]
}

export const createDefaultValues = (effect: EffectDefinition): ControlValues =>
  effect.controls.reduce<ControlValues>((values, control) => {
    values[control.id] = control.defaultValue
    return values
  }, {})

export const effects: EffectDefinition[] = [
  {
    id: 'particle-bloom',
    title: 'Particle Bloom',
    category: 'Game VFX',
    description: 'Layered sparks with soft bloom falloff and mouse gravity.',
    accentColor: '#f8d35d',
    controls: [
      {
        kind: 'range',
        id: 'density',
        label: 'Density',
        uniform: 'uDensity',
        min: 18,
        max: 88,
        step: 1,
        defaultValue: 54,
      },
      {
        kind: 'range',
        id: 'energy',
        label: 'Energy',
        uniform: 'uEnergy',
        min: 0.45,
        max: 2.3,
        step: 0.01,
        defaultValue: 1.25,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Tint',
        uniform: 'uPrimary',
        defaultValue: '#ffd56f',
      },
    ],
    fragment: `
uniform float uDensity;
uniform float uEnergy;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 19.19));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  vec2 pointer = (iMouse.xy * 2.0 - iResolution.xy) / iResolution.y;
  vec3 color = vec3(0.004, 0.008, 0.014);
  float activePointer = step(0.001, length(iMouse.zw));

  for (int i = 0; i < 90; i++) {
    float fi = float(i);
    if (fi > uDensity) {
      break;
    }

    vec2 seed = vec2(fi * 1.71, fi * 0.37);
    vec2 base = hash22(seed) * 2.0 - 1.0;
    float drift = iTime * (0.22 + 0.03 * hash21(seed + 7.0)) * uEnergy;
    vec2 orbit = vec2(sin(drift + fi), cos(drift * 1.27 + fi * 0.44));
    vec2 p = base + 0.36 * orbit;
    p.x *= iResolution.x / iResolution.y;
    p += activePointer * (pointer - p) * (0.18 + 0.08 * sin(iTime + fi));

    float d = length(uv - p);
    float core = 0.0035 / max(d * d, 0.0008);
    float halo = smoothstep(0.24, 0.0, d) * 0.18;
    vec3 spark = mix(uPrimary, vec3(0.56, 0.96, 1.0), hash21(seed + 3.2));
    color += spark * (core + halo) * (0.45 + 0.65 * sin(iTime * 2.0 + fi * 2.13));
  }

  color = 1.0 - exp(-color * (0.9 + uEnergy));
  color += vec3(0.015, 0.025, 0.035) * (1.0 - length(uv) * 0.32);
  fragColor = vec4(pow(color, vec3(0.9)), 1.0);
}
`,
  },
  {
    id: 'fish-school',
    title: 'Fish School',
    category: 'Aquatic',
    description: 'Procedural fish silhouettes flowing as a coordinated school.',
    accentColor: '#53d6c9',
    controls: [
      {
        kind: 'range',
        id: 'school',
        label: 'School size',
        uniform: 'uSchool',
        min: 24,
        max: 96,
        step: 1,
        defaultValue: 88,
      },
      {
        kind: 'range',
        id: 'current',
        label: 'Current',
        uniform: 'uCurrent',
        min: 0.3,
        max: 2.4,
        step: 0.01,
        defaultValue: 1.15,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Body',
        uniform: 'uPrimary',
        defaultValue: '#5eead4',
      },
    ],
    fragment: `
uniform float uSchool;
uniform float uCurrent;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(234.21, 98.73));
  p += dot(p, p + 31.45);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 11.73));
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float fishBody(vec2 p, float swim) {
  p.y += sin(swim + p.x * 12.0) * 0.018;
  float body = smoothstep(1.0, 0.0, length(p / vec2(0.22, 0.064)));
  vec2 tailP = p - vec2(-0.19, 0.0);
  tailP = rot(sin(swim) * 0.42) * tailP;
  float tail = smoothstep(0.08, 0.0, abs(tailP.x) + abs(tailP.y) * 2.2);
  float nose = smoothstep(0.075, 0.0, length((p - vec2(0.19, 0.0)) / vec2(1.0, 0.6)));
  return max(max(body, tail * 0.8), nose * 0.35);
}

vec2 schoolPath(float fi, float t, float layer) {
  float turn = t * (0.22 + layer * 0.08) + fi * 0.087;
  float side = sin(fi * 1.91) * 0.16;
  vec2 center = vec2(sin(t * 0.18) * 0.18, sin(t * 0.13 + 1.2) * 0.08);
  vec2 flow = vec2(cos(turn) * (0.45 + layer * 0.2), sin(turn * 1.23 + side) * (0.22 + layer * 0.08));
  vec2 ribbon = vec2(
    sin(turn * 0.58 + fi * 0.41) * 0.18,
    sin(turn * 0.77 + fi * 0.29) * 0.1
  );
  return center + flow + ribbon;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  vec3 water = mix(vec3(0.004, 0.018, 0.032), vec3(0.015, 0.12, 0.15), uv.y * 0.42 + 0.56);
  vec3 color = water;

  float caustics = 0.0;
  for (int c = 0; c < 4; c++) {
    float fc = float(c);
    caustics += smoothstep(0.88, 1.0, sin((uv.x * 1.8 + uv.y * 0.6 + fc) * 8.0 + iTime * (0.55 + fc * 0.13)) * 0.5 + 0.5) * 0.035;
  }
  color += vec3(0.03, 0.12, 0.13) * caustics;
  color += vec3(0.02, 0.08, 0.1) * smoothstep(1.4, 0.15, length(uv + vec2(0.2, 0.0)));

  float nearShimmer = 0.0;
  for (int i = 0; i < 100; i++) {
    float fi = float(i);
    if (fi >= uSchool) {
      break;
    }

    vec2 seed = vec2(fi * 12.31, fi * 5.17);
    vec2 h = hash22(seed);
    float layer = h.x;
    float depth = mix(0.62, 1.18, layer);
    float t = iTime * uCurrent + h.y * 7.0;
    vec2 pos = schoolPath(fi, t, layer);
    pos += (h - 0.5) * vec2(0.1, 0.075);

    vec2 nextPos = schoolPath(fi, t + 0.035, layer);
    vec2 dir = normalize(nextPos - pos + vec2(0.001, 0.0));
    float angle = atan(dir.y, dir.x);
    vec2 local = rot(-angle) * ((uv - pos) * depth);
    float scale = mix(0.17, 0.09, layer) * (0.9 + 0.16 * sin(fi));
    local /= scale;

    float swim = iTime * (8.0 + layer * 5.0) * uCurrent + fi * 1.7;
    float fish = fishBody(local, swim);
    float silhouette = smoothstep(0.018, 0.0, abs(local.y)) * smoothstep(0.5, -0.18, local.x) * smoothstep(-0.4, 0.24, local.x);
    float glint = smoothstep(0.032, 0.0, abs(local.y - 0.02)) * smoothstep(-0.18, 0.22, local.x) * smoothstep(0.42, -0.08, local.x);
    vec3 body = mix(uPrimary * vec3(0.16, 0.34, 0.31), vec3(0.84, 1.0, 0.92), glint * (0.45 + layer));
    body *= mix(0.5, 1.22, 1.0 - layer);
    color = mix(color, body, fish * (0.82 + (1.0 - layer) * 0.16));
    color += vec3(0.65, 1.0, 0.9) * glint * fish * 0.24;
    nearShimmer += silhouette * fish * (1.0 - layer) * 0.026;
  }

  color += vec3(0.2, 0.9, 0.78) * nearShimmer;
  color += vec3(0.006, 0.04, 0.055) * smoothstep(1.3, -0.3, length(uv));
  color *= 1.0 - smoothstep(0.85, 1.75, length(uv)) * 0.42;
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'bubble-rise',
    title: 'Bubble Rise',
    category: 'Aquatic',
    description: 'Rising glass bubbles with refractive rims and underwater haze.',
    accentColor: '#78bfff',
    controls: [
      {
        kind: 'range',
        id: 'bubbles',
        label: 'Bubbles',
        uniform: 'uBubbles',
        min: 10,
        max: 56,
        step: 1,
        defaultValue: 34,
      },
      {
        kind: 'range',
        id: 'lift',
        label: 'Lift',
        uniform: 'uLift',
        min: 0.25,
        max: 2.2,
        step: 0.01,
        defaultValue: 1.1,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Rim',
        uniform: 'uPrimary',
        defaultValue: '#93c5fd',
      },
    ],
    fragment: `
uniform float uBubbles;
uniform float uLift;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(113.4, 271.9));
  p += dot(p, p + 42.7);
  return fract(p.x * p.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  vec3 color = mix(vec3(0.008, 0.028, 0.055), vec3(0.02, 0.17, 0.22), uv.y * 0.45 + 0.55);
  color += vec3(0.015, 0.06, 0.08) * sin(uv.y * 13.0 + iTime * 0.45);

  for (int i = 0; i < 58; i++) {
    float fi = float(i);
    if (fi > uBubbles) {
      break;
    }

    vec2 seed = vec2(fi * 4.17, fi * 9.91);
    float r = mix(0.025, 0.105, hash21(seed));
    vec2 p = vec2(mix(-1.35, 1.35, hash21(seed + 2.0)), -1.18);
    p.y += fract(iTime * (0.05 + hash21(seed + 6.0) * 0.085) * uLift + hash21(seed + 9.0)) * 2.5;
    p.x += sin(iTime * (0.9 + hash21(seed + 1.0)) + fi) * 0.12;
    p.y -= 0.12;

    vec2 q = uv - p;
    q.x *= 0.9 + 0.15 * sin(iTime + fi);
    float d = length(q);
    float ring = smoothstep(r * 1.08, r * 0.92, d) - smoothstep(r * 0.72, r * 0.54, d);
    float gleam = smoothstep(r * 0.32, 0.0, length(q - vec2(-r * 0.32, r * 0.35)));
    float shadow = smoothstep(r * 1.45, 0.0, d) * 0.08;

    color += uPrimary * ring * 0.75;
    color += vec3(1.0) * gleam * 0.24;
    color -= vec3(0.0, 0.08, 0.11) * shadow;
  }

  float vignette = smoothstep(1.55, 0.15, length(uv));
  fragColor = vec4(color * (0.72 + vignette * 0.45), 1.0);
}
`,
  },
  {
    id: 'water-caustics',
    title: 'Water Caustics',
    category: 'Light Field',
    description: 'Folded sine fields that resemble refracted light under water.',
    accentColor: '#8fe388',
    controls: [
      {
        kind: 'range',
        id: 'scale',
        label: 'Scale',
        uniform: 'uScale',
        min: 1.2,
        max: 6.5,
        step: 0.01,
        defaultValue: 3.4,
      },
      {
        kind: 'range',
        id: 'speed',
        label: 'Speed',
        uniform: 'uSpeed',
        min: 0.15,
        max: 2.0,
        step: 0.01,
        defaultValue: 0.86,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Light',
        uniform: 'uPrimary',
        defaultValue: '#bbf7d0',
      },
    ],
    fragment: `
uniform float uScale;
uniform float uSpeed;
uniform vec3 uPrimary;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 q = p * uScale;

  float field = 0.0;
  float weight = 0.5;
  for (int i = 0; i < 5; i++) {
    q += vec2(sin(q.y + t * 1.4), cos(q.x - t * 1.1)) * 0.42;
    field += abs(sin(q.x + sin(q.y + t))) * weight;
    q = mat2(0.82, -0.57, 0.57, 0.82) * q * 1.18;
    weight *= 0.58;
  }

  float caustic = pow(max(0.0, 1.0 - field), 4.5);
  vec3 base = mix(vec3(0.015, 0.075, 0.08), vec3(0.025, 0.2, 0.17), uv.y);
  vec3 color = base + uPrimary * caustic * 1.75;
  color += vec3(0.02, 0.1, 0.07) * smoothstep(0.8, -0.2, length(p));
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'ember-flame',
    title: 'Ember Flame',
    category: 'Game VFX',
    description: 'Stylized flame turbulence with sparks peeling off the plume.',
    accentColor: '#ff8a4c',
    controls: [
      {
        kind: 'range',
        id: 'heat',
        label: 'Heat',
        uniform: 'uHeat',
        min: 0.45,
        max: 2.4,
        step: 0.01,
        defaultValue: 1.35,
      },
      {
        kind: 'range',
        id: 'turbulence',
        label: 'Turbulence',
        uniform: 'uTurbulence',
        min: 0.2,
        max: 2.0,
        step: 0.01,
        defaultValue: 1.05,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Core',
        uniform: 'uPrimary',
        defaultValue: '#fb923c',
      },
    ],
    fragment: `
uniform float uHeat;
uniform float uTurbulence;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.5);
  return fract(p.x * p.y);
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
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.52;
  }
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  uv.y += 0.55;
  float t = iTime * (0.75 + uHeat * 0.18);
  vec2 flow = uv;
  flow.x += sin(uv.y * 4.0 + t * 3.0) * 0.18 * uTurbulence;

  float n = fbm(flow * vec2(2.7, 1.8) - vec2(0.0, t * 2.4));
  float plume = smoothstep(0.95, 0.12, abs(flow.x) + uv.y * 0.55);
  float flame = smoothstep(0.18, 0.88, n + plume - uv.y * 0.62);
  float core = smoothstep(0.42, 1.0, flame - abs(flow.x) * 0.44);

  vec3 color = vec3(0.01, 0.006, 0.005);
  color += mix(vec3(0.35, 0.03, 0.01), uPrimary, flame) * flame * uHeat;
  color += vec3(1.0, 0.82, 0.38) * core;

  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    vec2 seed = vec2(fi * 3.1, fi * 6.7);
    vec2 p = vec2(hash21(seed) * 2.0 - 1.0, -0.62 + fract(hash21(seed + 8.0) + iTime * (0.08 + hash21(seed) * 0.08)) * 1.8);
    p.x += sin(iTime * 2.0 + fi) * 0.12;
    float spark = smoothstep(0.035, 0.0, length(uv - p));
    color += vec3(1.0, 0.62, 0.24) * spark * (0.4 + 0.6 * hash21(seed + 2.0));
  }

  fragColor = vec4(1.0 - exp(-color), 1.0);
}
`,
  },
  {
    id: 'nebula-dust',
    title: 'Nebula Dust',
    category: 'Cosmic',
    description: 'Deep procedural fog with star dust and slow rotational parallax.',
    accentColor: '#b28cff',
    controls: [
      {
        kind: 'range',
        id: 'depth',
        label: 'Depth',
        uniform: 'uDepth',
        min: 0.6,
        max: 2.4,
        step: 0.01,
        defaultValue: 1.35,
      },
      {
        kind: 'range',
        id: 'twist',
        label: 'Twist',
        uniform: 'uTwist',
        min: 0.1,
        max: 2.8,
        step: 0.01,
        defaultValue: 1.2,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Glow',
        uniform: 'uPrimary',
        defaultValue: '#c4b5fd',
      },
    ],
    fragment: `
uniform float uDepth;
uniform float uTwist;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(421.3, 173.7));
  p += dot(p, p + 51.3);
  return fract(p.x * p.y);
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
  float a = 0.55;
  for (int i = 0; i < 6; i++) {
    v += noise(p) * a;
    p = mat2(1.2, -1.45, 1.45, 1.2) * p;
    a *= 0.52;
  }
  return v;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float r = length(uv);
  float a = atan(uv.y, uv.x) + r * uTwist - iTime * 0.08;
  vec2 spiral = vec2(cos(a), sin(a)) * r;
  float cloud = fbm(spiral * 2.2 * uDepth + iTime * 0.04);
  float cloud2 = fbm(spiral * 5.0 - iTime * 0.025);
  float glow = smoothstep(0.95, 0.12, r) * (0.4 + cloud);

  vec3 color = vec3(0.005, 0.005, 0.018);
  color += mix(vec3(0.05, 0.12, 0.25), uPrimary, cloud) * glow;
  color += vec3(0.95, 0.35, 0.62) * pow(cloud2, 5.0) * 0.65;

  vec2 cell = floor(fragCoord / 3.0);
  float star = step(0.996, hash21(cell));
  float sparkle = star * (0.55 + 0.45 * sin(iTime * 4.0 + hash21(cell + 2.0) * 6.28));
  color += vec3(0.8, 0.9, 1.0) * sparkle;

  fragColor = vec4(pow(color, vec3(0.82)), 1.0);
}
`,
  },
  {
    id: 'warp-tunnel',
    title: 'Warp Tunnel',
    category: 'Motion',
    description: 'A fast radial tunnel with chromatic depth and ring pulses.',
    accentColor: '#67e8f9',
    controls: [
      {
        kind: 'range',
        id: 'velocity',
        label: 'Velocity',
        uniform: 'uVelocity',
        min: 0.35,
        max: 3.2,
        step: 0.01,
        defaultValue: 1.45,
      },
      {
        kind: 'range',
        id: 'rings',
        label: 'Rings',
        uniform: 'uRings',
        min: 4,
        max: 18,
        step: 0.01,
        defaultValue: 9.5,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Streak',
        uniform: 'uPrimary',
        defaultValue: '#22d3ee',
      },
    ],
    fragment: `
uniform float uVelocity;
uniform float uRings;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(283.1, 617.7));
  p += dot(p, p + 19.8);
  return fract(p.x * p.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  float t = iTime * uVelocity;
  float tunnel = 1.0 / max(r, 0.08);
  vec2 grid = vec2(a / 6.28318 * uRings + t * 0.18, tunnel + t);
  float lines = smoothstep(0.94, 1.0, sin(grid.x * 6.28318) * 0.5 + 0.5);
  float rings = smoothstep(0.84, 1.0, sin(grid.y * 3.2) * 0.5 + 0.5);

  vec3 color = vec3(0.006, 0.008, 0.016);
  color += uPrimary * lines * rings * tunnel * 0.1;
  color += vec3(0.5, 0.13, 0.95) * rings * 0.35;
  color += vec3(0.95, 0.9, 0.55) * lines * 0.12;

  for (int i = 0; i < 36; i++) {
    float fi = float(i);
    float ray = abs(sin(a * (3.0 + hash21(vec2(fi)) * 10.0) + fi));
    float lane = smoothstep(0.997, 1.0, ray);
    float depth = fract(t * (0.2 + hash21(vec2(fi, 4.0)) * 0.5) + hash21(vec2(fi, 8.0)));
    color += uPrimary * lane * smoothstep(0.05, 0.0, abs(r - depth)) * 0.12;
  }

  color *= smoothstep(1.1, 0.1, r);
  fragColor = vec4(1.0 - exp(-color * 1.4), 1.0);
}
`,
  },
  {
    id: 'prism-glitch',
    title: 'Prism Glitch',
    category: 'Post FX',
    description: 'Scanline displacement and chromatic wedges for screen effects.',
    accentColor: '#ff6fae',
    controls: [
      {
        kind: 'range',
        id: 'shift',
        label: 'Shift',
        uniform: 'uShift',
        min: 0.05,
        max: 1.5,
        step: 0.01,
        defaultValue: 0.7,
      },
      {
        kind: 'range',
        id: 'scan',
        label: 'Scan',
        uniform: 'uScan',
        min: 0.1,
        max: 2.2,
        step: 0.01,
        defaultValue: 1.0,
      },
      {
        kind: 'toggle',
        id: 'invert',
        label: 'Invert pulse',
        uniform: 'uInvert',
        defaultValue: false,
      },
      {
        kind: 'color',
        id: 'primary',
        label: 'Signal',
        uniform: 'uPrimary',
        defaultValue: '#fb7185',
      },
    ],
    fragment: `
uniform float uShift;
uniform float uScan;
uniform float uInvert;
uniform vec3 uPrimary;

float hash21(vec2 p) {
  p = fract(p * vec2(91.7, 327.3));
  p += dot(p, p + 14.23);
  return fract(p.x * p.y);
}

vec3 signal(vec2 uv, float offset) {
  vec2 p = uv;
  p.x += offset;
  float ring = sin(length(p) * 16.0 - iTime * 2.8);
  float bars = sin((p.x + p.y) * 11.0 + iTime) * 0.5 + 0.5;
  float wedge = smoothstep(0.04, 0.0, abs(abs(p.x) - abs(p.y) * 0.72));
  vec3 base = mix(vec3(0.02, 0.035, 0.055), uPrimary, bars);
  return base + vec3(0.3, 0.8, 1.0) * wedge + vec3(0.9, 0.25, 0.48) * max(ring, 0.0) * 0.25;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = (fragCoord * 2.0 - iResolution.xy) / iResolution.y;
  float row = floor(fragCoord.y / 7.0);
  float glitch = step(0.86, hash21(vec2(row, floor(iTime * 9.0))));
  float offset = (hash21(vec2(row, 2.0)) - 0.5) * 0.14 * glitch * uShift;
  float chroma = 0.012 * uShift + offset * 0.32;

  vec3 col;
  col.r = signal(uv, chroma).r;
  col.g = signal(uv + vec2(offset, 0.0), 0.0).g;
  col.b = signal(uv, -chroma).b;

  float scanline = 0.88 + 0.12 * sin(fragCoord.y * 2.6 * uScan + iTime * 6.0);
  col *= scanline;
  col += vec3(glitch * 0.12);
  col = mix(col, 1.0 - col, uInvert * smoothstep(0.3, 1.0, sin(iTime * 2.0) * 0.5 + 0.5));
  fragColor = vec4(col, 1.0);
}
`,
  },
]
