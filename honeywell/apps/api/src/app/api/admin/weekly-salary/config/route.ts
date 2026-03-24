/**
 * @file 周薪配置管理接口
 * @description GET/PUT /api/admin/weekly-salary/config
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/weekly-salary/config
 * @description 获取周薪全局配置
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await prisma.globalConfig.findUnique({
        where: { key: 'weekly_salary_enabled' },
      });

      return successResponse({
        weekly_salary_enabled: config?.value ?? true,
      });
    } catch (error) {
      console.error('[GET /api/admin/weekly-salary/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取周薪配置失败', 500);
    }
  });
}

/**
 * PUT /api/admin/weekly-salary/config
 * @description 更新周薪全局配置
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();

      if (body.weekly_salary_enabled !== undefined) {
        await prisma.globalConfig.upsert({
          where: { key: 'weekly_salary_enabled' },
          update: { value: body.weekly_salary_enabled },
          create: { key: 'weekly_salary_enabled', value: body.weekly_salary_enabled, description: '周薪功能开关' },
        });
      }

      console.log(`[审计] 管理员(${adminId}) 更新周薪配置`);
      return successResponse(null, '配置已更新');
    } catch (error) {
      console.error('[PUT /api/admin/weekly-salary/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '更新周薪配置失败', 500);
    }
  });
}
