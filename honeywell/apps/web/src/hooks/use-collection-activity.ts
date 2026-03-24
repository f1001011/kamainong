/**
 * @file 连单奖励活动数据 Hook
 * @description 获取和操作连单奖励活动数据
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.4-11.5节
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CollectionActivityData, ClaimRewardResult } from '@/types/activity';

/**
 * 获取连单奖励活动数据
 * @description 依据：02.3-前端API接口清单 第11.4节 - 连单奖励状态
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isError, refetch } = useCollectionActivity();
 * ```
 */
export function useCollectionActivity() {
  return useQuery({
    queryKey: ['activity', 'collection'],
    queryFn: async () => {
      const data = await api.get<CollectionActivityData>('/activities/collection');
      return data;
    },
    staleTime: 30 * 1000, // 30秒缓存
    retry: 2, // 失败重试2次
  });
}

/**
 * 领取连单奖励
 * @description 依据：02.3-前端API接口清单 第11.5节 - 领取连单奖励
 * 
 * @example
 * ```tsx
 * const { mutate: claim, isPending } = useClaimCollectionReward();
 * 
 * const handleClaim = (tier: number) => {
 *   claim(tier, {
 *     onSuccess: (result) => {
 *       // 播放庆祝动画
 *       toast.success(`已领取 ${result.reward}`);
 *     },
 *     onError: (error) => {
 *       toast.error(error.message);
 *     }
 *   });
 * };
 * ```
 */
export function useClaimCollectionReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: number) => {
      const data = await api.post<ClaimRewardResult>('/activities/collection/claim', { tier });
      return data;
    },
    onSuccess: () => {
      // 刷新活动数据
      queryClient.invalidateQueries({ queryKey: ['activity', 'collection'] });
      // 刷新用户信息（余额变化）
      queryClient.invalidateQueries({ queryKey: ['user', 'info'] });
      // 刷新活动列表（红点状态可能变化）
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}
