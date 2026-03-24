/**
 * @file 收益发放管理服务
 * @description 后台管理端收益发放记录管理相关功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第18节 - 收益发放管理接口
 *
 * 核心功能：
 * 1. 收益发放记录查询（多条件筛选）
 * 2. 收益异常列表查询（仅返回 FAILED 状态）
 * 3. 手动补发收益
 * 4. 标记异常已处理
 * 5. 批量补发
 * 6. 批量标记处理
 *
 * 业务规则：
 * - 异常列表仅返回 status=FAILED 的记录
 * - 补发时需检查用户状态（封禁用户不发放）
 * - 标记处理时记录操作人和备注
 */

import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { Prisma, IncomeStatus, UserStatus } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/** 收益记录列表查询参数 */
export interface IncomeRecordListParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  userPhone?: string;
  positionOrderNo?: string;
  status?: IncomeStatus;
  startDate?: string;
  endDate?: string;
}

/** 异常列表查询参数 */
export interface IncomeExceptionListParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  userPhone?: string;
  positionOrderNo?: string;
  productId?: number;
  startDate?: string;
  endDate?: string;
  isHandled?: boolean;
}

/** 批量操作结果 */
export interface BatchOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: { code: string; message: string };
  }>;
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 */
function formatAmount(value: Prisma.Decimal | number | null): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

// ================================
// 收益发放管理服务类
// ================================

class AdminIncomeRecordService {
  /**
   * 获取收益发放记录列表
   * @description 依据：02.4-后台API接口清单.md 第18.1节
   * 筛选条件：userId、userPhone、positionOrderNo、status、startDate、endDate
   */
  async getRecordList(params: IncomeRecordListParams) {
    const {
      page = 1,
      pageSize = 20,
      userId,
      userPhone,
      positionOrderNo,
      status,
      startDate,
      endDate,
    } = params;

    // 构建查询条件
    const where: Prisma.IncomeRecordWhereInput = {};

    // 用户ID筛选
    if (userId) {
      where.userId = userId;
    }

    // 用户手机号筛选
    if (userPhone) {
      const user = await prisma.user.findFirst({
        where: { phone: { contains: userPhone } },
        select: { id: true },
      });
      if (user) {
        where.userId = user.id;
      } else {
        // 用户不存在，返回空结果
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
          summary: {
            totalSettled: '0.00',
            pendingCount: 0,
            failedCount: 0,
          },
        };
      }
    }

    // 持仓订单号筛选
    if (positionOrderNo) {
      const positionOrder = await prisma.positionOrder.findFirst({
        where: { orderNo: { contains: positionOrderNo } },
        select: { id: true },
      });
      if (positionOrder) {
        where.positionId = positionOrder.id;
      } else {
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
          summary: {
            totalSettled: '0.00',
            pendingCount: 0,
            failedCount: 0,
          },
        };
      }
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 时间范围筛选（基于 scheduleAt 字段）
    if (startDate || endDate) {
      where.scheduleAt = {};
      if (startDate) {
        where.scheduleAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.scheduleAt.lt = end;
      }
    }

