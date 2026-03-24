/**
 * @file 充值订单列表API
 * @description 后台管理端 - 获取充值订单列表（含summary统计）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第4.1节 - 充值订单列表
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminRechargeOrderService } from '@/services/admin-recharge-order.service';

/**
 * 请求参数校验模式
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  orderNo: z.string().optional(),
  thirdOrderNo: z.string().optional(),
  userId: z.coerce.number().optional(),
  userPhone: z.string().optional(),
  channelId: z.coerce.number().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
  createIp: z.string().optional(),
});

/**
 * GET /api/admin/recharge-orders
 * @description 获取充值订单列表（含summary统计）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());

      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map((e) => e.message).join(', '),
          400
        );
      }

      const params = validationResult.data;

      // 解析逗号分隔的状态参数
      const validStatuses = ['PENDING_PAYMENT', 'PAID', 'FAILED', 'CANCELLED'];
      const statusArr = params.status
        ? params.status.split(',').filter(s => validStatuses.includes(s))
        : undefined;

      const result = await adminRechargeOrderService.getList({
        page: params.page,
        pageSize: params.pageSize,
        orderNo: params.orderNo,
        thirdOrderNo: params.thirdOrderNo,
        userId: params.userId,
        userPhone: params.userPhone,
        channelId: params.channelId,
        status: statusArr as any,
        startDate: params.startDate,
        endDate: params.endDate,
        amountMin: params.amountMin,
        amountMax: params.amountMax,
        createIp: params.createIp,
      });

      // 依据：02.4-后台API接口清单.md 第4.1节 - 返回格式包含 list、pagination、summary
      return successResponse({
        list: result.list,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      console.error('[GET /api/admin/recharge-orders] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取充值订单列表失败', 500);
    }
  });
}
