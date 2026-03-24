/**
 * @file 团队关系管理 API 服务
 * @description 团队关系查询相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20节 - 团队关系管理接口
 */

import { get } from '@/utils/request';
import type {
  TeamQueryParams,
  TeamQueryResult,
  UplineChainResult,
  DownlineListParams,
  DownlineListResponse,
  TeamStatsResult,
} from '@/types/team';

/**
 * 团队关系查询
 * @description 依据：02.4-后台API接口清单.md 第20.1节
 * @endpoint GET /api/admin/team/query
 * @param params 查询参数（userId/phone/inviteCode 三选一）
 */
export async function queryTeamRelation(params: TeamQueryParams): Promise<TeamQueryResult> {
  return get<TeamQueryResult>('/team/query', params as Record<string, unknown>);
}

/**
 * 向上追溯上级链路
 * @description 依据：02.4-后台API接口清单.md 第20.2节
 * @endpoint GET /api/admin/team/:userId/upline
 * @param userId 目标用户ID
 */
export async function getUplineChain(userId: number): Promise<UplineChainResult> {
  return get<UplineChainResult>(`/team/${userId}/upline`);
}

/**
 * 向下展开成员树
 * @description 依据：02.4-后台API接口清单.md 第20.3节
 * @endpoint GET /api/admin/team/:userId/downline
 * @param userId 目标用户ID
 * @param params 查询参数
 */
export async function getDownlineMembers(
  userId: number,
  params?: DownlineListParams
): Promise<DownlineListResponse> {
  return get<DownlineListResponse>(`/team/${userId}/downline`, params as Record<string, unknown>);
}

/**
 * 获取团队统计数据
 * @description 依据：02.4-后台API接口清单.md 第20.4节
 * @endpoint GET /api/admin/team/:userId/stats
 * @param userId 目标用户ID
 */
export async function getTeamStats(userId: number): Promise<TeamStatsResult> {
  return get<TeamStatsResult>(`/team/${userId}/stats`);
}

/**
 * 导出下级成员列表
 * @description 导出Excel文件
 * @param userId 目标用户ID
 * @param params 查询参数
 */
export async function exportDownlineMembers(
  userId: number,
  params?: DownlineListParams
): Promise<Blob> {
  const queryParams = new URLSearchParams();
  if (params?.level) queryParams.append('level', String(params.level));
  if (params?.status) queryParams.append('status', params.status);
  if (params?.isValidInvite !== undefined) queryParams.append('isValidInvite', String(params.isValidInvite));
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);

  // SSR 兼容性检查
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : '';

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/team/${userId}/downline/export?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('导出失败');
  }

  return response.blob();
}
