# Honeywell API 接口开发任务清单

## 📊 完成情况总览

**总计**: 18个模块，60个接口 - 全部完成 ✅

---

## ✅ 已完成模块

| 模块 | 控制器 | 接口数 | 状态 |
|------|--------|--------|------|
| 1. 认证模块 | Honeywell.php | 3 | ✅ |
| 2. 配置模块 | HoneywellConfig.php | 1 | ✅ |
| 3. 产品模块 | HoneywellProduct.php | 1 | ✅ |
| 4. 订单/持仓模块 | HoneywellOrder.php | 5 | ✅ |
| 5. 充值模块 | HoneywellRecharge.php | 4 | ✅ |
| 6. 提现模块 | HoneywellWithdraw.php | 4 | ✅ |
| 7. 交易记录模块 | HoneywellTransaction.php | 1 | ✅ |
| 8. 团队模块 | HoneywellTeam.php | 4 | ✅ |
| 9. 签到模块 | HoneywellSignin.php | 3 | ✅ |
| 10. VIP模块 | HoneywellVip.php | 3 | ✅ |
| 11. 任务模块 | HoneywellTask.php | 4 | ✅ |
| 12. 月薪模块 | HoneywellSalary.php | 2 | ✅ |
| 13. 奖池模块 | HoneywellPrize.php | 2 | ✅ |
| 14. 转盘模块 | HoneywellLottery.php | 3 | ✅ |
| 15. 社区模块 | HoneywellCommunity.php | 7 | ✅ |
| 16. 礼品码模块 | HoneywellGift.php | 2 | ✅ |
| 17. 通知模块 | HoneywellNotification.php | 5 | ✅ |
| 18. 其他模块 | HoneywellOther.php | 4 | ✅ |

---

## 📝 接口列表

### P0 - 核心功能

#### 1. 认证模块
- `POST /api/honeywell/login` - 用户登录
- `POST /api/honeywell/register` - 用户注册
- `GET /api/honeywell/user_profile` - 获取用户信息

#### 2. 配置模块
- `GET /api/honeywell/config/global` - 全局配置

#### 3. 产品模块
- `GET /api/honeywell/product/list` - 产品列表

#### 4. 订单/持仓模块
- `GET /api/honeywell/order/positions` - 持仓列表
- `GET /api/honeywell/order/detail` - 持仓详情
- `GET /api/honeywell/order/incomes` - 收益记录
- `POST /api/honeywell/order/claim` - 领取收益
- `POST /api/honeywell/order/buy` - 购买产品

#### 5. 充值模块
- `GET /api/honeywell/recharge/records` - 充值订单列表
- `GET /api/honeywell/recharge/detail` - 充值订单详情
- `POST /api/honeywell/recharge/create` - 创建充值订单
- `POST /api/honeywell/recharge/cancel` - 取消充值订单

#### 6. 提现模块
- `GET /api/honeywell/withdraw/records` - 提现订单列表
- `GET /api/honeywell/withdraw/detail` - 提现订单详情
- `POST /api/honeywell/withdraw/create` - 创建提现订单
- `GET /api/honeywell/withdraw/can_withdraw` - 检查提现权限

#### 7. 交易记录模块
- `GET /api/honeywell/transaction/list` - 交易记录列表

---

### P1 - 重要功能

#### 8. 团队模块
- `GET /api/honeywell/team/stats` - 团队统计
- `GET /api/honeywell/team/members` - 团队成员列表
- `GET /api/honeywell/team/commissions` - 返佣记录
- `GET /api/honeywell/team/invite_info` - 邀请信息

#### 9. 签到模块
- `GET /api/honeywell/signin/status` - 签到状态
- `POST /api/honeywell/signin/sign` - 执行签到
- `GET /api/honeywell/signin/records` - 签到记录

#### 10. VIP模块
- `GET /api/honeywell/vip/status` - VIP状态
- `POST /api/honeywell/vip/claim` - 领取VIP奖励
- `GET /api/honeywell/vip/rewards` - VIP奖励记录

