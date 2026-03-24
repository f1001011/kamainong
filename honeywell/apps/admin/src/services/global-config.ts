/**
 * @file 全局配置 API 服务
 * @description 全局配置获取和更新相关 API 请求封装
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.1-全局配置页.md
 */

import { get, put } from '@/utils/request';
import type { GlobalConfigData, UpdateConfigResponse } from '@/types/global-config';

/**
 * 获取全局配置
 * @description 依据：04.9.1-全局配置页.md API对接章节
 * @endpoint GET /api/admin/config
 */
export async function fetchGlobalConfig(): Promise<GlobalConfigData> {
  return get<GlobalConfigData>('/config');
}

/**
 * 更新全局配置
 * @description 只需传入要修改的字段，服务端合并更新
 * @endpoint PUT /api/admin/config
 */
export async function updateGlobalConfig(
  data: Partial<GlobalConfigData>
): Promise<UpdateConfigResponse> {
  return put<UpdateConfigResponse>('/config', data);
}

/**
 * 检查配置版本
 * @description 用于前端轮询检测配置是否有更新
 * @endpoint GET /api/admin/config/version
 */
export async function checkConfigVersion(): Promise<{
  globalConfigVersion: number;
  globalConfigUpdatedAt: string;
}> {
  return get<{
    globalConfigVersion: number;
    globalConfigUpdatedAt: string;
  }>('/config/versions');
}
