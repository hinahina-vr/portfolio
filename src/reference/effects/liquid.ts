import { makeEffect, rangeControl } from './glsl'

type LiquidRecipe = {
  id: string
  title: string
  titleJa: string
  description: string
  descriptionJa: string
  accentColor: string
  style: number
  field: string
  intensity: number
  motion: number
  detail: number
  particles?: number
  tags: string[]
}

const particleControl = (defaultValue: number) =>
  rangeControl('particles', 'Particles / 粒子', 'uParticles', 0, 2, 0.01, defaultValue)

const liquidEffect = ({
  id,
  title,
  titleJa,
  description,
  descriptionJa,
  accentColor,
  style,
  field,
  intensity,
  motion,
  detail,
  particles = 1,
  tags,
}: LiquidRecipe) =>
  makeEffect({
    id,
    title,
    titleJa,
    categoryId: 'liquid',
    description,
    descriptionJa,
    accentColor,
    tags: ['liquid', 'three-fluid-fx', 'gpgpu-particles', `fluid-style-${style}`, ...tags],
    renderer: 'three-fluid',
    extraControls: [particleControl(particles)],
    field,
    warp: 'p *= 1.0;',
    color: `vec3(0.004, 0.007, 0.012) + uPrimary * shade * 0.36`,
    post: `
color += vec3(0.04, 0.18, 0.22) * pow(clamp(shade, 0.0, 1.0), 1.8) * 0.2;
color = min(color, vec3(0.88, 0.95, 0.98));
`,
    intensity,
    motion,
    detail,
  })

