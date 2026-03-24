/**
 * @file 提现订单列表接口
 * @description GET /api/admin/withdraw-orders
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第5.1节
 *
 * 筛选条件：
 * - orderNo: 订单号
 * - userId: 用户ID
 * - userPhone: 用户手机号
 * - bankCode: 银行编码
 * - accountNo: 账号
 * - status: 订单状态
 * - reviewedBy: 审核人ID
 * - startDate/endDate: 时间范围
 * - amountMin/amountMax: 金额范围
 * - isAutoApproved: 是否免审核
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  adminWithdrawService,
  WithdrawOrderListParams,
} from '@/services/admin-withdraw.service';
import { WithdrawStatus } from '@honeywell/database';

/**
 * 获取提现订单列表
 * @route GET /api/admin/withdraw-orders
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // 解析查询参数
      const params: WithdrawOrderListParams = {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        orderNo: searchParams.get('orderNo') || undefined,
        userId: searchParams.get('userId')
          ? parseInt(searchParams.get('userId')!)
          : undefined,
        userPhone: searchParams.get('userPhone') || undefined,
        bankCode: searchParams.get('bankCode') || undefined,
        accountNo: searchParams.get('accountNo') || undefined,
        status: searchParams.get('status') as WithdrawStatus | undefined,
        reviewedBy: searchParams.get('reviewedBy')
          ? parseInt(searchParams.get('reviewedBy')!)
          : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        amountMin: searchParams.get('amountMin')
          ? parseFloat(searchParams.get('amountMin')!)
          : undefined,
        amountMax: searchParams.get('amountMax')
          ? parseFloat(searchParams.get('amountMax')!)
          : undefined,
        isAutoApproved:
          searchParams.get('isAutoApproved') === 'true'
            ? true
            : searchParams.get('isAutoApproved') === 'false'
              ? false
              : undefined,
      };

      // 获取订单列表
      const result = await adminWithdrawService.getOrderList(params);

      return successResponse(result, '获取提现订单列表成功');
    } catch (error) {
      console.error('[Withdraw Orders List Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取提现订单列表失败');
    }
  });
}
