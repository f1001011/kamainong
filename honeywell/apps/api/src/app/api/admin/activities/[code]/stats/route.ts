/**
 * @file 活动统计数据API
 * @description GET /api/admin/activities/:code/stats
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8.3节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminActivityService } from '@/services/admin-activity.service';

// 查询参数验证
const querySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/admin/activities/:code/stats
 * 获取活动统计数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { code } = await params;
      const { searchParams } = new URL(req.url);

      // 解析查询参数
      const queryData = {
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      };

      const parsed = querySchema.safeParse(queryData);
      if (!parsed.success) {
        return errorResponse('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
      }

      const { startDate, endDate } = parsed.data;

      // 获取统计数据
      const stats = await adminActivityService.getActivityStats(code, startDate, endDate);

      return successResponse(stats);
    } catch (error) {
      console.error('[AdminActivityStats] 获取活动统计数据失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取活动统计数据失败', 500);
    }
  });
}
