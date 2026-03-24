/**
 * @file 社区奖励等级管理接口
 * @description GET/POST /api/admin/community/reward-tiers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  minAmount: z.number().min(0, '最小金额不能为负'),
  maxAmount: z.number().min(0, '最大金额不能为负'),
  rewardAmount: z.number().min(0, '奖励金额不能为负'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/community/reward-tiers
 * @description 获取所有奖励等级配置
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const tiers = await prisma.communityRewardTier.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const list = tiers.map(t => ({
        ...t,
        minAmount: String(t.minAmount),
        maxAmount: String(t.maxAmount),
        rewardAmount: String(t.rewardAmount),
      }));

      return successResponse({ list }, '获取奖励等级成功');
    } catch (error) {
      console.error('[GET /api/admin/community/reward-tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取奖励等级失败', 500);
    }
  });
}

/**
 * POST /api/admin/community/reward-tiers
 * @description 创建新的奖励等级
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

      const data = validation.data;

      if (data.minAmount > data.maxAmount) {
        return errorResponse('VALIDATION_ERROR', '最小金额不能大于最大金额', 400);
      }

      const tier = await prisma.communityRewardTier.create({ data });

      console.log(`[审计] 管理员(${adminId}) 创建社区奖励等级 #${tier.id}`);
      return successResponse(tier, '创建奖励等级成功');
    } catch (error) {
      console.error('[POST /api/admin/community/reward-tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '创建奖励等级失败', 500);
    }
  });
}
