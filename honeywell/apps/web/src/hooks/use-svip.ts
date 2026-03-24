/**
 * @file SVIP 数据 Hook
 * @description 封装 SVIP 状态查询、手动领取、奖励历史 API 调用
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SvipStatusResponse, SvipRewardsResponse, SvipClaimResponse } from '@/types';

/**
 * 获取 SVIP 状态（等级资格、每日奖励汇总、今日领取状态）
 */
export function useSvipStatus() {
  return useQuery<SvipStatusResponse>({
    queryKey: ['svip-status'],
    queryFn: () => api.get('/svip/status'),
    staleTime: 60 * 1000,
    retry: 2,
  });
}

/**
 * 手动领取 SVIP 每日奖励
 * @description 一键领取当日所有达标等级的奖励
 */
export function useClaimSvipReward() {
  const queryClient = useQueryClient();

  return useMutation<SvipClaimResponse>({
    mutationFn: () => api.post('/svip/claim'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['svip-status'] });
      queryClient.invalidateQueries({ queryKey: ['svip-rewards'] });
      queryClient.invalidateQueries({ queryKey: ['user-info'] });
    },
  });
}

/**
 * 获取 SVIP 奖励历史（分页）
 */
export function useSvipRewards(page: number = 1, pageSize: number = 20) {
  return useQuery<SvipRewardsResponse>({
    queryKey: ['svip-rewards', page, pageSize],
    queryFn: () => api.get(`/svip/rewards?page=${page}&pageSize=${pageSize}`),
    staleTime: 30 * 1000,
  });
}

/**
 * 所有 SVIP 等级定义（用于展示完整的 12 等级列表）
 */
export const SVIP_LEVELS = [
  { level: 1, product: 'VIC1', requiredCount: 2, dailyReward: '8.80' },
  { level: 2, product: 'VIC2', requiredCount: 2, dailyReward: '12.80' },
  { level: 3, product: 'VIC3', requiredCount: 2, dailyReward: '15.80' },
  { level: 4, product: 'VIC4', requiredCount: 2, dailyReward: '18.80' },
  { level: 5, product: 'VIC5', requiredCount: 2, dailyReward: '28.80' },
  { level: 6, product: 'NWS6', requiredCount: 2, dailyReward: '38.80' },
  { level: 7, product: 'NWS7', requiredCount: 2, dailyReward: '48.80' },
  { level: 8, product: 'NWS8', requiredCount: 2, dailyReward: '58.80' },
  { level: 9, product: 'NWS9', requiredCount: 2, dailyReward: '68.80' },
  { level: 10, product: 'QLD10', requiredCount: 2, dailyReward: '88.80' },
  { level: 11, product: 'QLD11', requiredCount: 2, dailyReward: '128.80' },
  { level: 12, product: 'QLD12', requiredCount: 2, dailyReward: '158.80' },
] as const;
