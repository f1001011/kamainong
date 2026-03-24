import { NextRequest } from 'next/server';
import {
  verifyToken,
  renewToken,
  verifyAdminToken,
  renewAdminToken,
} from '@/lib/auth';
import { errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';

/**
 * 用户端认证中间件
 * @description 依据：02.2-API规范.md 第3节 - 认证机制
 * - 验证 JWT Token
 * - 检查用户状态（BANNED 则拒绝）
 * - 自动续期（剩余 ≤1天时，响应头返回新 Token）
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, userId: number) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', 'يرجى تسجيل الدخول', 401);
  }

  const token = authHeader.substring(7);

  // 先验证 Token
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return errorResponse('UNAUTHORIZED', 'الرمز غير صالح أو منتهي الصلاحية', 401);
  }

  try {
    // 检查用户状态（依据：02.1-数据库设计.md UserStatus 枚举只有 ACTIVE | BANNED）
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { status: true },
    });

    if (!user) {
      return errorResponse('USER_NOT_FOUND', 'المستخدم غير موجود', 401);
    }

    if (user.status === 'BANNED') {
      return errorResponse('USER_BANNED', 'الحساب محظور', 403);
    }

    // 执行业务处理
    const response = await handler(request, payload.userId);

    // 检查是否需要续期（依据：02.2-API规范.md 第3.1节 - 剩余≤1天时自动续期）
    if (payload.shouldRenew) {
      const newToken = renewToken(payload.userId);
      response.headers.set('X-New-Token', newToken);
    }

    return response;
  } catch (error) {
    // 业务错误：返回对应的错误码和状态
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus);
    }
    // 其他未知错误
    console.error('[withAuth] 未知错误:', error);
    return errorResponse('INTERNAL_ERROR', 'Error del servidor', 500);
  }
}

/**
 * 管理员认证中间件
 * @description 依据：02.2-API规范.md 第3.3节 - 后台管理端认证
 * - 验证管理员 JWT Token
 * - 检查管理员是否启用
 * - 自动续期（剩余 ≤1天时，响应头返回新 Token）
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, adminId: number) => Promise<Response>
): Promise<Response> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return errorResponse('UNAUTHORIZED', '请先登录管理后台', 401);
  }

  const token = authHeader.substring(7);

  // 先验证 Token
  let payload;
  try {
    payload = verifyAdminToken(token);
  } catch {
    return errorResponse('UNAUTHORIZED', 'Token无效或已过期', 401);
  }

  try {
    // 检查管理员是否存在且启用
    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { isActive: true },
    });

    if (!admin) {
      return errorResponse('ADMIN_NOT_FOUND', '管理员不存在', 401);
    }

    if (!admin.isActive) {
      return errorResponse('ADMIN_DISABLED', '管理员账号已禁用', 403);
    }

    // 执行业务处理
    const response = await handler(request, payload.adminId);

    // 检查是否需要续期（依据：02.2-API规范.md 第3.3节）
    if (payload.shouldRenew) {
      const newToken = renewAdminToken(payload.adminId);
      response.headers.set('X-New-Token', newToken);
    }

    return response;
  } catch (error) {
    // 业务错误：返回对应的错误码和状态
    if (error instanceof BusinessError) {
      return errorResponse(error.code, error.message, error.httpStatus);
    }
    // 其他未知错误
    console.error('[withAdminAuth] 未知错误:', error);
    return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
  }
}
