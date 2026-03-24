/**
 * @file 资金流水列表接口
 * @description GET /api/transactions - 获取用户的资金流水列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第9节 - 资金流水接口
 * @depends 开发文档/02-数据层/02.2-API规范.md 第7.4节 - 交易类型枚举
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.5节 - Transaction表
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/lib/auth';
import { paginatedResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { transactionService, TransactionTypeEnum } from '@/services/transaction.service';

/**
 * 交易类型枚举值数组（用于校验）
 * @description 依据：02.2-API规范.md 第7.4节 - TransactionType枚举
 */
const TransactionTypes = [
  'RECHARGE',
  'WITHDRAW_FREEZE',
  'WITHDRAW_SUCCESS',
  'WITHDRAW_REFUND',
  'PURCHASE',
  'INCOME',
  'REFERRAL_COMMISSION',
  'SIGN_IN',
  'ACTIVITY_REWARD',
  'REGISTER_BONUS',
  'ADMIN_ADD',
  'ADMIN_DEDUCT',
] as const;

/**
 * 日期格式校验正则（YYYY-MM-DD）
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 查询参数校验 Schema
 * @description 依据：02.3-前端API接口清单.md 第9.1节
 *   - page: 页码，从1开始
 *   - pageSize: 每页条数，默认20，最大100
 *   - type: 交易类型（可选）
 *   - startDate: 开始日期（可选，格式：YYYY-MM-DD）
 *   - endDate: 结束日期（可选，格式：YYYY-MM-DD）
 */
const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(TransactionTypes).optional(),
  startDate: z
    .string()
    .regex(dateRegex, 'صيغة التاريخ غير صحيحة، استخدم YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(dateRegex, 'صيغة التاريخ غير صحيحة، استخدم YYYY-MM-DD')
    .optional(),
});

/**
 * 获取资金流水列表
 * @description 
 *   返回用户的资金流水记录，支持分页和筛选
 *   - 支持按交易类型筛选（type）
 *   - 支持按时间范围筛选（startDate、endDate）
 *   - amount 带正负号格式化（"+50.00"）
 *   - 返回 typeName、balanceAfter、relatedOrderNo
 * 
 * @example
 *   GET /api/transactions?page=1&pageSize=20
 *   GET /api/transactions?type=INCOME&startDate=2026-01-01&endDate=2026-01-31
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
    if (!payload || !payload.userId) {
      throw Errors.unauthorized();
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      type: searchParams.get('type') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    // 3. 校验参数
    const parseResult = QuerySchema.safeParse(query);
    if (!parseResult.success) {
      // 提取第一个错误信息
      const firstError = parseResult.error.errors[0];
      throw Errors.validationError(firstError.message || 'صيغة المعلمات غير صحيحة');
    }

    const { page, pageSize, type, startDate, endDate } = parseResult.data;

    // 4. 校验日期范围逻辑
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) {
        throw Errors.validationError('تاريخ البداية لا يمكن أن يكون أكبر من تاريخ النهاية');
      }
    }

    // 5. 查询流水列表
    const result = await transactionService.getTransactions({
      userId: payload.userId,
      page,
      pageSize,
      type,
      startDate,
      endDate,
    });

    // 6. 返回分页响应（依据：02.2-API规范.md 第2.3节 - 分页响应格式）
    return paginatedResponse(result.list, result.pagination);
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[Transactions] 查询资金流水失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}
