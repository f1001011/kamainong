/**
 * @file 个人中心配置接口
 * @description GET /api/config/profile - 获取个人中心配置（菜单项显示开关、排序）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.7节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.14节 - PageConfig表
 * 
 * @auth 需要认证（依据：02.3-前端API接口清单.md 表格中认证列为"是"）
 */

import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { withAuth } from '@/middleware/auth';

/**
 * GET /api/config/profile
 * 获取个人中心配置
 * 
 * @description 返回个人中心菜单配置，包括：
 * - 菜单项列表（key、icon、route、badge、visible、order）
 * - 仅返回 visible=true 的菜单项
 * - 按 order 排序
 * 
 * @auth 需要登录认证
 * 
 * @returns 个人中心配置数据
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "menuItems": [
 *       { "key": "positions", "icon": "RiLineChartFill", "route": "/positions", "badge": null, "visible": true, "order": 1 },
 *       { "key": "recharge_history", "icon": "RiHistoryFill", "route": "/recharge/records", "badge": null, "visible": true, "order": 2 },
 *       ...
 *     ]
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  // 使用 withAuth 中间件进行认证验证
  // 依据：02.3-前端API接口清单.md 表格中 /api/config/profile 的认证列为"是"
  return withAuth(request, async (_req, _userId) => {
    // 获取个人中心配置
    const config = await pageConfigService.getProfileConfig();

    return successResponse(config);
  });
}
