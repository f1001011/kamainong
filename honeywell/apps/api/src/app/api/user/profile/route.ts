/**
 * @file 用户个人信息接口
 * @description GET /api/user/profile - 获取用户信息
 * @description PUT /api/user/profile - 更新用户信息
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 用户接口
 * @depends 开发文档/开发文档.md 第4.2节 - 用户个人信息管理
 *
 * 核心业务规则：
 * 1. 需要认证（Bearer Token）
 * 2. 返回用户完整信息（包含签到状态、提现门槛等）
 * 3. 支持更新昵称和头像
 * 4. 昵称长度限制从 GlobalConfig 读取（nicknameMinLength / nicknameMaxLength）
 * 5. 昵称敏感词过滤
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { getOrSet, CACHE_TTL, CACHE_KEYS, clearUserCache } from '@/lib/redis';
import { getConfig } from '@/lib/config';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 默认配置值（当数据库无配置时使用）
// ================================

const DEFAULT_NICKNAME_MIN_LENGTH = 2;
const DEFAULT_NICKNAME_MAX_LENGTH = 20;

// ================================
// 辅助函数
// ================================

/**
 * 获取昵称长度配置
 * @description 依据：开发文档.md 第13.11.9节 - 用户头像/昵称配置
 * @returns 昵称最小长度和最大长度
 */
async function getNicknameConfig(): Promise<{ minLength: number; maxLength: number }> {
  const [minLength, maxLength] = await Promise.all([
    getConfig<number>('nickname_min_length', DEFAULT_NICKNAME_MIN_LENGTH),
    getConfig<number>('nickname_max_length', DEFAULT_NICKNAME_MAX_LENGTH),
  ]);
  return { minLength, maxLength };
}

/**
 * 创建动态的更新个人信息 Schema
 * @description 昵称长度限制从配置读取，不硬编码
 */
async function createUpdateProfileSchema() {
  const { minLength, maxLength } = await getNicknameConfig();
  
  return z.object({
    // 昵称：可选，长度从配置读取
    nickname: z.string()
      .min(minLength, `El apodo debe tener al menos ${minLength} caracteres`)
      .max(maxLength, `يجب ألا يتجاوز الاسم المستعار ${maxLength} حرفاً`)
      .optional(),
    // 头像：可选，URL格式
    avatar: z.string().url('صيغة رابط الصورة الشخصية غير صحيحة').max(500).optional(),
  }).refine(
    (data) => data.nickname !== undefined || data.avatar !== undefined,
    { message: 'يرجى تقديم حقل واحد على الأقل للتحديث' }
  );
}

// ================================
// 辅助函数
// ================================

/**
 * 获取用户基本信息（带缓存）
 * @description 使用 CACHE_KEYS.USER.INFO 作为缓存键，确保与 clearUserCache 使用相同的键
 */
async function getUserProfile(userId: number) {
  return getOrSet(
    CACHE_KEYS.USER.INFO(userId),
    async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          inviteCode: true,
          vipLevel: true,
          svipLevel: true,
          availableBalance: true,
          frozenBalance: true,
          hasPurchasedPaid: true,
          hasRecharged: true,
          signInCompleted: true,
          signInWindowExpired: true,
          signInCurrentStreak: true,
          lastSignInDate: true,
          createdAt: true,
        },
      });
      return user;
    },
    CACHE_TTL.USER_INFO
  );
}

/**
 * 获取用户今日收益
 */
async function getTodayIncome(userId: number): Promise<Decimal> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'INCOME',
      createdAt: { gte: today },
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? new Decimal(0);
}

/**
 * 获取用户总收益
 */
async function getTotalIncome(userId: number): Promise<Decimal> {
  const result = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'INCOME',
    },
    _sum: { amount: true },
  });

  return result._sum.amount ?? new Decimal(0);
}

/**
 * 获取团队人数
 */
async function getTeamCount(userId: number): Promise<number> {
  // 统计所有下级（一级、二级、三级）
  const count = await prisma.user.count({
    where: {
      OR: [
        { inviterId: userId },
        { level2InviterId: userId },
        { level3InviterId: userId },
      ],
    },
  });

  return count;
}

