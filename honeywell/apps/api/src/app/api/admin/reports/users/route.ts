/**
 * @file 用户报表接口
 * @description GET /api/admin/reports/users
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第16.2节
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.2-用户报表页.md
 *
 * 返回数据：
 * - summary: 汇总数据（新增用户、活跃用户、付费用户、转化率等）
 * - vipDistribution: VIP等级分布
 * - daily: 每日明细
 *
 * 请求参数：
 * - startDate: 开始日期（必填）
 * - endDate: 结束日期（必填）
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getUserReport } from '@/services/reports.service';

/**
 * 获取用户报表数据
 * @route GET /api/admin/reports/users
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      // 参数校验
      if (!startDate || !endDate) {
        return errorResponse(
          'VALIDATION_ERROR',
          '请选择日期范围',
          400
        );
      }

      // 验证日期格式
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return errorResponse(
          'VALIDATION_ERROR',
          '日期格式不正确，请使用 YYYY-MM-DD 格式',
          400
        );
      }

      // 验证日期范围（最大90天）
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return errorResponse(
          'VALIDATION_ERROR',
          '结束日期不能早于开始日期',
          400
        );
      }

      if (diffDays > 90) {
        return errorResponse(
          'VALIDATION_ERROR',
          '日期范围不能超过90天',
          400
        );
      }

      // 获取用户报表数据
      const reportData = await getUserReport(startDate, endDate);

      return successResponse(reportData, '获取用户报表成功');
    } catch (error) {
      console.error('[User Report Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取用户报表失败');
    }
  });
}
