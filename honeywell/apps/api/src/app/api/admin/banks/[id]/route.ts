/**
 * @file 银行详情、更新、删除 API
 * @description GET /api/admin/banks/:id - 获取银行详情
 *              PUT /api/admin/banks/:id - 更新银行
 *              DELETE /api/admin/banks/:id - 删除银行
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.13~12.14节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getBankDetail,
  updateBank,
  deleteBank,
} from '@/services/system-settings.service';

// ================================
// 更新银行请求体校验 Schema
// ================================
const updateBankSchema = z.object({
  name: z.string().min(1, '银行名称不能为空').max(100, '银行名称最多100个字符').optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ================================
// GET /api/admin/banks/:id - 获取银行详情
// ================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const bankId = parseInt(id, 10);
      
      if (isNaN(bankId)) {
        return errorResponse('VALIDATION_ERROR', '银行ID无效', 400);
      }
      
      const result = await getBankDetail(bankId);
      
      return successResponse(result, '获取银行详情成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/banks/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/banks/:id - 更新银行
// ================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const bankId = parseInt(id, 10);
      
      if (isNaN(bankId)) {
        return errorResponse('VALIDATION_ERROR', '银行ID无效', 400);
      }
      
      const body = await req.json();
      
      // 校验请求体
      const parseResult = updateBankSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      const result = await updateBank(bankId, parseResult.data);
      
      return successResponse(result, '更新银行成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/banks/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// DELETE /api/admin/banks/:id - 删除银行
// ================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const bankId = parseInt(id, 10);
      
      if (isNaN(bankId)) {
        return errorResponse('VALIDATION_ERROR', '银行ID无效', 400);
      }
      
      await deleteBank(bankId);
      
      return successResponse(null, '删除银行成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/banks/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
