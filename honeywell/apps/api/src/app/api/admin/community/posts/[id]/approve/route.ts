/**
 * @file 社区帖子审核通过接口
 * @description PUT /api/admin/community/posts/:id/approve
 * 审核通过帖子，根据 CommunityRewardTier 自动计算奖励并发放
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@honeywell/database';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/community/posts/:id/approve
 * @description 审核通过帖子，自动匹配奖励等级并发放奖励
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      const { id } = await params;
      const postId = parseInt(id, 10);
      if (isNaN(postId)) {
        return errorResponse('VALIDATION_ERROR', '无效的帖子ID', 400);
      }

      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
      });
      if (!post) {
        return errorResponse('NOT_FOUND', '帖子不存在', 404);
      }
      if (post.status !== 'PENDING') {
        return errorResponse('INVALID_STATUS', '该帖子已被审核，无法重复操作', 400);
      }

      // 根据提现金额匹配奖励等级
      let matchedTier = null;
      if (post.withdrawAmount) {
        matchedTier = await prisma.communityRewardTier.findFirst({
          where: {
            isActive: true,
            minAmount: { lte: post.withdrawAmount },
            maxAmount: { gte: post.withdrawAmount },
          },
          orderBy: { rewardAmount: 'desc' },
        });
      }

      const now = new Date();

      if (matchedTier) {
        // 有匹配的奖励等级：发放奖励（事务操作）
        await prisma.$transaction(async (tx) => {
          await tx.communityPost.update({
            where: { id: postId },
            data: {
              status: 'APPROVED',
              reviewedBy: adminId,
              reviewedAt: now,
              rewardAmount: matchedTier!.rewardAmount,
              rewardedAt: now,
            },
          });

          const updatedUser = await tx.user.update({
            where: { id: post.userId },
            data: { availableBalance: { increment: matchedTier!.rewardAmount } },
          });

          await tx.transaction.create({
            data: {
              userId: post.userId,
              type: TransactionType.COMMUNITY_REWARD,
              amount: matchedTier!.rewardAmount,
              balanceAfter: updatedUser.availableBalance,
              remark: `社区凭证奖励 - 帖子#${postId}`,
            },
          });
        });

        console.log(
          `[审计] 管理员(${adminId}) 审核通过帖子 #${postId}，发放奖励 ${matchedTier.rewardAmount}`
        );
      } else {
        // 无匹配等级：仅审核通过，不发放奖励
        await prisma.communityPost.update({
          where: { id: postId },
          data: {
            status: 'APPROVED',
            reviewedBy: adminId,
            reviewedAt: now,
          },
        });

        console.log(`[审计] 管理员(${adminId}) 审核通过帖子 #${postId}，无匹配奖励等级`);
      }

      return successResponse({ id: postId, rewarded: !!matchedTier }, '帖子已审核通过');
    } catch (error) {
      console.error('[PUT /api/admin/community/posts/:id/approve] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '审核帖子失败', 500);
    }
  });
}
