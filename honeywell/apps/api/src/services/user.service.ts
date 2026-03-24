/**
 * @file 用户管理服务
 * @description 后台管理端用户管理相关功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节 - 用户管理接口
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md
 *
 * 核心功能：
 * 1. 用户列表查询（多条件筛选）
 * 2. 用户详情查询
 * 3. 用户操作（调整余额、赠送产品、恢复限购、修改等级）
 * 4. 封禁/解封用户
 * 5. 用户关联数据查询（银行卡、持仓、充值、提现、流水、团队）
 * 6. 批量操作（批量封禁、解封、调整余额）
 *
 * 安全规则：
 * - 所有敏感操作必须记录 AdminOperationLog
 * - 封禁时自动处理余额和待审核提现
 * - 批量操作使用独立事务，返回每条结果
 * - 用户列表返回明文密码（后台特权，使用 AES 解密）
 */

import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { aesDecrypt, aesEncrypt } from '@honeywell/utils';
import { Prisma, TransactionType, UserStatus } from '@honeywell/database';
import { generateOrderNo } from '@/lib/order';

// ================================
// 类型定义
// ================================

/** 用户列表查询参数 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  vipLevel?: number[];
  svipLevel?: number[];
  status?: UserStatus;
  startDate?: string;
  endDate?: string;
  inviterId?: number;
  inviterPhone?: string;
  registerIp?: string;
  balanceMin?: number;
  balanceMax?: number;
  hasPosition?: boolean;
  hasPurchasedPo0?: boolean;
  lastLoginStart?: string;
  lastLoginEnd?: string;
}

/** 余额调整参数 */
export interface BalanceAdjustParams {
  type: 'ADD' | 'DEDUCT';
  amount: string;
  remark?: string;
}

/** 赠送产品参数 */
export interface GiftProductParams {
  productId: number;
}

/** 修改等级参数 */
export interface UpdateVipLevelParams {
  vipLevel?: number;
  svipLevel?: number;
}

