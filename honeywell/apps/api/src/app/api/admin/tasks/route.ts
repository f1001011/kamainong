/**
 * @file 定时任务列表接口
 * @description GET /api/admin/tasks - 获取定时任务列表（含最后执行状态）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17.1节 - 任务列表
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { taskService } from '@/services/task.service';

/**
 * GET /api/admin/tasks
 * 获取定时任务列表
 * @returns 任务列表（含最后执行状态、下次执行时间）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const result = await taskService.getTaskList();
      return successResponse(result);
    } catch (error) {
      console.error('[AdminTasks] 获取任务列表失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取任务列表失败', 500);
    }
  });
}
