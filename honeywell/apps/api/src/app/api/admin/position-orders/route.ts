/**
 * @file 持仓订单列表API
 * @description 后台管理端 - 获取持仓订单列表
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6.1节 - 持仓订单列表
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getPositionOrderList } from '@/services/admin-position-order.service';

/**
 * 请求参数校验模式
 * 筛选条件：orderNo、userId、userPhone、productId、productSeries、orderType(购买/赠送)、
 *          status、startDate、endDate、amountMin、amountMax
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  orderNo: z.string().optional(),
  userId: z.coerce.number().optional(),
  userPhone: z.string().optional(),
  productId: z.string().optional(),
  productSeries: z.string().optional(),
  orderType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});

/**
 * GET /api/admin/position-orders
 * @description 获取持仓订单列表
 * @returns 持仓订单列表和分页信息
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      // 参数校验
      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const params = validationResult.data;

      // 解析逗号分隔的多值参数
      const statusArr = params.status
        ? params.status.split(',').filter(s => ['ACTIVE', 'COMPLETED', 'TERMINATED'].includes(s)) as Array<'ACTIVE' | 'COMPLETED' | 'TERMINATED'>
        : undefined;
      const productIdArr = params.productId
        ? params.productId.split(',').map(Number).filter(n => !isNaN(n) && n > 0)
        : undefined;
      const validSeries = params.productSeries && ['PO', 'VIP'].includes(params.productSeries)
        ? params.productSeries as 'PO' | 'VIP'
        : undefined;
      const validOrderType = params.orderType && ['PURCHASE', 'GIFT'].includes(params.orderType)
        ? params.orderType as 'PURCHASE' | 'GIFT'
        : undefined;

      // 调用服务获取持仓订单列表
      const result = await getPositionOrderList({
        page: params.page,
        pageSize: params.pageSize,
        orderNo: params.orderNo,
        userId: params.userId,
        userPhone: params.userPhone,
        productId: productIdArr,
        productSeries: validSeries,
        orderType: validOrderType,
        status: statusArr,
        startDate: params.startDate,
        endDate: params.endDate,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
      });

      // 依据：02.4-后台API接口清单.md 第6.1节 - 返回格式包含 list、pagination
      return successResponse({
        list: result.list,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('[GET /api/admin/position-orders] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取持仓订单列表失败', 500);
    }
  });
}
