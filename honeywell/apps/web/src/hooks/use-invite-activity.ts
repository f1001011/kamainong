/**
 * @file 拉新裂变活动数据 Hook
 * @description 邀请活动数据获取、领取奖励、邀请记录
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11.2节
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { 
  InviteActivityData, 
  ClaimRewardRequest,
  ClaimRewardResult 
} from '@/types/activity';

/**
 * 拉新裂变相关 Query Keys
 */
export const inviteActivityQueryKeys = {
  all: ['invite-activity'] as const,
  detail: () => [...inviteActivityQueryKeys.all, 'detail'] as const,
};

/**
 * 获取拉新裂变活动详情
 * @description 依据：02.3-前端API接口清单 第11.2节
 * @returns 活动数据（activityName, activityDesc, validInviteCount, tiers[]）
 */
export function useInviteActivity() {
  return useQuery({
    queryKey: inviteActivityQueryKeys.detail(),
    queryFn: async () => {
      return api.get<InviteActivityData>('/activities/invite');
    },
    staleTime: 60 * 1000, // 1分钟缓存
    refetchOnWindowFocus: true,
  });
}

/**
 * 领取邀请奖励
 * @description 依据：02.3-前端API接口清单 第11.3节
 * @returns useMutation 实例（mutate, isPending, isSuccess 等）
 */
export function useClaimInviteReward() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: ClaimRewardRequest) => {
      return api.post<ClaimRewardResult>('/activities/invite/claim', request as unknown as Record<string, unknown>);
    },
    onSuccess: () => {
      // 领取成功后刷新活动详情和用户余额
      queryClient.invalidateQueries({ queryKey: inviteActivityQueryKeys.detail() });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      // 刷新活动列表（更新红点状态）
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
}

/**
 * 邀请活动状态简化 Hook
 * @description 提供常用的活动状态判断，方便组件使用
 */
export function useInviteActivitySimple() {
  const { data, isLoading, error } = useInviteActivity();
  
  // 默认/加载状态
  if (!data || isLoading) {
    return {
      isLoading: true,
      error: error,
      activityName: '',
      activityDesc: '',
      validInviteCount: 0,
      tiers: [],
      hasClaimable: false,
      nextTier: null,
      invitesNeeded: 0,
      allClaimed: false,
    };
  }
  
  const { activityName, activityDesc, validInviteCount, tiers } = data;
  
  // 计算是否有可领取奖励
  const hasClaimable = tiers.some(t => t.status === 'CLAIMABLE');
  
  // 计算下一个目标阶梯
  const nextTier = tiers.find(t => t.status === 'LOCKED') || null;
  
  // 计算还需邀请人数
  const invitesNeeded = nextTier 
    ? Math.max(0, nextTier.requiredCount - validInviteCount) 
    : 0;
  
  // 计算是否所有阶梯都已领取
  const allClaimed = tiers.length > 0 && tiers.every(t => t.status === 'CLAIMED');
  
  return {
    isLoading: false,
    error: null,
    activityName,
    activityDesc,
    validInviteCount,
    tiers,
    hasClaimable,
    nextTier,
    invitesNeeded,
    allClaimed,
  };
}
