/**
 * @file 页面内容接口
 * @description GET /api/pages/:pageId - 获取页面内容
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第16节 - 页面内容接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md PageContent表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageContentService } from '@/services/page-content.service';
import { BusinessError } from '@/lib/errors';

/**
 * 路由参数类型
 */
interface RouteParams {
  params: Promise<{ pageId: string }>;
}

/**
 * GET /api/pages/:pageId
 * 获取页面内容
 *
 * @description 根据 pageId 获取对应的页面内容
 * - 不需要认证（公开接口）
 * - 支持的 pageId: about_us（关于我们）
 * - 返回 content JSON + updatedAt
 *
 * @param pageId 页面标识
 * @returns 页面内容
 *
 * @example
 * // GET /api/pages/about_us
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "pageId": "about_us",
 *     "content": {
 *       "hero": {
 *         "title": "Su socio de confianza en inversiones",
 *         "subtitle": "Brindando servicios financieros de calidad desde 2024",
 *         "logoUrl": "/images/logo.png",
 *         "backgroundImage": "/images/bg.jpg"
 *       },
 *       "sections": [
 *         {
 *           "id": "intro",
 *           "type": "text",
 *           "content": "<p>Somos una plataforma líder en...</p>"
 *         }
 *       ]
 *     },
 *     "updatedAt": "2026-02-03T10:30:00.000Z"
 *   }
 * }
 *
 * // 错误响应 - 页面不存在
 * {
 *   "success": false,
 *   "error": {
 *     "code": "PAGE_NOT_FOUND",
 *     "message": "页面内容不存在"
 *   }
 * }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 获取路由参数
    const { pageId } = await params;

    // 获取页面内容
    const pageContent = await pageContentService.getPageContent(pageId);

    return successResponse(pageContent);
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(
        error.code,
        error.message,
        error.httpStatus,
        error.extra
      );
    }

    // 处理未知错误
    console.error('[GET /api/pages/:pageId] 获取页面内容失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
