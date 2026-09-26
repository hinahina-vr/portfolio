import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  FloatType,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
import { FluidSimulation, type FluidProfile } from 'three-fluid-fx'
import type { ControlValues, EffectDefinition } from './effects'
import type { HandPointerInput } from './handTracking'
import type { AudioLevels, RenderQuality, RenderStats } from './ShaderCanvas'

type FluidFxCanvasProps = {
  effect: EffectDefinition
  values: ControlValues
  paused: boolean
  externalPointer?: RefObject<HandPointerInput>
  audioLevels?: { current: AudioLevels }
  performanceMode?: boolean
  quality: RenderQuality
  onStats?: (stats: RenderStats) => void
  onReady?: (effectId: string) => void
  onCompileError?: (effectId: string) => void
}

type FluidCanvasRuntimeProps = FluidFxCanvasProps & {
  pipelineNote?: string | null
}

type ResizeState = RenderStats & {
  pixelRatio: number
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const getFluidStyleBase = (style: number) => {
  switch (Math.round(style)) {
    case 1:
      return `
  vec3 accent = mix(uPrimary, vec3(0.0, 0.95, 1.0), 0.22);
  vec3 color = mix(vec3(0.012, 0.006, 0.04), vec3(0.0, 0.06, 0.08), uv.y);
  color += vec3(0.17, 0.02, 0.26) * (0.24 + 0.18 * sin(uv.x * 5.0 + uTime * 0.08));
  color += accent * 0.035;
  color *= 0.98 - bass * 0.02;
`
    case 2:
      return `
  vec3 accent = mix(uPrimary, vec3(1.0, 0.42, 0.08), 0.18);
  vec3 color = mix(vec3(0.012, 0.006, 0.055), vec3(0.0, 0.07, 0.11), uv.y);
  color += vec3(0.18, 0.0, 0.2) * pow(1.0 - abs(uv.x - 0.52) * 1.35, 2.0) * 0.12;
  color += accent * 0.03;
  color *= 0.99 - bass * 0.018;
`
    case 3:
      return `
  vec3 accent = mix(uPrimary, vec3(1.0, 0.76, 0.2), 0.16);
  vec3 color = mix(vec3(0.035, 0.006, 0.045), vec3(0.12, 0.026, 0.09), uv.y);
  color += vec3(0.28, 0.04, 0.18) * pow(1.0 - abs(uv.y - 0.55) * 1.5, 2.2) * 0.12;
  color += accent * 0.028;
  color *= 1.0 - bass * 0.015;
`
    case 4:
      return `
  vec3 accent = mix(uPrimary, vec3(1.0, 0.55, 0.0), 0.2);
  vec3 color = mix(vec3(0.045, 0.004, 0.026), vec3(0.18, 0.018, 0.04), uv.y);
  color += vec3(0.3, 0.02, 0.06) * pow(1.0 - length(uv - 0.5) * 1.35, 2.0) * 0.18;
  color += accent * 0.03;
  color *= 1.0 - bass * 0.014;
`
    case 5:
      return `
  vec3 accent = mix(uPrimary, vec3(0.54, 1.0, 0.24), 0.18);
  vec3 color = mix(vec3(0.0, 0.035, 0.055), vec3(0.0, 0.12, 0.16), uv.y);
  color += vec3(0.0, 0.25, 0.25) * pow(1.0 - abs(uv.x - 0.5) * 1.4, 2.0) * 0.11;
  color += accent * 0.032;
  color *= 0.99 - bass * 0.015;
`
    case 6:
      return `
  vec3 accent = mix(uPrimary, vec3(0.0, 0.82, 1.0), 0.18);
  vec3 color = mix(vec3(0.018, 0.008, 0.06), vec3(0.055, 0.012, 0.14), uv.y);
  color += vec3(0.05, 0.04, 0.28) * pow(1.0 - abs(uv.x - 0.5) * 1.55, 2.2) * 0.16;
  color += accent * 0.035;
  color *= 0.99 - bass * 0.014;
`
    case 7:
      return `
  vec3 accent = mix(uPrimary, vec3(1.0, 0.7, 0.22), 0.16);
  vec3 color = mix(vec3(0.0, 0.04, 0.07), vec3(0.02, 0.14, 0.18), uv.y);
  color += vec3(0.0, 0.18, 0.22) * pow(1.0 - abs(uv.y - 0.48) * 1.4, 2.0) * 0.12;
  color += accent * 0.028;
  color *= 1.0 - bass * 0.012;
`
    case 8:
      return `
  vec3 accent = mix(uPrimary, vec3(0.35, 1.0, 0.82), 0.2);
  vec3 color = mix(vec3(0.004, 0.022, 0.026), vec3(0.014, 0.085, 0.078), uv.y);
  color += accent * 0.025;
  color *= 0.98 - bass * 0.018;
`
    case 9:
      return `
  vec3 accent = mix(uPrimary, vec3(1.0, 0.5, 0.12), 0.16);
  vec3 color = mix(vec3(0.003, 0.012, 0.03), vec3(0.018, 0.06, 0.1), uv.y);
  color += accent * 0.025;
  color *= 0.98 - bass * 0.02;
`
    case 10:
      return `
  vec3 accent = mix(uPrimary, vec3(0.55, 0.78, 1.0), 0.22);
  vec3 color = mix(vec3(0.004, 0.014, 0.03), vec3(0.018, 0.052, 0.095), uv.y);
  color += vec3(0.03, 0.1, 0.18) * pow(1.0 - abs(uv.y - 0.52) * 1.35, 2.0) * 0.11;
  color += vec3(0.05, 0.0, 0.12) * pow(1.0 - length(uv - vec2(0.58, 0.46)) * 1.55, 2.0) * 0.07;
  color += accent * 0.022;
  color *= 0.99 - bass * 0.012;
`
    case 11:
      return `
  vec3 accent = mix(uPrimary, vec3(0.24, 0.88, 0.96), 0.22);
  vec2 backdropP = (uv - 0.5) * vec2(aspect, 1.0);
  float backdropRadius = length(backdropP);
  vec3 color = mix(vec3(0.002, 0.009, 0.014), vec3(0.006, 0.028, 0.038), uv.y);
  color += vec3(0.0, 0.038, 0.05) * pow(max(0.0, 1.0 - backdropRadius * 0.82), 2.4) * 0.2;
  color += vec3(0.0, 0.026, 0.035) * pow(max(0.0, 1.0 - abs(backdropRadius - 0.48) * 2.6), 3.0) * 0.08;
  color += accent * 0.008;
`
    default:
      return `
  vec3 accent = mix(uPrimary, vec3(0.38, 0.9, 1.0), 0.2);
  vec3 color = mix(vec3(0.01, 0.022, 0.055), vec3(0.04, 0.08, 0.12), uv.y);
  color += vec3(0.02, 0.18, 0.24) * pow(1.0 - abs(uv.y - 0.5) * 1.4, 2.0) * 0.12;
  color += accent * 0.03;
  color *= 0.99 - bass * 0.014;
`
  }
}

const getFluidStyleFragmentBody = (style: number) => {
  const liquidStyle = Math.round(style)

  if (liquidStyle >= 0 && liquidStyle <= 7) {
    switch (liquidStyle) {
      case 1:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.064 + uMotion * 0.024), velocity.y * 0.12 + flowPressure * 0.045);
  float plume = fbm(q * vec2(1.8, 2.6) + vec2(0.0, uTime * 0.026));
  float plumeMask = 1.0 - smoothstep(0.16, 0.96, uv.x);
  float trunk = lineGlow(sin((q.y + plume * 0.24 + flowPhase * 0.16 + sin(q.x * 4.2) * 0.055) * (7.4 + detail * 0.7) + q.x * 0.82), 0.07 * flowWidth);
  float filamentA = lineGlow(sin((q.y + plume * 0.14 + flowPhase * 0.11 + sin(q.x * 6.5) * 0.04) * (18.0 + detail * 1.1) - q.x * 1.8), 0.024 * flowWidth);
  float filamentB = lineGlow(sin((q.y - plume * 0.12 + flowPhase * 0.08 + sin(q.x * 5.0) * 0.035) * (25.0 + detail) + q.x * 2.2), 0.019 * flowWidth);
  float sourceEdge = plumeMask * (0.24 + plume * 0.56);
  body = clamp((trunk * 0.62 + filamentA * 0.38 + filamentB * 0.22) * (0.35 + plumeMask * 0.95) + sourceEdge * fluid * 0.45, 0.0, 1.0);
  edge = clamp((filamentA * 0.7 + filamentB * 0.5 + trunk * 0.18) * (0.28 + plumeMask), 0.0, 1.0);
  spark = pow(edge, 1.7) * 0.34;
  liquid = vec3(0.0, 0.045, 0.07) + vec3(0.0, 0.9, 1.0) * (trunk * 0.42 + edge * 0.72);
  liquid += vec3(0.95, 0.1, 0.85) * filamentB * 0.46;
  tone = clamp(body + edge * 0.25, 0.0, 1.0);
`
      case 2:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.025 + uMotion * 0.008), velocity.x * 0.06);
  float film = fbm(q * vec2(1.45, 1.95) + vec2(uTime * 0.01, 2.0));
  float contourA = lineGlow(sin((q.x + film * 0.18 + flowPhase * 0.11) * (15.0 + detail * 1.1) + q.y * 2.2), 0.045 * flowWidth);
  float contourB = lineGlow(sin((q.x - film * 0.12 - flowPhase * 0.08) * (31.0 + detail * 1.4) - q.y * 3.7), 0.018 * flowWidth);
  float sheet = stroke(sin((q.y + film * 0.24 + flowPressure * 0.08) * 4.6 + q.x * 0.92), 0.18 + flowPressure * 0.055);
  float prismShift = film + uv.x * 0.24 + contourA * 0.12 + uTime * 0.012;
  body = clamp(sheet * 0.36 + contourA * 0.58 + contourB * 0.32 + fluid * 0.24, 0.0, 1.0);
  edge = clamp(contourA * 0.64 + contourB * 0.78, 0.0, 1.0);
  spark = contourB * 0.38;
  vec3 oil = pow(oilPalette(prismShift), vec3(0.72));
  liquid = mix(vec3(0.018, 0.008, 0.05), oil, 0.46 + body * 0.42);
  liquid += oilPalette(prismShift + 0.2) * edge * 0.34;
  tone = body;
`
      case 3:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.026 + uMotion * 0.009), velocity.y * 0.08);
  float foldWarp = fbm(q * 1.18 + vec2(1.0, uTime * 0.012));
  float fold = sin((q.y + foldWarp * 0.23 + flowPhase * 0.12) * (4.4 + detail * 0.42) + q.x * 0.55);
  float ribbon = stroke(fold, 0.2 + flowPressure * 0.07);
  float creaseA = lineGlow(sin((q.y + foldWarp * 0.12 + flowPhase * 0.08) * (12.0 + detail) - q.x * 1.3), 0.036 * flowWidth);
  float creaseB = lineGlow(sin((q.y - foldWarp * 0.08 - flowPhase * 0.06) * (19.0 + detail) + q.x * 2.0), 0.02 * flowWidth);
  body = clamp(ribbon * 0.56 + creaseA * 0.42 + creaseB * 0.24 + fluid * 0.22, 0.0, 1.0);
  edge = clamp(creaseA * ribbon * 0.7 + creaseB * 0.72, 0.0, 1.0);
  spark = edge * 0.24;
  liquid = mix(vec3(0.07, 0.014, 0.065), vec3(1.0, 0.28, 0.72), body);
  liquid += vec3(1.0, 0.74, 0.22) * edge * 0.36;
  tone = body;
`
      case 4:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.07 + uMotion * 0.024), velocity.x * 0.05);
  float heat = fbm(q * vec2(1.5, 2.2) + vec2(uTime * 0.02, 0.0));
  float tideA = lineGlow(sin((q.y + heat * 0.18 + flowPhase * 0.16 + sin(q.x * 3.4) * 0.035) * (6.4 + detail * 0.45) + q.x * 0.62), 0.075 * flowWidth);
  float tideB = lineGlow(sin((q.y - heat * 0.1 - flowPhase * 0.08 + sin(q.x * 4.0) * 0.028) * (13.0 + detail * 0.7) - q.x * 0.9), 0.03 * flowWidth);
  float thermalCut = lineGlow(sin((q.y + heat * 0.12 + flowPressure * 0.07) * (21.0 + detail * 0.8) + q.x * 0.7), 0.022 * flowWidth);
  body = clamp(tideA * 0.58 + tideB * 0.44 + thermalCut * 0.24 + fluid * 0.3, 0.0, 1.0);
  edge = clamp(tideB * 0.65 + thermalCut * 0.62, 0.0, 1.0);
  spark = pow(edge, 1.25) * 0.36;
  liquid = vec3(0.08, 0.004, 0.035) + vec3(1.0, 0.06, 0.32) * body;
  liquid += vec3(1.0, 0.52, 0.02) * edge * 0.5;
  tone = body;
`
      case 5:
        return `
  vec2 q = liquidUv + vec2(sin(liquidUv.y * 4.0 + uTime * 0.12 + flowPhase) * 0.018, uTime * (0.1 + uMotion * 0.03));
  float curtain = fbm(q * vec2(2.4, 6.4) + vec2(-uTime * 0.04, 0.0));
  float columnA = lineGlow(sin((q.x + curtain * 0.08 + flowPhase * 0.08) * (17.0 + detail * 1.2)), 0.055 * flowWidth);
  float columnB = lineGlow(sin((q.x - curtain * 0.05 - flowPhase * 0.05) * (38.0 + detail * 1.8)), 0.02 * flowWidth);
  float fallLine = lineGlow(sin(q.y * (11.0 + detail) + curtain * 4.0 + flowPressure * 1.1), 0.045 * flowWidth);
  float bottomSpray = smoothstep(0.62, 0.98, uv.y) * (columnA + columnB) * 0.45;
  body = clamp(columnA * 0.55 + columnB * 0.44 + fallLine * columnA * 0.32 + bottomSpray + fluid * 0.2, 0.0, 1.0);
  edge = clamp(columnB * 0.74 + fallLine * 0.35, 0.0, 1.0);
  spark = bottomSpray * 0.28 + columnB * 0.18;
  liquid = vec3(0.0, 0.048, 0.075) + vec3(0.0, 0.82, 0.95) * (body * 0.7 + edge * 0.42);
  liquid += vec3(0.5, 1.0, 0.24) * bottomSpray * 0.3;
  tone = body;
`
      case 6:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.032 + uMotion * 0.012), uTime * 0.012);
  float fieldWarp = fbm(q * 1.5 + vec2(0.0, uTime * 0.018));
  float tide = lineGlow(sin((q.y + fieldWarp * 0.2 + flowPhase * 0.14 + sin(q.x * 2.6) * 0.04) * (6.6 + detail * 0.48) + q.x * 0.65), 0.07 * flowWidth);
  float ridge = lineGlow(sin((q.y + fieldWarp * 0.09 - flowPhase * 0.06 + sin(q.x * 4.2) * 0.025) * (16.0 + detail) - q.x * 0.85), 0.026 * flowWidth);
  float satin = lineGlow(sin((q.y + fieldWarp * 0.14 + flowPressure * 0.04) * 9.0 + q.x * 0.48), 0.055 * flowWidth);
  body = clamp(tide * 0.58 + ridge * 0.5 + satin * 0.18 + fluid * 0.2, 0.0, 1.0);
  edge = clamp(ridge * 0.78 + satin * tide * 0.32, 0.0, 1.0);
  spark = edge * 0.2;
  liquid = mix(vec3(0.025, 0.01, 0.075), vec3(0.34, 0.16, 0.78), body);
  liquid += vec3(0.0, 0.78, 1.0) * edge * 0.42;
  tone = body;
