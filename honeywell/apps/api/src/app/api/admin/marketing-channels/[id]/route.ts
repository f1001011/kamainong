/**
 * @file 渠道详情、更新、删除API
 * @description GET 渠道详情（含下线用户）、PUT 更新渠道、DELETE 删除渠道
 * @depends 渠道链接.md 第4.3.3、4.3.4、4.3.5节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getChannelDetail, updateChannel, deleteChannel } from '@/services/marketing-channel.service';
import { BusinessError } from '@/lib/errors';

// ================================
// GET /api/admin/marketing-channels/:id - 渠道详情
// ================================

/**
 * 获取渠道详情（含下线用户列表）
 * @description 依据：渠道链接.md 第4.3.3节
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      // 解析路由参数
      const { id: idStr } = await params;
      const id = parseInt(idStr, 10);

      if (isNaN(id) || id <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的渠道ID', 400);
      }

      // 解析查询参数
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

      // 调用服务
      const result = await getChannelDetail(id, page, pageSize);

      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/marketing-channels/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/marketing-channels/:id - 更新渠道
// ================================

/** 更新渠道请求体校验 */
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  remark: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});
// 注意：不包含 userId 字段，防止改绑

/**
 * 更新渠道
 * @description 依据：渠道链接.md 第4.3.4节
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析路由参数
      const { id: idStr } = await params;
      const id = parseInt(idStr, 10);

      if (isNaN(id) || id <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的渠道ID', 400);
      }

      // 解析请求体
      const body = await req.json();

      // 验证参数
      const validationResult = updateSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

      // 调用服务
      const channel = await updateChannel(id, validationResult.data, adminId, ip);

      return successResponse(channel, '渠道更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/marketing-channels/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// DELETE /api/admin/marketing-channels/:id - 删除渠道
// ================================

/**
 * 删除渠道
 * @description 依据：渠道链接.md 第4.3.5节
 * 仅删渠道记录，不影响用户和下级
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析路由参数
      const { id: idStr } = await params;
      const id = parseInt(idStr, 10);

      if (isNaN(id) || id <= 0) {
        return errorResponse('VALIDATION_ERROR', '无效的渠道ID', 400);
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

      // 调用服务
      await deleteChannel(id, adminId, ip);

      return successResponse(null, '渠道已删除');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[DELETE /api/admin/marketing-channels/:id] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
