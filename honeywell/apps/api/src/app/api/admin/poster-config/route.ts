/**
 * @file 邀请海报配置 API
 * @description 后台管理邀请海报配置的获取和更新
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.4节 - 邀请海报配置接口
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getPosterConfig,
  updatePosterConfig,
} from '@/services/content-management.service';

// ================================
// 更新海报配置的请求体验证Schema
// ================================
const updatePosterConfigSchema = z.object({
  // backgroundImage 允许空字符串、相对路径（以/开头）或完整URL
  backgroundImage: z.string().refine(
    (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    '背景图片必须是空字符串、相对路径或完整URL'
  ).optional(),
  qrCodePositionX: z.number().min(0, '二维码X坐标不能为负').max(100, '二维码X坐标不能超过100').optional(),
  qrCodePositionY: z.number().min(0, '二维码Y坐标不能为负').max(100, '二维码Y坐标不能超过100').optional(),
  qrCodeSize: z.number().min(50, '二维码尺寸不能小于50').max(500, '二维码尺寸不能超过500').optional(),
  inviteCodePositionX: z.number().min(0, '邀请码X坐标不能为负').max(100, '邀请码X坐标不能超过100').optional(),
  inviteCodePositionY: z.number().min(0, '邀请码Y坐标不能为负').max(100, '邀请码Y坐标不能超过100').optional(),
  inviteCodeFontSize: z.number().min(10, '字体大小不能小于10').max(72, '字体大小不能超过72').optional(),
  inviteCodeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '无效的颜色格式，需要16进制颜色值').optional(),
});

// ================================
// GET /api/admin/poster-config - 获取邀请海报配置
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const result = await getPosterConfig();
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[海报配置] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取海报配置失败', 500);
    }
  });
}

// ================================
// PUT /api/admin/poster-config - 更新邀请海报配置
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const body = await req.json();
      
      // 验证请求体
      const parseResult = updatePosterConfigSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const result = await updatePosterConfig(parseResult.data);
      return successResponse(result, '更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[海报配置] 更新失败:', error);
      return errorResponse('SYSTEM_ERROR', '更新海报配置失败', 500);
    }
  });
}
