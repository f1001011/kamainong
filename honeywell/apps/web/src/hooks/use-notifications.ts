/**
 * @file 消息通知相关数据 Hook
 * @description 封装消息列表、详情、已读标记等 API 调用与状态管理
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第14节 - 通知接口
 * @depends 开发文档/03-前端用户端/03.12-消息模块/03.12.1-消息列表页.md 第五节
 */

'use client';

import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { groupMessagesByDate } from '@/lib/format';
import type {
  NotificationItem,
  NotificationListResponse,
  NotificationType,
} from '@/types/notification';

// ========================================
// 消息列表查询
// ========================================

/**
 * 消息列表 Hook
 * @description 依据：02.3-前端API接口清单.md 第14.1节
 * @param type 可选的消息类型筛选
 */
export function useNotifications(type?: NotificationType) {
  const result = useInfiniteQuery({
    queryKey: ['notifications', type],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        pageSize: '20',
      });
      if (type) params.set('type', type);

      return api.get<NotificationListResponse>(
        `/notifications?${params.toString()}`
      );
    },
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  // 扁平化所有页数据
  const allMessages = useMemo(() => {
    return result.data?.pages.flatMap((page) => page.list) ?? [];
  }, [result.data]);

  // 按日期分组
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(allMessages);
  }, [allMessages]);

  // 未读数量（取第一页返回的 unreadCount）
  const unreadCount = result.data?.pages[0]?.unreadCount ?? 0;

  return {
    ...result,
    allMessages,
    groupedMessages,
    unreadCount,
  };
}

// ========================================
// 消息详情查询
// ========================================

/**
 * 消息详情 Hook
 * @description 依据：02.3-前端API接口清单.md 第14.2节
 * @param id 消息ID
 */
export function useNotificationDetail(id: number) {
  return useQuery({
    queryKey: ['notification', id],
    queryFn: () => api.get<NotificationItem>(`/notifications/${id}`),
    enabled: !!id && id > 0,
  });
}

// ========================================
// 未读数量查询
// ========================================

/**
 * 未读数量 Hook
 * @description 供底部导航角标等场景使用
 * @depends 02.3-前端API接口清单.md 第14节
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const data = await api.get<{ count: number }>('/notifications/unread-count');
      return data.count;
    },
    staleTime: 30 * 1000, // 30秒内不重新请求
    refetchInterval: 60 * 1000, // 每分钟自动刷新
  });
}

// ========================================
// 标记已读操作
// ========================================

/**
 * 标记单条已读 Hook
 * @description 依据：02.3-前端API接口清单.md 第14节
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/notifications/${id}/read`);
    },
    onSuccess: (_data, id) => {
      // 乐观更新：立即更新本地缓存中的已读状态
      queryClient.setQueryData<NotificationItem>(['notification', id], (old) => {
        if (!old) return old;
        return { ...old, isRead: true };
      });

      // 刷新消息列表
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * 全部标记已读 Hook
 * @description 依据：02.3-前端API接口清单.md 第14节
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      // 刷新消息列表和未读数量
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
