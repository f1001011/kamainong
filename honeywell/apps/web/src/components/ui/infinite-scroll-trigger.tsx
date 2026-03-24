/**
 * @file 无限滚动触发器组件
 * @description 基于 IntersectionObserver 的无限滚动加载触发器
 * @depends 开发文档/01-设计系统/01.3-组件规范.md
 * @depends 开发文档/03-前端用户端/03.3-产品模块/03.3.1-产品列表页.md
 * 
 * 2026高端美学设计要点：
 * - 使用 IntersectionObserver 高效检测
 * - 精美的加载指示器
 * - 支持自定义提前触发距离
 * - 三种状态：加载中、加载完成、无更多数据
 */

'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { m, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { LoadingSpinner } from './loading-spinner';
import { RiCheckDoubleLine } from '@remixicon/react';

/**
 * InfiniteScrollTrigger 组件属性
 */
export interface InfiniteScrollTriggerProps {
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 是否正在加载 */
  isLoading: boolean;
  /** 加载更多回调 */
  onLoadMore: () => void;
  /** 自定义类名 */
  className?: string;
  /** 触发阈值（距离底部多少像素时触发） */
  threshold?: number;
  /** 自定义加载中内容 */
  loadingContent?: ReactNode;
  /** 自定义无更多数据内容 */
  endContent?: ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 显示模式 */
  variant?: 'default' | 'minimal' | 'hidden';
}

/**
 * InfiniteScrollTrigger 无限滚动触发器
 * @description 放置在列表底部，自动检测并触发加载更多
 * 
 * @example
 * ```tsx
 * // 基础用法
 * <div className="space-y-4">
 *   {items.map(item => <ItemCard key={item.id} item={item} />)}
 *   <InfiniteScrollTrigger
 *     hasMore={hasNextPage}
 *     isLoading={isFetchingNextPage}
 *     onLoadMore={fetchNextPage}
 *   />
 * </div>
 * 
 * // 与 React Query 配合
 * <InfiniteScrollTrigger
 *   hasMore={!!hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={() => fetchNextPage()}
 *   threshold={300}
 * />
 * ```
 */
export function InfiniteScrollTrigger({
  hasMore,
  isLoading,
  onLoadMore,
  className,
  threshold = 200,
  loadingContent,
  endContent,
  disabled = false,
  variant = 'default',
}: InfiniteScrollTriggerProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  useEffect(() => {
    // 如果禁用或没有更多数据，不需要观察
    if (disabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // 当触发器进入视口，且有更多数据，且未在加载中时，触发加载
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        // 提前触发的距离
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0.1,
      }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore, threshold, disabled]);

  // 隐藏模式 - 只保留触发器，不显示任何 UI
  if (variant === 'hidden') {
    return <div ref={observerRef} className="h-px" aria-hidden="true" />;
  }

  // 最小化模式 - 只在加载时显示
  if (variant === 'minimal') {
    return (
      <div ref={observerRef} className={cn('py-2', className)}>
        {isLoading && (
          <div className="flex justify-center">
            <LoadingSpinner size="sm" variant="muted" />
          </div>
        )}
      </div>
    );
  }

  // 默认模式 - 完整显示
  return (
    <LazyMotion features={domAnimation}>
      <div
        ref={observerRef}
        className={cn('py-6 flex flex-col items-center justify-center', className)}
      >
        {/* 加载中状态 */}
        {isLoading && (
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {loadingContent || (
              <>
                <LoadingSpinner size="sm" />
                <span className="text-sm text-neutral-500">
                  {t('tip.loading_more', 'جارٍ تحميل المزيد...')}
                </span>
              </>
            )}
          </m.div>
        )}

        {/* 无更多数据状态 */}
        {!hasMore && !isLoading && (
          <m.div
            initial={isAnimationEnabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            {endContent || (
              <>
                <RiCheckDoubleLine className="w-4 h-4 text-neutral-300" />
                <span className="text-sm text-neutral-400">
                  {t('tip.no_more_data', 'لا توجد بيانات أخرى')}
                </span>
              </>
            )}
          </m.div>
        )}

        {/* 有更多数据但未加载的占位（保持布局稳定） */}
        {hasMore && !isLoading && <div className="h-6" />}
      </div>
    </LazyMotion>
  );
}

/**
 * InfiniteScrollWrapper 组件属性
 * 用于包裹整个列表的便捷组件
 */
export interface InfiniteScrollWrapperProps extends InfiniteScrollTriggerProps {
  /** 子内容（列表） */
  children: ReactNode;
  /** 列表容器类名 */
  listClassName?: string;
}

/**
 * InfiniteScrollWrapper 无限滚动包装器
 * @description 包裹列表并自动添加触发器的便捷组件
 * 
 * @example
 * ```tsx
 * <InfiniteScrollWrapper
 *   hasMore={hasNextPage}
 *   isLoading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 * >
 *   <div className="grid grid-cols-2 gap-4">
 *     {products.map(product => (
 *       <ProductCard key={product.id} product={product} />
 *     ))}
 *   </div>
 * </InfiniteScrollWrapper>
 * ```
 */
export function InfiniteScrollWrapper({
  children,
  listClassName,
  className,
  ...triggerProps
}: InfiniteScrollWrapperProps) {
  return (
    <div className={listClassName}>
      {children}
      <InfiniteScrollTrigger className={className} {...triggerProps} />
    </div>
  );
}

/**
 * useInfiniteScroll Hook
 * @description 用于自定义无限滚动实现的 Hook
 * 
 * @example
 * ```tsx
 * const { ref } = useInfiniteScroll({
 *   hasMore,
 *   isLoading,
 *   onLoadMore: fetchNextPage,
 * });
 * 
 * return (
 *   <div>
 *     {items.map(...)}
 *     <div ref={ref} />
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 200,
  disabled = false,
}: Omit<InfiniteScrollTriggerProps, 'className' | 'loadingContent' | 'endContent' | 'variant'>) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0.1,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading, onLoadMore, threshold, disabled]);

  return { ref };
}

export default InfiniteScrollTrigger;
