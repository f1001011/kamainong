/**
 * @file 收益异常列表接口
 * @description GET /api/admin/income-records/exceptions
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18.2节
 *
 * 筛选条件：
 * - userId: 用户ID
 * - userPhone: 用户手机号
 * - positionOrderNo: 持仓订单号
 * - productId: 产品ID
 * - startDate/endDate: 时间范围
 * - isHandled: 是否已处理
 *
 * 仅返回 status=FAILED 的记录
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  adminIncomeRecordService,
  IncomeExceptionListParams,
} from '@/services/admin-income-record.service';

/**
 * 获取收益异常列表
 * @route GET /api/admin/income-records/exceptions
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const searchParams = req.nextUrl.searchParams;

      // 解析查询参数
      const params: IncomeExceptionListParams = {
        page: parseInt(searchParams.get('page') || '1'),
        pageSize: parseInt(searchParams.get('pageSize') || '20'),
        userId: searchParams.get('userId')
          ? parseInt(searchParams.get('userId')!)
          : undefined,
        userPhone: searchParams.get('userPhone') || undefined,
        positionOrderNo: searchParams.get('positionOrderNo') || undefined,
        productId: searchParams.get('productId')
          ? parseInt(searchParams.get('productId')!)
          : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        isHandled:
          searchParams.get('isHandled') === 'true'
            ? true
            : searchParams.get('isHandled') === 'false'
              ? false
              : undefined,
      };

      // 获取异常列表
      const result = await adminIncomeRecordService.getExceptionList(params);

      return successResponse(result, '获取收益异常列表成功');
    } catch (error) {
      console.error('[Income Exceptions List Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取收益异常列表失败');
    }
  });
}
