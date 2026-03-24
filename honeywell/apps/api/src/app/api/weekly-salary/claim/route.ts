/**
 * POST /api/weekly-salary/claim - 领取周薪
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { claimWeeklySalary } from '@/services/weekly-salary.service';

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      await claimWeeklySalary(userId);
      return successResponse(null, 'تمت المطالبة بالراتب الأسبوعي بنجاح');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        const bizError = error as { code: string; message: string; httpStatus: number };
        return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
      }
      console.error('[WeeklySalary] 领取失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al reclamar', 500);
    }
  });
}
