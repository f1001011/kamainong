/**
 * @file 文案导入 API
 * @description POST /api/admin/texts/import - 导入文案
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.7节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { importTexts } from '@/services/system-settings.service';

// ================================
// 导入文案请求体校验 Schema
// ================================
const importTextsSchema = z.object({
  texts: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: '导入数据不能为空' }
  ),
  conflictStrategy: z.enum(['OVERWRITE', 'SKIP']).default('OVERWRITE'),
});

// ================================
// POST /api/admin/texts/import - 导入文案
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = importTextsSchema.safeParse(body);
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
      
      const result = await importTexts(
        parseResult.data.texts,
        parseResult.data.conflictStrategy,
        adminId,
        adminName
      );
      
      return successResponse(result, '导入文案成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/texts/import] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
