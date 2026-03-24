/**
 * @file 广场/社区服务
 * @description 帖子CRUD、点赞、评论、审核、凭证奖励
 * 
 * 规则：
 * - 用户提现成功后可上传凭证
 * - 帖子需后台审核，审核通过后展示在广场
 * - 审核通过后按提款金额档位自动发放奖励
 * - 可点赞、可评论
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';
import { clearUserCache } from '@/lib/redis';
import { formatNotificationAmount } from '@/lib/config';

/**
 * 获取帖子列表（广场首页，仅展示已审核通过的）
 */
export async function getPosts(page: number, pageSize: number, currentUserId?: number) {
  const [list, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, nickname: true, avatar: true } },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
      },
    }),
    prisma.communityPost.count({ where: { status: 'APPROVED' } }),
  ]);

  return {
    list: list.map(p => ({
      id: p.id,
      userId: p.userId,
      userName: p.user.nickname ?? `User${p.userId}`,
      userAvatar: p.user.avatar,
      withdrawAmount: p.withdrawAmount ? Number(p.withdrawAmount) : 0,
      platformScreenshot: p.platformImage,
      receiptScreenshot: p.receiptImage,
      content: p.content,
      status: p.status,
      rewardAmount: p.rewardAmount ? Number(p.rewardAmount) : null,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      isLiked: Array.isArray(p.likes) && p.likes.length > 0,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 创建帖子（上传提现凭证）
 */
export async function createPost(
  userId: number,
  data: {
    withdrawOrderId: number;
    platformImage: string;
    receiptImage: string;
    content?: string;
  }
) {
  const withdrawOrder = await prisma.withdrawOrder.findUnique({
    where: { id: data.withdrawOrderId },
  });

  if (!withdrawOrder || withdrawOrder.userId !== userId || withdrawOrder.status !== 'COMPLETED') {
    throw Errors.invalidWithdrawOrder();
  }

  const existingPost = await prisma.communityPost.findFirst({
    where: { withdrawOrderId: data.withdrawOrderId },
  });
  if (existingPost) throw Errors.postAlreadyExists();

  return prisma.communityPost.create({
    data: {
      userId,
      withdrawOrderId: data.withdrawOrderId,
      withdrawAmount: withdrawOrder.amount,
      platformImage: data.platformImage,
      receiptImage: data.receiptImage,
      content: data.content ?? null,
      status: 'PENDING',
    },
  });
}

/**
 * 点赞/取消点赞
 */
export async function toggleLike(userId: number, postId: number) {
  const existing = await prisma.communityLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    const [, updatedPost] = await prisma.$transaction([
      prisma.communityLike.delete({ where: { id: existing.id } }),
      prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } }, select: { likeCount: true } }),
    ]);
    return { liked: false, likeCount: updatedPost.likeCount };
  } else {
    const [, updatedPost] = await prisma.$transaction([
      prisma.communityLike.create({ data: { postId, userId } }),
      prisma.communityPost.update({ where: { id: postId }, data: { likeCount: { increment: 1 } }, select: { likeCount: true } }),
    ]);
    return { liked: true, likeCount: updatedPost.likeCount };
  }
}

/**
 * 发表评论
 */
export async function addComment(userId: number, postId: number, content: string) {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== 'APPROVED') throw Errors.notFound('المنشور');

  const [comment] = await prisma.$transaction([
    prisma.communityComment.create({ data: { postId, userId, content } }),
    prisma.communityPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
  ]);

  return comment;
}

/**
 * 获取评论列表
 */
export async function getComments(postId: number, page: number, pageSize: number) {
  const [list, total] = await Promise.all([
    prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    }),
    prisma.communityComment.count({ where: { postId } }),
  ]);

  return {
    list: list.map(c => ({
      id: c.id,
      userId: c.userId,
      userName: c.user.nickname ?? `User${c.userId}`,
      userAvatar: c.user.avatar ?? null,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 获取我的帖子
 */
export async function getMyPosts(userId: number, page: number, pageSize: number) {
  const [list, total] = await Promise.all([
    prisma.communityPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.communityPost.count({ where: { userId } }),
  ]);

  return {
    list: list.map(p => ({
      id: p.id,
      withdrawAmount: p.withdrawAmount ? Number(p.withdrawAmount) : 0,
      platformScreenshot: p.platformImage,
      receiptScreenshot: p.receiptImage,
      content: p.content,
      status: p.status,
      rejectReason: null,
      rewardAmount: p.rewardAmount ? Number(p.rewardAmount) : null,
      likeCount: p.likeCount,
      commentCount: p.commentCount,
      createdAt: p.createdAt.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

/**
 * 审核通过帖子（后台管理）
 * 自动匹配档位并发放奖励
 */
export async function approvePost(postId: number, adminId: number) {
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post || post.status !== 'PENDING') throw Errors.notFound('المنشور');

  // 匹配奖励档位
  let tier = null;
  if (post.withdrawAmount) {
    tier = await prisma.communityRewardTier.findFirst({
      where: {
        isActive: true,
        minAmount: { lte: post.withdrawAmount },
        maxAmount: { gt: post.withdrawAmount },
      },
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.communityPost.update({
      where: { id: postId },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rewardAmount: tier?.rewardAmount ?? null,
        rewardedAt: tier ? new Date() : null,
      },
    });

    if (tier) {
      const user = await tx.user.update({
        where: { id: post.userId },
        data: { availableBalance: { increment: tier.rewardAmount } },
        select: { availableBalance: true },
      });

      await tx.transaction.create({
        data: {
          userId: post.userId,
          type: 'COMMUNITY_REWARD',
          amount: tier.rewardAmount,
          balanceAfter: user.availableBalance,
          remark: 'Recompensa por compartir comprobante',
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: post.userId,
        type: 'COMMUNITY_POST_APPROVED',
        title: 'تمت الموافقة على المنشور',
        content: tier
          ? `تمت الموافقة على منشورك وحصلت على مكافأة بقيمة ${await formatNotificationAmount(tier.rewardAmount)}.`
          : 'تمت الموافقة على منشورك.',
      },
    });
  });

  if (tier) await clearUserCache(post.userId);
}

/**
 * 审核拒绝帖子（后台管理）
 */
export async function rejectPost(postId: number, adminId: number, reason?: string) {
  await prisma.communityPost.update({
    where: { id: postId },
    data: {
      status: 'REJECTED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
    },
  });

  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (post) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'COMMUNITY_POST_REJECTED',
        title: 'تم رفض المنشور',
        content: reason || 'منشورك لا يتوافق مع القواعد.',
      },
    });
  }
}
