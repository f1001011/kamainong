/**
 * @file 轮播Banner接口
 * @description GET /api/banners - 获取轮播Banner列表（检查有效期，按sortOrder排序）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.8节 - Banner表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/banners
 * 获取轮播Banner列表
 * 
 * @description 返回有效的Banner列表：
 * - isActive = true
 * - startAt 为空或 <= 当前时间
 * - endAt 为空或 >= 当前时间
 * - 按 sortOrder 降序排列
 * 
 * @returns Banner列表
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       {
 *         "id": 1,
 *         "imageUrl": "/images/banner/1.jpg",
 *         "linkType": "PRODUCT",
 *         "linkUrl": null,
 *         "productId": 1
 *       },
 *       {
 *         "id": 2,
 *         "imageUrl": "/images/banner/2.jpg",
 *         "linkType": "EXTERNAL",
 *         "linkUrl": "https://example.com",
 *         "productId": null
 *       }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取轮播Banner列表
    const banners = await pageConfigService.getBanners();

    return successResponse({ list: banners });
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/banners] 获取Banner列表失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
