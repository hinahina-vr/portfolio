import { categories } from './categories'
import { aquaticEffects } from './aquatic'
import { energyMagicEffects } from './energyMagic'
import { featuredEffects } from './featured'
import { fireSmokeEffects } from './fireSmoke'
import { gameVfxEffects } from './gameVfx'
import { geometryAbstractEffects } from './geometryAbstract'
import { liquidEffects } from './liquid'
import { materialSurfaceEffects } from './materialsSurfaces'
import { motionTunnelEffects } from './motionTunnels'
import { natureWeatherEffects } from './natureWeather'
import { particleEffects } from './particles'
import { postFxEffects } from './postFx'
import { preservedEffects } from './preserved'
import { spaceEffects } from './space'
import { toggleControl } from './glsl'
import type { CategoryId, ControlValues, EffectDefinition } from './types'

const preservedByCategory = (categoryId: CategoryId) =>
  preservedEffects.filter((effect) => effect.categoryId === categoryId)

const DEFAULT_PIPELINE_IS_TSL = true
const pipelineControl = toggleControl('pipeline', 'Pipeline TSL / GLSL', 'uUseTsl', DEFAULT_PIPELINE_IS_TSL)

const withDefaultPipelineMode = (effect: EffectDefinition): EffectDefinition => ({
  ...effect,
  controls: effect.controls.map((control) =>
    control.kind === 'toggle' && control.id === 'pipeline'
      ? {
          ...control,
          defaultValue: DEFAULT_PIPELINE_IS_TSL,
        }
      : control,
  ),
})

const withPipelineControl = (effect: EffectDefinition): EffectDefinition => {
  if (effect.renderer === 'tsl-particles') {
    return effect
  }

  if (effect.controls.some((control) => control.id === 'pipeline')) {
    return withDefaultPipelineMode(effect)
  }

  return withDefaultPipelineMode({
    ...effect,
    controls: [...effect.controls, pipelineControl],
  })
}

const rawEffects: EffectDefinition[] = [
  ...featuredEffects,
  ...preservedByCategory('game-vfx'),
  ...gameVfxEffects,
  ...aquaticEffects,
  ...preservedByCategory('fire-smoke'),
  ...fireSmokeEffects,
  ...energyMagicEffects,
  ...preservedByCategory('space'),
  ...spaceEffects,
  ...natureWeatherEffects,
  ...geometryAbstractEffects,
  ...preservedByCategory('motion-tunnels'),
  ...motionTunnelEffects,
  ...preservedByCategory('post-fx'),
  ...postFxEffects,
  ...particleEffects,
  ...liquidEffects,
  ...materialSurfaceEffects,
]

export const effects: EffectDefinition[] = rawEffects.map(withPipelineControl)

export const createDefaultValues = (effect: EffectDefinition): ControlValues =>
  effect.controls.reduce<ControlValues>((values, control) => {
    values[control.id] = control.id === 'pipeline' ? DEFAULT_PIPELINE_IS_TSL : control.defaultValue
    return values
  }, {})

export { categories }
export type {
  CategoryId,
  ColorControl,
  ControlValue,
  ControlValues,
  EffectCategory,
  EffectControl,
  EffectDefinition,
  RangeControl,
  ToggleControl,
} from './types'
