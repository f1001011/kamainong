/**
 * @file 客服链接接口
 * @description GET /api/service-links - 获取客服链接列表（WhatsApp、Telegram等）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.10节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 - GlobalConfig表 service_links 配置
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/service-links
 * 获取客服链接列表
 * 
 * @description 返回客服链接列表，从 GlobalConfig 的 service_links 配置获取：
 * - name: 显示名称
 * - icon: 图标URL
 * - url: 跳转链接
 * 
 * @returns 客服链接列表
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "list": [
 *       { "name": "在线客服", "icon": "/images/service/livechat.png", "url": "https://livechat..." },
 *       { "name": "Telegram群组", "icon": "/images/service/telegram.png", "url": "https://t.me/lendlease_group" },
 *       { "name": "WhatsApp", "icon": "/images/service/whatsapp.png", "url": "https://wa.me/..." }
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取客服链接列表
    const serviceLinks = await pageConfigService.getServiceLinks();

    return successResponse({ list: serviceLinks });
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/service-links] 获取客服链接列表失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
