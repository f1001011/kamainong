## Context

Honeywell Web 是一个投资理财平台，前端使用 Vue 3 + TypeScript，后端使用 ThinkPHP 6.0 + MySQL。当前已实现 20 个控制器和 60+ 个接口，但缺乏系统化的技术文档。

**当前状态：**
- 控制器已实现：HoneywellAuth、HoneywellProduct、HoneywellOrder 等 20 个
- 路由已配置：110+ 个 RESTful 路由
- 数据库：kamainong 数据库，30+ 张表
- 认证方式：Token-based（存储在 ntp_common_home_token 表）

**约束：**
- 必须兼容现有数据库结构
- 不能破坏已有接口
- 需要支持法语（喀麦隆地区）

## Goals / Non-Goals

**Goals:**
- 规范化 API 接口设计和文档
- 统一错误处理和响应格式
- 完善数据库操作规范（事务、锁、日志）
- 补充缺失的通知系统表

**Non-Goals:**
- 不重构现有控制器代码
- 不修改数据库表结构（除新增通知表）
- 不改变前端接口调用方式

## Decisions

### 1. 响应格式统一

**决策：** 使用统一的 JSON 响应格式

```json
// 成功
{"success": true, "data": {...}}

// 失败
{"success": false, "error": {"code": "ERROR_CODE", "message": "错误信息"}}
```

**理由：** 前端已按此格式实现，保持一致性

**替代方案：** RESTful 标准格式（使用 HTTP 状态码）- 被拒绝，因为需要修改前端代码

### 2. 认证机制

**决策：** Token-based 认证，Token 存储在数据库

**实现：**
- 登录成功生成 32 位随机 Token
- 存储在 `ntp_common_home_token` 表
- 请求头：`Authorization: Bearer {token}`
- Token 有效期：30 天

**理由：** 简单可靠，支持多端登录管理

**替代方案：** JWT - 被拒绝，因为需要修改现有认证逻辑

### 3. 数据库操作规范

**决策：** 金额变动必须加锁 + 事务 + 日志

**规范：**
```php
// 1. 加锁查询
$user = User::where('id', $userId)->lock(true)->find();

// 2. 开启事务
Db::startTrans();
try {
    // 3. 修改余额
    $user->money += $amount;
    $user->save();
    
    // 4. 记录日志
    User::changeMoney($userId, $type, $moneyType, $amount, $status, $sourceId, $remark);
    
    Db::commit();
} catch (\Exception $e) {
    Db::rollback();
}
```

**理由：** 防止并发问题，确保数据一致性

### 4. 通知系统表结构

**决策：** 新增 `ntp_common_notification` 表

**字段：**
- id, uid, type, title, content, is_read, create_time

**理由：** 当前数据库缺少通知表，需要补充

## Risks / Trade-offs

**风险1：** 并发充值/提现可能导致余额错误
→ **缓解：** 使用数据库行锁 + 事务

**风险2：** Token 泄露风险
→ **缓解：** 使用 HTTPS，Token 定期过期

**风险3：** 大量用户同时领取收益可能导致性能问题
→ **缓解：** 使用队列异步处理（后续优化）

**权衡：** Token 存储在数据库 vs Redis
- 选择数据库：简单可靠，无需额外依赖
- 代价：性能略低，但当前用户量可接受
