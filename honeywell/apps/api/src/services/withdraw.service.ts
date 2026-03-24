/**
 * @file 提现服务
 * @description 处理提现资格检查、订单创建、回调处理等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第6节 - 提现接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.3节 - WithdrawOrder表
 * @depends 开发文档/附录/lwpay.md - LWPAY 代付接口
 * @depends 开发文档/附录/uzpay.md - UZPAY 代付接口
 *
 * 核心业务规则：
 * 1. 提现门槛：hasRecharged = true 且 hasPurchasedPaid = true（可通过 GlobalConfig 配置）
 * 2. 时间窗口：从 GlobalConfig.withdrawTimeRange 读取（如 "10:00-17:00"）
 * 3. 每日次数：从 GlobalConfig.withdrawDailyLimit 读取
 * 4. 手续费：fee = amount × withdrawFeePercent / 100，向下取整到分
 * 5. 余额冻结：提现金额从 availableBalance 转移到 frozenBalance
 * 6. 银行卡快照：bankCardSnapshot 保存完整银行卡信息
 * 7. 免审核配置：满足条件自动通过并调用代付
 * 8. 订单号格式：WD + 日期8位 + 随机10位 = 20位
 */

import { prisma } from '@/lib/prisma';
import { generateOrderNo, ORDER_TYPE } from '@/lib/order';
import {
  paymentChannelManager,
  TransferParams,
  TransferCallbackData,
  TransferStatus,
} from '@/lib/payment';
import { withLock, CACHE_KEYS, deleteCache, LOCK_TTL } from '@/lib/redis';
import { Errors } from '@/lib/errors';
import { aesDecrypt } from '@honeywell/utils';
import { Decimal } from '@prisma/client/runtime/library';
import { getSystemTimezone, formatNotificationAmount } from '@/lib/config';
import { Prisma, WithdrawStatus } from '@honeywell/database';

// ================================
// Prisma 类型定义
// ================================

/**
 * Prisma 事务客户端类型
 * @description 用于事务回调中的类型安全
 */
type TransactionClient = Prisma.TransactionClient;

// ================================
// 类型定义
// ================================

/**
 * 提现资格检查结果
 */
export interface WithdrawCheckResult {
  canWithdraw: boolean;
  reason: string | null; // THRESHOLD_NOT_MET | NO_BANK_CARD | TIME_INVALID | LIMIT_EXCEEDED
  availableBalance: string;
  feePercent: number;
  minAmount: string;
  maxAmount: string;
  timeRange: string;
  inTimeRange: boolean;
  todayCount: number;
  dailyLimit: number;
  quickAmounts: number[];
  tips: string;
}

/**
 * 创建提现订单的请求参数
 */
export interface CreateWithdrawOrderParams {
  userId: number;
  amount: number;
  bankCardId: number;
  createIp?: string;
}

/**
 * 创建提现订单的返回结果
 */
export interface CreateWithdrawOrderResult {
  orderId: number;
  orderNo: string;
  amount: string;
  fee: string;
  actualAmount: string;
}

/**
 * 银行卡快照数据结构
 */
interface BankCardSnapshot {
  bankCode: string;
  bankName: string;
  accountNo: string;
  accountNoMask: string;
  accountName: string;
  phone: string;
  documentType: string;
  documentNo: string;
  snapshotAt: string;
}

// ================================
// 提现服务类
// ================================

