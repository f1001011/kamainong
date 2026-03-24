/**
 * @file 账户锁定管理API
 * @description 后台管理端 - 银行账户-手机号锁定记录管理
 * 
 * 接口清单：
 * - GET /api/admin/account-locks - 分页查询锁定记录列表
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getAccountLockList } from '@/services/admin-account-lock.service';

/**
 * GET /api/admin/account-locks
 * @description 分页查询锁定记录列表，支持按手机号/卡号/锁定状态筛选
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);

      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
      const phone = searchParams.get('phone') || undefined;
      const accountNoMask = searchParams.get('accountNoMask') || undefined;
      const isLockedParam = searchParams.get('isLocked');
      const isLocked = isLockedParam === 'true' ? true : isLockedParam === 'false' ? false : undefined;

      const result = await getAccountLockList({
        page,
        pageSize,
        phone,
        accountNoMask,
        isLocked,
      });

      return successResponse(result);
    } catch (error) {
      console.error('[GET /api/admin/account-locks] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取锁定记录列表失败', 500);
    }
  });
}
