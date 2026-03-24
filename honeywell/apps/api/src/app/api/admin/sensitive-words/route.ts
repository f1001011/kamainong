/**
 * @file 敏感词列表与添加API
 * @description 获取敏感词列表、添加新敏感词
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.3节
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.6-敏感词管理页.md
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/response';
import { getSensitiveWordList, addSensitiveWord } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// ================================
// GET /api/admin/sensitive-words - 敏感词列表
// ================================

/**
 * 获取敏感词列表
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 * 支持按关键词、分类、状态、严重程度筛选
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(req.url);
      
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
      const keyword = searchParams.get('keyword') || undefined;
      const category = searchParams.get('category') || undefined;
      const isActiveParam = searchParams.get('isActive');
      const isActive = isActiveParam === 'true' ? true : isActiveParam === 'false' ? false : undefined;
      const severityParam = searchParams.get('severity');
      const severity = severityParam ? parseInt(severityParam, 10) : undefined;
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;
      const sortField = searchParams.get('sortField') || undefined;
      const sortOrder = searchParams.get('sortOrder') as 'ascend' | 'descend' | undefined;
      
      // 调用服务
      const result = await getSensitiveWordList({
        page,
        pageSize,
        keyword,
        category,
        isActive,
        severity,
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
          targetType: 'sensitive_word',
          remark: `查询敏感词列表 page=${page} pageSize=${pageSize}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/sensitive-words] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// POST /api/admin/sensitive-words - 添加敏感词
// ================================

// 添加敏感词请求体验证Schema
const addSensitiveWordSchema = z.object({
  word: z.string()
    .min(1, '敏感词不能为空')
    .max(50, '敏感词最多50个字符'),
  category: z.string().max(30, '分类最多30个字符').optional().nullable(),
  severity: z.number().int().min(1).max(5).optional().default(1),
});

/**
 * 添加敏感词
 * @description 依据：02.4-后台API接口清单.md 第14.3节
 * 支持设置敏感词分类和严重程度
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = addSensitiveWordSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { word, category, severity } = validationResult.data;
      
      // 调用服务
      const sensitiveWord = await addSensitiveWord({
        word,
        category: category || undefined,
        severity,
        createdBy: adminId,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'create',
          targetType: 'sensitive_word',
          targetId: String(sensitiveWord.id),
          afterData: { word, category, severity },
          remark: `添加敏感词 ${word}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      return successResponse(sensitiveWord, '添加成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/sensitive-words] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
