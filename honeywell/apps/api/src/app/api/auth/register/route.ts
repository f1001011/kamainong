/**
 * @file 用户注册接口
 * @description POST /api/auth/register - 用户注册
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第2.1节 - 注册接口
 * @depends 开发文档/开发文档.md 第4.1节 - 用户注册规则
 * @depends 开发文档/开发文档.md 第14.2.2节 - 三级上级字段填充逻辑
 *
 * 核心业务规则：
 * 1. 手机号：+212 9位数字（区号后台可配置）
 * 2. 密码：字母+数字组合，长度从数据库配置读取，AES加密存储
 * 3. 邀请码：链接访问自动填且锁定，直接访问选填
 * 4. 注册时自动填充三级上级ID
 * 5. 注册奖励金额从配置读取
 * 6. 同IP注册限制
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { generateToken } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import { aesEncrypt, generateInviteCode, isValidInviteCode } from '@honeywell/utils';
import { getOrSet, CACHE_TTL, checkRateLimitReadonly, incrementRateLimit } from '@/lib/redis';
import { getClientIp } from '@/lib/client-ip';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 请求参数校验
// ================================

/**
 * 创建动态注册请求参数 Schema
 * @description 依据：开发文档.md 第4.1节 - 用户注册规则
 * 密码规则从数据库配置读取，不硬编码
 */
function createRegisterSchema(passwordConfig: {
  minLength: number;
  maxLength: number;
  requireLetter: boolean;
  requireNumber: boolean;
}) {
  let passwordSchema = z
    .string()
    .min(passwordConfig.minLength, `يجب أن تتكون كلمة المرور من ${passwordConfig.minLength} أحرف على الأقل`)
    .max(passwordConfig.maxLength, `لا يمكن أن تتجاوز كلمة المرور ${passwordConfig.maxLength} حرفاً`);

  if (passwordConfig.requireLetter) {
    passwordSchema = passwordSchema.regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور على أحرف');
  }
  if (passwordConfig.requireNumber) {
    passwordSchema = passwordSchema.regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور على أرقام');
  }

  return z.object({
    phone: z.string().regex(/^\d{9}$/, 'صيغة رقم الهاتف غير صحيحة، يجب أن يتكون من 9 أرقام'),
    password: passwordSchema,
    inviteCode: z
      .string()
      .length(8)
      .optional()
      .or(z.literal(''))
      .transform((val) => (val === '' ? undefined : val)),
  });
}

// ================================
// 配置获取
// ================================

/**
 * 获取注册相关配置
 * @description 依据：开发文档.md 第2.2节 - 全局配置
 */
async function getRegisterConfig(): Promise<{
  registerBonus: number;
  registerIpLimit: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireLetter: boolean;
  passwordRequireNumber: boolean;
}> {
  return getOrSet(
    'config:register',
    async () => {
      const configs = await prisma.globalConfig.findMany({
        where: {
          key: {
            in: [
              'register_bonus',
              'register_ip_limit',
              'password_min_length',
              'password_max_length',
              'password_complexity_required',
            ],
          },
        },
      });

      const configMap: Record<string, unknown> = {};
      for (const c of configs) {
        configMap[c.key] = c.value;
      }

      const complexityRequired = (configMap['password_complexity_required'] as boolean) ?? true;
      return {
        registerBonus: (configMap['register_bonus'] as number) ?? 3000,
        registerIpLimit: (configMap['register_ip_limit'] as number) ?? 5,
        passwordMinLength: (configMap['password_min_length'] as number) ?? 6,
        passwordMaxLength: (configMap['password_max_length'] as number) ?? 32,
        passwordRequireLetter: complexityRequired,
        passwordRequireNumber: complexityRequired,
      };
    },
    CACHE_TTL.CONFIG_GLOBAL
  );
}

// ================================
// 辅助函数
// ================================

/**
 * 检查同IP注册限制（只读，不递增计数器）
 * @description 依据：开发文档.md - 同IP注册限制
 * 只有注册成功后才递增计数器，避免失败的尝试消耗配额
 */
async function checkIpRegisterLimit(ip: string, limit: number): Promise<boolean> {
  return checkRateLimitReadonly(ip, 'register', limit);
}

/**
 * 注册成功后递增 IP 注册计数
 */
async function recordIpRegister(ip: string): Promise<void> {
  await incrementRateLimit(ip, 'register', 86400); // 24小时窗口
}

/**
 * 检查手机号黑名单
 * @description 依据：开发文档.md 第4.13节 - 黑名单相关错误码
 */
async function checkPhoneBlacklist(phone: string): Promise<boolean> {
  const blacklist = await prisma.blacklist.findUnique({
    where: { type_value: { type: 'PHONE', value: phone } },
  });
  return blacklist !== null;
}

/**
 * 检查IP黑名单
 */
async function checkIpBlacklist(ip: string): Promise<boolean> {
  const blacklist = await prisma.blacklist.findUnique({
    where: { type_value: { type: 'IP', value: ip } },
  });
  return blacklist !== null;
}

/**
 * 生成唯一邀请码
 * @description 依据：开发文档.md 第17.1节 - 邀请码生成规则
 */
async function generateUniqueInviteCode(): Promise<string> {
  let code: string;
  let exists: boolean;

  // 循环生成直到获得唯一邀请码
  do {
    code = generateInviteCode();
    const existingUser = await prisma.user.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    exists = existingUser !== null;
  } while (exists);

  return code;
}

