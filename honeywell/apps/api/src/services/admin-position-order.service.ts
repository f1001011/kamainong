/**
 * @file 持仓订单管理服务
 * @description 后台管理端持仓订单管理相关功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第6节 - 持仓订单接口
 * @depends 开发文档/04-后台管理端/04.4.1-持仓订单列表页.md
 *
 * 核心功能：
 * 1. 持仓订单列表查询（多条件筛选）
 * 2. 持仓订单详情查询
 * 3. 收益发放记录查询
 *
 * 业务规则：
 * - 列表支持按产品、状态、时间、金额筛选
 * - 详情包含完整收益发放进度
 * - 区分购买订单和赠送订单（isGift字段）
 */

import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { Prisma, PositionStatus, IncomeStatus } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/** 持仓订单列表查询参数 */
export interface PositionOrderListParams {
  page?: number;
  pageSize?: number;
  orderNo?: string;
  userId?: number;
  userPhone?: string;
  productId?: number | number[];
  productSeries?: 'PO' | 'VIP';
  orderType?: 'PURCHASE' | 'GIFT'; // 购买/赠送
  status?: PositionStatus | PositionStatus[];
  startDate?: string;
  endDate?: string;
  amountMin?: number;
  amountMax?: number;
}

/** 收益记录查询参数 */
export interface IncomeRecordListParams {
  page?: number;
  pageSize?: number;
  status?: IncomeStatus;
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
// 持仓订单列表
// ================================

/**
 * 获取持仓订单列表
 * @description 依据：02.4-后台API接口清单.md 第6.1节
 * 筛选条件：orderNo、userId、userPhone、productId、productSeries、orderType(购买/赠送)、
 *          status、startDate、endDate、amountMin、amountMax
 */
export async function getPositionOrderList(params: PositionOrderListParams) {
  const {
    page = 1,
    pageSize = 20,
    orderNo,
    userId,
    userPhone,
    productId,
    productSeries,
    orderType,
    status,
    startDate,
    endDate,
    amountMin,
    amountMax,
  } = params;

  // 构建查询条件
  const where: Prisma.PositionOrderWhereInput = {};

  // 订单号筛选（模糊搜索）
  if (orderNo) {
    where.orderNo = { contains: orderNo };
  }

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
      // 如果用户不存在，返回空结果
      return {
        list: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      };
    }
  }

  // 产品ID筛选
  if (productId) {
    if (Array.isArray(productId)) {
      where.productId = { in: productId };
    } else {
      where.productId = productId;
    }
  }

  // 产品系列筛选（使用 series 字段，禁止使用 code）
  if (productSeries) {
    where.product = {
      series: productSeries,
    };
  }

  // 订单类型筛选（购买/赠送）
  if (orderType) {
    where.isGift = orderType === 'GIFT';
  }

  // 状态筛选
  if (status) {
    if (Array.isArray(status)) {
      where.status = { in: status };
    } else {
      where.status = status;
    }
  }

  // 时间范围筛选（基于 startAt 字段）
  if (startDate || endDate) {
    where.startAt = {};
    if (startDate) {
      where.startAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.startAt.lt = end;
    }
  }

  // 金额范围筛选
  if (amountMin !== undefined || amountMax !== undefined) {
    where.purchaseAmount = {};
    if (amountMin !== undefined) {
      where.purchaseAmount.gte = amountMin;
    }
    if (amountMax !== undefined) {
      where.purchaseAmount.lte = amountMax;
    }
  }

  // 并行查询列表和总数
  const [orders, total] = await Promise.all([
    prisma.positionOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, phone: true },
        },
        product: {
          select: { name: true, series: true },
        },
      },
    }),
    prisma.positionOrder.count({ where }),
  ]);

  // 格式化返回数据
  const list = orders.map(order => ({
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userPhone: order.user.phone,
    productName: order.product.name,
    productSeries: order.product.series,
    isGift: order.isGift,
    purchaseAmount: formatAmount(order.purchaseAmount),
    dailyIncome: formatAmount(order.dailyIncome),
    cycleDays: order.cycleDays,
    paidDays: order.paidDays,
    earnedIncome: formatAmount(order.earnedIncome),
    status: order.status,
    startAt: order.startAt.toISOString(),
    nextSettleAt: order.nextSettleAt?.toISOString() || null,
    terminatedAt: order.terminatedAt?.toISOString() || null,
    terminateReason: order.terminateReason || null,
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

// ================================
// 持仓订单详情
// ================================

/**
 * 获取持仓订单详情
 * @description 依据：02.4-后台API接口清单.md 第6.2节
 */
export async function getPositionOrderDetail(orderId: number) {
  const order = await prisma.positionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, phone: true },
      },
      product: {
        select: { id: true, name: true, series: true },
      },
    },
  });

  if (!order) {
    throw new BusinessError('ORDER_NOT_FOUND', '持仓订单不存在', 404);
  }

  // 计算待发放收益
  const pendingIncome = Number(order.totalIncome) - Number(order.earnedIncome);

  return {
    id: order.id,
    orderNo: order.orderNo,
    userId: order.userId,
    userPhone: order.user.phone,
    productId: order.product.id,
    productName: order.product.name,
    productSeries: order.product.series,
    isGift: order.isGift,
    giftedBy: order.giftedBy,
    purchaseAmount: formatAmount(order.purchaseAmount),
    dailyIncome: formatAmount(order.dailyIncome),
    cycleDays: order.cycleDays,
    totalIncome: formatAmount(order.totalIncome),
    paidDays: order.paidDays,
    earnedIncome: formatAmount(order.earnedIncome),
    pendingIncome: formatAmount(pendingIncome),
    status: order.status,
    startAt: order.startAt.toISOString(),
    nextSettleAt: order.nextSettleAt?.toISOString() || null,
    endAt: order.endAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    terminatedBy: order.terminatedBy,
    terminatedAt: order.terminatedAt?.toISOString() || null,
    terminateReason: order.terminateReason || null,
  };
}

