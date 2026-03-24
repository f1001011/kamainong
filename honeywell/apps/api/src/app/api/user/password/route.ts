/**
 * @file 修改密码接口
 * @description PUT /api/user/password - 修改密码
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 用户接口
 * @depends 开发文档/开发文档.md 第4节 - 用户系统
 *
 * 核心业务规则：
 * 1. 需要认证（Bearer Token）
 * 2. 验证旧密码正确
 * 3. 新密码必须符合规则：字母+数字，长度从数据库配置读取
 * 4. 密码使用 AES 加密存储
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { aesEncrypt, aesDecrypt } from '@honeywell/utils';
import { clearUserCache, getOrSet, CACHE_TTL } from '@/lib/redis';

// ================================
// 请求参数校验
// ================================

/**
 * 获取密码配置
 * @description 从数据库读取密码规则配置，不硬编码
 */
async function getPasswordConfig(): Promise<{
  minLength: number;
  maxLength: number;
  requireLetter: boolean;
  requireNumber: boolean;
}> {
  return getOrSet(
    'config:password',
    async () => {
      const configs = await prisma.globalConfig.findMany({
        where: {
          key: {
            in: [
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
        minLength: (configMap['password_min_length'] as number) ?? 6,
        maxLength: (configMap['password_max_length'] as number) ?? 32,
        requireLetter: complexityRequired,
        requireNumber: complexityRequired,
      };
    },
    CACHE_TTL.CONFIG_GLOBAL
  );
}

/**
 * 创建动态修改密码请求参数 Schema
 * @description 依据：开发文档.md 第4.1节 - 密码规则从数据库配置读取
 */
function createChangePasswordSchema(pwConfig: {
  minLength: number;
  maxLength: number;
  requireLetter: boolean;
  requireNumber: boolean;
}) {
  let newPasswordSchema = z.string()
    .min(pwConfig.minLength, `يجب أن تتكون كلمة المرور الجديدة من ${pwConfig.minLength} أحرف على الأقل`)
    .max(pwConfig.maxLength, `يجب ألا تتجاوز كلمة المرور الجديدة ${pwConfig.maxLength} حرفاً`);

  if (pwConfig.requireLetter) {
    newPasswordSchema = newPasswordSchema.regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور الجديدة على أحرف');
  }
  if (pwConfig.requireNumber) {
    newPasswordSchema = newPasswordSchema.regex(/[0-9]/, 'يجب أن تحتوي كلمة المرور الجديدة على أرقام');
  }

  return z.object({
    oldPassword: z.string().min(1, 'يرجى إدخال كلمة المرور الحالية'),
    newPassword: newPasswordSchema,
  });
}

// ================================
// 辅助函数
// ================================

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

// ================================
// 路由处理
// ================================

/**
 * PUT /api/user/password
 * @description 修改用户密码
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    // 1. 解析请求参数（密码规则从数据库配置读取）
    const body = await request.json();
    const pwConfig = await getPasswordConfig();
    const ChangePasswordSchema = createChangePasswordSchema(pwConfig);
    const result = ChangePasswordSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || 'خطأ في التحقق من المعلمات',
        400
      );
    }

    const { oldPassword, newPassword } = result.data;

    // 2. 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      throw Errors.userNotFound();
    }

    // 3. 检查账号状态
    if (user.status === 'BANNED') {
      throw Errors.userBanned();
    }

    // 4. 验证旧密码
    // 依据：02.3-前端API接口清单.md 第3.3节 - 错误码 OLD_PASSWORD_WRONG
    const isOldPasswordValid = verifyPassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw Errors.oldPasswordWrong();
    }

    // 5. 检查新密码是否与旧密码相同
    // 依据：02.3-前端API接口清单.md 第3.3节 - 错误码 SAME_PASSWORD
    if (oldPassword === newPassword) {
      throw Errors.samePassword();
    }

    // 6. 加密新密码
    const encryptedNewPassword = aesEncrypt(newPassword);

    // 7. 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: encryptedNewPassword,
      },
    });

    // 8. 清除用户缓存
    await clearUserCache(userId);

    // 9. 返回成功
    return successResponse(null, 'تم تغيير كلمة المرور بنجاح');
  });
}
