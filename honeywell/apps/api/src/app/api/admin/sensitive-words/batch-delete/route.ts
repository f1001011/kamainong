/**
 * @file 敏感词批量删除API
 * @description 批量删除敏感词记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.3节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchDeleteSensitiveWords } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// POST /api/admin/sensitive-words/batch-delete - 批量删除敏感词
// ================================

// 批量删除请求体验证Schema
const batchDeleteSchema = z.object({
  ids: z.array(z.number().int().positive('ID必须是正整数'))
    .min(1, '至少选择一条记录')
    .max(100, '单次最多删除100条记录'),
});

/**
 * 批量删除敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = batchDeleteSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { ids } = validationResult.data;
      
      // 调用服务
      const result = await batchDeleteSensitiveWords(ids);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'batch_delete',
          targetType: 'sensitive_word',
          afterData: { ids, deleted: result.deleted },
          remark: `批量删除敏感词 删除=${result.deleted}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(result, `成功删除${result.deleted}条敏感词`);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/sensitive-words/batch-delete] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
