/**
 * @file 收益发放记录接口
 * @description GET /api/positions/:id/incomes - 获取持仓订单的收益发放记录
 * @depends 开发文档/02.3-前端API接口清单.md 第8.3节 - 收益发放记录
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { positionService } from '@/services/position.service';

/**
 * GET /api/positions/:id/incomes
 * 
 * @description 获取持仓订单的收益发放记录
 * @requires 登录认证
 * 
 * 路径参数：
 * - id: 持仓订单ID
 * 
 * Query参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * 
 * 响应格式（依据：02.3-前端API接口清单.md 第8.3节）：
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "settleSequence": 30,
 *         "amount": "5.00",
 *         "status": "SETTLED",
 *         "scheduleAt": "2026-02-03T10:30:00.000Z",
 *         "settledAt": "2026-02-03T10:30:05.000Z"
 *       },
 *       {
 *         "id": 2,
 *         "settleSequence": 29,
 *         "amount": "5.00",
 *         "status": "SETTLED",
 *         "scheduleAt": "2026-02-02T10:30:00.000Z",
 *         "settledAt": "2026-02-02T10:30:03.000Z"
 *       }
 *     ],
 *     "pagination": { "page": 1, "pageSize": 20, "total": 30, "totalPages": 2 },
 *     "summary": {
 *       "totalSettled": "150.00",
 *       "pendingCount": 335
 *     }
 *   }
 * }
 * 
 * 错误码：
 * - ORDER_NOT_FOUND: 订单不存在
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, userId) => {
    const { id } = await context.params;
    const positionId = parseInt(id, 10);

    // 参数校验
    if (isNaN(positionId) || positionId <= 0) {
      return errorResponse('VALIDATION_ERROR', 'معرف الطلب غير صالح', 400);
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 参数校验
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大100条

    // 调用服务获取收益记录
    const result = await positionService.getIncomeRecords(
      userId,
      positionId,
      validPage,
      validPageSize
    );

    return successResponse(result);
  });
}
