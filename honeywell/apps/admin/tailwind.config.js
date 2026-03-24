/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 后台主题色
        primary: {
          DEFAULT: '#1890ff',
          50: '#e6f7ff',
          100: '#bae7ff',
          200: '#91d5ff',
          300: '#69c0ff',
          400: '#40a9ff',
          500: '#1890ff',
          600: '#096dd9',
          700: '#0050b3',
          800: '#003a8c',
          900: '#002766',
        },
      },
      // 响应式断点配置（依据：开发文档.md 第13.0.2节）
      screens: {
        'sm': '576px',
        'md': '768px',
        'lg': '992px',
        'xl': '1200px',
        '2xl': '1600px',
      },
    },
  },
  plugins: [],
  // 禁用 preflight，避免与 Ant Design 样式冲突
  corePlugins: {
    preflight: false,
  },
};