    // 并行查询列表、总数和统计
    const [records, total, settledSum, pendingCount, failedCount] =
      await Promise.all([
        prisma.incomeRecord.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { scheduleAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                nickname: true,
                avatar: true,
                vipLevel: true,
                status: true,
              },
            },
            position: {
              select: {
                id: true,
                orderNo: true,
                productId: true,
                product: {
                  select: { name: true },
                },
              },
            },
          },
        }),
        prisma.incomeRecord.count({ where }),
        // 已发放总金额（全局统计）
        prisma.incomeRecord.aggregate({
          where: { status: 'SETTLED' },
          _sum: { amount: true },
        }),
        // 待发放数量（全局统计）
        prisma.incomeRecord.count({
          where: { status: 'PENDING' },
        }),
        // 失败数量（全局统计）
        prisma.incomeRecord.count({
          where: { status: 'FAILED' },
        }),
      ]);

    // 格式化返回数据
    const list = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userPhone: record.user.phone,
      userNickname: record.user.nickname,
      userAvatarUrl: record.user.avatar,
      userVipLevel: record.user.vipLevel,
      userStatus: record.user.status,
      positionOrderId: record.positionId,
      positionOrderNo: record.position.orderNo,
      productId: record.position.productId,
      productName: record.position.product.name,
      settleSequence: record.settleSequence,
      amount: formatAmount(record.amount),
      status: record.status,
      scheduleAt: record.scheduleAt.toISOString(),
      settledAt: record.settledAt?.toISOString() || null,
      retryCount: record.retryCount,
      lastError: record.lastError,
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        totalSettled: formatAmount(settledSum._sum.amount),
        pendingCount,
        failedCount,
      },
    };
  }

  /**
   * 获取收益异常列表
   * @description 依据：02.4-后台API接口清单.md 第18.2节
   * 仅返回 status=FAILED 的记录
   */
  async getExceptionList(params: IncomeExceptionListParams) {
    const {
      page = 1,
      pageSize = 20,
      userId,
      userPhone,
      positionOrderNo,
      productId,
      startDate,
      endDate,
      isHandled,
    } = params;

    // 构建查询条件，固定 status=FAILED
    const where: Prisma.IncomeRecordWhereInput = {
      status: 'FAILED',
    };

    // 用户ID筛选
    if (userId) {
      where.userId = userId;
    }

    // 用户手机号筛选
    if (userPhone) {
      const user = await prisma.user.findFirst({
        where: { phone: { contains: userPhone } },
        select: { id: true },
      });
      if (user) {
        where.userId = user.id;
      } else {
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
          summary: {
            unhandledCount: 0,
            totalFailedAmount: '0.00',
          },
        };
      }
    }

    // 持仓订单号筛选
    if (positionOrderNo) {
      const positionOrder = await prisma.positionOrder.findFirst({
        where: { orderNo: { contains: positionOrderNo } },
        select: { id: true },
      });
      if (positionOrder) {
        where.positionId = positionOrder.id;
      } else {
        return {
          list: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
          summary: {
            unhandledCount: 0,
            totalFailedAmount: '0.00',
          },
        };
      }
    }

    // 产品ID筛选
    if (productId) {
      where.position = {
        productId,
      };
    }

    // 时间范围筛选
    if (startDate || endDate) {
      where.scheduleAt = {};
      if (startDate) {
        where.scheduleAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.scheduleAt.lt = end;
      }
    }

    // 是否已处理筛选
    if (isHandled !== undefined) {
      where.isHandled = isHandled;
    }

    // 并行查询
    const [records, total, unhandledCount, failedAmountSum] = await Promise.all(
      [
        prisma.incomeRecord.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { scheduleAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                phone: true,
                nickname: true,
                avatar: true,
                vipLevel: true,
                status: true,
              },
            },
            position: {
              select: {
                id: true,
                orderNo: true,
                productId: true,
                product: {
                  select: { name: true },
                },
              },
            },
          },
        }),
        prisma.incomeRecord.count({ where }),
        // 未处理数量
        prisma.incomeRecord.count({
          where: { status: 'FAILED', isHandled: false },
        }),
        // 失败金额总计
        prisma.incomeRecord.aggregate({
          where: { status: 'FAILED' },
          _sum: { amount: true },
        }),
      ]
    );

    // 获取处理人信息（批量查询）
    const handlerIds = [
      ...new Set(records.filter((r) => r.handledBy).map((r) => r.handledBy!)),
    ];
    const handlers = handlerIds.length
      ? await prisma.admin.findMany({
          where: { id: { in: handlerIds } },
          select: { id: true, nickname: true },
        })
      : [];
    const handlerMap = new Map(handlers.map((h) => [h.id, h.nickname]));

    // 格式化返回数据
    const list = records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userPhone: record.user.phone,
      userNickname: record.user.nickname,
      userAvatarUrl: record.user.avatar,
      userVipLevel: record.user.vipLevel,
      userStatus: record.user.status,
      positionOrderId: record.positionId,
      positionOrderNo: record.position.orderNo,
      productId: record.position.productId,
      productName: record.position.product.name,
      settleSequence: record.settleSequence,
      amount: formatAmount(record.amount),
      status: record.status,
      scheduleAt: record.scheduleAt.toISOString(),
      settledAt: record.settledAt?.toISOString() || null,
      retryCount: record.retryCount,
      lastError: record.lastError,
      isHandled: record.isHandled,
      handledBy: record.handledBy,
      handledByName: record.handledBy
        ? handlerMap.get(record.handledBy) || null
        : null,
      handledAt: record.handledAt?.toISOString() || null,
      handledRemark: record.handledRemark,
    }));

    return {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        unhandledCount,
        totalFailedAmount: formatAmount(failedAmountSum._sum.amount),
      },
    };
  }

  /**
   * 手动补发收益
   * @description 依据：02.4-后台API接口清单.md 第18.3节
   * 补发时检查用户状态
   */
  async retryIncome(recordId: number, adminId: number): Promise<{
    newStatus: IncomeStatus;
    settledAt: string | null;
  }> {
    // 获取收益记录
    const record = await prisma.incomeRecord.findUnique({
      where: { id: recordId },
      include: {
        user: {
          select: { id: true, status: true, availableBalance: true },
        },
        position: {
          select: { orderNo: true, product: { select: { name: true } } },
        },
      },
    });

    if (!record) {
      throw new BusinessError('RECORD_NOT_FOUND', '收益记录不存在', 404);
    }

    // 检查状态是否为 FAILED
    if (record.status !== 'FAILED') {
      throw new BusinessError(
        'INVALID_STATUS',
        `当前状态为 ${record.status}，无法补发`,
        400
      );
    }

    // 检查用户状态
    if (record.user.status === UserStatus.BANNED) {
      throw new BusinessError('USER_BANNED', '用户已被封禁，无法补发', 400);
    }

    // 执行补发（事务）
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      // 更新用户余额
      await tx.user.update({
        where: { id: record.userId },
        data: {
          availableBalance: {
            increment: record.amount,
          },
        },
      });

      // 获取更新后的余额
      const updatedUser = await tx.user.findUnique({
        where: { id: record.userId },
        select: { availableBalance: true },
      });

      // 记录资金流水
      await tx.transaction.create({
        data: {
          userId: record.userId,
          type: 'INCOME',
          amount: record.amount,
          balanceAfter: updatedUser!.availableBalance,
          relatedOrderNo: record.position.orderNo,
          remark: `${record.position.product.name}收益补发（第${record.settleSequence}期）`,
        },
      });

      // 更新收益记录状态
      await tx.incomeRecord.update({
        where: { id: recordId },
        data: {
          status: 'SETTLED',
          settledAt: now,
          isHandled: true,
          handledBy: adminId,
          handledAt: now,
          handledRemark: '手动补发成功',
        },
      });

      // 更新持仓订单的已发放天数和已获收益
      await tx.positionOrder.update({
        where: { id: record.positionId },
        data: {
          paidDays: { increment: 1 },
          earnedIncome: { increment: record.amount },
        },
      });

      return {
        newStatus: 'SETTLED' as IncomeStatus,
        settledAt: now.toISOString(),
      };
    });

    // 清除用户缓存（收益补发改变了余额）
    await clearUserCache(record.userId);

    return result;
  }

  /**
   * 标记异常已处理
   * @description 依据：02.4-后台API接口清单.md 第18.4节
   */
  async markHandled(
    recordId: number,
    adminId: number,
    remark?: string
  ): Promise<void> {
    // 获取收益记录
    const record = await prisma.incomeRecord.findUnique({
      where: { id: recordId },
      select: { id: true, status: true, isHandled: true },
    });

    if (!record) {
      throw new BusinessError('RECORD_NOT_FOUND', '收益记录不存在', 404);
    }

    // 检查状态是否为 FAILED
    if (record.status !== 'FAILED') {
      throw new BusinessError(
        'INVALID_STATUS',
        `当前状态为 ${record.status}，只能标记失败的记录`,
        400
      );
    }

    // 检查是否已处理
    if (record.isHandled) {
      throw new BusinessError('ALREADY_HANDLED', '该记录已处理', 400);
    }

    // 更新记录
    await prisma.incomeRecord.update({
      where: { id: recordId },
      data: {
        isHandled: true,
        handledBy: adminId,
        handledAt: new Date(),
        handledRemark: remark || '标记为已处理',
      },
    });
  }

  /**
   * 批量补发
   * @description 依据：02.4-后台API接口清单.md 第18.5节
   */
  async batchRetry(
    ids: number[],
    adminId: number
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.retryIncome(id, adminId);
        results.push({ id, success: true });
        succeeded++;
      } catch (error) {
        failed++;
        if (error instanceof BusinessError) {
          results.push({
            id,
            success: false,
            error: { code: error.code, message: error.message },
          });
        } else {
          results.push({
            id,
            success: false,
            error: { code: 'INTERNAL_ERROR', message: '补发失败' },
          });
        }
      }
    }

    return {
      total: ids.length,
      succeeded,
      failed,
      results,
    };
  }

  /**
   * 批量标记已处理
   * @description 依据：02.4-后台API接口清单.md 第18.6节
   */
  async batchMarkHandled(
    ids: number[],
    adminId: number,
    remark?: string
  ): Promise<BatchOperationResult> {
    const results: BatchOperationResult['results'] = [];
    let succeeded = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        await this.markHandled(id, adminId, remark);
        results.push({ id, success: true });
        succeeded++;
      } catch (error) {
        failed++;
        if (error instanceof BusinessError) {
          results.push({
            id,
            success: false,
            error: { code: error.code, message: error.message },
          });
        } else {
          results.push({
            id,
            success: false,
            error: { code: 'INTERNAL_ERROR', message: '标记处理失败' },
          });
        }
      }
    }

    return {
      total: ids.length,
      succeeded,
      failed,
      results,
    };
  }
}

// 导出服务实例
export const adminIncomeRecordService = new AdminIncomeRecordService();
