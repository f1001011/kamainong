/**
 * @file 礼品码管理接口（列表+创建）
 * @description GET /api/admin/gift-codes - 礼品码列表
 *              POST /api/admin/gift-codes - 创建礼品码
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { getGiftCodeList, createGiftCode } from '@/services/gift-code.service';

const createSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  amountType: z.enum(['FIXED', 'RANDOM'], { errorMap: () => ({ message: '无效的金额类型' }) }),
  requirement: z.enum(['NONE', 'MUST_PURCHASE']).optional().default('NONE'),
  fixedAmount: z.number().min(1).optional(),
  totalAmount: z.number().min(1).optional(),
  minAmount: z.number().min(1).optional(),
  maxAmount: z.number().min(1).optional(),
  totalCount: z.number().int().min(1, '份数至少为1'),
  startAt: z.string().nullable().optional(),
  expireAt: z.string().nullable().optional(),
  remark: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const params = {
        status: searchParams.get('status') || undefined,
        amountType: searchParams.get('amountType') || undefined,
        keyword: searchParams.get('keyword') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
      };

      const result = await getGiftCodeList(params);
      return successResponse(result);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/gift-codes] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      const body = await req.json();
      const parseResult = createSchema.safeParse(body);
      if (!parseResult.success) {
        return errorResponse('VALIDATION_ERROR', parseResult.error.errors[0]?.message || '参数校验失败', 400);
      }

      const result = await createGiftCode(adminId, parseResult.data);
      return successResponse(result, '礼品码创建成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/gift-codes] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
