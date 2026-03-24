/**
 * @file 黑名单删除API
 * @description 删除黑名单记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.2节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { deleteBlacklist } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma, Prisma } from '@/lib/prisma';

// ================================
// DELETE /api/admin/blacklist/:id - 删除黑名单
// ================================

/**
 * 删除黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
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
        return errorResponse('VALIDATION_ERROR', '无效的黑名单ID', 400);
      }
      
      // 获取黑名单详情用于日志记录
      const blacklist = await prisma.blacklist.findUnique({
        where: { id },
        select: { type: true, value: true },
      });
      
      // 调用服务
      await deleteBlacklist(id);
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'delete',
          targetType: 'blacklist',
          targetId: String(id),
          beforeData: blacklist ? { type: blacklist.type, value: blacklist.value } : null,
          remark: `删除黑名单 ID=${id}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(null, '删除成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/blacklist/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
