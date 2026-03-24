/**
 * @file 内容管理服务
 * @description 客服链接、Banner、公告、海报配置等内容管理 API
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11节
 */

import { get, put } from '@/utils/request';
import type {
  ServiceLinksResponse,
  UpdateServiceLinksRequest,
} from '@/types/service-link';
import type {
  PosterConfig,
  UpdatePosterConfigRequest,
} from '@/types/poster';

// ========================
// 客服链接管理
// ========================

/**
 * 获取客服链接列表
 * @description GET /api/admin/service-links
 */
export async function getServiceLinks(): Promise<ServiceLinksResponse> {
  return get<ServiceLinksResponse>('/service-links');
}

/**
 * 更新客服链接列表（整体替换）
 * @description PUT /api/admin/service-links
 */
export async function updateServiceLinks(
  data: UpdateServiceLinksRequest
): Promise<void> {
  await put('/service-links', data);
}

// ========================
// 文件上传
// ========================

/**
 * 上传图标文件响应
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * 上传文件（通用）
 * @description POST /api/admin/upload（使用管理员认证接口）
 * @param file 图片文件
 * @param type 上传类型，默认为 'service'
 */
export async function uploadFile(
  file: File,
  type: string = 'service'
): Promise<UploadResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

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

// ========================
// 邀请海报配置管理
// ========================

/**
 * 获取邀请海报配置
 * @description GET /api/admin/poster-config
 * @depends 02.4-后台API接口清单.md 第11.4节 - 邀请海报配置接口
 */
export async function getPosterConfig(): Promise<PosterConfig> {
  return get<PosterConfig>('/poster-config');
}

/**
 * 更新邀请海报配置
 * @description PUT /api/admin/poster-config
 * @depends 02.4-后台API接口清单.md 第11.4节 - 邀请海报配置接口
 */
export async function updatePosterConfig(
  data: UpdatePosterConfigRequest
): Promise<PosterConfig> {
  return put<PosterConfig>('/poster-config', data);
}

/**
 * 上传海报背景图
 * @description POST /api/upload（type='poster'）
 * @param file 图片文件
 */
export async function uploadPosterBackground(file: File): Promise<UploadResponse> {
  return uploadFile(file, 'poster');
}
