/**
 * @file 社区奖励等级单条管理接口
 * @description PUT/DELETE /api/admin/community/reward-tiers/:id
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  rewardAmount: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/community/reward-tiers/:id
 * @description 更新奖励等级
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const tierId = parseInt(id, 10);
      if (isNaN(tierId)) {
        return errorResponse('VALIDATION_ERROR', '无效的等级ID', 400);
      }

      const body = await req.json();
      const validation = updateSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const existing = await prisma.communityRewardTier.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖励等级不存在', 404);
      }

      const data = validation.data;
      const finalMin = data.minAmount ?? Number(existing.minAmount);
      const finalMax = data.maxAmount ?? Number(existing.maxAmount);
      if (finalMin > finalMax) {
        return errorResponse('VALIDATION_ERROR', '最小金额不能大于最大金额', 400);
      }

      const tier = await prisma.communityRewardTier.update({
        where: { id: tierId },
        data,
      });

      console.log(`[审计] 管理员(${adminId}) 更新社区奖励等级 #${tierId}`);
      return successResponse(tier, '更新奖励等级成功');
    } catch (error) {
      console.error('[PUT /api/admin/community/reward-tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新奖励等级失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/community/reward-tiers/:id
 * @description 删除奖励等级
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const tierId = parseInt(id, 10);
      if (isNaN(tierId)) {
        return errorResponse('VALIDATION_ERROR', '无效的等级ID', 400);
      }

      const existing = await prisma.communityRewardTier.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖励等级不存在', 404);
      }

      await prisma.communityRewardTier.delete({ where: { id: tierId } });

      console.log(`[审计] 管理员(${adminId}) 删除社区奖励等级 #${tierId}`);
      return successResponse({ id: tierId }, '删除奖励等级成功');
    } catch (error) {
      console.error('[DELETE /api/admin/community/reward-tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '删除奖励等级失败', 500);
    }
  });
}