// ================================
// 收益发放记录
// ================================

/**
 * 获取持仓订单的收益发放记录
 * @description 依据：02.4-后台API接口清单.md 第6.3节
 */
export async function getPositionOrderIncomes(
  orderId: number,
  params: IncomeRecordListParams
) {
  const { page = 1, pageSize = 20, status } = params;

  // 检查订单是否存在
  const order = await prisma.positionOrder.findUnique({
    where: { id: orderId },
    select: { id: true, cycleDays: true },
  });

  if (!order) {
    throw new BusinessError('ORDER_NOT_FOUND', '持仓订单不存在', 404);
  }

  // 构建查询条件
  const where: Prisma.IncomeRecordWhereInput = {
    positionId: orderId,
  };

  if (status) {
    where.status = status;
  }

  // 并行查询记录列表、总数和统计
  const [records, total, settledSum, pendingCount, failedCount] = await Promise.all([
    prisma.incomeRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { settleSequence: 'desc' }, // 按发放序号降序（最新的在前）
    }),
    prisma.incomeRecord.count({ where }),
    // 已发放总金额
    prisma.incomeRecord.aggregate({
      where: { positionId: orderId, status: 'SETTLED' },
      _sum: { amount: true },
    }),
    // 待发放数量
    prisma.incomeRecord.count({
      where: { positionId: orderId, status: 'PENDING' },
    }),
    // 失败数量
    prisma.incomeRecord.count({
      where: { positionId: orderId, status: 'FAILED' },
    }),
  ]);

  // 格式化返回数据
  const list = records.map(record => ({
    id: record.id,
    settleSequence: record.settleSequence,
    amount: formatAmount(record.amount),
    status: record.status,
    scheduleAt: record.scheduleAt.toISOString(),
    settledAt: record.settledAt?.toISOString() || null,
    retryCount: record.retryCount,
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

// ================================
// 终止持仓订单
// ================================

/** 终止持仓订单参数 */
export interface TerminatePositionParams {
  reason?: string;
}

/** 单条终止结果 */
export interface TerminateResult {
  id: number;
  orderNo: string;
  status: 'TERMINATED';
  cancelledIncomeCount: number;
  vipLevelBefore: number;
  vipLevelAfter: number;
  svipLevelBefore: number;
  svipLevelAfter: number;
}

/** 批量终止参数 */
export interface BatchTerminateParams {
  ids: number[];
  reason?: string;
}

/** 批量终止结果 */
export interface BatchTerminateResult {
  totalRequested: number;
  totalTerminated: number;
  totalSkipped: number;
  results: Array<{
    id: number;
    orderNo: string;
    status: 'TERMINATED' | 'SKIPPED';
    skipReason?: string;
  }>;
}

/**
 * 重新计算用户 VIP/SVIP 等级及购买标记
 * @description 基于用户剩余的 ACTIVE/COMPLETED 持仓关联的产品重新计算
 * @param tx Prisma 事务客户端
 * @param userId 用户ID
 * @param excludeOrderId 排除的订单ID（当前被终止的订单）
 * @returns 新的 VIP/SVIP 等级
 */
async function recalculateUserLevels(
  tx: Prisma.TransactionClient,
  userId: number,
  excludeOrderId?: number
) {
  const remaining = await tx.positionOrder.findMany({
    where: {
      userId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
      ...(excludeOrderId ? { id: { not: excludeOrderId } } : {}),
    },
    include: {
      product: {
        select: { grantVipLevel: true, grantSvipLevel: true, type: true },
      },
    },
  });

  const vipLevels = remaining.map(r => r.product.grantVipLevel);
  const svipLevels = remaining.map(r => r.product.grantSvipLevel);

  const newVipLevel = vipLevels.length > 0 ? Math.max(...vipLevels) : 0;
  const newSvipLevel = svipLevels.length > 0 ? Math.max(...svipLevels) : 0;

  const hasTrial = remaining.some(r => r.product.type === 'TRIAL');
  const hasPaid = remaining.some(r => r.product.type === 'PAID' || r.product.type === 'FINANCIAL');

  await tx.user.update({
    where: { id: userId },
    data: {
      vipLevel: newVipLevel,
      svipLevel: newSvipLevel,
      hasPurchasedPo0: hasTrial,    // 向后兼容
      hasPurchasedOther: hasPaid,
      hasPurchasedPaid: hasPaid,
    },
  });

  return { newVipLevel, newSvipLevel };
}

/**
 * 终止单条持仓订单
 * @description 管理员终止持仓订单：停止收益发放、恢复限购、重算VIP
 * 
 * 事务内操作：
 * 1. 校验订单存在且 status=ACTIVE
 * 2. 更新订单状态为 TERMINATED
 * 3. 批量取消未发放收益（PENDING/FAILED → CANCELLED）
 * 4. 恢复限购资格（purchaseCount 减1）
 * 5. 重算 VIP/SVIP 等级
 * 6. 记录管理操作日志
 * 7. 清除用户缓存
 */
export async function terminatePositionOrder(
  orderId: number,
  adminId: number,
  params: TerminatePositionParams,
  ip?: string
): Promise<TerminateResult> {
  const now = new Date();

  // 查询订单（事务外预检查）
  const order = await prisma.positionOrder.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: { id: true, vipLevel: true, svipLevel: true },
      },
    },
  });

  if (!order) {
    throw new BusinessError('ORDER_NOT_FOUND', '持仓订单不存在', 404);
  }

  if (order.status !== 'ACTIVE') {
    throw new BusinessError('ORDER_NOT_ACTIVE', '仅进行中的订单可以终止', 400);
  }

  const vipLevelBefore = order.user.vipLevel;
  const svipLevelBefore = order.user.svipLevel;

  const result = await prisma.$transaction(async (tx) => {
    // 再次校验状态（防止并发）
    const lockedOrder = await tx.positionOrder.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNo: true, userId: true, productId: true },
    });

    if (!lockedOrder || lockedOrder.status !== 'ACTIVE') {
      throw new BusinessError('ORDER_NOT_ACTIVE', '订单状态已变化，请刷新后重试', 400);
    }

    // Step 2: 更新订单状态
    await tx.positionOrder.update({
      where: { id: orderId },
      data: {
        status: 'TERMINATED',
        endAt: now,
        nextSettleAt: null,
        terminatedBy: adminId,
        terminatedAt: now,
        terminateReason: params.reason || null,
      },
    });

    // Step 3: 批量取消未发放收益
    const cancelResult = await tx.incomeRecord.updateMany({
      where: {
        positionId: orderId,
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: { status: 'CANCELLED' },
    });

    // Step 4: 恢复限购资格
    const purchase = await tx.userProductPurchase.findUnique({
      where: {
        userId_productId: {
          userId: lockedOrder.userId,
          productId: lockedOrder.productId,
        },
      },
    });

    if (purchase && purchase.purchaseCount > 0) {
      if (purchase.purchaseCount === 1) {
        await tx.userProductPurchase.delete({
          where: {
            userId_productId: {
              userId: lockedOrder.userId,
              productId: lockedOrder.productId,
            },
          },
        });
      } else {
        await tx.userProductPurchase.update({
          where: {
            userId_productId: {
              userId: lockedOrder.userId,
              productId: lockedOrder.productId,
            },
          },
          data: { purchaseCount: { decrement: 1 } },
        });
      }
    }

    // Step 5: 重算 VIP/SVIP 等级
    const { newVipLevel, newSvipLevel } = await recalculateUserLevels(
      tx,
      lockedOrder.userId,
      orderId
    );

    // Step 6: 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'POSITION_ORDER',
        action: 'TERMINATE',
        targetType: 'PositionOrder',
        targetId: String(orderId),
        beforeData: {
          status: 'ACTIVE',
          vipLevel: vipLevelBefore,
          svipLevel: svipLevelBefore,
        },
        afterData: {
          status: 'TERMINATED',
          vipLevel: newVipLevel,
          svipLevel: newSvipLevel,
          cancelledIncomeCount: cancelResult.count,
        },
        ip,
        remark: `终止持仓订单: ${lockedOrder.orderNo}`,
      },
    });

    return {
      id: orderId,
      orderNo: lockedOrder.orderNo,
      cancelledIncomeCount: cancelResult.count,
      userId: lockedOrder.userId,
      newVipLevel,
      newSvipLevel,
    };
  });

  // Step 7: 清除用户缓存
  await clearUserCache(result.userId);

  return {
    id: result.id,
    orderNo: result.orderNo,
    status: 'TERMINATED' as const,
    cancelledIncomeCount: result.cancelledIncomeCount,
    vipLevelBefore,
    vipLevelAfter: result.newVipLevel,
    svipLevelBefore,
    svipLevelAfter: result.newSvipLevel,
  };
}

