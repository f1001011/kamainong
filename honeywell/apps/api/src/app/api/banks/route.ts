/**
 * @file 银行列表接口
 * @description GET /api/banks - 获取银行列表（仅返回启用的银行，按sortOrder排序）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.5节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.12节 - Bank表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/banks
 * 获取银行列表
 * 
 * @description 返回启用的银行列表：
 * - isActive = true
 * - 按 sortOrder 升序排列
 * - 仅返回 code 和 name 字段
 * 
 * @returns 银行列表
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       { "code": "MAD001", "name": "Attijariwafa Bank" },
 *       { "code": "MAD002", "name": "BMCE Bank of Africa" },
 *       { "code": "MAD003", "name": "Banque Populaire" },
 *       { "code": "MAD004", "name": "CIH Bank" },
 *       { "code": "MAD005", "name": "BMCI" },
 *       { "code": "MAD006", "name": "Crédit du Maroc" }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取银行列表
    const banks = await pageConfigService.getBanks();

    return successResponse({ list: banks });
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/banks] 获取银行列表失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