/** 批量操作结果 */
export interface BatchResult {
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

/**
 * 记录管理员操作日志
 * @description 依据：02.1-数据库设计.md 第2.9节 - AdminOperationLog表
 */
async function logAdminOperation(params: {
  adminId: number;
  module: string;
  action: string;
  targetType?: string;
  targetId?: string;
  beforeData?: unknown;
  afterData?: unknown;
  ip?: string;
  remark?: string;
}) {
  await prisma.adminOperationLog.create({
    data: {
      adminId: params.adminId,
      module: params.module,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      beforeData: params.beforeData ? JSON.parse(JSON.stringify(params.beforeData)) : null,
      afterData: params.afterData ? JSON.parse(JSON.stringify(params.afterData)) : null,
      ip: params.ip,
      remark: params.remark,
    },
  });
}

// ================================
// 用户列表与详情
// ================================

/**
 * 获取用户列表
 * @description 依据：02.4-后台API接口清单.md 第3.1节
 */
export async function getUserList(params: UserListParams) {
  const {
    page = 1,
    pageSize = 20,
    keyword,
    vipLevel,
    svipLevel,
    status,
    startDate,
    endDate,
    inviterId,
    inviterPhone,
    registerIp,
    balanceMin,
    balanceMax,
    hasPosition,
    hasPurchasedPo0,
    lastLoginStart,
    lastLoginEnd,
  } = params;

  // 构建查询条件
  const where: Prisma.UserWhereInput = {};

  // 关键词搜索（手机号/用户ID/邀请码）
  if (keyword) {
    const keywordNum = parseInt(keyword, 10);
    where.OR = [
      { phone: { contains: keyword } },
      { inviteCode: { contains: keyword } },
      ...(isNaN(keywordNum) ? [] : [{ id: keywordNum }]),
    ];
  }

  // VIP等级筛选（支持多选）
  if (vipLevel && vipLevel.length > 0) {
    where.vipLevel = { in: vipLevel };
  }

  // SVIP等级筛选（支持多选）
  if (svipLevel && svipLevel.length > 0) {
    where.svipLevel = { in: svipLevel };
  }

  // 用户状态
  if (status) {
    where.status = status;
  }

  // 注册时间范围
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.createdAt.lt = end;
    }
  }

  // 上级筛选
  if (inviterId) {
    where.inviterId = inviterId;
  }
  if (inviterPhone) {
    const inviter = await prisma.user.findFirst({
      where: { phone: inviterPhone },
      select: { id: true },
    });
    if (inviter) {
      where.inviterId = inviter.id;
    } else {
      // 如果上级手机号不存在，返回空结果
      return {
        list: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
      };
    }
  }

  // 注册IP
  if (registerIp) {
    where.registerIp = { contains: registerIp };
  }

  // 余额范围
  if (balanceMin !== undefined || balanceMax !== undefined) {
    where.availableBalance = {};
    if (balanceMin !== undefined) {
      where.availableBalance.gte = balanceMin;
    }
    if (balanceMax !== undefined) {
      where.availableBalance.lte = balanceMax;
    }
  }

  // 是否有持仓
  if (hasPosition !== undefined) {
    if (hasPosition) {
      where.positionOrders = { some: { status: 'ACTIVE' } };
    } else {
      where.positionOrders = { none: { status: 'ACTIVE' } };
    }
  }

  // 是否购买过体验产品（hasPurchasedPo0，管理端筛选向后兼容）
  if (hasPurchasedPo0 !== undefined) {
    where.hasPurchasedPo0 = hasPurchasedPo0;
  }

  // 最后登录时间范围
  if (lastLoginStart || lastLoginEnd) {
    where.lastLoginAt = {};
    if (lastLoginStart) {
      where.lastLoginAt.gte = new Date(lastLoginStart);
    }
    if (lastLoginEnd) {
      const end = new Date(lastLoginEnd);
      end.setDate(end.getDate() + 1);
      where.lastLoginAt.lt = end;
    }
  }

  // 并行查询列表和总数
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        inviter: {
          select: { id: true, phone: true },
        },
        _count: {
          select: {
            invitees: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // 查询团队人数和累计数据
  const userIds = users.map(u => u.id);
  
    // 查询三级团队人数
    const teamCounts = await prisma.$queryRaw<Array<{ userId: number; count: bigint }>>`
      SELECT inviterId as userId, COUNT(*) as count FROM User 
      WHERE inviterId IN (${Prisma.join(userIds.length ? userIds : [0])})
      GROUP BY inviterId
      UNION ALL
      SELECT level2InviterId as userId, COUNT(*) as count FROM User 
      WHERE level2InviterId IN (${Prisma.join(userIds.length ? userIds : [0])})
      GROUP BY level2InviterId
      UNION ALL
      SELECT level3InviterId as userId, COUNT(*) as count FROM User 
      WHERE level3InviterId IN (${Prisma.join(userIds.length ? userIds : [0])})
      GROUP BY level3InviterId
    `;

  // 汇总团队人数
  const teamCountMap = new Map<number, number>();
  for (const tc of teamCounts) {
    const current = teamCountMap.get(tc.userId) || 0;
    teamCountMap.set(tc.userId, current + Number(tc.count));
  }

  // 查询累计充值和提现
  const [rechargeStats, withdrawStats] = await Promise.all([
    prisma.rechargeOrder.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: 'PAID',
      },
      _sum: { actualAmount: true },
    }),
    prisma.withdrawOrder.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        status: 'COMPLETED',
      },
      _sum: { actualAmount: true },
    }),
  ]);

  const rechargeMap = new Map(rechargeStats.map(r => [r.userId, r._sum.actualAmount]));
  const withdrawMap = new Map(withdrawStats.map(w => [w.userId, w._sum.actualAmount]));

  // 格式化返回数据，解密密码
  const list = users.map(user => ({
    id: user.id,
    phone: user.phone,
    password: user.password ? aesDecrypt(user.password) : null, // 后台可查看明文密码
    nickname: user.nickname,
    vipLevel: user.vipLevel,
    svipLevel: user.svipLevel,
    availableBalance: formatAmount(user.availableBalance),
    frozenBalance: formatAmount(user.frozenBalance),
    status: user.status,
    inviterPhone: user.inviter?.phone || null,
    inviterId: user.inviterId,
    teamCount: teamCountMap.get(user.id) || 0,
    totalRecharge: formatAmount(rechargeMap.get(user.id) ?? null),
    totalWithdraw: formatAmount(withdrawMap.get(user.id) ?? null),
    registerIp: user.registerIp,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    lastLoginIp: user.lastLoginIp,
    createdAt: user.createdAt.toISOString(),
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

/**
 * 获取用户详情
 * @description 依据：02.4-后台API接口清单.md 第3.2节
 */
export async function getUserDetail(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      inviter: {
        select: { id: true, phone: true, nickname: true },
      },
      bankCards: {
        where: { isDeleted: false },
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
      positionOrders: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
        },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  // 查询二级、三级上级
  const [level2Inviter, level3Inviter] = await Promise.all([
    user.level2InviterId
      ? prisma.user.findUnique({
          where: { id: user.level2InviterId },
          select: { id: true, phone: true, nickname: true },
        })
      : null,
    user.level3InviterId
      ? prisma.user.findUnique({
          where: { id: user.level3InviterId },
          select: { id: true, phone: true, nickname: true },
        })
      : null,
  ]);

  // 查询累计统计
  const [
    totalRecharge,
    totalWithdraw,
    totalIncome,
    totalCommission,
    level1Count,
    level2Count,
    level3Count,
  ] = await Promise.all([
    prisma.rechargeOrder.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { actualAmount: true },
    }),
    prisma.withdrawOrder.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { actualAmount: true },
    }),
    prisma.incomeRecord.aggregate({
      where: { userId, status: 'SETTLED' },
      _sum: { amount: true },
    }),
    prisma.commissionRecord.aggregate({
      where: { receiverId: userId },
      _sum: { amount: true },
    }),
    prisma.user.count({ where: { inviterId: userId } }),
    prisma.user.count({ where: { level2InviterId: userId } }),
    prisma.user.count({ where: { level3InviterId: userId } }),
  ]);

  // 解密银行卡敏感信息（documentNo 允许为 null，需做空值保护）
  const bankCards = user.bankCards.map(card => ({
    id: card.id,
    bankCode: card.bankCode,
    bankName: card.bankName,
    accountNo: card.accountNo ? aesDecrypt(card.accountNo) : null,
    accountNoMask: card.accountNoMask,
    accountName: card.accountName,
    phone: card.phone,
    documentType: card.documentType,
    documentNo: card.documentNo ? aesDecrypt(card.documentNo) : null,
    isDeleted: card.isDeleted,
    createdAt: card.createdAt.toISOString(),
  }));

  // 格式化持仓订单
  const recentPositions = user.positionOrders.map(p => ({
    id: p.id,
    orderNo: p.orderNo,
    productName: p.product.name,
    purchaseAmount: formatAmount(p.purchaseAmount),
    dailyIncome: formatAmount(p.dailyIncome),
    status: p.status,
    isGift: p.isGift,
    startAt: p.startAt.toISOString(),
  }));

  // 格式化流水
  const recentTransactions = user.transactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: formatAmount(t.amount),
    balanceAfter: formatAmount(t.balanceAfter),
    relatedOrderNo: t.relatedOrderNo,
    remark: t.remark,
    createdAt: t.createdAt.toISOString(),
  }));

  return {
    user: {
      id: user.id,
      phone: user.phone,
      password: user.password ? aesDecrypt(user.password) : null, // 后台可查看明文密码
      nickname: user.nickname,
      avatar: user.avatar,
      inviteCode: user.inviteCode,
      vipLevel: user.vipLevel,
      svipLevel: user.svipLevel,
      availableBalance: formatAmount(user.availableBalance),
      frozenBalance: formatAmount(user.frozenBalance),
      status: user.status,
      // 邀请关系
      inviter: user.inviter,
      level2Inviter,
      level3Inviter,
      // 标记字段
      hasPurchasedPo0: user.hasPurchasedPo0,
      hasPurchasedOther: user.hasPurchasedOther,
      hasRecharged: user.hasRecharged,
      hasPurchasedAfterRecharge: user.hasPurchasedAfterRecharge,
      firstPurchaseDone: user.firstPurchaseDone,
      signInCompleted: user.signInCompleted,
      // 累计统计
      stats: {
        totalRecharge: formatAmount(totalRecharge._sum.actualAmount),
        totalWithdraw: formatAmount(totalWithdraw._sum.actualAmount),
        totalIncome: formatAmount(totalIncome._sum.amount),
        totalCommission: formatAmount(totalCommission._sum.amount),
        teamCount: level1Count + level2Count + level3Count,
        level1Count,
        level2Count,
        level3Count,
      },
      // 登录信息
      registerIp: user.registerIp,
      lastLoginIp: user.lastLoginIp,
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      createdAt: user.createdAt.toISOString(),
    },
    bankCards,
    recentPositions,
    recentTransactions,
  };
}

