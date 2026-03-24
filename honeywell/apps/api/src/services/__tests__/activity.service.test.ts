/**
 * @file 活动服务测试
 * @description 测试拉新裂变和连单奖励活动的核心业务逻辑
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ActivityService } from '../activity.service';

describe('ActivityService', () => {
  const activityService = new ActivityService();
  let testUserId: number;
  let inviterUserId: number;
  
  // 生成随机手机号和邀请码，避免测试数据冲突
  const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const inviterPhone = `9${randomSuffix}1`;
  const testUserPhone = `9${randomSuffix}2`;
  const inviterCode = `TA${randomSuffix.slice(0, 6)}`;
  const testUserCode = `TB${randomSuffix.slice(0, 6)}`;

  beforeAll(async () => {
    // 创建测试邀请人
    const inviter = await prisma.user.upsert({
      where: { phone: inviterPhone },
      update: {},
      create: {
        phone: inviterPhone,
        password: 'test_encrypted_password',
        inviteCode: inviterCode,
      },
    });
    inviterUserId = inviter.id;

    // 创建测试用户（被邀请人）
    const testUser = await prisma.user.upsert({
      where: { phone: testUserPhone },
      update: { hasPurchasedPo0: true },
      create: {
        phone: testUserPhone,
        password: 'test_encrypted_password',
        inviteCode: testUserCode,
        inviterId: inviterUserId,
        hasPurchasedPo0: true, // 已购买体验产品，满足连单奖励前置条件
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    if (!testUserId || !inviterUserId) return;
    
    // 清理测试数据（按外键依赖顺序）
    await prisma.transaction.deleteMany({
      where: { userId: { in: [testUserId, inviterUserId] } },
    });
    await prisma.activityReward.deleteMany({
      where: { userId: { in: [testUserId, inviterUserId] } },
    });
    await prisma.validInvitation.deleteMany({
      where: { 
        OR: [
          { inviterId: inviterUserId },
          { inviteeId: testUserId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, inviterUserId] } },
    });
  });

  describe('getActivityList', () => {
    it('应该返回活动列表', async () => {
      const list = await activityService.getActivityList(testUserId);
      
      expect(Array.isArray(list)).toBe(true);
      
      // 检查是否包含拉新裂变和连单奖励活动
      const codes = list.map(a => a.code);
      expect(codes).toContain('INVITE_REWARD');
      expect(codes).toContain('COLLECTION_BONUS');
      
      // 检查每个活动的属性
      for (const activity of list) {
        expect(activity).toHaveProperty('code');
        expect(activity).toHaveProperty('name');
        expect(activity).toHaveProperty('hasClaimable');
        expect(typeof activity.hasClaimable).toBe('boolean');
      }
    });
  });

  describe('getInviteActivityStatus', () => {
    it('应该返回拉新裂变活动状态', async () => {
      const status = await activityService.getInviteActivityStatus(inviterUserId);
      
      expect(status).toHaveProperty('activityName');
      expect(status).toHaveProperty('validInviteCount');
      expect(status).toHaveProperty('tiers');
      expect(Array.isArray(status.tiers)).toBe(true);
      
      // 检查阶梯结构
      for (const tier of status.tiers) {
        expect(tier).toHaveProperty('tier');
        expect(tier).toHaveProperty('requiredCount');
        expect(tier).toHaveProperty('reward');
        expect(tier).toHaveProperty('status');
        expect(['LOCKED', 'CLAIMABLE', 'CLAIMED']).toContain(tier.status);
      }
    });

    it('当邀请人没有有效邀请时，所有阶梯应为LOCKED', async () => {
      const status = await activityService.getInviteActivityStatus(inviterUserId);
      
      // 没有有效邀请，所有阶梯应该是 LOCKED
      expect(status.validInviteCount).toBe(0);
      for (const tier of status.tiers) {
        expect(tier.status).toBe('LOCKED');
      }
    });
  });

  describe('getCollectionActivityStatus', () => {
    it('应该返回连单奖励活动状态', async () => {
      const status = await activityService.getCollectionActivityStatus(testUserId);
      
      expect(status).toHaveProperty('activityName');
      expect(status).toHaveProperty('prerequisite');
      expect(status).toHaveProperty('purchasedProducts');
      expect(status).toHaveProperty('tiers');
      
      // 检查前置条件
      expect(status.prerequisite).toHaveProperty('description');
      expect(status.prerequisite).toHaveProperty('isMet');
      expect(status.prerequisite.isMet).toBe(true); // 测试用户已购买Po0
      
      // 检查阶梯结构
      for (const tier of status.tiers) {
        expect(tier).toHaveProperty('tier');
        expect(tier).toHaveProperty('requiredProducts');
        expect(tier).toHaveProperty('reward');
        expect(tier).toHaveProperty('status');
        expect(['LOCKED', 'CLAIMABLE', 'CLAIMED']).toContain(tier.status);
      }
    });

    it('当用户未购买Po0时，前置条件应为false', async () => {
      // 创建一个未购买Po0的用户
      const newUser = await prisma.user.create({
        data: {
          phone: '900000003',
          password: 'test_encrypted_password',
          inviteCode: 'TST00003',
          hasPurchasedPo0: false,
        },
      });

      try {
        const status = await activityService.getCollectionActivityStatus(newUser.id);
        expect(status.prerequisite.isMet).toBe(false);
        
        // 即使集齐了VIP产品，状态也应该是LOCKED
        for (const tier of status.tiers) {
          expect(tier.status).toBe('LOCKED');
        }
      } finally {
        await prisma.user.delete({ where: { id: newUser.id } });
      }
    });
  });

  describe('claimInviteReward', () => {
    beforeEach(async () => {
      // 清理邀请人的奖励记录
      await prisma.activityReward.deleteMany({
        where: { userId: inviterUserId, activityCode: 'INVITE_REWARD' },
      });
    });

    it('当有效邀请数不足时，应该抛出错误', async () => {
      await expect(
        activityService.claimInviteReward(inviterUserId, 1)
      ).rejects.toThrow();
    });

    it('当满足条件时，应该成功领取奖励', async () => {
      // 创建一个有效邀请记录
      await prisma.validInvitation.create({
        data: {
          inviterId: inviterUserId,
          inviteeId: testUserId,
          validType: 'COMPLETE_SIGNIN',
          validAt: new Date(),
        },
      });

      try {
        const result = await activityService.claimInviteReward(inviterUserId, 1);
        
        expect(result).toHaveProperty('tier', 1);
        expect(result).toHaveProperty('reward');
        expect(result).toHaveProperty('balanceAfter');
        expect(parseFloat(result.reward)).toBeGreaterThan(0);
      } finally {
        // 清理
        await prisma.validInvitation.delete({
          where: {
            inviterId_inviteeId: {
              inviterId: inviterUserId,
              inviteeId: testUserId,
            },
          },
        });
      }
    });

    it('重复领取应该抛出错误', async () => {
      // 创建有效邀请
      await prisma.validInvitation.create({
        data: {
          inviterId: inviterUserId,
          inviteeId: testUserId,
          validType: 'COMPLETE_SIGNIN',
          validAt: new Date(),
        },
      });

      try {
        // 第一次领取
        await activityService.claimInviteReward(inviterUserId, 1);
        
        // 第二次领取应该失败
        await expect(
          activityService.claimInviteReward(inviterUserId, 1)
        ).rejects.toThrow();
      } finally {
        await prisma.validInvitation.delete({
          where: {
            inviterId_inviteeId: {
              inviterId: inviterUserId,
              inviteeId: testUserId,
            },
          },
        });
      }
    });
  });

  describe('claimCollectionReward', () => {
    it('当前置条件不满足时，应该抛出错误', async () => {
      // 创建一个未购买Po0的用户
      const newUser = await prisma.user.create({
        data: {
          phone: '900000004',
          password: 'test_encrypted_password',
          inviteCode: 'TST00004',
          hasPurchasedPo0: false,
        },
      });

      try {
        await expect(
          activityService.claimCollectionReward(newUser.id, 1)
        ).rejects.toThrow();
      } finally {
        await prisma.user.delete({ where: { id: newUser.id } });
      }
    });

    it('当未购齐所需VIP产品时，应该抛出错误', async () => {
      // testUserId 已购买Po0但未购买任何VIP产品
      await expect(
        activityService.claimCollectionReward(testUserId, 1)
      ).rejects.toThrow();
    });
  });
});
