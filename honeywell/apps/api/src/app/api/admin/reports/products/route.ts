/**
 * @file 产品报表接口
 * @description GET /api/admin/reports/products
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第16.3节
 * @depends 开发文档/04-后台管理端/04.2-数据报表/04.2.3-产品报表页.md
 *
 * 返回数据：
 * - list: 产品销售明细列表（销量、销售额、占比、购买用户等）
 * - summary: 汇总数据（总销售额、总销量、系列分布）
 *
 * 请求参数：
 * - startDate: 开始日期（必填）
 * - endDate: 结束日期（必填）
 * - series: 产品系列筛选（可选，PO/VIP）
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getProductReport } from '@/services/reports.service';

/**
 * 获取产品报表数据
 * @route GET /api/admin/reports/products
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const series = searchParams.get('series'); // 可选：PO / VIP

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

      // 验证系列参数
      if (series && !['PO', 'VIP'].includes(series)) {
        return errorResponse(
          'VALIDATION_ERROR',
          '无效的产品系列，请使用 PO 或 VIP',
          400
        );
      }

      // 获取产品报表数据
      const reportData = await getProductReport(startDate, endDate, series || undefined);

      return successResponse(reportData, '获取产品报表成功');
    } catch (error) {
      console.error('[Product Report Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取产品报表失败');
    }
  });
}
