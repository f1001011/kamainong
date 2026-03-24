## Why

Honeywell Web 前端项目需要完整的后端 API 支持。当前已有 60+ 个接口的实现代码，但缺乏系统化的文档和规范。需要通过 OpenSpec 规范化接口设计，确保前后端对接顺利，并为后续维护提供清晰的技术文档。

## What Changes

- 规范化 18 个功能模块的 API 接口设计
- 完善接口文档（请求/响应格式、错误处理）
- 统一认证机制（Token-based）
- 标准化数据库操作规范（事务、锁、日志）
- 补充缺失的通知系统数据库表

## Capabilities

### New Capabilities
- `auth-system`: 用户认证与授权（登录、注册、Token管理）
- `product-management`: 产品管理（Revenu fixe + Periodic 系列）
- `order-system`: 订单与持仓管理（购买、收益领取）
- `payment-system`: 充值提现系统（创建订单、查询记录）
- `vip-system`: VIP等级与每日奖励
- `team-system`: 团队管理与返佣
- `task-system`: 任务系统（邀请任务、集卡任务）
- `lottery-system`: 转盘抽奖
- `prize-pool`: 奖池活动
- `salary-system`: 月薪/周薪奖励
- `signin-system`: 签到系统
- `community-system`: 社区功能（帖子、点赞、评论）
- `gift-code`: 礼品码兑换
- `notification-system`: 通知系统
- `config-system`: 系统配置管理

### Modified Capabilities
<!-- 无现有功能需要修改 -->

## Impact

**影响范围：**
- 后端：`app_api/app/controller/Honeywell*.php`（20个控制器）
- 路由：`app_api/route/app.php`（110+ 路由）
- 数据库：需补充通知系统表 `ntp_common_notification`
- 前端：`honeywell/apps/web` 需要对接这些接口

**依赖系统：**
- ThinkPHP 6.0 框架
- MySQL 数据库（kamainong 数据库）
- Token 认证中间件
