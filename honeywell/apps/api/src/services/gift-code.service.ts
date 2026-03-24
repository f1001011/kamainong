/**
 * @file 礼品码服务
 * @description 礼品码创建、兑换（含拼手气红包算法）、查询等核心业务逻辑
 * 
 * 拼手气算法采用微信红包经典「二倍均值法」：
 * - 每次随机金额上限 = 剩余金额 / 剩余人数 * 2
 * - 最后一人领取全部剩余
 * - 保证每人至少拿到 minAmount
 * 适配 COP 无小数位特性，所有金额取整
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { formatNotificationAmount, getSystemTime } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 类型定义
// ================================

export interface CreateGiftCodeParams {
  name: string;
  amountType: 'FIXED' | 'RANDOM';
  requirement: 'NONE' | 'MUST_PURCHASE';
  fixedAmount?: number;
  totalAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  totalCount: number;
  startAt?: string | null;
  expireAt?: string | null;
  remark?: string;
}

export interface UpdateGiftCodeParams {
  name?: string;
  requirement?: 'NONE' | 'MUST_PURCHASE';
  startAt?: string | null;
  expireAt?: string | null;
  remark?: string;
}

export interface GiftCodeListParams {
  status?: string;
  amountType?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

// ================================
// 礼品码生成
// ================================

/**
 * 生成唯一礼品码（8位大写字母+数字，排除易混淆字符）
 */
async function generateUniqueCode(): Promise<string> {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await prisma.giftCode.findUnique({ where: { code } });
    if (!existing) return code;
  }

  throw Errors.internalError('无法生成唯一礼品码');
}

// ================================
// 拼手气红包算法（二倍均值法）
// ================================

/**
 * 计算随机红包金额
 * @param remainAmount 剩余总金额
 * @param remainCount 剩余份数
 * @param minAmount 每份最低金额
 * @param maxAmount 每份最高金额
 */
function calculateRandomAmount(
  remainAmount: number,
  remainCount: number,
  minAmount: number,
  maxAmount: number,
): number {
  if (remainCount === 1) return Math.round(remainAmount);

  const avg2x = Math.floor((remainAmount / remainCount) * 2);
  const safeMax = Math.min(avg2x, maxAmount, remainAmount - minAmount * (remainCount - 1));
  const safeLower = Math.max(minAmount, 1);

  if (safeLower >= safeMax) return Math.round(safeLower);
  return Math.floor(Math.random() * (safeMax - safeLower + 1)) + safeLower;
}

// ================================
// 管理员操作
// ================================

/**
 * 创建礼品码
 */
export async function createGiftCode(adminId: number, params: CreateGiftCodeParams) {
  const code = await generateUniqueCode();

  let totalAmount: number;
  let fixedAmount: number | null = null;
  let minAmount: number | null = null;
  let maxAmount: number | null = null;

  if (params.amountType === 'FIXED') {
    if (!params.fixedAmount || params.fixedAmount <= 0) {
      throw Errors.validationError('مبلغ ثابت غير صالح');
    }
    fixedAmount = params.fixedAmount;
    totalAmount = fixedAmount * params.totalCount;
  } else {
    if (!params.totalAmount || params.totalAmount <= 0) {
      throw Errors.validationError('المبلغ الإجمالي غير صالح');
    }
    if (!params.minAmount || !params.maxAmount) {
      throw Errors.validationError('نطاق المبلغ غير صالح');
    }
    if (params.minAmount <= 0 || params.maxAmount <= 0) {
      throw Errors.validationError('نطاق المبلغ غير صالح');
    }
    if (params.minAmount > params.maxAmount) {
      throw Errors.validationError('الحد الأدنى لا يمكن أن يكون أكبر من الحد الأقصى');
    }
    if (params.totalAmount < params.minAmount * params.totalCount) {
      throw Errors.validationError('المبلغ الإجمالي لا يكفي لتغطية الحد الأدنى لكل شخص');
    }
    totalAmount = params.totalAmount;
    minAmount = params.minAmount;
    maxAmount = params.maxAmount;
  }

  const giftCode = await prisma.giftCode.create({
    data: {
      code,
      name: params.name,
      amountType: params.amountType,
      requirement: params.requirement || 'NONE',
      fixedAmount: fixedAmount ? new Decimal(fixedAmount) : null,
      totalAmount: new Decimal(totalAmount),
      remainAmount: new Decimal(totalAmount),
      minAmount: minAmount ? new Decimal(minAmount) : null,
      maxAmount: maxAmount ? new Decimal(maxAmount) : null,
      totalCount: params.totalCount,
      startAt: params.startAt ? new Date(params.startAt) : null,
      expireAt: params.expireAt ? new Date(params.expireAt) : null,
      createdBy: adminId,
      remark: params.remark || null,
    },
  });

  return giftCode;
}

