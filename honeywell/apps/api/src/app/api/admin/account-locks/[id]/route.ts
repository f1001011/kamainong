/**
 * @file 账户锁定管理API - 单条操作
 * @description 后台管理端 - 切换锁定状态、删除锁定记录
 * 
 * 接口清单：
 * - PATCH /api/admin/account-locks/:id - 切换锁定状态（解锁/重锁）
 * - DELETE /api/admin/account-locks/:id - 删除锁定记录
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import {
  toggleAccountLock,
  deleteAccountLock,
} from '@/services/admin-account-lock.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/admin/account-locks/:id
 * @description 切换锁定状态（解锁↔重锁）
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const recordId = parseInt(id, 10);

      if (isNaN(recordId)) {
        return errorResponse('VALIDATION_ERROR', '无效的记录ID', 400);
      }

      const result = await toggleAccountLock(recordId, adminId);

      return successResponse(result, result.isLocked ? '已重新锁定' : '已解锁');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '操作失败';
      console.error('[PATCH /api/admin/account-locks/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', errMsg, 500);
    }
  });
}

/**
 * DELETE /api/admin/account-locks/:id
 * @description 删除锁定记录（完全放开该银行账户）
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const recordId = parseInt(id, 10);

      if (isNaN(recordId)) {
        return errorResponse('VALIDATION_ERROR', '无效的记录ID', 400);
      }

      await deleteAccountLock(recordId);

      return successResponse(null, '锁定记录已删除');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '删除失败';
      console.error('[DELETE /api/admin/account-locks/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', errMsg, 500);
    }
  });
}
