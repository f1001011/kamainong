## Why

基于"页面"目录下的 26 张设计图，my_app_v1 项目需要完整实现所有前端页面。当前项目只有基础框架（Vue 3 + TypeScript + Vite），缺少实际的业务页面。需要补全所有页面组件、路由配置、国际化文本和公共组件，以完成整个前端应用。

## What Changes

- 创建 13 个核心页面组件（首页、个人中心、投资、团队、VIP活动等）
- 配置完整的路由系统（公开路由 + 认证路由）
- 补全三语言国际化文本（中文、英文、法文）
- 实现 PC/H5 响应式布局
- 创建公共组件（弹窗、卡片等）
- 添加组合式函数和钩子（usePopup, useAuth）

## Capabilities

### New Capabilities
- `page-components`: 所有业务页面组件的实现
- `routing-system`: 完整的路由配置和权限控制
- `i18n-content`: 三语言国际化文本
- `responsive-layout`: PC和H5自适应布局
- `shared-components`: 公共组件和工具函数

### Modified Capabilities
<!-- 无现有功能需要修改 -->

## Impact

- 影响文件：src/views/*, src/router/index.ts, src/locales/*, src/components/*, src/composables/*, src/hooks/*
- 新增 13 个页面组件
- 新增 9 个路由配置
- 新增 3 个语言包文件
- 新增全局样式文件
