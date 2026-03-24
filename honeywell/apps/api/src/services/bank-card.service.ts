/**
 * @file 银行卡服务
 * @description 处理银行卡的绑定、查询、删除等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第8节 - 银行卡接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.9节 - BankCard表
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.12节 - Bank表
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第5节 - 数据安全（AES加密）
 * 
 * 核心业务规则：
 * 1. 敏感字段加密存储：accountNo、documentNo 使用 AES-256 加密
 * 2. 脱敏返回：前端显示使用 accountNoMask（****1234）
 * 3. 最大绑卡数：从 GlobalConfig.max_bindcard_count 读取（默认 5）
 * 4. 银行卡号全局唯一：同一银行卡号不可重复绑定（SHA256哈希快速查重）
 * 5. 黑名单检查：添加时检查 Blacklist 表（type=BANK_CARD）
 * 6. 删除前置条件：有 PENDING_REVIEW 状态的 WithdrawOrder 使用此卡时禁止删除
 * 7. 软删除机制：删除时设置 isDeleted=true, deletedAt=当前时间
 * 8. 手机号锁定：银行账户首次绑定后锁定到用户注册手机号，不同手机号用户无法绑定同一账户
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import { aesEncrypt, aesDecrypt, maskAccountNo, sha256Hash } from '@honeywell/utils';
// DocumentType 已不再是必填字段（摩洛哥961通道不需要证件信息）

// ================================
// 类型定义
// ================================

/**
 * 银行卡列表项（返回给前端）
 * @description 依据：02.3-前端API接口清单.md 第7.1节
 */
export interface BankCardListItem {
  /** 银行卡ID */
  id: number;
  /** 银行编码 */
  bankCode: string;
  /** 银行名称 */
  bankName: string;
  /** 银行卡号（脱敏） */
  accountNoMask: string;
  /** 收款人姓名 */
  accountName: string;
  /** 是否可删除 */
  canDelete: boolean;
}

/**
 * 银行卡列表响应
 * @description 依据：02.3-前端API接口清单.md 第7.1节
 */
export interface BankCardListResponse {
  /** 银行卡列表 */
  list: BankCardListItem[];
  /** 最大绑卡数 */
  maxCount: number;
  /** 是否可继续添加 */
  canAdd: boolean;
}

/**
 * 添加银行卡请求参数
 * @description 依据：02.3-前端API接口清单.md 第7.2节
 */
export interface AddBankCardParams {
  /** 银行编码 */
  bankCode: string;
  /** 银行卡号（明文，存储前加密） */
  accountNo: string;
  /** 收款人姓名 */
  accountName: string;
  /** 收款人手机号 */
  phone: string;
}

/**
 * 添加银行卡响应
 * @description 依据：02.3-前端API接口清单.md 第7.2节
 */
export interface AddBankCardResponse {
  /** 银行卡ID */
  id: number;
  /** 银行编码 */
  bankCode: string;
  /** 银行名称 */
  bankName: string;
  /** 银行卡号（脱敏） */
  accountNoMask: string;
  /** 收款人姓名 */
  accountName: string;
}

// ================================
// 银行卡服务类
// ================================

export class BankCardService {
  // ================================
  // 查询方法
  // ================================

  /**
   * 获取用户银行卡列表
   * @description 依据：02.3-前端API接口清单.md 第7.1节
   * - 仅返回未删除的银行卡（isDeleted=false）
   * - 返回脱敏后的银行卡号
   * - 计算每张卡是否可删除
   * @param userId - 用户ID
   * @returns 银行卡列表响应
   */
  async getBankCardList(userId: number): Promise<BankCardListResponse> {
    // 1. 获取最大绑卡数配置
    const maxBindcardCount = await this.getMaxBindcardCount();

    // 2. 查询用户的银行卡列表（未删除的）
    const bankCards = await prisma.bankCard.findMany({
      where: {
        userId,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc', // 按创建时间倒序
      },
    });

    // 3. 查询每张卡是否有进行中的提现订单
    const cardDeleteStatus = await this.checkCardsCanDelete(
      bankCards.map(card => card.id)
    );

    // 4. 构建响应数据
    const list: BankCardListItem[] = bankCards.map(card => ({
      id: card.id,
      bankCode: card.bankCode,
      bankName: card.bankName,
      accountNoMask: card.accountNoMask,
      accountName: card.accountName,
      canDelete: cardDeleteStatus.get(card.id) ?? true,
    }));

    return {
      list,
      maxCount: maxBindcardCount,
      canAdd: list.length < maxBindcardCount,
    };
  }

  /**
   * 根据ID获取用户的银行卡
   * @param userId - 用户ID
   * @param cardId - 银行卡ID
   * @returns 银行卡记录或 null
   */
  async getBankCardById(userId: number, cardId: number) {
    return prisma.bankCard.findFirst({
      where: {
        id: cardId,
        userId,
        isDeleted: false,
      },
    });
  }

  // ================================
  // 添加银行卡
  // ================================

