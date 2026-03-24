/**
 * @file 持仓订单列表接口
 * @description GET /api/positions - 获取用户持仓订单列表
 * @depends 开发文档/02.3-前端API接口清单.md 第8.1节 - 持仓订单列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { positionService } from '@/services/position.service';

/**
 * GET /api/positions
 * 
 * @description 获取用户持仓订单列表
 * @requires 登录认证
 * 
 * Query参数：
 * - status: ACTIVE | COMPLETED（可选，状态过滤）
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认20）
 * 
 * 响应格式（依据：02.3-前端API接口清单.md 第8.1节）：
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 123,
 *         "orderNo": "PO20260203A1B2C3D4E5",
 *         "productName": "Po1",
 *         "productImage": "/images/products/po1.png",
 *         "purchaseAmount": "50.00",
 *         "dailyIncome": "5.00",
 *         "cycleDays": 365,
 *         "paidDays": 30,
 *         "earnedIncome": "150.00",
 *         "status": "ACTIVE",
 *         "isGift": false,
 *         "startAt": "2026-01-03T10:30:00.000Z",
 *         "nextSettleAt": "2026-02-04T10:30:00.000Z"
 *       }
 *     ],
 *     "pagination": { "page": 1, "pageSize": 20, "total": 50, "totalPages": 3 },
 *     "summary": {
 *       "activeCount": 5,
 *       "completedCount": 12,
 *       "totalPurchaseAmount": "600.00",
 *       "totalEarned": "3000.00",
 *       "todayIncome": "50.00"
 *     }
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'ACTIVE' | 'COMPLETED' | null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 参数校验
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(Math.max(1, pageSize), 100); // 限制最大100条

    // 状态校验
    const validStatus = status && ['ACTIVE', 'COMPLETED'].includes(status)
      ? status
      : undefined;

    // 调用服务获取持仓列表
    const result = await positionService.getPositions(
      userId,
      validPage,
      validPageSize,
      validStatus
    );

    return successResponse(result);
  });
}
