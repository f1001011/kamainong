/**
 * @file 渠道链接 API 服务封装
 * @description 渠道链接管理模块的前端 API 调用
 * @depends 渠道链接.md 第5.4节 - 服务层
 */

import { get, post, put, del } from '@/utils/request';
import type {
  MarketingChannelItem,
  MarketingChannelListParams,
  CreateChannelRequest,
  UpdateChannelRequest,
  ChannelDetailResponse,
} from '@/types/marketing-channels';

interface PaginatedList<T> {
  list: T[];
  pagination: { page: number; pageSize: number; total: number };
}

/** 获取渠道列表（含统计） */
export function fetchChannelList(
  params: MarketingChannelListParams
): Promise<PaginatedList<MarketingChannelItem>> {
  return get<PaginatedList<MarketingChannelItem>>('/marketing-channels', params as unknown as Record<string, unknown>);
}

/** 创建渠道 */
export function createChannel(
  data: CreateChannelRequest
): Promise<MarketingChannelItem> {
  return post<MarketingChannelItem>('/marketing-channels', data);
}

/** 更新渠道 */
export function updateChannel(
  id: number, data: UpdateChannelRequest
): Promise<MarketingChannelItem> {
  return put<MarketingChannelItem>(`/marketing-channels/${id}`, data);
}

/** 删除渠道 */
export function deleteChannel(id: number): Promise<void> {
  return del<void>(`/marketing-channels/${id}`);
}

/** 获取渠道详情（含下线用户列表） */
export function fetchChannelDetail(
  id: number, params?: { page?: number; pageSize?: number }
): Promise<ChannelDetailResponse> {
  return get<ChannelDetailResponse>(`/marketing-channels/${id}`, params as unknown as Record<string, unknown>);
}