  /**
   * 添加银行卡
   * @description 依据：02.3-前端API接口清单.md 第7.2节
   * 
   * 处理流程：
   * 1. 验证银行是否存在且启用
   * 2. 检查银行卡数量是否超限
   * 3. 检查银行卡号是否已被绑定（SHA256哈希快速查重）
   * 3.5 手机号锁定检查（AccountPhoneBind 表）
   * 4. 检查银行卡号是否在黑名单
   * 5. AES加密敏感字段
   * 6. 创建银行卡记录 + 创建/更新手机号锁定记录
   * 
   * @param userId - 用户ID
   * @param params - 添加银行卡参数
   * @returns 添加成功的银行卡信息
   * @throws BANK_DISABLED - 银行不存在或未启用
   * @throws BANK_CARD_LIMIT_EXCEEDED - 银行卡数量已达上限
   * @throws BLACKLIST_BANK_CARD - 银行卡号已被拉黑
   * @throws VALIDATION_ERROR - 银行卡号已被绑定
   * @throws ACCOUNT_PHONE_LOCKED - 银行账户已被其他手机号锁定
   */
  async addBankCard(
    userId: number,
    params: AddBankCardParams
  ): Promise<AddBankCardResponse> {
    const {
      bankCode,
      accountNo,
      accountName,
      phone,
    } = params;

    // 1. 验证银行是否存在且启用
    const bank = await prisma.bank.findUnique({
      where: { code: bankCode },
    });

    if (!bank || !bank.isActive) {
      throw Errors.bankDisabled();
    }

    // 2. 检查银行卡数量是否超限
    const maxBindcardCount = await this.getMaxBindcardCount();
    const currentCount = await prisma.bankCard.count({
      where: {
        userId,
        isDeleted: false,
      },
    });

    if (currentCount >= maxBindcardCount) {
      throw Errors.bankCardLimitExceeded();
    }

    // 3. 检查银行卡号是否已被绑定（SHA256哈希快速查重）
    const accountNoHash = sha256Hash(accountNo);
    const existingActiveCard = await prisma.bankCard.findFirst({
      where: {
        accountNoMask: maskAccountNo(accountNo),
        isDeleted: false,
      },
    });
    // 若存在未删除的同号卡，需解密确认（accountNoMask 可能碰撞）
    if (existingActiveCard) {
      try {
        const decryptedNo = aesDecrypt(existingActiveCard.accountNo);
        if (decryptedNo === accountNo) {
          throw Errors.validationError('رقم الحساب هذا مرتبط بالفعل');
        }
      } catch (e) {
        if (e instanceof Error && e.message === 'رقم الحساب هذا مرتبط بالفعل') throw e;
        // 解密失败跳过
      }
    }

    // 3.5 手机号锁定检查（AccountPhoneBind 表）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });
    if (!user) {
      throw Errors.userNotFound();
    }
    const userPhone = user.phone;

    const existingBind = await prisma.accountPhoneBind.findUnique({
      where: { accountNoHash },
    });

    if (existingBind) {
      if (existingBind.isLocked && existingBind.phone !== userPhone) {
        // 已被其他手机号锁定 → 拒绝
        throw Errors.accountPhoneLocked();
      }
      // phone 匹配 或 已解锁 → 允许继续
    }

    // 4. 检查银行卡号是否在黑名单
    // 注意：黑名单存储的是明文卡号
    const blacklisted = await prisma.blacklist.findFirst({
      where: {
        type: 'BANK_CARD',
        value: accountNo,
      },
    });

    if (blacklisted) {
      throw Errors.blacklistBankCard();
    }

    // 5. AES加密敏感字段
    const encryptedAccountNo = aesEncrypt(accountNo);
    const accountNoMask = maskAccountNo(accountNo);

    // 6. 创建银行卡记录 + 创建/更新手机号锁定记录（事务保证原子性）
    const bankCard = await prisma.$transaction(async (tx) => {
      // 6.1 创建银行卡
      const card = await tx.bankCard.create({
        data: {
          userId,
          bankCode,
          bankName: bank.name, // 快照银行名称
          accountNo: encryptedAccountNo,
          accountNoMask,
          accountName,
          phone,
        },
      });

      // 6.2 创建或更新手机号锁定记录
      if (existingBind) {
        // 已有记录（解锁状态 或 同手机号）→ 更新并重新锁定
        await tx.accountPhoneBind.update({
          where: { id: existingBind.id },
          data: {
            phone: userPhone,
            userId,
            isLocked: true,
            accountNo: encryptedAccountNo,
            accountNoMask,
            unlockedBy: null,
            unlockedAt: null,
          },
        });
      } else {
        // 新记录
        await tx.accountPhoneBind.create({
          data: {
            accountNoHash,
            accountNo: encryptedAccountNo,
            accountNoMask,
            phone: userPhone,
            userId,
            isLocked: true,
          },
        });
      }

      return card;
    });

    return {
      id: bankCard.id,
      bankCode: bankCard.bankCode,
      bankName: bankCard.bankName,
      accountNoMask: bankCard.accountNoMask,
      accountName: bankCard.accountName,
    };
  }

