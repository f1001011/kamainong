/**
 * @file 礼品码详情、更新、删除接口
 * @description GET /api/admin/gift-codes/:id - 详情
 *              PUT /api/admin/gift-codes/:id - 更新
 *              DELETE /api/admin/gift-codes/:id - 删除
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getGiftCodeDetail,
  updateGiftCode,
  deleteGiftCode,
} from '@/services/gift-code.service';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  requirement: z.enum(['NONE', 'MUST_PURCHASE']).optional(),
  startAt: z.string().nullable().optional(),
  expireAt: z.string().nullable().optional(),
  remark: z.string().max(500).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const giftCodeId = parseInt(id, 10);
      if (isNaN(giftCodeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的礼品码ID', 400);
      }

      const result = await getGiftCodeDetail(giftCodeId);
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/gift-codes/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const giftCodeId = parseInt(id, 10);
      if (isNaN(giftCodeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的礼品码ID', 400);
      }

      const body = await req.json();
      const parseResult = updateSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const result = await updateGiftCode(giftCodeId, parseResult.data);
      return successResponse(result, '礼品码更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/gift-codes/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const giftCodeId = parseInt(id, 10);
      if (isNaN(giftCodeId)) {
        return errorResponse('VALIDATION_ERROR', '无效的礼品码ID', 400);
      }

      await deleteGiftCode(giftCodeId);
      return successResponse(null, '礼品码已删除');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/gift-codes/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
