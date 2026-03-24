/**
 * @file 成功奖励弹窗组件
 * @description 精美的全屏庆祝弹窗，用于注册赠送、购买成功、签到奖励等场景
 * 集成 AnimatedCheckmark + SparkleBackground + Confetti + CoinFly + AnimatedNumber
 * @depends 开发文档/01-设计系统/01.2-动画系统.md - 第九节 特殊效果动画
 * @depends 开发文档/01-设计系统/01.3-组件规范.md - 第十一节 响应式弹窗动画
 * 
 * 所有文案通过 useText 获取，无固定硬编码
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { SPRINGS, DURATIONS } from '@/lib/animation/constants';
import { overlayVariants } from '@/lib/animation/variants';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Button } from '@/components/ui/button';
import { AnimatedCheckmark } from './animated-checkmark';
import { SparkleBackground, LightRays } from './sparkle-background';
import { useConfetti } from './confetti';
import { RiCloseLine } from '@remixicon/react';
import { haptic } from '@/lib/haptic';

/**
 * 奖励弹窗场景类型
 */
export type RewardScene =
  | 'register'      // 注册成功赠送
  | 'purchase'      // 购买产品成功
  | 'signin'        // 签到奖励
  | 'invite'        // 邀请奖励
  | 'vip_upgrade'   // VIP 升级奖励
  | 'custom';       // 自定义场景

/**
 * 奖励弹窗属性
 */
export interface SuccessRewardModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 场景类型 */
  scene: RewardScene;
  /** 奖励金额 */
  amount?: number | string;
  /** 主标题（可选，覆盖场景默认标题） */
  title?: string;
  /** 副标题/描述 */
  subtitle?: string;
  /** 额外描述文字 */
  description?: string;
  /** 主操作按钮文案 */
  primaryButtonText?: string;
  /** 主操作按钮回调 */
  onPrimaryAction?: () => void;
  /** 次操作按钮文案 */
  secondaryButtonText?: string;
  /** 次操作按钮回调 */
  onSecondaryAction?: () => void;
  /** 勾选颜色主题 */
  checkmarkTheme?: 'success' | 'primary' | 'gold';
  /** 是否显示礼花 */
  showConfetti?: boolean;
  /** 是否显示星光粒子 */
  showSparkles?: boolean;
  /** 是否显示光线 */
  showLightRays?: boolean;
  /** 自定义图标/内容（替代 checkmark） */
  customIcon?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
  /** 自动关闭时间（毫秒，0=不自动关闭） */
  autoCloseDelay?: number;
}

/**
 * SuccessRewardModal 成功奖励弹窗
 * @description 高端精美的庆祝弹窗，整合多重动画效果
 * 
 * 动画时序编排：
 * 0.0s - 遮罩层淡入
 * 0.1s - 弹窗缩放入场
 * 0.2s - 光线/星光开始
 * 0.3s - 勾选动画开始绘制
 * 0.8s - 勾选完成，标题淡入
 * 1.0s - 金额数字滚动开始
 * 1.2s - 副标题淡入
 * 1.5s - 按钮区域入场
 * 1.5s - 礼花效果触发
 * 
 * @example
 * ```tsx
 * <SuccessRewardModal
 *   open={showReward}
 *   onClose={() => setShowReward(false)}
 *   scene="register"
 *   amount={20}
 *   onPrimaryAction={() => router.push('/')}
 * />
 * ```
 */
