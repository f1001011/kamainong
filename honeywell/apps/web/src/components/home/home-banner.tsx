/**
 * @file 首页轮播 Banner 组件
 * @description "Obsidian Aurora 5.0" - Magic UI 增强版 Banner 轮播
 * 增强效果：
 * - 更精致的圆角 + 多层阴影（立体悬浮感）
 * - 高级指示器动画（发光脉冲 + 进度条）
 * - 切换按钮毛玻璃效果
 * - 图片切换时的高级过渡（缩放 + 淡入淡出）
 * - 卡片边框微光
 *
 * @depends 开发文档.md 第12.3节 - 首页 Banner 轮播
 * @depends 01.2-动画系统.md 第四节 - 淡入淡出变体
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/react';
import { fadeVariants } from '@/lib/animation/variants';
import { DURATIONS, SPRINGS } from '@/lib/animation/constants';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Banner 跳转类型
 * @description 依据：02.1-数据库设计.md 第2.8节 - BannerLinkType 枚举
 */
export type BannerLinkType = 'NONE' | 'INTERNAL' | 'EXTERNAL' | 'PRODUCT';

/**
 * Banner 数据类型
 * @description 依据：/api/banners 接口返回结构
 * 注意：isActive 和 sortOrder 字段由后端过滤和排序，前端不需要
 */
export interface BannerItem {
  /** Banner ID */
  id: number;
  /** 图片 URL */
  imageUrl: string;
  /** 跳转类型：NONE=无跳转，INTERNAL=内部页面，EXTERNAL=外部链接，PRODUCT=产品详情 */
  linkType: BannerLinkType;
  /** 跳转链接（linkType 为 INTERNAL/EXTERNAL 时使用） */
  linkUrl?: string | null;
  /** 产品 ID（linkType 为 PRODUCT 时使用） */
  productId?: number | null;
}

/**
 * 轮播 Banner 组件属性
 */
export interface HomeBannerProps {
  /** Banner 列表 */
  banners?: BannerItem[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自动轮播间隔（毫秒），0 表示不自动轮播 */
  autoPlayInterval?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 首页轮播 Banner 组件
 * @description "Obsidian Aurora 5.0" - Magic UI 增强轮播
 */
export function HomeBanner({
  banners = [],
  isLoading = false,
  autoPlayInterval = 5000,
  className,
}: HomeBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const { isAnimationEnabled, getDuration } = useAnimationConfig();
  const t = useText();

  // 自动轮播
  useEffect(() => {
    if (!autoPlayInterval || banners.length <= 1) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [autoPlayInterval, banners.length]);

  // 切换到上一张
  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // 切换到下一张
  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // 切换到指定索引
  const goToIndex = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  // 加载状态
  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <Skeleton
          className="w-full aspect-[2.5/1] rounded-2xl"
        />
      </div>
    );
  }

  // 无数据状态
  if (!banners.length) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  // 增强滑动变体 - 添加缩放效果
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 1.02,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
    }),
  };

  /**
   * 获取 Banner 跳转链接
   * @description 依据：03.2.1-首页.md 第2.2节 - Banner 点击跳转
   */
  const getBannerHref = (banner: BannerItem): string | null => {
    switch (banner.linkType) {
      case 'INTERNAL':
      case 'EXTERNAL':
        return banner.linkUrl || null;
      case 'PRODUCT':
        return banner.productId ? `/products/${banner.productId}` : null;
      case 'NONE':
      default:
        return null;
    }
  };

  const bannerHref = getBannerHref(currentBanner);

  const BannerImage = (
    <m.div
      key={currentBanner.id}
      custom={direction}
      variants={isAnimationEnabled ? slideVariants : fadeVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: SPRINGS.gentle,
        opacity: { duration: getDuration(DURATIONS.normal) / 1000 },
        scale: { duration: 0.4, ease: 'easeOut' },
      }}
      className="absolute inset-0"
    >
      <Image
        src={currentBanner.imageUrl}
        alt={`Banner ${currentIndex + 1}`}
        fill
        className="object-cover rounded-2xl"
        priority={currentIndex === 0}
        sizes="(max-width: 768px) 100vw, 800px"
      />
    </m.div>
  );

  const BannerContent = (
    <div
      className={cn(
        'relative aspect-[2.5/1] rounded-2xl overflow-hidden',
        /* 多层阴影 - 悬浮立体感 */
        'shadow-[0_4px_16px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.08)]',
        /* 精细边框 */
        'ring-1 ring-black/[0.04]',
        className
      )}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        {bannerHref ? (
          currentBanner.linkType === 'EXTERNAL' ? (
            // 外部链接使用 a 标签
            <a
              href={bannerHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block absolute inset-0"
            >
              {BannerImage}
            </a>
          ) : (
            // 内部链接使用 Link 组件
            <Link
              href={bannerHref}
              className="block absolute inset-0"
            >
              {BannerImage}
            </Link>
          )
        ) : (
          BannerImage
        )}
      </AnimatePresence>

      {/* 底部渐变遮罩 - 让指示器更清晰 */}
      {banners.length > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)' }}
        />
      )}

      {/* 左右切换按钮 - 毛玻璃效果 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className={cn(
              'hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8',
              'items-center justify-center rounded-full',
              'bg-white/60 backdrop-blur-md hover:bg-white/80',
              'shadow-[0_2px_8px_rgba(0,0,0,0.1)]',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              'hover:scale-105 active:scale-95'
            )}
            aria-label={t('aria.prev_slide')}
          >
            <RiArrowLeftSLine className="w-5 h-5 text-neutral-700" />
          </button>
          <button
            onClick={goToNext}
            className={cn(
              'hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8',
              'items-center justify-center rounded-full',
              'bg-white/60 backdrop-blur-md hover:bg-white/80',
              'shadow-[0_2px_8px_rgba(0,0,0,0.1)]',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              'hover:scale-105 active:scale-95'
            )}
            aria-label={t('aria.next_slide')}
          >
            <RiArrowRightSLine className="w-5 h-5 text-neutral-700" />
          </button>
        </>
      )}

      {/* ★ 高级指示器 - 胶囊进度条 + 发光效果 */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'relative rounded-full transition-all duration-400 ease-out',
                index === currentIndex
                  ? 'w-5 h-[5px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                  : 'w-[5px] h-[5px] bg-white/50 hover:bg-white/70'
              )}
              aria-label={t.withVars('aria.go_to_slide', { number: index + 1 })}
              aria-current={index === currentIndex ? 'true' : 'false'}
            >
              {/* 当前指示器的进度动画 */}
              {index === currentIndex && isAnimationEnabled && autoPlayInterval > 0 && (
                <m.div
                  className="absolute inset-0 rounded-full bg-white/80"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'left center' }}
                  key={`progress-${currentIndex}`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return <div className="group">{BannerContent}</div>;
}
