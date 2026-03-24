/**
 * @file 渠道链接列表与创建API
 * @description GET 渠道列表（含统计）、POST 创建渠道
 * @depends 渠道链接.md 第4.3.1、4.3.2节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getChannelList, createChannel } from '@/services/marketing-channel.service';
import { BusinessError } from '@/lib/errors';

// ================================
// GET /api/admin/marketing-channels - 渠道列表
// ================================

/** 列表查询参数校验 */
const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  keyword: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

/**
 * 获取渠道列表（含统计数据）
 * @description 依据：渠道链接.md 第4.3.1节
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(req.url);
      const rawParams = {
        page: searchParams.get('page') ?? undefined,
        pageSize: searchParams.get('pageSize') ?? undefined,
        keyword: searchParams.get('keyword') ?? undefined,
        isActive: searchParams.get('isActive') ?? undefined,
      };

      const validationResult = querySchema.safeParse(rawParams);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const { page, pageSize, keyword, isActive } = validationResult.data;

      // 调用服务
      const result = await getChannelList({
        page,
        pageSize,
        keyword,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/marketing-channels] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/marketing-channels - 创建渠道
// ================================

/** 创建渠道请求体校验 */
const createSchema = z.object({
  name: z.string().min(1, '渠道名称不能为空').max(100, '渠道名称不能超过100字符'),
  userId: z.number().int().positive('用户ID必须为正整数'),
  remark: z.string().max(500).optional(),
});

/**
 * 创建渠道
 * @description 依据：渠道链接.md 第4.3.2节
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();

      // 验证参数
      const validationResult = createSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

      // 调用服务
      const channel = await createChannel(validationResult.data, adminId, ip);

      return successResponse(channel, '渠道创建成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/marketing-channels] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
