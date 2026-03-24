/**
 * @file 连单奖励活动状态接口
 * @description 获取连单奖励活动状态，包含前置条件、已购VIP产品和各阶梯状态
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.4节 - 连单奖励状态
 * @depends 开发文档/开发文档.md 第9.3节 - 连单奖励活动
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';
import { activityService } from '@/services/activity.service';

/**
 * GET /api/activities/collection
 * @description 获取连单奖励活动状态
 * @auth 需要登录
 * @returns {CollectionActivityStatus} 连单奖励活动状态
 * 
 * @example 响应示例
 * {
 *   "success": true,
 *   "data": {
 *     "activityName": "Bono por coleccion",
 *     "activityDesc": "Coleccione productos VIP y gane recompensas",
 *     "prerequisite": {
 *       "description": "قم بالإيداع وشراء منتج",
 *       "isMet": true
 *     },
 *     "purchasedProducts": [
 *       { "id": 1, "name": "VIP1", "icon": "/images/products/vip1.png" },
 *       { "id": 2, "name": "VIP2", "icon": "/images/products/vip2.png" }
 *     ],
 *     "tiers": [
 *       {
 *         "tier": 1,
 *         "name": "Principiante",
 *         "requiredProducts": [
 *           { "id": 1, "name": "VIP1", "isPurchased": true },
 *           { "id": 2, "name": "VIP2", "isPurchased": true }
 *         ],
 *         "reward": "25.00",
 *         "status": "CLAIMABLE"
 *       },
 *       {
 *         "tier": 2,
 *         "name": "Intermedio",
 *         "requiredProducts": [
 *           { "id": 1, "name": "VIP1", "isPurchased": true },
 *           { "id": 2, "name": "VIP2", "isPurchased": true },
 *           { "id": 3, "name": "VIP3", "isPurchased": false }
 *         ],
 *         "reward": "60.00",
 *         "status": "LOCKED"
 *       }
 *     ]
 *   }
 * }
 * 
 * @error ACTIVITY_NOT_FOUND - 活动不存在
 * @error ACTIVITY_NOT_ACTIVE - 活动已关闭
 */
export async function GET(request: NextRequest): Promise<Response> {
  return withAuth(request, async (_req, userId) => {
    const status = await activityService.getCollectionActivityStatus(userId);
    
    return successResponse(status);
  });
}
