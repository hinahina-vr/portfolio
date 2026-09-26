import { useEffect, useRef, useState, type RefObject } from 'react'
import type { ControlValues, EffectDefinition } from './effects'
import type { HandPointerInput } from './handTracking'

export type RenderQuality = 'auto' | 'high' | 'balanced' | 'low'

export type RenderStats = {
  fps: number
  scale: number
  width: number
  height: number
}

export type AudioLevels = {
  bass: number
  mid: number
  treble: number
  beat: number
}

type ShaderCanvasProps = {
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
  pipelineNote?: string | null
}

type ResizeState = RenderStats & {
  pixelRatio: number
}

type ProgramState = {
  program: WebGLProgram
  vertexBuffer: WebGLBuffer
  uniforms: {
    resolution: WebGLUniformLocation | null
    time: WebGLUniformLocation | null
    timeDelta: WebGLUniformLocation | null
    frame: WebGLUniformLocation | null
    mouse: WebGLUniformLocation | null
    hand: WebGLUniformLocation | null
    pointerMotion: WebGLUniformLocation | null
    audio: WebGLUniformLocation | null
    date: WebGLUniformLocation | null
    custom: Map<string, WebGLUniformLocation | null>
  }
}

const vertexSource = `#version 300 es
in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

const makeFragmentSource = (fragment: string) => `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iHand;
uniform vec4 iPointerMotion;
uniform vec4 iAudio;
uniform vec4 iDate;

${fragment}

