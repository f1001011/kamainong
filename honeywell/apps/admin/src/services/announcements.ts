/**
 * @file 公告管理 API 服务
 * @description 公告列表、CRUD、批量操作等相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.2节 - 公告管理API
 */

import { get, post, put, del } from '@/utils/request';
import type {
  Announcement,
  AnnouncementFormData,
  AnnouncementQueryParams,
  AnnouncementListResponse,
  BatchOperationResponse,
} from '@/types/announcements';

/**
 * 获取公告列表
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint GET /api/admin/announcements
 */
export async function fetchAnnouncementList(
  params: AnnouncementQueryParams
): Promise<AnnouncementListResponse> {
  return get<AnnouncementListResponse>('/announcements', params as unknown as Record<string, unknown>);
}

/**
 * 获取公告详情
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint GET /api/admin/announcements/:id
 */
export async function fetchAnnouncementDetail(id: number): Promise<Announcement> {
  return get<Announcement>(`/announcements/${id}`);
}

/**
 * 创建公告
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint POST /api/admin/announcements
 */
export async function createAnnouncement(
  data: AnnouncementFormData
): Promise<Announcement> {
  return post<Announcement>('/announcements', data);
}

/**
 * 更新公告
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint PUT /api/admin/announcements/:id
 */
export async function updateAnnouncement(
  id: number,
  data: Partial<AnnouncementFormData>
): Promise<Announcement> {
  return put<Announcement>(`/announcements/${id}`, data);
}

/**
 * 删除公告
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint DELETE /api/admin/announcements/:id
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  return del<void>(`/announcements/${id}`);
}

/**
 * 更新公告状态
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint PUT /api/admin/announcements/:id
 */
export async function updateAnnouncementStatus(
  id: number,
  isActive: boolean
): Promise<Announcement> {
  return put<Announcement>(`/announcements/${id}`, { isActive });
}

/**
 * 获取公告预览数据
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint GET /api/admin/announcements/:id/preview
 */
export async function fetchAnnouncementPreview(id: number): Promise<Announcement> {
  return get<Announcement>(`/announcements/${id}/preview`);
}

/**
 * 批量更新公告状态
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint POST /api/admin/announcements/batch-status
 */
export async function batchUpdateStatus(
  ids: number[],
  isActive: boolean
): Promise<BatchOperationResponse> {
  return post<BatchOperationResponse>('/announcements/batch-status', { ids, isActive });
}

/**
 * 批量删除公告
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 * @endpoint POST /api/admin/announcements/batch-delete
 */
export async function batchDeleteAnnouncements(
  ids: number[]
): Promise<BatchOperationResponse> {
  return post<BatchOperationResponse>('/announcements/batch-delete', { ids });
}
