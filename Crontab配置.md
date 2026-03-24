# Honeywell Web Crontab 配置

## 📂 命令文件位置
`D:\phpstudy\jiuge\kamainong\app_api\app\command\`

## 📋 创建的命令列表

| 命令名称 | 功能 | 执行频率 |
|---------|------|---------|
| cron:update_income_status | 生成次日收益记录 | 每天23:00 |
| cron:generate_today_income | 生成当日收益记录 | 每天00:05 |
| cron:expire_income | 处理过期收益 | 每分钟 |
| cron:prize_pool | 奖池开奖 | 每天05:00 |
| cron:reset_vip_reward | 重置VIP每日奖励 | 每天00:00 |
| cron:reset_lottery | 重置转盘次数 | 每天00:00 |
| cron:reset_tasks | 重置任务进度 | 每周一00:00 |
| cron:reset_salary | 重置月薪奖励 | 每月1日00:00 |

## 🔧 Crontab 配置

编辑 crontab：
```bash
crontab -e
```

添加以下配置：

```bash
# 每天23:00 - 生成次日收益记录（针对23点之前购买的）
0 23 * * * cd /path/to/app_api && php think cron:update_income_status >> /path/to/runtime/log/income_status.log 2>&1

# 每天00:05 - 生成当日收益记录（针对23-24点购买的）
5 0 * * * cd /path/to/app_api && php think cron:generate_today_income >> /path/to/runtime/log/today_income.log 2>&1

# 每分钟 - 处理过期收益
*/1 * * * * cd /path/to/app_api && php think cron:expire_income >> /path/to/runtime/log/expire_income.log 2>&1

# 每天05:00 - 奖池开奖
0 5 * * * cd /path/to/app_api && php think cron:prize_pool >> /path/to/runtime/log/prize_pool.log 2>&1

# 每天00:00 - VIP奖励重置
0 0 * * * cd /path/to/app_api && php think cron:reset_vip_reward >> /path/to/runtime/log/reset_vip.log 2>&1

# 每天00:00 - 转盘次数重置
0 0 * * * cd /path/to/app_api && php think cron:reset_lottery >> /path/to/runtime/log/reset_lottery.log 2>&1

# 每周一00:00 - 任务进度重置
0 0 * * 1 cd /path/to/app_api && php think cron:reset_tasks >> /path/to/runtime/log/reset_tasks.log 2>&1

# 每月1日00:00 - 月薪重置
0 0 1 * * cd /path/to/app_api && php think cron:reset_salary >> /path/to/runtime/log/reset_salary.log 2>&1
```

## ✅ 验证命令

测试单个命令：
```bash
cd /path/to/app_api
php think cron:update_income_status
php think cron:generate_today_income
php think cron:expire_income
php think cron:prize_pool
php think cron:reset_vip_reward
php think cron:reset_lottery
php think cron:reset_tasks
php think cron:reset_salary
```

查看命令列表：
```bash
php think list
```

## ⚠️ 注意事项

1. **时区设置**：确保服务器时区为 UTC+1（喀麦隆时区）
2. **路径修改**：将 `/path/to/app_api` 替换为实际路径
3. **日志目录**：确保 `runtime/log/` 目录存在且可写
4. **权限**：确保 php 和目录有执行权限
