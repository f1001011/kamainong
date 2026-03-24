/**
 * @file 银行编码唯一性检查 API
 * @description GET /api/admin/banks/check-code - 检查银行编码是否已存在
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.13节
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { checkBankCodeExists } from '@/services/system-settings.service';

// ================================
// GET /api/admin/banks/check-code - 检查银行编码唯一性
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const code = searchParams.get('code');
      
      if (!code || code.trim() === '') {
        return errorResponse('VALIDATION_ERROR', '银行编码不能为空', 400);
      }
      
      const exists = await checkBankCodeExists(code);
      
      // 依据文档规范，只返回 exists 字段
      return successResponse(
        { exists },
        exists ? '银行编码已存在' : '银行编码可用'
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/banks/check-code] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
