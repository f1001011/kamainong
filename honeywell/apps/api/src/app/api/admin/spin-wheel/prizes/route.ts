/**
 * @file 转盘奖品管理接口
 * @description GET/POST /api/admin/spin-wheel/prizes
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  name: z.string().min(1, '奖品名称不能为空').max(100),
  amount: z.number().min(0, '金额不能为负'),
  probability: z.number().min(0).max(100, '概率范围 0-100'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/spin-wheel/prizes
 * @description 获取所有转盘奖品列表
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const prizes = await prisma.spinWheelPrize.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const list = prizes.map(p => ({
        id: p.id,
        name: p.name,
        amount: String(p.amount),
        probability: String(p.probability),
        sortOrder: p.sortOrder,
        isActive: p.isActive,
        createdAt: p.createdAt,
      }));

      return successResponse({ list }, '获取奖品列表成功');
    } catch (error) {
      console.error('[GET /api/admin/spin-wheel/prizes] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取奖品列表失败', 500);
    }
  });
}

/**
 * POST /api/admin/spin-wheel/prizes
 * @description 创建新的转盘奖品
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validation = createSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const prize = await prisma.spinWheelPrize.create({
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 创建转盘奖品 #${prize.id}: ${prize.name}`);
      return successResponse(prize, '创建奖品成功');
    } catch (error) {
      console.error('[POST /api/admin/spin-wheel/prizes] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '创建奖品失败', 500);
    }
  });
}
