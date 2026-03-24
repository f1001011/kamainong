/**
 * @file Vitest 配置文件
 * @description 共享工具函数模块的单元测试配置
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 测试环境
    environment: 'node',
    
    // 测试文件匹配规则
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    
    // 排除目录
    exclude: ['node_modules', 'dist'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts', 'src/index.ts'],
    },
    
    // 全局设置
    globals: true,
    
    // 超时时间
    testTimeout: 10000,
  },
});
