/**
 * @file SVIP签到区域组件
 * @description 紫色尊贵风格的SVIP签到专区，展示双倍奖励
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 */

'use client';

import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfigStore } from '@/stores';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { SPRINGS } from '@/lib/animation/constants';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { RiVipCrownLine, RiCheckDoubleLine, RiStarFill } from '@remixicon/react';
import type { SvipSignInStatus } from '@/types/signin';

/**
 * SVIP签到区域属性
 */
export interface SvipSignInSectionProps {
  /** SVIP签到状态 */
  svipStatus: SvipSignInStatus;
  /** 点击签到回调 */
  onSignIn?: () => void;
  /** 是否正在签到 */
  isLoading?: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * SVIP签到区域组件
 * @description 紫色主题，尊贵感设计，展示SVIP专属双倍奖励
 */
export function SvipSignInSection({
  svipStatus,
  onSignIn,
  isLoading = false,
  className,
}: SvipSignInSectionProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';
  
  const { available, todaySigned, reward, svipLevel } = svipStatus;

  // 是否可以签到
  const canSign = available && !todaySigned;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRINGS.gentle}
        className={cn(
          'relative overflow-hidden rounded-2xl',
          'bg-gradient-to-br from-primary-500/20 via-primary-600/10 to-primary-700/20',
          'border border-primary-500/30',
          'p-4',
          className
        )}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* 光晕效果 */}
          <div className="absolute -top-12 -right-12 size-32 bg-primary-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 size-24 bg-primary-600/15 rounded-full blur-2xl" />
          
          {/* 星星装饰 */}
          <m.div
            className="absolute top-4 right-4 text-primary-400/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <RiStarFill className="size-3" />
          </m.div>
          <m.div
            className="absolute bottom-6 right-8 text-primary-400/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <RiStarFill className="size-2" />
          </m.div>
        </div>

        {/* 内容区域 */}
        <div className="relative z-10">
          {/* 标题行 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary-500/20">
                <RiVipCrownLine className="size-5 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-primary-100">
                  SVIP{svipLevel} {t('signin.svip.title')}
                </h3>
                <p className="text-xs text-primary-300/70">
                  {t('signin.svip.subtitle')}
                </p>
              </div>
            </div>

            {/* 状态标签 */}
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
                todaySigned
                  ? 'bg-primary-500/20 text-primary-300'
                  : 'bg-primary-500/30 text-primary-200'
              )}
            >
              {todaySigned ? (
                <>
                  <RiCheckDoubleLine className="size-3.5" />
                  <span>{t('signin.claimed')}</span>
                </>
              ) : (
                <span>{t('signin.available')}</span>
              )}
            </div>
          </div>

          {/* 奖励展示 */}
          <div className="flex items-center justify-between">
            {/* 奖励金额 */}
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-primary-300/70">
                {t('signin.svip.reward')}:
              </span>
              <span className="text-2xl font-bold text-primary-200">
                +{currencySymbol}{reward}
              </span>
            </div>

            {/* 签到按钮 */}
            {canSign ? (
              <PulseWrapper type="glow" color="custom" customColor="rgba(167, 139, 250, 0.5)" enabled={!isLoading}>
                <button
                  onClick={onSignIn}
                  disabled={isLoading}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl',
                    'bg-gradient-to-r from-primary-500 to-primary-600',
                    'text-white font-medium text-sm',
                    'shadow-lg shadow-primary-500/30',
                    'hover:from-primary-400 hover:to-primary-500',
                    'active:scale-95 transition-all',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  <RiVipCrownLine className="size-4" />
                  <span>{t('signin.btn.claim')}</span>
                </button>
              </PulseWrapper>
            ) : todaySigned ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-300/60">
                <RiCheckDoubleLine className="size-4" />
                <span className="text-sm">{t('signin.claimed')}</span>
              </div>
            ) : null}
          </div>
        </div>
      </m.div>
    </LazyMotion>
  );
}

/**
 * SVIP签到徽章组件
 * @description 用于显示在普通签到区域，提示用户升级SVIP可获得双倍奖励
 */
export interface SvipUpgradeBadgeProps {
  /** 自定义样式 */
  className?: string;
}

/**
 * SVIP升级提示徽章
 */
export function SvipUpgradeBadge({ className }: SvipUpgradeBadgeProps) {
  const t = useText();

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-gradient-to-r from-primary-500/20 to-primary-600/20',
        'border border-primary-500/30',
        'text-primary-400 text-xs',
        className
      )}
    >
      <RiVipCrownLine className="size-3.5" />
      <span>{t('signin.svip.upgrade')}</span>
    </div>
  );
}
