/**
 * @file 动画配置接口
 * @description GET /api/config/animation - 获取动画配置（全局开关、速度、弹簧参数）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.9节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.15节 - AnimationConfig表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/config/animation
 * 获取动画配置
 * 
 * @description 返回动画配置，包括：
 * - animationEnabled: 全局动画开关
 * - animationSpeed: 动画速度倍率
 * - reducedMotion: 减弱动画模式
 * - celebrationEffect: 庆祝效果开关（签到成功、领取奖励）
 * - pageTransition: 页面过渡动画
 * - skeletonLoading: 骨架屏加载
 * - pullToRefresh: 下拉刷新动画
 * 
 * @returns 动画配置数据
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "animationEnabled": true,
 *     "animationSpeed": 1.0,
 *     "reducedMotion": false,
 *     "celebrationEffect": true,
 *     "pageTransition": true,
 *     "skeletonLoading": true,
 *     "pullToRefresh": true
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取动画配置
    const config = await pageConfigService.getAnimationConfig();

    return successResponse(config);
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/config/animation] 获取动画配置失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
