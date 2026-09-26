import { categoryById } from './categories'
import { colorControl, rangeControl } from './glsl'
import type { EffectDefinition } from './types'

type ParticleRecipe = {
  id: string
  title: string
  titleJa: string
  description: string
  descriptionJa: string
  accentColor: string
  style: number
  intensity: number
  motion: number
  detail: number
  tags: string[]
}

const category = categoryById.particles

const tslSnippet = (title: string, style: number) => `// ${title}
// TSL / WebGPU particle graph. No GLSL fragment shader is used.
const seedNode = instancedBufferAttribute(seedBuffer, 'vec4')
const timeNode = uniform(0).setName('uTime')
const intensityNode = uniform(${1.0}).setName('uIntensity')
const motionNode = uniform(${1.0}).setName('uMotion')
const detailNode = uniform(${2.0}).setName('uDetail')
const primaryNode = uniform(new Color('uPrimary'))

const particleMaterial = new PointsNodeMaterial()
particleMaterial.positionNode = particlePositionStyle${style}({
  seedNode,
  timeNode,
  intensityNode,
  motionNode,
  detailNode,
})
particleMaterial.sizeNode = particleSizeStyle${style}({ seedNode, intensityNode, detailNode })
particleMaterial.colorNode = particleColorStyle${style}({ seedNode, timeNode, primaryNode })
particleMaterial.opacityNode = radialSpriteAlpha(uv(), seedNode, intensityNode)

const particles = new Sprite(particleMaterial)
particles.count = particleCount
scene.add(particles)
renderer.render(scene, camera)
`

const particleEffect = ({
  id,
  title,
  titleJa,
  description,
  descriptionJa,
  accentColor,
  style,
  intensity,
  motion,
  detail,
  tags,
}: ParticleRecipe): EffectDefinition => ({
  id,
  title,
  titleJa,
  categoryId: 'particles',
  category: category.label,
  description,
  descriptionJa,
  accentColor,
  tags: ['particles', 'tsl', 'webgpu', 'instanced-sprites', `particle-style-${style}`, ...tags],
  renderer: 'tsl-particles',
  codeLanguage: 'tsl',
  fragment: tslSnippet(title, style),
  controls: [
    rangeControl('intensity', 'Intensity / 強度', 'uIntensity', 0.25, 2.5, 0.01, intensity),
    rangeControl('motion', 'Motion / 動き', 'uMotion', 0.05, 2.8, 0.01, motion),
    rangeControl('detail', 'Detail / 密度', 'uDetail', 0.4, 5.0, 0.01, detail),
    colorControl('primary', 'Color / 色', 'uPrimary', accentColor),
  ],
})

export const particleEffects = [
  particleEffect({
    id: 'prism-dust-bloom',
    title: 'Prism Haze Bloom',
    titleJa: 'プリズムヘイズブルーム',
    description: 'TSL particles cut through prism fog with layered halos and clean spectral afterglow.',
    descriptionJa: 'TSL粒子がプリズムフォグを抜け、層状のハローと澄んだ残光を作る。',
    accentColor: '#7dd3fc',
    style: 0,
    intensity: 1.16,
    motion: 0.82,
    detail: 2.35,
    tags: ['prism', 'haze', 'bloom'],
  }),
  particleEffect({
    id: 'orbit-swarm-engine',
    title: 'Orbit Swarm Engine',
    titleJa: '軌道スウォームエンジン',
    description: 'TSL orbit lights circle inside a smoky engine core with luminous orbital trails.',
    descriptionJa: 'TSLの軌道光が煙るエンジン核を回り、明るい軌道残像を重ねる。',
    accentColor: '#a78bfa',
    style: 1,
    intensity: 1.18,
    motion: 1.04,
    detail: 2.65,
    tags: ['orbit', 'swarm', 'engine'],
  }),
  particleEffect({
    id: 'aurora-point-rain',
    title: 'Aurora Glass Rain',
    titleJa: 'オーロラ硝子雨',
    description: 'TSL glass lights fall through aurora fog, leaving vertical luminous rain trails.',
    descriptionJa: 'TSLのガラス光がオーロラフォグを落ち、縦方向の光雨の残像を残す。',
    accentColor: '#34d399',
    style: 2,
    intensity: 1.08,
    motion: 1.2,
    detail: 2.9,
    tags: ['aurora', 'rain', 'curtain'],
  }),
  particleEffect({
    id: 'pixel-comet-field',
    title: 'Pixel Comet Field',
    titleJa: 'ピクセル彗星フィールド',
    description: 'TSL comet lights smear across depth bands with long additive afterimages.',
    descriptionJa: 'TSLの彗星光が奥行き帯を横切り、加算合成の長い残像を引く。',
    accentColor: '#f97316',
    style: 3,
    intensity: 1.22,
    motion: 1.34,
    detail: 2.45,
    tags: ['comet', 'pixel', 'lanes'],
  }),
  particleEffect({
    id: 'magnetic-spark-grid',
    title: 'Magnetic Spark Grid',
    titleJa: '磁場スパークグリッド',
    description: 'TSL magnetic sparks flare inside angled fog planes with electric halo bursts.',
    descriptionJa: 'TSLの磁場スパークが斜めのフォグ面で弾け、電気的なハローを作る。',
    accentColor: '#22d3ee',
    style: 4,
    intensity: 1.12,
    motion: 0.92,
    detail: 3.2,
    tags: ['magnetic', 'grid', 'sparks'],
  }),
  particleEffect({
    id: 'solar-ember-shell',
    title: 'Solar Ember Shell',
    titleJa: '太陽エンバーシェル',
    description: 'TSL ember light expands through heat haze with smoky tails and pulsing depth.',
    descriptionJa: 'TSLのエンバー光が熱気のヘイズを広がり、煙る尾と奥行きの脈動を作る。',
    accentColor: '#ff4d6d',
    style: 5,
    intensity: 1.24,
    motion: 1.08,
    detail: 2.7,
    tags: ['solar', 'ember', 'shell'],
  }),
  particleEffect({
    id: 'data-snowfall',
    title: 'Data Glassfall',
    titleJa: 'データ硝子流',
    description: 'TSL data lights fall through column fog with crisp cyan-magenta afterglow.',
    descriptionJa: 'TSLのデータ光が列状フォグを落ち、シアンとマゼンタの残光を残す。',
    accentColor: '#38bdf8',
    style: 6,
    intensity: 1.02,
    motion: 1.16,
    detail: 3.6,
    tags: ['data', 'glassfall', 'columns'],
  }),
  particleEffect({
    id: 'vortex-pearl-stream',
    title: 'Vortex Pearl Stream',
    titleJa: '渦真珠ストリーム',
    description: 'TSL pearl lights ride a one-way vortex with soft fog beds and depth glints.',
    descriptionJa: 'TSL真珠光が一方向の渦に乗り、柔らかいフォグ層と奥行きの光を作る。',
    accentColor: '#c084fc',
    style: 7,
    intensity: 1.14,
    motion: 0.96,
    detail: 2.55,
    tags: ['vortex', 'pearls', 'stream'],
  }),
]