// ================================
// 用户操作
// ================================

/**
 * 调整用户余额
 * @description 依据：02.4-后台API接口清单.md 第3.3节
 */
export async function adjustBalance(
  userId: number,
  params: BalanceAdjustParams,
  adminId: number,
  ip?: string
) {
  const { type, amount, remark } = params;
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum) || amountNum <= 0) {
    throw new BusinessError('VALIDATION_ERROR', '金额必须大于0', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, availableBalance: true, status: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  const currentBalance = Number(user.availableBalance);

  // 扣减时检查余额
  if (type === 'DEDUCT' && amountNum > currentBalance) {
    throw new BusinessError('INSUFFICIENT_BALANCE', '可用余额不足', 400);
  }

  const newBalance = type === 'ADD' 
    ? currentBalance + amountNum 
    : currentBalance - amountNum;

  // 使用事务更新余额和记录流水
  await prisma.$transaction(async tx => {
    // 更新用户余额
    await tx.user.update({
      where: { id: userId },
      data: { availableBalance: newBalance },
    });

    // 记录资金流水
    await tx.transaction.create({
      data: {
        userId,
        type: type === 'ADD' ? TransactionType.ADMIN_ADD : TransactionType.ADMIN_DEDUCT,
        amount: type === 'ADD' ? amountNum : -amountNum,
        balanceAfter: newBalance,
        remark: remark || (type === 'ADD' ? '后台增加' : '后台扣减'),
      },
    });

    // 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: type === 'ADD' ? 'ADD_BALANCE' : 'DEDUCT_BALANCE',
        targetType: 'User',
        targetId: String(userId),
        beforeData: { availableBalance: currentBalance },
        afterData: { availableBalance: newBalance },
        ip,
        remark,
      },
    });
  });

  // 清除用户缓存（余额已变化）
  await clearUserCache(userId);

  return { balanceAfter: newBalance.toFixed(2) };
}

