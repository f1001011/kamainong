/**
 * @file 周薪等级管理接口
 * @description GET/POST /api/admin/weekly-salary/tiers
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
  minRecharge: z.number().min(0, '最低充值不能为负'),
  rewardAmount: z.number().min(0, '奖励金额不能为负'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/admin/weekly-salary/tiers
 * @description 获取所有周薪等级配置
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const tiers = await prisma.weeklySalary.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      const list = tiers.map(t => ({
        ...t,
        minRecharge: String(t.minRecharge),
        rewardAmount: String(t.rewardAmount),
      }));

      return successResponse({ list }, '获取周薪等级成功');
    } catch (error) {
      console.error('[GET /api/admin/weekly-salary/tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取周薪等级失败', 500);
    }
  });
}

/**
 * POST /api/admin/weekly-salary/tiers
 * @description 创建新的周薪等级
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

      const tier = await prisma.weeklySalary.create({
        data: validation.data,
      });

      console.log(`[审计] 管理员(${adminId}) 创建周薪等级 #${tier.id}`);
      return successResponse(tier, '创建周薪等级成功');
    } catch (error) {
      console.error('[POST /api/admin/weekly-salary/tiers] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '创建周薪等级失败', 500);
    }
  });
}
