/**
 * GET /api/weekly-salary/status - 获取本周周薪状态
 */
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { withAuth } from '@/middleware/auth';
import { getWeeklySalaryStatus } from '@/services/weekly-salary.service';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, userId) => {
    try {
      const status = await getWeeklySalaryStatus(userId);
      return successResponse(status);
    } catch (error) {
      console.error('[WeeklySalary] 获取状态失败:', error);
      return errorResponse('INTERNAL_ERROR', 'Error al obtener estado', 500);
    }
  });
}
