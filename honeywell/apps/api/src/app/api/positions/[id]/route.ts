/**
 * @file 持仓订单详情接口
 * @description GET /api/positions/:id - 获取持仓订单详情
 * @depends 开发文档/02.3-前端API接口清单.md 第8.2节 - 持仓订单详情
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { positionService } from '@/services/position.service';

/**
 * GET /api/positions/:id
 * 
 * @description 获取持仓订单详情
 * @requires 登录认证
 * 
 * 路径参数：
 * - id: 持仓订单ID
 * 
 * 响应格式（依据：02.3-前端API接口清单.md 第8.2节）：
 * {
 *   "success": true,
 *   "data": {
 *     "id": 123,
 *     "orderNo": "PO20260203A1B2C3D4E5",
 *     "productId": 2,
 *     "productName": "Po1",
 *     "productImage": "/images/products/po1.png",
 *     "purchaseAmount": "50.00",
 *     "dailyIncome": "5.00",
 *     "cycleDays": 365,
 *     "totalIncome": "1825.00",
 *     "paidDays": 30,
 *     "remainingDays": 335,
 *     "earnedIncome": "150.00",
 *     "status": "ACTIVE",
 *     "isGift": false,
 *     "startAt": "2026-01-03T10:30:00.000Z",
 *     "nextSettleAt": "2026-02-04T10:30:00.000Z",
 *     "endAt": null
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

    // 调用服务获取详情
    const detail = await positionService.getPositionDetail(userId, positionId);

    return successResponse(detail);
  });
}
