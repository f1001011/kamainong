/**
 * @file 获取可用代付通道列表
 * @description GET /api/admin/withdraw-orders/transfer-channels
 * 
 * 返回所有启用代付的支付通道，供管理员在重试代付时选择
 * 支持 excludeChannelId 参数标记当前失败通道
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminWithdrawService } from '@/services/admin-withdraw.service';

/**
 * 获取可用代付通道列表
 * @route GET /api/admin/withdraw-orders/transfer-channels
 * @auth 需要管理员登录
 * @query excludeChannelId - 可选，排除的通道ID（标记为上次失败通道）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const excludeChannelId = searchParams.get('excludeChannelId');

      const channels = await adminWithdrawService.getAvailableTransferChannels(
        excludeChannelId ? parseInt(excludeChannelId) : undefined
      );

      return successResponse({ list: channels });
    } catch (error) {
      console.error('[Transfer Channels Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取代付通道列表失败');
    }
  });
}
