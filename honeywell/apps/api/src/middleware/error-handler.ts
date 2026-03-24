/**
 * @file 错误处理中间件
 * @description 全局异常捕获，统一错误响应格式
 * @depends 开发文档/05-后端服务/05.1-服务架构.md 第4.4节 - 错误处理中间件
 * @depends 开发文档/02-数据层/02.2-API规范.md 第2.2节 - 失败响应格式
 */

import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { ZodError } from 'zod';

/**
 * Prisma 错误类型定义
 * @description 用于判断 Prisma 数据库错误
 */
interface PrismaError {
  code: string;
  message: string;
  name: string;
}

/**
 * 判断是否为 Prisma 已知错误
 */
function isPrismaError(error: unknown): error is PrismaError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'name' in error &&
    (error as { name: string }).name === 'PrismaClientKnownRequestError'
  );
}

/**
 * 全局错误处理中间件
 * @description 依据：05.1-服务架构.md 第4.4节
 *
 * 处理的错误类型：
 * 1. BusinessError - 业务错误，返回对应错误码和消息
 * 2. ZodError - 参数校验错误，返回 VALIDATION_ERROR
 * 3. PrismaClientKnownRequestError - 数据库错误
 * 4. 其他未知错误 - 返回 INTERNAL_ERROR
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   return withErrorHandler(request, async () => {
 *     // 业务逻辑
 *   });
 * }
 */
export async function withErrorHandler(
  request: NextRequest,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    return await handler();
  } catch (error: unknown) {
    // 记录错误日志
    const logContext = {
      url: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };

    // 1. 业务错误 - 返回对应错误码
    if (error instanceof BusinessError) {
      console.warn('[BusinessError]', logContext, {
        code: error.code,
        message: error.message,
      });
      return errorResponse(
        error.code,
        error.message,
        error.httpStatus,
        error.extra
      );
    }

    // 2. Zod 参数校验错误 - 返回 VALIDATION_ERROR
    if (error instanceof ZodError) {
      const messages = error.errors.map((e) => e.message).join(', ');
      console.warn('[ValidationError]', logContext, { errors: error.errors });
      return errorResponse('VALIDATION_ERROR', messages, 400);
    }

    // 3. Prisma 数据库错误
    if (isPrismaError(error)) {
      console.error('[PrismaError]', logContext, {
        code: error.code,
        message: error.message,
      });

      // P2002: 唯一约束冲突
      if (error.code === 'P2002') {
        return errorResponse('VALIDATION_ERROR', 'البيانات موجودة بالفعل', 400);
      }

      // P2025: 记录不存在
      if (error.code === 'P2025') {
        return errorResponse('NOT_FOUND', 'السجل غير موجود', 404);
      }

      // 其他数据库错误
      return errorResponse('INTERNAL_ERROR', 'Error de base de datos', 500);
    }

    // 4. 其他未知错误
    console.error('[UnknownError]', logContext, error);

    // 生产环境不暴露错误详情
    const message =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'Error del servidor';

    return errorResponse('INTERNAL_ERROR', message, 500);
  }
}
