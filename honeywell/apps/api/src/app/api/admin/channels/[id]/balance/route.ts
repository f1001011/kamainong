/**
 * @file 支付通道余额查询接口
 * @description GET /api/admin/channels/:id/balance - 查询支付通道余额
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9.4节 - 查询通道余额
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { channelService } from '@/services/channel.service';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/admin/channels/:id/balance
 * @description 查询支付通道的可用余额
 * @param id 通道ID
 * @returns 余额信息（balance, message）
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

      // 查询余额
      const result = await channelService.queryBalance(channelId);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Admin Channel Balance] 查询通道余额失败:', error);
      return errorResponse('INTERNAL_ERROR', '查询通道余额失败', 500);
    }
  });
}
