/**
 * @file 文案管理类型定义
 * @description 文案配置相关的 TypeScript 类型定义
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.2-文案管理页.md
 */

// ================================
// 文案分类
// ================================

/**
 * 文案分类类型
 */
export type TextCategory =
  | 'nav'
  | 'btn'
  | 'label'
  | 'status'
  | 'toast'
  | 'dialog'
  | 'page'
  | 'biz'
  | 'tip'
  | 'error'
  | 'empty'
  | 'notify'
  | 'product'
  | 'signin'
  | 'activity';

/**
 * 分类 Tab 配置项
 */
export interface CategoryTab {
  key: string;
  label: string;
}

/**
 * 分类 Tab 配置列表
 */
export const CATEGORY_TABS: CategoryTab[] = [
  { key: 'all', label: '全部' },
  { key: 'nav', label: '导航' },
  { key: 'btn', label: '按钮' },
  { key: 'label', label: '表单标签' },
  { key: 'status', label: '状态' },
  { key: 'toast', label: 'Toast' },
  { key: 'dialog', label: '弹窗' },
  { key: 'page', label: '页面标题' },
  { key: 'biz', label: '业务' },
  { key: 'tip', label: '提示' },
  { key: 'error', label: '错误' },
  { key: 'empty', label: '空状态' },
  { key: 'notify', label: '通知' },
  { key: 'product', label: '产品' },
  { key: 'signin', label: '签到' },
  { key: 'activity', label: '活动' },
];

/**
 * 分类颜色映射
 */
export const CATEGORY_COLORS: Record<string, string> = {
  nav: 'blue',
  btn: 'green',
  label: 'default',
  status: 'orange',
  toast: 'red',
  dialog: 'purple',
  page: 'cyan',
  biz: 'geekblue',
  tip: 'gold',
  error: 'volcano',
  empty: 'default',
  notify: 'magenta',
  product: 'lime',
  signin: 'orange',
  activity: 'purple',
};

/**
 * 分类名称映射
 */
export const CATEGORY_NAMES: Record<string, string> = {
  nav: '导航',
  btn: '按钮',
  label: '表单标签',
  status: '状态',
  toast: 'Toast',
  dialog: '弹窗',
  page: '页面标题',
  biz: '业务',
  tip: '提示',
  error: '错误',
  empty: '空状态',
  notify: '通知',
  product: '产品',
  signin: '签到',
  activity: '活动',
};

// ================================
// 文案配置项
// ================================

/**
 * 文案配置项
 */
export interface TextConfigItem {
  /** 唯一 ID */
  id: number;
  /** 文案 Key，如 "btn.confirm" */
  key: string;
  /** 文案内容 */
  value: string;
  /** 分类 */
  category: string;
  /** 描述/使用位置 */
  description: string | null;
  /** 支持的变量列表，如 ["amount", "currency"] */
  variables: string[] | null;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

// ================================
// 版本记录
// ================================

/**
 * 文案版本记录
 */
export interface TextVersionRecord {
  /** 记录 ID */
  id: number;
  /** 版本号 */
  version: number;
  /** 文案 Key */
  textKey: string;
  /** 修改前的值 */
  oldValue: string | null;
  /** 修改后的值 */
  newValue: string;
  /** 操作人 ID */
  operatorId: number;
  /** 操作人名称 */
  operatorName: string;
  /** 创建时间 */
  createdAt: string;
}

// ================================
// 导入导出
// ================================

/**
 * 导入结果
 */
export interface ImportResult {
  /** 总数 */
  total: number;
  /** 更新数量 */
  updated: number;
  /** 跳过数量 */
  skipped: number;
}

/**
 * 导入预览项
 */
export interface ImportPreviewItem {
  /** 文案 Key */
  key: string;
  /** 文案值 */
  value: string;
  /** 是否已存在 */
  exists: boolean;
}

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'xlsx';

/**
 * 冲突处理策略
 */
export type ConflictStrategy = 'OVERWRITE' | 'SKIP';

// ================================
// API 请求参数
// ================================

/**
 * 文案列表查询参数
 */
export interface TextListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 关键词搜索（匹配 key 和 value） */
  keyword?: string;
  /** 分类筛选 */
  category?: string;
  /** 内容搜索 */
  content?: string;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 版本历史查询参数
 */
export interface TextVersionParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 按文案 Key 筛选 */
  textKey?: string;
  /** 按操作人 ID 筛选 */
  operatorId?: number;
  /** 开始日期 */
  startDate?: string;
  /** 结束日期 */
  endDate?: string;
}

/**
 * 导入请求参数
 */
export interface ImportTextsParams {
  /** 文案键值对 */
  texts: Record<string, string>;
  /** 冲突处理策略 */
  conflictStrategy: ConflictStrategy;
}

/**
 * 导出请求参数
 */
export interface ExportTextsParams {
  /** 导出格式 */
  format: ExportFormat;
  /** 分类筛选（不传则导出全部） */
  categories?: string[];
}

// ================================
// 变量预览
// ================================

/**
 * 变量示例值映射
 * @description 用于预览时替换变量
 */
export const VARIABLE_SAMPLE_VALUES: Record<string, string> = {
  amount: '100',
  currency: 'MAD',
  currency_symbol: 'MAD',
  phone: '612345678',
  level: '3',
  product_name: 'VIC1',
  day: '2',
  remaining: '5',
  start: '10:00',
  end: '17:00',
  count: '10',
  total: '3',
  username: 'Usuario',
  time: '2026-02-06 10:30',
  date: '2026-02-06',
  min: '10',
  max: '1000',
  fee: '5%',
  balance: '500.00',
};

/**
 * 生成预览文本（使用示例值替换变量）
 * @param text 原始文案内容
 * @param variables 变量列表
 * @returns 替换变量后的预览文本
 */
export function generatePreviewText(text: string, variables?: string[] | null): string {
  if (!text || !variables || variables.length === 0) {
    return text;
  }

  let result = text;
  variables.forEach((v) => {
    const value = VARIABLE_SAMPLE_VALUES[v] || `[${v}]`;
    result = result.replace(new RegExp(`\\{${v}\\}`, 'g'), value);
  });
  return result;
}

/**
 * 高亮文案中的变量
 * @param text 文案内容
 * @returns 带有高亮标记的文案片段
 */
export function parseTextWithVariables(text: string): Array<{ type: 'text' | 'variable'; content: string }> {
  const parts: Array<{ type: 'text' | 'variable'; content: string }> = [];
  const regex = /\{([^}]+)\}/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加变量前的普通文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    // 添加变量
    parts.push({
      type: 'variable',
      content: match[0],
    });
    lastIndex = regex.lastIndex;
  }

  // 添加最后的普通文本
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return parts;
}
