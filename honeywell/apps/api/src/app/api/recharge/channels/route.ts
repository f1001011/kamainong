/**
 * @file 充值通道列表接口
 * @description GET /api/recharge/channels - 获取可用的充值通道列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第5.1节 - 获取充值通道
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { rechargeService } from '@/services/recharge.service';

/**
 * 通道数据类型
 */
interface ChannelData {
  id: number;
  code: string;
  name: string;
  minAmount: { toString(): string } | null;
  maxAmount: { toString(): string } | null;
  remark: string | null;
}

/**
 * 获取充值通道列表
 * @description 返回所有启用代收功能的支付通道及充值配置
 * 依据：02.3-前端API接口清单.md 第5.1节
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 验证用户身份
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      throw Errors.unauthorized();
    }

    const payload = await verifyToken(token);
    if (!payload) {
      throw Errors.unauthorized();
    }

    // 2. 获取可用充值通道和配置
    const { channels, config } = await rechargeService.getChannelsWithConfig();

    // 3. 格式化返回数据（依据：02.3-前端API接口清单.md 第5.1节）
    const formattedChannels = channels.map((channel: ChannelData) => ({
      id: channel.id,
      code: channel.code,
      name: channel.name,
    }));

    return successResponse({
      channels: formattedChannels,
      presets: config.rechargePresets,
      minAmount: config.rechargeMinAmount.toFixed(2),
      maxAmount: config.rechargeMaxAmount.toFixed(2),
      tips: config.rechargePageTips,
    });
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[RechargeChannels] 获取通道失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
