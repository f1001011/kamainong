/**
 * @file 流水列表骨架屏组件
 * @description 流水列表加载状态的骨架屏
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md 4.5节
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * TransactionListSkeleton 组件属性
 */
interface TransactionListSkeletonProps {
  /** 显示数量 */
  count?: number;
}

/**
 * 流水列表骨架屏组件
 * @description 模拟流水列表的加载状态，包含多个日期分组
 * 依据：03.9.1-资金明细页.md 4.5节
 */
export function TransactionListSkeleton({ count = 5 }: TransactionListSkeletonProps) {
  // 将数量分配到两个日期分组
  const group1Count = Math.ceil(count * 0.6);
  const group2Count = count - group1Count;

  return (
    <div className="space-y-6">
      {/* 日期分组1 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 py-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex-1 h-px bg-neutral-100" />
        </div>
        
        {Array.from({ length: group1Count }).map((_, index) => (
          <TransactionItemSkeleton key={`g1-${index}`} />
        ))}
      </div>

      {/* 日期分组2 */}
      {group2Count > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex-1 h-px bg-neutral-100" />
          </div>
          
          {Array.from({ length: group2Count }).map((_, index) => (
            <TransactionItemSkeleton key={`g2-${index}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 单条流水骨架
 * 依据：03.9.1-资金明细页.md 4.5节
 */
function TransactionItemSkeleton() {
  return (
    <div className={cn(
      'bg-white rounded-2xl px-4 py-4',
      'shadow-soft border border-neutral-100/50',
      'flex items-center gap-4'
    )}>
      {/* 图标骨架 - 圆形 */}
      <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
      
      {/* 信息骨架 */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      
      {/* 金额骨架 */}
      <Skeleton className="h-5 w-20 flex-shrink-0" />
    </div>
  );
}
