/**
 * @file 周薪等级单条管理接口
 * @description PUT/DELETE /api/admin/weekly-salary/tiers/:id
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
  minRecharge: z.number().min(0).optional(),
  rewardAmount: z.number().min(0).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/**
 * PUT /api/admin/weekly-salary/tiers/:id
 * @description 更新周薪等级
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

      const existing = await prisma.weeklySalary.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '周薪等级不存在', 404);
      }

      const tier = await prisma.weeklySalary.update({
        where: { id: tierId },
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 更新周薪等级 #${tierId}`);
      return successResponse(tier, '更新周薪等级成功');
    } catch (error) {
      console.error('[PUT /api/admin/weekly-salary/tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新周薪等级失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/weekly-salary/tiers/:id
 * @description 删除周薪等级
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const tierId = parseInt(id, 10);
      if (isNaN(tierId)) {
        return errorResponse('VALIDATION_ERROR', '无效的等级ID', 400);
      }

      const existing = await prisma.weeklySalary.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return errorResponse('NOT_FOUND', '周薪等级不存在', 404);
      }

      await prisma.weeklySalary.delete({ where: { id: tierId } });

      console.log(`[审计] 管理员(${adminId}) 删除周薪等级 #${tierId}`);
      return successResponse({ id: tierId }, '删除周薪等级成功');
    } catch (error) {
      console.error('[DELETE /api/admin/weekly-salary/tiers/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '删除周薪等级失败', 500);
    }
  });
}
