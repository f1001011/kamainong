/**
 * @file 活动详情和更新API
 * @description GET/PUT /api/admin/activities/:code
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8.2节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { adminActivityService } from '@/services/admin-activity.service';

// 普通签到配置验证
const normalSignInConfigSchema = z.object({
  dailyReward: z.number().positive('每日奖励必须为正数'),
  windowDays: z.number().int().positive('窗口天数必须为正整数'),
  targetDays: z.number().int().positive('目标签到天数必须为正整数'),
});

// SVIP签到配置验证
const svipSignInConfigSchema = z.object({
  rewards: z.record(z.string(), z.number().positive('奖励金额必须为正数')),
});

// 拉新奖励配置验证
const inviteRewardConfigSchema = z.object({
  tiers: z.array(
    z.object({
      count: z.number().int().positive('邀请人数必须为正整数'),
      reward: z.number().positive('奖励金额必须为正数'),
    })
  ).min(1, '至少需要一个奖励档位'),
});

// 连单奖励配置验证
const collectionBonusConfigSchema = z.object({
  prerequisiteDescription: z.string().optional(),  // 前置条件描述（可选）
  tiers: z.array(
    z.object({
      products: z.array(z.string()).min(1, '每个档位至少需要一个产品'),
      reward: z.number().positive('奖励金额必须为正数'),
      name: z.string().optional(),  // 档位名称（可选，用于前端显示）
    })
  ).min(1, '至少需要一个奖励档位'),
});

// 更新请求验证
const updateSchema = z.object({
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).optional(),
});

/**
 * GET /api/admin/activities/:code
 * 获取活动详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { code } = await params;
      const activity = await adminActivityService.getActivityDetail(code);

      if (!activity) {
        return errorResponse('NOT_FOUND', '活动不存在', 404);
      }

      return successResponse(activity);
    } catch (error) {
      console.error('[AdminActivityDetail] 获取活动详情失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取活动详情失败', 500);
    }
  });
}

/**
 * PUT /api/admin/activities/:code
 * 更新活动配置
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { code } = await params;
      const body = await req.json();

      // 验证基础请求
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('VALIDATION_ERROR', parsed.error.errors[0].message, 400);
      }

      const { isActive, config } = parsed.data;

      // 如果有配置更新，根据活动类型验证配置
      if (config) {
        let configValidation;
        switch (code) {
          case 'NORMAL_SIGNIN':
            configValidation = normalSignInConfigSchema.safeParse(config);
            break;
          case 'SVIP_SIGNIN':
            configValidation = svipSignInConfigSchema.safeParse(config);
            break;
          case 'INVITE_REWARD':
            configValidation = inviteRewardConfigSchema.safeParse(config);
            // 额外验证：邀请人数必须递增
            if (configValidation.success) {
              const tiers = (config as { tiers: { count: number }[] }).tiers;
              for (let i = 1; i < tiers.length; i++) {
                if (tiers[i].count <= tiers[i - 1].count) {
                  return errorResponse('VALIDATION_ERROR', '邀请人数必须递增', 400);
                }
              }
            }
            break;
          case 'COLLECTION_BONUS':
            configValidation = collectionBonusConfigSchema.safeParse(config);
            // 额外验证：每个档位产品必须是前一档位的超集
            if (configValidation.success) {
              const tiers = (config as { tiers: { products: string[] }[] }).tiers;
              for (let i = 1; i < tiers.length; i++) {
                const hasAll = tiers[i - 1].products.every((p) =>
                  tiers[i].products.includes(p)
                );
                if (!hasAll) {
                  return errorResponse(
                    'VALIDATION_ERROR',
                    '每个档位的产品必须包含前一档位的所有产品',
                    400
                  );
                }
              }
            }
            break;
          default:
            return errorResponse('NOT_FOUND', '未知的活动类型', 404);
        }

        if (configValidation && !configValidation.success) {
          return errorResponse('VALIDATION_ERROR', configValidation.error.errors[0].message, 400);
        }
      }

      // 更新活动
      const updated = await adminActivityService.updateActivity(code, { isActive, config });

      if (!updated) {
        return errorResponse('NOT_FOUND', '活动不存在', 404);
      }

      return successResponse(updated);
    } catch (error) {
      console.error('[AdminActivityUpdate] 更新活动配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '更新活动配置失败', 500);
    }
  });
}
