/**
 * @file 黑名单列表与添加API
 * @description 获取黑名单列表、添加新黑名单
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.2节
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getBlacklistList, addBlacklist } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { BlacklistType } from '@honeywell/database';

// ================================
// GET /api/admin/blacklist - 黑名单列表
// ================================

/**
 * 获取黑名单列表
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 * 支持按类型（PHONE/IP/BANK_CARD）筛选
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(req.url);
      
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
      const typeParam = searchParams.get('type') || 'PHONE';
      const keyword = searchParams.get('keyword') || undefined;
      const createdByParam = searchParams.get('createdBy');
      const createdBy = createdByParam ? parseInt(createdByParam, 10) : undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const sortField = searchParams.get('sortField') || undefined;
      const sortOrder = searchParams.get('sortOrder') as 'ascend' | 'descend' | undefined;
      
      // 验证类型
      if (!['PHONE', 'IP', 'BANK_CARD'].includes(typeParam)) {
        return errorResponse('VALIDATION_ERROR', '无效的黑名单类型', 400);
      }
      
      const type = typeParam as BlacklistType;
      
      // 调用服务
      const result = await getBlacklistList({
        page,
        pageSize,
        type,
        keyword,
        createdBy,
        startDate,
        endDate,
        sortField,
        sortOrder,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'list',
          targetType: 'blacklist',
          remark: `查询黑名单列表 type=${type} page=${page}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/blacklist] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/blacklist - 添加黑名单
// ================================

// 添加黑名单请求体验证Schema
const addBlacklistSchema = z.object({
  type: z.enum(['PHONE', 'IP', 'BANK_CARD'], { required_error: '类型是必填字段' }),
  value: z.string()
    .min(1, '值不能为空')
    .max(50, '值最多50个字符'),
  reason: z.string().max(200, '原因最多200个字符').optional().nullable(),
});

/**
 * 添加黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 * 支持添加手机号、IP地址、银行卡号到黑名单
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = addBlacklistSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { type, value, reason } = validationResult.data;
      
      // 根据类型进行额外验证
      if (type === 'PHONE') {
        // 手机号验证（摩洛哥手机号格式：9位数字）
        if (!/^\d{9}$/.test(value)) {
          return errorResponse('VALIDATION_ERROR', '无效的手机号格式', 400);
        }
      } else if (type === 'IP') {
        // IP地址验证（支持通配符，如192.168.*.*）
        const ipPattern = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
        if (!ipPattern.test(value)) {
          return errorResponse('VALIDATION_ERROR', '无效的IP地址格式', 400);
        }
      } else if (type === 'BANK_CARD') {
        // 银行卡号验证（16-19位数字）
        if (!/^\d{16,19}$/.test(value)) {
          return errorResponse('VALIDATION_ERROR', '无效的银行卡号格式', 400);
        }
      }
      
      // 调用服务
      const blacklist = await addBlacklist({
        type,
        value,
        reason: reason || undefined,
        createdBy: adminId,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'create',
          targetType: 'blacklist',
          targetId: String(blacklist.id),
          afterData: { type, value, reason },
          remark: `添加黑名单 ${type}: ${value}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(blacklist, '添加成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/blacklist] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
