/**
 * @file 实时交易监控接口
 * @description GET /api/admin/realtime/transactions
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22.3节
 *
 * 查询参数：
 * - limit: 返回最近N条交易记录（默认50）
 *
 * 返回数据：
 * - summary: 最近5分钟交易汇总
 *   - last5MinRecharge: 最近5分钟充值金额
 *   - last5MinWithdraw: 最近5分钟提现金额
 *   - last5MinPurchase: 最近5分钟购买金额
 * - recentRecharges: 最近充值订单列表
 * - recentWithdraws: 最近提现订单列表
 * - recentPurchases: 最近购买订单列表
 *
 * 缓存策略：不缓存，支持10-30秒轮询
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getTransactionsMonitor } from '@/services/realtime.service';

/**
 * 获取实时交易监控数据
 * @route GET /api/admin/realtime/transactions
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit') || '50', 10);

      // 参数校验
      if (limit < 1 || limit > 100) {
        return errorResponse('VALIDATION_ERROR', 'limit 需在1-100之间', 400);
      }

      // 获取交易监控数据（不使用缓存）
      const result = await getTransactionsMonitor(limit);

      return successResponse(result, '获取实时交易监控数据成功');
    } catch (error) {
      console.error('[Realtime Transactions Monitor Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取实时交易监控数据失败');
    }
  });
}
