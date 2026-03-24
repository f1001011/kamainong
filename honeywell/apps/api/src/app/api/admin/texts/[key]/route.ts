/**
 * @file 单条文案更新 API
 * @description PUT /api/admin/texts/:key - 更新单条文案
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.4节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { updateText } from '@/services/system-settings.service';

// ================================
// 更新文案请求体校验 Schema
// ================================
const updateTextSchema = z.object({
  value: z.string().min(1, '文案内容不能为空'),
});

// ================================
// PUT /api/admin/texts/:key - 更新单条文案
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { key } = await params;
      const body = await req.json();
      
      // 校验请求体
      const parseResult = updateTextSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      // 获取管理员名称
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { username: true },
      });
      const adminName = admin?.username || 'Unknown';
      
      const result = await updateText(
        decodeURIComponent(key),
        parseResult.data.value,
        adminId,
        adminName
      );
      
      return successResponse(result, '更新文案成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/texts/:key] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