export class WithdrawService {
  /**
   * 检查提现资格
   * @depends 02.3-前端API接口清单.md 6.1 检查提现条件
   * @param userId 用户ID
   * @returns 提现资格检查结果
   */
  async checkWithdrawEligibility(userId: number): Promise<WithdrawCheckResult> {
    // 1. 获取全局配置
    const config = await this.getWithdrawConfig();

    // 2. 获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        availableBalance: true,
        hasPurchasedPaid: true,
        hasRecharged: true,
        _count: {
          select: {
            bankCards: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    // 3. 检查提现门槛（从 GlobalConfig 读取是否需要充值和购买）
    const requireRecharge = config.withdrawRequireRecharge;
    const requirePurchase = config.withdrawRequirePurchase;
    const thresholdMet = (!requireRecharge || user.hasRecharged === true)
      && (!requirePurchase || user.hasPurchasedPaid === true);

    // 4. 检查是否绑定银行卡
    const hasBankCard = user._count.bankCards > 0;

    // 5. 检查时间窗口（使用系统配置时区）
    const inTimeRange = await this.isInWithdrawTimeRange(config.withdrawTimeRange);

    // 6. 检查今日提现次数
    const todayCount = await this.getTodayWithdrawCount(userId);
    const limitExceeded = todayCount >= config.withdrawDailyLimit;

    // 7. 综合判断是否可提现
    let canWithdraw = true;
    let reason: string | null = null;

    if (!thresholdMet) {
      canWithdraw = false;
      reason = 'THRESHOLD_NOT_MET';
    } else if (!hasBankCard) {
      canWithdraw = false;
      reason = 'NO_BANK_CARD';
    } else if (!inTimeRange) {
      canWithdraw = false;
      reason = 'TIME_INVALID';
    } else if (limitExceeded) {
      canWithdraw = false;
      reason = 'LIMIT_EXCEEDED';
    }

    return {
      canWithdraw,
      reason,
      availableBalance: user.availableBalance.toFixed(2),
      feePercent: config.withdrawFeePercent,
      minAmount: config.withdrawMinAmount.toFixed(2),
      maxAmount: config.withdrawMaxAmount.toFixed(2),
      timeRange: config.withdrawTimeRange,
      inTimeRange,
      todayCount,
      dailyLimit: config.withdrawDailyLimit,
      quickAmounts: config.withdrawQuickAmounts,
      tips: config.withdrawPageTips,
    };
  }

  /**
   * 创建提现订单
   * @depends 02.3-前端API接口清单.md 6.2 创建提现申请
   * @param params 提现参数
   * @returns 创建结果
   */
  async createOrder(
    params: CreateWithdrawOrderParams
  ): Promise<CreateWithdrawOrderResult> {
    const { userId, amount, bankCardId, createIp } = params;

    // 使用分布式锁防止并发提现
    const lockKey = CACHE_KEYS.LOCK.WITHDRAW(userId);

    return await withLock(lockKey, LOCK_TTL.WITHDRAW, async () => {
      // 1. 获取全局配置
      const config = await this.getWithdrawConfig();

      // 2. 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          availableBalance: true,
          hasPurchasedPaid: true,
          hasRecharged: true,
        },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      // 3. 检查提现门槛（与 checkWithdrawEligibility 使用相同的配置化逻辑）
      const requireRecharge = config.withdrawRequireRecharge;
      const requirePurchase = config.withdrawRequirePurchase;
      if ((requireRecharge && user.hasRecharged !== true) || (requirePurchase && user.hasPurchasedPaid !== true)) {
        throw Errors.withdrawThresholdNotMet();
      }

      // 4. 检查时间窗口（使用系统配置时区）
      if (!(await this.isInWithdrawTimeRange(config.withdrawTimeRange))) {
        throw Errors.withdrawTimeInvalid();
      }

      // 5. 检查今日提现次数
      const todayCount = await this.getTodayWithdrawCount(userId);
      if (todayCount >= config.withdrawDailyLimit) {
        throw Errors.withdrawLimitExceeded();
      }

      // 6. 检查金额范围
      if (amount < config.withdrawMinAmount || amount > config.withdrawMaxAmount) {
        throw Errors.withdrawAmountInvalid();
      }

      // 7. 检查余额是否足够
      if (user.availableBalance.toNumber() < amount) {
        throw Errors.insufficientBalance();
      }

      // 8. 获取银行卡信息并验证
      const bankCard = await prisma.bankCard.findFirst({
        where: {
          id: bankCardId,
          userId,
          isDeleted: false,
        },
        include: {
          bank: true,
        },
      });

      if (!bankCard) {
        throw Errors.bankCardNotFound();
      }

      // 9. 检查银行是否启用（依据：开发文档.md 16.10节）
      if (bankCard.bank && !bankCard.bank.isActive) {
        throw Errors.bankDisabled();
      }

      // 10. 计算手续费（向下取整到分）
      // 依据：开发文档.md 16.5节 - 金额计算精度规则
      const feeRate = config.withdrawFeePercent / 100;
      const feeRaw = amount * feeRate;
      const fee = Math.floor(feeRaw * 100) / 100; // 向下取整到分
      const actualAmount = amount - fee;

      // 11. 生成订单号
      const orderNo = generateOrderNo(ORDER_TYPE.WITHDRAW);

      // 12. 创建银行卡快照
      // 重要：accountNo、documentNo 在数据库中是 AES 加密存储的
      // 快照中必须存储解密后的明文，因为 submitTransfer 直接读取快照传给代付通道
      const bankCardSnapshot: BankCardSnapshot = {
        bankCode: bankCard.bankCode,
        bankName: bankCard.bankName,
        accountNo: bankCard.accountNo ? aesDecrypt(bankCard.accountNo) : '',
        accountNoMask: bankCard.accountNoMask,
        accountName: bankCard.accountName,
        phone: bankCard.phone,
        documentType: bankCard.documentType || '',
        documentNo: bankCard.documentNo ? aesDecrypt(bankCard.documentNo) : '',
        snapshotAt: new Date().toISOString(),
      };

      // 13. 检查是否满足免审核条件
      const autoApproveResult = await this.checkAutoApprove(userId, amount, config);

      // 14. 使用事务：创建订单 + 冻结余额
      const order = await prisma.$transaction(async (tx: TransactionClient) => {
        // 14.1 原子更新余额（扣减可用余额，增加冻结余额）
        // 使用 WHERE 条件确保余额足够，防止超卖
        const updateResult = await tx.user.updateMany({
          where: {
            id: userId,
            availableBalance: { gte: new Decimal(amount) },
          },
          data: {
            availableBalance: { decrement: new Decimal(amount) },
            frozenBalance: { increment: new Decimal(amount) },
          },
        });

        if (updateResult.count === 0) {
          throw Errors.insufficientBalance();
        }

        // 14.2 创建提现订单
        const newOrder = await tx.withdrawOrder.create({
          data: {
            orderNo,
            userId,
            bankCardId,
            amount: new Decimal(amount),
            fee: new Decimal(fee),
            actualAmount: new Decimal(actualAmount),
            status: autoApproveResult.approved ? 'APPROVED' : 'PENDING_REVIEW',
            isAutoApproved: autoApproveResult.approved,
            autoApproveReason: autoApproveResult.reason,
            bankCardSnapshot: bankCardSnapshot as object,
            createIp: createIp || null,
          },
        });

        // 14.3 记录资金流水（提现冻结）
        await tx.transaction.create({
          data: {
            userId,
            type: 'WITHDRAW_FREEZE',
            amount: new Decimal(-amount),
            balanceAfter: user.availableBalance.minus(new Decimal(amount)),
            relatedOrderNo: orderNo,
            remark: 'تجميد السحب',
          },
        });

        return newOrder;
      });

      // 15. 如果免审核通过，异步调用代付
      if (autoApproveResult.approved) {
        // 异步调用，不阻塞返回
        this.submitTransfer(order.id).catch((err) => {
          console.error(`[WithdrawService] 自动代付失败: ${err.message}`);
        });
      }

      // 16. 清除用户缓存
      await deleteCache(CACHE_KEYS.USER.INFO(userId));

      console.log(
        `[WithdrawService] 提现订单创建成功: ${orderNo}, 金额: ${amount}, 手续费: ${fee}, 实际到账: ${actualAmount}, 自动审核: ${autoApproveResult.approved}`
      );

      return {
        orderId: order.id,
        orderNo: order.orderNo,
        amount: amount.toFixed(2),
        fee: fee.toFixed(2),
        actualAmount: actualAmount.toFixed(2),
      };
    });
  }

  /**
   * 获取用户提现订单列表
   * @depends 02.3-前端API接口清单.md 6.3 提现订单列表
   * @param userId 用户ID
   * @param page 页码
   * @param pageSize 每页数量
   * @param status 订单状态过滤
   */
  async getOrders(
    userId: number,
    page: number,
    pageSize: number,
    status?: string
  ) {
    const where: Prisma.WithdrawOrderWhereInput = { userId };
    if (status) {
      // 支持逗号分隔的多状态查询（如 "APPROVED,PAYOUT_FAILED"）
      if (status.includes(',')) {
        where.status = { in: status.split(',') as WithdrawStatus[] };
      } else {
        where.status = status as WithdrawStatus;
      }
    }

    const [list, total] = await Promise.all([
      prisma.withdrawOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          orderNo: true,
          amount: true,
          fee: true,
          actualAmount: true,
          status: true,
          rejectReason: true,
          bankCardSnapshot: true,
          createdAt: true,
        },
      }),
      prisma.withdrawOrder.count({ where }),
    ]);

    // 格式化列表数据
    // 用户端不暴露 PAYOUT_FAILED 状态，统一显示为 APPROVED（处理中）
    const formattedList = list.map((order) => {
      const snapshot = order.bankCardSnapshot as BankCardSnapshot | null;
      return {
        id: order.id,
        orderNo: order.orderNo,
        amount: order.amount.toFixed(2),
        fee: order.fee.toFixed(2),
        actualAmount: order.actualAmount.toFixed(2),
        bankName: snapshot?.bankName || '',
        accountNoMask: snapshot?.accountNoMask || '',
        status: order.status === 'PAYOUT_FAILED' ? 'APPROVED' : order.status,
        rejectReason: order.rejectReason,
        createdAt: order.createdAt.toISOString(),
      };
    });

    return {
      list: formattedList,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取订单详情
   * @depends 02.3-前端API接口清单.md 6.4 提现订单详情
   * @param userId 用户ID
   * @param orderId 订单ID
   */
  async getOrderDetail(userId: number, orderId: number) {
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Errors.orderNotFound();
    }

    // 只能查看自己的订单
    if (order.userId !== userId) {
      throw Errors.orderNotFound();
    }

    const snapshot = order.bankCardSnapshot as BankCardSnapshot | null;

    return {
      id: order.id,
      orderNo: order.orderNo,
      amount: order.amount.toFixed(2),
      fee: order.fee.toFixed(2),
      actualAmount: order.actualAmount.toFixed(2),
      bankName: snapshot?.bankName || '',
      accountNoMask: snapshot?.accountNoMask || '',
      accountName: snapshot?.accountName || '',
      // 用户端不暴露 PAYOUT_FAILED 状态，统一显示为 APPROVED（处理中）
      status: order.status === 'PAYOUT_FAILED' ? 'APPROVED' : order.status,
      rejectReason: order.rejectReason,
      createdAt: order.createdAt.toISOString(),
      reviewedAt: order.reviewedAt?.toISOString() || null,
      // 完成时间使用 callbackAt
      completedAt: order.callbackAt?.toISOString() || null,
    };
  }

  /**
   * 处理代付回调
   * @param channelCode 通道代码
   * @param payload 回调原始数据
   * @returns 处理结果和响应
   */
  async handleTransferCallback(
    channelCode: string,
    payload: unknown
  ): Promise<{ success: boolean; response: { contentType: string; body: string } }> {
    // 1. 获取支付通道
    const channel = await paymentChannelManager.getChannel(channelCode);
    if (!channel) {
      console.error(`[WithdrawService] 未知支付通道: ${channelCode}`);
      // UZPAY 返回小写 fail，其他通道（LWPAY/JYPAY）返回大写 FAIL
      const failBody = channelCode === 'UZPAY' ? 'fail' : 'FAIL';
      return {
        success: false,
        response: { contentType: 'text/plain', body: failBody },
      };
    }

    // 2. 验证回调数据（try-catch 防御回调数据畸形导致解析崩溃）
    let callbackData: TransferCallbackData;
    try {
      callbackData = channel.verifyTransferCallback(payload);
    } catch (verifyError) {
      console.error('[WithdrawService] 回调数据解析异常:', verifyError);
      return {
        success: false,
        response: channel.getTransferCallbackFailResponse(),
      };
    }

    if (!callbackData.valid) {
      console.error('[WithdrawService] 回调签名验证失败:', callbackData);
      return {
        success: false,
        response: channel.getTransferCallbackFailResponse(),
      };
    }

    // 3. 使用分布式锁处理，防止并发重复处理
    const lockKey = `lock:withdraw:callback:${callbackData.orderNo}`;

    try {
      await withLock(lockKey, 10, async () => {
        await this.processTransferCallback(callbackData, channelCode);
      });

      return {
        success: true,
        response: channel.getTransferCallbackSuccessResponse(),
      };
    } catch (error) {
      console.error('[WithdrawService] 处理回调异常:', error);
      return {
        success: false,
        response: channel.getTransferCallbackFailResponse(),
      };
    }
  }

  /**
   * 提交代付请求（内部方法，审核通过后调用）
   * @param orderId 订单ID
   * @param specifiedChannelCode 指定通道代码（重试时由管理员指定，首次提交为空自动选择）
   */
  async submitTransfer(orderId: number, specifiedChannelCode?: string): Promise<void> {
    // 1. 获取订单信息
    const order = await prisma.withdrawOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw Errors.orderNotFound();
    }

    // 只处理已审核状态的订单
    if (order.status !== 'APPROVED') {
      console.log(`[WithdrawService] 订单状态不允许代付: ${order.orderNo}, 状态: ${order.status}`);
      return;
    }

    // 2. 获取代付通道（指定或自动选择）
    let channel;
    if (specifiedChannelCode) {
      channel = await paymentChannelManager.getChannel(specifiedChannelCode);
    } else {
      channel = await this.getTransferChannel();
    }
    if (!channel) {
      console.error(`[WithdrawService] 无可用代付通道`);
      throw Errors.noAvailableChannel();
    }

    // 3. 获取银行卡快照信息
    const snapshot = order.bankCardSnapshot as BankCardSnapshot | null;
    if (!snapshot) {
      console.error(`[WithdrawService] 银行卡快照不存在: ${order.orderNo}`);
      throw Errors.validationError('معلومات البطاقة غير موجودة');
    }

    // 4. 确定发给通道的订单号（channelOrderNo）
    // 首次提交使用 orderNo，重试时重新生成以避免通道重复订单号问题
    let channelOrderNo = order.orderNo;
    if (order.retryCount > 0 || specifiedChannelCode) {
      // 重试场景：生成新的通道订单号
      channelOrderNo = generateOrderNo(ORDER_TYPE.WITHDRAW);
    }

    // 5. 构建代付请求参数
    const transferParams: TransferParams = {
      orderNo: channelOrderNo,
      amount: order.actualAmount.toFixed(2),
      bankCode: snapshot.bankCode,
      bankName: snapshot.bankName,
      accountNo: snapshot.accountNo,
      accountName: snapshot.accountName,
      phone: snapshot.phone,
      documentType: snapshot.documentType,
      documentNo: snapshot.documentNo,
      notifyUrl: this.getTransferNotifyUrl(channel.code),
    };

    // 6. 记录代付尝试（PENDING 状态）
    const existingAttempts = (order as { payoutAttempts?: unknown[] }).payoutAttempts || [];
    const newAttempt = {
      attemptNo: (existingAttempts as unknown[]).length + 1,
      channelCode: channel.code,
      channelName: channel.name,
      channelOrderNo,
      thirdOrderNo: null as string | null,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    };
    const updatedAttempts = [...(existingAttempts as unknown[]), newAttempt];

    // 7. 更新订单的 channelOrderNo 和 payoutAttempts（先更新，再调用通道）
    const channelId = await this.getChannelId(channel.code);
    await prisma.withdrawOrder.update({
      where: { id: orderId },
      data: {
        channelOrderNo,
        channelId,
        payoutAttempts: updatedAttempts as object,
      },
    });

    // 8. 调用代付接口
    let result: { success: boolean; thirdOrderNo?: string; errorMessage?: string };
    try {
      result = await channel.createTransferOrder(transferParams);
    } catch (apiError) {
      // 网络异常等：标记本次尝试失败，更新订单为 PAYOUT_FAILED
      const errorMsg = apiError instanceof Error ? apiError.message : '代付接口异常';
      console.error(`[WithdrawService] 代付接口异常: ${order.orderNo}, 错误: ${errorMsg}`);

      const failedAttempts = [...updatedAttempts];
      if (failedAttempts.length > 0) {
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).status = 'FAILED';
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).failReason = errorMsg;
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).callbackAt = new Date().toISOString();
      }
      await prisma.withdrawOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAYOUT_FAILED',
          payoutFailReason: errorMsg,
          payoutAttempts: failedAttempts as object,
        },
      });
      throw apiError;
    }

    // 9. 更新订单信息
    if (result.success) {
      // 更新第三方订单号和最新尝试记录状态
      const finalAttempts = [...updatedAttempts];
      if (finalAttempts.length > 0) {
        (finalAttempts[finalAttempts.length - 1] as Record<string, unknown>).thirdOrderNo = result.thirdOrderNo;
        (finalAttempts[finalAttempts.length - 1] as Record<string, unknown>).status = 'SUBMITTED';
      }
      await prisma.withdrawOrder.update({
        where: { id: orderId },
        data: {
          thirdOrderNo: result.thirdOrderNo,
          payoutAttempts: finalAttempts as object,
        },
      });
      console.log(`[WithdrawService] 代付请求成功: ${order.orderNo}, channelOrderNo: ${channelOrderNo}, 第三方订单号: ${result.thirdOrderNo}`);
    } else {
      // 代付申请返回失败：标记本次尝试失败，更新订单为 PAYOUT_FAILED
      const errorMsg = result.errorMessage || '代付请求被通道拒绝';
      console.error(`[WithdrawService] 代付请求失败: ${order.orderNo}, 错误: ${errorMsg}`);

      const failedAttempts = [...updatedAttempts];
      if (failedAttempts.length > 0) {
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).status = 'FAILED';
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).failReason = errorMsg;
        (failedAttempts[failedAttempts.length - 1] as Record<string, unknown>).callbackAt = new Date().toISOString();
      }
      await prisma.withdrawOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAYOUT_FAILED',
          payoutFailReason: errorMsg,
          payoutAttempts: failedAttempts as object,
        },
      });
    }
  }

  // ================================
  // 私有方法
  // ================================

  /**
   * 处理代付回调核心逻辑
   * @description 依据：开发文档.md 第7节 - 提现系统
   * 
   * 处理流程：
   * 1. 查询订单（不存在返回错误）
   * 2. 幂等检查：订单状态已 COMPLETED/FAILED/REJECTED 直接返回成功
   * 3. 成功状态：status = COMPLETED, 扣减 frozenBalance
   * 4. 失败状态：status = FAILED, 退回 availableBalance（从 frozenBalance 转入）
   * 5. 创建资金流水
   * 6. 发送站内通知
   */
  private async processTransferCallback(
    callbackData: TransferCallbackData,
    channelCode: string
  ): Promise<void> {
    const { orderNo: callbackOrderNo, thirdOrderNo, status, failReason, rawData } = callbackData;

    // 1. 查询订单：优先通过 channelOrderNo 查找（重试场景），回退到 orderNo（兼容旧数据）
    let order = await prisma.withdrawOrder.findFirst({
      where: { channelOrderNo: callbackOrderNo },
    });
    if (!order) {
      // 兼容旧数据：channelOrderNo 为空的历史订单，通过 orderNo 查找
      order = await prisma.withdrawOrder.findUnique({
        where: { orderNo: callbackOrderNo },
      });
    }

    if (!order) {
      console.error(`[WithdrawService] 订单不存在: ${callbackOrderNo}`);
      throw new Error('الطلب غير موجود');
    }

    // 使用订单自身的 orderNo（而非回调中的 channelOrderNo）用于后续操作
    const orderNo = order.orderNo;

    // 2. 幂等性检查：已完成/已失败/已拒绝的订单不再处理
    if (['COMPLETED', 'FAILED', 'REJECTED'].includes(order.status)) {
      console.log(`[WithdrawService] 订单已处理: ${orderNo}, 状态: ${order.status}`);
      return;
    }

    // 允许 APPROVED 和 PAYOUT_FAILED 状态接收回调（代付重试后可能收到成功回调）
    if (order.status !== 'APPROVED' && order.status !== 'PAYOUT_FAILED') {
      console.log(`[WithdrawService] 订单状态不正确: ${orderNo}, 状态: ${order.status}`);
      return;
    }

    // 2.5 回调通道校验：防止旧通道延迟回调干扰重试后的订单
    // 当订单已重试到新通道时，旧通道的延迟回调应该被忽略
    if (order.channelId) {
      const orderChannel = await prisma.paymentChannel.findUnique({
        where: { id: order.channelId },
        select: { code: true },
      });
      if (orderChannel && orderChannel.code !== channelCode) {
        console.log(
          `[WithdrawService] 回调通道(${channelCode})与订单当前通道(${orderChannel.code})不一致，忽略此回调: ${orderNo}`
        );
        return;
      }
    }

    // 3. 根据代付结果处理
    if (status === TransferStatus.SUCCESS) {
      // 代付成功
      await prisma.$transaction(async (tx: TransactionClient) => {
        // 3.1 更新订单状态为已完成
        await tx.withdrawOrder.update({
          where: { id: order.id },
          data: {
            status: 'COMPLETED',
            thirdOrderNo,
            callbackData: rawData as object,
            callbackAt: new Date(),
            paidAt: new Date(),
          },
        });

        // 3.2 扣减冻结余额（资金已经打出）
        await tx.user.update({
          where: { id: order.userId },
          data: {
            frozenBalance: { decrement: order.amount },
          },
        });

        // 3.3 记录资金流水（提现成功）
        const user = await tx.user.findUnique({
          where: { id: order.userId },
          select: { availableBalance: true },
        });

        // 用户必须存在（已在前面验证过订单所属用户）
        if (!user) {
          throw new Error(`用户不存在: ${order.userId}`);
        }

        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'WITHDRAW_SUCCESS',
            amount: new Decimal(-order.actualAmount.toNumber()),
            balanceAfter: user.availableBalance,
            relatedOrderNo: orderNo,
            remark: `提现成功，手续费 ${await formatNotificationAmount(order.fee)}`,
          },
        });

        // 3.4 发送站内通知（提现完成）
        await tx.notification.create({
          data: {
            userId: order.userId,
            title: 'تم السحب بنجاح',
            content: `تمت معالجة سحبك بقيمة ${await formatNotificationAmount(order.actualAmount)} بنجاح.`,
            type: 'WITHDRAW_COMPLETED',
          },
        });
      });

      // 3.5 更新通道统计：todayWithdraw 和 totalWithdraw
      if (order.channelId) {
        await prisma.paymentChannel.update({
          where: { id: order.channelId },
          data: {
            todayWithdraw: { increment: order.actualAmount },
            totalWithdraw: { increment: order.actualAmount },
          },
        });
      }

      console.log(`[WithdrawService] 代付成功: ${orderNo}, 通道: ${channelCode}`);
    } else {
      // 代付失败或冲正 → 标记为 PAYOUT_FAILED，余额保持冻结，等待管理员决策
      const statusMsg = status === TransferStatus.REVERSED ? 'تم عكس الدفع' : 'فشل الدفع';
      const reason = failReason || statusMsg;

      // 构建本次代付尝试记录
      const existingAttempts = (order as { payoutAttempts?: unknown[] }).payoutAttempts || [];
      const currentAttempt = {
        attemptNo: (existingAttempts as unknown[]).length,
        channelCode,
        thirdOrderNo,
        status: 'FAILED',
        failReason: reason,
        callbackAt: new Date().toISOString(),
        callbackData: rawData,
      };
      const updatedAttempts = [...(existingAttempts as unknown[])];
      // 更新最后一条记录（submitTransfer 时已添加 PENDING 记录）
      if (updatedAttempts.length > 0) {
        updatedAttempts[updatedAttempts.length - 1] = {
          ...(updatedAttempts[updatedAttempts.length - 1] as object),
          ...currentAttempt,
        };
      } else {
        updatedAttempts.push(currentAttempt);
      }

      await prisma.withdrawOrder.update({
        where: { id: order.id },
        data: {
          status: 'PAYOUT_FAILED',
          payoutFailReason: reason,
          thirdOrderNo,
          callbackData: rawData as object,
          callbackAt: new Date(),
          payoutAttempts: updatedAttempts as object,
        },
      });

      // 不退回余额，不通知用户退款，只记录日志
      // 用户端看到的状态仍然是"处理中"
      console.log(`[WithdrawService] 代付失败(PAYOUT_FAILED): ${orderNo}, 通道: ${channelCode}, 原因: ${reason}, 余额保持冻结等待管理员处理`);
    }

    // 4. 清除用户缓存
    await deleteCache(CACHE_KEYS.USER.INFO(order.userId));
  }

  /**
   * 获取提现相关配置
   * @description 配置键名使用下划线命名，与数据库 GlobalConfig 表保持一致
   */
  private async getWithdrawConfig() {
    const configs = await prisma.globalConfig.findMany({
      where: {
        key: {
          in: [
            // 提现配置（下划线命名，与 seed.ts 保持一致）
            'withdraw_fee_percent',
            'withdraw_limit_daily',
            'withdraw_time_range',
            'withdraw_min_amount',
            'withdraw_max_amount',
            'withdraw_quick_amounts',
            'withdraw_page_tips',
            'withdraw_require_recharge',
            'withdraw_require_purchase',
            // 免审核配置
            'auto_approve_enabled',
            'auto_approve_threshold',
            'auto_approve_daily_limit',
            'auto_approve_time_range',
            'auto_approve_new_user_days',
          ],
        },
      },
    });

    // 定义配置项类型
    type ConfigItem = { key: string; value: unknown };
    const configMap = new Map<string, unknown>(
      configs.map((c: ConfigItem) => [c.key, c.value])
    );

    // 解析快捷金额配置（默认值适用于 MAD 摩洛哥迪拉姆）
    let quickAmounts: number[] = [50, 100, 300, 500];
    const quickAmountsValue = configMap.get('withdraw_quick_amounts');
    if (quickAmountsValue) {
      try {
        if (typeof quickAmountsValue === 'string') {
          quickAmounts = JSON.parse(quickAmountsValue);
        } else if (Array.isArray(quickAmountsValue)) {
          quickAmounts = quickAmountsValue as number[];
        }
      } catch {
        // 使用默认值
      }
    }

    return {
      withdrawFeePercent: parseFloat(String(configMap.get('withdraw_fee_percent') ?? '5')),
      withdrawDailyLimit: parseInt(String(configMap.get('withdraw_limit_daily') ?? '1')),
      withdrawTimeRange: String(configMap.get('withdraw_time_range') ?? '10:00-17:00'),
      withdrawMinAmount: parseFloat(String(configMap.get('withdraw_min_amount') ?? '12000')),
      withdrawMaxAmount: parseFloat(String(configMap.get('withdraw_max_amount') ?? '50000000')),
      withdrawQuickAmounts: quickAmounts,
      withdrawPageTips: String(configMap.get('withdraw_page_tips') ?? ''),
      // 提现门槛配置（默认需要充值和购买）
      withdrawRequireRecharge: configMap.get('withdraw_require_recharge') !== false,
      withdrawRequirePurchase: configMap.get('withdraw_require_purchase') !== false,
      // 免审核配置
      autoApproveEnabled: configMap.get('auto_approve_enabled') === true,
      autoApproveThreshold: parseFloat(String(configMap.get('auto_approve_threshold') ?? '100')),
      autoApproveDailyLimit: parseInt(String(configMap.get('auto_approve_daily_limit') ?? '1')),
      autoApproveTimeRange: String(configMap.get('auto_approve_time_range') ?? '00:00-23:59'),
      autoApproveNewUserDays: parseInt(String(configMap.get('auto_approve_new_user_days') ?? '0')),
    };
  }

  /**
   * 检查是否在提现时间窗口内
   * @param timeRange 时间范围字符串，格式：HH:mm-HH:mm
   * @description 使用系统配置时区（从数据库 GlobalConfig 获取），禁止使用服务器本地时间
   */
  private async isInWithdrawTimeRange(timeRange: string): Promise<boolean> {
    try {
      const [startStr, endStr] = timeRange.split('-');
      const [startHour, startMin] = startStr.split(':').map(Number);
      const [endHour, endMin] = endStr.split(':').map(Number);

      // 从数据库配置获取系统时区，禁止硬编码
      const systemTimezone = await getSystemTimezone();
      const now = new Date();
      
      // 使用 Intl.DateTimeFormat 获取系统时区的当前小时和分钟
      const hourFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: systemTimezone,
        hour: 'numeric',
        hour12: false,
      });
      const minuteFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: systemTimezone,
        minute: 'numeric',
      });
      
      const currentHour = parseInt(hourFormatter.format(now), 10);
      const currentMin = parseInt(minuteFormatter.format(now), 10);
      const currentMinutes = currentHour * 60 + currentMin;
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      console.log(
        `[WithdrawService] 时间窗口检查: 系统时区=${systemTimezone}, 当前时间=${currentHour}:${String(currentMin).padStart(2, '0')}, 窗口=${timeRange}, 结果=${currentMinutes >= startMinutes && currentMinutes <= endMinutes}`
      );

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } catch (err) {
      // 配置格式错误，默认允许提现
      console.error(`[WithdrawService] 时间窗口配置格式错误: ${timeRange}`, err);
      return true;
    }
  }

  /**
   * 获取今日提现次数
   * @param userId 用户ID
   * @description 使用系统配置时区计算今日范围
   */
  private async getTodayWithdrawCount(userId: number): Promise<number> {
    // 从数据库配置获取系统时区，计算今日范围
    const systemTimezone = await getSystemTimezone();
    const now = new Date();
    
    // 使用 Intl.DateTimeFormat 获取系统时区的今日日期
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: systemTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now);
    const [year, month, day] = dateStr.split('-').map(Number);
    
    const today = new Date(year, month - 1, day);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await prisma.withdrawOrder.count({
      where: {
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: ['REJECTED', 'FAILED'] as WithdrawStatus[], // 被拒绝和已退款的不计入次数
        },
      },
    });
  }

  /**
   * 检查是否满足免审核条件
   * @depends 开发文档.md 13.9.4节 - 免审核提现配置
   */
  private async checkAutoApprove(
    userId: number,
    amount: number,
    config: Awaited<ReturnType<typeof this.getWithdrawConfig>>
  ): Promise<{ approved: boolean; reason: string | null }> {
    // 1. 检查总开关
    if (!config.autoApproveEnabled) {
      return { approved: false, reason: null };
    }

    // 2. 检查金额阈值
    if (amount > config.autoApproveThreshold) {
      return { approved: false, reason: null };
    }

    // 3. 检查免审核时间窗口（使用系统配置时区）
    if (!(await this.isInWithdrawTimeRange(config.autoApproveTimeRange))) {
      return { approved: false, reason: null };
    }

    // 4. 检查今日免审核次数（使用系统配置时区）
    const systemTimezone = await getSystemTimezone();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: systemTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(now);
    const [year, month, day] = dateStr.split('-').map(Number);
    
    const todayForAutoApprove = new Date(year, month - 1, day);
    const tomorrowForAutoApprove = new Date(todayForAutoApprove);
    tomorrowForAutoApprove.setDate(tomorrowForAutoApprove.getDate() + 1);

    const todayAutoApproveCount = await prisma.withdrawOrder.count({
      where: {
        userId,
        isAutoApproved: true,
        createdAt: {
          gte: todayForAutoApprove,
          lt: tomorrowForAutoApprove,
        },
      },
    });

    if (todayAutoApproveCount >= config.autoApproveDailyLimit) {
      return { approved: false, reason: null };
    }

    // 5. 检查新用户冷却期
    if (config.autoApproveNewUserDays > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      });

      if (user) {
        const daysSinceRegister = Math.floor(
          (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceRegister < config.autoApproveNewUserDays) {
          return { approved: false, reason: null };
        }
      }
    }

    // 满足所有条件，自动审核通过
    return {
      approved: true,
      reason: `金额 ${amount} 小于阈值 ${config.autoApproveThreshold}，自动审核通过`,
    };
  }

  /**
   * 获取可用的代付通道
   * @description 查询启用代付的通道，允许 NORMAL 和 WARNING 状态
   * WARNING 状态表示成功率略低但仍可用，不应阻止代付
   */
  private async getTransferChannel() {
    // 查询启用代付的通道（NORMAL 和 WARNING 状态均可用于代付）
    const channelConfig = await prisma.paymentChannel.findFirst({
      where: {
        transferEnabled: true,
        channelStatus: { in: ['NORMAL', 'WARNING'] },
      },
    });

    if (!channelConfig) {
      return null;
    }

    return await paymentChannelManager.getChannel(channelConfig.code);
  }

  /**
   * 获取通道ID
   */
  private async getChannelId(code: string): Promise<number | null> {
    const channel = await prisma.paymentChannel.findFirst({
      where: { code },
      select: { id: true },
    });
    return channel?.id || null;
  }

  /**
   * 获取代付回调URL
   */
  /**
   * 获取代付回调URL
   * @description 依据统一回调路由格式：/api/callback/[channel]/[type]
   */
  private getTransferNotifyUrl(channelCode: string): string {
    // 从环境变量获取基础URL
    const baseUrl = process.env.CALLBACK_DOMAIN || process.env.API_BASE_URL || 'http://localhost:3000';
    // 统一回调路由格式：/api/callback/{channel}/withdraw
    return `${baseUrl}/api/callback/${channelCode.toLowerCase()}/withdraw`;
  }
}

// 单例导出
export const withdrawService = new WithdrawService();
