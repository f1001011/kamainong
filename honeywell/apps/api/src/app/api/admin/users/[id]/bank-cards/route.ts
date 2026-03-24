/**
 * @file 用户银行卡API
 * @description 后台管理端 - 获取用户银行卡列表、清空用户银行卡
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.8节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getUserBankCards, clearUserBankCards } from '@/services/user.service';
import { BusinessError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/:id/bank-cards
 * @description 获取用户银行卡列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, _adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);
      
      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const result = await getUserBankCards(userId);
      
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/users/:id/bank-cards] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取银行卡列表失败', 500);
    }
  });
}

/**
 * DELETE /api/admin/users/:id/bank-cards
 * @description 清空用户所有银行卡信息（软删除）+ 清除关联的账户手机号锁定记录
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const userId = parseInt(id, 10);

      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '无效的用户ID', 400);
      }

      const result = await clearUserBankCards(userId, adminId);

      return successResponse(result, `已清空 ${result.cardsCleared} 张银行卡，释放 ${result.locksCleared} 条锁定记录`);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/users/:id/bank-cards] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '清空银行卡失败', 500);
    }
  });
}
