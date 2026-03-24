/**
 * @file 定时任务告警配置接口
 * @description GET/PUT /api/admin/tasks/alert-config - 获取/更新告警配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17.3节 - 告警配置
 * 
 * 告警配置含连续失败阈值
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { taskService } from '@/services/task.service';
import { BusinessError } from '@/lib/errors';

/**
 * GET /api/admin/tasks/alert-config
 * 获取告警配置
 * @returns 告警配置（含连续失败阈值、超时阈值、告警方式）
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await taskService.getAlertConfig();
      return successResponse(config);
    } catch (error) {
      console.error('[AdminTasks] 获取告警配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '获取告警配置失败', 500);
    }
  });
}

/**
 * PUT /api/admin/tasks/alert-config
 * 更新告警配置
 * @body taskFailureAlertEnabled 任务失败告警开关（可选）
 * @body consecutiveFailureThreshold 连续失败N次后告警（可选）
 * @body executionTimeoutThreshold 执行超过N秒视为超时（可选）
 * @body alertMethod 告警方式数组（可选）
 * @returns 更新成功消息
 */
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const body = await request.json();

      // 参数校验
      if (
        body.taskFailureAlertEnabled !== undefined &&
        typeof body.taskFailureAlertEnabled !== 'boolean'
      ) {
        return errorResponse('VALIDATION_ERROR', 'taskFailureAlertEnabled 必须是布尔值', 400);
      }

      if (
        body.consecutiveFailureThreshold !== undefined &&
        (typeof body.consecutiveFailureThreshold !== 'number' ||
          body.consecutiveFailureThreshold < 1 ||
          body.consecutiveFailureThreshold > 100)
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'consecutiveFailureThreshold 必须是 1-100 之间的数字',
          400
        );
      }

      if (
        body.executionTimeoutThreshold !== undefined &&
        (typeof body.executionTimeoutThreshold !== 'number' ||
          body.executionTimeoutThreshold < 1 ||
          body.executionTimeoutThreshold > 3600)
      ) {
        return errorResponse(
          'VALIDATION_ERROR',
          'executionTimeoutThreshold 必须是 1-3600 之间的数字（秒）',
          400
        );
      }

      if (body.alertMethod !== undefined) {
        if (!Array.isArray(body.alertMethod)) {
          return errorResponse('VALIDATION_ERROR', 'alertMethod 必须是数组', 400);
        }
        const validMethods = ['admin_notification', 'email', 'webhook'];
        for (const method of body.alertMethod) {
          if (!validMethods.includes(method)) {
            return errorResponse(
              'VALIDATION_ERROR',
              `告警方式无效：${method}，支持的方式：${validMethods.join(', ')}`,
              400
            );
          }
        }
      }

      await taskService.updateAlertConfig({
        taskFailureAlertEnabled: body.taskFailureAlertEnabled,
        consecutiveFailureThreshold: body.consecutiveFailureThreshold,
        executionTimeoutThreshold: body.executionTimeoutThreshold,
        alertMethod: body.alertMethod,
      });

      return successResponse(null, '告警配置更新成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[AdminTasks] 更新告警配置失败:', error);
      return errorResponse('INTERNAL_ERROR', '更新告警配置失败', 500);
    }
  });
}