/**
 * 赠送产品
 * @description 依据：02.4-后台API接口清单.md 第3.4节
 * 赠送规则：
 * - 赠送的产品占用限购
 * - 赠送的产品计入提现门槛（同时标记 hasPurchasedPaid + hasRecharged，满足提现条件）
 * - 赠送的产品不触发返佣
 * - 赠送的产品赠送VIP等级
 */
export async function giftProduct(
  userId: number,
  params: GiftProductParams,
  adminId: number,
  ip?: string
) {
  const { productId } = params;

  // 查询用户
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, vipLevel: true, svipLevel: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  if (user.status === 'BANNED') {
    throw new BusinessError('USER_BANNED', '用户已被封禁', 400);
  }

  // 查询产品
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404);
  }

  if (product.status !== 'ACTIVE') {
    throw new BusinessError('PRODUCT_INACTIVE', '产品已下架', 400);
  }

  // 检查限购
  const purchase = await prisma.userProductPurchase.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (purchase && purchase.purchaseCount >= product.purchaseLimit) {
    throw new BusinessError('PRODUCT_LIMIT_EXCEEDED', '已达产品限购数量', 400);
  }

  // 使用事务创建订单
  const orderNo = generateOrderNo('PO');
  const startAt = new Date();
  const nextSettleAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async tx => {
    // 创建持仓订单
    const positionOrder = await tx.positionOrder.create({
      data: {
        orderNo,
        userId,
        productId,
        purchaseAmount: product.price,
        dailyIncome: product.dailyIncome,
        cycleDays: product.cycleDays,
        totalIncome: product.dailyIncome.mul(product.cycleDays),
        startAt,
        nextSettleAt,
        isGift: true,
        giftedBy: adminId,
      },
    });

    // 创建收益记录
    const incomeRecords = [];
    for (let i = 1; i <= product.cycleDays; i++) {
      const scheduleAt = new Date(startAt.getTime() + i * 24 * 60 * 60 * 1000);
      incomeRecords.push({
        positionId: positionOrder.id,
        userId,
        settleSequence: i,
        scheduleAt,
        amount: product.dailyIncome,
      });
    }
    await tx.incomeRecord.createMany({ data: incomeRecords });

    // 更新或创建购买记录（限购）
    await tx.userProductPurchase.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      create: {
        userId,
        productId,
        purchaseCount: 1,
      },
      update: {
        purchaseCount: { increment: 1 },
      },
    });

    // 更新用户VIP等级及购买标记（使用 type 字段判断产品类型，旧字段保留向后兼容）
    // 赠送付费/理财产品时同时标记 hasRecharged，使用户满足提现门槛
    const updateData: Prisma.UserUpdateInput = {};
    
    if (product.type === 'TRIAL') {
      updateData.hasPurchasedPo0 = true; // 向后兼容
    } else {
      updateData.hasPurchasedOther = true;
      updateData.hasPurchasedPaid = true;
      updateData.hasRecharged = true;
    }

    // 赠送VIP等级
    if (product.grantVipLevel > user.vipLevel) {
      updateData.vipLevel = product.grantVipLevel;
    }
    if (product.grantSvipLevel > user.svipLevel) {
      updateData.svipLevel = product.grantSvipLevel;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'GIFT_PRODUCT',
        targetType: 'User',
        targetId: String(userId),
        afterData: {
          productId,
          productName: product.name,
          orderNo,
        },
        ip,
        remark: `赠送产品: ${product.name}`,
      },
    });

    return positionOrder;
  });

  // 清除用户缓存（赠送产品可能改变 VIP 等级、购买状态）
  await clearUserCache(userId);

  return {
    positionOrderId: result.id,
    orderNo: result.orderNo,
  };
}

/**
 * 恢复限购
 * @description 依据：02.4-后台API接口清单.md 第3.5节
 */
export async function restorePurchase(
  userId: number,
  productId: number,
  adminId: number,
  ip?: string
) {
  // 查询购买记录
  const purchase = await prisma.userProductPurchase.findUnique({
    where: {
      userId_productId: { userId, productId },
    },
  });

  if (!purchase || purchase.purchaseCount === 0) {
    throw new BusinessError('VALIDATION_ERROR', '该用户未购买过此产品', 400);
  }

  // 使用事务更新
  await prisma.$transaction(async tx => {
    // 减少购买次数
    await tx.userProductPurchase.update({
      where: {
        userId_productId: { userId, productId },
      },
      data: {
        purchaseCount: { decrement: 1 },
      },
    });

    // 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'RESTORE_PURCHASE',
        targetType: 'User',
        targetId: String(userId),
        beforeData: { purchaseCount: purchase.purchaseCount },
        afterData: { purchaseCount: purchase.purchaseCount - 1, productId },
        ip,
        remark: `恢复产品限购: productId=${productId}`,
      },
    });
  });

  return { message: '已恢复1次购买资格' };
}