`
      case 7:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.014 + uMotion * 0.005), velocity.y * 0.04);
  float lensWarp = fbm(q * 1.05 + vec2(0.0, uTime * 0.007));
  float paneX = lineGlow(sin((q.x + lensWarp * 0.1 + flowPhase * 0.08) * (5.2 + detail * 0.28)), 0.05 * flowWidth);
  float paneY = lineGlow(sin((q.y - lensWarp * 0.08 - flowPhase * 0.05) * (3.8 + detail * 0.18)), 0.065 * flowWidth);
  float causticA = lineGlow(sin((q.x + lensWarp * 0.18 + flowPressure * 0.06) * (18.0 + detail) + q.y * 1.25 + uTime * 0.06), 0.018 * flowWidth);
  float causticB = lineGlow(sin((q.y - lensWarp * 0.12) * (11.0 + detail * 0.7) - q.x * 0.9 + flowPhase * 1.4), 0.024 * flowWidth);
  body = clamp((paneX + paneY) * 0.24 + causticA * 0.42 + causticB * 0.2 + fluid * 0.14, 0.0, 1.0);
  edge = clamp(causticA * 0.72 + paneX * paneY * 0.18, 0.0, 1.0);
  spark = causticA * 0.3 + causticB * 0.12;
  liquid = mix(vec3(0.0, 0.052, 0.07), vec3(0.16, 0.82, 0.96), body);
  liquid += vec3(0.96, 0.76, 0.26) * edge * 0.34;
  tone = body;
`
      default:
        return `
  vec2 q = liquidUv + vec2(-uTime * (0.058 + uMotion * 0.02), velocity.y * 0.09 + flowPressure * 0.035);
  float sheetWarp = fbm(q * vec2(1.18, 1.62) + vec2(0.0, uTime * 0.014)) * 2.0 - 1.0;
  float center = 0.5 + 0.18 * sin(q.x * 1.35 + sheetWarp * 1.2 + flowPhase * 1.8) + velocity.y * 1.4;
  float distanceToSheet = abs(q.y - center);
  float sheetMass = 1.0 - smoothstep(0.16 + flowPressure * 0.18, 0.42 + flowPressure * 0.22, distanceToSheet);
  float fold = sin((q.x + sheetWarp * 0.22 + flowPhase * 0.18) * (5.2 + detail * 0.32) - q.y * 1.6);
  float broadFold = 1.0 - smoothstep(0.12, 0.72, abs(fold));
  float rim = lineGlow(distanceToSheet - (0.18 + flowPressure * 0.08), 0.026 * flowWidth);
  float shear = lineGlow(sin((q.y - center + flowPhase * 0.05) * (18.0 + detail) + q.x * 1.2), 0.015 * flowWidth) * sheetMass * flowPressure;
  body = clamp(sheetMass * 0.5 + broadFold * sheetMass * 0.18 + fluid * 0.22, 0.0, 1.0);
  edge = clamp(rim * 0.84 + shear * 0.42, 0.0, 1.0);
  spark = shear * 0.24 + rim * 0.08;
  liquid = mix(vec3(0.026, 0.07, 0.15), vec3(0.36, 0.78, 0.94), smoothstep(0.08, 0.94, body));
  liquid += vec3(0.74, 1.0, 1.0) * edge * 0.38;
  liquid += vec3(0.0, 0.52, 1.0) * broadFold * sheetMass * 0.12;
  tone = clamp(body + edge * 0.22, 0.0, 1.0);
`
    }
  }

  switch (Math.round(style)) {
    case 1:
      return `
  vec2 q = uv;
  q.x -= uTime * (0.1 + uMotion * 0.04);
  q.y += velocity.y * 0.22;
  float warp = fbm(q * 2.0 + vec2(uTime * 0.02, 0.0));
  float trunk = sin((q.y + warp * 0.16) * (9.5 + detail * 1.4) + q.x * 2.4);
  float branchA = sin(q.y * (24.0 + detail * 1.6) - q.x * 7.5 + warp * 3.0);
  float branchB = sin(q.y * (33.0 + detail * 1.2) + q.x * 5.1 - warp * 2.4);
  float vein = lineGlow(trunk, 0.038) + lineGlow(branchA, 0.018) * 0.48 + lineGlow(branchB, 0.015) * 0.3;
  float inkPool = smoothstep(0.48, 0.92, noise(q * 3.0 + vec2(0.0, uTime * 0.025)));
  body = clamp(vein * (0.28 + fluid * 0.65) + inkPool * fluid * 0.32, 0.0, 1.0);
  edge = clamp(vein, 0.0, 1.0);
  spark = pow(edge, 1.8) * (0.62 + treble * 0.28);
  liquid = vec3(0.006, 0.035, 0.065) + vec3(0.0, 1.0, 0.95) * edge * 1.12;
  liquid += vec3(1.0, 0.02, 0.82) * lineGlow(branchB, 0.012) * 0.72;
  liquid += vec3(0.42, 0.12, 1.0) * inkPool * fluid * 0.28;
  tone = clamp(body + edge * 0.4, 0.0, 1.0);
`
    case 2:
      return `
  vec2 q = vec2(p.x * 0.78, p.y) * 1.45 + vec2(-uTime * 0.025, uTime * 0.012);
  float cellA = fbm(q * 1.8 + velocity * 0.9);
  float cellB = noise(q * 4.7 + vec2(3.7, -uTime * 0.035));
  float membrane = stroke(cellA - cellB, 0.055);
  float pool = smoothstep(0.5, 0.88, cellA);
  body = clamp(membrane * 0.74 + pool * 0.24 + fluid * 0.22, 0.0, 1.0);
  edge = membrane * (0.7 + fluid * 0.3);
  spark = pow(membrane, 2.0) * (0.22 + treble * 0.2);
  vec3 oil = pow(oilPalette(cellA + cellB * 0.62 + uv.x * 0.22 + uTime * 0.018), vec3(0.78));
  oil *= vec3(0.86, 0.72, 0.98);
  liquid = mix(vec3(0.018, 0.01, 0.075), oil, 0.66);
  liquid += oilPalette(cellB + 0.2) * edge * 0.46;
  liquid += vec3(1.0, 0.2, 0.85) * membrane * 0.12;
  tone = body;
`
    case 3:
      return `
  vec2 q = uv + vec2(-uTime * (0.025 + uMotion * 0.01), velocity.y * 0.1);
  float foldWarp = fbm(q * 1.25 + vec2(1.0, uTime * 0.012));
  float fold = sin((q.y + foldWarp * 0.22) * (3.4 + detail * 0.38) + q.x * 0.45);
  float layer = 1.0 - smoothstep(0.04, 0.78, abs(fold));
  float depth = noise(q * 3.0 + vec2(4.0, -uTime * 0.018));
  body = clamp(layer * (0.78 + depth * 0.28) + smoothstep(0.56, 0.95, depth) * 0.18 + fluid * 0.22, 0.0, 1.0);
  edge = pow(max(0.0, 1.0 - abs(sin((q.y + foldWarp * 0.08) * 11.0 - q.x * 1.2))), 10.0) * body;
  spark = edge * 0.28;
  liquid = mix(vec3(0.07, 0.016, 0.075), vec3(1.0, 0.36, 0.78), body);
  liquid += vec3(1.0, 0.78, 0.26) * edge * 0.24;
  liquid += vec3(0.38, 0.16, 1.0) * depth * body * 0.18;
  tone = body;
`
    case 4:
      return `
  vec2 q = p * 1.1 + vec2(-uTime * (0.08 + uMotion * 0.035), sin(uTime * 0.08) * 0.08);
  float gel = fbm(q * 2.0 + velocity * 1.7);
  float pulse = noise(q * 5.0 + vec2(uTime * 0.16, 2.0));
  float core = smoothstep(0.5, 0.88, gel);
  float hotRim = pow(max(0.0, 1.0 - abs(sin(gel * 9.0 + pulse * 3.2))), 3.6);
  body = clamp(core * 0.74 + hotRim * 0.33 + fluid * 0.36, 0.0, 1.0);
  edge = hotRim * (0.35 + pulse * 0.65);
  spark = smoothstep(0.7, 1.0, pulse) * (0.5 + fluid * 0.34);
  liquid = mix(vec3(0.08, 0.004, 0.04), vec3(1.0, 0.08, 0.36), body);
  liquid += vec3(1.0, 0.58, 0.02) * edge * 0.72;
  liquid += vec3(0.94, 0.0, 1.0) * hotRim * 0.16;
  tone = body;
`
    case 5:
      return `
  vec2 grid = vec2(uv.x * (9.0 + detail * 0.72) + sin(uv.y * 9.0) * 0.28, uv.y * (7.0 + detail * 0.52) + uTime * (0.28 + uMotion * 0.1));
  vec2 id = floor(grid);
  vec2 gv = fract(grid) - 0.5;
  float rnd = hash21(id);
  gv.x += (rnd - 0.5) * 0.5 + sin(gv.y * 4.0 + uTime * 0.5 + rnd * 6.0) * 0.08;
  gv.y += sin(rnd * 6.28318 + uTime * 0.52) * 0.06;
  float slash = (1.0 - smoothstep(0.035, 0.13, abs(gv.x + gv.y * (0.22 + rnd * 0.34))));
  slash *= 1.0 - smoothstep(0.16, 0.54, abs(gv.y));
  slash *= smoothstep(0.32, 0.98, rnd);
  float spray = smoothstep(0.66, 1.0, noise(uv * 12.5 + vec2(-uTime * 0.08, uTime * 0.3)));
  float pressureLine = lineGlow(sin(uv.x * 24.0 + uv.y * 8.0 + noise(uv * 3.4) * 2.3), 0.05);
  body = clamp(slash * 0.92 + spray * 0.34 + pressureLine * 0.16 + fluid * 0.25, 0.0, 1.0);
  edge = slash + pressureLine * 0.24;
  spark = slash * (0.42 + treble * 0.16) + spray * 0.12;
  liquid = vec3(0.0, 0.055, 0.09) + vec3(0.0, 0.84, 1.0) * edge * 0.9;
  liquid += vec3(0.58, 1.0, 0.18) * slash * 0.28;
  liquid += vec3(0.74, 0.28, 1.0) * spray * 0.14;
  tone = clamp(body + slash * 0.26, 0.0, 1.0);
`
    case 6:
      return `
  vec2 q = p;
  q.y += uTime * (0.035 + uMotion * 0.012);
  float fieldWarp = fbm(q * 1.7 + vec2(0.0, uTime * 0.022));
  float column = sin((q.x + fieldWarp * 0.08) * (18.0 + detail * 2.0));
  float tooth = sin((q.y - fieldWarp * 0.12) * (16.0 + detail * 1.4));
  float ridges = pow(max(0.0, 1.0 - abs(column)), 18.0);
  float needles = ridges * pow(max(0.0, 1.0 - abs(tooth)), 4.0);
  float lattice = pow(max(0.0, 1.0 - abs(sin(q.x * 9.0 + fieldWarp) * sin(q.y * 18.0))), 9.0);
  body = clamp(ridges * 0.5 + needles * 0.85 + lattice * 0.2 + fluid * 0.25, 0.0, 1.0);
  edge = needles + ridges * 0.24;
  spark = pow(edge, 1.45) * 0.38;
  liquid = mix(vec3(0.035, 0.01, 0.11), vec3(0.36, 0.13, 0.86), body);
  liquid += vec3(0.0, 0.82, 1.0) * edge * 0.58;
  liquid += vec3(0.85, 0.25, 1.0) * lattice * 0.18;
  tone = clamp(body + edge * 0.18, 0.0, 1.0);
`
    case 7:
      return `
  vec2 q = uv + vec2(-uTime * (0.012 + uMotion * 0.004), velocity.y * 0.06);
  float syrupWarp = fbm(q * 1.05 + vec2(0.0, uTime * 0.008));
  float paneX = lineGlow(sin((q.x + syrupWarp * 0.08) * (8.0 + detail * 0.5)), 0.07);
  float paneY = lineGlow(sin((q.y - syrupWarp * 0.1) * (5.5 + detail * 0.35)), 0.09);
  float sheet = smoothstep(0.34, 0.92, syrupWarp) * 0.55 + paneY * 0.24;
  float causticWave = sin((q.x + syrupWarp * 0.12) * (24.0 + detail * 1.5) + q.y * 2.2 + uTime * 0.16);
  float caustic = pow(max(0.0, 1.0 - abs(causticWave)), 16.0) * (0.35 + paneX * 0.65);
  body = clamp(sheet + caustic * 0.28 + fluid * 0.2, 0.0, 1.0);
  edge = caustic + paneX * 0.16 + paneY * 0.08;
  spark = caustic * 0.36;
  liquid = mix(vec3(0.0, 0.06, 0.09), vec3(0.18, 0.9, 1.0), body);
  liquid += vec3(1.0, 0.72, 0.22) * caustic * 0.28;
  liquid += vec3(0.42, 0.22, 1.0) * paneX * 0.12;
  tone = body;
`
    case 8:
      return `
  vec2 q = liquidP;
  q *= mat2(0.93, -0.36, 0.36, 0.93);
  q.y += uTime * (0.055 + uMotion * 0.028) + flowPhase * 0.18;
  float drift = noise(q * 2.0 + vec2(0.0, uTime * 0.045) + dye.xy * 0.2);
  float pressureField = smoothstep(0.08, 0.8, flowPressure + fluid * 0.55 + speed * 0.22);
  float fault = sin((q.x + drift * 0.18 + flowPhase * 0.22) * (4.8 + detail * 0.45) + q.y * 1.05);
  float plate = (1.0 - smoothstep(0.16 + pressureField * 0.08, 0.72 + pressureField * 0.2, abs(fault))) * pressureField;
  float incision = lineGlow(sin(q.x * 13.0 - q.y * 3.4 + uTime * 0.55 + flowPressure * 2.4), 0.018 * flowWidth) * pressureField;
  float ambientPlate = smoothstep(0.56, 0.92, noise(liquidP * 1.15 + vec2(uTime * 0.02, -uTime * 0.012))) * 0.24;
  float pool = smoothstep(0.14, 0.8, fluid + length(dye) * 0.32) * (0.62 + plate * 0.38);
  body = clamp(pool * 0.62 + plate * 0.42 + ambientPlate + fluid * 0.16, 0.0, 1.0);
  edge = clamp(incision * 0.9 + plate * (0.08 + speed * 0.18), 0.0, 1.0);
  spark = incision * (0.18 + speed * 0.5);
  vec3 timePrism = 0.5 + 0.5 * cos(6.28318 * (vec3(0.03, 0.32, 0.62) + uTime * 0.032 + flowPhase * 0.08 + fluid * 0.06));
  vec3 dyeTint = max(dye * 0.72, timePrism * (0.12 + body * 0.22));
  vec3 cutTint = mix(vec3(0.18, 0.98, 0.78), timePrism, 0.36);
  liquid = mix(vec3(0.004, 0.014, 0.014), mix(vec3(0.07, 0.42, 0.36), dyeTint, 0.5), body);
  liquid += dyeTint * body * (0.2 + speed * 0.14);
  liquid += cutTint * edge * 0.52;
  liquid += vec3(1.0, 0.72, 0.36) * spark * 0.1;
  tone = clamp(body + edge * 0.28, 0.0, 1.0);
`
    case 9:
      return `
  vec2 q = liquidUv;
  q.x -= uTime * (0.13 + uMotion * 0.04 + bass * 0.065 + mid * 0.035);
  float laneWave = sin(q.y * 5.0);
  float lowRail = lineGlow(laneWave, 0.16 + bass * 0.08 + flowPressure * 0.02) * (0.18 + bass * 0.88 + flowPressure * 0.2);
  float flowCell = fract(q.x * 7.5);
  float midGate = smoothstep(0.08, 0.3, flowCell) * (1.0 - smoothstep(0.62, 0.96, flowCell));
  float midDash = lineGlow(sin(q.y * 10.0), 0.04 * flowWidth) * midGate * (0.1 + mid * 0.76) * (0.45 + flowPressure * 0.45);
  float tick = step(0.9 - treble * 0.18 - flowPressure * 0.06, hash21(floor(vec2(q.x * 38.0, q.y * 18.0))));
  float beatGate = lowRail * beat;
  float pressureWash = smoothstep(0.08, 0.72, fluid + bass * 0.2);
  body = clamp(lowRail * 0.54 + midDash * 0.42 + tick * treble * 0.16 + beatGate * 0.28 + pressureWash * (0.46 + bass * 0.28), 0.0, 1.0);
  edge = clamp(midDash + beatGate * 0.26 + tick * treble * 0.22, 0.0, 1.0);
  spark = tick * treble + beatGate * 0.12;
  liquid = vec3(0.004, 0.012, 0.02) + vec3(0.07, 0.34, 0.56) * body;
  liquid += vec3(0.0, 0.76, 1.0) * midDash * 0.32;
  liquid += vec3(1.0, 0.54, 0.16) * lowRail * bass * 0.22;
  liquid += vec3(0.86, 0.98, 1.0) * spark * 0.28;
  tone = body;
`
    case 10:
      return `
  vec2 q = liquidUv;
  q.x -= uTime * (0.052 + uMotion * 0.018);
  q.y += velocity.y * 0.08;
  float streamWarp = fbm(q * vec2(1.5, 2.15) + vec2(uTime * 0.012, -uTime * 0.006));
  float curtainA = lineGlow(sin(q.y * 8.0 + q.x * 1.45 + streamWarp * 1.2), 0.05 * flowWidth);
  float curtainB = lineGlow(sin(q.y * 15.0 - q.x * 2.05 - uTime * 0.2 + streamWarp), 0.026 * flowWidth);
  vec2 orbit = vec2(q.x * aspect, q.y) - vec2(0.62 + sin(uTime * 0.15) * 0.08, 0.48 + cos(uTime * 0.11) * 0.08);
  float radius = length(orbit);
  float angle = atan(orbit.y, orbit.x);
  float ring = lineGlow(sin(radius * 38.0 - uTime * 1.35 + streamWarp * 2.0), 0.032) * smoothstep(0.04, 0.62, radius);
  float spokes = pow(abs(sin(angle * 11.0 + radius * 5.5 - uTime * 0.65)), 17.0) * smoothstep(0.12, 0.78, radius);
  float beadConstellation = pow(abs(sin(angle * 19.0 + radius * 42.0 - uTime * 0.85)), 34.0) * smoothstep(0.1, 0.68, radius);
  float shotPressure = smoothstep(0.08, 0.7, fluid + speed * 0.34);
  body = clamp(curtainA * 0.08 + curtainB * 0.055 + ring * 0.12 + spokes * 0.08 + beadConstellation * 0.08 + shotPressure * 0.42, 0.0, 1.0);
  edge = clamp(curtainB * 0.12 + ring * 0.18 + spokes * 0.14 + beadConstellation * 0.18 + speed * 0.2, 0.0, 1.0);
  spark = clamp(spokes * 0.18 + ring * 0.1 + beadConstellation * 0.3 + speed * 0.28, 0.0, 1.0);
  liquid = vec3(0.004, 0.018, 0.038) + vec3(0.08, 0.42, 0.72) * body;
  liquid += vec3(0.1, 0.78, 1.0) * edge * 0.38;
  liquid += vec3(0.76, 0.34, 1.0) * (ring + spokes) * 0.12;
  liquid += vec3(0.9, 0.98, 1.0) * spark * 0.16;
  tone = clamp(body + edge * 0.16, 0.0, 1.0);
`
    case 11:
      return `
  dye *= 0.52;
  vec2 kaleidoP = liquidP;
  float radius = max(length(kaleidoP), 0.0001);
  float angle = atan(kaleidoP.y, kaleidoP.x);
  float spiralBreath = 0.5 + 0.5 * sin(uTime * 0.19);
  float spiralTurn = radius * (0.43 + spiralBreath * 0.12);
  spiralTurn += sin(radius * 3.8 - uTime * 0.34 + flowPhase * 1.25) * 0.075;
  spiralTurn += uTime * 0.046 * smoothstep(0.1, 1.25, radius);
  angle += spiralTurn;
  float sector = 6.2831853 / 5.0;
  float foldedAngle = abs(mod(angle + sector * 0.5, sector) - sector * 0.5);
  float radialDepth = smoothstep(0.04, 1.34, radius);
  float depthPhase = fract(radius * 0.9 - uTime * (0.24 + uMotion * 0.05) + flowPhase * 0.02);
  float approachFront = exp(-pow(abs(depthPhase - 0.5) / 0.14, 2.0));
  float depthLens = mix(1.22, 0.68, radialDepth) * (1.0 - approachFront * 0.1);
  float depthWidth = mix(0.72, 1.34, radialDepth) * (1.0 + approachFront * 0.24);
  float projectedRadius = radius + approachFront * radialDepth * 0.038;
  vec2 loom = vec2(projectedRadius, foldedAngle * radius * 5.0 * depthLens);
  float fiberWarp = fbm(loom * vec2(1.55, 1.1) + vec2(-uTime * 0.074, uTime * 0.032) + dye.xy * 0.12);
  float radialFlow = loom.x * (21.0 + detail * 1.65) - uTime * (1.16 + uMotion * 0.42) + flowPhase * 2.1;
  float spineA = loom.y - 0.23 - sin(loom.x * 5.1 - uTime * 0.31 + fiberWarp) * 0.052;
  float spineB = loom.y - 0.64 + sin(loom.x * 3.65 + uTime * 0.25 - fiberWarp * 0.8) * 0.072;
  float spineC = loom.y - 1.08 - sin(loom.x * 2.8 - uTime * 0.19 + fiberWarp * 1.1) * 0.095;
  float twistA = sin(radialFlow + fiberWarp * 1.7);
  float twistB = sin(radialFlow + 2.0944 + fiberWarp * 1.3);
  float twistC = sin(radialFlow + 4.18879 + fiberWarp * 1.5);
  float frontA = smoothstep(-0.28, 0.36, twistA);
  float frontB = smoothstep(-0.28, 0.36, twistB);
  float frontC = smoothstep(-0.28, 0.36, twistC);
  float brushWidth = depthWidth * (1.38 + flowPressure * 0.36);
  float strandA = lineGlow(spineA - twistA * 0.048, 0.024 * flowWidth * brushWidth) * mix(0.34, 1.0, frontA);
  float strandB = lineGlow(spineA - twistB * 0.048, 0.024 * flowWidth * brushWidth) * mix(0.34, 1.0, frontB);
  float strandC = lineGlow(spineA - twistC * 0.048, 0.024 * flowWidth * brushWidth) * mix(0.34, 1.0, frontC);
  float outerA = lineGlow(spineB - cos(radialFlow * 0.78 + 0.8) * 0.064, 0.029 * flowWidth * brushWidth);
  float outerB = lineGlow(spineB + cos(radialFlow * 0.78 + 0.8) * 0.064, 0.029 * flowWidth * brushWidth);
  float fineA = lineGlow(spineC - sin(radialFlow * 0.58 + 1.2) * 0.074, 0.022 * flowWidth * brushWidth);
  float fineB = lineGlow(spineC + sin(radialFlow * 0.58 + 1.2) * 0.074, 0.022 * flowWidth * brushWidth);
  float tubeA = 1.0 - smoothstep(0.055 * brushWidth, (0.18 + flowPressure * 0.045) * brushWidth, abs(spineA));
  float tubeB = 1.0 - smoothstep(0.068 * brushWidth, (0.215 + flowPressure * 0.05) * brushWidth, abs(spineB));
  float tubeC = 1.0 - smoothstep(0.054 * brushWidth, (0.18 + flowPressure * 0.035) * brushWidth, abs(spineC));
  float hubFade = smoothstep(0.035, 0.16, radius);
  float rimFade = 1.0 - smoothstep(0.92, 1.42, radius);
  float pressureWeave = smoothstep(0.06, 0.76, fluid + speed * 0.36);
  vec2 needleGrid = vec2(
    loom.x * (14.0 + detail * 1.35) - uTime * (0.66 + uMotion * 0.2),
    loom.y * (3.7 + detail * 0.14) + sin(loom.x * 5.4 + fiberWarp * 2.0) * 0.22
  );
  vec2 needleId = floor(needleGrid);
  vec2 needleCell = fract(needleGrid) - 0.5;
  float needleSeed = hash21(needleId + vec2(17.3, 41.7));
  needleCell.x += (needleSeed - 0.5) * 0.16;
  float needleLength = 0.34 + radialDepth * 0.08 + approachFront * 0.07;
  float needleShape = exp(-pow(abs(needleCell.x) / needleLength, 6.0) - pow(abs(needleCell.y) / (0.071 * brushWidth), 2.0));
  float needleGate = step(0.14, needleSeed);
  float needleCurtain = needleShape * needleGate * hubFade * rimFade * (0.46 + pressureWeave * 0.54);
  float ambientInk = 0.105 + sin(uTime * 0.16 + radius * 2.4) * 0.02;
  vec2 outwardUv = normalize(liquidUv - vec2(0.5) + vec2(0.0001, 0.0));
  vec2 sidewaysUv = vec2(-outwardUv.y, outwardUv.x);
  vec2 wakeUvA = clamp(flowUv - outwardUv * 0.034, 0.001, 0.999);
  vec2 wakeUvB = clamp(flowUv - outwardUv * 0.072, 0.001, 0.999);
  vec2 wakeUvC = clamp(flowUv - outwardUv * 0.108, 0.001, 0.999);
  vec2 wideUvA = clamp(flowUv - outwardUv * 0.055 + sidewaysUv * 0.04, 0.001, 0.999);
  vec2 wideUvB = clamp(flowUv - outwardUv * 0.055 - sidewaysUv * 0.04, 0.001, 0.999);
  float wakeA = clamp(texture2D(uDensity, wakeUvA).b * 0.9 + length(texture2D(uDye, wakeUvA).rgb) * 3.2, 0.0, 1.0);
  float wakeB = clamp(texture2D(uDensity, wakeUvB).b * 0.82 + length(texture2D(uDye, wakeUvB).rgb) * 2.8, 0.0, 1.0);
  float wakeC = clamp(texture2D(uDensity, wakeUvC).b * 0.72 + length(texture2D(uDye, wakeUvC).rgb) * 2.4, 0.0, 1.0);
  float wideInkA = clamp(texture2D(uDensity, wideUvA).b * 0.76 + length(texture2D(uDye, wideUvA).rgb) * 2.6, 0.0, 1.0);
  float wideInkB = clamp(texture2D(uDensity, wideUvB).b * 0.76 + length(texture2D(uDye, wideUvB).rgb) * 2.6, 0.0, 1.0);
  float wideInk = max(wideInkA, wideInkB);
  float inkField = max(fluid, max(wakeA * 0.82, max(wakeB * 0.64, max(wakeC * 0.46, wideInk * 0.64))));
  float inkActivity = smoothstep(0.009, 0.135, inkField);
  float inkMask = mix(ambientInk, 1.0, inkActivity);
  float fluidSheet = smoothstep(0.025, 0.32, inkField) * inkActivity * hubFade * rimFade;
  float depthLight = mix(0.58, 1.0, radialDepth);
  float frontWeave = approachFront * (tubeA * 0.42 + tubeB * 0.28 + tubeC * 0.18 + needleCurtain * 0.1);
  body = clamp((tubeA * 0.58 + tubeB * 0.42 + tubeC * 0.29 + pressureWeave * (tubeA + tubeB + tubeC * 0.7) * 0.3 + needleCurtain * 0.16 + frontWeave * 0.2) * hubFade * rimFade * depthLight * inkMask + fluidSheet * 0.3, 0.0, 1.0);
  edge = clamp(((strandA + strandB + strandC) * 0.42 + (outerA + outerB) * 0.4 + (fineA + fineB) * 0.34 + needleCurtain * 0.4) * mix(0.64, 1.0, radialDepth) + frontWeave * 0.2, 0.0, 1.0) * hubFade * rimFade * inkMask;
  spark = clamp((max(max(strandA * frontA, strandB * frontB), strandC * frontC) * 0.24 + max(outerA, outerB) * 0.1 + max(fineA, fineB) * 0.08 + needleCurtain * 0.14) * mix(0.5, 1.0, radialDepth) + frontWeave * 0.12, 0.0, 1.0) * inkMask;
  float fiberPhase = radius * 0.48 + foldedAngle / sector * 0.24 + flowPhase * 0.08 + uTime * 0.014;
  float coolPulse = 0.5 + 0.5 * sin(fiberPhase * 6.2831853);
  vec3 innerFiber = mix(vec3(0.018, 0.34, 0.46), vec3(0.12, 0.72, 0.64), coolPulse);
  vec3 outerFiber = mix(vec3(0.025, 0.3, 0.5), vec3(0.1, 0.58, 0.74), 0.5 + 0.5 * sin(fiberPhase * 5.2 + 1.1));
  vec3 fineFiber = mix(vec3(0.1, 0.5, 0.62), vec3(0.36, 0.82, 0.72), 0.34 + needleSeed * 0.32);
  float blossomWave = 0.5 + 0.5 * sin(radius * 8.4 - uTime * 0.34 + foldedAngle * 3.0 + fiberWarp * 1.4);
  float blossomGate = smoothstep(0.76, 0.96, blossomWave);
  float blossomBand = exp(-pow((radialDepth - 0.68) / 0.27, 2.0));
  float blossomAccent = blossomGate * blossomBand * smoothstep(0.16, 0.64, body + spark * 1.35 + edge * 0.38);
  blossomAccent *= mix(0.14, 1.0, inkActivity);
  vec3 blossomFiber = mix(vec3(0.96, 0.18, 0.28), vec3(1.0, 0.46, 0.34), 0.32 + needleSeed * 0.38);
  liquid = vec3(0.002, 0.016, 0.022) + innerFiber * (tubeA * 0.48 + (strandA + strandB + strandC) * 0.36);
  liquid += outerFiber * (tubeB * 0.38 + (outerA + outerB) * 0.38);
  liquid += fineFiber * (tubeC * 0.3 + (fineA + fineB) * 0.34);
  liquid += mix(innerFiber, outerFiber, 0.5) * pressureWeave * (tubeA + tubeB + tubeC * 0.7) * 0.16;
  liquid += mix(vec3(0.12, 0.62, 0.78), vec3(0.34, 0.84, 0.7), needleSeed) * needleCurtain * 0.3;
  liquid += mix(innerFiber, outerFiber, radialDepth) * frontWeave * 0.2;
  liquid += mix(innerFiber, outerFiber, radialDepth) * fluidSheet * 0.34;
  liquid = mix(liquid, blossomFiber * (0.42 + body * 0.16), blossomAccent * 0.72);
  liquid *= inkMask * mix(0.84, 1.02, radialDepth);
  tone = clamp(body + edge * 0.24, 0.0, 1.0);
`
    default:
      return `
  vec2 q = liquidUv + vec2(-uTime * (0.06 + uMotion * 0.025), velocity.y * 0.18);
  float warp = fbm(q * vec2(1.7, 2.5) + vec2(0.0, uTime * 0.035)) * 2.0 - 1.0;
  float sheet = sin((q.y + warp * 0.085 + flowPhase * 0.14) * (5.4 + detail * 0.86) + q.x * 2.35);
  float shear = sin((q.y + warp * 0.035 - flowPhase * 0.08) * (16.0 + detail * 2.0) - q.x * 4.8 + uTime * 0.34);
  float slab = 1.0 - smoothstep(0.08 + flowPressure * 0.04, 0.86 + flowPressure * 0.18, abs(sheet));
  float cut = pow(max(0.0, 1.0 - abs(shear)), 13.0 + flowPressure * 8.0);
  body = clamp(slab * (0.42 + fluid * 0.72) + fluid * 0.38, 0.0, 1.0);
  edge = cut * (0.3 + fluid * 0.7);
  spark = pow(max(0.0, 1.0 - abs(sin((q.y + warp * 0.03) * 39.0 + q.x * 7.0))), 32.0) * body;
  liquid = mix(vec3(0.035, 0.095, 0.22), vec3(0.72, 0.94, 1.0), smoothstep(0.08, 0.94, body));
  liquid += vec3(0.0, 0.72, 1.0) * edge * 0.68;
  liquid += vec3(0.58, 0.24, 1.0) * edge * spark * 0.2;
  liquid += vec3(0.76, 0.32, 1.0) * spark * 0.16;
  tone = body;
`
  }
}

