/**
 * @file 黑名单批量导入API
 * @description 批量导入黑名单记录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.2节
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { batchImportBlacklist } from '@/services/security.service';
import { BusinessError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { BlacklistType } from '@honeywell/database';

// ================================
// POST /api/admin/blacklist/batch-import - 批量导入黑名单
// ================================

// 批量导入请求体验证Schema
const batchImportSchema = z.object({
  type: z.enum(['PHONE', 'IP', 'BANK_CARD'], { required_error: '类型是必填字段' }),
  values: z.array(z.string().min(1, '值不能为空'))
    .min(1, '至少导入一条记录')
    .max(1000, '单次最多导入1000条记录'),
  reason: z.string().max(200, '原因最多200个字符').optional().nullable(),
});

/**
 * 批量导入黑名单
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 * 支持批量导入手机号、IP地址、银行卡号到黑名单
 * 已存在的记录会跳过
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (req, adminId) => {
    try {
      // 解析请求体
      const body = await req.json();
      
      // 验证参数
      const validationResult = batchImportSchema.safeParse(body);
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        return errorResponse('VALIDATION_ERROR', firstError.message, 400);
      }
      
      const { type, values, reason } = validationResult.data;
      
      // 根据类型进行格式验证并过滤无效数据
      const validValues: string[] = [];
      const invalidValues: string[] = [];
      
      for (const value of values) {
        let isValid = false;
        
        if (type === 'PHONE') {
          // 手机号验证（摩洛哥手机号格式：9位数字）
          isValid = /^\d{9}$/.test(value);
        } else if (type === 'IP') {
          // IP地址验证（支持通配符，如192.168.*.*）
          const ipPattern = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
          isValid = ipPattern.test(value);
        } else if (type === 'BANK_CARD') {
          // 银行卡号验证（16-19位数字）
          isValid = /^\d{16,19}$/.test(value);
        }
        
        if (isValid) {
          validValues.push(value);
        } else {
          invalidValues.push(value);
        }
      }
      
      // 如果没有有效数据
      if (validValues.length === 0) {
        return errorResponse('VALIDATION_ERROR', '没有有效的数据可导入', 400);
      }
      
      // 调用服务
      const result = await batchImportBlacklist({
        type,
        values: validValues,
        reason: reason || undefined,
        createdBy: adminId,
      });
      
      // 记录操作日志
      await prisma.adminOperationLog.create({
        data: {
          adminId,
          module: 'security',
          action: 'batch_import',
          targetType: 'blacklist',
          afterData: { type, totalInput: values.length, succeeded: result.succeeded, failed: result.failed },
          remark: `批量导入黑名单 type=${type} 成功=${result.succeeded} 失败=${result.failed}`,
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        },
      });
      
      // 组装响应
      const responseData = {
        ...result,
        invalidValues: invalidValues.length > 0 ? invalidValues.slice(0, 10) : undefined, // 只返回前10条无效数据
        invalidCount: invalidValues.length,
      };
      
      const message = invalidValues.length > 0
        ? `成功导入${result.succeeded}条，失败${result.failed}条，格式无效${invalidValues.length}条`
        : `成功导入${result.succeeded}条，失败${result.failed}条`;
      
      return successResponse(responseData, message);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[POST /api/admin/blacklist/batch-import] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
