## Context

my_app_v1 是一个基于 Vue 3 + TypeScript + Vite 的投资平台前端项目。当前已有基础框架（路由、国际化、HTTP 请求），但缺少业务页面实现。设计图包含 26 张 PC 和 H5 页面，需要实现完整的前端应用。

## Goals / Non-Goals

**Goals:**
- 实现所有 13 个核心页面组件
- 配置完整路由系统（公开/认证路由）
- 支持三语言切换（中文/英文/法文）
- PC 和 H5 响应式布局
- 创建可复用的公共组件

**Non-Goals:**
- 后端 API 实现
- 真实支付集成
- 复杂动画效果
- 单元测试

## Decisions

**1. 组件结构：单文件组件 (SFC)**
- 使用 Vue 3 Composition API
- 每个页面独立的 .vue 文件
- 样式采用 scoped CSS

**2. 路由策略：懒加载**
- 使用 `() => import()` 动态导入
- 按需加载减少初始包体积
- 区分公开路由和认证路由

**3. 响应式方案：CSS Media Query**
- 使用 `@media (max-width: 768px)` 断点
- 移动端优先的布局调整
- 避免引入额外 UI 框架

**4. 状态管理：组合式函数**
- 使用 composables 和 hooks
- 轻量级状态管理，无需 Vuex/Pinia
- 认证状态存储在 localStorage

## Risks / Trade-offs

**[风险] 设计图无法直接读取** → 根据文件名和常见业务逻辑实现基础版本
**[风险] 样式可能与设计图不完全一致** → 提供可调整的基础布局
**[权衡] 无 UI 框架** → 减少依赖但需手写更多样式
