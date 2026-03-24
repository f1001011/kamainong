/**
 * @file 文案版本回滚 API
 * @description POST /api/admin/texts/versions/:version/rollback - 回滚到指定版本
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.9节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { rollbackTextVersion } from '@/services/system-settings.service';

// ================================
// POST /api/admin/texts/versions/:version/rollback - 回滚到指定版本
// ================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const { version } = await params;
      const versionId = parseInt(version, 10);
      
      if (isNaN(versionId)) {
        return errorResponse('VALIDATION_ERROR', '版本ID无效', 400);
      }
      
      // 获取管理员名称
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { username: true },
      });
      const adminName = admin?.username || 'Unknown';
      
      const result = await rollbackTextVersion(versionId, adminId, adminName);
      
      return successResponse(result, '回滚文案版本成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/texts/versions/:version/rollback] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
