/**
 * @file 奖池等级管理接口
 * @description GET/POST /api/admin/prize-pool/tiers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  requiredInvites: z.number().int().min(0, '邀请人数不能为负'),
  rewardAmount: z.number().min(0, '奖励金额不能为负'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/prize-pool/tiers
 * @description 获取所有奖池等级配置
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const tiers = await prisma.prizePoolTier.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const list = tiers.map(t => ({
        ...t,
        rewardAmount: String(t.rewardAmount),
      }));

      return successResponse({ list }, '获取奖池等级成功');
    } catch (error) {
      console.error('[GET /api/admin/prize-pool/tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取奖池等级失败', 500);
    }
  });
}

/**
 * POST /api/admin/prize-pool/tiers
 * @description 创建新的奖池等级
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

      const tier = await prisma.prizePoolTier.create({
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 创建奖池等级 #${tier.id}`);
      return successResponse(tier, '创建奖池等级成功');
    } catch (error) {
      console.error('[POST /api/admin/prize-pool/tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '创建奖池等级失败', 500);
    }
  });
}
