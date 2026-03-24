/**
 * @file 敏感词批量导入API
 * @description 批量导入敏感词记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.3节
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.6-敏感词管理页.md
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchImportSensitiveWords } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// POST /api/admin/sensitive-words/batch - 批量导入敏感词
// ================================

// 批量导入请求体验证Schema
const batchImportSchema = z.object({
  words: z.array(z.string().min(1, '敏感词不能为空').max(50, '敏感词最多50个字符'))
    .min(1, '至少导入一个敏感词')
    .max(1000, '单次最多导入1000个敏感词'),
  category: z.string().max(30, '分类最多30个字符').optional().nullable(),
  severity: z.number().int().min(1).max(5).optional().default(1),
});

/**
 * 批量导入敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 * 支持批量导入敏感词，已存在的会跳过
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = batchImportSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { words, category, severity } = validationResult.data;
      
      // 过滤空白词和重复词
      const cleanedWords = [...new Set(
        words
          .map(w => w.trim())
          .filter(w => w.length > 0 && w.length <= 50)
      )];
      
      if (cleanedWords.length === 0) {
        return errorResponse('VALIDATION_ERROR', '没有有效的敏感词可导入', 400);
      }
      
      // 调用服务
      const result = await batchImportSensitiveWords({
        words: cleanedWords,
        category: category || undefined,
        severity,
        createdBy: adminId,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'batch_import',
          targetType: 'sensitive_word',
          afterData: { totalInput: words.length, added: result.added, skipped: result.skipped },
          remark: `批量导入敏感词 添加=${result.added} 跳过=${result.skipped}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      const message = result.skipped > 0
        ? `成功导入${result.added}个，跳过${result.skipped}个已存在的敏感词`
        : `成功导入${result.added}个敏感词`;
      
      return successResponse(result, message);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/sensitive-words/batch] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
