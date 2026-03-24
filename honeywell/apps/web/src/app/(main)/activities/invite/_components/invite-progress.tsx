/**
 * @file 进度区组件 - 2026高端美学升级版
 * @description 深色Hero风格进度区，展示当前有效邀请数量
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第4.4节
 */

'use client';

import { m, LazyMotion, domAnimation } from 'motion/react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RiArrowRightSLine, RiTeamFill, RiUserAddFill } from '@remixicon/react';

/**
 * 进度区组件属性
 */
interface InviteProgressProps {
  /** 有效邀请人数 */
  validInviteCount: number;
  /** 是否播放数字动画 */
  animate?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * InviteProgress 进度区组件 - 2026高端美学版
 * @description 深色Hero风格，展示当前有效邀请数量
 * 依据：03.11.3-拉新裂变活动页.md 第4.4节
 * 
 * 设计特色：
 * - 深色暖色调背景 card-hero-dark
 * - 发光数字展示
 * - 浮动装饰粒子
 * - 毛玻璃内层卡片
 */
export function InviteProgress({ 
  validInviteCount, 
  animate = true,
  className 
}: InviteProgressProps) {
  const t = useText();
  const router = useRouter();
  const { isAnimationEnabled } = useAnimationConfig();

  const shouldAnimate = animate && isAnimationEnabled;

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn('px-4 pt-6 pb-10', className)}>
        <div className="max-w-2xl mx-auto">
          {/* 深色Hero卡片 */}
          <m.div
            initial={isAnimationEnabled ? { opacity: 0, y: -20, scale: 0.97 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={SPRINGS.gentle}
            className="card-hero-dark p-6 shadow-dark-card shimmer-overlay"
          >
            {/* 装饰性光晕 */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(var(--color-primary-rgb),0.6) 0%, transparent 70%)' }}
            />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-15 blur-2xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(var(--color-gold-rgb),0.5) 0%, transparent 70%)' }}
            />

            {/* 标题区 */}
            <div className="relative z-10 flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <RiUserAddFill className="w-4 h-4 text-primary-400" />
              </div>
              <h2 className="text-sm font-medium text-white/70">
                {t('invite.progress_title')}
              </h2>
            </div>

            {/* 邀请数字 - 核心焦点，大号发光数字 */}
            <div className="relative z-10 flex justify-center mb-3">
              <div className="relative">
                {/* 数字发光效果 */}
                <div className="absolute inset-0 flex items-center justify-center blur-xl opacity-50">
                  <span className="text-6xl font-bold text-primary-400">
                    {validInviteCount}
                  </span>
                </div>
                {/* 主数字 */}
                <div className="relative text-6xl font-bold text-gradient-primary text-center tabular-nums leading-none py-2">
                  {shouldAnimate ? (
                    <AnimatedNumber value={validInviteCount} decimals={0} />
                  ) : (
                    validInviteCount
                  )}
                </div>
              </div>
            </div>

            {/* 标签 */}
            <p className="relative z-10 text-sm text-white/50 text-center mb-5">
              {t('invite.valid_count')}
            </p>

            {/* 团队入口 - 毛玻璃风格按钮 */}
            <m.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/team')}
              className="relative z-10 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/12 transition-all"
            >
              <RiTeamFill className="w-4 h-4" />
              {t('invite.go_team')}
              <RiArrowRightSLine className="w-4 h-4" />
            </m.button>
          </m.div>
        </div>
      </div>
    </LazyMotion>
  );
}