/**
 * 检查今日是否已签到
 */
function isTodaySigned(lastSignInDate: Date | null): boolean {
  if (!lastSignInDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastSignInDate);
  lastDate.setHours(0, 0, 0, 0);

  return today.getTime() === lastDate.getTime();
}

/**
 * 检查敏感词
 * @description 依据：开发文档.md 第13.11.11节 - 敏感词库维护
 */
async function containsSensitiveWord(text: string): Promise<boolean> {
  // 获取所有启用的敏感词
  const sensitiveWords = await prisma.sensitiveWord.findMany({
    where: { isActive: true },
    select: { word: true },
  });

  // 检查文本是否包含敏感词
  const lowerText = text.toLowerCase();
  return sensitiveWords.some((sw) => lowerText.includes(sw.word.toLowerCase()));
}

// ================================
// 路由处理
// ================================

/**
 * GET /api/user/profile
 * @description 获取用户个人信息
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 1. 获取用户基本信息
    const user = await getUserProfile(userId);

    if (!user) {
      throw Errors.userNotFound();
    }

    // 2. 获取额外统计信息
    const [todayIncome, totalIncome, teamCount] = await Promise.all([
      getTodayIncome(userId),
      getTotalIncome(userId),
      getTeamCount(userId),
    ]);

    // 3. 计算提现门槛（与 withdraw.service 逻辑保持一致）
    // 依据：老袁重构.md 第1.2节 - 提现条件
    const canWithdraw = user.hasPurchasedPaid === true && user.hasRecharged === true;

    // 4. 判断今日是否已签到
    const todaySigned = isTodaySigned(user.lastSignInDate);

    // 5. 返回完整用户信息
    // 注意：缓存中数据已被 JSON 序列化，Decimal 和 Date 变成字符串
    // 需要兼容处理两种情况：直接从 Prisma 获取的对象和从缓存获取的序列化对象
    return successResponse({
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      inviteCode: user.inviteCode,
      vipLevel: user.vipLevel,
      svipLevel: user.svipLevel,
      // Decimal 类型兼容处理：缓存后变成字符串，使用 String() 统一转换
      availableBalance: String(user.availableBalance),
      frozenBalance: String(user.frozenBalance),
      // 提现门槛判断
      hasPurchasedPaid: user.hasPurchasedPaid,
      hasRecharged: user.hasRecharged,
      canWithdraw,
      // 签到相关
      signInCompleted: user.signInCompleted,
      signInWindowExpired: user.signInWindowExpired,
      signInCurrentStreak: user.signInCurrentStreak,
      todaySigned,
      // 统计
      todayIncome: todayIncome.toString(),
      totalIncome: totalIncome.toString(),
      teamCount,
      // Date 类型兼容处理：缓存后变成 ISO 字符串，已是 string 则直接使用
      createdAt: typeof user.createdAt === 'string' 
        ? user.createdAt 
        : user.createdAt.toISOString(),
    });
  });
}

/**
 * PUT /api/user/profile
 * @description 更新用户个人信息
 * @description 依据：开发文档.md 第4.2节 - 用户个人信息管理
 * - 昵称长度从 GlobalConfig 读取（nickname_min_length / nickname_max_length）
 * - 昵称敏感词过滤
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 1. 解析请求参数，使用动态 Schema（昵称长度从配置读取）
    const body = await request.json();
    const UpdateProfileSchema = await createUpdateProfileSchema();
    const result = UpdateProfileSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'خطأ في التحقق من المعلمات',
        400
      );
    }

    const { nickname, avatar } = result.data;

    // 2. 检查敏感词（仅对昵称）
    if (nickname && (await containsSensitiveWord(nickname))) {
      throw Errors.sensitiveWordDetected();
    }

    // 3. 更新用户信息
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });

    // 4. 清除用户缓存
    await clearUserCache(userId);

    // 5. 返回更新后的信息
    return successResponse(
      {
        id: updatedUser.id,
        nickname: updatedUser.nickname,
        avatar: updatedUser.avatar,
      },
      'تم تحديث المعلومات الشخصية'
    );
  });
}
