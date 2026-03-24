/**
 * @file 银行批量排序 API
 * @description PUT /api/admin/banks/sort - 批量更新银行排序
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.11节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { updateBankSort } from '@/services/system-settings.service';

// ================================
// 批量排序请求体校验 Schema
// ================================
const sortBanksSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int().positive('银行ID必须为正整数'),
      sortOrder: z.number().int().min(0, '排序值不能为负数'),
    })
  ).min(1, '至少需要一个排序项'),
});

// ================================
// PUT /api/admin/banks/sort - 批量更新银行排序
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = sortBanksSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      await updateBankSort(parseResult.data.items);
      
      return successResponse(null, '更新银行排序成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/banks/sort] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
