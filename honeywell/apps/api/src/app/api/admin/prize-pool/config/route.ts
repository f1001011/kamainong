/**
 * @file 奖池配置管理接口
 * @description GET/PUT /api/admin/prize-pool/config
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  prize_pool_enabled: z.boolean().optional(),
  prize_pool_daily_amount: z.number().min(0, '每日奖池总额不能为负').optional(),
});

/**
 * GET /api/admin/prize-pool/config
 * @description 获取奖池配置（开关 + 每日总额）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const [enabledConfig, pool] = await Promise.all([
        prisma.globalConfig.findUnique({ where: { key: 'prize_pool_enabled' } }),
        prisma.prizePool.findFirst({ where: { isActive: true } }),
      ]);

      return successResponse({
        prize_pool_enabled: enabledConfig?.value ?? true,
        prize_pool_daily_amount: pool ? String(pool.dailyTotal) : '0',
      });
    } catch (error) {
      console.error('[GET /api/admin/prize-pool/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取奖池配置失败', 500);
    }
  });
}

/**
 * PUT /api/admin/prize-pool/config
 * @description 更新奖池配置（开关 + 每日总额）
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validation = updateSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const { prize_pool_enabled, prize_pool_daily_amount } = validation.data;

      if (prize_pool_enabled !== undefined) {
        await prisma.globalConfig.upsert({
          where: { key: 'prize_pool_enabled' },
          update: { value: prize_pool_enabled },
          create: { key: 'prize_pool_enabled', value: prize_pool_enabled, description: '奖池功能开关' },
        });
      }

      if (prize_pool_daily_amount !== undefined) {
        const existing = await prisma.prizePool.findFirst({ where: { isActive: true } });
        if (existing) {
          await prisma.prizePool.update({
            where: { id: existing.id },
            data: { dailyTotal: prize_pool_daily_amount },
          });
        } else {
          const today = new Date().toISOString().slice(0, 10);
          await prisma.prizePool.create({
            data: {
              dailyTotal: prize_pool_daily_amount,
              remainToday: prize_pool_daily_amount,
              lastResetDate: today,
              isActive: true,
            },
          });
        }
      }

      console.log(`[审计] 管理员(${adminId}) 更新奖池配置`);
      return successResponse(null, '更新奖池配置成功');
    } catch (error) {
      console.error('[PUT /api/admin/prize-pool/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新奖池配置失败', 500);
    }
  });
}