export const liquidEffects = [
  liquidEffect({
    id: 'chrome-shear-sheet',
    title: 'Chrome Shear Sheet',
    titleJa: 'クローム剪断膜',
    description: 'A broad liquid-metal sheet that folds in one direction without mesh or bead motifs.',
    descriptionJa: '網目やビーズに頼らず、一方向に折れる広い液体金属膜。',
    accentColor: '#8eeaff',
    style: 0,
    intensity: 1.08,
    motion: 0.94,
    detail: 1.85,
    particles: 0.32,
    tags: ['chrome', 'sheet', 'shear'],
    field: `
vec2 q = p;
q.x -= t * 0.1;
float warp = fbm(q * vec2(1.2, 1.8) + vec2(0.0, t * 0.02));
float sheet = sin((q.y + warp * 0.18) * 3.8 + q.x * 1.1);
v += (1.0 - smoothstep(0.12, 0.86, abs(sheet))) * 0.76;
`,
  }),
  liquidEffect({
    id: 'neon-ink-plume',
    title: 'Neon Ink Plume',
    titleJa: 'ネオンインク煙流',
    description: 'Soft ink plumes with glowing liquid vapor, avoiding vein grids and hard branches.',
    descriptionJa: '硬い枝分かれや格子ではなく、柔らかい煙流として光るインク液体。',
    accentColor: '#00e5ff',
    style: 1,
    intensity: 1.12,
    motion: 1.02,
    detail: 2.2,
    particles: 0.3,
    tags: ['ink', 'plume', 'vapor'],
    field: `
vec2 q = p;
q.x -= t * 0.08;
float plume = fbm(q * vec2(1.5, 2.3) + vec2(0.0, t * 0.03));
float channel = sin((q.y + plume * 0.32) * 4.2 + q.x * 0.8);
v += smoothstep(0.34, 0.94, plume) * 0.52 + (1.0 - smoothstep(0.16, 0.78, abs(channel))) * 0.42;
`,
  }),
  liquidEffect({
    id: 'prism-oil-film',
    title: 'Prism Oil Film',
    titleJa: 'プリズム油膜',
    description: 'A smooth iridescent oil film built from broad waves, not cellular net patterns.',
    descriptionJa: 'セル状の網ではなく、広い波面で構成した滑らかな玉虫色の油膜。',
    accentColor: '#ff4fd8',
    style: 2,
    intensity: 1.16,
    motion: 0.72,
    detail: 2.05,
    particles: 0.28,
    tags: ['oil', 'iridescent', 'film'],
    field: `
vec2 q = p;
q.x -= t * 0.035;
float film = fbm(q * vec2(1.2, 1.8) + vec2(t * 0.01, 2.0));
float wave = sin((q.x + film * 0.28) * 4.2 + q.y * 1.15);
v += (1.0 - smoothstep(0.22, 0.9, abs(wave))) * 0.68 + film * 0.16;
`,
  }),
  liquidEffect({
    id: 'resin-ribbon-fold',
    title: 'Resin Ribbon Fold',
    titleJa: '樹脂リボン折り',
    description: 'Slow translucent resin moving as large layered ribbons with minimal suspended specks.',
    descriptionJa: '大きな層状リボンとして流れる透明樹脂。浮遊粒子は最小限。',
    accentColor: '#ff7ad9',
    style: 3,
    intensity: 1.08,
    motion: 0.58,
    detail: 2.2,
    particles: 0.26,
    tags: ['resin', 'ribbon', 'translucent'],
    field: `
vec2 q = p;
q.x -= t * 0.06;
float fold = sin((q.y + fbm(q * 1.1 + t * 0.015) * 0.28) * 3.0 + q.x * 0.45);
v += (1.0 - smoothstep(0.1, 0.82, abs(fold))) * 0.76;
`,
  }),
  liquidEffect({
    id: 'plasma-gel-tide',
    title: 'Plasma Gel Tide',
    titleJa: 'プラズマゲル潮流',
    description: 'Elastic gel swelling like a luminous tide, without round bead particles.',
    descriptionJa: '丸い粒ではなく、光る潮流のように膨らむ弾性ゲル。',
    accentColor: '#ff3d81',
    style: 4,
    intensity: 1.22,
    motion: 1.08,
    detail: 2.05,
    particles: 0.3,
    tags: ['gel', 'plasma', 'tide'],
    field: `
vec2 q = p;
q.x -= t * 0.09;
float gel = fbm(q * 1.45 + vec2(t * 0.04, 0.0));
float tide = sin(q.x * 1.8 + q.y * 2.4 + gel * 4.4 + t * 0.16);
v += smoothstep(0.36, 0.9, gel + tide * 0.12) * 0.84;
`,
  }),
  liquidEffect({
    id: 'pressure-curtain',
    title: 'Pressure Curtain',
    titleJa: '圧力カーテン',
    description: 'Pressurized liquid falling as soft vertical curtains instead of jagged streak grids.',
    descriptionJa: 'ギザギザの筋格子ではなく、柔らかい縦カーテンとして落ちる圧力液体。',
    accentColor: '#00d5ff',
    style: 5,
    intensity: 1.12,
    motion: 1.0,
    detail: 2.4,
    particles: 0.28,
    tags: ['pressure', 'curtain', 'mist'],
    field: `
vec2 q = p;
q.y += t * 0.1;
float curtain = fbm(q * vec2(2.1, 5.8) + vec2(-t * 0.04, 0.0));
float mist = fbm(q * vec2(0.9, 10.0) + vec2(3.0, t * 0.1));
v += smoothstep(0.44, 0.92, curtain) * 0.58 + smoothstep(0.58, 1.0, mist) * 0.24;
`,
  }),
  liquidEffect({
    id: 'magnetic-tide',
    title: 'Magnetic Tide',
    titleJa: '磁性潮流',
    description: 'Dark magnetic liquid organized into smooth tide bands, not lattice meshes.',
    descriptionJa: '格子メッシュではなく、滑らかな潮汐帯として揃う黒い磁性流体。',
    accentColor: '#7c3cff',
    style: 6,
    intensity: 1.14,
    motion: 0.82,
    detail: 2.3,
    particles: 0.24,
    tags: ['magnetic', 'tide', 'bands'],
    field: `
vec2 q = p;
q.x -= t * 0.035;
float warp = fbm(q * 1.4 + vec2(0.0, t * 0.018));
float band = sin((q.y + warp * 0.22) * 4.2 + q.x * 0.92);
v += (1.0 - smoothstep(0.12, 0.86, abs(band))) * 0.76;
`,
  }),
  liquidEffect({
    id: 'glass-syrup-lens',
    title: 'Glass Syrup Lens',
    titleJa: 'ガラスシロップレンズ',
    description: 'Thick glass syrup forming broad lens sheets with restrained caustic highlights.',
    descriptionJa: '厚いガラス状シロップが広いレンズ膜になり、控えめな集光だけを残す。',
    accentColor: '#2dd4ff',
    style: 7,
    intensity: 1.0,
    motion: 0.52,
    detail: 1.9,
    particles: 0.22,
    tags: ['glass', 'syrup', 'lens'],
    field: `
vec2 q = p;
q.x -= t * 0.02;
float lens = fbm(q * 0.95 + vec2(0.0, t * 0.008));
float pane = sin((q.x + lens * 0.16) * 3.2 + q.y * 0.6);
v += (1.0 - smoothstep(0.16, 0.92, abs(pane))) * 0.62 + lens * 0.14;
`,
  }),
]
