/**
 * @file 有效邀请明细API
 * @description GET /api/admin/activities/invite/valid-invitations
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8.4节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminActivityService } from '@/services/admin-activity.service';

// 查询参数验证
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  inviterId: z.coerce.number().int().positive().optional(),
  inviterPhone: z.string().optional(),
  inviteeId: z.coerce.number().int().positive().optional(),
  inviteePhone: z.string().optional(),
  validType: z.enum(['RECHARGE_PURCHASE', 'COMPLETE_SIGNIN']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * GET /api/admin/activities/invite/valid-invitations
 * 获取有效邀请明细
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);

      // 解析查询参数
      const queryData: Record<string, unknown> = {
        page: searchParams.get('page') || 1,
        pageSize: searchParams.get('pageSize') || 20,
      };

      // 可选参数
      const inviterId = searchParams.get('inviterId');
      if (inviterId) queryData.inviterId = inviterId;

      const inviterPhone = searchParams.get('inviterPhone');
      if (inviterPhone) queryData.inviterPhone = inviterPhone;

      const inviteeId = searchParams.get('inviteeId');
      if (inviteeId) queryData.inviteeId = inviteeId;

      const inviteePhone = searchParams.get('inviteePhone');
      if (inviteePhone) queryData.inviteePhone = inviteePhone;

      const validType = searchParams.get('validType');
      if (validType) queryData.validType = validType;

      const startDate = searchParams.get('startDate');
      if (startDate) queryData.startDate = startDate;

      const endDate = searchParams.get('endDate');
      if (endDate) queryData.endDate = endDate;

      const parsed = querySchema.safeParse(queryData);
      if (!parsed.success) {
        return errorResponse('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
      }

      // 获取数据
      const result = await adminActivityService.getValidInvitations(parsed.data);

      return successResponse({
        list: result.list,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      console.error('[ValidInvitations] 获取有效邀请明细失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取有效邀请明细失败', 500);
    }
  });
}
