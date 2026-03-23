# AVIVA 喀麦隆投资系统 - API接口文档

## 已完成的API接口

### 1. 用户认证 (Auth.php)
- POST /api/auth/login - 登录
- POST /api/auth/register - 注册

### 2. 用户管理 (User.php) ✨新建
- GET /api/user/info - 获取用户信息
- GET /api/user/balance - 获取余额
- POST /api/user/changePassword - 修改密码

### 3. 产品管理 (Product.php)
- GET /api/product/list - 产品列表
- GET /api/product/detail - 产品详情

### 4. 订单管理 (Order.php)
- POST /api/order/buy - 购买产品
- GET /api/order/myOrders - 我的订单列表 ✨新增
- GET /api/order/detail - 订单详情 ✨新增

### 5. 收益管理 (Income.php) ✨新建
- GET /api/income/list - 收益记录列表
- GET /api/income/available - 可领取收益
- POST /api/income/claim - 领取收益


### 6. VIP管理 (Vip.php) ✨新建
- GET /api/vip/config - VIP配置列表
- GET /api/vip/checkUpgrade - 检测VIP升级
- POST /api/vip/dailyReward - VIP每日奖励领取

### 7. 月薪奖励 (Salary.php) ✨新建
- GET /api/salary/config - 月薪配置
- POST /api/salary/claim - 领取月薪

### 8. 代理系统 (Agent.php) ✨新建
- GET /api/agent/config - 代理级别配置
- GET /api/agent/myTeam - 我的团队

### 9. 奖池活动 (Prize.php) ✨新建
- GET /api/prize/config - 奖池配置
- GET /api/prize/todayRank - 今日排名
- GET /api/prize/winners - 获奖记录

---

## 接口总计

**已完成**: 23个API接口
**控制器**: 9个

所有核心功能API已完成！
