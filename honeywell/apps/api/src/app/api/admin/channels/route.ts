/**
 * @file 支付通道列表接口
 * @description GET /api/admin/channels - 获取所有支付通道列表（含状态、成功率）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9.1节 - 通道列表
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { channelService } from '@/services/channel.service';
import { successResponse, errorResponse } from '@/lib/response';

/**
 * GET /api/admin/channels
 * @description 获取支付通道列表
 * @returns 通道列表（含状态、成功率、今日充值提现）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const result = await channelService.getList();
      // 直接返回 successResponse，它已经是 NextResponse.json() 的结果
      return successResponse(result);
    } catch (error) {
      console.error('[Admin Channels] 获取通道列表失败:', error);
      // 直接返回 errorResponse，它已经是 NextResponse.json() 的结果
      return errorResponse('INTERNAL_ERROR', '获取通道列表失败', 500);
    }
  });
}
