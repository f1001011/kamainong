/**
 * @file Banner 管理 API 服务
 * @description Banner列表、创建、编辑、删除、排序、批量操作相关 API 请求封装
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.1-Banner管理页.md
 */

import { get, put, post, del } from '@/utils/request';
import type {
  Banner,
  BannerListParams,
  BannerListResponse,
  BannerFormData,
  BannerSortRequest,
  BannerBatchStatusRequest,
  BannerBatchDeleteRequest,
  BannerBatchOperationResult,
} from '@/types/banners';

/**
 * 获取 Banner 列表
 * @description 依据：04.8.1-Banner管理页.md 第1.3节
 * @endpoint GET /api/admin/banners
 */
export async function fetchBannerList(
  params?: BannerListParams
): Promise<BannerListResponse> {
  return get<BannerListResponse>('/banners', params as Record<string, unknown>);
}

/**
 * 获取 Banner 详情
 * @description 依据：04.8.1-Banner管理页.md 第1.3节
 * @endpoint GET /api/admin/banners/:id
 */
export async function fetchBannerDetail(bannerId: number): Promise<Banner> {
  return get<Banner>(`/banners/${bannerId}`);
}

/**
 * 创建 Banner
 * @description 依据：04.8.1-Banner管理页.md 第7.2节
 * @endpoint POST /api/admin/banners
 */
export async function createBanner(data: BannerFormData): Promise<Banner> {
  return post<Banner>('/banners', data);
}

/**
 * 更新 Banner
 * @description 依据：04.8.1-Banner管理页.md 第7.2节
 * @endpoint PUT /api/admin/banners/:id
 */
export async function updateBanner(
  bannerId: number,
  data: Partial<BannerFormData>
): Promise<Banner> {
  return put<Banner>(`/banners/${bannerId}`, data);
}

/**
 * 删除 Banner
 * @description 依据：04.8.1-Banner管理页.md 第1.3节
 * @endpoint DELETE /api/admin/banners/:id
 */
export async function deleteBanner(bannerId: number): Promise<void> {
  return del<void>(`/banners/${bannerId}`);
}

/**
 * 更新 Banner 排序
 * @description 依据：04.8.1-Banner管理页.md 第5.2节
 * @endpoint PUT /api/admin/banners/sort
 */
export async function updateBannerSort(data: BannerSortRequest): Promise<void> {
  return put<void>('/banners/sort', data);
}

/**
 * 批量更新 Banner 状态
 * @description 依据：04.8.1-Banner管理页.md 第6.2节
 * @endpoint POST /api/admin/banners/batch-status
 */
export async function batchUpdateBannerStatus(
  data: BannerBatchStatusRequest
): Promise<BannerBatchOperationResult> {
  return post<BannerBatchOperationResult>('/banners/batch-status', data);
}

/**
 * 批量删除 Banner
 * @description 依据：04.8.1-Banner管理页.md 第6.2节
 * @endpoint POST /api/admin/banners/batch-delete
 */
export async function batchDeleteBanners(
  data: BannerBatchDeleteRequest
): Promise<BannerBatchOperationResult> {
  return post<BannerBatchOperationResult>('/banners/batch-delete', data);
}

/**
 * 上传 Banner 图片
 * @description 依据：04.8.1-Banner管理页.md 第11.1节
 * @endpoint POST /api/admin/upload（使用管理员认证接口）
 */
export async function uploadBannerImage(file: File): Promise<{ url: string; filename: string; size: number }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'banner');
  
  const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''}`,
    },
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || '上传失败');
  }
  return result.data;
}
