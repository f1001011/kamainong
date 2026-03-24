/**
 * @file 版本信息组件
 * @description 展示应用版本号
 * @depends 开发文档/03-功能模块/03.13.1-关于我们页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { Skeleton } from '@/components/ui/skeleton';
import { SPRINGS } from '@/lib/animation';

/**
 * 版本信息组件属性
 */
export interface AppVersionProps {
  /** 版本号 */
  version?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 版本信息骨架屏
 */
function AppVersionSkeleton() {
  return (
    <div className="flex flex-col items-center py-4">
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

/**
 * 版本信息组件
 * @description 在页面底部居中展示应用版本号
 * 依据：03.13.1-关于我们页.md - 版本号底部居中显示
 * 依据：01.1-设计Token.md - 浅色小字 text-neutral-400
 * 
 * @example
 * ```tsx
 * <AppVersion version="1.0.0" />
 * ```
 */
export function AppVersion({
  version,
  updatedAt,
  isLoading = false,
  className,
}: AppVersionProps) {
  const t = useText();

  // 加载状态
  if (isLoading) {
    return <AppVersionSkeleton />;
  }

  // 无版本号时不显示
  if (!version) {
    return null;
  }

  return (
    <m.div
      className={cn(
        'flex flex-col items-center py-6 space-y-1',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...SPRINGS.gentle, delay: 0.5 }}
    >
      {/* 版本号 - 依据：01.1-设计Token.md - 浅色小字 */}
      <p className="text-xs text-neutral-400">
        {t('about.version', 'الإصدار')} {version}
      </p>
      
      {/* 更新时间（可选） */}
      {updatedAt && (
        <p className="text-xs text-neutral-300">
          {t('about.last_updated', 'آخر تحديث')}: {updatedAt}
        </p>
      )}
    </m.div>
  );
}
