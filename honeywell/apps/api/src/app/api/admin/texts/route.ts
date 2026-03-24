/**
 * @file 文案列表与批量更新 API
 * @description GET /api/admin/texts - 获取文案列表
 *              PUT /api/admin/texts - 批量更新文案
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.3~12.5节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, paginatedResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import {
  getTextList,
  batchUpdateTexts,
} from '@/services/system-settings.service';

// ================================
// 批量更新文案请求体校验 Schema
// ================================
const batchUpdateSchema = z.object({
  texts: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length > 0,
    { message: '至少需要一条文案更新' }
  ),
});

// ================================
// GET /api/admin/texts - 获取文案列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const params = {
        page: parseInt(searchParams.get('page') || '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '50', 10),
        keyword: searchParams.get('keyword') || undefined,
        category: searchParams.get('category') || undefined,
      };
      
      const result = await getTextList(params);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/texts] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/texts - 批量更新文案
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      
      // 校验请求体
      const parseResult = batchUpdateSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      // 获取管理员名称
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { username: true },
      });
      const adminName = admin?.username || 'Unknown';
      
      const result = await batchUpdateTexts(
        parseResult.data.texts,
        adminId,
        adminName
      );
      
      return successResponse(result, '批量更新文案成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/texts] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
