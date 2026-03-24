/**
 * @file 返佣记录列表接口
 * @description GET /api/admin/commissions
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第19.1节
 *
 * 筛选条件：
 * - receiverId: 接收人ID
 * - receiverPhone: 接收人手机号
 * - sourceUserId: 来源人ID
 * - sourceUserPhone: 来源人手机号
 * - level: 返佣级别 (LEVEL_1 | LEVEL_2 | LEVEL_3)
 * - productId: 产品ID
 * - startDate/endDate: 时间范围
 * - amountMin/amountMax: 金额范围
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  adminCommissionService,
  CommissionListParams,
} from '@/services/admin-commission.service';
import { CommissionLevel } from '@honeywell/database';

/**
 * 获取返佣记录列表
 * @route GET /api/admin/commissions
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // 解析查询参数
      const params: CommissionListParams = {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        receiverId: searchParams.get('receiverId')
          ? parseInt(searchParams.get('receiverId')!)
          : undefined,
        receiverPhone: searchParams.get('receiverPhone') || undefined,
        sourceUserId: searchParams.get('sourceUserId')
          ? parseInt(searchParams.get('sourceUserId')!)
          : undefined,
        sourceUserPhone: searchParams.get('sourceUserPhone') || undefined,
        level: searchParams.get('level') as CommissionLevel | undefined,
        productId: searchParams.get('productId')
          ? parseInt(searchParams.get('productId')!)
          : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        amountMin: searchParams.get('amountMin')
          ? parseFloat(searchParams.get('amountMin')!)
          : undefined,
        amountMax: searchParams.get('amountMax')
          ? parseFloat(searchParams.get('amountMax')!)
          : undefined,
      };

      // 获取记录列表
      const result = await adminCommissionService.getRecordList(params);

      return successResponse(result, '获取返佣记录成功');
    } catch (error) {
      console.error('[Commissions List Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取返佣记录失败');
    }
  });
}
