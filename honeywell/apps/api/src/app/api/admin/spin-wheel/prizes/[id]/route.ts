/**
 * @file 转盘奖品单条管理接口
 * @description PUT/DELETE /api/admin/spin-wheel/prizes/:id
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
  name: z.string().min(1).max(100).optional(),
  amount: z.number().min(0).optional(),
  probability: z.number().min(0).max(100).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/spin-wheel/prizes/:id
 * @description 更新转盘奖品
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { id } = await params;
      const prizeId = parseInt(id, 10);
      if (isNaN(prizeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的奖品ID', 400);
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

      const existing = await prisma.spinWheelPrize.findUnique({
        where: { id: prizeId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖品不存在', 404);
      }

      const prize = await prisma.spinWheelPrize.update({
        where: { id: prizeId },
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 更新转盘奖品 #${prizeId}`);
      return successResponse(prize, '更新奖品成功');
    } catch (error) {
      console.error('[PUT /api/admin/spin-wheel/prizes/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新奖品失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/spin-wheel/prizes/:id
 * @description 删除转盘奖品
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const prizeId = parseInt(id, 10);
      if (isNaN(prizeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的奖品ID', 400);
      }

      const existing = await prisma.spinWheelPrize.findUnique({
        where: { id: prizeId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '奖品不存在', 404);
      }

      await prisma.spinWheelPrize.delete({ where: { id: prizeId } });

      console.log(`[审计] 管理员(${adminId}) 删除转盘奖品 #${prizeId}`);
      return successResponse({ id: prizeId }, '删除奖品成功');
    } catch (error) {
      console.error('[DELETE /api/admin/spin-wheel/prizes/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '删除奖品失败', 500);
    }
  });
}