#### 11. 任务模块
- `GET /api/honeywell/task/invite` - 邀请任务数据
- `POST /api/honeywell/task/claim_invite` - 领取邀请奖励
- `GET /api/honeywell/task/collection` - 集卡任务数据
- `POST /api/honeywell/task/claim_collection` - 领取集卡奖励

---

### P2 - 次要功能

#### 12. 月薪模块
- `GET /api/honeywell/salary/status` - 月薪状态
- `POST /api/honeywell/salary/claim` - 领取月薪

#### 13. 奖池模块
- `GET /api/honeywell/prize/status` - 奖池状态
- `POST /api/honeywell/prize/claim` - 领取奖池奖励

#### 14. 转盘模块
- `GET /api/honeywell/lottery/status` - 转盘状态
- `GET /api/honeywell/lottery/prizes` - 奖品列表
- `POST /api/honeywell/lottery/spin` - 执行抽奖

#### 15. 社区模块
- `GET /api/honeywell/community/posts` - 帖子列表
- `GET /api/honeywell/community/my_posts` - 我的帖子
- `GET /api/honeywell/community/detail` - 帖子详情
- `POST /api/honeywell/community/like` - 点赞
- `POST /api/honeywell/community/comment` - 评论
- `POST /api/honeywell/community/create` - 创建帖子
- `GET /api/honeywell/community/completed_withdraws` - 已完成提现列表

#### 16. 礼品码模块
- `POST /api/honeywell/gift/redeem` - 兑换礼品码
- `GET /api/honeywell/gift/history` - 兑换记录

---

### P3 - 辅助功能

#### 17. 通知模块
- `GET /api/honeywell/notification/list` - 通知列表
- `GET /api/honeywell/notification/detail` - 通知详情
- `GET /api/honeywell/notification/unread_count` - 未读数量
- `POST /api/honeywell/notification/read` - 标记已读
- `POST /api/honeywell/notification/read_all` - 全部已读

#### 18. 其他模块
- `GET /api/honeywell/other/banners` - 轮播图
- `GET /api/honeywell/other/announcements` - 公告列表
- `GET /api/honeywell/other/about_us` - 关于我们
- `GET /api/honeywell/other/service_links` - 客服链接

---

## 🔧 开发规范

### 统一响应格式

**成功响应:**
```json
{
  "success": true,
  "data": { ... }
}
```

**失败响应:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
```

### 关键规范

1. **金额变动必须加锁**: `User::where('id', $userId)->lock(true)->find()`
2. **使用事务处理**: `Db::startTrans()` / `Db::commit()` / `Db::rollback()`
3. **记录资金流水**: `User::changeMoney($userId, $type, $moneyType, $amount, $status, $sourceId, $remark)`
4. **认证检查**: 通过 `Authorization: Bearer {token}` 验证用户身份

---

## 📂 文件结构

```
app_api/
├── app/controller/
│   ├── Honeywell.php              # 认证
│   ├── HoneywellConfig.php        # 配置
│   ├── HoneywellProduct.php       # 产品
│   ├── HoneywellOrder.php         # 订单
│   ├── HoneywellRecharge.php      # 充值
│   ├── HoneywellWithdraw.php      # 提现
│   ├── HoneywellTransaction.php   # 交易记录
│   ├── HoneywellTeam.php          # 团队
│   ├── HoneywellSignin.php        # 签到
│   ├── HoneywellVip.php           # VIP
│   ├── HoneywellTask.php          # 任务
│   ├── HoneywellSalary.php        # 月薪
│   ├── HoneywellPrize.php         # 奖池
│   ├── HoneywellLottery.php       # 转盘
│   ├── HoneywellCommunity.php     # 社区
│   ├── HoneywellGift.php          # 礼品码
│   ├── HoneywellNotification.php  # 通知
│   └── HoneywellOther.php         # 其他
└── route/
    └── app.php                     # 路由配置
```
