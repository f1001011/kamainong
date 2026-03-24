/**
 * @file 银行卡删除接口
 * @description 处理银行卡的删除操作
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第7.3节 - 删除银行卡
 * 
 * 接口：
 * - DELETE /api/bank-cards/:id - 删除银行卡（软删除）
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { bankCardService } from '@/services/bank-card.service';

// ================================
// 路由参数类型
// ================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ================================
// DELETE /api/bank-cards/:id - 删除银行卡
// ================================

/**
 * 删除银行卡（软删除）
 * @description 依据：02.3-前端API接口清单.md 第7.3节
 * 
 * 业务规则：
 * 1. 银行卡必须属于当前用户
 * 2. 银行卡不能有进行中的提现订单（PENDING_REVIEW 状态）
 * 3. 使用软删除机制（设置 isDeleted=true）
 * 
 * 响应格式：
 * {
 *   "success": true,
 *   "message": "Tarjeta bancaria eliminada"
 * }
 * 
 * 错误码：
 * - BANK_CARD_NOT_FOUND: 银行卡不存在
 * - BANK_CARD_IN_USE: 银行卡有进行中的提现
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  return withAuth(request, async (_req, userId) => {
    // 1. 解析银行卡ID
    const { id } = await context.params;
    const cardId = parseInt(id, 10);

    if (isNaN(cardId) || cardId <= 0) {
      return errorResponse('VALIDATION_ERROR', 'معرف البطاقة البنكية غير صالح', 400);
    }

    // 2. 调用服务删除银行卡
    // 业务错误由 withAuth 中间件统一捕获处理
    await bankCardService.deleteBankCard(userId, cardId);

    // 3. 返回成功响应（西班牙语提示）
    return successResponse(null, 'Tarjeta bancaria eliminada');
  });
}
