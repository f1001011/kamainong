/**
 * @file 文案导出 API
 * @description GET /api/admin/texts/export - 导出文案
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.6节
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { exportTexts } from '@/services/system-settings.service';

// ================================
// GET /api/admin/texts/export - 导出文案
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // 获取分类筛选（可选）
      const categoriesParam = searchParams.get('categories');
      const categories = categoriesParam
        ? categoriesParam.split(',').filter(Boolean)
        : undefined;
      
      // 获取导出格式（默认 JSON）
      const format = searchParams.get('format') || 'json';
      
      const texts = await exportTexts(categories);
      
      if (format === 'json') {
        // 返回 JSON 格式
        const jsonContent = JSON.stringify(texts, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        return new NextResponse(jsonContent, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="texts-${timestamp}.json"`,
          },
        });
      } else if (format === 'csv') {
        // 返回 CSV 格式
        const csvLines = ['key,value,description'];
        for (const [key, data] of Object.entries(texts)) {
          // 转义 CSV 特殊字符
          const escapeCsv = (str: string | null) => {
            if (!str) return '';
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          };
          csvLines.push(`${escapeCsv(key)},${escapeCsv(data.value)},${escapeCsv(data.description)}`);
        }
        
        const csvContent = csvLines.join('\n');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="texts-${timestamp}.csv"`,
          },
        });
      } else {
        return errorResponse('VALIDATION_ERROR', '不支持的导出格式，请使用 json 或 csv', 400);
      }
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/texts/export] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
