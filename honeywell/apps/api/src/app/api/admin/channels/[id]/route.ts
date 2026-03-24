/**
 * @file 支付通道详情与更新接口
 * @description GET/PUT /api/admin/channels/:id - 获取通道详情 / 更新通道配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9.2节 - 通道详情与配置更新
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { channelService } from '@/services/channel.service';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';

/**
 * 更新通道配置的参数验证
 */
const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  merchantId: z.string().min(1).max(100).optional(),
  paySecretKey: z.string().min(1).optional(),
  transferSecretKey: z.string().min(1).optional(),
  gatewayUrl: z.string().url().optional(),
  bankCode: z.string().max(50).optional().nullable(),
  payType: z.string().max(50).optional().nullable(),
  // 通道费率（百分比，如 "3.50" 表示 3.50%）
  payFeeRate: z.string().regex(/^\d+(\.\d{1,2})?$/, '费率格式错误').optional().nullable(),
  transferFeeRate: z.string().regex(/^\d+(\.\d{1,2})?$/, '费率格式错误').optional().nullable(),
  payEnabled: z.boolean().optional(),
  transferEnabled: z.boolean().optional(),
  callbackIps: z.string().max(1000).optional().nullable(),  // 回调IP白名单，逗号分隔
  minAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, '金额格式错误').optional().nullable(),
  maxAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, '金额格式错误').optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  remark: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/admin/channels/:id
 * @description 获取通道详情（密钥脱敏显示）
 * @param id 通道ID
 * @returns 通道详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const channelId = parseInt(id, 10);

      if (isNaN(channelId) || channelId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的通道ID', 400);
      }

      const channel = await channelService.getDetail(channelId);
      return successResponse(channel);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Admin Channel Detail] 获取通道详情失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取通道详情失败', 500);
    }
  });
}

/**
 * PUT /api/admin/channels/:id
 * @description 更新通道配置
 * @param id 通道ID
 * @body 通道配置参数
 * @returns 更新后的通道详情
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const channelId = parseInt(id, 10);

      if (isNaN(channelId) || channelId <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的通道ID', 400);
      }

      // 解析并验证请求体
      const body = await request.json();
      const parseResult = updateChannelSchema.safeParse(body);

      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', `参数错误: ${firstError.path.join('.')} ${firstError.message}`, 400);
      }

      // 更新配置
      const channel = await channelService.updateConfig(channelId, parseResult.data);
      return successResponse(channel, '通道配置更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Admin Channel Update] 更新通道配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '更新通道配置失败', 500);
    }
  });
}
