/**
 * @file 签到窗口期过期任务
 * @description 标记注册超7天未完成3天签到的普通用户，窗口期过期
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.3节 - 签到窗口过期任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.1节 - User表 signInWindowStart 字段
 * @depends 开发文档/开发文档.md 第9节 - 普通用户签到规则
 * 
 * 核心规则：
 * 1. 扫描 signInWindowExpired = false 且 signInCompleted = false 的用户
 * 2. 检查 signInWindowStart < NOW() - 7天
 * 3. 排除 SVIP 用户（SVIP可长期签到）
 * 4. 批量标记 signInWindowExpired = true
 */

import { prisma } from '@/lib/prisma';
import { getConfig } from '@/lib/config';
import type { TaskResult } from '@/lib/task-lock';

/**
 * 签到窗口过期任务结果
 */
export interface SigninWindowExpireResult extends TaskResult {
  processedCount: number;
}

/**
 * 签到窗口期过期检查任务
 * 
 * @description 依据：05.3-定时任务.md 第2.3节
 * 
 * 处理流程：
 * 1. 从配置获取签到窗口天数（默认7天）
 * 2. 计算过期日期阈值
 * 3. 查找需要标记过期的用户：
 *    - signInWindowExpired = false（未过期）
 *    - signInCompleted = false（未完成签到）
 *    - signInWindowStart < 过期日期阈值
 *    - svipLevel = 0（非SVIP用户）
 * 4. 批量更新 signInWindowExpired = true
 * 
 * @returns 处理结果统计
 */
export async function runSigninWindowExpireJob(): Promise<SigninWindowExpireResult> {
  const now = new Date();
  
  // 从配置获取签到窗口天数（禁止硬编码）
  // 依据：02.1-数据库设计.md 第2.13节 - Activity表 NORMAL_SIGNIN 活动配置
  const windowDays = await getConfig('signinWindowDays', 7);
  
  // 计算过期日期阈值（当前时间 - 窗口天数）
  const expireDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  
  console.log(`[SigninWindowExpire] 签到窗口天数: ${windowDays}, 过期阈值: ${expireDate.toISOString()}`);

  // 查找并更新需要标记过期的用户
  // 依据：02.1-数据库设计.md 第2.1节 - signInWindowStart 索引用于签到窗口期过期定时任务
  const result = await prisma.user.updateMany({
    where: {
      signInWindowExpired: false,             // 未过期
      signInCompleted: false,                 // 未完成签到任务
      signInWindowStart: { 
        lt: expireDate,                       // 窗口开始时间 < 过期阈值
        not: null,                            // 有签到窗口开始时间
      },
      svipLevel: 0,                           // 非SVIP用户（SVIP可长期签到）
    },
    data: {
      signInWindowExpired: true,
    },
  });

  console.log(`[SigninWindowExpire] 已标记 ${result.count} 个用户签到窗口期过期`);

  return { processedCount: result.count };
}
