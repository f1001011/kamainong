/**
 * @file 站内信服务
 * @description 站内信管理相关的 API 调用
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第21节 站内信管理接口
 */

import { get, post, del } from '@/utils/request';
import type { PaginatedResponse, BatchOperationResponse } from '@/utils/request';
import type {
  Notification,
  NotificationListParams,
  SendNotificationParams,
  SendNotificationResponse,
} from '@/types/notifications';

/**
 * 获取站内信列表
 * @description GET /api/admin/notifications
 */
export async function fetchNotificationList(
  params: NotificationListParams = {}
): Promise<PaginatedResponse<Notification>> {
  return get<PaginatedResponse<Notification>>('/notifications', params as Record<string, unknown>);
}

/**
 * 获取站内信详情
 * @description GET /api/admin/notifications/:id
 */
export async function fetchNotificationDetail(id: number): Promise<Notification> {
  return get<Notification>(`/notifications/${id}`);
}

/**
 * 发送系统通知
 * @description POST /api/admin/notifications/send
 */
export async function sendNotification(
  data: SendNotificationParams
): Promise<SendNotificationResponse> {
  return post<SendNotificationResponse>('/notifications/send', data);
}

/**
 * 删除站内信
 * @description DELETE /api/admin/notifications/:id
 */
export async function deleteNotification(id: number): Promise<void> {
  return del(`/notifications/${id}`);
}

/**
 * 后端批量删除响应格式
 */
interface BackendBatchDeleteResponse {
  deletedCount: number;
}

/**
 * 批量删除站内信
 * @description POST /api/admin/notifications/batch-delete
 * 将后端响应格式转换为前端 BatchOperationResponse 格式
 */
export async function batchDeleteNotifications(
  ids: number[]
): Promise<BatchOperationResponse> {
  const response = await post<BackendBatchDeleteResponse>('/notifications/batch-delete', { ids });
  
  // 转换为前端期望的格式
  const succeeded = response.deletedCount;
  const failed = ids.length - succeeded;
  
  return {
    total: ids.length,
    succeeded,
    failed,
    results: ids.map((id, index) => ({
      id,
      success: index < succeeded,
      error: index >= succeeded ? { code: 'DELETE_FAILED', message: '删除失败' } : undefined,
    })),
  };
}

/**
 * 搜索用户（用于发送通知时选择用户）
 * @description GET /api/admin/users?keyword=xxx
 */
export async function searchUsers(keyword: string): Promise<Array<{
  id: number;
  phone: string;
  nickname: string | null;
}>> {
  const result = await get<PaginatedResponse<{
    id: number;
    phone: string;
    nickname: string | null;
  }>>('/users', { keyword, pageSize: 20 });
  return result.list;
}
