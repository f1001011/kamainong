/**
 * @file 支付通道 API 服务
 * @description 支付通道列表、详情、配置、测试连接、余额查询相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9节 - 支付通道接口
 */

import { get, post, put } from '@/utils/request';
import type {
  ChannelListItem,
  ChannelDetail,
  UpdateChannelParams,
  TestConnectionResult,
  BalanceQueryResult,
} from '@/types/channels';

/**
 * 获取支付通道列表
 * @description 依据：02.4-后台API接口清单.md 第9.1节
 * @endpoint GET /api/admin/channels
 */
export async function fetchChannelList(): Promise<{ list: ChannelListItem[] }> {
  return get<{ list: ChannelListItem[] }>('/channels');
}

/**
 * 获取通道详情
 * @description 依据：02.4-后台API接口清单.md 第9.1节
 * @endpoint GET /api/admin/channels/:id
 */
export async function fetchChannelDetail(channelId: number): Promise<ChannelDetail> {
  return get<ChannelDetail>(`/channels/${channelId}`);
}

/**
 * 更新通道配置
 * @description 依据：02.4-后台API接口清单.md 第9.2节
 * @endpoint PUT /api/admin/channels/:id
 */
export async function updateChannelConfig(
  channelId: number,
  params: UpdateChannelParams
): Promise<ChannelDetail> {
  return put<ChannelDetail>(`/channels/${channelId}`, params);
}

/**
 * 测试通道连接
 * @description 依据：02.4-后台API接口清单.md 第9.3节
 * @endpoint POST /api/admin/channels/:id/test
 */
export async function testChannelConnection(channelId: number): Promise<TestConnectionResult> {
  return post<TestConnectionResult>(`/channels/${channelId}/test`);
}

/**
 * 查询通道余额
 * @description 依据：02.4-后台API接口清单.md 第9.4节
 * @endpoint GET /api/admin/channels/:id/balance
 */
export async function queryChannelBalance(channelId: number): Promise<BalanceQueryResult> {
  return get<BalanceQueryResult>(`/channels/${channelId}/balance`);
}

/**
 * 批量查询所有通道余额（带通道ID映射）
 * @description 并行查询所有通道的余额，返回带有通道ID的映射结果
 */
export interface BalanceQueryResultWithId extends BalanceQueryResult {
  /** 通道ID（前端附加，用于映射） */
  channelId: number;
}

export async function queryAllChannelsBalance(
  channelIds: number[]
): Promise<{ results: BalanceQueryResultWithId[] }> {
  // 并行请求所有通道余额，附加 channelId 用于前端映射
  const promises = channelIds.map((id) =>
    queryChannelBalance(id)
      .then((result) => ({
        ...result,
        channelId: id,
      }))
      .catch((error) => ({
        balance: null,
        message: error instanceof Error ? error.message : '查询失败',
        channelId: id,
      }))
  );

  const results = await Promise.all(promises);
  return { results };
}

/**
 * 切换通道代收开关
 * @description 简化操作，仅更新代收开关
 */
export async function togglePayEnabled(
  channelId: number,
  enabled: boolean
): Promise<ChannelDetail> {
  return updateChannelConfig(channelId, { payEnabled: enabled });
}

/**
 * 切换通道代付开关
 * @description 简化操作，仅更新代付开关
 * @note 代付开关互斥，开启时服务端会自动关闭其他通道
 */
export async function toggleTransferEnabled(
  channelId: number,
  enabled: boolean
): Promise<ChannelDetail> {
  return updateChannelConfig(channelId, { transferEnabled: enabled });
}

/**
 * 免审核配置数据结构
 */
export interface AutoApproveConfig {
  /** 是否启用免审核功能 */
  enabled: boolean;
  /** 单笔金额阈值 */
  threshold: string;
  /** 每日免审次数 */
  dailyLimit: number;
  /** 生效时间范围（格式：HH:MM-HH:MM） */
  timeRange: string;
  /** 新用户限制天数 */
  newUserDays: number;
}

/**
 * 获取免审核配置
 * @description 依据：02.4-后台API接口清单.md 第10.1节
 * @endpoint GET /api/admin/auto-approve/config
 */
export async function fetchAutoApproveConfig(): Promise<AutoApproveConfig> {
  return get<AutoApproveConfig>('/auto-approve/config');
}

/**
 * 更新免审核配置
 * @description 依据：02.4-后台API接口清单.md 第10.1节
 * @endpoint PUT /api/admin/auto-approve/config
 */
export async function updateAutoApproveConfig(
  config: Partial<AutoApproveConfig>
): Promise<AutoApproveConfig> {
  return put<AutoApproveConfig>('/auto-approve/config', config);
}
