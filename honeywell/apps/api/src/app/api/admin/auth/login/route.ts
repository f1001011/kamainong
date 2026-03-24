/**
 * @file 管理员登录接口
 * @description POST /api/admin/auth/login - 管理员登录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第1节 - 认证接口
 * @depends 开发文档/02-数据层/02.2-API规范.md 第3.3-3.4节 - 管理员认证
 *
 * 核心业务规则：
 * 1. 用户名 + 密码登录
 * 2. 密码使用 bcrypt 哈希验证（单向不可逆）
 * 3. 登录成功返回 Token 和管理员信息
 * 4. 登录成功/失败均记录 AdminLoginLog
 * 5. 账号禁用检查
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { generateAdminToken } from '@/lib/auth';
import { Errors } from '@/lib/errors';
import { checkRateLimit } from '@/lib/redis';
import { getClientIp } from '@/lib/client-ip';

// ================================
// 请求参数校验
// ================================

/**
 * 登录请求参数 Schema
 * @description 依据：02.4-后台API接口清单.md 第1.1节 - 管理员登录
 */
const LoginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

/**
 * 获取设备信息
 */
function getDeviceInfo(request: NextRequest): string | null {
  const userAgent = request.headers.get('user-agent');
  if (!userAgent) return null;

  // 解析浏览器和操作系统
  let browser = 'Unknown';
  let os = 'Unknown';

  // 解析浏览器
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = match ? `Chrome ${match[1]}` : 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = match ? `Firefox ${match[1]}` : 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    browser = match ? `Safari ${match[1]}` : 'Safari';
  } else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    browser = match ? `Edge ${match[1]}` : 'Edge';
  }

  // 解析操作系统
  if (userAgent.includes('Windows NT 10')) {
    os = 'Windows 10';
  } else if (userAgent.includes('Windows NT 11') || userAgent.includes('Windows NT 10.0')) {
    // Windows 11 仍然报告为 Windows NT 10.0
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} / ${os}`;
}

/**
 * 记录管理员登录日志
 * @description 依据：02.1-数据库设计.md AdminLoginLog 表
 */
async function recordLoginLog(data: {
  adminId?: number;
  username: string;
  ip: string;
  userAgent: string | null;
  deviceInfo: string | null;
  status: 'SUCCESS' | 'FAILED';
  failReason?: string;
}): Promise<void> {
  try {
    await prisma.adminLoginLog.create({
      data: {
        adminId: data.adminId ?? null,
        username: data.username,
        ip: data.ip,
        userAgent: data.userAgent,
        deviceInfo: data.deviceInfo,
        status: data.status,
        failReason: data.failReason ?? null,
      },
    });
  } catch (error) {
    // 登录日志记录失败不影响登录流程
    console.error('[AdminLogin] 记录登录日志失败:', error);
  }
}

/**
 * 验证管理员密码
 * @description 依据：02.1-数据库设计.md - Admin表密码使用bcrypt哈希
 */
async function verifyPassword(inputPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(inputPassword, hashedPassword);
  } catch {
    return false;
  }
}

// ================================
// 路由处理
// ================================

/**
 * POST /api/admin/auth/login
 * @description 管理员登录
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent');
  const deviceInfo = getDeviceInfo(request);

  try {
    // 1. 解析请求参数
    const body = await request.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        result.error.errors[0]?.message || '参数校验失败',
        400
      );
    }

    const { username, password } = result.data;

    // 2. 登录限流检查（每IP每分钟最多10次）
    const rateAllowed = await checkRateLimit(clientIp, 'admin_login', 10, 60);
    if (!rateAllowed) {
      throw Errors.rateLimited(60);
    }

    // 3. 查找管理员
    const admin = await prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        password: true,
        nickname: true,
        isActive: true,
        lastLoginAt: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });

    // 4. 管理员不存在
    if (!admin) {
      await recordLoginLog({
        username,
        ip: clientIp,
        userAgent,
        deviceInfo,
        status: 'FAILED',
        failReason: '账号不存在',
      });
      throw Errors.adminInvalidCredentials();
    }

    // 5. 验证密码（bcrypt哈希验证）
    const isPasswordValid = await verifyPassword(password, admin.password);
    if (!isPasswordValid) {
      await recordLoginLog({
        adminId: admin.id,
        username,
        ip: clientIp,
        userAgent,
        deviceInfo,
        status: 'FAILED',
        failReason: '密码错误',
      });
      throw Errors.adminInvalidCredentials();
    }

    // 6. 检查账号状态
    if (!admin.isActive) {
      await recordLoginLog({
        adminId: admin.id,
        username,
        ip: clientIp,
        userAgent,
        deviceInfo,
        status: 'FAILED',
        failReason: '账号已禁用',
      });
      throw Errors.adminDisabled();
    }

    // 7. 更新最后登录信息
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginIp: clientIp,
        lastLoginAt: new Date(),
      },
    });

    // 8. 记录登录成功日志
    await recordLoginLog({
      adminId: admin.id,
      username,
      ip: clientIp,
      userAgent,
      deviceInfo,
      status: 'SUCCESS',
    });

    // 9. 生成 Token
    const token = await generateAdminToken(admin.id);

    // 10. 返回结果（依据：02.4-后台API接口清单.md 第1.1节）
    return successResponse(
      {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          nickname: admin.nickname,
        },
      },
      '登录成功'
    );
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as { code: string; message: string; httpStatus: number };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    // 未知错误
    console.error('[AdminLogin] 登录失败:', error);
    return errorResponse('INTERNAL_ERROR', '登录失败，请稍后重试', 500);
  }
}
