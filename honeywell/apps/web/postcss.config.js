/**
 * @file PostCSS 配置
 * @description Tailwind CSS 4.x + 旧浏览器深度兼容管道
 *
 * Tailwind CSS 4 最低目标：Chrome 111+ / Safari 16.4+ / Firefox 128+
 * 本项目兼容目标：Chrome 80+ / iOS Safari 13+ / Android WebView 80+
 *
 * 处理管道（顺序执行）：
 * 1. @tailwindcss/postcss   — Tailwind CSS 4.x 编译（输出含现代 CSS 特性）
 * 2. @csstools/postcss-oklab-function — oklch()/oklab() → rgb()
 * 3. @csstools/postcss-color-mix-function — color-mix() → rgba()
 * 4. postcss-nesting         — CSS 原生嵌套 (&) → 展平为传统选择器
 * 5. postcss-compat-unwrap   — 展开 @layer + 移除 @property
 */
module.exports = {
  plugins: {
    // 步骤1: Tailwind CSS 4.x 编译
    '@tailwindcss/postcss': {},

    // 步骤2: oklch()/oklab() → rgb() 降级
    // 解决 iOS < 15.4 / Chrome < 111 不支持 oklch/oklab 色彩空间
    '@csstools/postcss-oklab-function': {
      preserve: false,
      subFeatures: {
        displayP3: false,
      },
    },

    // 步骤3: color-mix(in srgb, ...) → rgba() 静态值
    // 解决 Chrome < 111 / iOS Safari < 16.2 不支持 color-mix() 函数
    // Tailwind 4 为所有透明度修饰符（bg-white/50 等）生成 color-mix()
    '@csstools/postcss-color-mix-function': {
      preserve: false,
    },

    // 步骤4: CSS 原生嵌套展平
    // 解决 Chrome < 120 / iOS Safari < 17.2 不支持 CSS 嵌套语法（& 选择器）
    // Tailwind 4 输出约 177 处嵌套规则（group-hover、placeholder、last 等）
    'postcss-nesting': {},

    // 步骤5: 展开 @layer + 移除 @property
    // @layer: iOS < 15.4 不支持，会导致整个 CSS 块被忽略
    // @property: Chrome < 85 / Safari < 15.4 / Firefox < 128 不支持
    './postcss-compat-unwrap.cjs': {},
  },
};