  // ================================
  // 删除银行卡
  // ================================

  /**
   * 删除银行卡（软删除）
   * @description 依据：02.3-前端API接口清单.md 第7.3节
   * 
   * 业务规则（依据：开发文档.md 第16.7节 + 02.1-数据库设计.md）：
   * 1. 银行卡不存在或已删除 → 返回 BANK_CARD_NOT_FOUND
   * 2. 最后一张银行卡不可删除 → 返回 BANK_CARD_LAST_ONE
   * 3. 有 PENDING_REVIEW 状态的提现订单使用此卡 → 返回 BANK_CARD_IN_USE
   * 4. 软删除：设置 isDeleted=true, deletedAt=当前时间
   * 
   * @param userId - 用户ID
   * @param cardId - 银行卡ID
   * @throws BANK_CARD_NOT_FOUND - 银行卡不存在
   * @throws BANK_CARD_LAST_ONE - 最后一张银行卡不可删除
   * @throws BANK_CARD_IN_USE - 银行卡有进行中的提现
   */
  async deleteBankCard(userId: number, cardId: number): Promise<void> {
    // 1. 查询银行卡是否存在
    const bankCard = await prisma.bankCard.findFirst({
      where: {
        id: cardId,
        userId,
        isDeleted: false,
      },
    });

    if (!bankCard) {
      throw Errors.bankCardNotFound();
    }

    // 2. 检查是否是最后一张银行卡（依据：02.1-数据库设计.md - 最少保留1张）
    const totalCards = await prisma.bankCard.count({
      where: {
        userId,
        isDeleted: false,
      },
    });

    if (totalCards <= 1) {
      throw Errors.bankCardLastOne();
    }

    // 3. 检查是否有进行中的提现订单
    const pendingWithdraw = await prisma.withdrawOrder.findFirst({
      where: {
        bankCardId: cardId,
        status: 'PENDING_REVIEW', // 待审核状态
      },
    });

    if (pendingWithdraw) {
      throw Errors.bankCardInUse();
    }

    // 4. 软删除
    await prisma.bankCard.update({
      where: { id: cardId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  // ================================
  // 辅助方法
  // ================================

  /**
   * 获取最大绑卡数配置
   * @returns 最大绑卡数（默认5）
   */
  private async getMaxBindcardCount(): Promise<number> {
    const config = await prisma.globalConfig.findUnique({
      where: { key: 'max_bindcard_count' },
    });

    return (config?.value as number) ?? 5;
  }


  /**
   * 批量检查银行卡是否可删除
   * @description 依据：02.3-前端API接口清单.md 第7.1节
   * canDelete = false 的条件：
   * 1. 是最后一张银行卡（用户至少保留1张）
   * 2. 有进行中的提现订单使用此卡
   * @param cardIds - 银行卡ID列表
   * @returns Map<cardId, canDelete>
   */
  private async checkCardsCanDelete(
    cardIds: number[]
  ): Promise<Map<number, boolean>> {
    const result = new Map<number, boolean>();

    if (cardIds.length === 0) {
      return result;
    }

    // 条件1：如果只有一张卡，所有卡都不可删除
    const isLastCard = cardIds.length <= 1;

    // 条件2：查询有进行中提现的银行卡
    const cardsWithPendingWithdraw = await prisma.withdrawOrder.groupBy({
      by: ['bankCardId'],
      where: {
        bankCardId: { in: cardIds },
        status: 'PENDING_REVIEW',
      },
    });

    const cardIdsWithPending = new Set(
      cardsWithPendingWithdraw.map(item => item.bankCardId)
    );

    // 设置每张卡的删除状态
    // canDelete = !是最后一张 && !有进行中提现
    for (const cardId of cardIds) {
      const hasPendingWithdraw = cardIdsWithPending.has(cardId);
      result.set(cardId, !isLastCard && !hasPendingWithdraw);
    }

    return result;
  }

  /**
   * 获取银行卡完整信息（用于提现快照）
   * @description 依据：开发文档.md 第16.7节 - 银行卡快照机制
   * @param cardId - 银行卡ID
   * @returns 银行卡完整信息（解密后）
   */
  async getBankCardSnapshot(cardId: number) {
    const card = await prisma.bankCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return null;
    }

    const accountNo = aesDecrypt(card.accountNo);
    const documentNo = card.documentNo ? aesDecrypt(card.documentNo) : null;

    return {
      bankCode: card.bankCode,
      bankName: card.bankName,
      accountNo,
      accountNoMask: card.accountNoMask,
      accountName: card.accountName,
      phone: card.phone,
      documentType: card.documentType ?? null,
      documentNo,
      snapshotAt: new Date().toISOString(),
    };
  }
}

// 单例导出
export const bankCardService = new BankCardService();
