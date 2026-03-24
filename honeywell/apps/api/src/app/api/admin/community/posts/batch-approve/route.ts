/**
 * @file 社区帖子批量审核通过接口
 * @description POST /api/admin/community/posts/batch-approve
 * 批量审核通过帖子，自动匹配奖励等级并发放
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@honeywell/database';

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1, '至少选择一条帖子'),
});

/**
 * POST /api/admin/community/posts/batch-approve
 * @description 批量审核通过帖子
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const validation = bodySchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'VALIDATION_ERROR',
          validation.error.errors.map(e => e.message).join(', '),
          400
        );
      }

      const { ids } = validation.data;

      // 查询所有待审核帖子
      const posts = await prisma.communityPost.findMany({
        where: { id: { in: ids }, status: 'PENDING' },
      });

      if (posts.length === 0) {
        return errorResponse('NOT_FOUND', '没有可审核的帖子', 400);
      }

      // 加载所有激活的奖励等级
      const tiers = await prisma.communityRewardTier.findMany({
        where: { isActive: true },
        orderBy: { rewardAmount: 'desc' },
      });

      const now = new Date();
      let approvedCount = 0;
      let rewardedCount = 0;

      await prisma.$transaction(async (tx) => {
        for (const post of posts) {
          // 匹配奖励等级
          const matchedTier = post.withdrawAmount
            ? tiers.find(
                (t) =>
                  Number(t.minAmount) <= Number(post.withdrawAmount) &&
                  Number(t.maxAmount) >= Number(post.withdrawAmount)
              )
            : null;

          if (matchedTier) {
            await tx.communityPost.update({
              where: { id: post.id },
              data: {
                status: 'APPROVED',
                reviewedBy: adminId,
                reviewedAt: now,
                rewardAmount: matchedTier.rewardAmount,
                rewardedAt: now,
              },
            });

            const updatedUser = await tx.user.update({
              where: { id: post.userId },
              data: { availableBalance: { increment: matchedTier.rewardAmount } },
            });

            await tx.transaction.create({
              data: {
                userId: post.userId,
                type: TransactionType.COMMUNITY_REWARD,
                amount: matchedTier.rewardAmount,
                balanceAfter: updatedUser.availableBalance,
                remark: `社区凭证奖励 - 帖子#${post.id}（批量审核）`,
              },
            });

            rewardedCount++;
          } else {
            await tx.communityPost.update({
              where: { id: post.id },
              data: {
                status: 'APPROVED',
                reviewedBy: adminId,
                reviewedAt: now,
              },
            });
          }

          approvedCount++;
        }
      });

      console.log(
        `[审计] 管理员(${adminId}) 批量审核通过 ${approvedCount} 条帖子，其中 ${rewardedCount} 条获得奖励`
      );

      return successResponse(
        { approvedCount, rewardedCount, skippedCount: ids.length - approvedCount },
        '批量审核完成'
      );
    } catch (error) {
      console.error('[POST /api/admin/community/posts/batch-approve] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '批量审核失败', 500);
    }
  });
}
