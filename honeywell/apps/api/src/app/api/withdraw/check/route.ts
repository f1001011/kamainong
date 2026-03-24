/**
 * @file 提现资格检查接口
 * @description GET /api/withdraw/check - 检查用户是否满足提现条件
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第6.1节 - 检查提现条件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { withdrawService } from '@/services/withdraw.service';

/**
 * 检查提现资格
 * @description 返回用户是否满足提现门槛、可提现金额、限制原因等信息
 * 依据：02.3-前端API接口清单.md 第6.1节
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 调用服务检查提现资格
    const result = await withdrawService.checkWithdrawEligibility(userId);

    // 返回数据（依据：02.3-前端API接口清单.md 第6.1节）
    return successResponse({
      canWithdraw: result.canWithdraw,
      reason: result.reason,
      availableBalance: result.availableBalance,
      feePercent: result.feePercent,
      minAmount: result.minAmount,
      maxAmount: result.maxAmount,
      timeRange: result.timeRange,
      inTimeRange: result.inTimeRange,
      todayCount: result.todayCount,
      dailyLimit: result.dailyLimit,
      quickAmounts: result.quickAmounts,
      tips: result.tips,
    });
  });
}
