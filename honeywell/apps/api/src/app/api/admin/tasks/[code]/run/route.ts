/**
 * @file 手动执行定时任务接口
 * @description POST /api/admin/tasks/:code/run - 手动触发任务执行
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17节 - 定时任务接口
 * 
 * 核心要求：
 * 1. 手动执行需要分布式锁，防止并发执行
 * 2. 执行日志含 duration 和 processedCount
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { taskService } from '@/services/task.service';
import { BusinessError } from '@/lib/errors';

/**
 * POST /api/admin/tasks/:code/run
 * 手动执行定时任务
 * @param code 任务标识
 * @returns 执行结果（含状态、耗时、处理数量）
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

      const result = await taskService.runTask(taskCode);

      // 根据执行状态返回不同消息
      const message =
        result.status === 'SUCCESS'
          ? `任务执行成功，处理 ${result.processedCount || 0} 条记录，耗时 ${result.duration}ms`
          : `任务执行失败：${result.errorMessage}`;

      return successResponse(result, message);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[AdminTasks] 手动执行任务失败:', error);
      return errorResponse('INTERNAL_ERROR', '执行任务失败', 500);
    }
  });
}
