/**
 * @file Hero区域组件
 * @description 关于我们页顶部品牌视觉区域 - 沉浸式企业级设计
 * 支持可选背景图片（Unsplash 等）+ 多层渐变叠加
 */

'use client';

import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * Hero内容类型
 */
export interface HeroContent {
  title: string;
  subtitle: string;
  logoUrl?: string;
  backgroundImage?: string;
}

interface AboutHeroProps {
  hero: HeroContent;
}

/**
 * 沉浸式 Hero 区域
 * 可选背景图片 + 深色渐变覆盖 + 几何装饰 + 品牌标语
 */
export function AboutHero({ hero }: AboutHeroProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <section className="relative overflow-hidden">
      {/* 背景图片层（可选） */}
      {hero.backgroundImage && (
        <div className="absolute inset-0">
          <img
            src={hero.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(160deg, rgba(var(--color-dark-rgb,15,23,42), 0.92) 0%, rgba(var(--color-dark-rgb,15,23,42), 0.85) 30%, rgba(var(--color-primary-rgb), 0.7) 60%, rgba(var(--color-primary-rgb), 0.6) 100%)',
            }}
          />
        </div>
      )}

      {/* 纯渐变背景（无背景图时使用） */}
      {!hero.backgroundImage && (
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, var(--color-dark-900) 0%, var(--color-dark-800) 15%, var(--color-primary-700) 35%, var(--color-primary-600) 55%, var(--color-primary-500) 75%, var(--color-primary-400) 100%)',
          }}
        />
      )}

      {/* 噪点纹理层 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          backgroundSize: '256px 256px',
        }}
      />

      {/* 装饰光晕 */}
      <div
        className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)' }}
      />
      <div
        className="absolute bottom-0 -left-20 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.06) 0%, transparent 60%)' }}
      />

      {/* 几何装饰 */}
      <div className="absolute top-[20%] right-[8%] w-32 h-32 rounded-full border border-white/[0.06] pointer-events-none" />
      <div className="absolute top-[50%] right-[25%] w-20 h-20 rounded-full border border-white/[0.04] pointer-events-none" />
      <div className="absolute top-[15%] left-[12%] w-16 h-16 rounded-full border border-white/[0.03] pointer-events-none" />

      {/* 斜向装饰线 */}
      <div
        className="absolute top-[30%] right-0 w-[60%] h-[1px] pointer-events-none rotate-[-6deg] origin-right"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.06) 60%, transparent)' }}
      />

      {/* 底部金色分割线 + 波浪过渡 */}
      <div
        className="absolute bottom-6 left-0 right-0 h-[1px] z-20 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 5%, rgba(var(--color-gold-rgb), 0.2) 30%, rgba(var(--color-gold-rgb), 0.3) 50%, rgba(var(--color-gold-rgb), 0.2) 70%, transparent 95%)',
        }}
      />
      <svg
        className="absolute bottom-0 left-0 w-full h-6 md:h-8"
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M0,36 C240,12 480,4 720,20 C960,36 1200,44 1440,24 L1440,48 L0,48 Z"
          fill="rgba(255,255,255,0.5)"
        />
        <path
          d="M0,32 C360,8 540,0 720,16 C900,32 1080,48 1440,20 L1440,48 L0,48 Z"
          fill="white"
        />
      </svg>

      {/* Hero 内容 */}
      <div className="relative z-10 pt-16 pb-24 md:pt-20 md:pb-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* 品牌Logo */}
          {hero.logoUrl && (
            <m.div
              className="flex justify-center mb-8"
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.8 } : undefined}
              animate={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
              transition={{ ...SPRINGS.bouncy }}
            >
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/10 ring-1 ring-white/10">
                <img
                  src={hero.logoUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </m.div>
          )}

          {/* 品牌标语 */}
          <m.h1
            className={cn(
              'text-[26px] md:text-5xl font-bold',
              'text-white',
              'max-w-lg mx-auto',
              'leading-tight tracking-tight',
              'drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
            )}
            initial={isAnimationEnabled ? { opacity: 0, y: 30 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
            transition={{ ...SPRINGS.gentle, delay: 0.1 }}
          >
            {hero.title}
          </m.h1>

          {/* 副标题 */}
          <m.p
            className={cn(
              'mt-5 text-[14.5px] md:text-lg',
              'text-white/70',
              'max-w-md mx-auto',
              'leading-relaxed',
            )}
            initial={isAnimationEnabled ? { opacity: 0, y: 20 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
            transition={{ ...SPRINGS.gentle, delay: 0.2 }}
          >
            {hero.subtitle}
          </m.p>

          {/* 装饰分割线 */}
          <m.div
            className="mt-8 flex justify-center items-center gap-2"
            initial={isAnimationEnabled ? { opacity: 0, scaleX: 0 } : undefined}
            animate={isAnimationEnabled ? { opacity: 1, scaleX: 1 } : undefined}
            transition={{ ...SPRINGS.gentle, delay: 0.35 }}
          >
            <div className="w-8 h-[1px] rounded-full bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-400/60" />
            <div className="w-8 h-[1px] rounded-full bg-white/20" />
          </m.div>
        </div>
      </div>
    </section>
  );
}
