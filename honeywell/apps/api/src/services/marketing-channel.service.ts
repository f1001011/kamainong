/**
 * @file 渠道链接管理服务
 * @description 处理渠道链接的 CRUD 操作、批量统计计算、邀请链接生成
 * @depends 渠道链接.md - 渠道链接管理功能完整方案
 *
 * 核心业务规则：
 * 1. 每个渠道绑定唯一用户（userId unique），避免统计重叠
 * 2. 渠道追踪完全基于已有邀请关系，零侵入业务逻辑
 * 3. 统计数据通过批量查询计算，固定 5 次查询不随渠道数增长
 * 4. 域名从 GlobalConfig 的 site_domain 键获取，禁止硬编码
 */

import { prisma, Prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { getConfig } from '@/lib/config';

// ================================
// 类型定义
// ================================

/** 渠道统计摘要 */
export interface ChannelStats {
  registerCount: number;
  firstRechargeCount: number;
  firstRechargeRate: string;       // 百分比字符串（如 "53.33"）
  repeatRechargeCount: number;
  totalGrossRecharge: string;      // 毛额（如 "30000.00"）
  totalFee: string;                // 手续费（如 "5000.00"）
  totalNetRecharge: string;        // 净额（如 "25000.00"）
  avgRechargePerUser: string;      // 人均（如 "375.00"）
}

/** 渠道列表项 */
export interface MarketingChannelListItem {
  id: number;
  name: string;
  userId: number;
  userPhone: string;
  userInviteCode: string;
  inviteLink: string;
  isActive: boolean;
  remark: string | null;
  stats: ChannelStats;
  createdAt: string;
}

/** 渠道列表查询参数 */
export interface ChannelListParams {
  page: number;
  pageSize: number;
  keyword?: string;
  isActive?: boolean;
}

/** 创建渠道参数 */
export interface CreateChannelData {
  name: string;
  userId: number;
  remark?: string;
}

/** 更新渠道参数 */
export interface UpdateChannelData {
  name?: string;
  remark?: string | null;
  isActive?: boolean;
}

// ================================
// 邀请链接生成
// ================================

/**
 * 获取站点域名前缀（含协议）
 * @description 域名从 GlobalConfig 的 site_domain 键获取，禁止硬编码
 */
async function getSiteDomainPrefix(): Promise<string> {
  const domain = await getConfig<string>('site_domain', '');
  const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
  return normalizedDomain.replace(/\/$/, '');
}

/**
 * 生成渠道邀请链接
 * @param inviteCode - 用户邀请码
 * @param domainPrefix - 可选，预获取的域名前缀（列表页批量生成时传入以避免重复读取配置）
 */
async function buildInviteLink(inviteCode: string, domainPrefix?: string): Promise<string> {
  const prefix = domainPrefix ?? await getSiteDomainPrefix();
  return `${prefix}/register?ref=${inviteCode}`;
}

// ================================
// 批量统计计算
// ================================

/**
 * 批量计算多个渠道的统计数据
 * @description 设计原则：无论当前页有多少个渠道，查询次数固定为 5 次，不随渠道数量增长
 * @param userIds - 当前页所有渠道关联的 userId 数组
 */
async function batchCalculateStats(userIds: number[]): Promise<Map<number, ChannelStats>> {
  if (userIds.length === 0) return new Map();

  // === 查询1: 注册人数（按 inviterId 分组 COUNT）===
  const registerCounts = await prisma.user.groupBy({
    by: ['inviterId'],
    where: { inviterId: { in: userIds } },
    _count: { id: true },
  });

  // === 查询2: 首冲人数（下线中 hasRecharged = true 的用户数）===
  // 注意：hasRecharged 在充值回调成功时和后台补单时被设为 true
  const firstRechargeCounts = await prisma.user.groupBy({
    by: ['inviterId'],
    where: {
      inviterId: { in: userIds },
      hasRecharged: true,
    },
    _count: { id: true },
  });

  // === 查询3: 每个下线用户的充值订单数（用于计算老客）===
  const rechargeByUser = await prisma.rechargeOrder.groupBy({
    by: ['userId'],
    where: {
      user: { inviterId: { in: userIds } },
      status: 'PAID',
      actualAmount: { not: null },
    },
    _count: { id: true },
  });

  // === 查询4: 下线用户→所属渠道的映射 ===
  const downlineUserIds = rechargeByUser.map(r => r.userId);
  let userToInviter = new Map<number, number>();
  if (downlineUserIds.length > 0) {
    const userInviters = await prisma.user.findMany({
      where: { id: { in: downlineUserIds } },
      select: { id: true, inviterId: true },
    });
    userToInviter = new Map(
      userInviters
        .filter(u => u.inviterId !== null)
        .map(u => [u.id, u.inviterId!])
    );
  }

  // === 查询5: 所有相关充值订单（用于金额和手续费计算）===
  const ordersForFee = await prisma.rechargeOrder.findMany({
    where: {
      user: { inviterId: { in: userIds } },
      status: 'PAID',
      actualAmount: { not: null },
    },
    select: {
      userId: true,
      actualAmount: true,
      channel: { select: { payFeeRate: true } },
    },
  });

  // === 汇总计算 ===
  const statsMap = new Map<number, ChannelStats>();

  // 初始化所有渠道的统计为 0
  for (const uid of userIds) {
    statsMap.set(uid, {
      registerCount: 0,
      firstRechargeCount: 0,
      firstRechargeRate: '0.00',
      repeatRechargeCount: 0,
      totalGrossRecharge: '0.00',
      totalFee: '0.00',
      totalNetRecharge: '0.00',
      avgRechargePerUser: '0.00',
    });
  }

  // 填充注册人数
  for (const r of registerCounts) {
    const stats = statsMap.get(r.inviterId!);
    if (stats) stats.registerCount = r._count.id;
  }

  // 填充首冲人数 + 计算首冲率
  for (const r of firstRechargeCounts) {
    const stats = statsMap.get(r.inviterId!);
    if (stats) {
      stats.firstRechargeCount = r._count.id;
      stats.firstRechargeRate = stats.registerCount > 0
        ? (r._count.id / stats.registerCount * 100).toFixed(2)
        : '0.00';
    }
  }

  // 填充老客充值人数
  const repeatCountByInviter = new Map<number, number>();
  for (const r of rechargeByUser) {
    const inviterId = userToInviter.get(r.userId);
    if (inviterId !== undefined && r._count.id >= 2) {
      repeatCountByInviter.set(inviterId, (repeatCountByInviter.get(inviterId) ?? 0) + 1);
    }
  }
  for (const [inviterId, count] of repeatCountByInviter) {
    const stats = statsMap.get(inviterId);
    if (stats) stats.repeatRechargeCount = count;
  }

  // 填充金额统计（逐笔计算手续费，按渠道归类）
  const grossByInviter = new Map<number, number>();
  const feeByInviter = new Map<number, number>();
  for (const order of ordersForFee) {
    const inviterId = userToInviter.get(order.userId);
    if (inviterId === undefined) continue;

    const amount = Number(order.actualAmount);
    const feeRate = Number(order.channel?.payFeeRate ?? 0);
    const fee = amount * feeRate / 100;

    grossByInviter.set(inviterId, (grossByInviter.get(inviterId) ?? 0) + amount);
    feeByInviter.set(inviterId, (feeByInviter.get(inviterId) ?? 0) + fee);
  }

  for (const uid of userIds) {
    const stats = statsMap.get(uid)!;
    const gross = grossByInviter.get(uid) ?? 0;
    const fee = feeByInviter.get(uid) ?? 0;
    stats.totalGrossRecharge = gross.toFixed(2);
    stats.totalFee = fee.toFixed(2);
    stats.totalNetRecharge = (gross - fee).toFixed(2);
    stats.avgRechargePerUser = stats.firstRechargeCount > 0
      ? (gross / stats.firstRechargeCount).toFixed(2)
      : '0.00';
  }

  return statsMap;
}

// ================================
// CRUD 操作
// ================================

/**
 * 获取渠道列表（含统计数据）
 * @description 依据：渠道链接.md 第4.3.1节
 */
export async function getChannelList(params: ChannelListParams) {
  const { page, pageSize, keyword, isActive } = params;

  // 构建查询条件
  const where: Prisma.MarketingChannelWhereInput = {};
  if (keyword) {
    where.name = { contains: keyword };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // 查询总数
  const total = await prisma.marketingChannel.count({ where });

  // 查询渠道列表
  const channels = await prisma.marketingChannel.findMany({
    where,
    include: {
      user: {
        select: { id: true, phone: true, inviteCode: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // 批量计算统计数据
  const userIds = channels.map(c => c.userId);
  const statsMap = await batchCalculateStats(userIds);

  // 预获取域名前缀（只调用一次 getConfig，避免 N 次重复读取）
  const domainPrefix = await getSiteDomainPrefix();

  // 组装响应数据
  const list: MarketingChannelListItem[] = await Promise.all(
    channels.map(async (channel) => {
      const inviteLink = await buildInviteLink(channel.user.inviteCode, domainPrefix);
      const stats = statsMap.get(channel.userId) ?? {
        registerCount: 0,
        firstRechargeCount: 0,
        firstRechargeRate: '0.00',
        repeatRechargeCount: 0,
        totalGrossRecharge: '0.00',
        totalFee: '0.00',
        totalNetRecharge: '0.00',
        avgRechargePerUser: '0.00',
      };

      return {
        id: channel.id,
        name: channel.name,
        userId: channel.userId,
        userPhone: channel.user.phone,
        userInviteCode: channel.user.inviteCode,
        inviteLink,
        isActive: channel.isActive,
        remark: channel.remark,
        stats,
        createdAt: channel.createdAt.toISOString(),
      };
    })
  );

  return {
    list,
    pagination: { page, pageSize, total },
  };
}

/**
 * 创建渠道
 * @description 依据：渠道链接.md 第4.3.2节
 */
export async function createChannel(data: CreateChannelData, adminId: number, ip: string) {
  // 1. 校验用户存在且为 ACTIVE
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, status: true, inviteCode: true, phone: true },
  });
  if (!user) throw new BusinessError('USER_NOT_FOUND', '用户不存在', 404);
  if (user.status !== 'ACTIVE') throw new BusinessError('USER_BANNED', '该用户已被封禁，无法绑定渠道', 400);

  // 2. 创建渠道（unique 约束自动防重复绑定）
  let channel;
  try {
    channel = await prisma.marketingChannel.create({
      data: {
        name: data.name,
        userId: data.userId,
        remark: data.remark,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BusinessError('CHANNEL_USER_EXISTS', '该用户已被其他渠道绑定', 400);
    }
    throw error;
  }

  // 3. 操作日志
  await prisma.adminOperationLog.create({
    data: {
      adminId,
      module: 'MARKETING_CHANNEL',
      action: 'CREATE',
      targetType: 'MarketingChannel',
      targetId: String(channel.id),
      afterData: { name: data.name, userId: data.userId },
      ip,
    },
  });

  // 4. 构建邀请链接并返回
  const inviteLink = await buildInviteLink(user.inviteCode);

  return {
    id: channel.id,
    name: channel.name,
    userId: channel.userId,
    userPhone: user.phone,
    userInviteCode: user.inviteCode,
    inviteLink,
    isActive: channel.isActive,
    remark: channel.remark,
    stats: {
      registerCount: 0,
      firstRechargeCount: 0,
      firstRechargeRate: '0.00',
      repeatRechargeCount: 0,
      totalGrossRecharge: '0.00',
      totalFee: '0.00',
      totalNetRecharge: '0.00',
      avgRechargePerUser: '0.00',
    },
    createdAt: channel.createdAt.toISOString(),
  };
}

/**
 * 获取渠道详情（含下线用户列表）
 * @description 依据：渠道链接.md 第4.3.3节
 */
export async function getChannelDetail(id: number, page: number = 1, pageSize: number = 20) {
  // 查询渠道
  const channel = await prisma.marketingChannel.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, phone: true, inviteCode: true },
      },
    },
  });
  if (!channel) throw new BusinessError('NOT_FOUND', '渠道不存在', 404);

  // 获取统计数据
  const statsMap = await batchCalculateStats([channel.userId]);
  const stats = statsMap.get(channel.userId) ?? {
    registerCount: 0,
    firstRechargeCount: 0,
    firstRechargeRate: '0.00',
    repeatRechargeCount: 0,
    totalGrossRecharge: '0.00',
    totalFee: '0.00',
    totalNetRecharge: '0.00',
    avgRechargePerUser: '0.00',
  };

  // 生成邀请链接
  const inviteLink = await buildInviteLink(channel.user.inviteCode);

  // 查询下线用户总数
  const userTotal = await prisma.user.count({
    where: { inviterId: channel.userId },
  });

  // 获取下线用户列表（含充值信息）
  const downlineUsers = await prisma.user.findMany({
    where: { inviterId: channel.userId },
    select: {
      id: true, phone: true, status: true, createdAt: true,
      rechargeOrders: {
        where: { status: 'PAID' },
        select: { actualAmount: true, callbackAt: true },
        orderBy: { callbackAt: 'asc' },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  });

  // 映射为响应格式
  const userList = downlineUsers.map(u => {
    const paidOrders = u.rechargeOrders;
    return {
      id: u.id,
      phone: u.phone,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      rechargeCount: paidOrders.length,
      totalRechargeAmount: paidOrders.reduce((s, o) => s + Number(o.actualAmount ?? 0), 0).toFixed(2),
      firstRechargeAt: paidOrders[0]?.callbackAt?.toISOString() ?? null,
      lastRechargeAt: paidOrders.length > 0 ? paidOrders[paidOrders.length - 1]?.callbackAt?.toISOString() ?? null : null,
    };
  });

  return {
    channel: {
      id: channel.id,
      name: channel.name,
      userId: channel.userId,
      userPhone: channel.user.phone,
      userInviteCode: channel.user.inviteCode,
      inviteLink,
      isActive: channel.isActive,
      remark: channel.remark,
      stats,
      createdAt: channel.createdAt.toISOString(),
    },
    users: {
      list: userList,
      pagination: { page, pageSize, total: userTotal },
    },
  };
}

/**
 * 更新渠道
 * @description 依据：渠道链接.md 第4.3.4节
 * 注意：不包含 userId 字段，防止改绑
 */
export async function updateChannel(id: number, data: UpdateChannelData, adminId: number, ip: string) {
  // 查询旧数据（用于操作日志）
  const old = await prisma.marketingChannel.findUnique({
    where: { id },
    include: {
      user: {
        select: { phone: true, inviteCode: true },
      },
    },
  });
  if (!old) throw new BusinessError('NOT_FOUND', '渠道不存在', 404);

  // 更新渠道
  const updateData: Prisma.MarketingChannelUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.remark !== undefined) updateData.remark = data.remark;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await prisma.marketingChannel.update({
    where: { id },
    data: updateData,
  });

  // 操作日志
  await prisma.adminOperationLog.create({
    data: {
      adminId,
      module: 'MARKETING_CHANNEL',
      action: 'UPDATE',
      targetType: 'MarketingChannel',
      targetId: String(id),
      beforeData: { name: old.name, isActive: old.isActive, remark: old.remark },
      afterData: JSON.parse(JSON.stringify(data)),
      ip,
    },
  });

  // 构建返回数据
  const inviteLink = await buildInviteLink(old.user.inviteCode);
  const statsMap = await batchCalculateStats([updated.userId]);
  const stats = statsMap.get(updated.userId) ?? {
    registerCount: 0,
    firstRechargeCount: 0,
    firstRechargeRate: '0.00',
    repeatRechargeCount: 0,
    totalGrossRecharge: '0.00',
    totalFee: '0.00',
    totalNetRecharge: '0.00',
    avgRechargePerUser: '0.00',
  };

  return {
    id: updated.id,
    name: updated.name,
    userId: updated.userId,
    userPhone: old.user.phone,
    userInviteCode: old.user.inviteCode,
    inviteLink,
    isActive: updated.isActive,
    remark: updated.remark,
    stats,
    createdAt: updated.createdAt.toISOString(),
  };
}

/**
 * 删除渠道
 * @description 依据：渠道链接.md 第4.3.5节
 * 仅删渠道记录，不影响用户和下级
 */
export async function deleteChannel(id: number, adminId: number, ip: string) {
  // 检查渠道是否存在
  const channel = await prisma.marketingChannel.findUnique({ where: { id } });
  if (!channel) throw new BusinessError('NOT_FOUND', '渠道不存在', 404);

  // 删除渠道
  await prisma.marketingChannel.delete({ where: { id } });

  // 操作日志
  await prisma.adminOperationLog.create({
    data: {
      adminId,
      module: 'MARKETING_CHANNEL',
      action: 'DELETE',
      targetType: 'MarketingChannel',
      targetId: String(id),
      beforeData: { name: channel.name, userId: channel.userId },
      ip,
    },
  });
}
