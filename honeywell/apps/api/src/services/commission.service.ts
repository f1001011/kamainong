/**
 * @file 返佣服务
 * @description 处理三级分销返佣计算、发放、记录等核心业务逻辑
 * @depends 开发文档/开发文档.md 第4.5节 - 团队返佣
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - CommissionRecord表
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第7.3节 - 返佣触发条件和计算规则
 *
 * 核心业务规则：
 * 1. ⚠️ 必须使用 product.type 判断产品类型，禁止使用 code
 * 2. 仅付费产品（type=PAID）触发返佣，体验产品（type=TRIAL）不触发
 * 3. 仅用户首次购买付费产品触发返佣（firstPurchaseDone=false）
 * 4. 赠送产品（isGift=true）不触发返佣
 * 5. 上级用户被封禁（status=BANNED）则跳过该级返佣
 * 6. 返佣金额向下取整到分：Math.floor(amount * rate * 100) / 100
 *
 * 返佣比例（从 GlobalConfig 获取，禁止硬编码）：
 * - 一级（直接邀请人）：12%
 * - 二级（邀请人的邀请人）：3%
 * - 三级（邀请人的邀请人的邀请人）：1%
 */

import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@honeywell/database';
import { prisma } from '@/lib/prisma';
import { clearUserCache } from '@/lib/redis';

// ================================
// 类型定义
// ================================

/**
 * 返佣级别枚举
 */
export type CommissionLevel = 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';

/**
 * 返佣比例配置
 */
export interface CommissionRates {
  level1: Decimal; // 一级返佣比例（百分比，如 20 表示 20%）
  level2: Decimal; // 二级返佣比例
  level3: Decimal; // 三级返佣比例
}

/**
 * 返佣处理参数
 */
export interface ProcessCommissionParams {
  /** 购买用户ID */
  userId: number;
  /** 产品类型：TRIAL | PAID */
  productType: string;
  /** 产品价格（返佣计算基数） */
  productPrice: Decimal;
  /** 产品名称（用于流水备注） */
  productName: string;
  /** 持仓订单ID */
  positionOrderId: number;
  /** 持仓订单号（用于流水关联） */
  orderNo: string;
  /** 是否为赠送产品 */
  isGift: boolean;
}

/**
 * 返佣发放结果
 */
export interface CommissionResult {
  /** 是否成功处理 */
  success: boolean;
  /** 是否实际发放了返佣 */
  commissionDistributed: boolean;
  /** 跳过原因（如有） */
  skipReason?: string;
  /** 发放的返佣记录数量 */
  recordCount: number;
  /** 发放的返佣总金额 */
  totalAmount: Decimal;
  /** 受影响的用户ID列表（需要在事务提交后清缓存） */
  affectedUserIds?: number[];
}

/**
 * 单条返佣记录详情
 */
export interface CommissionRecordDetail {
  receiverId: number;
  sourceUserId: number;
  positionOrderId: number;
  level: CommissionLevel;
  rate: Decimal;
  baseAmount: Decimal;
  amount: Decimal;
}

// ================================
// 返佣服务类
// ================================

/**
 * 返佣服务类
 * @description 提供返佣计算、发放、查询等功能
 */
