/**
 * @file 用户登录接口
 * @description POST /api/auth/login - 用户登录
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第2.2节 - 登录接口
 * @depends 开发文档/05-后端服务/05.4-安全机制.md 第1.1节 - 用户密码验证
 *
 * 核心业务规则：
 * 1. 手机号 + 密码登录
 * 2. 密码使用 AES 解密后比对
 * 3. 登录成功返回 Token 和用户信息
 * 4. 登录失败记录日志
 * 5. 账号封禁检查
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { generateToken } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import { aesDecrypt } from '@honeywell/utils';
import { checkRateLimit } from '@/lib/redis';
import { getClientIp } from '@/lib/client-ip';

// ================================
// 请求参数校验
// ================================

/**
 * 登录请求参数 Schema
 * @description 依据：开发文档.md 第4.1节 - 用户注册规则（同密码规则）
 */
const LoginSchema = z.object({
  phone: z.string().regex(/^\d{9}$/, 'صيغة رقم الهاتف غير صحيحة، يجب أن يتكون من 9 أرقام'),
  password: z.string().min(1, 'يرجى إدخال كلمة المرور'),
});

/**
 * 获取设备信息
 */
function getDeviceInfo(
  request: NextRequest
): { userAgent: string | null; deviceType: string | null } {
  const userAgent = request.headers.get('user-agent');
  let deviceType: string | null = null;

  if (userAgent) {
    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }
  }

  return { userAgent, deviceType };
}

/**
 * 记录登录日志
 * @description 依据：数据库设计 UserLoginLog 表
 */
async function recordLoginLog(data: {
  userId?: number;
  phone: string;
  ip: string;
  userAgent: string | null;
  deviceType: string | null;
  success: boolean;
  failReason?: string;
}): Promise<void> {
  try {
    await prisma.userLoginLog.create({
      data: {
        userId: data.userId ?? null,
        phone: data.phone,
        ip: data.ip,
        userAgent: data.userAgent,
        deviceType: data.deviceType,
        success: data.success,
        failReason: data.failReason ?? null,
      },
    });
  } catch (error) {
    // 登录日志记录失败不影响登录流程
    console.error('[Login] 记录登录日志失败:', error);
  }
}

/**
 * 验证用户密码
 * @description 依据：05.4-安全机制.md - AES解密后比对
 */
function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  try {
    const decryptedPassword = aesDecrypt(storedPassword);
    return decryptedPassword === inputPassword;
  } catch {
    return false;
  }
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
 * 检查手机号黑名单
 */
async function checkPhoneBlacklist(phone: string): Promise<boolean> {
  const blacklist = await prisma.blacklist.findUnique({
    where: { type_value: { type: 'PHONE', value: phone } },
  });
  return blacklist !== null;
}

// ================================
// 路由处理
// ================================

/**
 * POST /api/auth/login
 * @description 用户登录
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const { userAgent, deviceType } = getDeviceInfo(request);

  try {
    // 1. 解析请求参数
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'خطأ في التحقق من البيانات',
        400
      );
    }

    const { phone, password } = result.data;

    // 2. 登录限流检查（每IP每分钟最多10次）
    const rateAllowed = await checkRateLimit(clientIp, 'login', 10, 60);
    if (!rateAllowed) {
      throw Errors.rateLimited(60);
    }

    // 3. 检查IP黑名单
    if (await checkIpBlacklist(clientIp)) {
      throw Errors.blacklistIp();
    }

    // 4. 检查手机号黑名单
    if (await checkPhoneBlacklist(phone)) {
      throw Errors.blacklistPhone();
    }

    // 5. 查找用户
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        password: true,
        nickname: true,
        avatar: true,
        inviteCode: true,
        vipLevel: true,
        svipLevel: true,
        availableBalance: true,
        frozenBalance: true,
        firstPurchaseDone: true,
        status: true,
        createdAt: true,
      },
    });

    // 6. 用户不存在
    if (!user) {
      await recordLoginLog({
        phone,
        ip: clientIp,
        userAgent,
        deviceType,
        success: false,
        failReason: '账号不存在',
      });
      throw Errors.invalidCredentials();
    }

    // 7. 验证密码
    const isPasswordValid = verifyPassword(password, user.password);
    if (!isPasswordValid) {
      await recordLoginLog({
        userId: user.id,
        phone,
        ip: clientIp,
        userAgent,
        deviceType,
        success: false,
        failReason: '密码错误',
      });
      throw Errors.invalidCredentials();
    }

    // 8. 检查账号状态
    if (user.status === 'BANNED') {
      await recordLoginLog({
        userId: user.id,
        phone,
        ip: clientIp,
        userAgent,
        deviceType,
        success: false,
        failReason: '账号已封禁',
      });
      throw Errors.userBanned();
    }

    // 9. 更新最后登录信息
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginIp: clientIp,
        lastLoginAt: new Date(),
      },
    });

    // 10. 记录登录成功日志
    await recordLoginLog({
      userId: user.id,
      phone,
      ip: clientIp,
      userAgent,
      deviceType,
      success: true,
    });

    // 11. 生成 Token
    const token = await generateToken(user.id);

    // 12. 返回结果
    return successResponse(
      {
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
          firstPurchaseDone: user.firstPurchaseDone,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
        },
      },
      'تم تسجيل الدخول بنجاح'
    );
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[Login] 登录失败:', error);
    return errorResponse('INTERNAL_ERROR', 'خطأ في تسجيل الدخول، حاول لاحقاً', 500);
  }
}
