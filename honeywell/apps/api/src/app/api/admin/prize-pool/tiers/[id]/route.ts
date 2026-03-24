/**
 * @file 奖池等级单条管理接口
 * @description PUT/DELETE /api/admin/prize-pool/tiers/:id
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
  requiredInvites: z.number().int().min(0).optional(),
  rewardAmount: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/prize-pool/tiers/:id
 * @description 更新奖池等级
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

      const existing = await prisma.prizePoolTier.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖池等级不存在', 404);
      }

      const tier = await prisma.prizePoolTier.update({
        where: { id: tierId },
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 更新奖池等级 #${tierId}`);
      return successResponse(tier, '更新奖池等级成功');
    } catch (error) {
      console.error('[PUT /api/admin/prize-pool/tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新奖池等级失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/prize-pool/tiers/:id
 * @description 删除奖池等级
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const tierId = parseInt(id, 10);
      if (isNaN(tierId)) {
        return errorResponse('VALIDATION_ERROR', '无效的等级ID', 400);
      }

      const existing = await prisma.prizePoolTier.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖池等级不存在', 404);
      }

      await prisma.prizePoolTier.delete({ where: { id: tierId } });

      console.log(`[审计] 管理员(${adminId}) 删除奖池等级 #${tierId}`);
      return successResponse({ id: tierId }, '删除奖池等级成功');
    } catch (error) {
      console.error('[DELETE /api/admin/prize-pool/tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '删除奖池等级失败', 500);
    }
  });
}
