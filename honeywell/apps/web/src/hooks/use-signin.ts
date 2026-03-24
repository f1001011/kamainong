/**
 * @file 签到数据 Hook
 * @description 签到状态获取、签到操作、签到记录
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第10节
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { 
  SignInStatusResponse, 
  SignInResult, 
  SignInRecordsResponse 
} from '@/types/signin';

/**
 * 签到相关 Query Keys
 */
export const signinQueryKeys = {
  all: ['signin'] as const,
  status: () => [...signinQueryKeys.all, 'status'] as const,
  records: (days: number) => [...signinQueryKeys.all, 'records', days] as const,
};

/**
 * 获取签到状态
 * @description 依据：02.3-前端API接口清单 第10.1节
 */
export function useSignInStatus() {
  return useQuery({
    queryKey: signinQueryKeys.status(),
    queryFn: async () => {
      return api.get<SignInStatusResponse>('/signin/status');
    },
    staleTime: 60 * 1000, // 1分钟缓存
    refetchOnWindowFocus: true,
  });
}

/**
 * 执行签到操作
 * @description 依据：02.3-前端API接口清单 第10.2节
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return api.post<SignInResult>('/signin');
    },
    onSuccess: () => {
      // 签到成功后刷新状态和用户余额
      queryClient.invalidateQueries({ queryKey: signinQueryKeys.status() });
      queryClient.invalidateQueries({ queryKey: signinQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

/**
 * 获取签到记录
 * @description 依据：02.3-前端API接口清单 第10.3节
 * @param days - 查询天数，默认7天
 */
export function useSignInRecords(days: number = 7) {
  return useQuery({
    queryKey: signinQueryKeys.records(days),
    queryFn: async () => {
      return api.get<SignInRecordsResponse>(`/signin/records?days=${days}`);
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
}

/**
 * 签到状态简化 Hook
 * @description 提供常用的签到状态判断
 */
export function useSignInSimple() {
  const { data: status, isLoading } = useSignInStatus();
  
  // 默认状态
  if (!status || isLoading) {
    return {
      isLoading: true,
      todaySigned: false,
      canSign: false,
      isNormal: false,
      isVip: false,
      isSvip: false,
      currentStreak: 0,
      remainingDays: 0,
    };
  }
  
  const { normalSignIn, svipSignIn } = status;
  
  // 判断用户类型
  const isSvip = Boolean(svipSignIn?.available);
  const isNormal = normalSignIn.available;
  const isVip = !isNormal && !isSvip;
  
  // 判断今日是否已签到
  const todaySigned = normalSignIn.todaySigned || (svipSignIn?.todaySigned ?? false);
  
  // 判断是否可以签到
  let canSign = false;
  if (isNormal) {
    canSign = !normalSignIn.completed && 
              !normalSignIn.windowExpired && 
              !normalSignIn.todaySigned;
  } else {
    canSign = !todaySigned;
  }
  
  return {
    isLoading: false,
    todaySigned,
    canSign,
    isNormal,
    isVip,
    isSvip,
    currentStreak: normalSignIn.currentStreak,
    remainingDays: normalSignIn.remainingWindowDays,
    completed: normalSignIn.completed,
    windowExpired: normalSignIn.windowExpired,
    svipLevel: svipSignIn?.svipLevel ?? 0,
    normalReward: normalSignIn.reward,
    svipReward: svipSignIn?.reward ?? '0',
  };
}
