/**
 * @file 黑名单统计数量API
 * @description 获取各类型黑名单的数量统计
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

// ================================
// GET /api/admin/blacklist/counts - 获取黑名单数量统计
// ================================

/**
 * 获取各类型黑名单数量
 * @description 用于Tab标签显示各类型黑名单的数量
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // 并行查询各类型数量
      const [phoneCount, ipCount, bankCardCount] = await Promise.all([
        prisma.blacklist.count({ where: { type: 'PHONE' } }),
        prisma.blacklist.count({ where: { type: 'IP' } }),
        prisma.blacklist.count({ where: { type: 'BANK_CARD' } }),
      ]);

      return successResponse({
        phone: phoneCount,
        ip: ipCount,
        bank_card: bankCardCount,
      });
    } catch (error) {
      console.error('[GET /api/admin/blacklist/counts] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