/**
 * 批量终止持仓订单
 * @description 逐条事务处理，部分失败不影响其他
 * 同一用户多条订单：仅在该用户最后一条处理完后做一次 VIP 重算
 */
export async function batchTerminatePositionOrders(
  adminId: number,
  params: BatchTerminateParams,
  ip?: string
): Promise<BatchTerminateResult> {
  const { ids, reason } = params;

  if (ids.length === 0) {
    throw new BusinessError('INVALID_PARAMS', '请选择要终止的订单', 400);
  }

  if (ids.length > 50) {
    throw new BusinessError('INVALID_PARAMS', '单次最多终止50条订单', 400);
  }

  const now = new Date();

  // 预加载所有订单
  const orders = await prisma.positionOrder.findMany({
    where: { id: { in: ids } },
    include: {
      user: { select: { id: true, vipLevel: true, svipLevel: true } },
    },
  });

  const orderMap = new Map(orders.map(o => [o.id, o]));

  // 按 userId 分组，用于优化 VIP 重算
  const userOrderIds = new Map<number, number[]>();
  for (const order of orders) {
    if (order.status === 'ACTIVE') {
      const existing = userOrderIds.get(order.userId) || [];
      existing.push(order.id);
      userOrderIds.set(order.userId, existing);
    }
  }

  const results: BatchTerminateResult['results'] = [];
  const affectedUserIds = new Set<number>();

  for (const id of ids) {
    const order = orderMap.get(id);

    if (!order) {
      results.push({ id, orderNo: '-', status: 'SKIPPED', skipReason: '订单不存在' });
      continue;
    }

    if (order.status !== 'ACTIVE') {
      results.push({
        id,
        orderNo: order.orderNo,
        status: 'SKIPPED',
        skipReason: `当前状态为${order.status === 'COMPLETED' ? '已完成' : '已终止'}`,
      });
      continue;
    }

    try {
      // 判断是否是该用户在本批次的最后一条
      const userOrders = userOrderIds.get(order.userId) || [];
      const isLastForUser = userOrders[userOrders.length - 1] === id;

      await prisma.$transaction(async (tx) => {
        // 更新订单状态
        await tx.positionOrder.update({
          where: { id },
          data: {
            status: 'TERMINATED',
            endAt: now,
            nextSettleAt: null,
            terminatedBy: adminId,
            terminatedAt: now,
            terminateReason: reason || null,
          },
        });

        // 批量取消未发放收益
        await tx.incomeRecord.updateMany({
          where: {
            positionId: id,
            status: { in: ['PENDING', 'FAILED'] },
          },
          data: { status: 'CANCELLED' },
        });

        // 恢复限购
        const purchase = await tx.userProductPurchase.findUnique({
          where: {
            userId_productId: {
              userId: order.userId,
              productId: order.productId,
            },
          },
        });

        if (purchase && purchase.purchaseCount > 0) {
          if (purchase.purchaseCount === 1) {
            await tx.userProductPurchase.delete({
              where: {
                userId_productId: {
                  userId: order.userId,
                  productId: order.productId,
                },
              },
            });
          } else {
            await tx.userProductPurchase.update({
              where: {
                userId_productId: {
                  userId: order.userId,
                  productId: order.productId,
                },
              },
              data: { purchaseCount: { decrement: 1 } },
            });
          }
        }

        // 仅在该用户最后一条时重算 VIP
        if (isLastForUser) {
          await recalculateUserLevels(tx, order.userId);
        }

        // 操作日志
        await tx.adminOperationLog.create({
          data: {
            adminId,
            module: 'POSITION_ORDER',
            action: 'TERMINATE',
            targetType: 'PositionOrder',
            targetId: String(id),
            beforeData: { status: 'ACTIVE' },
            afterData: { status: 'TERMINATED' },
            ip,
            remark: `批量终止持仓订单: ${order.orderNo}`,
          },
        });
      });

      results.push({ id, orderNo: order.orderNo, status: 'TERMINATED' });
      affectedUserIds.add(order.userId);
    } catch (error) {
      console.error(`[batchTerminate] 终止订单 ${id} 失败:`, error);
      results.push({
        id,
        orderNo: order.orderNo,
        status: 'SKIPPED',
        skipReason: '处理失败，请重试',
      });
    }
  }

  // 清除受影响用户的缓存
  for (const userId of affectedUserIds) {
    await clearUserCache(userId);
  }

  const totalTerminated = results.filter(r => r.status === 'TERMINATED').length;

  return {
    totalRequested: ids.length,
    totalTerminated,
    totalSkipped: ids.length - totalTerminated,
    results,
  };
}
