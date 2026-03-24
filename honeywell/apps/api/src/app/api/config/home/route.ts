/**
 * @file 首页配置接口
 * @description GET /api/config/home - 获取首页配置（模块开关、快捷入口、推荐产品ID列表）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.6节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.14节 - PageConfig表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/config/home
 * 获取首页配置
 * 
 * @description 返回首页模块配置，包括：
 * - 推荐产品开关和产品ID列表
 * - 快捷入口配置
 * - 今日收益显示开关
 * - 签到入口显示开关
 * - Banner显示开关
 * - 跑马灯显示开关
 * 
 * @returns 首页配置数据
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "recommendEnabled": true,
 *     "recommendTitle": "Recomendados",
 *     "recommendDisplayMode": "list",
 *     "recommendProductIds": [1, 2, 3],
 *     "recommendMaxCount": 6,
 *     "quickEntries": [...],
 *     "todayIncomeVisible": true,
 *     "signInEntryVisible": true,
 *     "bannerVisible": true,
 *     "marqueeVisible": false
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取首页配置
    const config = await pageConfigService.getHomeConfig();

    return successResponse(config);
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/config/home] 获取首页配置失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