export function SuccessRewardModal({
  open,
  onClose,
  scene,
  amount,
  title,
  subtitle,
  description,
  primaryButtonText,
  onPrimaryAction,
  secondaryButtonText,
  onSecondaryAction,
  checkmarkTheme = 'success',
  showConfetti = true,
  showSparkles = true,
  showLightRays = true,
  customIcon,
  className,
  autoCloseDelay = 0,
}: SuccessRewardModalProps) {
  const t = useText();
  const { isAnimationEnabled, getDuration } = useAnimationConfig();
  const { config } = useGlobalConfig();
  const { triggerBurst } = useConfetti();
  const confettiTriggered = useRef(false);
  const currencySymbol = config.currencySymbol || 'د.م.';

  // 解析金额
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  const hasAmount = numericAmount > 0;

  // ========================================
  // 场景默认配置
  // 所有文案通过 t() 从后台获取，无硬编码
  // ========================================
  const sceneConfig = getSceneConfig(scene, t, currencySymbol, numericAmount);

  // 合并配置
  const finalTitle = title || sceneConfig.title;
  const finalSubtitle = subtitle || sceneConfig.subtitle;
  const finalPrimaryText = primaryButtonText || sceneConfig.primaryButtonText;
  const finalSecondaryText = secondaryButtonText || sceneConfig.secondaryButtonText;
  const finalCheckTheme = checkmarkTheme || sceneConfig.checkmarkTheme;

  // ========================================
  // 礼花效果 + 触觉反馈 - 打开时触发一次
  // ========================================
  useEffect(() => {
    if (open && !confettiTriggered.current) {
      confettiTriggered.current = true;
      
      // 触觉反馈 - 成功庆祝
      haptic('success');
      
      if (showConfetti && isAnimationEnabled) {
        const timer = setTimeout(() => {
          triggerBurst();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
    if (!open) {
      confettiTriggered.current = false;
    }
  }, [open, showConfetti, isAnimationEnabled, triggerBurst]);

  // ========================================
  // 自动关闭
  // ========================================
  useEffect(() => {
    if (open && autoCloseDelay > 0) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [open, autoCloseDelay, onClose]);

  /**
   * 主操作处理
   */
  const handlePrimaryAction = useCallback(() => {
    if (onPrimaryAction) {
      onPrimaryAction();
    } else {
      onClose();
    }
  }, [onPrimaryAction, onClose]);

  /**
   * 次操作处理
   */
  const handleSecondaryAction = useCallback(() => {
    if (onSecondaryAction) {
      onSecondaryAction();
    } else {
      onClose();
    }
  }, [onSecondaryAction, onClose]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {open && (
          <>
            {/* 遮罩层 */}
            <m.div
              className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
              variants={overlayVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={onClose}
            />

            {/* 弹窗主体 */}
            <m.div
              className={cn(
                'fixed left-1/2 top-1/2 z-[101] w-[calc(100%-40px)] max-w-sm',
                '-translate-x-1/2 -translate-y-1/2',
                'rounded-3xl bg-white shadow-soft-lg overflow-hidden',
                className
              )}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{
                ...SPRINGS.bouncy,
                delay: getDuration(0.1),
              }}
            >
              {/* 关闭按钮 */}
              <m.button
                className="absolute top-3 right-3 z-20 rounded-full p-2 text-neutral-400 hover:bg-neutral-100 transition-colors"
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: getDuration(1.5) }}
                aria-label={t('aria.close')}
              >
                <RiCloseLine className="size-5" />
              </m.button>

              {/* 上半部分 - 动画展示区 */}
              <div className="relative pt-10 pb-6 px-6 overflow-hidden">
                {/* 渐变背景 */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary-50/80 via-white to-white" />

                {/* 光线射线效果 */}
                {showLightRays && <LightRays rayCount={12} color="rgba(var(--color-primary-rgb), 0.06)" />}

                {/* 星光粒子效果 */}
                {showSparkles && <SparkleBackground count={18} color="gold" sizeRange={[2, 5]} />}

                {/* 居中内容 */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* 勾选动画 / 自定义图标 */}
                  {customIcon || (
                    <AnimatedCheckmark
                      size="lg"
                      theme={finalCheckTheme}
                      delay={0.3}
                      showRing
                    />
                  )}

                  {/* 主标题 */}
                  <m.h2
                    className="mt-5 text-xl font-bold text-foreground text-center"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...SPRINGS.gentle,
                      delay: getDuration(0.8),
                    }}
                  >
                    {finalTitle}
                  </m.h2>

                  {/* 金额展示 */}
                  {hasAmount && (
                    <m.div
                      className="mt-4 flex items-baseline gap-1"
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        ...SPRINGS.bouncy,
                        delay: getDuration(1.0),
                      }}
                    >
                      <span className="text-lg font-semibold text-primary-500">+</span>
                      <span className="text-sm font-medium text-primary-500 mr-0.5">
                        {currencySymbol}
                      </span>
                      <AnimatedNumber
                        value={numericAmount}
                        decimals={config?.currencyDecimals ?? 0}
                        duration={1.2}
                        className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600 tabular-nums"
                      />
                    </m.div>
                  )}

                  {/* 副标题 */}
                  {finalSubtitle && (
                    <m.p
                      className="mt-3 text-sm text-neutral-500 text-center max-w-[260px]"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: getDuration(DURATIONS.normal),
                        delay: getDuration(1.2),
                      }}
                    >
                      {finalSubtitle}
                    </m.p>
                  )}

                  {/* 描述文案 */}
                  {description && (
                    <m.p
                      className="mt-2 text-xs text-neutral-400 text-center max-w-[240px]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: getDuration(DURATIONS.normal),
                        delay: getDuration(1.4),
                      }}
                    >
                      {description}
                    </m.p>
                  )}
                </div>
              </div>

              {/* 下半部分 - 操作区域 */}
              <m.div
                className="px-6 pb-6 space-y-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...SPRINGS.gentle,
                  delay: getDuration(1.5),
                }}
              >
                {/* 分隔线 */}
                <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

                {/* 主操作按钮 */}
                <Button
                  className={cn(
                    'w-full h-12 rounded-xl font-semibold text-base',
                    'bg-gradient-to-r from-primary-500 to-primary-600',
                    'shadow-glow-sm hover:shadow-glow',
                    'text-white'
                  )}
                  onClick={handlePrimaryAction}
                >
                  {finalPrimaryText}
                </Button>

                {/* 次操作按钮 */}
                {finalSecondaryText && (
                  <button
                    className="w-full py-2 text-sm text-neutral-500 hover:text-primary-500 transition-colors text-center"
                    onClick={handleSecondaryAction}
                  >
                    {finalSecondaryText}
                  </button>
                )}
              </m.div>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}

