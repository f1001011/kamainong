/**
 * @file Vitest 配置文件
 * @description API 服务单元测试配置
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',

    // 测试文件匹配规则
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],

    // 排除目录
    exclude: ['node_modules', '.next'],

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/app/**/*.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/page.tsx',
      ],
    },

    // 全局设置
    globals: true,

    // 超时时间
    testTimeout: 10000,

    // 路径别名
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
