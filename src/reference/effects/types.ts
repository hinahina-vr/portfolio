export type CategoryId =
  | 'interactive'
  | 'game-vfx'
  | 'aquatic'
  | 'fire-smoke'
  | 'energy-magic'
  | 'space'
  | 'nature-weather'
  | 'geometry-abstract'
  | 'motion-tunnels'
  | 'post-fx'
  | 'particles'
  | 'liquid'
  | 'materials-surfaces'

export type EffectCategory = {
  id: CategoryId
  label: string
  labelJa: string
  description: string
}

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
  titleJa: string
  categoryId: CategoryId
  category: string
  description: string
  descriptionJa: string
  accentColor: string
  tags: string[]
  fragment: string
  controls: EffectControl[]
  audioReactive?: boolean
  renderer?: 'shader' | 'three-fluid' | 'tsl-particles'
  codeLanguage?: 'glsl' | 'tsl'
}

export type LegacyEffectDefinition = {
  id: string
  title: string
  category: string
  description: string
  accentColor: string
  fragment: string
  controls: EffectControl[]
}
