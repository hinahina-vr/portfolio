import type { EffectCategory } from './types'

export const categories = [
  {
    id: 'materials-surfaces',
    label: 'Materials',
    labelJa: '質感',
    description: 'Procedural material studies for reflective and tactile looks.',
  },
  {
    id: 'game-vfx',
    label: 'Game VFX',
    labelJa: 'ゲーム',
    description: 'Readable combat, reward, and action feedback shaders.',
  },
  {
    id: 'aquatic',
    label: 'Aquatic',
    labelJa: '水中',
    description: 'Water, bubbles, fish, reefs, currents, and undersea light.',
  },
  {
    id: 'fire-smoke',
    label: 'Fire',
    labelJa: '炎・煙',
    description: 'Heat, flame, ash, soot, lava, and smoky motion.',
  },
  {
    id: 'energy-magic',
    label: 'Magic',
    labelJa: '魔法・光',
    description: 'Sigils, plasma, glyphs, aura fields, and spell energy.',
  },
  {
    id: 'space',
    label: 'Space',
    labelJa: '宇宙',
    description: 'Stars, nebulae, cosmic dust, gravity, and orbital motifs.',
  },
  {
    id: 'nature-weather',
    label: 'Nature',
    labelJa: '自然',
    description: 'Rain, snow, mist, wind, leaves, frost, and sunlight.',
  },
  {
    id: 'geometry-abstract',
    label: 'Abstract',
    labelJa: '幾何',
    description: 'Tiling, folds, moire, contours, Voronoi, and optical forms.',
  },
  {
    id: 'motion-tunnels',
    label: 'Motion',
    labelJa: '動き',
    description: 'Speed, radial depth, tunnels, spirals, and flow corridors.',
  },
  {
    id: 'post-fx',
    label: 'Post FX',
    labelJa: 'ポストFX',
    description: 'Screen-space glitch, scanlines, bloom, tearing, and lenses.',
  },
  {
    id: 'particles',
    label: 'Particles',
    labelJa: 'パーティクル',
    description: 'TSL/WebGPU particle studies with instanced sprite fields and node-driven motion.',
  },
  {
    id: 'liquid',
    label: 'Liquid',
    labelJa: '液体',
    description: 'GPU fluid canvases with liquid surfaces, currents, droplets, and particles.',
  },
  {
    id: 'interactive',
    label: 'Interactive',
    labelJa: 'インタラクティブ',
    description: 'Camera, hand, pointer, and gesture-driven shader studies.',
  },
] as const satisfies readonly EffectCategory[]

export const categoryById = Object.fromEntries(
  categories.map((category) => [category.id, category]),
) as Record<(typeof categories)[number]['id'], EffectCategory>
