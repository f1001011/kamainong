/**
 * @file 后台账户锁定管理服务
 * @description 管理银行账户-手机号锁定记录的查询、解锁、删除等功能
 * 
 * 核心业务规则：
 * 1. 银行账户首次绑定后自动锁定到用户注册手机号
 * 2. 管理员可解锁/重锁某条记录（isLocked 切换）
 * 3. 管理员可删除锁定记录（完全放开该银行账户）
 * 4. 解锁后新用户绑定时，系统自动更新记录并重新锁定
 */

import { prisma } from '@/lib/prisma';
import { aesDecrypt } from '@honeywell/utils';
import { Prisma } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * 锁定记录列表查询参数
 */
export interface AccountLockListParams {
  page?: number;
  pageSize?: number;
  phone?: string;
  accountNoMask?: string;
  isLocked?: boolean;
}

/**
 * 锁定记录列表项
 */
export interface AccountLockListItem {
  id: number;
  accountNo: string;
  accountNoMask: string;
  phone: string;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  isLocked: boolean;
  unlockedBy: number | null;
  unlockedByName: string | null;
  unlockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ================================
// 服务函数
// ================================

/**
 * 获取锁定记录列表（分页）
 */
export async function getAccountLockList(params: AccountLockListParams) {
  const {
    page = 1,
    pageSize = 20,
    phone,
    accountNoMask,
    isLocked,
  } = params;

  const where: Prisma.AccountPhoneBindWhereInput = {};

  if (phone) {
    where.phone = { contains: phone };
  }
  if (accountNoMask) {
    where.accountNoMask = { contains: accountNoMask };
  }
  if (isLocked !== undefined) {
    where.isLocked = isLocked;
  }

  const [records, total] = await Promise.all([
    prisma.accountPhoneBind.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.accountPhoneBind.count({ where }),
  ]);

  // 批量查询关联用户信息
  const userIds = [...new Set(records.map(r => r.userId))];
  const adminIds = [...new Set(records.filter(r => r.unlockedBy).map(r => r.unlockedBy!))];

  const [users, admins] = await Promise.all([
    userIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, phone: true, nickname: true },
        })
      : [],
    adminIds.length > 0
      ? prisma.admin.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, nickname: true, username: true },
        })
      : [],
  ]);

  const userMap = new Map(users.map(u => [u.id, u]));
  const adminMap = new Map(admins.map(a => [a.id, a]));

  const list: AccountLockListItem[] = records.map(record => {
    const user = userMap.get(record.userId);
    const admin = record.unlockedBy ? adminMap.get(record.unlockedBy) : null;

    let decryptedAccountNo = '';
    try {
      decryptedAccountNo = aesDecrypt(record.accountNo);
    } catch {
      decryptedAccountNo = '[解密失败]';
    }

    return {
      id: record.id,
      accountNo: decryptedAccountNo,
      accountNoMask: record.accountNoMask,
      phone: record.phone,
      userId: record.userId,
      userPhone: user?.phone ?? '',
      userNickname: user?.nickname ?? null,
      isLocked: record.isLocked,
      unlockedBy: record.unlockedBy,
      unlockedByName: admin ? (admin.nickname || admin.username) : null,
      unlockedAt: record.unlockedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  });

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
 * 切换锁定状态（解锁/重锁）
 * @param id - 锁定记录ID
 * @param adminId - 操作管理员ID
 * @returns 更新后的记录
 */
export async function toggleAccountLock(id: number, adminId: number) {
  const record = await prisma.accountPhoneBind.findUnique({
    where: { id },
  });

  if (!record) {
    throw new Error('锁定记录不存在');
  }

  const newIsLocked = !record.isLocked;

  const updated = await prisma.accountPhoneBind.update({
    where: { id },
    data: {
      isLocked: newIsLocked,
      unlockedBy: newIsLocked ? null : adminId,
      unlockedAt: newIsLocked ? null : new Date(),
    },
  });

  return {
    id: updated.id,
    isLocked: updated.isLocked,
  };
}

/**
 * 删除锁定记录（完全放开该银行账户）
 * @param id - 锁定记录ID
 */
export async function deleteAccountLock(id: number) {
  const record = await prisma.accountPhoneBind.findUnique({
    where: { id },
  });

  if (!record) {
    throw new Error('锁定记录不存在');
  }

  await prisma.accountPhoneBind.delete({
    where: { id },
  });
}