/**
 * 获取礼品码列表（管理员）
 */
export async function getGiftCodeList(params: GiftCodeListParams) {
  const { status, amountType, keyword, page = 1, pageSize = 20 } = params;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (amountType) where.amountType = amountType;
  if (keyword) {
    where.OR = [
      { code: { contains: keyword } },
      { name: { contains: keyword } },
    ];
  }

  const [list, total] = await Promise.all([
    prisma.giftCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        admin: { select: { nickname: true, username: true } },
        _count: { select: { claims: true } },
      },
    }),
    prisma.giftCode.count({ where }),
  ]);

  return {
    list: list.map(g => ({
      id: g.id,
      code: g.code,
      name: g.name,
      amountType: g.amountType,
      requirement: g.requirement,
      fixedAmount: g.fixedAmount?.toString() ?? null,
      totalAmount: g.totalAmount.toString(),
      remainAmount: g.remainAmount.toString(),
      minAmount: g.minAmount?.toString() ?? null,
      maxAmount: g.maxAmount?.toString() ?? null,
      totalCount: g.totalCount,
      claimedCount: g.claimedCount,
      status: g.status,
      startAt: g.startAt?.toISOString() ?? null,
      expireAt: g.expireAt?.toISOString() ?? null,
      createdBy: g.admin.nickname || g.admin.username,
      remark: g.remark,
      createdAt: g.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total },
  };
}

/**
 * 获取礼品码详情（管理员）
 */
export async function getGiftCodeDetail(id: number) {
  const giftCode = await prisma.giftCode.findUnique({
    where: { id },
    include: {
      admin: { select: { nickname: true, username: true } },
      claims: {
        include: { user: { select: { id: true, phone: true, nickname: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!giftCode) throw Errors.notFound('رمز الهدية');

  return {
    id: giftCode.id,
    code: giftCode.code,
    name: giftCode.name,
    amountType: giftCode.amountType,
    requirement: giftCode.requirement,
    fixedAmount: giftCode.fixedAmount?.toString() ?? null,
    totalAmount: giftCode.totalAmount.toString(),
    remainAmount: giftCode.remainAmount.toString(),
    minAmount: giftCode.minAmount?.toString() ?? null,
    maxAmount: giftCode.maxAmount?.toString() ?? null,
    totalCount: giftCode.totalCount,
    claimedCount: giftCode.claimedCount,
    status: giftCode.status,
    startAt: giftCode.startAt?.toISOString() ?? null,
    expireAt: giftCode.expireAt?.toISOString() ?? null,
    createdBy: giftCode.admin.nickname || giftCode.admin.username,
    remark: giftCode.remark,
    createdAt: giftCode.createdAt.toISOString(),
    claims: giftCode.claims.map(c => ({
      id: c.id,
      userId: c.user.id,
      phone: c.user.phone,
      nickname: c.user.nickname,
      amount: c.amount.toString(),
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

/**
 * 更新礼品码（仅允许修改非核心字段）
 */
export async function updateGiftCode(id: number, params: UpdateGiftCodeParams) {
  const existing = await prisma.giftCode.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('رمز الهدية');

  const data: Record<string, unknown> = {};
  if (params.name !== undefined) data.name = params.name;
  if (params.requirement !== undefined) data.requirement = params.requirement;
  if (params.remark !== undefined) data.remark = params.remark;
  if (params.startAt !== undefined) data.startAt = params.startAt ? new Date(params.startAt) : null;
  if (params.expireAt !== undefined) data.expireAt = params.expireAt ? new Date(params.expireAt) : null;

  return prisma.giftCode.update({ where: { id }, data });
}

/**
 * 切换礼品码状态（启用/禁用）
 * 已领完或已过期的礼品码不允许重新启用
 */
export async function toggleGiftCodeStatus(id: number, enabled: boolean) {
  const existing = await prisma.giftCode.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('رمز الهدية');

  if (enabled && existing.status === 'EXHAUSTED') {
    throw Errors.validationError('已领完的礼品码无法重新启用');
  }
  if (enabled && existing.status === 'EXPIRED') {
    throw Errors.validationError('已过期的礼品码无法重新启用');
  }

  return prisma.giftCode.update({
    where: { id },
    data: { status: enabled ? 'ACTIVE' : 'DISABLED' },
  });
}

/**
 * 删除礼品码（仅无领取记录时可删）
 */
export async function deleteGiftCode(id: number) {
  const existing = await prisma.giftCode.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound('رمز الهدية');
  if (existing.claimedCount > 0) throw Errors.adminGiftCodeHasClaims();

  return prisma.giftCode.delete({ where: { id } });
}

// ================================
// 用户操作
// ================================

/**
 * 兑换礼品码（核心接口，含并发安全控制）
 */
export async function redeemGiftCode(userId: number, codeStr: string) {
  const code = codeStr.trim().toUpperCase();
  const systemTime = await getSystemTime();

  const giftCode = await prisma.giftCode.findUnique({ where: { code } });

  // 1. 基础校验
  if (!giftCode) throw Errors.giftCodeNotFound();
  if (giftCode.status === 'DISABLED') throw Errors.giftCodeDisabled();
  if (giftCode.status === 'EXHAUSTED') throw Errors.giftCodeExhausted();
  if (giftCode.status === 'EXPIRED') throw Errors.giftCodeExpired();

  // 2. 时间校验
  if (giftCode.startAt && systemTime < giftCode.startAt) throw Errors.giftCodeNotStarted();
  if (giftCode.expireAt && systemTime > giftCode.expireAt) throw Errors.giftCodeExpired();

  // 3. 份数校验
  if (giftCode.claimedCount >= giftCode.totalCount) throw Errors.giftCodeExhausted();

  // 4. 重复领取校验
  const existingClaim = await prisma.giftCodeClaim.findUnique({
    where: { giftCodeId_userId: { giftCodeId: giftCode.id, userId } },
  });
  if (existingClaim) throw Errors.giftCodeAlreadyClaimed();

  // 5. 前置条件校验
  if (giftCode.requirement === 'MUST_PURCHASE') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasPurchasedPaid: true },
    });
    if (!user?.hasPurchasedPaid) throw Errors.giftCodeRequirePurchase();
  }

  // 6. 计算金额
  const remainAmount = Number(giftCode.remainAmount);
  const remainCount = giftCode.totalCount - giftCode.claimedCount;
  let amount: number;

  if (giftCode.amountType === 'FIXED') {
    amount = Number(giftCode.fixedAmount);
  } else {
    amount = calculateRandomAmount(
      remainAmount,
      remainCount,
      Number(giftCode.minAmount),
      Number(giftCode.maxAmount),
    );
  }

  const amountDecimal = new Decimal(amount);

  // 7. 事务执行（原子操作防超领）
  const result = await prisma.$transaction(async (tx) => {
    // 7a. 乐观锁更新礼品码（claimedCount < totalCount 才成功）
    const updated = await tx.giftCode.updateMany({
      where: {
        id: giftCode.id,
        claimedCount: { lt: giftCode.totalCount },
        remainAmount: { gte: amountDecimal },
      },
      data: {
        claimedCount: { increment: 1 },
        remainAmount: { decrement: amountDecimal },
      },
    });

    if (updated.count === 0) throw Errors.giftCodeExhausted();

    // 7b. 创建领取记录
    await tx.giftCodeClaim.create({
      data: {
        giftCodeId: giftCode.id,
        userId,
        amount: amountDecimal,
      },
    });

    // 7c. 用户加款
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { availableBalance: { increment: amountDecimal } },
      select: { availableBalance: true },
    });

    // 7d. 写入流水
    await tx.transaction.create({
      data: {
        userId,
        type: 'GIFT_CODE',
        amount: amountDecimal,
        balanceAfter: updatedUser.availableBalance,
        remark: `رمز هدية: ${giftCode.name}`,
      },
    });

    // 7e. 发送通知
    const amountStr = await formatNotificationAmount(amount);
    await tx.notification.create({
      data: {
        userId,
        type: 'ACTIVITY_REWARD',
        title: 'تم استخدام رمز الهدية',
        content: `تم استخدام رمز الهدية بنجاح وحصلت على ${amountStr}.`,
      },
    });

    // 7f. 如果已领完，基于数据库当前状态判断（防止并发时两人都跳过此检查）
    await tx.giftCode.updateMany({
      where: {
        id: giftCode.id,
        claimedCount: { gte: giftCode.totalCount },
        status: 'ACTIVE',
      },
      data: { status: 'EXHAUSTED' },
    });

    return {
      amount: amount.toString(),
      giftCodeName: giftCode.name,
    };
  });

  await clearUserCache(userId);

  return result;
}

/**
 * 获取用户兑换历史
 */
export async function getUserRedeemHistory(userId: number, page: number, pageSize: number) {
  const [list, total] = await Promise.all([
    prisma.giftCodeClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        giftCode: { select: { name: true, code: true } },
      },
    }),
    prisma.giftCodeClaim.count({ where: { userId } }),
  ]);

  return {
    list: list.map(c => ({
      id: c.id,
      giftCodeName: c.giftCode.name,
      amount: c.amount.toString(),
      createdAt: c.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
