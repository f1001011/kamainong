/**
 * @file 黑名单操作 Hooks
 * @description 黑名单相关的自定义 Hooks，包含列表查询、增删改操作
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第十一节
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import * as blacklistService from '@/services/blacklist';
import { get } from '@/utils/request';
import type { BlacklistQueryParams, BlacklistFormData } from '@/types/blacklist';

/**
 * 黑名单列表查询 Hook
 */
export function useBlacklistList(params: BlacklistQueryParams) {
  return useQuery({
    queryKey: ['blacklist', params],
    queryFn: () => blacklistService.getBlacklistList(params),
    staleTime: 3 * 60 * 1000, // 3分钟缓存
  });
}

/**
 * 添加黑名单 Mutation
 */
export function useAddBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlacklistFormData) => blacklistService.addBlacklist(data),
    onSuccess: () => {
      message.success('添加成功');
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '添加失败');
    },
  });
}

/**
 * 删除黑名单 Mutation
 */
export function useDeleteBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => blacklistService.deleteBlacklist(id),
    onSuccess: () => {
      message.success('移除成功');
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '移除失败');
    },
  });
}

/**
 * 批量删除 Mutation
 */
export function useBatchDeleteBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: number[]) => blacklistService.batchDeleteBlacklist(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
  });
}

/**
 * 批量导入 Mutation
 */
export function useBatchImportBlacklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { type: string; values: string[]; reason?: string }) =>
      blacklistService.batchImportBlacklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blacklist'] });
    },
  });
}

/**
 * 黑名单各类型数量 Hook
 * @description 用于Tab展示各类型黑名单数量
 */
export function useBlacklistCounts() {
  return useQuery({
    queryKey: ['blacklist', 'counts'],
    queryFn: () => blacklistService.getBlacklistCounts(),
    staleTime: 60 * 1000, // 1分钟缓存
  });
}

/**
 * 管理员选项类型
 */
interface AdminOption {
  label: string;
  value: number;
}

/**
 * 获取管理员列表 Hook（用于操作人筛选）
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 */
export function useAdminList() {
  return useQuery<AdminOption[]>({
    queryKey: ['admins', 'active'],
    queryFn: async () => {
      const response = await get<{
        list: Array<{ id: number; username: string; nickname?: string }>;
      }>('/admins', { isActive: true, pageSize: 100 });
      return response.list.map((admin) => ({
        label: admin.nickname || admin.username,
        value: admin.id,
      }));
    },
    staleTime: 10 * 60 * 1000, // 10分钟缓存
  });
}
