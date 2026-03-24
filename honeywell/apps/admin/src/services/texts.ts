/**
 * @file 文案管理 API 服务
 * @description 文案配置获取、更新、导入导出、版本管理相关 API 请求封装
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.2-文案管理页.md
 */

import { get, put, post, download } from '@/utils/request';
import type { PaginatedResponse } from '@/utils/request';
import type {
  TextConfigItem,
  TextVersionRecord,
  TextListParams,
  TextVersionParams,
  ImportTextsParams,
  ImportResult,
  ExportTextsParams,
} from '@/types/texts';

// ================================
// 文案列表
// ================================

/**
 * 获取文案列表
 * @description 依据：04.9.2-文案管理页.md 第六节
 * @endpoint GET /api/admin/texts
 */
export async function fetchTexts(
  params: TextListParams
): Promise<PaginatedResponse<TextConfigItem>> {
  return get<PaginatedResponse<TextConfigItem>>('/texts', params as Record<string, unknown>);
}

/**
 * 更新单条文案
 * @description 依据：04.9.2-文案管理页.md 第七节
 * @endpoint PUT /api/admin/texts/:key
 */
export async function updateText(
  key: string,
  data: { value: string }
): Promise<{ key: string; value: string; version: number }> {
  return put<{ key: string; value: string; version: number }>(
    `/texts/${encodeURIComponent(key)}`,
    data
  );
}

/**
 * 批量更新文案
 * @description 依据：04.9.2-文案管理页.md 第八节
 * @endpoint PUT /api/admin/texts
 */
export async function batchUpdateTexts(data: {
  texts: Record<string, string>;
}): Promise<{ updated: number; version: number }> {
  return put<{ updated: number; version: number }>('/texts', data);
}

// ================================
// 导入导出
// ================================

/**
 * 导出文案
 * @description 依据：04.9.2-文案管理页.md 第九节
 * @endpoint GET /api/admin/texts/export
 */
export async function exportTexts(params: ExportTextsParams): Promise<void> {
  const queryParams: Record<string, string> = {
    format: params.format,
  };
  
  if (params.categories && params.categories.length > 0) {
    queryParams.categories = params.categories.join(',');
  }
  
  const filename = `texts_${Date.now()}.${params.format}`;
  await download('/texts/export', queryParams, filename);
}

/**
 * 导出文案为 JSON（用于获取数据而非下载文件）
 * @endpoint GET /api/admin/texts/export
 */
export async function exportTextsAsJson(
  categories?: string[]
): Promise<Record<string, { value: string; description?: string }>> {
  const params: Record<string, string> = { format: 'json' };
  if (categories && categories.length > 0) {
    params.categories = categories.join(',');
  }
  return get<Record<string, { value: string; description?: string }>>(
    '/texts/export',
    params
  );
}

/**
 * 导入文案
 * @description 依据：04.9.2-文案管理页.md 第八节
 * @endpoint POST /api/admin/texts/import
 */
export async function importTexts(data: ImportTextsParams): Promise<ImportResult> {
  return post<ImportResult>('/texts/import', data);
}

/**
 * 检查文案是否存在（用于导入预览）
 * @endpoint GET /api/admin/texts
 */
export async function checkTextsExist(
  keys: string[]
): Promise<Record<string, boolean>> {
  // 通过获取所有文案来判断哪些 key 已存在
  const result = await fetchTexts({ pageSize: 9999 });
  const existingKeys = new Set(result.list.map((item) => item.key));
  
  const existsMap: Record<string, boolean> = {};
  keys.forEach((key) => {
    existsMap[key] = existingKeys.has(key);
  });
  
  return existsMap;
}

// ================================
// 版本历史
// ================================

/**
 * 获取文案版本历史
 * @description 依据：04.9.2-文案管理页.md 第十节
 * @endpoint GET /api/admin/texts/versions
 */
export async function getTextVersions(
  params: TextVersionParams
): Promise<PaginatedResponse<TextVersionRecord>> {
  return get<PaginatedResponse<TextVersionRecord>>('/texts/versions', params as Record<string, unknown>);
}

/**
 * 回滚文案版本
 * @description 依据：04.9.2-文案管理页.md 第十节
 * @endpoint POST /api/admin/texts/versions/:version/rollback
 */
export async function rollbackTextVersion(
  version: number
): Promise<{ textKey: string; restoredValue: string; newVersion: number }> {
  return post<{ textKey: string; restoredValue: string; newVersion: number }>(
    `/texts/versions/${version}/rollback`
  );
}

// ================================
// 工具函数
// ================================

/**
 * 解析导入的 JSON 文件
 * @param file JSON 文件
 * @returns 解析后的键值对
 */
export async function parseJsonFile(
  file: File
): Promise<Record<string, string>> {
  const text = await file.text();
  const data = JSON.parse(text);
  
  // 支持两种格式：
  // 1. { "key": "value" }
  // 2. { "key": { "value": "...", "description": "..." } }
  const result: Record<string, string> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      result[key] = value;
    } else if (typeof value === 'object' && value !== null && 'value' in value) {
      result[key] = (value as { value: string }).value;
    }
  });
  
  return result;
}

/**
 * 解析导入的 CSV 文件
 * @param file CSV 文件
 * @returns 解析后的键值对
 */
export async function parseCsvFile(
  file: File
): Promise<Record<string, string>> {
  const text = await file.text();
  const lines = text.split('\n').filter((line) => line.trim());
  
  const result: Record<string, string> = {};
  
  lines.forEach((line, index) => {
    // 跳过表头（如果第一行是 key,value）
    if (index === 0 && line.toLowerCase().includes('key')) {
      return;
    }
    
    // 解析 CSV 行（简单实现，假设值中没有逗号）
    const [key, ...valueParts] = line.split(',').map((s) => 
      s.trim().replace(/^"|"$/g, '')
    );
    
    if (key && valueParts.length > 0) {
      result[key] = valueParts.join(',');
    }
  });
  
  return result;
}
