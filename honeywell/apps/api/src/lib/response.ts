import { NextResponse } from 'next/server';

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message?: string): Response {
  return NextResponse.json({
    success: true,
    data,
    message: message || 'تمت العملية بنجاح',
  });
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  list: T[],
  pagination: { page: number; pageSize: number; total: number },
  extra?: Record<string, unknown>
): Response {
  return NextResponse.json({
    success: true,
    data: {
      list,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.pageSize),
      },
      ...extra,
    },
  });
}

/**
 * 错误响应
 */
export function errorResponse(
  code: string,
  message: string,
  httpStatus: number = 400,
  extra?: Record<string, unknown>
): Response {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...extra,
      },
    },
    { status: httpStatus }
  );
}
