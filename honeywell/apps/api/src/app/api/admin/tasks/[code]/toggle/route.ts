/**
 * @file 启用/禁用定时任务接口
 * @description POST /api/admin/tasks/:code/toggle - 切换任务启用状态
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17节 - 定时任务接口
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { taskService } from '@/services/task.service';
import { BusinessError } from '@/lib/errors';

/**
 * POST /api/admin/tasks/:code/toggle
 * 启用/禁用定时任务
 * @param code 任务标识
 * @returns 更新后的任务启用状态
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { code: taskCode } = await params;

      if (!taskCode) {
        return errorResponse('VALIDATION_ERROR', '任务标识不能为空', 400);
      }

      const result = await taskService.toggleTask(taskCode);

      return successResponse(
        result,
        result.isEnabled ? '任务已启用' : '任务已禁用'
      );
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[AdminTasks] 切换任务状态失败:', error);
      return errorResponse('INTERNAL_ERROR', '操作失败', 500);
    }
  });
}
