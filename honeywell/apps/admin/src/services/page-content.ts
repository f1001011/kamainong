/**
 * @file 页面内容管理服务
 * @description 关于我们等页面内容的获取和更新 API
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.5节 - 页面内容配置接口
 */

import { get, put } from '@/utils/request';

// ========================
// 类型定义
// ========================

/**
 * 关于我们页面内容
 */
export interface AboutUsContent {
  /** HTML 内容 */
  content: string;
  /** 最后更新时间 */
  updatedAt?: string;
}

/**
 * 上传响应
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

// ========================
// 关于我们内容管理
// ========================

/**
 * 获取关于我们页面内容
 * @description GET /api/admin/page-content/about
 */
export async function getAboutUsContent(): Promise<AboutUsContent> {
  return get<AboutUsContent>('/page-content/about');
}

/**
 * 更新关于我们页面内容
 * @description PUT /api/admin/page-content/about
 * @param content HTML 内容
 */
export async function updateAboutUsContent(content: string): Promise<AboutUsContent> {
  return put<AboutUsContent>('/page-content/about', { content });
}

// ========================
// 富文本内容图片上传
// ========================

/**
 * 上传富文本内容图片
 * @description POST /api/admin/upload（使用管理员认证接口）
 * @param file 图片文件
 */
export async function uploadContentImage(file: File): Promise<UploadResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'content');

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
