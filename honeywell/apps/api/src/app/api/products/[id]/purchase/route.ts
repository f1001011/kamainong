/**
 * @file 购买产品接口（Lendlease重构版）
 * @description POST /api/products/:id/purchase - 购买产品
 * 
 * 重构变更：
 * 1. 去掉VIP等级购买门槛
 * 2. 双层限购：个人限购 + 全局库存
 * 3. 支持FINANCIAL理财产品
 * 4. 返佣支持FINANCIAL类型（12/3/1）
 * 5. 更新用户状态使用hasPurchasedPaid
 * 6. 购买后触发SVIP等级重新计算
 * 7. 有效邀请同时支持PAID和FINANCIAL
 */

import { NextRequest } from 'next/server';
import { Prisma } from '@honeywell/database';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { withAuth } from '@/middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { commissionService } from '@/services/commission.service';
import { recalculateUserSvip } from '@/services/svip-reward.service';
import { clearUserCache } from '@/lib/redis';

const ORDER_PREFIX = { POSITION: 'PO' };

function generateOrderNo(prefix: string): string {
  const now = new Date();
  const dateStr =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 10; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}${dateStr}${randomStr}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, userId) => {
    try {
      const { id } = await params;
      const productId = parseInt(id, 10);

      if (isNaN(productId) || productId <= 0) {
        return errorResponse('VALIDATION_ERROR', 'صيغة معرف المنتج غير صحيحة', 400);
      }

      // 查询产品信息（包含新字段）
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          series: true,
          price: true,
          dailyIncome: true,
          cycleDays: true,
          totalIncome: true,
          grantVipLevel: true,
          grantSvipLevel: true,
          purchaseLimit: true,
          userPurchaseLimit: true,
          globalStock: true,
          globalSold: true,
          returnPrincipal: true,
          productStatus: true,
          status: true,
        },
      });

      if (!product) {
        throw Errors.productNotFound();
      }

      if (product.status !== 'ACTIVE') {
        throw Errors.productInactive();
      }

      // 检查产品状态（COMING_SOON不可购买）
      if (product.productStatus === 'COMING_SOON') {
        throw Errors.productComingSoon();
      }

      if (product.productStatus === 'CLOSED') {
        throw Errors.productInactive();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          vipLevel: true,
          svipLevel: true,
          availableBalance: true,
          hasPurchasedPo0: true,
          hasPurchasedOther: true,
          hasPurchasedPaid: true,
          hasRecharged: true,
          hasPurchasedAfterRecharge: true,
          inviterId: true,
        },
      });

      if (!user) {
        throw Errors.userNotFound();
      }

      // 个人限购校验（仅使用 userPurchaseLimit，null 表示无限购，purchaseLimit 是遗留字段不参与判断）
      if (product.userPurchaseLimit !== null) {
        const existingPurchase = await prisma.userProductPurchase.findUnique({
          where: { userId_productId: { userId, productId } },
          select: { purchaseCount: true },
        });
        const currentPurchaseCount = existingPurchase?.purchaseCount ?? 0;

        if (currentPurchaseCount >= product.userPurchaseLimit) {
          throw Errors.personalLimitExceeded();
        }
      }

      // 余额检查
      if (user.availableBalance.lessThan(product.price)) {
        throw Errors.insufficientBalance();
      }

      // 事务内执行购买
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 原子扣减余额
        const updateResult = await tx.user.updateMany({
          where: { id: userId, availableBalance: { gte: product.price } },
          data: { availableBalance: { decrement: product.price } },
        });

        if (updateResult.count === 0) {
          throw Errors.insufficientBalance();
        }

        // 全局库存原子递减（如果有全局库存限制）
        if (product.globalStock !== null) {
          const stockResult = await tx.product.updateMany({
            where: {
              id: productId,
              globalSold: { lt: product.globalStock },
            },
            data: { globalSold: { increment: 1 } },
          });

          if (stockResult.count === 0) {
            throw Errors.globalStockExhausted();
          }
        }

        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { availableBalance: true },
        });

        // 创建/更新购买记录
        await tx.userProductPurchase.upsert({
          where: { userId_productId: { userId, productId } },
          create: { userId, productId, purchaseCount: 1 },
          update: { purchaseCount: { increment: 1 } },
        });

        const orderNo = generateOrderNo(ORDER_PREFIX.POSITION);
        const now = new Date();
        const firstSettleAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const positionOrder = await tx.positionOrder.create({
          data: {
            orderNo,
            userId,
            productId,
            purchaseAmount: product.price,
            dailyIncome: product.dailyIncome,
            cycleDays: product.cycleDays,
            totalIncome: product.totalIncome,
            paidDays: 0,
            earnedIncome: new Decimal(0),
            nextSettleAt: firstSettleAt,
            isGift: false,
            status: 'ACTIVE',
            startAt: now,
            principalReturned: false,
          },
        });

        // 预创建收益记录
        const incomeRecords = [];
        for (let i = 1; i <= product.cycleDays; i++) {
          const scheduleAt = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
          incomeRecords.push({
            positionId: positionOrder.id,
            userId,
            settleSequence: i,
            scheduleAt,
            amount: product.dailyIncome,
            status: 'PENDING' as const,
            retryCount: 0,
          });
        }

        await tx.incomeRecord.createMany({ data: incomeRecords });

        // 资金流水
        await tx.transaction.create({
          data: {
            userId,
            type: 'PURCHASE',
            amount: product.price.negated(),
            balanceAfter: updatedUser!.availableBalance,
            relatedOrderNo: orderNo,
            remark: `شراء منتج: ${product.name}`,
          },
        });

        // 更新用户状态标记（业务逻辑使用 hasPurchasedPaid/hasRecharged，旧字段保留向后兼容）
        const userUpdateData: Record<string, boolean | number> = {};

        if (product.type === 'TRIAL') {
          userUpdateData.hasPurchasedPo0 = true; // 向后兼容
        } else {
          userUpdateData.hasPurchasedOther = true;
          userUpdateData.hasPurchasedPaid = true;
        }

        // 保留VIP/SVIP等级赠送逻辑（向后兼容，新产品grantVipLevel=0）
        if (product.grantVipLevel > user.vipLevel) {
          userUpdateData.vipLevel = product.grantVipLevel;
        }
        if (product.grantSvipLevel > user.svipLevel) {
          userUpdateData.svipLevel = product.grantSvipLevel;
        }

        // 充值后首次购买付费/理财产品（有效邀请判断），TRIAL不计入
        if (user.hasRecharged && !user.hasPurchasedAfterRecharge && product.type !== 'TRIAL') {
          userUpdateData.hasPurchasedAfterRecharge = true;
        }

        if (Object.keys(userUpdateData).length > 0) {
          await tx.user.update({ where: { id: userId }, data: userUpdateData });
        }

        // 返佣处理（支持PAID和FINANCIAL类型）
        const commissionResult = await commissionService.processCommission(tx, {
          userId,
          productType: product.type,
          productPrice: product.price,
          productName: product.name,
          positionOrderId: positionOrder.id,
          orderNo,
          isGift: false,
        });

        // 有效邀请记录（PAID和FINANCIAL都触发）
        if (
          user.inviterId &&
          user.hasRecharged &&
          !user.hasPurchasedAfterRecharge &&
          (product.type === 'PAID' || product.type === 'FINANCIAL')
        ) {
          const existingValidInvitation = await tx.validInvitation.findUnique({
            where: {
              inviterId_inviteeId: {
                inviterId: user.inviterId,
                inviteeId: userId,
              },
            },
          });

          if (!existingValidInvitation) {
            await tx.validInvitation.create({
              data: {
                inviterId: user.inviterId,
                inviteeId: userId,
                validType: 'RECHARGE_PURCHASE',
                validAt: now,
              },
            });
          }
        }

        // 购买后触发SVIP等级重新计算（动态SVIP基于活跃持仓数量）
        await recalculateUserSvip(tx, userId);

        return {
          positionOrderId: positionOrder.id,
          orderNo: positionOrder.orderNo,
          balanceAfter: updatedUser!.availableBalance.toFixed(2),
          commissionAffectedUserIds: commissionResult.affectedUserIds || [],
        };
      });

      await clearUserCache(userId);

      for (const affectedUserId of result.commissionAffectedUserIds) {
        await clearUserCache(affectedUserId);
      }

      return successResponse(
        {
          positionOrderId: result.positionOrderId,
          orderNo: result.orderNo,
          balanceAfter: result.balanceAfter,
        },
        'تمت عملية الشراء بنجاح'
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }

      console.error('[ProductPurchase] 购买产品失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في عملية الشراء، حاول لاحقاً', 500);
    }
  });
}
