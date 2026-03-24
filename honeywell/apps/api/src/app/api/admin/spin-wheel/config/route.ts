/**
 * @file 转盘配置管理接口
 * @description GET/PUT /api/admin/spin-wheel/config
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/spin-wheel/config
 * @description 获取转盘全局配置
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const configs = await prisma.globalConfig.findMany({
        where: { key: { in: ['spin_wheel_enabled', 'spin_max_daily', 'spin_invite_threshold'] } },
      });
      const map: Record<string, unknown> = {};
      configs.forEach(c => { map[c.key] = c.value; });

      return successResponse({
        spin_wheel_enabled: map['spin_wheel_enabled'] ?? true,
        spin_max_daily: map['spin_max_daily'] ?? 5,
        spin_invite_threshold: map['spin_invite_threshold'] ?? 5,
      });
    } catch (error) {
      console.error('[GET /api/admin/spin-wheel/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取转盘配置失败', 500);
    }
  });
}

/**
 * PUT /api/admin/spin-wheel/config
 * @description 更新转盘全局配置
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const updates = [
        { key: 'spin_wheel_enabled', value: body.spin_wheel_enabled },
        { key: 'spin_max_daily', value: body.spin_max_daily },
        { key: 'spin_invite_threshold', value: body.spin_invite_threshold },
      ].filter(u => u.value !== undefined);

      for (const u of updates) {
        await prisma.globalConfig.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value, description: u.key },
        });
      }

      console.log(`[审计] 管理员(${adminId}) 更新转盘配置`);
      return successResponse(null, '配置已更新');
    } catch (error) {
      console.error('[PUT /api/admin/spin-wheel/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新转盘配置失败', 500);
    }
  });
}