const buildFragmentShader = (style: number) => `
precision highp float;
#define FLUID_MODE ${Math.round(style).toFixed(1)}

varying vec2 vUv;

uniform sampler2D uVelocity;
uniform sampler2D uDensity;
uniform sampler2D uDye;
uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uMotion;
uniform float uDetail;
uniform vec3 uPrimary;
uniform vec4 uAudio;
uniform float uStyle;
uniform float uParticles;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  return vec2(hash21(p), hash21(p + vec2(19.19, 73.31)));
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
  mat2 r = mat2(0.78, -0.62, 0.62, 0.78);
  for (int i = 0; i < 3; i++) {
    v += noise(p) * a;
    p = r * p * 2.03 + 17.11;
    a *= 0.52;
  }
  return v;
}

float lineGlow(float d, float width) {
  return exp(-abs(d) / max(width, 0.0001));
}

float stroke(float d, float width) {
  return 1.0 - smoothstep(width, width * 2.15, abs(d));
}

vec3 oilPalette(float t) {
  return 0.5 + 0.5 * cos(6.28318 * (vec3(0.03, 0.31, 0.68) + t));
}

void main() {
  vec2 uv = vUv;
  float bass = clamp(uAudio.x, 0.0, 1.0);
  float mid = clamp(uAudio.y, 0.0, 1.0);
  float treble = clamp(uAudio.z, 0.0, 1.0);
  float beat = clamp(uAudio.w, 0.0, 1.0);
  vec2 rawVelocity = texture2D(uVelocity, uv).xy;
  float speed = clamp(length(rawVelocity) * 0.012, 0.0, 1.0);
  vec2 velocity = clamp(rawVelocity * 0.0022, vec2(-0.11), vec2(0.11));
  vec2 flowUv = clamp(uv - vec2(velocity.x * 0.82, velocity.y * 0.34), 0.001, 0.999);
  vec4 densitySample = texture2D(uDensity, flowUv);
  vec3 dye = texture2D(uDye, flowUv).rgb * 3.0;
  float fluid = clamp(densitySample.b * 0.74 + length(dye) * 1.25 + speed * 0.55, 0.0, 1.0);

  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = uv * 2.0 - 1.0;
  p.x *= aspect;
  float flowPressure = smoothstep(0.04, 0.9, fluid);
  vec2 eddy = vec2(-velocity.y, velocity.x);
  vec2 liquidUv = clamp(
    uv + velocity * vec2(1.5, 0.9) + eddy * (0.34 + flowPressure * 0.54) + (dye.rg - dye.gb) * 0.018,
    0.001,
    0.999
  );
  vec2 liquidP = liquidUv * 2.0 - 1.0;
  liquidP.x *= aspect;
  float flowPhase = fbm(liquidUv * vec2(3.2, 2.35) + dye.xy * 0.18 + vec2(uTime * 0.018, -uTime * 0.012));
  float flowWidth = 1.0 + flowPressure * 0.78 + speed * 0.72;
  float detail = max(uDetail, 0.2);
  float motion = 0.5 + uMotion * 0.5;
  float tone = 0.0;
  float body = 0.0;
  float edge = 0.0;
  float spark = 0.0;
  vec3 liquid = vec3(0.0);
${getFluidStyleBase(style)}

${getFluidStyleFragmentBody(style)}

  float wake = smoothstep(0.25, 1.0, speed) * (0.12 + fluid * 0.28);
  vec3 audioGlimmer = accent * (mid * edge * 0.08 + treble * spark * 0.14 + beat * tone * 0.035);
  color += liquid * (0.82 + uIntensity * 0.28 + wake * 1.15);
  color += dye * (0.18 + fluid * 0.3) * mix(vec3(1.0), accent, 0.24);
  color += accent * edge * (0.16 + uIntensity * 0.075);
  color += mix(vec3(0.88, 0.96, 1.0), accent, 0.42) * spark * (0.12 + treble * 0.1);
  color += audioGlimmer;

  float particleDrive = clamp(uParticles, 0.0, 2.0) * ${style === 10 ? '0.32' : '1.0'};
  vec2 sparkleGrid = vec2(uv.x * aspect, uv.y) * (8.5 + particleDrive * 7.0);
  sparkleGrid.x -= uTime * (0.06 + uMotion * 0.025);
  vec2 sparkleId = floor(sparkleGrid);
  vec2 sparkleLocal = fract(sparkleGrid) - 0.5;
  vec2 sparkleOffset = (hash22(sparkleId + 4.7) - 0.5) * 0.46;
  vec2 sparkleRaw = sparkleLocal - sparkleOffset;
  vec2 flowDir = normalize(vec2(1.0, 0.08) + velocity * 2.4);
  vec2 flowN = vec2(-flowDir.y, flowDir.x);
  vec2 sparkleP = vec2(dot(sparkleRaw, flowDir), dot(sparkleRaw, flowN));
  float sparkleSeed = hash21(sparkleId + 12.8);
  float sparkleGate = step(0.68 - particleDrive * 0.17, sparkleSeed);
  float surfaceGate = smoothstep(0.08, 0.62, body + edge * 1.05 + fluid * 0.28);
  float filamentCurve = sin(sparkleP.x * 5.8 + sparkleSeed * 6.28318 + uTime * 0.72) * 0.022;
  float filamentCore = 1.0 - smoothstep(0.018, 0.068, abs(sparkleP.y + filamentCurve));
  float filamentHalo = 1.0 - smoothstep(0.06, 0.18, abs(sparkleP.y + filamentCurve));
  float filamentTaper = 1.0 - smoothstep(0.16, 0.48, abs(sparkleP.x));
  float glintLine = (filamentCore * 0.62 + filamentHalo * 0.18) * filamentTaper;
  float twinkle = 0.62 + 0.38 * sin(uTime * (2.4 + sparkleSeed * 2.1) + sparkleSeed * 19.0);
  float liquidParticles = sparkleGate * surfaceGate * twinkle * glintLine * particleDrive;
  color += mix(vec3(0.74, 0.95, 1.0), accent, 0.48) * liquidParticles * 0.48;

  float verticalFocus = smoothstep(0.0, 0.11, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y));
  float sideFocus = smoothstep(0.0, 0.08, uv.x) * (1.0 - smoothstep(0.92, 1.0, uv.x));
  color *= 0.78 + verticalFocus * 0.24;
  color *= 0.88 + sideFocus * 0.12;
  color = color / (1.0 + color * 0.3);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, 1.18);
  color = min(color, vec3(1.08, 1.06, 1.1));
  color = pow(max(color, 0.0), vec3(0.82));

  gl_FragColor = vec4(color, 1.0);
}
`

const particleSimShader = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uPositions;
uniform sampler2D uVelocity;
uniform sampler2D uDensity;
uniform float uDelta;
uniform float uTime;
uniform float uMotion;
uniform float uIntensity;
uniform float uMode;
uniform float uParticleAmount;

float hash11(float n) {
  return fract(sin(n) * 43758.5453123);
}

vec2 rotate2(vec2 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

void main() {
  vec4 state = texture2D(uPositions, vUv);
  vec2 pos = state.xy;
  float life = state.z;
  float seed = state.w;
  vec2 velocity = texture2D(uVelocity, clamp(pos, 0.001, 0.999)).xy * 0.0028;
  float density = texture2D(uDensity, clamp(pos, 0.001, 0.999)).b;
  float mode = uMode;
  float amount = max(uParticleAmount, 0.001);
  float lane = sin((pos.y + seed * 0.13) * (6.0 + mode * 0.85) + uTime * (0.22 + mode * 0.025));
  vec2 drift = vec2(0.028 + uMotion * 0.024 + density * 0.045, 0.0);
  drift.y += lane * (0.002 + mode * 0.00055);

  if (mode > 0.5 && mode < 1.5) {
    drift.x *= 1.12;
    drift.y += sin(pos.x * 24.0 + seed * 8.0 + uTime * 1.2) * 0.016;
    drift.y += sin(pos.x * 7.0 - pos.y * 18.0 + seed * 5.0) * 0.006;
  } else if (mode > 1.5 && mode < 2.5) {
    vec2 center = pos - vec2(0.5, 0.5);
    drift += rotate2(center, 1.5708) * (0.018 + density * 0.028);
  } else if (mode > 2.5 && mode < 3.5) {
    drift *= 0.46;
    velocity *= 0.58;
    drift.y += sin(pos.x * 9.0 + seed * 4.0 + uTime * 0.22) * 0.004;
  } else if (mode > 3.5 && mode < 4.5) {
    drift.x *= 1.34;
    drift.y += sin(pos.x * 12.0 + pos.y * 8.0 + uTime * 1.1) * 0.012;
  } else if (mode > 4.5 && mode < 5.5) {
    drift += vec2(0.0, 0.026 + hash11(seed * 9.1) * 0.028);
  } else if (mode > 5.5 && mode < 6.5) {
    drift.x *= 0.74;
    drift.y += sin(pos.x * 34.0 + seed * 6.0 + uTime * 1.8) * 0.022;
    drift.y += sin((pos.x + pos.y) * 18.0 + seed * 4.0) * 0.006;
  } else if (mode > 7.5 && mode < 8.5) {
    drift.x = 0.035 + density * 0.03;
    drift.y = -0.022 + sin(pos.x * 18.0 + seed * 4.0 + uTime) * 0.012;
  } else if (mode > 8.5 && mode < 9.5) {
    drift.x = 0.052 + density * 0.035;
    drift.y = sin(pos.y * 24.0 + seed * 6.0) * 0.003;
  } else if (mode > 9.5 && mode < 10.5) {
    float spoke = floor(hash11(seed * 18.7) * 7.0) - 3.0;
    float weave = sin(pos.x * 18.0 + seed * 8.0 + uTime * 0.9) * 0.004;
    drift.x = 0.034 + density * 0.026 + uMotion * 0.008;
    drift.y = spoke * 0.004 + weave;
    velocity *= 0.82;
  } else if (mode > 6.5) {
    drift *= 0.36;
    velocity *= 0.52;
  }

  pos += (drift + velocity * (0.72 + density * 1.8)) * uDelta * (0.45 + amount * 0.75);
  life += uDelta * (0.055 + hash11(seed + 2.0) * 0.035 + density * 0.015);

  bool reset = life > 1.0 || pos.x > 1.04 || pos.y < -0.06 || pos.y > 1.06;
  if (reset) {
    float bucket = floor(uTime * (7.0 + amount * 5.0));
    float r1 = hash11(seed * 13.17 + bucket);
    float r2 = hash11(seed * 31.41 + bucket * 1.37);
    float r3 = hash11(seed * 71.77 + bucket * 2.11);
    pos = vec2(-0.035 - r1 * 0.06, r2);
    if (mode > 4.5 && mode < 5.5) {
      pos = vec2(r1, -0.035 - r2 * 0.05);
    } else if (mode > 2.5 && mode < 3.5) {
      pos = vec2(-0.02 - r1 * 0.035, 0.14 + r2 * 0.72);
    } else if (mode > 7.5 && mode < 8.5) {
      pos = vec2(0.04 + r1 * 0.88, 0.96 + r2 * 0.06);
    } else if (mode > 8.5 && mode < 9.5) {
      pos = vec2(-0.035 - r1 * 0.05, 0.14 + r2 * 0.72);
    } else if (mode > 9.5 && mode < 10.5) {
      float row = floor(r2 * 7.0);
      pos = vec2(-0.03 - r1 * 0.04, 0.12 + row * 0.125 + r3 * 0.024);
    } else if (mode > 6.5) {
      pos = vec2(-0.02 - r1 * 0.04, 0.18 + r2 * 0.64);
    }
    life = r3 * 0.18;
    seed = fract(seed + 0.137 + r1 * 0.071);
  }

  gl_FragColor = vec4(pos, life, seed);
}
`

const particleRenderVertexShader = `
precision highp float;

attribute vec2 aParticleUv;

uniform sampler2D uPositions;
uniform sampler2D uDye;
uniform sampler2D uDensity;
uniform vec2 uResolution;
uniform vec3 uPrimary;
uniform float uTime;
uniform float uPointSize;
uniform float uOpacity;
uniform float uMode;

varying vec3 vParticleColor;
varying float vParticleAlpha;
varying float vParticleMode;
varying float vParticleSeed;
varying float vParticleLife;
varying float vParticleSurface;

float particleField(vec2 sampleUv) {
  vec3 fieldDye = texture2D(uDye, clamp(sampleUv, 0.001, 0.999)).rgb;
  float fieldDensity = texture2D(uDensity, clamp(sampleUv, 0.001, 0.999)).b;
  return max(max(fieldDye.r, fieldDye.g), fieldDye.b) + fieldDensity * 0.22;
}

void main() {
  vec4 state = texture2D(uPositions, aParticleUv);
  vec2 pos = clamp(state.xy, 0.0, 1.0);
  float life = clamp(state.z, 0.0, 1.0);
  float seed = state.w;
  vec3 rawDye = texture2D(uDye, pos).rgb;
  vec3 dye = rawDye * 1.35;
  vec2 texel = 1.0 / max(uResolution, vec2(1.0));
  float field = particleField(pos);
  float edgeGradient =
    abs(particleField(pos + vec2(texel.x * 5.0, 0.0)) - particleField(pos - vec2(texel.x * 5.0, 0.0))) +
    abs(particleField(pos + vec2(0.0, texel.y * 5.0)) - particleField(pos - vec2(0.0, texel.y * 5.0)));
  float fieldMask = smoothstep(0.38, 1.12, field);
  float edgeMask = smoothstep(0.025, 0.18, edgeGradient);
  float surfaceMask = pow(fieldMask * (0.12 + edgeMask * 0.88), 2.75);
  float glow = 1.0 - smoothstep(0.12, 1.0, life);
  float lifeFade = smoothstep(0.0, 0.1, life) * (1.0 - smoothstep(0.46, 0.9, life));
  float mode = floor(uMode + 0.5);
  vec3 oil = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.27, 0.62) + seed + uTime * 0.035));
  vParticleColor = mix(uPrimary, vec3(0.58, 0.9, 1.0), 0.34);
  if (mode < 0.5) {
    vParticleColor = mix(vec3(0.74, 0.92, 1.0), vec3(0.22, 0.62, 1.0), smoothstep(0.2, 0.95, sin(seed * 15.0) * 0.5 + 0.5));
  } else if (mode < 1.5) {
    vParticleColor = mix(vec3(0.0, 0.88, 1.0), vec3(0.95, 0.08, 0.72), smoothstep(0.5, 1.0, sin(seed * 19.0) * 0.5 + 0.5));
  } else if (mode < 2.5) {
    vParticleColor = pow(oil, vec3(0.72));
  } else if (mode < 3.5) {
    vParticleColor = mix(vec3(1.0, 0.36, 0.86), vec3(1.0, 0.74, 0.16), smoothstep(0.2, 0.95, sin(seed * 13.0) * 0.5 + 0.5));
  } else if (mode < 4.5) {
    vParticleColor = mix(vec3(1.0, 0.08, 0.42), vec3(1.0, 0.62, 0.02), smoothstep(0.2, 0.96, sin(seed * 17.0) * 0.5 + 0.5));
  } else if (mode < 5.5) {
    vParticleColor = mix(vec3(0.0, 0.86, 1.0), vec3(0.6, 1.0, 0.18), smoothstep(0.24, 0.96, sin(seed * 11.0) * 0.5 + 0.5));
  } else if (mode < 6.5) {
    vParticleColor = mix(vec3(0.35, 0.16, 1.0), vec3(0.0, 0.82, 1.0), smoothstep(0.18, 0.96, sin(seed * 19.0) * 0.5 + 0.5));
  } else if (mode < 7.5) {
    vParticleColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.72, 0.2), smoothstep(0.25, 0.95, sin(seed * 15.0) * 0.5 + 0.5));
  } else if (mode < 8.5) {
    vParticleColor = vec3(0.25, 1.0, 0.72);
  } else if (mode < 9.5) {
    vParticleColor = mix(vec3(0.12, 0.78, 1.0), vec3(1.0, 0.48, 0.12), smoothstep(0.25, 0.95, sin(seed * 12.0) * 0.5 + 0.5));
  } else {
    float shell = smoothstep(0.18, 0.98, sin(seed * 23.0 + uTime * 0.18) * 0.5 + 0.5);
    vec3 blueShot = vec3(0.28, 0.82, 1.0);
    vec3 violetShot = vec3(0.78, 0.42, 1.0);
    vec3 whiteCore = vec3(0.9, 0.98, 1.0);
    vParticleColor = mix(mix(blueShot, violetShot, shell), whiteCore, 0.24);
  }
  vParticleColor = mix(vParticleColor, dye * 0.72 + uPrimary * 0.28, clamp(length(dye) * 0.52, 0.0, 0.68));
  vParticleColor = mix(vParticleColor, vec3(0.82, 0.98, 1.0), 0.16 + glow * 0.08);
  vParticleColor = min(vParticleColor * 1.52, vec3(1.58));
  vParticleAlpha = uOpacity * (0.05 + glow * 0.26) * (0.62 + 0.22 * sin(seed * 41.0 + uTime * 1.8)) * lifeFade * surfaceMask;
  vParticleMode = mode;
  vParticleSeed = seed;
  vParticleLife = life;
  vParticleSurface = surfaceMask;
  vec2 clip = pos * 2.0 - 1.0;
  gl_Position = vec4(clip, 0.0, 1.0);
  float sparkle = 0.86 + 0.2 * sin(seed * 31.0 + uTime * (1.4 + uMode * 0.08));
  float modeSize = 1.0;
  if (mode > 4.5 && mode < 5.5) {
    modeSize = 1.18;
  } else if (mode > 5.5 && mode < 6.5) {
    modeSize = 0.96;
  } else if (mode > 9.5 && mode < 10.5) {
    modeSize = 0.9;
  } else if (mode > 2.5 && mode < 3.5) {
    modeSize = 1.08;
  } else if (mode < 0.5 || mode > 6.5) {
    modeSize = 1.22;
  }
  gl_PointSize = uPointSize * modeSize * sparkle * (0.84 + glow * 0.18) * (0.12 + surfaceMask * 0.88);
}
`

const particleRenderFragmentShader = `
precision highp float;

varying vec3 vParticleColor;
varying float vParticleAlpha;
varying float vParticleMode;
varying float vParticleSeed;
varying float vParticleLife;
varying float vParticleSurface;