export class CommissionService {
  /**
   * 获取返佣比例配置
   * @description 从 GlobalConfig 表获取返佣比例，禁止硬编码
   * @depends 开发文档.md 第4.5节 - 返佣比例从数据库配置获取
   * @returns 返佣比例配置
   */
  async getCommissionRates(): Promise<CommissionRates> {
    // 批量获取配置，减少数据库查询次数
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          in: [
            'commission_level1_rate',
            'commission_level2_rate',
            'commission_level3_rate',
          ],
        },
      },
      select: { key: true, value: true },
    });

    // 构建配置 Map
    const configMap = new Map<string, number>();
    for (const config of configs) {
      // 处理 value 可能是 number 或 string 的情况
      const value =
        typeof config.value === 'number'
          ? config.value
          : parseFloat(String(config.value));
      configMap.set(config.key, isNaN(value) ? 0 : value);
    }

    // 返回配置，使用默认值：一级12%、二级3%、三级1%
    return {
      level1: new Decimal(configMap.get('commission_level1_rate') ?? 12),
      level2: new Decimal(configMap.get('commission_level2_rate') ?? 3),
      level3: new Decimal(configMap.get('commission_level3_rate') ?? 1),
    };
  }

  /**
   * 计算返佣金额（向下取整到分）
   * @description 依据：开发文档.md 第16.5节 - 金额计算精度规则
   * @param baseAmount 返佣基数（产品价格）
   * @param rate 返佣比例（百分比，如 20 表示 20%）
   * @returns 返佣金额（向下取整到分）
   */
  calculateCommission(baseAmount: Decimal, rate: Decimal): Decimal {
    // 计算：baseAmount * rate / 100
    // 向下取整到分：Math.floor(result * 100) / 100
    const rawAmount = baseAmount.mul(rate).div(100);
    const flooredAmount = Math.floor(rawAmount.toNumber() * 100) / 100;
    return new Decimal(flooredAmount);
  }

  /**
   * 检查是否应该触发返佣
   * @description 依据：开发文档.md 第4.5节 - 返佣触发条件
   * @param params 检查参数
   * @returns { shouldProcess: boolean, reason?: string }
   */
  async checkShouldProcessCommission(params: {
    userId: number;
    productType: string;
    isGift: boolean;
    tx?: Prisma.TransactionClient;
  }): Promise<{ shouldProcess: boolean; reason?: string }> {
    const { userId, productType, isGift, tx } = params;
    const db = tx || prisma;

    // 1. 检查产品类型（PAID和FINANCIAL均触发返佣，TRIAL不触发）
    if (productType !== 'PAID' && productType !== 'FINANCIAL') {
      return {
        shouldProcess: false,
        reason: '体验产品不触发返佣',
      };
    }

    // 2. 检查是否赠送订单
    // 依据：开发文档.md 第16.9节 - 赠送产品不触发返佣
    if (isGift) {
      return {
        shouldProcess: false,
        reason: '赠送产品不触发返佣',
      };
    }

    // 3. 检查是否首次购买付费产品
    // 依据：开发文档.md 第4.5节 - 仅首次购买触发返佣
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { firstPurchaseDone: true },
    });

    if (!user) {
      return {
        shouldProcess: false,
        reason: '用户不存在',
      };
    }

    if (user.firstPurchaseDone) {
      return {
        shouldProcess: false,
        reason: '非首次购买付费产品',
      };
    }

    return { shouldProcess: true };
  }

  /**
   * 处理返佣发放
   * @description 核心返佣处理方法，在事务中调用
   * @depends 开发文档.md 第4.5节 - 团队返佣
   * @param tx Prisma 事务客户端
   * @param params 返佣参数
   * @returns 返佣处理结果
   */
  async processCommission(
    tx: Prisma.TransactionClient,
    params: ProcessCommissionParams
  ): Promise<CommissionResult> {
    const {
      userId,
      productType,
      productPrice,
      productName,
      positionOrderId,
      orderNo,
      isGift,
    } = params;

    // 1. 检查是否应该触发返佣（使用事务客户端确保数据一致性）
    const checkResult = await this.checkShouldProcessCommission({
      userId,
      productType,
      isGift,
      tx,
    });

    if (!checkResult.shouldProcess) {
      return {
        success: true,
        commissionDistributed: false,
        skipReason: checkResult.reason,
        recordCount: 0,
        totalAmount: new Decimal(0),
      };
    }

    // 2. 获取用户的三级上级信息
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        inviterId: true,
        level2InviterId: true,
        level3InviterId: true,
      },
    });

    if (!user) {
      return {
        success: false,
        commissionDistributed: false,
        skipReason: '用户不存在',
        recordCount: 0,
        totalAmount: new Decimal(0),
      };
    }

    // 3. 标记用户已完成首次付费产品购买
    // 依据：开发文档.md 第4.5节 - 触发后设置 firstPurchaseDone=true
    await tx.user.update({
      where: { id: userId },
      data: { firstPurchaseDone: true },
    });

    // 4. 获取返佣比例配置
    const rates = await this.getCommissionRates();

    // 5. 定义三级上级配置
    const levels: Array<{
      inviterId: number | null;
      level: CommissionLevel;
      rate: Decimal;
      remarkPrefix: string;
    }> = [
      {
        inviterId: user.inviterId,
        level: 'LEVEL_1',
        rate: rates.level1,
        remarkPrefix: 'Nivel 1',
      },
      {
        inviterId: user.level2InviterId,
        level: 'LEVEL_2',
        rate: rates.level2,
        remarkPrefix: 'Nivel 2',
      },
      {
        inviterId: user.level3InviterId,
        level: 'LEVEL_3',
        rate: rates.level3,
        remarkPrefix: 'Nivel 3',
      },
    ];

    // 6. 逐级发放返佣
    const commissionRecords: CommissionRecordDetail[] = [];
    let totalAmount = new Decimal(0);

    for (const levelConfig of levels) {
      // 跳过没有上级的情况
      if (!levelConfig.inviterId) {
        continue;
      }

      // 检查上级用户状态
      // 依据：开发文档.md 第16.4节 - 返佣跳级规则
      const inviter = await tx.user.findUnique({
        where: { id: levelConfig.inviterId },
        select: { id: true, status: true },
      });

      // 上级不存在或被封禁则跳过
      if (!inviter || inviter.status === 'BANNED') {
        continue;
      }

      // 计算返佣金额（向下取整到分）
      const commissionAmount = this.calculateCommission(
        productPrice,
        levelConfig.rate
      );

      // 金额为0则跳过
      if (commissionAmount.isZero()) {
        continue;
      }

      // 增加上级用户余额
      await tx.user.update({
        where: { id: levelConfig.inviterId },
        data: { availableBalance: { increment: commissionAmount } },
      });

      // 获取更新后的余额（用于记录流水）
      const inviterUpdated = await tx.user.findUnique({
        where: { id: levelConfig.inviterId },
        select: { availableBalance: true },
      });

      // 记录资金流水
      await tx.transaction.create({
        data: {
          userId: levelConfig.inviterId,
          type: 'REFERRAL_COMMISSION',
          amount: commissionAmount,
          balanceAfter: inviterUpdated!.availableBalance,
          relatedOrderNo: orderNo,
          remark: `${levelConfig.remarkPrefix}下线购买${productName}返佣`,
        },
      });

      // 添加到返佣记录列表
      commissionRecords.push({
        receiverId: levelConfig.inviterId,
        sourceUserId: userId,
        positionOrderId,
        level: levelConfig.level,
        rate: levelConfig.rate,
        baseAmount: productPrice,
        amount: commissionAmount,
      });

      totalAmount = totalAmount.add(commissionAmount);
    }

    // 7. 批量创建返佣记录
    if (commissionRecords.length > 0) {
      await tx.commissionRecord.createMany({
        data: commissionRecords,
      });
    }

    // 8. 返回结果（缓存清除移至事务提交后，由调用方负责）
    return {
      success: true,
      commissionDistributed: commissionRecords.length > 0,
      recordCount: commissionRecords.length,
      totalAmount,
      affectedUserIds: commissionRecords.map(r => r.receiverId),
    };
  }

  /**
   * 查询用户收到的返佣记录
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 返佣记录列表和分页信息
   */
  async getReceivedCommissions(userId: number, page: number, pageSize: number) {
    const where = { receiverId: userId };

    const [list, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          sourceUser: {
            select: {
              id: true,
              phone: true,
              nickname: true,
            },
          },
          positionOrder: {
            select: {
              id: true,
              orderNo: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      prisma.commissionRecord.count({ where }),
    ]);

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
   * 查询用户贡献的返佣记录（给上级的返佣）
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @returns 返佣记录列表和分页信息
   */
  async getContributedCommissions(
    userId: number,
    page: number,
    pageSize: number
  ) {
    const where = { sourceUserId: userId };

    const [list, total] = await Promise.all([
      prisma.commissionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          receiver: {
            select: {
              id: true,
              phone: true,
              nickname: true,
            },
          },
          positionOrder: {
            select: {
              id: true,
              orderNo: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      prisma.commissionRecord.count({ where }),
    ]);

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
   * 获取用户返佣统计
   * @param userId 用户ID
   * @returns 返佣统计数据
   */
  async getCommissionStats(userId: number) {
    // 获取收到的返佣统计
    const receivedStats = await prisma.commissionRecord.aggregate({
      where: { receiverId: userId },
      _sum: { amount: true },
      _count: true,
    });

    // 按级别分组统计
    const levelStats = await prisma.commissionRecord.groupBy({
      by: ['level'],
      where: { receiverId: userId },
      _sum: { amount: true },
      _count: true,
    });

    // 构建级别统计 Map
    const levelStatsMap: Record<
      string,
      { amount: Decimal; count: number }
    > = {};
    for (const stat of levelStats) {
      levelStatsMap[stat.level] = {
        amount: stat._sum.amount || new Decimal(0),
        count: stat._count,
      };
    }

    return {
      totalReceived: receivedStats._sum.amount || new Decimal(0),
      totalReceivedCount: receivedStats._count,
      byLevel: {
        LEVEL_1: levelStatsMap['LEVEL_1'] || {
          amount: new Decimal(0),
          count: 0,
        },
        LEVEL_2: levelStatsMap['LEVEL_2'] || {
          amount: new Decimal(0),
          count: 0,
        },
        LEVEL_3: levelStatsMap['LEVEL_3'] || {
          amount: new Decimal(0),
          count: 0,
        },
      },
    };
  }

  /**
   * 查询指定持仓订单的返佣记录
   * @param positionOrderId 持仓订单ID
   * @returns 返佣记录列表
   */
  async getCommissionsByOrderId(positionOrderId: number) {
    return prisma.commissionRecord.findMany({
      where: { positionOrderId },
      orderBy: { level: 'asc' },
      include: {
        receiver: {
          select: {
            id: true,
            phone: true,
            nickname: true,
          },
        },
        sourceUser: {
          select: {
            id: true,
            phone: true,
            nickname: true,
          },
        },
      },
    });
  }
}

// 单例导出
export const commissionService = new CommissionService();