/**
 * 修改用户等级
 * @description 依据：02.4-后台API接口清单.md 第3.6节
 */
export async function updateVipLevel(
  userId: number,
  params: UpdateVipLevelParams,
  adminId: number,
  ip?: string
) {
  const { vipLevel, svipLevel } = params;

  if (vipLevel === undefined && svipLevel === undefined) {
    throw new BusinessError('VALIDATION_ERROR', '请至少提供一个等级参数', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, vipLevel: true, svipLevel: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  const updateData: Prisma.UserUpdateInput = {};
  if (vipLevel !== undefined) {
    updateData.vipLevel = vipLevel;
  }
  if (svipLevel !== undefined) {
    updateData.svipLevel = svipLevel;
  }

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: userId },
      data: updateData,
    });

    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'UPDATE_VIP_LEVEL',
        targetType: 'User',
        targetId: String(userId),
        beforeData: { vipLevel: user.vipLevel, svipLevel: user.svipLevel },
        afterData: {
          vipLevel: vipLevel ?? user.vipLevel,
          svipLevel: svipLevel ?? user.svipLevel,
        },
        ip,
      },
    });
  });

  // 清除用户缓存（VIP 等级已变化）
  await clearUserCache(userId);

  return { message: '等级修改成功' };
}

/**
 * 重置密码
 * @description 依据：02.4-后台API接口清单.md 第3节
 */
export async function resetPassword(
  userId: number,
  adminId: number,
  ip?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  // 生成新密码（使用手机号后8位）
  const newPassword = user.phone.slice(-8);
  const encryptedPassword = aesEncrypt(newPassword);

  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: userId },
      data: { password: encryptedPassword },
    });

    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'RESET_PASSWORD',
        targetType: 'User',
        targetId: String(userId),
        ip,
        remark: `密码已重置为手机号后8位`,
      },
    });
  });

  return { message: '密码已重置' };
}

// ================================
// 封禁/解封
// ================================

/**
 * 封禁用户
 * @description 依据：02.4-后台API接口清单.md 第3.7节
 * 封禁时自动处理：
 * - 可用余额 → 冻结余额
 * - 待审核提现 → 自动拒绝
 * - 持仓收益 → 停止发放
 */
export async function banUser(
  userId: number,
  adminId: number,
  reason?: string,
  ip?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, availableBalance: true, frozenBalance: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  if (user.status === 'BANNED') {
    throw new BusinessError('VALIDATION_ERROR', '用户已被封禁', 400);
  }

  const availableBalance = Number(user.availableBalance);
  const frozenBalance = Number(user.frozenBalance);

  await prisma.$transaction(async tx => {
    // 1. 更新用户状态，可用余额转冻结
    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'BANNED',
        availableBalance: 0,
        frozenBalance: frozenBalance + availableBalance,
      },
    });

    // 2. 如果有可用余额，记录冻结流水
    if (availableBalance > 0) {
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAW_FREEZE,
          amount: -availableBalance,
          balanceAfter: 0,
          remark: '账号封禁，余额冻结',
        },
      });
    }

    // 3. 自动拒绝待审核提现
    const pendingWithdraws = await tx.withdrawOrder.findMany({
      where: { userId, status: 'PENDING_REVIEW' },
    });

    for (const withdraw of pendingWithdraws) {
      await tx.withdrawOrder.update({
        where: { id: withdraw.id },
        data: {
          status: 'REJECTED',
          rejectReason: '账号已封禁',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // 退回冻结余额（封禁时已全部冻结，这里只是记录）
      // 注意：提现冻结的金额已经在用户的 frozenBalance 中
    }

    // 4. 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'BAN',
        targetType: 'User',
        targetId: String(userId),
        beforeData: {
          status: 'ACTIVE',
          availableBalance,
          frozenBalance,
        },
        afterData: {
          status: 'BANNED',
          availableBalance: 0,
          frozenBalance: frozenBalance + availableBalance,
        },
        ip,
        remark: reason || '封禁用户',
      },
    });
  });

  // 清除用户缓存（状态、余额已变化）
  await clearUserCache(userId);

  return { message: '用户已封禁' };
}

/**
 * 解封用户
 * @description 依据：02.4-后台API接口清单.md 第3节
 */
