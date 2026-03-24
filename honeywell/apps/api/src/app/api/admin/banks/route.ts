/**
 * @file 银行列表与创建 API
 * @description GET /api/admin/banks - 获取银行列表
 *              POST /api/admin/banks - 创建银行
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.11~12.12节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getBankList,
  createBank,
} from '@/services/system-settings.service';

// ================================
// 创建银行请求体校验 Schema
// ================================
const createBankSchema = z.object({
  code: z.string().min(2, '银行编码至少2个字符').max(20, '银行编码最多20个字符'),
  name: z.string().min(1, '银行名称不能为空').max(100, '银行名称最多100个字符'),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ================================
// GET /api/admin/banks - 获取银行列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const params = {
        page: parseInt(searchParams.get('page') || '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
        keyword: searchParams.get('keyword') || undefined,
        isActive: searchParams.get('isActive') === 'true'
          ? true
          : searchParams.get('isActive') === 'false'
            ? false
            : undefined,
      };
      
      const result = await getBankList(params);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/banks] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/banks - 创建银行
// ================================
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = createBankSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      const result = await createBank(parseResult.data);
      
      return successResponse(result, '创建银行成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/banks] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