mat2 particleRot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float mode = floor(vParticleMode + 0.5);
  if (mode > 9.5 && mode < 10.5) {
    float dist = length(p);
    float core = 1.0 - smoothstep(0.055, 0.18, dist);
    float shell = 1.0 - smoothstep(0.18, 0.34, abs(dist - 0.22));
    float halo = 1.0 - smoothstep(0.16, 0.5, dist);
    float alpha = vParticleAlpha * (core * 0.72 + shell * 0.16 + halo * 0.18) * vParticleSurface;
    if (alpha < 0.008) {
      discard;
    }
    vec3 bullet = mix(vParticleColor, vec3(0.92, 0.99, 1.0), core * 0.55);
    gl_FragColor = vec4(bullet * (0.34 + core * 0.5 + shell * 0.2), alpha);
    return;
  }
  float angle = 0.05 * sin(vParticleSeed * 19.0 + mode * 0.37);
  vec2 r = particleRot(angle) * p;
  float curve = sin(r.x * 5.2 + vParticleSeed * 5.7) * 0.018;
  float slipCore = 1.0 - smoothstep(0.028, 0.1, abs(r.y + curve));
  float slipHalo = 1.0 - smoothstep(0.09, 0.25, abs(r.y + curve));
  float taper = 1.0 - smoothstep(0.2, 0.5, abs(r.x));
  float shape = clamp((slipCore * 0.52 + slipHalo * 0.16) * taper, 0.0, 1.0);
  float glint = slipCore * taper * 0.16;
  float alpha = vParticleAlpha * (shape * 0.5 + glint * 0.1) * vParticleSurface;
  if (alpha < 0.008) {
    discard;
  }
  vec3 glass = mix(vParticleColor, vec3(0.72, 0.95, 1.0), clamp(glint * 0.08, 0.0, 0.12));
  gl_FragColor = vec4(glass * (shape * 0.42 + glint * 0.28), alpha);
}
`

const qualitySettings = {
  high: { ratioCap: 1, maxPixels: 1_280_000, profile: 'performance' },
  balanced: { ratioCap: 0.92, maxPixels: 860_000, profile: 'performance' },
  low: { ratioCap: 0.58, maxPixels: 220_000, profile: 'performance' },
  auto: { ratioCap: 0.92, maxPixels: 900_000, profile: 'performance' },
} as const satisfies Record<RenderQuality, { ratioCap: number; maxPixels: number; profile: FluidProfile }>

const performanceQualityCap = { ratioCap: 0.72, maxPixels: 520_000 }
const READY_WARMUP_FRAMES = 5
const READY_WARMUP_MS = 260
const FIRST_STATS_DELAY_MS = 2600
const STATS_INTERVAL_MS = 1800

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const EMPTY_AUDIO_LEVELS: AudioLevels = { bass: 0, mid: 0, treble: 0, beat: 0 }
const GESTURE_REPLAY_LANE_BASE = 60
const GESTURE_REPLAY_ECHO_STRIDE = 8

const hexToColor = (value: ControlValues[string], fallback: string) => {
  const color = new Color()
  color.set(typeof value === 'string' ? value : fallback)
  return color
}

const readNumber = (values: ControlValues, id: string, fallback: number) => {
  const value = values[id]
  return typeof value === 'number' ? value : fallback
}

const PARTICLE_TEXTURE_SIZE = 20

type FluidParticleSystem = {
  update: (options: {
    delta: number
    time: number
    velocityTexture: unknown
    densityTexture: unknown
    dyeTexture: unknown
    primary: Color
    motion: number
    intensity: number
    particleAmount: number
    resolution: ResizeState
  }) => void
  dispose: () => void
}

const getFluidStyleId = (effect: EffectDefinition) => {
  const styleTag = effect.tags.find((tag) => tag.startsWith('fluid-style-'))
  const style = styleTag ? Number(styleTag.replace('fluid-style-', '')) : 0
  return Number.isFinite(style) ? style : 0
}

const hasGpgpuParticles = (effect: EffectDefinition) => effect.tags.includes('gpgpu-particles')

const createInitialParticleTexture = (size: number) => {
  const data = new Float32Array(size * size * 4)
  const random = (value: number) => {
    const x = Math.sin(value) * 43758.5453123
    return x - Math.floor(x)
  }

  for (let index = 0; index < size * size; index += 1) {
    const seed = (index + 0.5) / (size * size)
    const x = random(index * 12.9898 + 78.233)
    const y = random(index * 39.3467 + 11.135)
    data[index * 4 + 0] = x
    data[index * 4 + 1] = y
    data[index * 4 + 2] = (index % 97) / 97
    data[index * 4 + 3] = seed
  }

  const texture = new DataTexture(data, size, size, RGBAFormat, FloatType)
  texture.minFilter = NearestFilter
  texture.magFilter = NearestFilter
  texture.needsUpdate = true
  return texture
}

const createFluidParticleSystem = (
  renderer: WebGLRenderer,
  scene: Scene,
  camera: OrthographicCamera,
  effect: EffectDefinition,
): FluidParticleSystem | null => {
  if (!hasGpgpuParticles(effect)) {
    return null
  }

  try {
    const size = PARTICLE_TEXTURE_SIZE
    const mode = getFluidStyleId(effect)
    const initialTexture = createInitialParticleTexture(size)
    const targets = [0, 1].map(
      () =>
        new WebGLRenderTarget(size, size, {
          type: FloatType,
          format: RGBAFormat,
          minFilter: NearestFilter,
          magFilter: NearestFilter,
          depthBuffer: false,
          stencilBuffer: false,
        }),
    )
    const simScene = new Scene()
    const simMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader: particleSimShader,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uPositions: { value: initialTexture },
        uVelocity: { value: null },
        uDensity: { value: null },
        uDelta: { value: 0 },
        uTime: { value: 0 },
        uMotion: { value: 1 },
        uIntensity: { value: 1 },
        uMode: { value: mode },
        uParticleAmount: { value: 1 },
      },
    })
    const simGeometry = new PlaneGeometry(2, 2)
    const simMesh = new Mesh(simGeometry, simMaterial)
    simScene.add(simMesh)

    const particleCount = size * size
    const particleGeometry = new BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const particleUvs = new Float32Array(particleCount * 2)
    for (let row = 0; row < size; row += 1) {
      for (let column = 0; column < size; column += 1) {
        const index = row * size + column
        particleUvs[index * 2 + 0] = (column + 0.5) / size
        particleUvs[index * 2 + 1] = (row + 0.5) / size
      }
    }
    particleGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    particleGeometry.setAttribute('aParticleUv', new BufferAttribute(particleUvs, 2))

    const particleMaterial = new ShaderMaterial({
      vertexShader: particleRenderVertexShader,
      fragmentShader: particleRenderFragmentShader,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uPositions: { value: initialTexture },
        uDye: { value: null },
        uDensity: { value: null },
        uResolution: { value: new Vector2(1, 1) },
        uPrimary: { value: new Color(effect.accentColor) },
        uTime: { value: 0 },
        uPointSize: { value: 2.6 },
        uOpacity: { value: 0.65 },
        uMode: { value: mode },
      },
    })
    const particles = new Points(particleGeometry, particleMaterial)
    particles.frustumCulled = false
    particles.renderOrder = 5
    scene.add(particles)

    let currentIndex = 0
    let initialized = false

    return {
      update: ({
        delta,
        time,
        velocityTexture,
        densityTexture,
        dyeTexture,
        primary,
        motion,
        intensity,
        particleAmount,
        resolution,
      }) => {
        const nextIndex = currentIndex === 0 ? 1 : 0
        simMaterial.uniforms.uPositions.value = initialized ? targets[currentIndex].texture : initialTexture
        simMaterial.uniforms.uVelocity.value = velocityTexture
        simMaterial.uniforms.uDensity.value = densityTexture
        simMaterial.uniforms.uDelta.value = delta
        simMaterial.uniforms.uTime.value = time
        simMaterial.uniforms.uMotion.value = motion
        simMaterial.uniforms.uIntensity.value = intensity
        simMaterial.uniforms.uParticleAmount.value = particleAmount

        renderer.setRenderTarget(targets[nextIndex])
        renderer.render(simScene, camera)
        renderer.setRenderTarget(null)

        currentIndex = nextIndex
        initialized = true

        particleMaterial.uniforms.uPositions.value = targets[currentIndex].texture
        particleMaterial.uniforms.uDye.value = dyeTexture
        particleMaterial.uniforms.uDensity.value = densityTexture
        particleMaterial.uniforms.uPrimary.value.copy(primary)
        particleMaterial.uniforms.uTime.value = time
        particleMaterial.uniforms.uPointSize.value = 7.2 + particleAmount * 7.4 + intensity * 0.55
        particleMaterial.uniforms.uOpacity.value = clamp(0.035 + particleAmount * 0.12, 0, 0.18)
        particleMaterial.uniforms.uResolution.value.set(resolution.width, resolution.height)
        particles.visible = particleAmount > 0.01
      },
      dispose: () => {
        scene.remove(particles)
        targets.forEach((target) => target.dispose())
        initialTexture.dispose()
        simGeometry.dispose()
        simMaterial.dispose()
        particleGeometry.dispose()
        particleMaterial.dispose()
      },
    }
  } catch {
    return null
  }
}

type FluidSizeTarget = {
  resize: (width: number, height: number) => void
}

type CanvasRendererSizeTarget = {
  setPixelRatio: (value: number) => void
  setSize: (width: number, height: number, updateStyle?: boolean) => void
}

const resizeRenderer = (
  canvas: HTMLCanvasElement,
  renderer: CanvasRendererSizeTarget,
  fluid: FluidSizeTarget,
  performanceMode: boolean,
  quality: RenderQuality,
): ResizeState => {
  const fallbackRect = canvas.getBoundingClientRect()
  const cssWidth = Math.max(1, canvas.clientWidth || fallbackRect.width)
  const cssHeight = Math.max(1, canvas.clientHeight || fallbackRect.height)
  const settings = qualitySettings[quality]
  const ratioCap = Math.min(settings.ratioCap, performanceMode ? performanceQualityCap.ratioCap : settings.ratioCap)
  const ratio = Math.min(window.devicePixelRatio || 1, ratioCap)
  const rawWidth = Math.max(1, cssWidth * ratio)
  const rawHeight = Math.max(1, cssHeight * ratio)
  const maxPixels = Math.min(settings.maxPixels, performanceMode ? performanceQualityCap.maxPixels : settings.maxPixels)
  const pixelScale = Math.min(1, Math.sqrt(maxPixels / (rawWidth * rawHeight)))
  const width = Math.max(1, Math.floor(rawWidth * pixelScale))
  const height = Math.max(1, Math.floor(rawHeight * pixelScale))

  renderer.setPixelRatio(1)
  renderer.setSize(width, height, false)
  fluid.resize(width, height)

  const nativeWidth = Math.max(1, cssWidth * (window.devicePixelRatio || 1))
  return {
    fps: 0,
    scale: width / nativeWidth,
    pixelRatio: ratio,
    width,
    height,
  }
}

const dyeFromPalette = (primary: Color, time: number, lane: number, style = 0): [number, number, number] => {
  if (Math.round(style) === 8) {
    const replayLane = lane - GESTURE_REPLAY_LANE_BASE
    const isReplay = replayLane >= 0
    const echo = isReplay ? Math.floor(replayLane / GESTURE_REPLAY_ECHO_STRIDE) : -1
    const mixColor = (a: readonly number[], b: readonly number[], amount: number) =>
      a.map((component, index) => component + (b[index] - component) * amount)

    if (isReplay) {
      const palettes = [
        [0.42, 0.95, 1.0],
        [0.74, 0.48, 1.0],
        [1.0, 0.34, 0.64],
        [1.0, 0.72, 0.28],
      ] as const
      const from = palettes[echo % palettes.length]
      const to = palettes[(echo + 1) % palettes.length]
      const drift = 0.28 + Math.sin(time * 0.55 + echo * 1.37) * 0.18
      const replay = mixColor(from, to, clamp(drift, 0, 0.48))
      const pulse = 0.86 + Math.sin(time * 1.15 + echo * 0.82) * 0.1

      return [
        clamp((replay[0] * 0.88 + primary.r * 0.12) * pulse, 0.04, 0.98),
        clamp((replay[1] * 0.88 + primary.g * 0.12) * pulse, 0.04, 0.98),
        clamp((replay[2] * 0.88 + primary.b * 0.12) * pulse, 0.04, 0.98),
      ]
    }

    const mint = [0.05, 0.95, 0.78] as const
    const sky = [0.08, 0.62, 1.0] as const
    const violet = [0.5, 0.36, 1.0] as const
    const warmGlint = [1.0, 0.86, 0.46] as const
    const breath = 0.5 + Math.sin(time * 0.42 + lane * 0.35) * 0.5
    const prism = 0.14 + Math.sin(time * 0.23 + lane * 0.82) * 0.1
    const glint = Math.max(0, Math.sin(time * 0.72 + lane * 1.41)) ** 4 * 0.2
    const cool = mixColor(mixColor(mint, sky, breath), violet, clamp(prism, 0.04, 0.24))
    const color = mixColor(cool, warmGlint, glint)
    const pulse = 0.9 + Math.sin(time * 0.82 + lane * 1.7) * 0.08

    return [
      clamp((color[0] * 0.72 + primary.r * 0.28) * pulse, 0.035, 0.95),
      clamp((color[1] * 0.72 + primary.g * 0.28) * pulse, 0.035, 0.95),
      clamp((color[2] * 0.72 + primary.b * 0.28) * pulse, 0.035, 0.95),
    ]
  }

  if (Math.round(style) === 10) {
    const mixColor = (a: readonly number[], b: readonly number[], amount: number) =>
      a.map((component, index) => component + (b[index] - component) * amount)
    const cyan = [0.28, 0.9, 1.0] as const
    const blue = [0.24, 0.46, 1.0] as const
    const violet = [0.72, 0.3, 1.0] as const
    const returnGlint = [0.96, 0.8, 1.0] as const
    const ricochet = (lane % 4) / 3
    const phase = 0.5 + Math.sin(time * 0.8 + lane * 0.43) * 0.5
    const base = ricochet < 0.34 ? cyan : ricochet < 0.68 ? blue : violet
    const glint = Math.max(0, Math.sin(time * 1.3 + lane * 0.77)) ** 5 * 0.22
    const color = mixColor(base, returnGlint, glint + phase * 0.08)
    const pulse = 0.88 + Math.sin(time * 1.2 + lane * 0.61) * 0.08

    return [
      clamp((color[0] * 0.8 + primary.r * 0.2) * pulse, 0.035, 0.96),
      clamp((color[1] * 0.8 + primary.g * 0.2) * pulse, 0.035, 0.96),
      clamp((color[2] * 0.8 + primary.b * 0.2) * pulse, 0.035, 0.98),
    ]
  }

  if (Math.round(style) === 11) {
    const mixColor = (a: readonly number[], b: readonly number[], amount: number) =>
      a.map((component, index) => component + (b[index] - component) * amount)
    const lagoon = [0.01, 0.36, 0.48] as const
    const aqua = [0.04, 0.62, 0.72] as const
    const seafoam = [0.18, 0.78, 0.62] as const
    const ice = [0.38, 0.78, 0.86] as const
    const laneTone = (lane % 4) / 3
    const base = laneTone < 0.34 ? lagoon : laneTone < 0.68 ? aqua : seafoam
    const drift = 0.12 + (0.5 + Math.sin(time * 0.48 + lane * 0.37) * 0.5) * 0.16
    const color = mixColor(base, ice, drift)
    const pulse = 0.9 + Math.sin(time * 0.92 + lane * 0.53) * 0.055

    return [
      clamp((color[0] * 0.82 + primary.r * 0.18) * pulse, 0.018, 0.58),
      clamp((color[1] * 0.82 + primary.g * 0.18) * pulse, 0.12, 0.86),
      clamp((color[2] * 0.82 + primary.b * 0.18) * pulse, 0.16, 0.92),
    ]
  }

  const cyan = [0.0, 0.78, 1.0] as const
  const magenta = [1.0, 0.08, 0.78] as const
  const amber = [1.0, 0.48, 0.08] as const
  const palette = lane % 3 === 0 ? cyan : lane % 3 === 1 ? magenta : amber
  const pulse = 0.92 + Math.sin(time * 0.9 + lane * 1.7) * 0.08

  return [
    clamp((palette[0] * 0.48 + primary.r * 0.62) * pulse, 0.025, 0.95),
    clamp((palette[1] * 0.48 + primary.g * 0.62) * pulse, 0.025, 0.95),
    clamp((palette[2] * 0.48 + primary.b * 0.62) * pulse, 0.025, 0.95),
  ]
}

const createStreamTexture = (accentHex: string, style = 0) => {
  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = 1024
  textureCanvas.height = 512
  const context = textureCanvas.getContext('2d')
  if (!context) {
    return null
  }

  const accent = new Color(accentHex)
  const r = Math.round(accent.r * 255)
  const g = Math.round(accent.g * 255)
  const b = Math.round(accent.b * 255)
  const width = textureCanvas.width
  const height = textureCanvas.height
  const styleId = Math.round(style)
  const backgrounds = [
    '#071326',
    '#070022',
    '#090026',
    '#1a0620',
    '#1f0310',
    '#002033',
    '#10062c',
    '#002333',
    '#031819',
    '#030b17',
    '#03111f',
    '#050a12',
  ]

  context.fillStyle = backgrounds[styleId] ?? '#050812'
  context.fillRect(0, 0, width, height)

  const haze = context.createLinearGradient(0, 0, width, height)
  haze.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.08)`)
  haze.addColorStop(0.45, `rgba(${Math.min(255, r + 40)}, ${Math.min(255, g + 28)}, ${Math.min(255, b + 52)}, 0.035)`)
  haze.addColorStop(1, 'rgba(0, 0, 0, 0.14)')
  context.fillStyle = haze
  context.fillRect(0, 0, width, height)

  if (styleId >= 0 && styleId <= 7) {
    context.globalCompositeOperation = 'lighter'
    const drawWideBand = (
      yBase: number,
      amplitude: number,
      lineWidth: number,
      alpha: number,
      phase: number,
      tilt = 0,
    ) => {
      context.beginPath()
      for (let x = -80; x <= width + 80; x += 18) {
        const y = yBase + Math.sin(x * 0.006 + phase) * amplitude + tilt * (x / width - 0.5) * height
        if (x === -80) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      }
      context.shadowBlur = Math.max(1.5, lineWidth * 0.28)
      context.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 1.2})`
      context.lineCap = 'round'
      context.lineJoin = 'miter'
      context.lineWidth = lineWidth
      context.strokeStyle = `rgba(${Math.min(255, r + 32)}, ${Math.min(255, g + 32)}, ${Math.min(255, b + 32)}, ${alpha})`
      context.stroke()
    }

    if (styleId === 2) {
      for (let band = 0; band < 5; band += 1) {
        const y = ((band + 0.55) / 5) * height
        drawWideBand(y, 18 + band * 2, 12 - band * 0.8, 0.14 + band * 0.014, band * 1.3, 0.03)
      }
      const prism = context.createLinearGradient(0, 0, width, 0)
      prism.addColorStop(0, 'rgba(0, 210, 255, 0.05)')
      prism.addColorStop(0.35, 'rgba(255, 62, 215, 0.055)')
      prism.addColorStop(0.72, 'rgba(255, 190, 42, 0.045)')
      prism.addColorStop(1, 'rgba(0, 255, 190, 0.045)')
      context.fillStyle = prism
      context.fillRect(0, 0, width, height)
    } else if (styleId === 4) {
      for (let band = 0; band < 7; band += 1) {
        drawWideBand(((band + 0.45) / 7) * height, 16 + (band % 3) * 3, 11, 0.13, band * 0.85, band % 2 === 0 ? 0.07 : -0.05)
      }
      const heat = context.createLinearGradient(0, 0, width, height)
      heat.addColorStop(0, 'rgba(255, 28, 112, 0.055)')
      heat.addColorStop(0.5, 'rgba(255, 96, 20, 0.04)')
      heat.addColorStop(1, 'rgba(128, 0, 255, 0.035)')
      context.fillStyle = heat
      context.fillRect(0, 0, width, height)
    } else if (styleId === 5) {
      for (let column = 0; column < 7; column += 1) {
        const x = ((column + 0.5) / 7) * width
        const gradient = context.createLinearGradient(x - 60, 0, x + 60, 0)
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
        gradient.addColorStop(0.49, `rgba(${r}, ${g}, ${b}, ${0.06 + (column % 2) * 0.025})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        context.fillStyle = gradient
        context.fillRect(x - 46, 0, 92, height)
      }
      drawWideBand(height * 0.42, 18, 10, 0.14, 0.7, 0.08)
    } else if (styleId === 6) {
      for (let band = 0; band < 6; band += 1) {
        drawWideBand(((band + 0.52) / 6) * height, 18, 10, 0.13, band * 1.1, band % 2 === 0 ? 0.08 : -0.06)
      }
    } else if (styleId === 7) {
      for (let band = 0; band < 4; band += 1) {
        drawWideBand(((band + 0.6) / 4) * height, 14, 12, 0.12, band * 1.5, -0.04)
      }
      context.fillStyle = 'rgba(235, 255, 255, 0.018)'
      context.fillRect(width * 0.18, height * 0.1, width * 0.58, height * 0.8)
    } else {
      for (let band = 0; band < 5; band += 1) {
        drawWideBand(((band + 0.5) / 5) * height, 18 + band * 3, 11 + band * 0.8, 0.12 + band * 0.012, band * 1.6, styleId === 1 ? 0.1 : 0.02)
      }
    }

    context.globalCompositeOperation = 'source-over'
  } else if (style === 8) {
    context.globalCompositeOperation = 'lighter'
    for (let pool = 0; pool < 7; pool += 1) {
      const x = width * (0.12 + ((pool * 0.17) % 0.78))
      const y = height * (0.16 + ((pool * 0.23) % 0.68))
      const radius = 120 + (pool % 3) * 42
      const glow = context.createRadialGradient(x, y, 0, x, y, radius)
      glow.addColorStop(0, `rgba(${Math.min(255, r + 36)}, ${Math.min(255, g + 44)}, ${Math.min(255, b + 34)}, 0.16)`)
      glow.addColorStop(0.34, `rgba(${r}, ${g}, ${b}, 0.065)`)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = glow
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
    }
    for (let cut = 0; cut < 4; cut += 1) {
      const xBase = ((cut + 0.35) / 4) * width
      context.beginPath()
      context.moveTo(xBase - 190, -60)
      context.bezierCurveTo(
        xBase - 70,
        height * 0.22,
        xBase + 55 + Math.sin(cut) * 40,
        height * 0.74,
        xBase + 150,
        height + 70,
      )
      context.shadowBlur = 34
      context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.28)`
      context.lineCap = 'round'
      context.lineWidth = 34 + (cut % 2) * 10
      context.strokeStyle = `rgba(${Math.min(255, r + 24)}, ${Math.min(255, g + 24)}, ${Math.min(255, b + 24)}, 0.075)`
      context.stroke()
      context.shadowBlur = 10
      context.lineWidth = 2.2
      context.strokeStyle = 'rgba(220, 255, 245, 0.16)'
      context.stroke()
    }
    context.globalCompositeOperation = 'source-over'
  } else if (style === 9) {
    for (let lane = 0; lane < 6; lane += 1) {
      const y = ((lane + 0.5) / 6) * height
      context.shadowBlur = 18
      context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.3)`
      context.fillStyle = `rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, ${0.08 + (lane % 2) * 0.03})`
      for (let step = 0; step < 18; step += 1) {
        const x = step * 72 + (lane % 2) * 28
        context.fillRect(x, y - 7 - (lane % 3), 42 + (step % 3) * 24, 3 + (lane % 3))
      }
      context.shadowBlur = 0
      context.fillStyle = 'rgba(255, 185, 90, 0.16)'
      context.fillRect(0, y + 12, width, 1)
    }
  } else if (style === 10) {
    context.globalCompositeOperation = 'lighter'
    const centerX = width * 0.58
    const centerY = height * 0.48
    for (let ring = 0; ring < 5; ring += 1) {
      const radius = 120 + ring * 78
      context.beginPath()
      for (let dot = 0; dot <= 96; dot += 1) {
        const angle = -0.8 + dot * (Math.PI * 1.55 / 96) + ring * 0.22
        const wobble = Math.sin(dot * 0.21 + ring) * 9
        const x = centerX + Math.cos(angle) * (radius + wobble)
        const y = centerY + Math.sin(angle) * (radius * 0.52 + wobble * 0.4)
        if (dot === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      }
      context.shadowBlur = 8
      context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.055)`
      context.lineCap = 'round'
      context.lineJoin = 'round'
      context.lineWidth = 0.9
      context.strokeStyle = `rgba(${Math.min(255, r + 26)}, ${Math.min(255, g + 32)}, ${Math.min(255, b + 38)}, 0.024)`
      context.stroke()
    }

    for (let row = 0; row < 8; row += 1) {
      const angleBase = -0.9 + row * 0.18
      for (let shot = 0; shot < 12; shot += 1) {
        const radius = 90 + shot * 34 + (row % 3) * 8
        const angle = angleBase + shot * 0.035
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius * 0.56 + row * 15 - 48
        context.beginPath()
        context.shadowBlur = 6
        context.shadowColor = row % 2 === 0 ? 'rgba(110, 225, 255, 0.09)' : 'rgba(190, 120, 255, 0.08)'
        context.fillStyle = row % 2 === 0 ? 'rgba(190, 245, 255, 0.032)' : 'rgba(210, 170, 255, 0.028)'
        context.ellipse(x, y, 2.8, 1.25, angle, 0, Math.PI * 2)
        context.fill()
      }
    }
    context.globalCompositeOperation = 'source-over'
  } else if (style === 11) {
    context.globalCompositeOperation = 'lighter'
    const centerX = width * 0.5
    const centerY = height * 0.5
    const strandColors = [
      [24, 170, 192],
      [42, 208, 222],
      [94, 236, 202],
      [104, 220, 244],
      [54, 184, 232],
    ] as const
    const traceCord = (
      sector: number,
      mirror: number,
      cord: number,
      strand: number | null,
    ) => {
      const angle = sector * (Math.PI * 2 / 5) - Math.PI * 0.5
      const color = strandColors[(sector + cord * 2 + (strand ?? 0)) % strandColors.length]
      context.beginPath()
      for (let step = 0; step <= 58; step += 1) {
        const radial = 26 + step * 9.4
        const spineOffset = cord === 0 ? 17 : cord === 1 ? 61 : 108
        const spineWave = cord === 0 ? 7 : cord === 1 ? 11 : 15
        const braidWidth = cord === 0 ? 5.4 : cord === 1 ? 6.8 : 5.2
        const spine = spineOffset + Math.sin(radial * (0.017 - cord * 0.002) + sector * 0.73 + cord) * spineWave
        const braid = strand === null
          ? 0
          : Math.sin(radial * (0.074 - cord * 0.006) + strand * Math.PI * 2 / 3 + cord * 0.8) * braidWidth
        const localX = radial
        const localY = mirror * (spine + braid)
        const turn = mirror * (radial / height * 0.5 + Math.sin(radial * 0.012 - cord * 0.48) * 0.065)
        const pathAngle = angle + turn
        const x = centerX + Math.cos(pathAngle) * localX - Math.sin(pathAngle) * localY
        const y = centerY + Math.sin(pathAngle) * localX + Math.cos(pathAngle) * localY
        if (step === 0) {
          context.moveTo(x, y)
        } else {
          context.lineTo(x, y)
        }
      }
      context.lineCap = 'round'
      context.lineJoin = 'round'
      if (strand === null) {
        context.shadowBlur = cord === 0 ? 22 : cord === 1 ? 15 : 10
        context.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.16)`
        context.lineWidth = cord === 0 ? 19 : cord === 1 ? 14 : 9
        context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${cord === 0 ? 0.055 : cord === 1 ? 0.04 : 0.028})`
      } else {
        context.shadowBlur = cord === 2 ? 5 : 7
        context.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.24)`
        context.lineWidth = cord === 0 ? 2.8 : cord === 1 ? 2.2 : 1.45
        context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${cord === 0 ? 0.21 : cord === 1 ? 0.15 : 0.12})`
      }
      context.stroke()
    }

    for (let sector = 0; sector < 5; sector += 1) {
      for (const mirror of [-1, 1]) {
        for (let cord = 0; cord < 3; cord += 1) {
          traceCord(sector, mirror, cord, null)
          for (let strand = 0; strand < 3; strand += 1) {
            traceCord(sector, mirror, cord, strand)
          }
        }

        const angle = sector * (Math.PI * 2 / 5) - Math.PI * 0.5
        for (let lane = 0; lane < 4; lane += 1) {
          const color = strandColors[(sector + lane + 1) % strandColors.length]
          for (let shot = 0; shot < 18; shot += 1) {
            const radial = 58 + shot * 24 + (lane % 2) * 9
            const cross = mirror * (34 + lane * 29 + Math.sin(radial * 0.021 + lane * 0.82) * 7)
            const halfLength = 4 + (shot % 4) * 1.25
            const turn = mirror * (radial / height * 0.5 + Math.sin(radial * 0.012 + lane * 0.24) * 0.065)
            const shotAngle = angle + turn
            const heading = shotAngle + mirror * (0.14 + Math.cos(radial * 0.012 + lane) * 0.04)
            const centerShotX = centerX + Math.cos(shotAngle) * radial - Math.sin(shotAngle) * cross
            const centerShotY = centerY + Math.sin(shotAngle) * radial + Math.cos(shotAngle) * cross
            context.beginPath()
            context.moveTo(centerShotX - Math.cos(heading) * halfLength, centerShotY - Math.sin(heading) * halfLength)
            context.lineTo(centerShotX + Math.cos(heading) * halfLength, centerShotY + Math.sin(heading) * halfLength)
            context.lineCap = 'round'
            context.shadowBlur = 4
            context.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.22)`
            context.lineWidth = 1.15
            context.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.13)`
            context.stroke()
          }
        }
      }
    }
    context.globalCompositeOperation = 'source-over'
  } else {
    for (let lane = 0; lane < 9; lane += 1) {
    const yBase = ((lane + 0.45) / 9) * height
    const phase = lane * 1.73
    context.beginPath()
    for (let x = -80; x <= width + 80; x += 12) {
      const y = yBase + Math.sin(x * 0.011 + phase) * 16 + Math.sin(x * 0.027 - phase) * 5
      if (x === -80) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }
    }
    context.shadowBlur = 26
    context.shadowColor = `rgba(${r}, ${g}, ${b}, 0.34)`
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = 28 + (lane % 3) * 5
    context.strokeStyle = `rgba(${Math.min(255, r + 24)}, ${Math.min(255, g + 24)}, ${Math.min(255, b + 24)}, 0.14)`
    context.stroke()
    context.shadowBlur = 12
    context.lineWidth = 3.2
    context.strokeStyle = 'rgba(220, 250, 255, 0.26)'
    context.stroke()
    }
  }

  context.shadowBlur = 0
  const texture = new CanvasTexture(textureCanvas)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.needsUpdate = true
  return texture
}

type SplatEmitter = (
  x: number,
  y: number,
  dx: number,
  dy: number,
  time: number,
  lane: number,
  radiusScale?: number,
) => void

const KALEIDO_SEGMENTS = 5

const emitKaleidoSplats = (
  emit: SplatEmitter,
  x: number,
  y: number,
  dx: number,
  dy: number,
  time: number,
  lane: number,
  radiusScale: number,
  aspect = 1,
  segmentIndex?: number,
) => {
  const safeAspect = Math.max(0.25, aspect)
  const px = (x - 0.5) * safeAspect
  const py = y - 0.5
  const radius = Math.max(0.015, Math.hypot(px, py))
  const sourceAngle = Math.atan2(py, px)
  const sector = Math.PI * 2 / KALEIDO_SEGMENTS
  const localAngle = ((sourceAngle + sector * 0.5) % sector + sector) % sector - sector * 0.5
  const foldedAngle = Math.abs(localAngle)
  const reflection = localAngle < 0 ? -1 : 1
  const radialVelocity = dx * Math.cos(sourceAngle) + dy * Math.sin(sourceAngle)
  const tangentVelocity = (-dx * Math.sin(sourceAngle) + dy * Math.cos(sourceAngle)) * reflection

  const startIndex = segmentIndex === undefined
    ? 0
    : ((Math.floor(segmentIndex) % KALEIDO_SEGMENTS) + KALEIDO_SEGMENTS) % KALEIDO_SEGMENTS
  const segmentCount = segmentIndex === undefined ? KALEIDO_SEGMENTS : 1

  for (let offset = 0; offset < segmentCount; offset += 1) {
    const index = (startIndex + offset) % KALEIDO_SEGMENTS
    const targetAngle = foldedAngle + index * sector
    const cosAngle = Math.cos(targetAngle)
    const sinAngle = Math.sin(targetAngle)
    const targetX = 0.5 + cosAngle * radius / safeAspect
    const targetY = 0.5 + sinAngle * radius
    const targetDx = radialVelocity * cosAngle - tangentVelocity * sinAngle
    const targetDy = radialVelocity * sinAngle + tangentVelocity * cosAngle
    emit(targetX, targetY, targetDx, targetDy, time + index * 0.0015, lane + index * 5, radiusScale)
  }
}

type KaleidoMomentumState = {
  active: boolean
  x: number
  y: number
  dx: number
  dy: number
  strength: number
  lastInputAt: number
  nextEmitAt: number
  lane: number
}

const createKaleidoMomentumState = (): KaleidoMomentumState => ({
  active: false,
  x: 0.5,
  y: 0.5,
  dx: 0,
  dy: 0,
  strength: 0,
  lastInputAt: -99,
  nextEmitAt: 0,
  lane: 0,
})

const recordKaleidoMomentum = (
  state: KaleidoMomentumState,
  time: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
  lane: number,
  pressed: boolean,
) => {
  const continuesStroke = state.active && time - state.lastInputAt < 0.32
  const speed = Math.hypot(dx, dy)
  const inputStrength = clamp(speed / 34 + (pressed ? 0.22 : 0), 0.16, 1)

  state.x = continuesStroke ? state.x * 0.56 + x * 0.44 : x
  state.y = continuesStroke ? state.y * 0.56 + y * 0.44 : y
  state.dx = continuesStroke ? state.dx * 0.68 + dx * 0.32 : dx
  state.dy = continuesStroke ? state.dy * 0.68 + dy * 0.32 : dy
  state.strength = continuesStroke
    ? Math.max(state.strength * 0.82, inputStrength)
    : inputStrength
  state.lastInputAt = time
  state.lane = lane
  state.active = true
  if (!continuesStroke || state.nextEmitAt < time - 0.18) {
    state.nextEmitAt = time + 0.045
  }
}

const emitKaleidoMomentumSplats = (
  emit: SplatEmitter,
  state: KaleidoMomentumState,
  time: number,
  style: number,
  aspect: number,
) => {
  if (Math.round(style) !== 11 || !state.active) {
    return
  }

  const age = Math.max(0, time - state.lastInputAt)
  const decay = Math.exp(-age * 0.72)
  if (age > 4.6 || decay * state.strength < 0.018) {
    state.active = false
    return
  }

  let emitted = 0
  while (time >= state.nextEmitAt && emitted < 3) {
    const sampleAge = Math.max(0, state.nextEmitAt - state.lastInputAt)
    const sampleDecay = Math.exp(-sampleAge * 0.72)
    const glide = (1 - Math.exp(-sampleAge * 0.92)) / 0.92
    const safeAspect = Math.max(0.25, aspect)
    const anchorX = (state.x - 0.5) * safeAspect
    const anchorY = state.y - 0.5
    const anchorLength = Math.max(0.04, Math.hypot(anchorX, anchorY))
    const tangentX = -anchorY / anchorLength
    const tangentY = anchorX / anchorLength
    const radialX = anchorX / anchorLength
    const radialY = anchorY / anchorLength
    const stickyCurl = state.strength * (1 - sampleDecay) * 0.13
    const outwardRise = state.strength * (1 - sampleDecay) * 0.13
    const x = state.x + state.dx * 0.00105 * glide + (tangentX * stickyCurl + radialX * outwardRise) / safeAspect
    const y = state.y + state.dy * 0.00105 * glide + tangentY * stickyCurl + radialY * outwardRise
    const sustainedFlow = 0.34 + sampleDecay * 0.66
    const dx = state.dx * (0.24 + sampleDecay * 0.42)
      + tangentX * state.strength * sustainedFlow * 10.8
      + radialX * state.strength * sustainedFlow * 9.2
    const dy = state.dy * (0.24 + sampleDecay * 0.42)
      + tangentY * state.strength * sustainedFlow * 10.8
      + radialY * state.strength * sustainedFlow * 9.2
    const radiusScale = (0.6 + state.strength * 0.28) * (0.76 + sampleDecay * 0.24)

    emitKaleidoSplats(
      emit,
      x,
      y,
      dx,
      dy,
      state.nextEmitAt,
      160 + state.lane * 7,
      radiusScale,
      safeAspect,
    )
    state.nextEmitAt += 0.032
    emitted += 1
  }
}

type AudioSplatState = {
  nextAt: number
  lastBeatAt: number
  laneCursor: number
}

const createAudioSplatState = (): AudioSplatState => ({
  nextAt: 0,
  lastBeatAt: -99,
  laneCursor: 0,
})

type GestureReplayPoint = {
  time: number
  x: number
  y: number
  dx: number
  dy: number
  lane: number
  radiusScale: number
  playedMask: number
}

type GestureReplayState = {
  points: GestureReplayPoint[]
  writeIndex: number
  lastRecordAt: number
  lastInputAt: number
}

const GESTURE_REPLAY_MAX_POINTS = 64
const GESTURE_REPLAY_DELAYS = [0.22, 0.56, 0.94]
const GESTURE_REPLAY_FORCE = [1.05, 0.72, 0.46]
const GESTURE_REPLAY_RADIUS = [0.42, 0.28, 0.18]
const GESTURE_REPLAY_HISTORY_SECONDS = 1.65
const GESTURE_REPLAY_LIVE_SECONDS = 1.15
const GESTURE_REPLAY_ECHO_SECONDS = 0.82
const GESTURE_REPLAY_FULL_MASK = (1 << GESTURE_REPLAY_DELAYS.length) - 1

const createGestureReplayState = (): GestureReplayState => ({
  points: [],
  writeIndex: 0,
  lastRecordAt: -99,
  lastInputAt: -99,
})

const recordGestureReplayPoint = (
  state: GestureReplayState,
  time: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
  lane: number,
  radiusScale: number,
  force = false,
) => {
  state.lastInputAt = time
  if (!force && time - state.lastRecordAt < 0.045) {
    return
  }

  const point: GestureReplayPoint = {
    time,
    x: clamp(x, 0.001, 0.999),
    y: clamp(y, 0.001, 0.999),
    dx,
    dy,
    lane,
    radiusScale,
    playedMask: 0,
  }

  if (state.points.length < GESTURE_REPLAY_MAX_POINTS) {
    state.points.push(point)
  } else {
    state.points[state.writeIndex] = point
    state.writeIndex = (state.writeIndex + 1) % GESTURE_REPLAY_MAX_POINTS
  }
  state.lastRecordAt = time
}

const emitGestureReplaySplats = (
  emit: SplatEmitter,
  state: GestureReplayState,
  time: number,
  style: number,
) => {
  if (Math.round(style) !== 8 || state.points.length === 0) {
    return
  }

  for (const point of state.points) {
    const age = time - point.time
    if (age > GESTURE_REPLAY_DELAYS[GESTURE_REPLAY_DELAYS.length - 1] + 0.38) {
      point.playedMask = GESTURE_REPLAY_FULL_MASK
      continue
    }

    for (let echo = 0; echo < GESTURE_REPLAY_DELAYS.length; echo += 1) {
      const bit = 1 << echo
      if ((point.playedMask & bit) !== 0 || age < GESTURE_REPLAY_DELAYS[echo]) {
        continue
      }

      emit(
        point.x,
        point.y,
        point.dx * GESTURE_REPLAY_FORCE[echo],
        point.dy * GESTURE_REPLAY_FORCE[echo],
        time + echo * 0.073,
        point.lane + GESTURE_REPLAY_LANE_BASE + echo * GESTURE_REPLAY_ECHO_STRIDE,
        point.radiusScale * GESTURE_REPLAY_RADIUS[echo],
      )
      point.playedMask |= bit
    }
  }
}

const resizeGestureOverlay = (canvas: HTMLCanvasElement | null, resize: ResizeState) => {
  if (!canvas) {
    return
  }

  if (canvas.width !== resize.width || canvas.height !== resize.height) {
    canvas.width = resize.width
    canvas.height = resize.height
  }
}

const drawGestureReplayOverlay = (
  context: CanvasRenderingContext2D | null,
  state: GestureReplayState,
  time: number,
  resize: ResizeState,
  style: number,
) => {
  if (!context) {
    return
  }

  const { canvas } = context
  const width = canvas.width
  const height = canvas.height
  context.clearRect(0, 0, width, height)

  if (Math.round(style) !== 8 || state.points.length < 2) {
    return
  }

  const points = state.points
    .filter((point) => time - point.time < GESTURE_REPLAY_HISTORY_SECONDS)
    .sort((a, b) => a.time - b.time)

  if (points.length < 2) {
    return
  }

  const scale = Math.max(0.75, Math.min(1.35, Math.sqrt((resize.width * resize.height) / 780000)))
  const easeOutCubic = (value: number) => 1 - (1 - clamp(value, 0, 1)) ** 3
  const zipFade = (age: number, lifetime: number) => {
    const progress = clamp(age / lifetime, 0, 1)
    const attack = easeOutCubic(clamp(progress / 0.18, 0, 1))
    const release = (1 - progress) ** 1.45
    return attack * release
  }
  const drawSegment = (
    from: GestureReplayPoint,
    to: GestureReplayPoint,
    alpha: number,
    hue: number,
    lineWidth: number,
    shadowBlur: number,
  ) => {
    const x0 = from.x * width
    const y0 = (1 - from.y) * height
    const x1 = to.x * width
    const y1 = (1 - to.y) * height

    context.beginPath()
    context.moveTo(x0, y0)
    context.lineTo(x1, y1)
    context.lineWidth = lineWidth
    context.strokeStyle = `hsla(${hue}, 96%, 68%, ${alpha})`
    context.shadowColor = `hsla(${hue}, 100%, 66%, ${Math.min(0.85, alpha * 1.35)})`
    context.shadowBlur = shadowBlur
    context.stroke()
  }

  context.save()
  context.globalCompositeOperation = 'lighter'
  context.lineCap = 'square'
  context.lineJoin = 'miter'

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1]
    const to = points[index]
    if (to.time - from.time > 0.14) {
      continue
    }

    const age = time - (from.time + to.time) * 0.5
    if (age >= 0 && age < GESTURE_REPLAY_LIVE_SECONDS) {
      const fade = zipFade(age, GESTURE_REPLAY_LIVE_SECONDS)
      const speed = clamp(Math.hypot(to.x - from.x, to.y - from.y) * 16, 0.15, 1.15)
      const hue = 168 + Math.sin(time * 0.55 + from.lane * 0.4) * 24 + age * 18
      drawSegment(from, to, 0.72 * fade, hue, (13 + from.radiusScale * 2.0 + speed * 3.5) * scale, 20 * scale)
      drawSegment(from, to, 0.42 * fade, hue + 28, (3.6 + speed * 0.8) * scale, 8 * scale)
    }

    for (let echo = 0; echo < GESTURE_REPLAY_DELAYS.length; echo += 1) {
      const replayAge = age - GESTURE_REPLAY_DELAYS[echo]
      if (replayAge < 0 || replayAge > GESTURE_REPLAY_ECHO_SECONDS) {
        continue
      }

      const fade = zipFade(replayAge, GESTURE_REPLAY_ECHO_SECONDS)
      const speed = clamp(Math.hypot(to.x - from.x, to.y - from.y) * 18, 0.15, 1.2)
      const hueBase = echo === 0 ? 202 : echo === 1 ? 272 : 332
      const hue = hueBase + Math.sin(time * 0.42 + echo * 1.6 + from.lane * 0.22) * 16
      drawSegment(from, to, 0.62 * fade, hue, (8.5 - echo * 0.9 + speed * 2.2) * scale, (20 - echo * 3) * scale)
      drawSegment(from, to, 0.28 * fade, hue + 32, (2.4 + echo * 0.2) * scale, 6 * scale)
    }
  }

  context.restore()
}

type RayPoint = {
  x: number
  y: number
}

type RicochetRay = {
  time: number
  x: number
  y: number
  dx: number
  dy: number
  lane: number
  strength: number
  seed: number
  playedMask: number
}

type RicochetRayState = {
  rays: RicochetRay[]
  writeIndex: number
  lastRecordAt: number
  lastInputAt: number
}

const RICOCHET_MAX_RAYS = 18
const RICOCHET_LIFETIME = 1.34
const RICOCHET_BRANCH_COUNT = 11
const RICOCHET_SPLAT_BRANCHES = 9
const RICOCHET_TRAIL_BEADS = 5
const RICOCHET_BEAD_SPACING = 0.058
const RICOCHET_RETURN_START = 0.72
const RICOCHET_SPLAT_TIMES = [0.055, 0.145, 0.25, 0.385, 0.56, 0.78]
const RICOCHET_FULL_MASK = (1 << RICOCHET_SPLAT_TIMES.length) - 1
const TWO_PI = Math.PI * 2

const createRicochetRayState = (): RicochetRayState => ({
  rays: [],
  writeIndex: 0,
  lastRecordAt: -99,
  lastInputAt: -99,
})

const fract = (value: number) => value - Math.floor(value)
const pseudoRandom = (value: number) => fract(Math.sin(value) * 43758.5453123)
const positiveMod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor

const normalizeRay = (x: number, y: number, fallbackAngle: number): RayPoint => {
  const length = Math.hypot(x, y)
  if (length < 0.0001) {
    return { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) }
  }

  return { x: x / length, y: y / length }
}

const mixRayPoint = (a: RayPoint, b: RayPoint, amount: number): RayPoint => ({
  x: a.x + (b.x - a.x) * amount,
  y: a.y + (b.y - a.y) * amount,
})

const rayFromAngle = (angle: number): RayPoint => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
})

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3
const smoothStep01 = (value: number) => {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

const mirrorFold = (value: number, min: number, max: number) => {
  const span = max - min
  const folded = positiveMod((value - min) / span, 2)
  return min + (folded <= 1 ? folded : 2 - folded) * span
}

const quantizeAngle = (angle: number, step: number) => Math.round(angle / step) * step

type RicochetSample = {
  point: RayPoint
  tangent: RayPoint
  alpha: number
  hue: number
  returning: boolean
}

const ricochetOrigin = (ray: RicochetRay): RayPoint => ({
  x: clamp(ray.x, 0.045, 0.955),
  y: clamp(ray.y, 0.075, 0.925),
})

const ricochetDirection = (
  ray: RicochetRay,
  branch = Math.floor(RICOCHET_BRANCH_COUNT / 2),
  branchCount = RICOCHET_BRANCH_COUNT,
): { direction: RayPoint; normal: RayPoint; offset: number; offsetNormal: number; angle: number } => {
  const center = (branchCount - 1) * 0.5
  const offset = branch - center
  const offsetNormal = center > 0 ? offset / center : 0
  const fallbackAngle = -0.1 + ray.lane * 0.17 + ray.seed * 0.8
  const sourceDirection = normalizeRay(ray.dx, ray.dy, fallbackAngle)
  const baseAngle = Math.atan2(sourceDirection.y, sourceDirection.x)
  const fanStep = Math.PI / (11.5 - ray.strength * 1.1)
  const sequenceStep = Math.PI / 48
  const sequencePhase =
    ((ray.lane % 7) - 3) * (Math.PI / 96) +
    Math.sin(ray.seed * TWO_PI + ray.lane * 0.41) * (Math.PI / 160)
  const angle = quantizeAngle(baseAngle + offset * fanStep + sequencePhase, sequenceStep)
  const direction = rayFromAngle(angle)

  return {
    direction,
    normal: { x: -direction.y, y: direction.x },
    offset,
    offsetNormal,
    angle,
  }
}

const ricochetPointAt = (
  ray: RicochetRay,
  branch: number,
  tau: number,
  branchCount = RICOCHET_BRANCH_COUNT,
): RayPoint => {
  const origin = ricochetOrigin(ray)
  const { direction, normal, offset, offsetNormal, angle } = ricochetDirection(ray, branch, branchCount)
  const outward = easeOutCubic(clamp(tau / RICOCHET_RETURN_START, 0, 1))
  const travel = (0.16 + outward * (0.92 + ray.strength * 0.16)) * (0.92 + Math.abs(offsetNormal) * 0.08)
  const sineEnvelope = Math.sin(Math.PI * outward)
  const wovenCurve =
    (0.032 + Math.abs(offsetNormal) * 0.025) *
    sineEnvelope *
    Math.sin(outward * TWO_PI * (1.1 + Math.abs(offsetNormal) * 0.22) + ray.seed * TWO_PI + offset * 0.52)
  const raw = {
    x: origin.x + direction.x * travel + normal.x * wovenCurve,
    y: origin.y + direction.y * travel + normal.y * wovenCurve,
  }
  const reflected = {
    x: mirrorFold(raw.x, 0.045, 0.955),
    y: mirrorFold(raw.y, 0.075, 0.925),
  }

  if (tau <= RICOCHET_RETURN_START) {
    return reflected
  }

  const returnAmount = smoothStep01((tau - RICOCHET_RETURN_START) / (1 - RICOCHET_RETURN_START))
  const recoilAngle = angle + Math.PI * 0.5 + offsetNormal * 0.35 + ray.seed * 0.2
  const returnAnchor = {
    x: clamp(origin.x + Math.cos(recoilAngle) * (1 - returnAmount) * 0.028, 0.045, 0.955),
    y: clamp(origin.y + Math.sin(recoilAngle) * (1 - returnAmount) * 0.028, 0.075, 0.925),
  }
  return mixRayPoint(reflected, returnAnchor, returnAmount)
}

const sampleRicochet = (
  ray: RicochetRay,
  branch: number,
  tau: number,
  branchCount = RICOCHET_BRANCH_COUNT,
): RicochetSample => {
  const safeTau = clamp(tau, 0, 1)
  const point = ricochetPointAt(ray, branch, safeTau, branchCount)
  const nextPoint = ricochetPointAt(ray, branch, clamp(safeTau + 0.012, 0, 1), branchCount)
  const previousPoint = ricochetPointAt(ray, branch, clamp(safeTau - 0.012, 0, 1), branchCount)
  const tangent = normalizeRay(nextPoint.x - previousPoint.x, nextPoint.y - previousPoint.y, 0)
  const { offset, offsetNormal } = ricochetDirection(ray, branch, branchCount)
  const returning = safeTau > RICOCHET_RETURN_START
  const returnGlow = returning ? smoothStep01((safeTau - RICOCHET_RETURN_START) / (1 - RICOCHET_RETURN_START)) : 0
  const hue = 190 + Math.abs(offset) * 5.2 + Math.sin(ray.seed * TWO_PI + offset * 0.9) * 13 + returnGlow * 74
  const alpha =
    (0.84 - Math.abs(offsetNormal) * 0.16) *
    (0.88 + Math.sin(safeTau * Math.PI) * 0.12) *
    (returning ? 1.05 - returnGlow * 0.28 : 1)

  return {
    point,
    tangent,
    alpha: clamp(alpha, 0, 1),
    hue,
    returning,
  }
}

const recordRicochetRay = (
  state: RicochetRayState,
  time: number,
  x: number,
  y: number,
  dx: number,
  dy: number,
  lane: number,
  force = false,
) => {
  const speed = Math.hypot(dx, dy)
  state.lastInputAt = time
  if (!force && (time - state.lastRecordAt < 0.095 || speed < 1.4)) {
    return
  }

  const seed = pseudoRandom(time * 12.9898 + lane * 78.233 + x * 17.13 + y * 41.7)
  const ray: RicochetRay = {
    time,
    x: clamp(x, 0.001, 0.999),
    y: clamp(y, 0.001, 0.999),
    dx,
    dy,
    lane,
    strength: clamp(speed / 28, 0.56, 1.32),
    seed,
    playedMask: 0,
  }

  if (state.rays.length < RICOCHET_MAX_RAYS) {
    state.rays.push(ray)
  } else {
    state.rays[state.writeIndex] = ray
    state.writeIndex = (state.writeIndex + 1) % RICOCHET_MAX_RAYS
  }
  state.lastRecordAt = time
}

const emitRicochetSplats = (
  emit: SplatEmitter,
  state: RicochetRayState,
  time: number,
  style: number,
) => {
  if (Math.round(style) !== 10 || state.rays.length === 0) {
    return
  }

  for (const ray of state.rays) {
    const age = time - ray.time
    if (age > RICOCHET_LIFETIME + 0.28) {
      ray.playedMask = RICOCHET_FULL_MASK
      continue
    }

    for (let index = 0; index < RICOCHET_SPLAT_TIMES.length; index += 1) {
      const bit = 1 << index
      if ((ray.playedMask & bit) !== 0 || age < RICOCHET_SPLAT_TIMES[index]) {
        continue
      }

      const branchCenter = Math.floor(RICOCHET_SPLAT_BRANCHES / 2)
      const branchOffsets = index % 2 === 0 ? [-3, -1, 0, 1, 3] : [-4, -2, 0, 2, 4]
      const sampleAmount = index < RICOCHET_SPLAT_TIMES.length - 1 ? 0.16 + index * 0.115 : 0.92
      for (const branchOffset of branchOffsets) {
        const branch = clamp(branchCenter + branchOffset, 0, RICOCHET_SPLAT_BRANCHES - 1)
        const sample = sampleRicochet(ray, branch, sampleAmount, RICOCHET_SPLAT_BRANCHES)
        const force = 5.8 + ray.strength * 5.6
        const wingFade = branchOffset === 0 ? 1 : 0.62
        emit(
          sample.point.x,
          sample.point.y,
          sample.tangent.x * force,
          sample.tangent.y * force,
          time + index * 0.035 + Math.abs(branchOffset) * 0.009,
          ray.lane + 24 + index * 7 + branch,
          (index < 4 ? 0.015 - index * 0.0014 : 0.008) * wingFade,
        )
      }
      ray.playedMask |= bit
    }
  }
}

const drawRicochetRayOverlay = (
  context: CanvasRenderingContext2D | null,
  state: RicochetRayState,
  time: number,
  resize: ResizeState,
  style: number,
) => {
  if (!context) {
    return
  }

  const { canvas } = context
  const width = canvas.width
  const height = canvas.height
  context.clearRect(0, 0, width, height)

  if (Math.round(style) !== 10 || state.rays.length === 0) {
    return
  }

  const scale = Math.max(0.75, Math.min(1.35, Math.sqrt((resize.width * resize.height) / 780000)))
  const drawSegment = (from: RayPoint, to: RayPoint, alpha: number, hue: number, lineWidth: number, blur: number) => {
    context.beginPath()
    context.moveTo(from.x * width, (1 - from.y) * height)
    context.lineTo(to.x * width, (1 - to.y) * height)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.lineWidth = lineWidth
    context.strokeStyle = `hsla(${hue}, 96%, 68%, ${alpha})`
    context.shadowColor = `hsla(${hue}, 100%, 66%, ${Math.min(0.82, alpha * 1.42)})`
    context.shadowBlur = blur
    context.stroke()
  }
  const drawBullet = (sample: RicochetSample, alpha: number, radius: number, halo = 2.2) => {
    const point = sample.point
    const x = point.x * width
    const y = (1 - point.y) * height
    const angle = Math.atan2(-sample.tangent.y, sample.tangent.x)
    const hue = sample.hue
    const returningBoost = sample.returning ? 1.12 : 1
    const major = radius * (1.95 + returningBoost * 0.22)
    const minor = radius * 0.86

    context.beginPath()
    context.shadowBlur = radius * halo * 0.52
    context.shadowColor = `hsla(${hue}, 100%, 70%, ${Math.min(0.95, alpha * 1.35)})`
    context.fillStyle = `hsla(${hue}, 96%, ${sample.returning ? 72 : 76}%, ${alpha * 0.86})`
    context.ellipse(x, y, major, minor, angle, 0, TWO_PI)
    context.fill()

    context.beginPath()
    context.shadowBlur = radius * 0.5
    context.fillStyle = `hsla(${hue + 24}, 100%, 94%, ${alpha * 0.9})`
    context.ellipse(x, y, major * 0.42, Math.max(0.8, minor * 0.42), angle, 0, TWO_PI)
    context.fill()
  }

  context.save()
  context.globalCompositeOperation = 'lighter'
  const activeRays = state.rays
    .filter((ray) => {
      const age = time - ray.time
      return age >= 0 && age <= RICOCHET_LIFETIME
    })
    .sort((a, b) => a.time - b.time)
    .slice(-5)

  for (const ray of activeRays) {
    const age = time - ray.time
    const life = clamp(age / RICOCHET_LIFETIME, 0, 1)
    const progress = easeOutCubic(life)
    const fade = (1 - smoothStep01((life - 0.76) / 0.24)) * (0.72 + smoothStep01(life / 0.18) * 0.28)
    const branchCenter = (RICOCHET_BRANCH_COUNT - 1) * 0.5
    for (let branch = 0; branch < RICOCHET_BRANCH_COUNT; branch += 1) {
      const branchDistance = Math.abs(branch - branchCenter)
      const branchFade = 1 - branchDistance / (branchCenter + 1) * 0.26
      const branchDelay = branchDistance * 0.009 + (branch % 2) * 0.006
      const laneAlpha = fade * branchFade * ray.strength

      for (let bead = 0; bead < RICOCHET_TRAIL_BEADS; bead += 1) {
        const beadProgress = progress - bead * RICOCHET_BEAD_SPACING - branchDelay
        if (beadProgress <= 0 || beadProgress > 1) {
          continue
        }

        const sample = sampleRicochet(ray, branch, beadProgress)
        const previous = sampleRicochet(ray, branch, clamp(beadProgress - 0.018, 0, 1))
        const beadAlpha = laneAlpha * sample.alpha * (1 - bead * 0.13)
        const bulletRadius = (2.05 + ray.strength * 0.32 - bead * 0.09) * scale
        drawSegment(previous.point, sample.point, 0.04 * beadAlpha, sample.hue, (0.72 + ray.strength * 0.14) * scale, 2.2 * scale)
        drawBullet(sample, 0.88 * beadAlpha, bulletRadius, 2.22 - bead * 0.16)
      }
    }
  }
  context.restore()
}

const getAudio = (audioLevels?: { current: AudioLevels }) => audioLevels?.current ?? EMPTY_AUDIO_LEVELS

const seedStream = (
  emit: SplatEmitter,
  time: number,
  intensity: number,
  motion: number,
  radiusBoost = 1,
  style = 0,
  aspect = 1,
) => {
  const liquidStyle = Math.round(style)
  if (liquidStyle === 11) {
    return
  }

  if (liquidStyle >= 0 && liquidStyle <= 7) {
    if (liquidStyle === 2) {
      for (let lane = 0; lane < 5; lane += 1) {
        const phase = lane * 1.2 + time * 0.25
        const y = clamp(0.16 + lane * 0.17 + Math.sin(phase) * 0.025, 0.08, 0.92)
        emit(0.04, y, 18 + motion * 6, Math.sin(phase) * 2.2, time + lane * 0.016, lane, (0.58 + intensity * 0.06) * radiusBoost)
        emit(0.18, clamp(y + 0.035, 0.08, 0.92), 12 + motion * 4, -Math.sin(phase) * 1.6, time + lane * 0.02, lane + 8, (0.36 + intensity * 0.04) * radiusBoost)
      }
    } else if (liquidStyle === 5) {
      for (let column = 0; column < 6; column += 1) {
        const x = clamp(0.12 + column * 0.15 + Math.sin(time + column) * 0.018, 0.04, 0.96)
        emit(x, 0.04, 3 + motion * 2, 24 + intensity * 5, time + column * 0.014, column, (0.44 + intensity * 0.04) * radiusBoost)
      }
    } else if (liquidStyle === 6) {
      for (let lane = 0; lane < 5; lane += 1) {
        const y = clamp(0.18 + lane * 0.16 + Math.sin(time * 0.5 + lane) * 0.02, 0.08, 0.92)
        emit(0.04, y, 15 + motion * 5, Math.sin(lane) * 1.8, time + lane * 0.017, lane, (0.42 + intensity * 0.04) * radiusBoost)
      }
    } else if (liquidStyle === 7 || liquidStyle === 3) {
      for (let lane = 0; lane < 4; lane += 1) {
        const y = clamp(0.2 + lane * 0.2 + Math.sin(time + lane) * 0.018, 0.1, 0.9)
        emit(0.05, y, 12 + motion * 4, Math.sin(time + lane) * 1.4, time + lane * 0.018, lane, (0.62 + intensity * 0.05) * radiusBoost)
      }
    } else if (liquidStyle === 4) {
      for (let lane = 0; lane < 5; lane += 1) {
        const phase = lane * 1.15 + time * 0.5
        const x = clamp(0.1 + (lane % 3) * 0.3 + Math.sin(phase) * 0.04, 0.06, 0.94)
        const y = clamp(0.2 + Math.floor(lane / 3) * 0.34 + Math.cos(phase) * 0.06, 0.08, 0.92)
        emit(x, y, 10 + motion * 5, Math.sin(phase) * 6, time + lane * 0.016, lane, (0.68 + intensity * 0.06) * radiusBoost)
      }
    } else {
      for (let lane = 0; lane < 5; lane += 1) {
        const y = clamp(0.16 + lane * 0.18 + Math.sin(time * 0.5 + lane) * 0.024, 0.08, 0.92)
        emit(0.035, y, 18 + motion * 6 + intensity * 2, Math.sin(time + lane) * 1.8, time + lane * 0.015, lane, (0.5 + intensity * 0.05) * radiusBoost)
      }
    }
    return
  }

  if (style === 2) {
    for (let lane = 0; lane < 5; lane += 1) {
      for (let column = 0; column < 3; column += 1) {
        const phase = lane * 1.31 + column * 0.83 + time
        const x = clamp(0.16 + column * 0.32 + Math.sin(phase) * 0.045, 0.06, 0.94)
        const y = clamp(0.18 + lane * 0.17 + Math.cos(phase * 1.4) * 0.045, 0.08, 0.92)
        emit(x, y, 7 + motion * 4, Math.sin(phase) * 12, time + column * 0.018, lane + column, (1.65 + intensity * 0.18) * radiusBoost)
      }
    }
    return
  }

  if (style === 3 || style === 7) {
    for (let lane = 0; lane < 4; lane += 1) {
      const y = clamp(0.2 + lane * 0.21 + Math.sin(time + lane) * 0.025, 0.1, 0.9)
      emit(0.08, y, 10 + motion * 4, Math.sin(lane + time) * 3, time + lane * 0.02, lane, (2.1 + intensity * 0.2) * radiusBoost)
      emit(0.36, clamp(y + 0.04, 0.08, 0.92), 7 + motion * 2, -Math.sin(lane) * 2, time + lane * 0.024, lane + 7, (1.45 + intensity * 0.12) * radiusBoost)
    }
    return
  }

  if (style === 5 || style === 6) {
    const columns = style === 6 ? 8 : 6
    for (let column = 0; column < columns; column += 1) {
      const x = clamp((column + 0.45) / columns + Math.sin(time + column) * 0.025, 0.04, 0.96)
      const y = style === 5 ? 0.04 : clamp(0.12 + (column % 4) * 0.18, 0.08, 0.9)
      const dx = style === 5 ? 10 + motion * 4 : Math.sin(column) * 4
      const dy = style === 5 ? 32 + motion * 9 : 22 + intensity * 7
      emit(x, y, dx, dy, time + column * 0.015, column, (style === 6 ? 0.72 : 1.05) * radiusBoost)
    }
    return
  }

  if (style === 8) {
    for (let column = 0; column < 7; column += 1) {
      const phase = time + column * 0.77
      const x = clamp(0.08 + column * 0.14 + Math.sin(phase) * 0.025, 0.04, 0.96)
      const y = clamp(0.86 - column * 0.1 + Math.cos(phase * 1.2) * 0.055, 0.08, 0.92)
      emit(x, y, 22 + motion * 8, -15 + Math.sin(phase) * 7, time + column * 0.018, column, (0.92 + intensity * 0.12) * radiusBoost)
    }
    return
  }

  if (style === 9) {
    for (let lane = 0; lane < 5; lane += 1) {
      const y = clamp(0.18 + lane * 0.16, 0.08, 0.92)
      emit(0.035, y, 26 + motion * 8, 0, time + lane * 0.018, lane, (0.82 + intensity * 0.1) * radiusBoost)
    }
    return
  }

  if (style === 10) {
    for (let wave = 0; wave < 3; wave += 1) {
      for (let shot = 0; shot < 7; shot += 1) {
        const fan = shot - 3
        const angle = -0.06 + fan * 0.052 + wave * 0.018
        const speed = 13 + motion * 4 + wave * 1.4
        const y = clamp(0.18 + shot * 0.105 + Math.sin(time * 0.45 + wave + shot) * 0.015, 0.09, 0.91)
        emit(
          0.05 + wave * 0.035,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          time + wave * 0.018 + shot * 0.006,
          30 + wave * 9 + shot,
          (0.035 + intensity * 0.004) * radiusBoost,
        )
      }
    }
    return
  }

  if (style === 11) {
    for (let layer = 0; layer < 2; layer += 1) {
      const radius = 0.15 + layer * 0.14
      const phase = time * 0.12 + layer * 0.31
      const x = 0.5 + Math.cos(phase) * radius / Math.max(0.25, aspect)
      const y = 0.5 + Math.sin(phase) * radius
      const radialForce = 3.5 + intensity * 0.8
      const tangentForce = 10.5 + motion * 4.2 + layer * 1.2
      const dx = Math.cos(phase) * radialForce - Math.sin(phase) * tangentForce
      const dy = Math.sin(phase) * radialForce + Math.cos(phase) * tangentForce
      emitKaleidoSplats(
        emit,
        x,
        y,
        dx,
        dy,
        time + layer * 0.014,
        90 + layer * 7,
        (0.42 + intensity * 0.045) * radiusBoost,
        aspect,
      )
    }
    return
  }

  if (style === 4) {
    for (let lane = 0; lane < 7; lane += 1) {
      const phase = lane * 1.19 + time
      const x = clamp(0.12 + Math.sin(phase * 0.9) * 0.08 + (lane % 3) * 0.28, 0.06, 0.94)
      const y = clamp(0.16 + Math.cos(phase * 1.3) * 0.08 + Math.floor(lane / 3) * 0.34, 0.08, 0.92)
      emit(x, y, 12 + motion * 7, Math.sin(phase) * 10, time + lane * 0.017, lane, (1.75 + intensity * 0.16) * radiusBoost)
    }
    return
  }

  for (let lane = 0; lane < 6; lane += 1) {
    const laneBase = (lane + 0.5) / 6

    for (let column = 0; column < 4; column += 1) {
      const phase = lane * 1.37 + column * 0.91 + time
      const x = clamp(0.08 + column * 0.24 + Math.sin(phase) * 0.018, 0.04, 0.92)
      const y = clamp(laneBase + Math.sin(phase * 1.7) * 0.032, 0.08, 0.92)
      const dx = 18 + motion * 7 + intensity * 5
      const dy = Math.sin(phase * 2.1) * 2.2
      emit(x, y, dx, dy, time + column * 0.012, lane + column, (1.16 + intensity * 0.12) * radiusBoost)
    }
  }
}

const emitAudioSplats = (
  emit: SplatEmitter,
  audio: AudioLevels,
  time: number,
  state: AudioSplatState,
  motion: number,
  radiusBoost = 1,
  style = 0,
) => {
  const bass = clamp(audio.bass, 0, 1)
  const mid = clamp(audio.mid, 0, 1)
  const treble = clamp(audio.treble, 0, 1)
  const beat = clamp(audio.beat, 0, 1)
  const energy = bass + mid + treble + beat

  if (energy < 0.018) {
    return
  }

  if (state.nextAt <= 0) {
    state.nextAt = time
  }

  const bassDrive = Math.pow(bass, 0.68)
  const midDrive = Math.pow(mid, 0.82)
  const trebleDrive = Math.pow(treble, 0.72)

  if (style === 9) {
    if (beat > 0.2 && time - state.lastBeatAt > 0.13) {
      state.lastBeatAt = time
      const y = clamp(0.16 + (state.laneCursor % 5) * 0.16, 0.1, 0.88)
      emit(0.018, y, 82 + beat * 72 + bassDrive * 44, 0, time, state.laneCursor + 90, (1.12 + bassDrive * 0.34) * radiusBoost)
      emit(0.18, y, 34 + beat * 28, 0, time, state.laneCursor + 96, 0.38 * radiusBoost)
      state.laneCursor += 1
      state.nextAt = Math.max(state.nextAt, time + 0.06)
      return
    }

    if (time < state.nextAt) {
      return
    }

    const lane = state.laneCursor % 5
    const y = clamp(0.16 + lane * 0.16, 0.08, 0.92)
    if (bassDrive > 0.025) {
      emit(0.024, y, 48 + bassDrive * 84 + motion * 3, 0, time, lane + 100, (0.9 + bassDrive * 0.52) * radiusBoost)
    }
    if (midDrive > 0.05) {
      emit(0.18, y, 30 + midDrive * 46, 0, time, lane + 110, (0.36 + midDrive * 0.42) * radiusBoost)
    }
    if (trebleDrive > 0.06) {
      const sparkX = 0.34 + (lane % 3) * 0.08
      emit(sparkX, y, 20 + trebleDrive * 32, 0, time, lane + 120, (0.16 + trebleDrive * 0.24) * radiusBoost)
    }
    state.laneCursor += 1
    state.nextAt = time + clamp(0.14 - bassDrive * 0.035 - midDrive * 0.028, 0.07, 0.14)
    return
  }

  if (beat > 0.2 && time - state.lastBeatAt > 0.14) {
    state.lastBeatAt = time
    const lane = state.laneCursor % 6
    const y = clamp((lane + 0.5) / 6, 0.1, 0.9)

    emit(0.018, y, 72 + beat * 82 + bassDrive * 62, 0, time, lane + 60, 1.42 * radiusBoost)
    emit(0.11, clamp(y + 0.045, 0.08, 0.92), 38 + beat * 42, -0.35, time, lane + 66, 0.72 * radiusBoost)
    state.nextAt = Math.max(state.nextAt, time + 0.055)
  }

  if (time < state.nextAt) {
    return
  }

  const lane = state.laneCursor % 6
  const y = clamp((lane + 0.5) / 6, 0.08, 0.92)
  const interval = clamp(0.15 - bassDrive * 0.035 - midDrive * 0.025 - beat * 0.035, 0.072, 0.15)
  let emitted = 0

  if (bassDrive > 0.03 || beat > 0.055) {
    emit(
      0.024,
      y,
      40 + motion * 4 + bassDrive * 78 + beat * 40,
      0,
      time,
      lane + 20,
      (0.92 + bassDrive * 0.42 + beat * 0.2) * radiusBoost,
    )
    emitted += 1
  }

  if (midDrive > 0.055 && emitted < 2) {
    emit(
      0.18,
      clamp(y + 0.032, 0.08, 0.92),
      25 + motion * 3 + midDrive * 38,
      0.42,
      time,
      lane + 34,
      (0.44 + midDrive * 0.86) * radiusBoost,
    )
    emitted += 1
  }

  if (trebleDrive > 0.08 && emitted < 2) {
    const sparkX = clamp(0.36 + Math.sin(time * 5.2 + lane) * 0.12, 0.24, 0.62)
    emit(
      sparkX,
      clamp(y - 0.028, 0.08, 0.92),
      12 + trebleDrive * 24,
      0.18,
      time,
      lane + 43,
      (0.22 + trebleDrive * 0.48) * radiusBoost,
    )
  }

  state.laneCursor += 1
  state.nextAt = time + interval
}

export default function FluidFxCanvas(props: FluidFxCanvasProps) {
  const wantsTsl = props.values.pipeline === true
  const useNativeFluidTsl = false
  const [fallbackReason, setFallbackReason] = useState<string | null>(null)

  useEffect(() => {
    if (!wantsTsl) {
      setFallbackReason(null)
    }
  }, [wantsTsl])

  if (wantsTsl && useNativeFluidTsl && !fallbackReason) {
    return <TslFluidFxCanvas {...props} onUnavailable={setFallbackReason} />
  }

  return (
    <GlslFluidFxCanvas
      {...props}
      pipelineNote={
        wantsTsl
          ? fallbackReason
            ? `TSL / GLSL expression: ${fallbackReason}`
            : 'TSL / GLSL expression'
          : null
      }
    />
  )
}

function GlslFluidFxCanvas({
  effect,
  values,
  paused,
  externalPointer,
  audioLevels,
  performanceMode = false,
  quality,
  onStats,
  onReady,
  onCompileError,
  pipelineNote,
}: FluidCanvasRuntimeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gestureOverlayRef = useRef<HTMLCanvasElement | null>(null)
  const valuesRef = useRef(values)
  const pausedRef = useRef(paused)
  const performanceModeRef = useRef(performanceMode)
  const qualityRef = useRef(quality)
  const onStatsRef = useRef(onStats)
  const onReadyRef = useRef(onReady)
  const onCompileErrorRef = useRef(onCompileError)
  const resizeVersionRef = useRef(0)
  const [error, setError] = useState<string | null>(null)

  useLayoutEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    performanceModeRef.current = performanceMode
    resizeVersionRef.current += 1
  }, [performanceMode])

  useEffect(() => {
    qualityRef.current = quality
    resizeVersionRef.current += 1
  }, [quality])

  useEffect(() => {
    onStatsRef.current = onStats
  }, [onStats])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    onCompileErrorRef.current = onCompileError
  }, [onCompileError])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const gestureOverlay = gestureOverlayRef.current
    const gestureOverlayContext = gestureOverlay?.getContext('2d') ?? null

    let renderer: WebGLRenderer
    let fluid: FluidSimulation
    let material: ShaderMaterial

    try {
      renderer = new WebGLRenderer({
        canvas,
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      })
      renderer.toneMapping = NoToneMapping
      renderer.setClearColor(0x010307, 1)
      fluid = new FluidSimulation(renderer, {
        profile: qualitySettings[qualityRef.current].profile,
        pressureIterations: qualityRef.current === 'high' ? 10 : 6,
        densityDissipation: 0.955,
        dyeDissipation: 0.975,
        velocityDissipation: 0.988,
        curlStrength: 0.22,
        splatRadius: 0.00048,
        splatForce: 5.5,
        reflectWalls: false,
        enableVorticity: false,
        bfecc: false,
      })
      fluid.enableDye = true

      material = new ShaderMaterial({
        vertexShader,
        fragmentShader: buildFragmentShader(getFluidStyleId(effect)),
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uVelocity: { value: fluid.velocityTexture },
          uDensity: { value: fluid.densityTexture },
          uDye: { value: fluid.dyeTexture },
          uResolution: { value: new Vector2(1, 1) },
          uTime: { value: 0 },
          uIntensity: { value: 1 },
          uMotion: { value: 1 },
          uDetail: { value: 2 },
          uPrimary: { value: new Color(effect.accentColor) },
          uAudio: { value: new Vector4(0, 0, 0, 0) },
          uStyle: { value: getFluidStyleId(effect) },
          uParticles: { value: 1 },
        },
      })
      setError(null)
    } catch (initError) {
      setError(initError instanceof Error ? initError.message : 'three-fluid-fx initialization failed.')
      onCompileErrorRef.current?.(effect.id)
      return
    }

    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const geometry = new PlaneGeometry(2, 2)
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)
    const particles = createFluidParticleSystem(renderer, scene, camera, effect)
    const fluidStyle = getFluidStyleId(effect)

    let frameId = 0
    let elapsed = 0
    let previous = performance.now()
    let statsPrevious = previous
    let nextStatsAt = previous + FIRST_STATS_DELAY_MS
    let statsFrames = 0
    let notifiedReady = false
    let readyFrames = 0
    let readyStartedAt = 0
    let latestResize: ResizeState = { fps: 0, scale: 1, pixelRatio: 1, width: 1, height: 1 }
    let observedResizeVersion = -1
    let needsResize = true
    let nextEmitterAt = 0
    let pointerHasPrevious = false
    let pointerClientX = 0
    let pointerClientY = 0
    let pointerLastSplatAt = 0
    let lastPointerEventAt = 0
    let activePointerId: number | null = null
    let lastHandSplatAt = 0
    let needsStreamSeed = true
    let audioSplatState = createAudioSplatState()
    let gestureReplayState = createGestureReplayState()
    let ricochetRayState = createRicochetRayState()
    let kaleidoMomentumState = createKaleidoMomentumState()

    const requestResize = () => {
      needsResize = true
      needsStreamSeed = true
      audioSplatState = createAudioSplatState()
      gestureReplayState = createGestureReplayState()
      ricochetRayState = createRicochetRayState()
      gestureOverlayContext?.clearRect(0, 0, gestureOverlayContext.canvas.width, gestureOverlayContext.canvas.height)
    }
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(requestResize)
    resizeObserver?.observe(canvas)
    window.addEventListener('resize', requestResize)

    const updateRenderSize = () => {
      latestResize = resizeRenderer(
        canvas,
        renderer,
        fluid,
        performanceModeRef.current,
        qualityRef.current,
      )
      material.uniforms.uResolution.value.set(latestResize.width, latestResize.height)
      resizeGestureOverlay(gestureOverlay, latestResize)
      observedResizeVersion = resizeVersionRef.current
      needsResize = false
      needsStreamSeed = true
    }

    const addSplat = (
      x: number,
      y: number,
      dx: number,
      dy: number,
      time: number,
      lane: number,
      radiusScale = 1,
    ) => {
      const currentValues = valuesRef.current
      const detail = readNumber(currentValues, 'detail', 2.4)
      const primary = hexToColor(currentValues.primary, effect.accentColor)
      fluid.addSplat(
        clamp(x, 0.001, 0.999),
        clamp(y, 0.001, 0.999),
        dx,
        dy,
        {
          radius: (0.00022 + detail * 0.000045) * radiusScale * (fluidStyle === 11 ? 1.28 : 1),
          dyeColor: dyeFromPalette(primary, time, lane, fluidStyle),
        },
      )
    }

    const emitAutoSplats = (time: number) => {
      if (fluidStyle === 11) {
        return
      }

      const currentValues = valuesRef.current
      const intensity = readNumber(currentValues, 'intensity', 1.18)
      const motion = readNumber(currentValues, 'motion', 1.05)
      const interval = clamp(0.115 - motion * 0.026, 0.054, 0.11)

      if (nextEmitterAt <= 0) {
        nextEmitterAt = time + 0.04
      }

      let emitted = 0
      while (time >= nextEmitterAt && emitted < 3) {
        const lane = Math.floor(nextEmitterAt * 7.0) % 6
        const phase = nextEmitterAt * 2.1 + lane

        if (fluidStyle >= 0 && fluidStyle <= 7) {
          const laneBase = (lane + 0.5) / 6
          const y = clamp(laneBase + Math.sin(phase) * 0.026, 0.09, 0.91)
          if (fluidStyle === 5) {
            const x = clamp(0.1 + (lane % 6) * 0.16 + Math.sin(phase) * 0.012, 0.04, 0.96)
            addSplat(x, 0.035, 2 + motion * 1.8, 22 + intensity * 5, nextEmitterAt, lane, 0.36 + intensity * 0.04)
          } else if (fluidStyle === 4) {
            const gelY = clamp(laneBase + Math.sin(phase * 1.2) * 0.038, 0.08, 0.92)
            addSplat(0.035, gelY, 18 + motion * 5, Math.sin(phase) * 2.6, nextEmitterAt, lane, 0.42 + intensity * 0.05)
          } else if (fluidStyle === 2) {
            addSplat(0.035, y, 16 + motion * 5, Math.sin(phase) * 2.2, nextEmitterAt, lane, 0.45 + intensity * 0.04)
          } else if (fluidStyle === 6) {
            addSplat(0.035, y, 13 + motion * 4, Math.sin(phase * 0.7) * 1.4, nextEmitterAt, lane, 0.34 + intensity * 0.04)
          } else {
            addSplat(0.035, y, 16 + motion * 5, Math.sin(phase) * 1.7, nextEmitterAt, lane, 0.44 + intensity * 0.05)
          }
        } else if (fluidStyle === 2) {
          const x = clamp(0.14 + ((lane * 0.19 + nextEmitterAt * 0.06) % 0.74), 0.06, 0.92)
          const y = clamp(0.16 + ((lane * 0.23 + Math.sin(phase) * 0.05) % 0.72), 0.08, 0.92)
          addSplat(x, y, 6 + motion * 3, Math.sin(phase * 1.7) * 13, nextEmitterAt, lane, 1.42 + intensity * 0.12)
        } else if (fluidStyle === 3 || fluidStyle === 7) {
          const laneBase = (lane + 0.5) / 6
          const y = clamp(laneBase + Math.sin(phase) * 0.025, 0.1, 0.9)
          addSplat(0.05, y, 10 + motion * 4, Math.sin(phase * 1.3) * 2.4, nextEmitterAt, lane, 1.8 + intensity * 0.2)
        } else if (fluidStyle === 4) {
          const x = clamp(0.12 + ((lane * 0.27 + Math.sin(phase) * 0.08) % 0.76), 0.06, 0.94)
          const y = clamp(0.2 + Math.cos(phase * 1.4) * 0.18 + (lane % 2) * 0.28, 0.08, 0.92)
          addSplat(x, y, 10 + motion * 8, Math.sin(phase) * 13, nextEmitterAt, lane, 1.55 + intensity * 0.16)
        } else if (fluidStyle === 5) {
          const x = clamp(0.12 + ((lane * 0.16 + nextEmitterAt * 0.05) % 0.78), 0.04, 0.96)
          addSplat(x, 0.035, 8 + motion * 4, 32 + intensity * 9, nextEmitterAt, lane, 0.92 + intensity * 0.12)
        } else if (fluidStyle === 6) {
          const x = clamp(0.08 + (lane % 8) * 0.12 + Math.sin(phase) * 0.018, 0.04, 0.96)
          const y = clamp(0.12 + ((lane * 0.17 + nextEmitterAt * 0.04) % 0.74), 0.08, 0.92)
          addSplat(x, y, Math.sin(phase) * 4, 21 + intensity * 8, nextEmitterAt, lane, 0.64 + intensity * 0.08)
        } else if (fluidStyle === 8) {
          if (time - gestureReplayState.lastInputAt < 3.4) {
            nextEmitterAt += interval
            emitted += 1
            continue
          }

          const x = clamp(0.08 + ((lane * 0.15 + nextEmitterAt * 0.05) % 0.84), 0.04, 0.96)
          const y = clamp(0.86 - ((lane * 0.12 + nextEmitterAt * 0.035) % 0.74), 0.08, 0.92)
          addSplat(x, y, 20 + motion * 6, -10 + Math.sin(phase) * 5, nextEmitterAt, lane, 0.54 + intensity * 0.08)
        } else if (fluidStyle === 9) {
          const y = clamp(0.16 + (lane % 5) * 0.16, 0.08, 0.92)
          addSplat(0.035, y, 24 + motion * 7, 0, nextEmitterAt, lane, 0.7 + intensity * 0.07)
        } else if (fluidStyle === 10) {
          if (time - ricochetRayState.lastInputAt < 2.0) {
            nextEmitterAt += interval
            emitted += 1
            continue
          }

          const fan = (lane % 7) - 3
          const angle = -0.04 + fan * 0.05 + Math.sin(phase * 0.7) * 0.018
          const speed = 14 + motion * 4 + intensity * 1.5
          const y = clamp(0.16 + (lane % 7) * 0.105 + Math.sin(phase) * 0.014, 0.09, 0.91)
          addSplat(0.045, y, Math.cos(angle) * speed, Math.sin(angle) * speed, nextEmitterAt, lane + 28, 0.02 + intensity * 0.003)
        } else if (fluidStyle === 11) {
          const aspect = latestResize.width / Math.max(1, latestResize.height)
          const orbitAngle = nextEmitterAt * 0.19 + lane * 0.23
          const orbitRadius = 0.16 + (lane % 3) * 0.105
          const x = 0.5 + Math.cos(orbitAngle) * orbitRadius / Math.max(0.25, aspect)
          const y = 0.5 + Math.sin(orbitAngle) * orbitRadius
          const radialForce = 2.8 + intensity * 0.7
          const tangentForce = 8.5 + motion * 3.6
          const dx = Math.cos(orbitAngle) * radialForce - Math.sin(orbitAngle) * tangentForce
          const dy = Math.sin(orbitAngle) * radialForce + Math.cos(orbitAngle) * tangentForce
          emitKaleidoSplats(
            addSplat,
            x,
            y,
            dx,
            dy,
            nextEmitterAt,
            110 + lane * 7,
            0.34 + intensity * 0.035,
            aspect,
            lane % KALEIDO_SEGMENTS,
          )
        } else {
          const laneBase = (lane + 0.5) / 6
          const y = clamp(laneBase + Math.sin(phase) * 0.035, 0.1, 0.9)
          const dx = 22 + motion * 9 + intensity * 6
          const dy = Math.sin(nextEmitterAt * 3.7 + lane * 1.3) * 1.9
          addSplat(0.024, y, dx, dy, nextEmitterAt, lane, 1.2 + intensity * 0.16)
        }

        nextEmitterAt += fluidStyle === 11 ? interval * 1.75 : interval
        emitted += 1
      }
    }

    const handlePointerSplat = (clientX: number, clientY: number, moveX: number, moveY: number, now: number, pressed: boolean) => {
      if (now - pointerLastSplatAt < (fluidStyle === 11 ? 24 : 16) && !pressed) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = (clientX - rect.left) / Math.max(1, rect.width)
      const y = 1 - (clientY - rect.top) / Math.max(1, rect.height)
      const currentValues = valuesRef.current
      const intensity = readNumber(currentValues, 'intensity', 1.18)
      const motion = readNumber(currentValues, 'motion', 1.05)
      const forceX = clamp(moveX * (0.72 + intensity * 0.18) + 10 + motion * 4, -18, 44)
      const forceY = clamp(-moveY * 0.52, -18, 18)
      const lane = Math.floor(clamp(y, 0, 0.999) * 6)
      const isGestureCut = fluidStyle === 8
      const isRicochet = fluidStyle === 10
      const isKaleido = fluidStyle === 11
      const radiusScale = isGestureCut
        ? (pressed ? 0.58 : 0.44)
        : isRicochet
          ? (pressed ? 0.04 : 0.025)
          : isKaleido
            ? (pressed ? 1.12 : 0.88)
            : pressed ? 1.45 : 1.08
      if (isKaleido) {
        emitKaleidoSplats(addSplat, x, y, forceX * 0.96, forceY * 0.96, now / 1000, lane, radiusScale, rect.width / Math.max(1, rect.height))
        recordKaleidoMomentum(kaleidoMomentumState, elapsed, x, y, forceX * 0.96, forceY * 0.96, lane, pressed)
      } else {
        addSplat(x, y, forceX, forceY, now / 1000, lane, radiusScale)
      }
      if (isGestureCut) {
        recordGestureReplayPoint(gestureReplayState, elapsed, x, y, forceX, forceY, lane, radiusScale, pressed)
      }
      if (isRicochet) {
        recordRicochetRay(ricochetRayState, elapsed, x, y, forceX, forceY, lane, pressed)
      }
      if (pressed && !isGestureCut && !isRicochet && !isKaleido) {
        addSplat(clamp(x - 0.034, 0.001, 0.999), y, forceX * 0.62, forceY * 0.45, now / 1000, lane + 5, 0.92)
      }
      pointerLastSplatAt = now
    }

    const onPointerMove = (event: PointerEvent) => {
      const isDirectPointer = event.pointerType !== 'mouse'
      if (isDirectPointer && activePointerId !== event.pointerId) {
        return
      }
      if (isDirectPointer && event.cancelable) {
        event.preventDefault()
      }
      lastPointerEventAt = performance.now()
      const moveX = pointerHasPrevious ? event.clientX - pointerClientX : 0
      const moveY = pointerHasPrevious ? event.clientY - pointerClientY : 0
      pointerClientX = event.clientX
      pointerClientY = event.clientY
      pointerHasPrevious = true

      if (Math.abs(moveX) + Math.abs(moveY) < 0.35) {
        return
      }

      const pressed = event.buttons > 0 || (isDirectPointer && activePointerId === event.pointerId)
      handlePointerSplat(event.clientX, event.clientY, moveX, moveY, event.timeStamp || performance.now(), pressed)
    }

    const onPointerDown = (event: PointerEvent) => {
      if (activePointerId !== null && activePointerId !== event.pointerId) {
        return
      }
      if (event.pointerType !== 'mouse' && event.cancelable) {
        event.preventDefault()
      }
      activePointerId = event.pointerId
      if (!canvas.hasPointerCapture(event.pointerId)) {
        canvas.setPointerCapture(event.pointerId)
      }
      lastPointerEventAt = performance.now()
      pointerClientX = event.clientX
      pointerClientY = event.clientY
      pointerHasPrevious = true
      handlePointerSplat(event.clientX, event.clientY, 16, 0, event.timeStamp || performance.now(), true)
    }

    const onPointerEnd = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) {
        return
      }
      if (event.pointerType !== 'mouse' && event.cancelable) {
        event.preventDefault()
      }
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId)
      }
      activePointerId = null
      pointerHasPrevious = false
    }

    const onLostPointerCapture = (event: PointerEvent) => {
      if (activePointerId === event.pointerId) {
        activePointerId = null
        pointerHasPrevious = false
      }
    }

    const onMouseMove = (event: MouseEvent) => {
      if (performance.now() - lastPointerEventAt < 80) {
        return
      }
      const moveX = pointerHasPrevious ? event.clientX - pointerClientX : 0
      const moveY = pointerHasPrevious ? event.clientY - pointerClientY : 0
      pointerClientX = event.clientX
      pointerClientY = event.clientY
      pointerHasPrevious = true

      if (Math.abs(moveX) + Math.abs(moveY) < 0.35) {
        return
      }

      handlePointerSplat(event.clientX, event.clientY, moveX, moveY, event.timeStamp || performance.now(), event.buttons > 0)
    }

    const onMouseDown = (event: MouseEvent) => {
      if (performance.now() - lastPointerEventAt < 80) {
        return
      }
      pointerClientX = event.clientX
      pointerClientY = event.clientY
      pointerHasPrevious = true
      handlePointerSplat(event.clientX, event.clientY, 16, 0, event.timeStamp || performance.now(), true)
    }

    const resetPointer = (event?: Event) => {
      if (event && 'pointerId' in event && activePointerId === (event as PointerEvent).pointerId) {
        return
      }
      pointerHasPrevious = false
    }

    canvas.addEventListener('pointermove', onPointerMove, { passive: false })
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
    canvas.addEventListener('pointerup', onPointerEnd, { passive: false })
    canvas.addEventListener('pointerout', resetPointer)
    canvas.addEventListener('pointercancel', onPointerEnd, { passive: false })
    canvas.addEventListener('lostpointercapture', onLostPointerCapture)
    canvas.addEventListener('mousemove', onMouseMove, { passive: true })
    canvas.addEventListener('mousedown', onMouseDown, { passive: true })
    canvas.addEventListener('mouseleave', resetPointer)

    const emitHandSplat = (now: number) => {
      const handPointer = externalPointer?.current
      if (!handPointer?.active || handPointer.confidence < 0.18 || now - lastHandSplatAt < (handPointer.down ? 18 : 30)) {
        return
      }

      const currentValues = valuesRef.current
      const motion = readNumber(currentValues, 'motion', 1.05)
      const x = clamp(handPointer.x, 0.001, 0.999)
      const y = clamp(1 - handPointer.y, 0.001, 0.999)
      const forceX = clamp(handPointer.vx * 360 + 18 + motion * 6, -20, 56) * handPointer.confidence
      const forceY = clamp(-handPointer.vy * 260, -20, 20) * handPointer.confidence
      const lane = Math.floor(clamp(y, 0, 0.999) * 6)
      const isGestureCut = fluidStyle === 8
      const isRicochet = fluidStyle === 10
      const isKaleido = fluidStyle === 11
      const radiusScale = isGestureCut
        ? (handPointer.down ? 0.68 : 0.5)
        : isRicochet
          ? (handPointer.down ? 0.06 : 0.04)
          : isKaleido
            ? (handPointer.down ? 1.18 : 0.92)
            : handPointer.down ? 1.85 : 1.22
      if (isKaleido) {
        emitKaleidoSplats(
          addSplat,
          x,
          y,
          forceX * 0.92,
          forceY * 0.92,
          now / 1000,
          lane + 2,
          radiusScale,
          latestResize.width / Math.max(1, latestResize.height),
        )
        recordKaleidoMomentum(
          kaleidoMomentumState,
          elapsed,
          x,
          y,
          forceX * 0.92,
          forceY * 0.92,
          lane + 2,
          handPointer.down,
        )
      } else {
        addSplat(x, y, forceX, forceY, now / 1000, lane + 2, radiusScale)
      }
      if (isGestureCut) {
        recordGestureReplayPoint(gestureReplayState, elapsed, x, y, forceX, forceY, lane + 2, radiusScale, handPointer.down)
      }
      if (isRicochet) {
        recordRicochetRay(ricochetRayState, elapsed, x, y, forceX, forceY, lane + 2, handPointer.down)
      }
      if (!isGestureCut && !isRicochet && !isKaleido) {
        addSplat(clamp(x - 0.032, 0.001, 0.999), y, forceX * 0.68, forceY * 0.48, now / 1000, lane + 4, handPointer.down ? 1.35 : 0.86)
      }
      lastHandSplatAt = now
    }

    const draw = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 1 / 30)
      previous = now

      if (needsResize || resizeVersionRef.current !== observedResizeVersion) {
        updateRenderSize()
      }

      const currentValues = valuesRef.current
      const intensity = readNumber(currentValues, 'intensity', 1.18)
      const motion = readNumber(currentValues, 'motion', 1.05)
      const detail = readNumber(currentValues, 'detail', 2.45)
      const particleAmount = readNumber(currentValues, 'particles', hasGpgpuParticles(effect) ? 1 : 0)
      const primary = hexToColor(currentValues.primary, effect.accentColor)

      material.uniforms.uVelocity.value = fluid.velocityTexture
      material.uniforms.uDensity.value = fluid.densityTexture
      material.uniforms.uDye.value = fluid.dyeTexture
      material.uniforms.uIntensity.value = intensity
      material.uniforms.uMotion.value = motion
      material.uniforms.uDetail.value = detail
      material.uniforms.uPrimary.value.copy(primary)
      material.uniforms.uStyle.value = getFluidStyleId(effect)
      material.uniforms.uParticles.value = particleAmount
      const audio = getAudio(effect.audioReactive ? audioLevels : undefined)
      material.uniforms.uAudio.value.set(audio.bass, audio.mid, audio.treble, audio.beat)

      if (!pausedRef.current) {
        elapsed += delta
        const isViscousKaleido = fluidStyle === 11
        fluid.splatForce = isViscousKaleido ? 5.8 + intensity * 1.2 : 4.5 + intensity * 1.2
        fluid.curlStrength = isViscousKaleido ? 0.11 + detail * 0.022 : 0.15 + detail * 0.038
        fluid.velocityDissipation = isViscousKaleido ? 0.996 : 0.988
        fluid.densityDissipation = isViscousKaleido
          ? 0.991 + clamp(detail, 0.4, 5) * 0.001
          : 0.948 + clamp(detail, 0.4, 5) * 0.007
        fluid.dyeDissipation = isViscousKaleido
          ? 0.994 + clamp(detail, 0.4, 5) * 0.0007
          : 0.968 + clamp(detail, 0.4, 5) * 0.003
        if (needsStreamSeed) {
          seedStream(addSplat, elapsed, intensity, motion, 1, fluidStyle, latestResize.width / Math.max(1, latestResize.height))
          needsStreamSeed = false
        }
        emitAutoSplats(elapsed)
        if (effect.audioReactive) {
          emitAudioSplats(addSplat, audio, elapsed, audioSplatState, motion, 1, fluidStyle)
        }
        emitHandSplat(now)
        emitKaleidoMomentumSplats(
          addSplat,
          kaleidoMomentumState,
          elapsed,
          fluidStyle,
          latestResize.width / Math.max(1, latestResize.height),
        )
        emitGestureReplaySplats(addSplat, gestureReplayState, elapsed, fluidStyle)
        emitRicochetSplats(addSplat, ricochetRayState, elapsed, fluidStyle)
        fluid.step(delta)
        particles?.update({
          delta,
          time: elapsed,
          velocityTexture: fluid.velocityTexture,
          densityTexture: fluid.densityTexture,
          dyeTexture: fluid.dyeTexture,
          primary,
          motion,
          intensity,
          particleAmount,
          resolution: latestResize,
        })
      }

      material.uniforms.uTime.value = elapsed
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
      window.dispatchEvent(new CustomEvent('portfolio:water-frame', {detail: renderer.domElement}))
      if (fluidStyle === 10) {
        drawRicochetRayOverlay(gestureOverlayContext, ricochetRayState, elapsed, latestResize, fluidStyle)
      } else {
        drawGestureReplayOverlay(gestureOverlayContext, gestureReplayState, elapsed, latestResize, fluidStyle)
      }

      if (!notifiedReady) {
        readyStartedAt ||= now
        readyFrames += 1
        if (readyFrames >= READY_WARMUP_FRAMES && now - readyStartedAt >= READY_WARMUP_MS) {
          notifiedReady = true
          onReadyRef.current?.(effect.id)
        }
      }

      statsFrames += 1
      if (now >= nextStatsAt) {
        const fps = Math.round((statsFrames * 1000) / (now - statsPrevious))
        onStatsRef.current?.({
          fps,
          scale: latestResize.scale,
          width: latestResize.width,
          height: latestResize.height,
        })
        statsFrames = 0
        statsPrevious = now
        nextStatsAt = now + STATS_INTERVAL_MS
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', requestResize)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerEnd)
      canvas.removeEventListener('pointerout', resetPointer)
      canvas.removeEventListener('pointercancel', onPointerEnd)
      canvas.removeEventListener('lostpointercapture', onLostPointerCapture)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseleave', resetPointer)
      scene.remove(mesh)
      particles?.dispose()
      geometry.dispose()
      material.dispose()
      fluid.dispose()
      renderer.dispose()
    }
  }, [audioLevels, effect, externalPointer])

  return (
    <div className="shader-stage">
      <canvas
        ref={canvasRef}
        className="shader-canvas fluid-fx-canvas"
        aria-label={`${effect.title} live three-fluid-fx preview`}
      />
      <canvas
        ref={gestureOverlayRef}
        className="gesture-trail-overlay"
        aria-hidden="true"
      />
      {error ? (
        <div className="shader-error" role="alert">
          <strong>three-fluid-fx error</strong>
          <pre>{error}</pre>
        </div>
      ) : null}
      {pipelineNote ? <div className="pipeline-status">{pipelineNote}</div> : null}
    </div>
  )
}

type TslFluidFxCanvasProps = FluidFxCanvasProps & {
  onUnavailable: (reason: string) => void
}

function TslFluidFxCanvas({
  effect,
  values,
  paused,
  externalPointer,
  audioLevels,
  performanceMode = false,
  quality,
  onStats,
  onReady,
  onCompileError,
  onUnavailable,
}: TslFluidFxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gestureOverlayRef = useRef<HTMLCanvasElement | null>(null)
  const valuesRef = useRef(values)
  const pausedRef = useRef(paused)
  const performanceModeRef = useRef(performanceMode)
  const qualityRef = useRef(quality)
  const onStatsRef = useRef(onStats)
  const onReadyRef = useRef(onReady)
  const onCompileErrorRef = useRef(onCompileError)
  const onUnavailableRef = useRef(onUnavailable)
  const resizeVersionRef = useRef(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    performanceModeRef.current = performanceMode
    resizeVersionRef.current += 1
  }, [performanceMode])

  useEffect(() => {
    qualityRef.current = quality
    resizeVersionRef.current += 1
  }, [quality])

  useEffect(() => {
    onStatsRef.current = onStats
  }, [onStats])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    onCompileErrorRef.current = onCompileError
  }, [onCompileError])

  useEffect(() => {
    onUnavailableRef.current = onUnavailable
  }, [onUnavailable])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const gestureOverlay = gestureOverlayRef.current
    const gestureOverlayContext = gestureOverlay?.getContext('2d') ?? null

    let disposed = false
    let cleanupRuntime: (() => void) | null = null

    const start = async () => {
      try {
        if (!('gpu' in navigator)) {
          throw new Error('WebGPU is not available in this browser.')
        }

        const webgpu = await import('three/webgpu')
        const tsl = await import('three/tsl')
        const fluidFx = await import('three-fluid-fx/tsl')
        if (disposed) {
          return
        }

        const renderer = new webgpu.WebGPURenderer({
          canvas,
          antialias: false,
          alpha: false,
        })
        renderer.setPixelRatio(1)
        renderer.setClearColor(0x010307, 1)
        renderer.toneMapping = NoToneMapping
        await renderer.init()
        if (disposed) {
          renderer.dispose()
          return
        }

        const fluid = new fluidFx.FluidSimulation(renderer, {
          profile: qualitySettings[qualityRef.current].profile,
          pressureIterations: qualityRef.current === 'high' ? 8 : 6,
          densityDissipation: 0.955,
          dyeDissipation: 0.977,
          velocityDissipation: 0.988,
          curlStrength: 0.2,
          splatRadius: 0.0005,
          splatForce: 5.8,
          reflectWalls: false,
          enableVorticity: false,
          bfecc: false,
        })
        fluid.enableDye = true

        const scene = new Scene()
        scene.background = new Color(0x010307)
        const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
        const fluidStyle = getFluidStyleId(effect)
        const baseGeometry = new PlaneGeometry(2, 2)
        const baseTexture = createStreamTexture(effect.accentColor, fluidStyle)
        const baseMaterial = new MeshBasicMaterial({
          color: baseTexture ? 0xffffff : 0x041017,
          map: baseTexture,
        })
        const baseMesh = new Mesh(baseGeometry, baseMaterial)
        scene.add(baseMesh)

        const scenePass = tsl.pass(scene, camera)
        const timeNode = tsl.uniform(0)
        const intensityNode = tsl.uniform(1.35)
        const vibranceNode = tsl.uniform(0.52)
        const velocityScaleNode = tsl.uniform(0.62)
        const overlayNode = fluidFx.trailOverlay(scenePass, fluid.densityNode, fluid.dyeNode, fluid.velocityNode, {
          intensity: intensityNode,
          time: timeNode,
          cursorColor: tsl.vec3(0.34, 0.86, 0.98),
          vibrance: vibranceNode,
          velocityScale: velocityScaleNode,
          opacity: 0.96,
        })
        const tintNode = fluidFx.densityTintOverlay(overlayNode, fluid.densityNode, {
          intensity: 0.2,
          tint: tsl.vec3(0.28, 0.78, 0.88),
        })
        const outputNode = fluidFx.chromaticDistortion(tintNode, fluid.densityNode, 0.26)
        const pipeline = new webgpu.RenderPipeline(renderer)
        pipeline.outputNode = outputNode

        let frameId = 0
        let elapsed = 0
        let previous = performance.now()
        let statsPrevious = previous
        let nextStatsAt = previous + FIRST_STATS_DELAY_MS
        let statsFrames = 0
        let notifiedReady = false
        let readyFrames = 0
        let readyStartedAt = 0
        let latestResize: ResizeState = { fps: 0, scale: 1, pixelRatio: 1, width: 1, height: 1 }
        let observedResizeVersion = -1
        let needsResize = true
        let nextEmitterAt = 0
        let pointerHasPrevious = false
        let pointerClientX = 0
        let pointerClientY = 0
        let pointerLastSplatAt = 0
        let lastPointerEventAt = 0
        let activePointerId: number | null = null
        let lastHandSplatAt = 0
        let needsStreamSeed = true
        let audioSplatState = createAudioSplatState()
        let gestureReplayState = createGestureReplayState()
        let ricochetRayState = createRicochetRayState()
        let kaleidoMomentumState = createKaleidoMomentumState()

        const requestResize = () => {
          needsResize = true
          needsStreamSeed = true
          audioSplatState = createAudioSplatState()
          gestureReplayState = createGestureReplayState()
          ricochetRayState = createRicochetRayState()
          gestureOverlayContext?.clearRect(0, 0, gestureOverlayContext.canvas.width, gestureOverlayContext.canvas.height)
        }
        const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(requestResize)
        resizeObserver?.observe(canvas)
        window.addEventListener('resize', requestResize)

        const updateRenderSize = () => {
          latestResize = resizeRenderer(
            canvas,
            renderer,
            fluid,
            performanceModeRef.current,
            qualityRef.current,
          )
          resizeGestureOverlay(gestureOverlay, latestResize)
          observedResizeVersion = resizeVersionRef.current
          needsResize = false
          needsStreamSeed = true
        }

        const addSplat = (
          x: number,
          y: number,
          dx: number,
          dy: number,
          time: number,
          lane: number,
          radiusScale = 1,
        ) => {
          const currentValues = valuesRef.current
          const detail = readNumber(currentValues, 'detail', 2.4)
          const primary = hexToColor(currentValues.primary, effect.accentColor)
          fluid.addSplat(
            clamp(x, 0.001, 0.999),
            clamp(y, 0.001, 0.999),
            dx,
            dy,
            {
              radius: (0.00028 + detail * 0.000055) * radiusScale * (fluidStyle === 11 ? 1.2 : 1),
              dyeColor: dyeFromPalette(primary, time, lane, fluidStyle),
            },
          )
        }

        const emitAutoSplats = (time: number) => {
          if (fluidStyle === 11) {
            return
          }

          const currentValues = valuesRef.current
          const intensity = readNumber(currentValues, 'intensity', 1.18)
          const motion = readNumber(currentValues, 'motion', 1.05)
          const interval = clamp(0.12 - motion * 0.026, 0.058, 0.115)

          if (nextEmitterAt <= 0) {
            nextEmitterAt = time + 0.04
          }

          let emitted = 0
          while (time >= nextEmitterAt && emitted < 3) {
            if (fluidStyle === 8 && time - gestureReplayState.lastInputAt < 3.4) {
              nextEmitterAt += interval
              emitted += 1
              continue
            }
            if (fluidStyle === 10 && time - ricochetRayState.lastInputAt < 2.0) {
              nextEmitterAt += interval
              emitted += 1
              continue
            }

            const lane = Math.floor(nextEmitterAt * 7.0) % 6
            if (fluidStyle === 11) {
              const aspect = latestResize.width / Math.max(1, latestResize.height)
              const orbitAngle = nextEmitterAt * 0.19 + lane * 0.23
              const orbitRadius = 0.16 + (lane % 3) * 0.105
              const x = 0.5 + Math.cos(orbitAngle) * orbitRadius / Math.max(0.25, aspect)
              const y = 0.5 + Math.sin(orbitAngle) * orbitRadius
              const radialForce = 2.8 + intensity * 0.7
              const tangentForce = 8.5 + motion * 3.6
              const dx = Math.cos(orbitAngle) * radialForce - Math.sin(orbitAngle) * tangentForce
              const dy = Math.sin(orbitAngle) * radialForce + Math.cos(orbitAngle) * tangentForce
              emitKaleidoSplats(
                addSplat,
                x,
                y,
                dx,
                dy,
                nextEmitterAt,
                110 + lane * 7,
                0.34 + intensity * 0.035,
                aspect,
                lane % KALEIDO_SEGMENTS,
              )
              nextEmitterAt += interval * 1.75
              emitted += 1
              continue
            }

            const laneBase = (lane + 0.5) / 6
            const fan = (lane % 7) - 3
            const angle = -0.04 + fan * 0.05 + Math.sin(nextEmitterAt * 1.4 + lane) * 0.018
            const y = fluidStyle === 9
              ? clamp(0.16 + (lane % 5) * 0.16, 0.08, 0.92)
              : fluidStyle === 10
                ? clamp(0.16 + (lane % 7) * 0.105 + Math.sin(nextEmitterAt * 2.1 + lane) * 0.014, 0.09, 0.91)
                : clamp(laneBase + Math.sin(nextEmitterAt * 2.1 + lane) * 0.035, 0.1, 0.9)
            const dx = fluidStyle === 9
              ? 24 + motion * 7 + intensity * 4
              : fluidStyle === 10
                ? Math.cos(angle) * (14 + motion * 4 + intensity * 1.5)
                : 23 + motion * 9 + intensity * 6
            const dy = fluidStyle === 9 ? 0 : fluidStyle === 10 ? Math.sin(angle) * (14 + motion * 4 + intensity * 1.5) : Math.sin(nextEmitterAt * 3.7 + lane * 1.3) * 1.9
            const leadRadius = fluidStyle === 8 ? 0.7 + intensity * 0.08 : fluidStyle === 9 ? 0.7 + intensity * 0.07 : fluidStyle === 10 ? 0.02 + intensity * 0.005 : 1.34 + intensity * 0.16
            const echoRadius = fluidStyle === 8 ? 0.44 + intensity * 0.06 : fluidStyle === 9 ? 0.32 + intensity * 0.04 : fluidStyle === 10 ? 0.014 + intensity * 0.004 : 0.82 + intensity * 0.1
            addSplat(0.08, y, dx, dy, nextEmitterAt, lane, leadRadius)
            addSplat(0.2, fluidStyle === 9 ? y : fluidStyle === 10 ? clamp(y + fan * 0.006, 0.08, 0.92) : clamp(y + Math.sin(nextEmitterAt * 2.9) * 0.024, 0.08, 0.92), dx * 0.74, fluidStyle === 9 ? 0 : dy * 0.56, nextEmitterAt, lane + 3, echoRadius)
            nextEmitterAt += interval
            emitted += 1
          }
        }

        const handlePointerSplat = (
          clientX: number,
          clientY: number,
          moveX: number,
          moveY: number,
          now: number,
          pressed: boolean,
        ) => {
          if (now - pointerLastSplatAt < (fluidStyle === 11 ? 24 : 16) && !pressed) {
            return
          }

          const rect = canvas.getBoundingClientRect()
          const x = (clientX - rect.left) / Math.max(1, rect.width)
          const y = 1 - (clientY - rect.top) / Math.max(1, rect.height)
          const currentValues = valuesRef.current
          const intensity = readNumber(currentValues, 'intensity', 1.18)
          const motion = readNumber(currentValues, 'motion', 1.05)
          const forceX = clamp(moveX * (0.72 + intensity * 0.18) + 10 + motion * 4, -18, 44)
          const forceY = clamp(-moveY * 0.52, -18, 18)
          const lane = Math.floor(clamp(y, 0, 0.999) * 6)
          const isGestureCut = fluidStyle === 8
          const isRicochet = fluidStyle === 10
          const isKaleido = fluidStyle === 11
          const radiusScale = isGestureCut
            ? (pressed ? 0.58 : 0.44)
            : isRicochet
              ? (pressed ? 0.04 : 0.025)
              : isKaleido
                ? (pressed ? 1.12 : 0.88)
                : pressed ? 1.45 : 1.08
          if (isKaleido) {
            emitKaleidoSplats(addSplat, x, y, forceX * 0.96, forceY * 0.96, now / 1000, lane, radiusScale, rect.width / Math.max(1, rect.height))
            recordKaleidoMomentum(kaleidoMomentumState, elapsed, x, y, forceX * 0.96, forceY * 0.96, lane, pressed)
          } else {
            addSplat(x, y, forceX, forceY, now / 1000, lane, radiusScale)
          }
          if (isGestureCut) {
            recordGestureReplayPoint(gestureReplayState, elapsed, x, y, forceX, forceY, lane, radiusScale, pressed)
          }
          if (isRicochet) {
            recordRicochetRay(ricochetRayState, elapsed, x, y, forceX, forceY, lane, pressed)
          }
          if (pressed && !isGestureCut && !isRicochet && !isKaleido) {
            addSplat(clamp(x - 0.034, 0.001, 0.999), y, forceX * 0.62, forceY * 0.45, now / 1000, lane + 5, 0.92)
          }
          pointerLastSplatAt = now
        }

        const onPointerMove = (event: PointerEvent) => {
          const isDirectPointer = event.pointerType !== 'mouse'
          if (isDirectPointer && activePointerId !== event.pointerId) {
            return
          }
          if (isDirectPointer && event.cancelable) {
            event.preventDefault()
          }
          lastPointerEventAt = performance.now()
          const moveX = pointerHasPrevious ? event.clientX - pointerClientX : 0
          const moveY = pointerHasPrevious ? event.clientY - pointerClientY : 0
          pointerClientX = event.clientX
          pointerClientY = event.clientY
          pointerHasPrevious = true

          if (Math.abs(moveX) + Math.abs(moveY) < 0.35) {
            return
          }

          const pressed = event.buttons > 0 || (isDirectPointer && activePointerId === event.pointerId)
          handlePointerSplat(event.clientX, event.clientY, moveX, moveY, event.timeStamp || performance.now(), pressed)
        }

        const onPointerDown = (event: PointerEvent) => {
          if (activePointerId !== null && activePointerId !== event.pointerId) {
            return
          }
          if (event.pointerType !== 'mouse' && event.cancelable) {
            event.preventDefault()
          }
          activePointerId = event.pointerId
          if (!canvas.hasPointerCapture(event.pointerId)) {
            canvas.setPointerCapture(event.pointerId)
          }
          lastPointerEventAt = performance.now()
          pointerClientX = event.clientX
          pointerClientY = event.clientY
          pointerHasPrevious = true
          handlePointerSplat(event.clientX, event.clientY, 16, 0, event.timeStamp || performance.now(), true)
        }

        const onPointerEnd = (event: PointerEvent) => {
          if (activePointerId !== event.pointerId) {
            return
          }
          if (event.pointerType !== 'mouse' && event.cancelable) {
            event.preventDefault()
          }
          if (canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId)
          }
          activePointerId = null
          pointerHasPrevious = false
        }

        const onLostPointerCapture = (event: PointerEvent) => {
          if (activePointerId === event.pointerId) {
            activePointerId = null
            pointerHasPrevious = false
          }
        }

        const onMouseMove = (event: MouseEvent) => {
          if (performance.now() - lastPointerEventAt < 80) {
            return
          }
          const moveX = pointerHasPrevious ? event.clientX - pointerClientX : 0
          const moveY = pointerHasPrevious ? event.clientY - pointerClientY : 0
          pointerClientX = event.clientX
          pointerClientY = event.clientY
          pointerHasPrevious = true

          if (Math.abs(moveX) + Math.abs(moveY) < 0.35) {
            return
          }

          handlePointerSplat(event.clientX, event.clientY, moveX, moveY, event.timeStamp || performance.now(), event.buttons > 0)
        }

        const onMouseDown = (event: MouseEvent) => {
          if (performance.now() - lastPointerEventAt < 80) {
            return
          }
          pointerClientX = event.clientX
          pointerClientY = event.clientY
          pointerHasPrevious = true
          handlePointerSplat(event.clientX, event.clientY, 16, 0, event.timeStamp || performance.now(), true)
        }

        const resetPointer = (event?: Event) => {
          if (event && 'pointerId' in event && activePointerId === (event as PointerEvent).pointerId) {
            return
          }
          pointerHasPrevious = false
        }

        canvas.addEventListener('pointermove', onPointerMove, { passive: false })
        canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
        canvas.addEventListener('pointerup', onPointerEnd, { passive: false })
        canvas.addEventListener('pointerout', resetPointer)
        canvas.addEventListener('pointercancel', onPointerEnd, { passive: false })
        canvas.addEventListener('lostpointercapture', onLostPointerCapture)
        canvas.addEventListener('mousemove', onMouseMove, { passive: true })
        canvas.addEventListener('mousedown', onMouseDown, { passive: true })
        canvas.addEventListener('mouseleave', resetPointer)

        const emitHandSplat = (now: number) => {
          const handPointer = externalPointer?.current
          if (!handPointer?.active || handPointer.confidence < 0.18 || now - lastHandSplatAt < (handPointer.down ? 18 : 30)) {
            return
          }

          const currentValues = valuesRef.current
          const motion = readNumber(currentValues, 'motion', 1.05)
          const x = clamp(handPointer.x, 0.001, 0.999)
          const y = clamp(1 - handPointer.y, 0.001, 0.999)
          const forceX = clamp(handPointer.vx * 360 + 18 + motion * 6, -20, 56) * handPointer.confidence
          const forceY = clamp(-handPointer.vy * 260, -20, 20) * handPointer.confidence
          const lane = Math.floor(clamp(y, 0, 0.999) * 6)
          const isGestureCut = fluidStyle === 8
          const isRicochet = fluidStyle === 10
          const isKaleido = fluidStyle === 11
          const radiusScale = isGestureCut
            ? (handPointer.down ? 0.68 : 0.5)
            : isRicochet
              ? (handPointer.down ? 0.06 : 0.04)
              : isKaleido
                ? (handPointer.down ? 1.18 : 0.92)
                : handPointer.down ? 1.85 : 1.22
          if (isKaleido) {
            emitKaleidoSplats(
              addSplat,
              x,
              y,
              forceX * 0.92,
              forceY * 0.92,
              now / 1000,
              lane + 2,
              radiusScale,
              latestResize.width / Math.max(1, latestResize.height),
            )
            recordKaleidoMomentum(
              kaleidoMomentumState,
              elapsed,
              x,
              y,
              forceX * 0.92,
              forceY * 0.92,
              lane + 2,
              handPointer.down,
            )
          } else {
            addSplat(x, y, forceX, forceY, now / 1000, lane + 2, radiusScale)
          }
          if (isGestureCut) {
            recordGestureReplayPoint(gestureReplayState, elapsed, x, y, forceX, forceY, lane + 2, radiusScale, handPointer.down)
          }
          if (isRicochet) {
            recordRicochetRay(ricochetRayState, elapsed, x, y, forceX, forceY, lane + 2, handPointer.down)
          }
          if (!isGestureCut && !isRicochet && !isKaleido) {
            addSplat(clamp(x - 0.032, 0.001, 0.999), y, forceX * 0.68, forceY * 0.48, now / 1000, lane + 4, handPointer.down ? 1.35 : 0.86)
          }
          lastHandSplatAt = now
        }

        const draw = (now: number) => {
          if (disposed) {
            return
          }

          const delta = Math.min((now - previous) / 1000, 1 / 30)
          previous = now

          if (needsResize || resizeVersionRef.current !== observedResizeVersion) {
            updateRenderSize()
          }

          const currentValues = valuesRef.current
          const intensity = readNumber(currentValues, 'intensity', 1.18)
          const motion = readNumber(currentValues, 'motion', 1.05)
          const detail = readNumber(currentValues, 'detail', 2.45)
          const audio = getAudio(effect.audioReactive ? audioLevels : undefined)
          intensityNode.value = 0.9 + intensity * 0.34 + audio.bass * 0.42 + audio.beat * 0.52
          vibranceNode.value = 0.36 + intensity * 0.18 + audio.treble * 0.28
          velocityScaleNode.value = 0.48 + detail * 0.052 + audio.mid * 0.08

          if (!pausedRef.current) {
            elapsed += delta
            timeNode.value = elapsed
            const isViscousKaleido = fluidStyle === 11
            fluid.splatForce = isViscousKaleido ? 5.8 + intensity * 1.2 : 5.3 + intensity * 1.45
            fluid.curlStrength = isViscousKaleido ? 0.11 + detail * 0.022 : 0.13 + detail * 0.034
            fluid.velocityDissipation = isViscousKaleido ? 0.996 : 0.988
            fluid.densityDissipation = isViscousKaleido
              ? 0.991 + clamp(detail, 0.4, 5) * 0.001
              : 0.948 + clamp(detail, 0.4, 5) * 0.007
            fluid.dyeDissipation = isViscousKaleido
              ? 0.994 + clamp(detail, 0.4, 5) * 0.0007
              : 0.968 + clamp(detail, 0.4, 5) * 0.003
            if (needsStreamSeed) {
              seedStream(addSplat, elapsed, intensity, motion, 0.9, fluidStyle, latestResize.width / Math.max(1, latestResize.height))
              needsStreamSeed = false
            }
            emitAutoSplats(elapsed)
            if (effect.audioReactive) {
              emitAudioSplats(addSplat, audio, elapsed, audioSplatState, motion, 1.05, fluidStyle)
            }
            emitHandSplat(now)
            emitKaleidoMomentumSplats(
              addSplat,
              kaleidoMomentumState,
              elapsed,
              fluidStyle,
              latestResize.width / Math.max(1, latestResize.height),
            )
            emitGestureReplaySplats(addSplat, gestureReplayState, elapsed, fluidStyle)
            emitRicochetSplats(addSplat, ricochetRayState, elapsed, fluidStyle)
            fluid.step(delta)
          }

          pipeline.render()
          if (fluidStyle === 10) {
            drawRicochetRayOverlay(gestureOverlayContext, ricochetRayState, elapsed, latestResize, fluidStyle)
          } else {
            drawGestureReplayOverlay(gestureOverlayContext, gestureReplayState, elapsed, latestResize, fluidStyle)
          }

          if (!notifiedReady) {
            readyStartedAt ||= now
            readyFrames += 1
            if (readyFrames >= READY_WARMUP_FRAMES && now - readyStartedAt >= READY_WARMUP_MS) {
              notifiedReady = true
              onReadyRef.current?.(effect.id)
            }
          }

          statsFrames += 1
          if (now >= nextStatsAt) {
            const fps = Math.round((statsFrames * 1000) / (now - statsPrevious))
            onStatsRef.current?.({
              fps,
              scale: latestResize.scale,
              width: latestResize.width,
              height: latestResize.height,
            })
            statsFrames = 0
            statsPrevious = now
            nextStatsAt = now + STATS_INTERVAL_MS
          }

          frameId = requestAnimationFrame(draw)
        }

        frameId = requestAnimationFrame(draw)
        setError(null)

        cleanupRuntime = () => {
          cancelAnimationFrame(frameId)
          resizeObserver?.disconnect()
          window.removeEventListener('resize', requestResize)
          canvas.removeEventListener('pointermove', onPointerMove)
          canvas.removeEventListener('pointerdown', onPointerDown)
          canvas.removeEventListener('pointerup', onPointerEnd)
          canvas.removeEventListener('pointerout', resetPointer)
          canvas.removeEventListener('pointercancel', onPointerEnd)
          canvas.removeEventListener('lostpointercapture', onLostPointerCapture)
          canvas.removeEventListener('mousemove', onMouseMove)
          canvas.removeEventListener('mousedown', onMouseDown)
          canvas.removeEventListener('mouseleave', resetPointer)
          scene.remove(baseMesh)
          baseGeometry.dispose()
          baseTexture?.dispose()
          baseMaterial.dispose()
          pipeline.dispose()
          fluid.dispose()
          renderer.dispose()
        }
      } catch (initError) {
        const message = initError instanceof Error ? initError.message : 'TSL/WebGPU initialization failed.'
        setError(message)
        onCompileErrorRef.current?.(effect.id)
        onUnavailableRef.current(message)
      }
    }

    void start()

    return () => {
      disposed = true
      cleanupRuntime?.()
    }
  }, [audioLevels, effect, externalPointer])

  return (
    <div className="shader-stage">
      <canvas
        ref={canvasRef}
        className="shader-canvas fluid-fx-canvas"
        aria-label={`${effect.title} live three-fluid-fx TSL preview`}
      />
      <canvas
        ref={gestureOverlayRef}
        className="gesture-trail-overlay"
        aria-hidden="true"
      />
      <div className="pipeline-status">TSL / WebGPU</div>
      {error ? (
        <div className="shader-error" role="alert">
          <strong>TSL pipeline error</strong>
          <pre>{error}</pre>
        </div>
      ) : null}
    </div>
  )
}
