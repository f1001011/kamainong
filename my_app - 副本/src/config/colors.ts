// ── 全局主色调配置 ─────────────────────────────────────────────────────────
// 撞色方案：红 × 青 × 琥珀 × 荧光绿，背景深海军蓝
// 其他页面直接 import { colors } from '@/config/colors'

export const colors = {
  // ── 背景 ──────────────────────────────────────────────────────────────────
  bg:          '#080c18',                  // 深海军蓝（比纯黑更有色彩感）
  bgCard:      'rgba(255,255,255,0.07)',
  bgCardHover: 'rgba(255,255,255,0.11)',
  navBg:       'rgba(8,12,24,0.72)',       // 底部导航栏背景

  // ── 浮动光球（提高不透明度，让页面更靓丽）────────────────────────────────
  orbRed:   'rgba(255,77,77,0.38)',
  orbCyan:  'rgba(0,229,255,0.30)',
  orbAmber: 'rgba(255,184,0,0.26)',

  // ── 撞色主调 ──────────────────────────────────────────────────────────────
  red:       '#ff4d4d',
  redDark:   '#ff1744',
  redGlow:   'rgba(255,77,77,0.55)',

  cyan:      '#00e5ff',
  cyanDark:  '#00b0ff',
  cyanGlow:  'rgba(0,229,255,0.55)',

  amber:     '#ffb800',
  amberDark: '#ff6d00',
  amberGlow: 'rgba(255,184,0,0.55)',

  lime:      '#69ff47',
  limeDark:  '#00e676',
  limeGlow:  'rgba(105,255,71,0.55)',

  // ── 文字 ──────────────────────────────────────────────────────────────────
  textPrimary:   'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.35)',

  // ── 边框 ──────────────────────────────────────────────────────────────────
  border:      'rgba(255,255,255,0.13)',
  borderLight: 'rgba(255,255,255,0.18)',

  // ── 渐变 ──────────────────────────────────────────────────────────────────
  gradients: {
    deposit:  'linear-gradient(135deg, #ff4d4d, #ff1744)',
    withdraw: 'linear-gradient(135deg, #00e5ff, #00b0ff)',
    transfer: 'linear-gradient(135deg, #ffb800, #ff6d00)',
    history:  'linear-gradient(135deg, #69ff47, #00e676)',
    heroBar:  'linear-gradient(90deg, #ff4d4d 0%, #00e5ff 50%, #ffb800 100%)',
  },

  // ── 语义色 ────────────────────────────────────────────────────────────────
  income:  '#00e5ff',
  expense: '#ff4d4d',
  frozen:  '#ffb800',
  success: '#69ff47',
} as const

export type AppColors = typeof colors

// ── CSS 变量映射（由 useTheme 注入到 :root）──────────────────────────────────
export const cssVarMap: Record<string, string> = {
  '--bg-base':        colors.bg,
  '--bg-card':        colors.bgCard,
  '--bg-card-hover':  colors.bgCardHover,
  '--nav-bg':         colors.navBg,
  '--orb-red':        colors.orbRed,
  '--orb-cyan':       colors.orbCyan,
  '--orb-amber':      colors.orbAmber,
  '--color-red':      colors.red,
  '--color-cyan':     colors.cyan,
  '--color-amber':    colors.amber,
  '--color-lime':     colors.lime,
  '--text-primary':   colors.textPrimary,
  '--text-secondary': colors.textSecondary,
  '--text-muted':     colors.textMuted,
  '--border':         colors.border,
  '--border-light':   colors.borderLight,
}
