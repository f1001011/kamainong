/**
 * @file 收益发放记录列表接口
 * @description GET /api/admin/income-records
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.1节
 *
 * 筛选条件：
 * - userId: 用户ID
 * - userPhone: 用户手机号
 * - positionOrderNo: 持仓订单号
 * - status: 发放状态 (PENDING | SETTLED | FAILED)
 * - startDate/endDate: 时间范围
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  adminIncomeRecordService,
  IncomeRecordListParams,
} from '@/services/admin-income-record.service';
import { IncomeStatus } from '@honeywell/database';

/**
 * 获取收益发放记录列表
 * @route GET /api/admin/income-records
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // 解析查询参数
      const params: IncomeRecordListParams = {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        userId: searchParams.get('userId')
          ? parseInt(searchParams.get('userId')!)
          : undefined,
        userPhone: searchParams.get('userPhone') || undefined,
        positionOrderNo: searchParams.get('positionOrderNo') || undefined,
        status: searchParams.get('status') as IncomeStatus | undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      };

      // 获取记录列表
      const result = await adminIncomeRecordService.getRecordList(params);

      return successResponse(result, '获取收益发放记录成功');
    } catch (error) {
      console.error('[Income Records List Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取收益发放记录失败');
    }
  });
}
