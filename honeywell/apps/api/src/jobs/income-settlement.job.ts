/**
 * @file 收益发放定时任务
 * @description 扫描到期收益记录，按购买时间+24小时准时发放到用户余额
 * @depends 开发文档/05-后端服务/05.3-定时任务.md 第2.1节 - 收益发放任务
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.3节 - IncomeRecord表
 * @depends 开发文档/开发文档.md 第8.4-8.6节 - 收益发放规则
 * 
 * 核心规则：
 * 1. 收益发放时机 = 购买时间 + 24小时 × 发放序号
 * 2. 排除封禁用户（status != 'BANNED'）
 * 3. 失败重试最多3次（从 GlobalConfig.income_max_retry_count 读取）
 * 4. 最后一笔收益发放时同步完结订单（同一事务）
 */

import { prisma } from '@/lib/prisma';
import { getConfig } from '@/lib/config';
import { clearUserCache } from '@/lib/redis';
import type { TaskResult } from '@/lib/task-lock';
import { Prisma, IncomeRecord, PositionOrder, User, Product } from '@honeywell/database';
import { Decimal } from '@prisma/client/runtime/library';
import { recalculateUserSvip } from '@/services/svip-reward.service';

/**
 * 收益发放任务结果
 */
export interface IncomeSettlementResult extends TaskResult {
  processedCount: number;
  successCount: number;
  failedCount: number;
}

/**
 * 收益记录（包含关联数据）
 */
type IncomeRecordWithRelations = IncomeRecord & {
  position: PositionOrder & {
    product: Pick<Product, 'name' | 'returnPrincipal' | 'type'>;
  };
  user: Pick<User, 'id' | 'status'>;
};

/**
 * 收益发放定时任务主函数
 * 
 * @description 依据：05.3-定时任务.md 第2.1节
 * 
 * 处理流程：
 * 1. 扫描所有 scheduleAt <= now() 且 status = PENDING 的收益记录
 * 2. 排除：用户被封禁、超过最大重试次数
 * 3. 逐条发放收益到用户余额（使用事务）
 * 4. 最后一笔收益发放时同步完结持仓订单
 * 5. 发放失败则记录错误，增加重试次数
 * 
 * @returns 处理结果统计
 */
