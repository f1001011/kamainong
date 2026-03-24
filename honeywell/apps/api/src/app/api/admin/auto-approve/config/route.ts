/**
 * @file 免审核配置接口
 * @description GET/PUT /api/admin/auto-approve/config - 获取/更新免审核配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第10节 - 免审核配置接口
 * @depends 开发文档/开发文档.md 第13.9.4节 - 免审核提现配置
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { autoApproveService } from '@/services/auto-approve.service';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * 时间范围格式验证
 * @description 格式：HH:MM-HH:MM，如 00:00-23:59
 */
const TIME_RANGE_REGEX = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * 更新免审核配置的参数验证
 */
const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  threshold: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, '金额格式错误')
    .optional(),
  dailyLimit: z.number().int().min(0).max(100).optional(),
  timeRange: z
    .string()
    .regex(TIME_RANGE_REGEX, '时间范围格式错误，应为 HH:MM-HH:MM')
    .optional(),
  newUserDays: z.number().int().min(0).max(365).optional(),
});

/**
 * GET /api/admin/auto-approve/config
 * @description 获取免审核配置
 * @returns 免审核配置（enabled、threshold、dailyLimit、timeRange、newUserDays）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await autoApproveService.getConfig();
      return successResponse(config);
    } catch (error) {
      console.error('[Admin Auto-Approve Config] 获取免审核配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取免审核配置失败', 500);
    }
  });
}

/**
 * PUT /api/admin/auto-approve/config
 * @description 更新免审核配置
 * @body 配置参数（enabled、threshold、dailyLimit、timeRange、newUserDays）
 * @returns 更新后的免审核配置
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // 解析并验证请求体
      const body = await request.json();
      const parseResult = updateConfigSchema.safeParse(body);

      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse(
          'VALIDATION_ERROR',
          `参数错误: ${firstError.path.join('.')} ${firstError.message}`
        );
      }

      // 更新配置
      const config = await autoApproveService.updateConfig(parseResult.data);
      return successResponse(config, '免审核配置更新成功');
    } catch (error) {
      console.error('[Admin Auto-Approve Config] 更新免审核配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '更新免审核配置失败', 500);
    }
  });
}