/**
 * 填充三级上级ID
 * @description 依据：开发文档.md 第14.2.2节 - 三级上级字段填充逻辑
 *
 * 规则：
 * - inviterId: 一级上级（直接邀请人），从邀请码查询
 * - level2InviterId: 二级上级（邀请人的邀请人）
 * - level3InviterId: 三级上级（邀请人的邀请人的邀请人）
 */
async function fillInviterLevels(inviteCode?: string): Promise<{
  inviterId: number | null;
  level2InviterId: number | null;
  level3InviterId: number | null;
  inviterFound: boolean;
}> {
  // 无邀请码时，所有上级为空
  if (!inviteCode) {
    return {
      inviterId: null,
      level2InviterId: null,
      level3InviterId: null,
      inviterFound: true, // 无邀请码视为正常
    };
  }

  // 验证邀请码格式
  if (!isValidInviteCode(inviteCode)) {
    return {
      inviterId: null,
      level2InviterId: null,
      level3InviterId: null,
      inviterFound: false, // 邀请码格式无效
    };
  }

  // 查找邀请人
  const inviter = await prisma.user.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      inviterId: true,
      level2InviterId: true,
    },
  });

  // 邀请码无效（找不到对应用户）
  if (!inviter) {
    return {
      inviterId: null,
      level2InviterId: null,
      level3InviterId: null,
      inviterFound: false,
    };
  }

  // 填充三级上级
  // 一级上级 = 邀请人
  // 二级上级 = 邀请人的一级上级
  // 三级上级 = 邀请人的二级上级
  return {
    inviterId: inviter.id,
    level2InviterId: inviter.inviterId,
    level3InviterId: inviter.level2InviterId,
    inviterFound: true,
  };
}

// ================================
// 路由处理
// ================================

/**
 * POST /api/auth/register
 * @description 用户注册
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求参数
    const body = await request.json();

    // 1.5 获取注册配置（包含密码规则）
    const config = await getRegisterConfig();

    // 使用动态 Schema（密码规则从数据库配置读取）
    const RegisterSchema = createRegisterSchema({
      minLength: config.passwordMinLength,
      maxLength: config.passwordMaxLength,
      requireLetter: config.passwordRequireLetter,
      requireNumber: config.passwordRequireNumber,
    });
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'خطأ في التحقق من البيانات',
        400
      );
    }

    const { phone, password, inviteCode } = result.data;
    const clientIp = getClientIp(request);

    // 2. 检查IP黑名单
    if (await checkIpBlacklist(clientIp)) {
      throw Errors.blacklistIp();
    }

    // 3. 检查手机号黑名单
    if (await checkPhoneBlacklist(phone)) {
      throw Errors.blacklistPhone();
    }

    // 5. 检查同IP注册限制
    const ipAllowed = await checkIpRegisterLimit(clientIp, config.registerIpLimit);
    if (!ipAllowed) {
      throw Errors.registerIpLimit();
    }

    // 6. 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existingUser) {
      throw Errors.phoneAlreadyExists();
    }

    // 7. 填充三级上级ID
    const inviterResult = await fillInviterLevels(inviteCode);

    // 邀请码无效时提示（但不阻止注册）
    // 依据：开发文档.md 第17.3节 - 无效邀请码提示错误但不阻止注册
    let inviteCodeWarning: string | null = null;
    if (inviteCode && !inviterResult.inviterFound) {
      inviteCodeWarning = 'رمز الدعوة غير صالح';
    }

    // 8. 生成唯一邀请码
    const newInviteCode = await generateUniqueInviteCode();

    // 9. AES加密密码
    const encryptedPassword = aesEncrypt(password);

    // 10. 创建用户（使用事务）
    const registerBonus = new Decimal(config.registerBonus);
    const now = new Date();

    const user = await prisma.$transaction(async (tx) => {
      // 创建用户
      const newUser = await tx.user.create({
        data: {
          phone,
          password: encryptedPassword,
          inviteCode: newInviteCode,
          inviterId: inviterResult.inviterId,
          level2InviterId: inviterResult.level2InviterId,
          level3InviterId: inviterResult.level3InviterId,
          availableBalance: registerBonus, // 注册奖励
          signInWindowStart: now, // 签到窗口期开始（注册日期）
          registerIp: clientIp,
        },
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
        },
      });

      // 创建注册奖励流水
      // 依据：开发文档.md 第10节 - 资金明细
      await tx.transaction.create({
        data: {
          userId: newUser.id,
          type: 'REGISTER_BONUS',
          amount: registerBonus,
          balanceAfter: registerBonus,
          remark: 'مكافأة التسجيل',
        },
      });

      return newUser;
    });

    // 11. 注册成功，递增 IP 注册计数（只有成功才计数）
    await recordIpRegister(clientIp);

    // 12. 生成 Token
    const token = await generateToken(user.id);

    // 12. 返回结果
    const response = {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        inviteCode: user.inviteCode,
        vipLevel: user.vipLevel,
        svipLevel: user.svipLevel,
        availableBalance: user.availableBalance.toString(),
        frozenBalance: user.frozenBalance.toString(),
      },
    };

    // 如果邀请码无效，在响应中添加警告
    if (inviteCodeWarning) {
      return successResponse(
        { ...response, warning: inviteCodeWarning },
        'تم التسجيل بنجاح'
      );
    }

    return successResponse(response, 'تم التسجيل بنجاح');
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[Register] 注册失败:', error);
    return errorResponse('INTERNAL_ERROR', 'خطأ في التسجيل، حاول لاحقاً', 500);
  }
}
