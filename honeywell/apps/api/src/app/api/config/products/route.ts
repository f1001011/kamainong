/**
 * @file 产品页配置接口
 * @description GET /api/config/products - 获取产品页配置（列表样式、排序方式）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.8节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.14节 - PageConfig表
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { pageConfigService } from '@/services/page-config.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/config/products
 * 获取产品页配置
 * 
 * @description 返回产品页配置，包括：
 * - Tab名称和筛选条件
 * - 默认Tab
 * - 列表布局（single/double/auto）
 * - 卡片样式（standard/compact/large）
 * - VIP角标颜色
 * - 已购买角标文案
 * - 锁定提示文案
 * 
 * @returns 产品页配置数据
 * 
 * @example
 * // 成功响应
 * {
 *   "success": true,
 *   "data": {
 *     "tab1Name": "Productos Po",
 *     "tab1Filter": "PO",
 *     "tab2Name": "Productos VIP",
 *     "tab2Filter": "VIP",
 *     "defaultTab": 1,
 *     "listLayout": "auto",
 *     "cardStyle": "standard",
 *     "vipBadgeColor": "#f97316",
 *     "purchasedBadge": "Adquirido",
 *     "lockedTip": "Requiere VIP{level}"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // 获取产品页配置
    const config = await pageConfigService.getProductsConfig();

    return successResponse(config);
  } catch (error) {
    // 处理业务错误
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus, error.extra);
    }

    // 处理未知错误
    console.error('[GET /api/config/products] 获取产品页配置失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}