export async function unbanUser(
  userId: number,
  adminId: number,
  ip?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, availableBalance: true, frozenBalance: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  if (user.status === 'ACTIVE') {
    throw new BusinessError('VALIDATION_ERROR', '用户未被封禁', 400);
  }

  const frozenBalance = Number(user.frozenBalance);

  await prisma.$transaction(async tx => {
    // 解封并恢复余额
    await tx.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        availableBalance: frozenBalance,
        frozenBalance: 0,
      },
    });

    // 记录解冻流水
    if (frozenBalance > 0) {
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAW_REFUND,
          amount: frozenBalance,
          balanceAfter: frozenBalance,
          remark: '账号解封，余额解冻',
        },
      });
    }

    // 记录操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'UNBAN',
        targetType: 'User',
        targetId: String(userId),
        beforeData: {
          status: 'BANNED',
          availableBalance: 0,
          frozenBalance,
        },
        afterData: {
          status: 'ACTIVE',
          availableBalance: frozenBalance,
          frozenBalance: 0,
        },
        ip,
        remark: '解封用户',
      },
    });
  });

  // 清除用户缓存（状态、余额已变化）
  await clearUserCache(userId);

  return { message: '用户已解封' };
}

// ================================
// 用户关联数据查询
// ================================

/**
 * 获取用户银行卡列表
 * @description 依据：02.4-后台API接口清单.md 第3.8节
 */
export async function getUserBankCards(userId: number) {
  const cards = await prisma.bankCard.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    list: cards.map(card => ({
      id: card.id,
      bankCode: card.bankCode,
      bankName: card.bankName,
      accountNo: card.accountNo ? aesDecrypt(card.accountNo) : null, // 后台可见完整账号
      accountNoMask: card.accountNoMask,
      accountName: card.accountName,
      phone: card.phone,
      documentType: card.documentType,
      documentNo: card.documentNo ? aesDecrypt(card.documentNo) : null,
      isDeleted: card.isDeleted,
      createdAt: card.createdAt.toISOString(),
    })),
  };
}

/**
 * 清空用户银行卡信息
 * @description 管理员操作：软删除用户所有银行卡 + 删除关联的账户手机号锁定记录
 * 
 * 处理流程：
 * 1. 验证用户存在
 * 2. 检查是否有待审核的提现订单（有则拒绝，防止数据不一致）
 * 3. 软删除用户所有未删除的银行卡（isDeleted=true, deletedAt=now）
 * 4. 删除该用户的所有 AccountPhoneBind 锁定记录（释放银行账户）
 * 5. 记录管理员操作日志
 * 6. 清除用户 Redis 缓存
 * 
 * @param userId - 用户ID
 * @param adminId - 管理员ID（用于操作日志）
 * @param ip - 管理员IP（可选）
 * @returns 清空统计：银行卡数量、锁定记录数量
 */
