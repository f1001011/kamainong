/**
 * @file 文案版本历史 API
 * @description GET /api/admin/texts/versions - 获取文案版本历史
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.8节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { paginatedResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { getTextVersions } from '@/services/system-settings.service';

// ================================
// GET /api/admin/texts/versions - 获取文案版本历史
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      const params = {
        page: parseInt(searchParams.get('page') || '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
        textKey: searchParams.get('textKey') || undefined,
        operatorId: searchParams.get('operatorId')
          ? parseInt(searchParams.get('operatorId')!, 10)
          : undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      };
      
      const result = await getTextVersions(params);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/texts/versions] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
