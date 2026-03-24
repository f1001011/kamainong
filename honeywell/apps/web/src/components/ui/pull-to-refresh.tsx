/**
 * @file 下拉刷新组件
 * @description 提供下拉刷新功能，支持弹簧回弹动画
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-前端用户端/03.3-产品模块/03.3.1-产品列表页.md
 */

'use client';

import { useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { m, useMotionValue, useTransform, useSpring, PanInfo } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { RiLoader4Line, RiArrowDownLine } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * PullToRefresh 组件属性
 */
export interface PullToRefreshProps {
  /** 子内容 */
  children: ReactNode;
  /** 刷新回调函数 */
  onRefresh: () => Promise<void>;
  /** 自定义类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 触发刷新的下拉阈值（像素） */
  threshold?: number;
}

/**
 * 下拉状态
 */
type PullState = 'idle' | 'pulling' | 'ready' | 'refreshing';

/**
 * PullToRefresh 下拉刷新组件
 * @description 依据：开发文档.md 第12.6.6节 - 下拉刷新
 * 
 * @example
 * ```tsx
 * <PullToRefresh onRefresh={async () => {
 *   await refetch();
 * }}>
 *   <ProductList products={products} />
 * </PullToRefresh>
 * ```
 */
export function PullToRefresh({
  children,
  onRefresh,
  className,
  disabled = false,
  threshold = 80,
}: PullToRefreshProps) {
  const [pullState, setPullState] = useState<PullState>('idle');
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 下拉距离 MotionValue
  const pullDistance = useMotionValue(0);
  
  // 弹簧动画化的下拉距离
  const springY = useSpring(pullDistance, {
    stiffness: 300,
    damping: 30,
  });

  // 旋转角度（基于下拉距离）
  const rotation = useTransform(pullDistance, [0, threshold], [0, 180]);
  
  // 透明度（基于下拉距离）
  const opacity = useTransform(pullDistance, [0, threshold / 2], [0, 1]);

  // 缩放（下拉时放大）
  const scale = useTransform(pullDistance, [0, threshold], [0.6, 1]);

  /**
   * 检查页面是否在顶部
   * 容器自身设置了 overflow-hidden，scrollTop 恒为 0，
   * 实际滚动发生在 body/document 层面，需要检查 window.scrollY
   */
  const isAtTop = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.scrollY <= 0 && document.documentElement.scrollTop <= 0;
  }, []);

  /**
   * 处理触摸开始
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || pullState === 'refreshing') return;
    if (!isAtTop()) return;
    
    startY.current = e.touches[0].clientY;
  }, [disabled, pullState, isAtTop]);

  /**
   * 处理触摸移动
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || pullState === 'refreshing') return;
    if (!isAtTop()) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // 只处理向下拉动
    if (diff <= 0) {
      pullDistance.set(0);
      setPullState('idle');
      return;
    }

    // 添加阻尼效果（拉得越远越难拉）
    const dampedDiff = Math.min(diff * 0.5, threshold * 1.5);
    pullDistance.set(dampedDiff);

    // 更新状态
    if (dampedDiff >= threshold) {
      setPullState('ready');
    } else {
      setPullState('pulling');
    }
  }, [disabled, pullState, isAtTop, threshold, pullDistance]);

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = useCallback(async () => {
    if (disabled || pullState === 'refreshing') return;

    if (pullState === 'ready') {
      // 触发刷新
      setPullState('refreshing');
      pullDistance.set(threshold / 2); // 保持一定高度显示 loading

      try {
        await onRefresh();
      } finally {
        // 刷新完成后回弹
        setPullState('idle');
        pullDistance.set(0);
      }
    } else {
      // 未达到阈值，直接回弹
      setPullState('idle');
      pullDistance.set(0);
    }
  }, [disabled, pullState, threshold, pullDistance, onRefresh]);

  /**
   * 获取提示文案
   */
  const getHintText = () => {
    switch (pullState) {
      case 'pulling':
        return t('tip.pull_to_refresh');
      case 'ready':
        return t('tip.release_to_refresh');
      case 'refreshing':
        return t('tip.refreshing');
      default:
        return '';
    }
  };

  // 如果动画禁用，使用简化版本
  if (!isAnimationEnabled) {
    return (
      <div ref={containerRef} className={cn('overflow-auto', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 刷新指示器 */}
      <m.div
        style={{ 
          y: springY,
          opacity,
        }}
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center h-16 -mt-16 pointer-events-none"
      >
        {pullState === 'refreshing' ? (
          <RiLoader4Line className="w-6 h-6 text-primary-500 animate-spin" />
        ) : (
          <m.div style={{ rotate: rotation, scale }}>
            <RiArrowDownLine className="w-6 h-6 text-primary-500" />
          </m.div>
        )}
        <m.span 
          style={{ opacity }}
          className="mt-1 text-xs text-neutral-500"
        >
          {getHintText()}
        </m.span>
      </m.div>

      {/* 内容区域 */}
      <m.div
        style={{ y: springY }}
        className="min-h-full"
      >
        {children}
      </m.div>
    </div>
  );
}

/**
 * 上拉加载组件属性
 */
export interface InfiniteScrollProps {
  /** 子内容 */
  children: ReactNode;
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 是否正在加载 */
  loading: boolean;
  /** 加载更多回调 */
  onLoadMore: () => void;
  /** 自定义类名 */
  className?: string;
  /** 加载触发阈值（距离底部多少像素时触发） */
  threshold?: number;
}

/**
 * InfiniteScroll 上拉加载组件
 * @description 依据：开发文档.md 第12.6.6节 - 上拉加载
 * 
 * @example
 * ```tsx
 * <InfiniteScroll
 *   hasMore={hasNextPage}
 *   loading={isFetchingNextPage}
 *   onLoadMore={fetchNextPage}
 * >
 *   <ProductList products={products} />
 * </InfiniteScroll>
 * ```
 */
export function InfiniteScroll({
  children,
  hasMore,
  loading,
  onLoadMore,
  className,
  threshold = 200,
}: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);
  const t = useText();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 当观察目标进入视口，且有更多数据，且未在加载中时，触发加载
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      {
        rootMargin: `0px 0px ${threshold}px 0px`,
        threshold: 0.1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore, threshold]);

  return (
    <div className={className}>
      {children}

      {/* 加载指示器 / 无更多数据提示 */}
      <div ref={observerRef} className="py-6 flex items-center justify-center">
        {loading ? (
          <div className="flex items-center gap-2">
            <RiLoader4Line className="w-5 h-5 text-primary-500 animate-spin" />
            <span className="text-sm text-neutral-500">
              {t('tip.loading')}
            </span>
          </div>
        ) : !hasMore ? (
          <span className="text-sm text-neutral-400">
            {t('tip.no_more_data')}
          </span>
        ) : null}
      </div>
    </div>
  );
}
