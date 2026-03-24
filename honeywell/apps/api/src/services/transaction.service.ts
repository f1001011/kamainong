/**
 * @file 资金流水服务
 * @description 处理资金流水查询、筛选等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第9节 - 资金流水接口
 * @depends 开发文档/02-数据层/02.2-API规范.md 第7.4节 - 交易类型枚举
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.5节 - Transaction表
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma, TransactionType } from '@honeywell/database';

/**
 * 交易类型枚举值（依据：02.2-API规范.md 第7.4节）
 */
export const TransactionTypeEnum = {
  RECHARGE: 'RECHARGE',
  WITHDRAW_FREEZE: 'WITHDRAW_FREEZE',
  WITHDRAW_SUCCESS: 'WITHDRAW_SUCCESS',
  WITHDRAW_REFUND: 'WITHDRAW_REFUND',
  PURCHASE: 'PURCHASE',
  INCOME: 'INCOME',
  REFERRAL_COMMISSION: 'REFERRAL_COMMISSION',
  SIGN_IN: 'SIGN_IN',
  ACTIVITY_REWARD: 'ACTIVITY_REWARD',
  REGISTER_BONUS: 'REGISTER_BONUS',
  ADMIN_ADD: 'ADMIN_ADD',
  ADMIN_DEDUCT: 'ADMIN_DEDUCT',
} as const;

/**
 * 交易类型名称映射（中文描述）
 * @description 依据：02.3-前端API接口清单.md 第9.1节
 */
export const TransactionTypeNames: Record<string, string> = {
  RECHARGE: 'إيداع',
  WITHDRAW_FREEZE: 'تجميد السحب',
  WITHDRAW_SUCCESS: 'سحب ناجح',
  WITHDRAW_REFUND: 'استرداد السحب',
  PURCHASE: 'Compra de producto',
  INCOME: 'تم استلام الأرباح',
  REFERRAL_COMMISSION: 'عمولة الإحالة',
  SIGN_IN: 'Bono de check-in',
  ACTIVITY_REWARD: 'Premio de actividad',
  REGISTER_BONUS: 'Bono de registro',
  ADMIN_ADD: 'Ajuste administrativo (suma)',
  ADMIN_DEDUCT: 'Ajuste administrativo (resta)',
};

/**
 * 获取交易类型名称
 * @param type 交易类型
 * @returns 交易类型名称
 */
export function getTransactionTypeName(type: string): string {
  return TransactionTypeNames[type] || type;
}

/**
 * 格式化金额（带正负号）
 * @description 依据：02.3-前端API接口清单.md 第9.1节 - amount 带正负号格式化（"+50.00"）
 * @param amount 金额（Decimal 类型）
 * @returns 格式化后的金额字符串（如 "+50.00" 或 "-50.00"）
 */
export function formatAmountWithSign(amount: Decimal): string {
  const numAmount = amount.toNumber();
  const absAmount = Math.abs(numAmount).toFixed(2);
  
  if (numAmount >= 0) {
    return `+${absAmount}`;
  }
  return `-${absAmount}`;
}

/**
 * 查询参数类型
 */
export interface GetTransactionsParams {
  userId: number;
  page: number;
  pageSize: number;
  type?: string;
  startDate?: string;  // ISO 日期字符串，如 "2026-01-01"
  endDate?: string;    // ISO 日期字符串，如 "2026-01-31"
}

/**
 * 流水项返回结构
 */
export interface TransactionItem {
  id: number;
  type: string;
  typeName: string;
  amount: string;           // 带正负号格式化（"+50.00"）
  balanceAfter: string;
  relatedOrderNo: string | null;
  remark: string | null;
  createdAt: string;        // ISO8601 格式
}

/**
 * 分页信息
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 资金流水服务类
 */
export class TransactionService {
  /**
   * 获取用户资金流水列表
   * @description 依据：02.3-前端API接口清单.md 第9.1节
   * @param params 查询参数
   * @returns 流水列表和分页信息
   */
  async getTransactions(params: GetTransactionsParams): Promise<{
    list: TransactionItem[];
    pagination: PaginationInfo;
  }> {
    const { userId, page, pageSize, type, startDate, endDate } = params;

    // 构建查询条件
    const where: Prisma.TransactionWhereInput = { userId };

    // 类型筛选
    if (type) {
      where.type = type as TransactionType;
    }

    // 时间范围筛选（依据：02.3-前端API接口清单.md - startDate, endDate 参数）
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        // 开始日期：当天 00:00:00
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      
      if (endDate) {
        // 结束日期：当天 23:59:59.999
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // 并行查询列表和总数（性能优化）
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },  // 按时间倒序（最新的在前面）
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          amount: true,
          balanceAfter: true,
          relatedOrderNo: true,
          remark: true,
          createdAt: true,
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    // 格式化返回数据（依据：02.3-前端API接口清单.md 第9.1节）
    const list: TransactionItem[] = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      typeName: getTransactionTypeName(tx.type),
      amount: formatAmountWithSign(tx.amount),
      balanceAfter: tx.balanceAfter.toFixed(2),
      relatedOrderNo: tx.relatedOrderNo,
      remark: tx.remark,
      createdAt: tx.createdAt.toISOString(),
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

// 单例导出
export const transactionService = new TransactionService();
