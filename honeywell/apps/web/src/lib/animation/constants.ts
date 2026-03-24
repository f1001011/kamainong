/**
 * @file 动画常量配置
 * @description "Metropolitan Prestige 2.0" 动画系统 - 沉稳优雅，无回弹
 * 弹簧阻尼偏高(25-30)，消除活泼弹跳感，传递金融级稳重
 */

/**
 * 弹簧动画预设
 * 所有动画必须使用弹簧动画，禁止线性动画
 */
export const SPRINGS = {
  /** 精准 - 按钮点击、开关、微交互 */
  precise: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  /** 优雅 - 页面过渡、卡片入场 */
  elegant: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 28,
    mass: 1,
  },
  /** 从容 - 抽屉、大面积展开 */
  composed: {
    type: 'spring' as const,
    stiffness: 150,
    damping: 25,
    mass: 1,
  },
  /** 环境 - 背景装饰、缓慢浮动 */
  ambient: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
    mass: 1,
  },
  /** 庆祝 - 成功反馈、里程碑 */
  celebration: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 22,
    mass: 1,
  },

  /** @deprecated 使用 precise 替代 */
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  /** @deprecated 使用 elegant 替代 */
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 28,
    mass: 1,
  },
  /** @deprecated 使用 celebration 替代 */
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 22,
    mass: 1,
  },
  /** @deprecated 使用 ambient 替代 */
  slow: {
    type: 'spring' as const,
    stiffness: 80,
    damping: 20,
    mass: 1,
  },
} as const;

/**
 * 持续时间预设（秒）
 */
export const DURATIONS = {
  instant: 0.075,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

/**
 * 缓动函数预设
 */
export const EASINGS = {
  easeOut: [0.16, 1, 0.3, 1],
  easeInOut: [0.65, 0, 0.35, 1],
  bounceOut: [0.34, 1.56, 0.64, 1],
  prestige: [0.25, 0.1, 0.25, 1],
} as const;

/**
 * 列表动画延迟配置
 */
export const STAGGER = {
  fast: 0.05,
  normal: 0.06,
  slow: 0.1,
} as const;

/**
 * 动画距离预设（像素）
 */
export const DISTANCES = {
  tiny: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 32,
} as const;

/**
 * 缩放比例预设
 */
export const SCALES = {
  press: 0.97,
  hover: 1.02,
  pop: 1.05,
  hidden: 0,
  normal: 1,
} as const;

/**
 * 透明度预设
 */
export const OPACITIES = {
  transparent: 0,
  semi: 0.5,
  light: 0.8,
  opaque: 1,
} as const;
