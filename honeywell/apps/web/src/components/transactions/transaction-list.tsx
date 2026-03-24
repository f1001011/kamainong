/**
 * @file 流水列表组件
 * @description 带日期分组和交错动画的流水列表
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { useMemo } from 'react';
import { AnimatedList, AnimatedListItem } from '@/components/ui/animated-list';
import { TransactionItem, TransactionRecord } from './transaction-item';
import { DateGroupHeader } from './date-group-header';
import { TransactionEmptyState } from './transaction-empty-state';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { formatSystemTime } from '@/lib/timezone';

/**
 * TransactionList 组件属性
 */
interface TransactionListProps {
  /** 流水数据列表 */
  transactions: TransactionRecord[];
  /** 是否有筛选条件 */
  isFiltered?: boolean;
  /** 清除筛选回调 */
  onClearFilter?: () => void;
}

/**
 * 按日期分组流水记录
 */
interface DateGroup {
  date: string;
  isToday: boolean;
  isYesterday: boolean;
  items: TransactionRecord[];
}

/**
 * 流水列表组件
 * @description 按日期分组展示流水记录，支持交错动画
 */
export function TransactionList({ transactions, isFiltered = false, onClearFilter }: TransactionListProps) {
  const { config: globalConfig } = useGlobalConfig();

  // 按日期分组
  const groupedTransactions = useMemo(() => {
    if (transactions.length === 0) return [];

    // 获取今日和昨日的日期字符串
    const now = new Date();
    const todayStr = formatSystemTime(now.toISOString(), globalConfig.systemTimezone, 'yyyy-MM-dd');
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatSystemTime(yesterday.toISOString(), globalConfig.systemTimezone, 'yyyy-MM-dd');

    // 按日期分组
    const groups = new Map<string, TransactionRecord[]>();
    
    transactions.forEach((tx) => {
      const dateStr = formatSystemTime(tx.createdAt, globalConfig.systemTimezone, 'yyyy-MM-dd');
      const existing = groups.get(dateStr) || [];
      groups.set(dateStr, [...existing, tx]);
    });

    // 转换为数组并标记今日/昨日
    const result: DateGroup[] = [];
    groups.forEach((items, date) => {
      result.push({
        date,
        isToday: date === todayStr,
        isYesterday: date === yesterdayStr,
        items,
      });
    });

    // 按日期降序排列
    result.sort((a, b) => b.date.localeCompare(a.date));

    return result;
  }, [transactions, globalConfig.systemTimezone]);

  // 空状态
  if (transactions.length === 0) {
    return (
      <TransactionEmptyState 
        isFiltered={isFiltered} 
        onClearFilter={onClearFilter}
      />
    );
  }

  return (
    <AnimatedList className="space-y-4">
      {groupedTransactions.map((group) => (
        <div key={group.date} className="space-y-3">
          {/* 日期分组标题 */}
          <DateGroupHeader
            date={group.date}
            isToday={group.isToday}
            isYesterday={group.isYesterday}
          />
          
          {/* 该日期下的流水记录 */}
          <div className="space-y-3">
            {group.items.map((transaction) => (
              <AnimatedListItem key={transaction.id}>
                <TransactionItem transaction={transaction} />
              </AnimatedListItem>
            ))}
          </div>
        </div>
      ))}
    </AnimatedList>
  );
}
