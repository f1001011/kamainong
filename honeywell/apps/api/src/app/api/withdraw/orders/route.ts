/**
 * @file 提现订单列表接口
 * @description GET /api/withdraw/orders - 获取用户提现订单列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第6.3节 - 提现订单列表
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { withdrawService } from '@/services/withdraw.service';

/**
 * 获取提现订单列表
 * @description 支持分页、状态筛选
 * 依据：02.3-前端API接口清单.md 第6.3节
 * status可选值：PENDING_REVIEW | APPROVED | COMPLETED | FAILED | REJECTED
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    // 1. 解析查询参数
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status') || undefined;

    // 2. 参数校验
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(100, Math.max(1, pageSize));

    // 3. 调用服务获取订单列表
    const result = await withdrawService.getOrders(
      userId,
      validPage,
      validPageSize,
      status
    );

    // 4. 返回数据（依据：02.3-前端API接口清单.md 第6.3节）
    return successResponse({
      list: result.list,
      pagination: result.pagination,
    });
  });
}
