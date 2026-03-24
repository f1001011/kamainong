/**
 * @file 用户列表API
 * @description 后台管理端 - 获取用户列表（支持多条件筛选）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3.1节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getUserList, UserListParams } from '@/services/user.service';
import { UserStatus } from '@honeywell/database';

/**
 * 请求参数校验模式
 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  keyword: z.string().optional(),
  vipLevel: z.string().optional(), // 逗号分隔的数字列表
  svipLevel: z.string().optional(), // 逗号分隔的数字列表
  status: z.enum(['ACTIVE', 'BANNED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  inviterId: z.coerce.number().optional(),
  inviterPhone: z.string().optional(),
  registerIp: z.string().optional(),
  balanceMin: z.coerce.number().optional(),
  balanceMax: z.coerce.number().optional(),
  hasPosition: z.string().optional(), // "true" | "false"
  hasPurchasedPo0: z.string().optional(), // "true" | "false"
  lastLoginStart: z.string().optional(),
  lastLoginEnd: z.string().optional(),
});

/**
 * GET /api/admin/users
 * @description 获取用户列表
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      const rawParams = Object.fromEntries(searchParams.entries());
      
      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validationResult.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const params = validationResult.data;

      // 转换参数
      const serviceParams: UserListParams = {
        page: params.page,
        pageSize: params.pageSize,
        keyword: params.keyword,
        status: params.status as UserStatus | undefined,
        startDate: params.startDate,
        endDate: params.endDate,
        inviterId: params.inviterId,
        inviterPhone: params.inviterPhone,
        registerIp: params.registerIp,
        balanceMin: params.balanceMin,
        balanceMax: params.balanceMax,
        lastLoginStart: params.lastLoginStart,
        lastLoginEnd: params.lastLoginEnd,
      };

      // 解析 vipLevel 数组
      if (params.vipLevel) {
        serviceParams.vipLevel = params.vipLevel.split(',').map(Number).filter(n => !isNaN(n));
      }

      // 解析 svipLevel 数组
      if (params.svipLevel) {
        serviceParams.svipLevel = params.svipLevel.split(',').map(Number).filter(n => !isNaN(n));
      }

      // 解析布尔值
      if (params.hasPosition) {
        serviceParams.hasPosition = params.hasPosition === 'true';
      }
      if (params.hasPurchasedPo0) {
        serviceParams.hasPurchasedPo0 = params.hasPurchasedPo0 === 'true';
      }

      const result = await getUserList(serviceParams);
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      console.error('[GET /api/admin/users] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '获取用户列表失败', 500);
    }
  });
}