export async function runIncomeSettlementJob(): Promise<IncomeSettlementResult> {
  const now = new Date();
  
  // 从配置获取最大重试次数（禁止硬编码）
  const maxRetryCount = await getConfig('incomeMaxRetryCount', 3);

  // 1. 查询所有到期且待发放的收益记录
  // 依据：02.1-数据库设计.md 第2.3节 - IncomeRecord表 scheduleAt 索引
  const pendingRecords = await prisma.incomeRecord.findMany({
    where: {
      scheduleAt: { lte: now },         // 到期时间 <= 当前时间
      status: 'PENDING',                 // 待发放状态
      retryCount: { lt: maxRetryCount }, // 未超过最大重试次数
      user: { status: 'ACTIVE' },        // 用户未被封禁（依据：开发文档.md 第16.3节）
    },
    include: {
      position: {
        select: {
          id: true,
          orderNo: true,
          cycleDays: true,
          status: true,
          paidDays: true,
          earnedIncome: true,
          userId: true,
          productId: true,
          purchaseAmount: true,
          dailyIncome: true,
          totalIncome: true,
          isGift: true,
          giftedBy: true,
          nextSettleAt: true,
          startAt: true,
          endAt: true,
          principalReturned: true,
          createdAt: true,
          updatedAt: true,
          product: { 
            select: { name: true, returnPrincipal: true, type: true } 
          },
        },
      },
      user: { 
        select: { id: true, status: true } 
      },
    },
    orderBy: { scheduleAt: 'asc' },
    take: 100, // 每次最多处理100条（依据：05.3-定时任务.md 第2.1节）
  });

  console.log(`[IncomeSettlement] 发现 ${pendingRecords.length} 条待发放记录`);

  if (pendingRecords.length === 0) {
    return { processedCount: 0, successCount: 0, failedCount: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  // 2. 逐条处理
  for (const record of pendingRecords) {
    try {
      await settleIncome(record as unknown as IncomeRecordWithRelations, maxRetryCount);
      successCount++;
    } catch (error) {
      failedCount++;
      console.error(`[IncomeSettlement] 发放失败 recordId=${record.id}:`, error);

      // 更新错误信息和重试次数
      const newRetryCount = record.retryCount + 1;
      try {
        await prisma.incomeRecord.update({
          where: { id: record.id },
          data: {
            retryCount: newRetryCount,
            lastError: error instanceof Error ? error.message : String(error),
            // 超过重试次数则标记为失败
            status: newRetryCount >= maxRetryCount ? 'FAILED' : 'PENDING',
          },
        });
      } catch (updateError) {
        console.error(`[IncomeSettlement] 更新失败状态失败 recordId=${record.id}:`, updateError);
      }
    }
  }

  console.log(`[IncomeSettlement] 执行完成: 成功=${successCount}, 失败=${failedCount}`);

  return {
    processedCount: pendingRecords.length,
    successCount,
    failedCount,
  };
}

/**
 * 单条收益发放（事务）
 * 
 * @description 依据：05.3-定时任务.md 第2.1节 - 单条收益发放逻辑
 * 
 * 处理流程：
 * 1. 增加用户可用余额
 * 2. 更新收益记录状态为已发放
 * 3. 更新持仓订单（paidDays、earnedIncome）
 * 4. 最后一笔时完结订单
 * 5. 生成资金流水
 * 6. 发送站内通知
 * 
 * @param record 收益记录（包含关联数据）
 * @param maxRetryCount 最大重试次数
 */
async function settleIncome(
  record: IncomeRecordWithRelations,
  maxRetryCount: number
): Promise<void> {
  // 二次检查：跳过封禁用户
  // 依据：开发文档.md 第16.3节 - 封禁用户收益停止发放
  if (record.user.status === 'BANNED') {
    console.log(`[IncomeSettlement] 跳过封禁用户 userId=${record.userId}`);
    return;
  }

  // 跳过已完结订单
  if (record.position.status === 'COMPLETED') {
    console.log(`[IncomeSettlement] 跳过已完结订单 positionId=${record.positionId}`);
    // 标记为已处理
    await prisma.incomeRecord.update({
      where: { id: record.id },
      data: { status: 'SETTLED', settledAt: new Date() },
    });
    return;
  }

  // 判断是否为最后一笔收益
  // 依据：开发文档.md 第8.6节 - 最后一笔收益发放时同步完结订单
  const isLastIncome = record.settleSequence === record.position.cycleDays;

  // 使用事务确保数据一致性
  await prisma.$transaction(async (tx) => {
    // 1. 增加用户可用余额
    // 依据：02.1-数据库设计.md 第4.1节 - 余额原子更新
    const user = await tx.user.update({
      where: { id: record.userId },
      data: { 
        availableBalance: { increment: record.amount } 
      },
      select: { availableBalance: true },
    });

    // 2. 更新收益记录状态
    await tx.incomeRecord.update({
      where: { id: record.id },
      data: { 
        status: 'SETTLED', 
        settledAt: new Date() 
      },
    });

    // 3. 更新持仓订单
    const positionUpdate: Prisma.PositionOrderUpdateInput = {
      paidDays: { increment: 1 },
      earnedIncome: { increment: record.amount },
    };

    // 4. 最后一笔时完结订单
    if (isLastIncome) {
      positionUpdate.status = 'COMPLETED';
      positionUpdate.endAt = new Date();
      positionUpdate.nextSettleAt = null;
      console.log(`[IncomeSettlement] 持仓订单完结 positionId=${record.positionId}`);
    } else {
      const nextScheduleAt = new Date(record.scheduleAt.getTime() + 24 * 60 * 60 * 1000);
      positionUpdate.nextSettleAt = nextScheduleAt;
    }

    await tx.positionOrder.update({
      where: { id: record.positionId },
      data: positionUpdate,
    });

    // 5. 生成资金流水
    await tx.transaction.create({
      data: {
        userId: record.userId,
        type: 'INCOME',
        amount: record.amount,
        balanceAfter: user.availableBalance,
        relatedOrderNo: record.position.orderNo,
        remark: `${record.position.product.name} اليوم ${record.settleSequence}`,
      },
    });

    // 6. 理财产品本金返还（最后一笔收益时）
    if (isLastIncome && record.position.product.returnPrincipal && !record.position.principalReturned) {
      const principal = record.position.purchaseAmount;

      const userAfterPrincipal = await tx.user.update({
        where: { id: record.userId },
        data: { availableBalance: { increment: principal } },
        select: { availableBalance: true },
      });

      await tx.positionOrder.update({
        where: { id: record.positionId },
        data: { principalReturned: true },
      });

      await tx.transaction.create({
        data: {
          userId: record.userId,
          type: 'FINANCIAL_PRINCIPAL',
          amount: principal,
          balanceAfter: userAfterPrincipal.availableBalance,
          relatedOrderNo: record.position.orderNo,
          remark: `استرداد رأس المال - ${record.position.product.name}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: record.userId,
          type: 'FINANCIAL_PRINCIPAL',
          title: 'استرداد رأس المال',
          content: `Su capital de $ ${(principal as Decimal).toFixed(0)} del producto ${record.position.product.name} ha sido devuelto.`,
        },
      });

      console.log(`[IncomeSettlement] 理财本金返还 positionId=${record.positionId}, amount=${principal}`);
    }

    // 7. 持仓完结时触发SVIP重新计算
    if (isLastIncome) {
      try {
        await recalculateUserSvip(tx, record.userId);
      } catch (svipError) {
        console.error(`[IncomeSettlement] SVIP重算失败 userId=${record.userId}:`, svipError);
      }
    }

    // 8. 发送站内通知
    const formattedAmount = (record.amount as Decimal).toFixed(0);
    await tx.notification.create({
      data: {
        userId: record.userId,
        type: 'INCOME_RECEIVED',
        title: 'تم استلام الأرباح',
        content: `Su ingreso del producto ${record.position.product.name} ha llegado: $ ${formattedAmount}`,
      },
    });
  });

  // 7. 清除用户缓存（余额已变化）
  await clearUserCache(record.userId);

  console.log(
    `[IncomeSettlement] 发放成功 recordId=${record.id}, userId=${record.userId}, ` +
    `amount=${record.amount}, sequence=${record.settleSequence}/${record.position.cycleDays}` +
    (isLastIncome ? ' [订单完结]' : '')
  );
}
