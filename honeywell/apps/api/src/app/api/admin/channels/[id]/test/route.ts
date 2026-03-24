/**
 * @file 支付通道连接测试接口
 * @description POST /api/admin/channels/:id/test - 测试支付通道连接
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9.3节 - 测试通道连接
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { channelService } from '@/services/channel.service';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';

/**
 * POST /api/admin/channels/:id/test
 * @description 测试支付通道连接，返回连接状态和响应时间
 * @param id 通道ID
 * @returns 测试结果（success, responseTime, message）
 */
export async function POST(
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

      // 执行连接测试
      const result = await channelService.testConnection(channelId);

      return successResponse({
        success: result.success,
        responseTime: result.responseTime,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[Admin Channel Test] 测试通道连接失败:', error);
      return errorResponse('INTERNAL_ERROR', '测试通道连接失败', 500);
    }
  });
}
