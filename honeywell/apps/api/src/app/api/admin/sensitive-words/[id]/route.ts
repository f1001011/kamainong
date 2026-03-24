/**
 * @file 敏感词删除API
 * @description 删除敏感词记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.3节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { deleteSensitiveWord } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma, Prisma } from '@/lib/prisma';

// ================================
// DELETE /api/admin/sensitive-words/:id - 删除敏感词
// ================================

/**
 * 删除敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析路由参数
      const { id: idStr } = await params;
      const id = parseInt(idStr, 10);
      
      if (isNaN(id) || id <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的敏感词ID', 400);
      }
      
      // 获取敏感词详情用于日志记录
      const sensitiveWord = await prisma.sensitiveWord.findUnique({
        where: { id },
        select: { word: true, category: true },
      });
      
      // 调用服务
      await deleteSensitiveWord(id);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'delete',
          targetType: 'sensitive_word',
          targetId: String(id),
          beforeData: sensitiveWord ? { word: sensitiveWord.word, category: sensitiveWord.category } : Prisma.JsonNull,
          remark: `删除敏感词 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(null, '删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/sensitive-words/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