export async function clearUserBankCards(userId: number, adminId: number, ip?: string) {
  // 1. 验证用户存在
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  // 2. 检查是否有待审核的提现订单（使用该用户任意银行卡）
  const pendingWithdraw = await prisma.withdrawOrder.findFirst({
    where: {
      userId,
      status: 'PENDING_REVIEW',
    },
    select: { orderNo: true },
  });

  if (pendingWithdraw) {
    throw new BusinessError(
      'BANK_CARD_IN_USE',
      `该用户有待审核的提现订单（${pendingWithdraw.orderNo}），请先处理后再清空银行卡`,
      400
    );
  }

  // 3. 事务中执行：软删除银行卡 + 删除锁定记录 + 操作日志
  const result = await prisma.$transaction(async (tx) => {
    // 3.1 软删除所有未删除的银行卡
    const cardResult = await tx.bankCard.updateMany({
      where: {
        userId,
        isDeleted: false,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 3.2 删除该用户的所有 AccountPhoneBind 锁定记录
    const lockResult = await tx.accountPhoneBind.deleteMany({
      where: { userId },
    });

    // 3.3 记录管理员操作日志
    await tx.adminOperationLog.create({
      data: {
        adminId,
        module: 'USER',
        action: 'CLEAR_BANK_CARDS',
        targetType: 'User',
        targetId: String(userId),
        afterData: {
          cardsCleared: cardResult.count,
          locksCleared: lockResult.count,
        },
        ip,
        remark: `清空银行卡 ${cardResult.count} 张，释放锁定 ${lockResult.count} 条`,
      },
    });

    return {
      cardsCleared: cardResult.count,
      locksCleared: lockResult.count,
    };
  });

  // 4. 清除用户缓存（银行卡数据已变化）
  await clearUserCache(userId);

  return result;
}

/**
 * 获取用户持仓订单
 * @description 依据：02.4-后台API接口清单.md 第3.9节
 */
export async function getUserPositions(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
  status?: 'ACTIVE' | 'COMPLETED'
) {
  const where: Prisma.PositionOrderWhereInput = { userId };
  if (status) {
    where.status = status;
  }

  const [list, total] = await Promise.all([
    prisma.positionOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true } },
      },
    }),
    prisma.positionOrder.count({ where }),
  ]);

  return {
    list: list.map(p => ({
      id: p.id,
      orderNo: p.orderNo,
      productName: p.product.name,
      purchaseAmount: formatAmount(p.purchaseAmount),
      dailyIncome: formatAmount(p.dailyIncome),
      cycleDays: p.cycleDays,
      paidDays: p.paidDays,
      earnedIncome: formatAmount(p.earnedIncome),
      status: p.status,
      isGift: p.isGift,
      startAt: p.startAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取用户充值记录
 * @description 依据：02.4-后台API接口清单.md 第3.10节
 */
export async function getUserRechargeOrders(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
  status?: string
) {
  const where: Prisma.RechargeOrderWhereInput = { userId };
  if (status) {
    where.status = status as any;
  }

  const [list, total] = await Promise.all([
    prisma.rechargeOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        channel: { select: { name: true } },
      },
    }),
    prisma.rechargeOrder.count({ where }),
  ]);

  return {
    list: list.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      amount: formatAmount(o.amount),
      actualAmount: o.actualAmount ? formatAmount(o.actualAmount) : null,
      channelName: o.channel.name,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取用户提现记录
 * @description 依据：02.4-后台API接口清单.md 第3.11节
 */
export async function getUserWithdrawOrders(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
  status?: string
) {
  const where: Prisma.WithdrawOrderWhereInput = { userId };
  if (status) {
    where.status = status as any;
  }

  const [list, total] = await Promise.all([
    prisma.withdrawOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.withdrawOrder.count({ where }),
  ]);

  return {
    list: list.map(o => {
      const snapshot = o.bankCardSnapshot as any;
      return {
        id: o.id,
        orderNo: o.orderNo,
        amount: formatAmount(o.amount),
        fee: formatAmount(o.fee),
        actualAmount: formatAmount(o.actualAmount),
        bankName: snapshot?.bankName || '',
        accountNoMask: snapshot?.accountNoMask || '',
        status: o.status,
        createdAt: o.createdAt.toISOString(),
      };
    }),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取用户资金流水
 * @description 依据：02.4-后台API接口清单.md 第3.12节
 */
export async function getUserTransactions(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
  type?: TransactionType
) {
  const where: Prisma.TransactionWhereInput = { userId };
  if (type) {
    where.type = type;
  }

  const [list, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.count({ where }),
  ]);

  // 流水类型映射
  const typeNameMap: Record<TransactionType, string> = {
    RECHARGE: '充值',
    WITHDRAW_FREEZE: '提现冻结',
    WITHDRAW_SUCCESS: '提现成功',
    WITHDRAW_REFUND: '提现退回',
    PURCHASE: '购买产品',
    INCOME: '收益到账',
    REFERRAL_COMMISSION: '推荐返佣',
    SIGN_IN: '签到奖励',
    ACTIVITY_REWARD: '活动奖励',
    REGISTER_BONUS: '注册奖励',
    ADMIN_ADD: '后台增加',
    ADMIN_DEDUCT: '后台扣减',
    SVIP_DAILY_REWARD: 'SVIP每日奖励',
    WEEKLY_SALARY: '周薪奖励',
    PRIZE_POOL: '奖池奖励',
    SPIN_WHEEL: '转盘奖励',
    FINANCIAL_PRINCIPAL: '理财本金返还',
    COMMUNITY_REWARD: '社区凭证奖励',
  };

  return {
    list: list.map(t => ({
      id: t.id,
      type: t.type,
      typeName: typeNameMap[t.type],
      amount: (Number(t.amount) > 0 ? '+' : '') + formatAmount(t.amount),
      balanceAfter: formatAmount(t.balanceAfter),
      relatedOrderNo: t.relatedOrderNo,
      remark: t.remark,
      createdAt: t.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取用户团队成员
 * @description 依据：02.4-后台API接口清单.md 第3.13节
 */
export async function getUserTeam(
  userId: number,
  page: number = 1,
  pageSize: number = 20,
  level?: number
) {
  // 根据层级查询
  let where: Prisma.UserWhereInput;
  if (level === 1) {
    where = { inviterId: userId };
  } else if (level === 2) {
    where = { level2InviterId: userId };
  } else if (level === 3) {
    where = { level3InviterId: userId };
  } else {
    where = {
      OR: [
        { inviterId: userId },
        { level2InviterId: userId },
        { level3InviterId: userId },
      ],
    };
  }

  const [list, total, level1Count, level2Count, level3Count, commissions] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { inviterId: userId } }),
    prisma.user.count({ where: { level2InviterId: userId } }),
    prisma.user.count({ where: { level3InviterId: userId } }),
    prisma.commissionRecord.aggregate({
      where: { receiverId: userId },
      _sum: { amount: true },
    }),
  ]);

  // 查询有效邀请
  const memberIds = list.map(m => m.id);
  const validInvitations = await prisma.validInvitation.findMany({
    where: {
      inviterId: userId,
      inviteeId: { in: memberIds },
    },
  });
  const validInviteSet = new Set(validInvitations.map(v => v.inviteeId));

  // 查询每个成员贡献的返佣
  const memberCommissions = await prisma.commissionRecord.groupBy({
    by: ['sourceUserId'],
    where: {
      receiverId: userId,
      sourceUserId: { in: memberIds },
    },
    _sum: { amount: true },
  });
  const commissionMap = new Map(memberCommissions.map(c => [c.sourceUserId, c._sum.amount]));

  // 确定成员层级
  const getMemberLevel = (member: typeof list[0]) => {
    if (member.inviterId === userId) return 1;
    if (member.level2InviterId === userId) return 2;
    if (member.level3InviterId === userId) return 3;
    return 0;
  };

  return {
    list: list.map(m => ({
      id: m.id,
      phone: m.phone,
      nickname: m.nickname,
      level: getMemberLevel(m),
      vipLevel: m.vipLevel,
      status: m.status,
      isValidInvite: validInviteSet.has(m.id),
      contributedCommission: formatAmount(commissionMap.get(m.id) ?? null),
      registeredAt: m.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    summary: {
      level1Count,
      level2Count,
      level3Count,
      totalCommission: formatAmount(commissions._sum.amount),
    },
  };
}

/**
 * 获取用户邀请链路
 * @description 依据：02.4-后台API接口清单.md 第3.14节
 */
export async function getUserUpline(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      nickname: true,
      inviterId: true,
      level2InviterId: true,
      level3InviterId: true,
    },
  });

  if (!user) {
    throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  }

  const [level1, level2, level3] = await Promise.all([
    user.inviterId
      ? prisma.user.findUnique({
          where: { id: user.inviterId },
          select: { id: true, phone: true, nickname: true, vipLevel: true, status: true },
        })
      : null,
    user.level2InviterId
      ? prisma.user.findUnique({
          where: { id: user.level2InviterId },
          select: { id: true, phone: true, nickname: true, vipLevel: true, status: true },
        })
      : null,
    user.level3InviterId
      ? prisma.user.findUnique({
          where: { id: user.level3InviterId },
          select: { id: true, phone: true, nickname: true, vipLevel: true, status: true },
        })
      : null,
  ]);

  return {
    user: { id: user.id, phone: user.phone, nickname: user.nickname },
    level1,
    level2,
    level3,
  };
}

// ================================
// 批量操作
// ================================

/**
 * 批量封禁用户
 * @description 依据：02.4-后台API接口清单.md 第3.15节
 */
export async function batchBanUsers(
  ids: number[],
  adminId: number,
  reason?: string,
  ip?: string
): Promise<BatchResult> {
  const results: BatchResult['results'] = [];

  for (const id of ids) {
    try {
      await banUser(id, adminId, reason, ip);
      results.push({ id, success: true });
    } catch (error) {
      if (error instanceof BusinessError) {
        results.push({ id, success: false, error: { code: error.code, message: error.message } });
      } else {
        results.push({ id, success: false, error: { code: 'INTERNAL_ERROR', message: '操作失败' } });
      }
    }
  }

  const succeeded = results.filter(r => r.success).length;
  return {
    total: ids.length,
    succeeded,
    failed: ids.length - succeeded,
    results,
  };
}

/**
 * 批量解封用户
 * @description 依据：02.4-后台API接口清单.md 第3.16节
 */
export async function batchUnbanUsers(
  ids: number[],
  adminId: number,
  ip?: string
): Promise<BatchResult> {
  const results: BatchResult['results'] = [];

  for (const id of ids) {
    try {
      await unbanUser(id, adminId, ip);
      results.push({ id, success: true });
    } catch (error) {
      if (error instanceof BusinessError) {
        results.push({ id, success: false, error: { code: error.code, message: error.message } });
      } else {
        results.push({ id, success: false, error: { code: 'INTERNAL_ERROR', message: '操作失败' } });
      }
    }
  }

  const succeeded = results.filter(r => r.success).length;
  return {
    total: ids.length,
    succeeded,
    failed: ids.length - succeeded,
    results,
  };
}

/**
 * 批量调整余额
 * @description 依据：02.4-后台API接口清单.md 第3.17节
 */
export async function batchAdjustBalance(
  ids: number[],
  params: BalanceAdjustParams,
  adminId: number,
  ip?: string
): Promise<BatchResult> {
  const results: BatchResult['results'] = [];

  for (const id of ids) {
    try {
      await adjustBalance(id, params, adminId, ip);
      results.push({ id, success: true });
    } catch (error) {
      if (error instanceof BusinessError) {
        results.push({ id, success: false, error: { code: error.code, message: error.message } });
      } else {
        results.push({ id, success: false, error: { code: 'INTERNAL_ERROR', message: '操作失败' } });
      }
    }
  }

  const succeeded = results.filter(r => r.success).length;
  return {
    total: ids.length,
    succeeded,
    failed: ids.length - succeeded,
    results,
  };
}