/**
 * 获取场景默认配置
 * @description 所有文案通过 t() 从后台获取，无硬编码
 */
function getSceneConfig(
  scene: RewardScene,
  t: ReturnType<typeof useText>,
  currencySymbol: string,
  amount: number
) {
  switch (scene) {
    case 'register':
      return {
        title: t('reward.register_title'),
        subtitle: t.withVars('reward.register_subtitle', {
          amount: `${currencySymbol} ${Math.round(amount)}`,
        }),
        primaryButtonText: t('reward.register_primary'),
        secondaryButtonText: t('reward.register_secondary'),
        checkmarkTheme: 'success' as const,
      };

    case 'purchase':
      return {
        title: t('reward.purchase_title'),
        subtitle: t('reward.purchase_subtitle'),
        primaryButtonText: t('reward.purchase_primary'),
        secondaryButtonText: t('reward.purchase_secondary'),
        checkmarkTheme: 'primary' as const,
      };

    case 'signin':
      return {
        title: t('reward.signin_title'),
        subtitle: t.withVars('reward.signin_subtitle', {
          amount: `${currencySymbol} ${Math.round(amount)}`,
        }),
        primaryButtonText: t('reward.signin_primary'),
        secondaryButtonText: undefined,
        checkmarkTheme: 'gold' as const,
      };

    case 'invite':
      return {
        title: t('reward.invite_title'),
        subtitle: t('reward.invite_subtitle'),
        primaryButtonText: t('reward.invite_primary'),
        secondaryButtonText: t('reward.invite_secondary'),
        checkmarkTheme: 'gold' as const,
      };

    case 'vip_upgrade':
      return {
        title: t('reward.vip_title'),
        subtitle: t('reward.vip_subtitle'),
        primaryButtonText: t('reward.vip_primary'),
        secondaryButtonText: undefined,
        checkmarkTheme: 'gold' as const,
      };

    default:
      return {
        title: t('reward.default_title'),
        subtitle: '',
        primaryButtonText: t('btn.confirm'),
        secondaryButtonText: undefined,
        checkmarkTheme: 'success' as const,
      };
  }
}
