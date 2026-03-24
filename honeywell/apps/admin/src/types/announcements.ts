/**
 * @file 公告管理类型定义
 * @description 公告列表、表单、批量操作相关类型
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.2-公告管理页.md 第九节
 */

import type { PaginationParams, PaginationInfo, BatchOperationResponse } from './api';

/**
 * 公告目标用户类型
 */
export type AnnouncementTarget = 'ALL' | 'SPECIFIC';

/**
 * 弹窗频率类型
 */
export type PopupFrequency = 'ONCE' | 'EVERY_LOGIN' | 'DAILY';

/**
 * 按钮类型
 */
export type ButtonType = 'primary' | 'default';

/**
 * 按钮动作类型
 */
export type ButtonAction = 'link' | 'close';

/**
 * 公告按钮配置
 */
export interface AnnouncementButton {
  /** 按钮文案 */
  text: string;
  /** 按钮类型 */
  type: ButtonType;
  /** 按钮动作 */
  action: ButtonAction;
  /** 跳转链接（action=link时必填） */
  url?: string;
}

/**
 * 公告对象
 */
export interface Announcement {
  id: number;
  /** 公告标题 */
  title: string;
  /** 公告内容（富文本） */
  content: string;
  /** 公告图片 */
  imageUrl: string | null;
  /** 目标用户类型 */
  targetType: AnnouncementTarget;
  /** 指定用户ID列表 */
  targetUserIds: number[] | null;
  /** 弹窗频率 */
  popupFrequency: PopupFrequency;
  /** 按钮配置 */
  buttons: AnnouncementButton[] | null;
  /** 生效开始时间 */
  startAt: string | null;
  /** 生效结束时间 */
  endAt: string | null;
  /** 是否启用 */
  isActive: boolean;
  /** 排序权重 */
  sortOrder: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 公告列表项
 */
export interface AnnouncementListItem extends Announcement {}

/**
 * 公告表单数据
 */
export interface AnnouncementFormData {
  /** 公告标题 */
  title: string;
  /** 公告内容（富文本） */
  content: string;
  /** 公告图片 */
  imageUrl?: string | null;
  /** 目标用户类型 */
  targetType: AnnouncementTarget;
  /** 指定用户ID列表 */
  targetUserIds?: number[];
  /** 弹窗频率 */
  popupFrequency: PopupFrequency;
  /** 按钮配置 */
  buttons?: AnnouncementButton[];
  /** 生效开始时间 */
  startAt?: string | null;
  /** 生效结束时间 */
  endAt?: string | null;
  /** 是否启用 */
  isActive: boolean;
  /** 排序权重 */
  sortOrder?: number;
}

/**
 * 公告列表查询参数
 */
export interface AnnouncementQueryParams extends PaginationParams {
  /** 关键词（搜索标题、内容） */
  keyword?: string;
  /** 启用状态 */
  isActive?: boolean;
  /** 弹窗频率 */
  popupFrequency?: PopupFrequency;
  /** 目标用户类型 */
  targetType?: AnnouncementTarget;
  /** 生效开始时间 */
  effectiveStartDate?: string;
  /** 生效结束时间 */
  effectiveEndDate?: string;
  /** 排序字段 */
  sortField?: string;
  /** 排序方向 */
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 公告列表响应
 */
export interface AnnouncementListResponse {
  list: AnnouncementListItem[];
  pagination: PaginationInfo;
}

/**
 * 弹窗频率显示配置
 */
export const POPUP_FREQUENCY_OPTIONS = [
  { value: 'ONCE', label: '仅一次', color: 'blue' },
  { value: 'EVERY_LOGIN', label: '每次登录', color: 'orange' },
  { value: 'DAILY', label: '每天一次', color: 'green' },
] as const;

/**
 * 目标用户类型显示配置
 */
export const TARGET_TYPE_OPTIONS = [
  { value: 'ALL', label: '全部用户' },
  { value: 'SPECIFIC', label: '指定用户' },
] as const;

/**
 * 按钮类型选项
 */
export const BUTTON_TYPE_OPTIONS = [
  { value: 'primary', label: '主要按钮' },
  { value: 'default', label: '次要按钮' },
] as const;

/**
 * 按钮动作选项
 */
export const BUTTON_ACTION_OPTIONS = [
  { value: 'link', label: '跳转链接' },
  { value: 'close', label: '关闭弹窗' },
] as const;

export type { BatchOperationResponse };