void main() {
  mainImage(fragColor, gl_FragCoord.xy);
}
`

const compileShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type)
  if (!shader) {
    throw new Error('Could not create shader.')
  }

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error.'
    gl.deleteShader(shader)
    throw new Error(log)
  }

  return shader
}

const createProgram = (gl: WebGL2RenderingContext, effect: EffectDefinition): ProgramState => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, makeFragmentSource(effect.fragment))
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Could not create WebGL program.')
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.deleteShader(vertexShader)
  gl.deleteShader(fragmentShader)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? 'Unknown program link error.'
    gl.deleteProgram(program)
    throw new Error(log)
  }

  const vertexBuffer = gl.createBuffer()
  if (!vertexBuffer) {
    gl.deleteProgram(program)
    throw new Error('Could not create vertex buffer.')
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)

  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const custom = new Map<string, WebGLUniformLocation | null>()
  effect.controls.forEach((control) => {
    custom.set(control.id, gl.getUniformLocation(program, control.uniform))
  })

  return {
    program,
    vertexBuffer,
    uniforms: {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      time: gl.getUniformLocation(program, 'iTime'),
      timeDelta: gl.getUniformLocation(program, 'iTimeDelta'),
      frame: gl.getUniformLocation(program, 'iFrame'),
      mouse: gl.getUniformLocation(program, 'iMouse'),
      hand: gl.getUniformLocation(program, 'iHand'),
      pointerMotion: gl.getUniformLocation(program, 'iPointerMotion'),
      audio: gl.getUniformLocation(program, 'iAudio'),
      date: gl.getUniformLocation(program, 'iDate'),
      custom,
    },
  }
}

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, '$1$1') : normalized, 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

const qualitySettings = {
  high: { ratioCap: 1.45, maxPixels: 1_800_000 },
  balanced: { ratioCap: 1, maxPixels: 820_000 },
  low: { ratioCap: 0.72, maxPixels: 420_000 },
  auto: { ratioCap: 0.78, maxPixels: 460_000 },
} as const satisfies Record<RenderQuality, { ratioCap: number; maxPixels: number }>

const performanceQualityCap = { ratioCap: 0.68, maxPixels: 280_000 }

const resizeCanvas = (
  canvas: HTMLCanvasElement,
  gl: WebGL2RenderingContext,
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

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  gl.viewport(0, 0, width, height)
  const nativeWidth = Math.max(1, cssWidth * (window.devicePixelRatio || 1))

  return {
    fps: 0,
    scale: width / nativeWidth,
    pixelRatio: ratio,
    width,
    height,
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const READY_WARMUP_FRAMES = 4
const READY_WARMUP_MS = 220
const FIRST_STATS_DELAY_MS = 2600
const STATS_INTERVAL_MS = 1800

export default function ShaderCanvas({
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
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const programRef = useRef<ProgramState | null>(null)
  const valuesRef = useRef(values)
  const pausedRef = useRef(paused)
  const performanceModeRef = useRef(performanceMode)
  const qualityRef = useRef(quality)
  const onStatsRef = useRef(onStats)
  const onReadyRef = useRef(onReady)
  const onCompileErrorRef = useRef(onCompileError)
  const resizeVersionRef = useRef(0)
  const localPointerRef = useRef({ x: 0.5, y: 0.5, active: false, down: false, lastX: 0.5, lastY: 0.5, lastTime: 0 })
  const handImpulseRef = useRef({ x: 0, y: 0, force: 0, vx: 0, vy: 0, time: 0 })
  const pointerMotionRef = useRef({ vx: 0, vy: 0 })
  const handDownRef = useRef(false)
  const handClickRef = useRef({ x: 0, y: 0 })
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
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    })

    if (!gl) {
      setError('WebGL2 is not available in this browser.')
      return
    }

    try {
      if (programRef.current) {
        gl.deleteBuffer(programRef.current.vertexBuffer)
        gl.deleteProgram(programRef.current.program)
      }
      programRef.current = createProgram(gl, effect)
      setError(null)
    } catch (compileError) {
      setError(compileError instanceof Error ? compileError.message : 'Shader compilation failed.')
      onCompileErrorRef.current?.(effect.id)
      return
    }

    let frameId = 0
    let frame = 0
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
    let renderedValues: ControlValues | null = null
    const requestResize = () => {
      needsResize = true
    }
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(requestResize)
    resizeObserver?.observe(canvas)
    window.addEventListener('resize', requestResize)

    const updateRenderSize = () => {
      latestResize = resizeCanvas(
        canvas,
        gl,
        performanceModeRef.current,
        qualityRef.current,
      )
      observedResizeVersion = resizeVersionRef.current
      needsResize = false
    }

    const draw = (now: number) => {
      const state = programRef.current
      if (!state) {
        return
      }

      // Freeze pointer inertia as well as time. Redraw for settings or resize,
      // and finish the initial frame even when reduced motion starts paused.
      if (pausedRef.current && notifiedReady && !needsResize
        && resizeVersionRef.current === observedResizeVersion
        && renderedValues === valuesRef.current) {
        previous = now
        frameId = requestAnimationFrame(draw)
        return
      }
      renderedValues = valuesRef.current

      const delta = Math.min((now - previous) / 1000, 1 / 30)
      previous = now
      if (!pausedRef.current) {
        elapsed += delta
        frame += 1
      }

      if (needsResize || resizeVersionRef.current !== observedResizeVersion) {
        updateRenderSize()
      }
      gl.useProgram(state.program)
      gl.bindBuffer(gl.ARRAY_BUFFER, state.vertexBuffer)

      const date = new Date()
      gl.uniform3f(state.uniforms.resolution, canvas.width, canvas.height, latestResize.pixelRatio)
      gl.uniform1f(state.uniforms.time, elapsed)
      gl.uniform1f(state.uniforms.timeDelta, delta)
      gl.uniform1i(state.uniforms.frame, frame)
      const handPointer = externalPointer?.current
      if (handPointer?.active) {
        const pointerX = clamp(handPointer.x * canvas.width, 0, canvas.width)
        const pointerY = clamp((1 - handPointer.y) * canvas.height, 0, canvas.height)
        const horizontalForce = clamp(handPointer.vx * 0.28, -1.2, 1.2) * handPointer.confidence
        const verticalForce = clamp(-handPointer.vy * 0.28, -1.2, 1.2) * handPointer.confidence

        if (Math.hypot(horizontalForce, verticalForce) > 0.05) {
          handImpulseRef.current = {
            x: pointerX,
            y: pointerY,
            force: horizontalForce,
            vx: horizontalForce,
            vy: verticalForce,
            time: now,
          }
        }

        if (handPointer.down && !handDownRef.current) {
          handClickRef.current = { x: pointerX, y: pointerY }
        }

        handDownRef.current = handPointer.down
        gl.uniform4f(
          state.uniforms.mouse,
          pointerX,
          pointerY,
          handPointer.down ? handClickRef.current.x : 0,
          handPointer.down ? handClickRef.current.y : 0,
        )
      } else if (localPointerRef.current.active) {
        const pointerX = clamp(localPointerRef.current.x * canvas.width, 0, canvas.width)
        const pointerY = clamp(localPointerRef.current.y * canvas.height, 0, canvas.height)
        gl.uniform4f(state.uniforms.mouse, pointerX, pointerY, pointerX + 0.001, pointerY + 0.001)
      } else {
        handDownRef.current = false
        gl.uniform4f(state.uniforms.mouse, 0, 0, 0, 0)
      }
      const impulseAge = handImpulseRef.current.time > 0 ? (now - handImpulseRef.current.time) / 1000 : 99
      const impulse = handImpulseRef.current.force * Math.exp(-impulseAge * 1.05)
      const impulseLife = Math.exp(-impulseAge * 2.4)
      const inertiaDecay = Math.exp(-impulseAge * 0.42)
      const pointerIsDriven = impulseAge < 0.14
      const velocityResponse = pointerIsDriven ? 3.1 : 0.42
      const velocityBlend = 1 - Math.exp(-delta * velocityResponse)
      const targetVelocityX = pointerIsDriven ? handImpulseRef.current.vx : 0
      const targetVelocityY = pointerIsDriven ? handImpulseRef.current.vy : 0
      pointerMotionRef.current.vx += (targetVelocityX - pointerMotionRef.current.vx) * velocityBlend
      pointerMotionRef.current.vy += (targetVelocityY - pointerMotionRef.current.vy) * velocityBlend
      const inertiaX = pointerMotionRef.current.vx
      const inertiaY = pointerMotionRef.current.vy
      const inertiaSpeed = Math.min(1.5, Math.hypot(inertiaX, inertiaY))
      gl.uniform4f(
        state.uniforms.hand,
        handImpulseRef.current.x,
        handImpulseRef.current.y,
        impulse,
        Math.abs(impulse) > 0.01 ? impulseLife : 0,
      )
      gl.uniform4f(
        state.uniforms.pointerMotion,
        inertiaX,
        inertiaY,
        inertiaSpeed,
        inertiaSpeed > 0.008 ? inertiaDecay : 0,
      )
      const audio = audioLevels?.current
      gl.uniform4f(
        state.uniforms.audio,
        audio?.bass ?? 0,
        audio?.mid ?? 0,
        audio?.treble ?? 0,
        audio?.beat ?? 0,
      )
      gl.uniform4f(
        state.uniforms.date,
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
      )

      effect.controls.forEach((control) => {
        const location = state.uniforms.custom.get(control.id) ?? null
        const value = valuesRef.current[control.id]

        if (control.kind === 'color' && typeof value === 'string') {
          const [r, g, b] = hexToRgb(value)
          gl.uniform3f(location, r, g, b)
        } else if (control.kind === 'toggle') {
          gl.uniform1f(location, value ? 1 : 0)
        } else if (typeof value === 'number') {
          gl.uniform1f(location, value)
        }
      })

      gl.drawArrays(gl.TRIANGLES, 0, 3)
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
      if (programRef.current) {
        gl.deleteBuffer(programRef.current.vertexBuffer)
        gl.deleteProgram(programRef.current.program)
        programRef.current = null
      }
    }
  }, [effect])

  return (
    <div className="shader-stage">
      <canvas
        ref={canvasRef}
        className="shader-canvas"
        aria-label={`${effect.title} live GLSL shader preview`}
        style={{ touchAction: 'none' }}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const nextX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
          const nextY = clamp(1 - (event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
          const now = performance.now()
          const elapsed = Math.max(8, now - localPointerRef.current.lastTime)
          const forceX = clamp(((nextX - localPointerRef.current.lastX) * 1000) / elapsed, -1.2, 1.2)
          const forceY = clamp(((nextY - localPointerRef.current.lastY) * 1000) / elapsed, -1.2, 1.2)
          if (localPointerRef.current.active && Math.hypot(forceX, forceY) > 0.015) {
            handImpulseRef.current = {
              x: nextX * event.currentTarget.width,
              y: nextY * event.currentTarget.height,
              force: forceX,
              vx: forceX,
              vy: forceY,
              time: now,
            }
          }
          localPointerRef.current.x = nextX
          localPointerRef.current.y = nextY
          localPointerRef.current.active = true
          localPointerRef.current.lastX = nextX
          localPointerRef.current.lastY = nextY
          localPointerRef.current.lastTime = now
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          const rect = event.currentTarget.getBoundingClientRect()
          const nextX = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1)
          const nextY = clamp(1 - (event.clientY - rect.top) / Math.max(1, rect.height), 0, 1)
          localPointerRef.current.x = nextX
          localPointerRef.current.y = nextY
          localPointerRef.current.active = true
          localPointerRef.current.down = true
          localPointerRef.current.lastX = nextX
          localPointerRef.current.lastY = nextY
          localPointerRef.current.lastTime = performance.now()
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          localPointerRef.current.down = false
          if (event.pointerType !== 'mouse') {
            localPointerRef.current.active = false
            localPointerRef.current.lastTime = 0
          }
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          localPointerRef.current.active = false
          localPointerRef.current.down = false
          localPointerRef.current.lastTime = 0
        }}
        onPointerLeave={() => {
          if (!localPointerRef.current.down) {
            localPointerRef.current.active = false
          }
          localPointerRef.current.lastTime = 0
        }}
      />
      {pipelineNote ? <div className="pipeline-status">{pipelineNote}</div> : null}
      {error ? (
        <div className="shader-error" role="alert">
          <strong>Shader compile error</strong>
          <pre>{error}</pre>
        </div>
      ) : null}
    </div>
  )
}
