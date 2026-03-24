/**
 * @file 签到弹窗组件
 * @description 签到功能主弹窗，整合普通签到、VIP签到、SVIP签到
 * 2026高端美学 - 丝滑动画 + 触觉反馈 + AnimatedNumber + 状态切换动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfigStore } from '@/stores';
import { useSignInStatus, useSignIn, useSignInRecords } from '@/hooks/use-signin';
import type { SignInResult, SignInRecord } from '@/types/signin';
import { haptic } from '@/lib/haptic';

// UI 组件
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// 签到组件
import { SignInCalendar, SignInProgress } from '@/components/signin/signin-calendar';
import { SvipSignInSection, SvipUpgradeBadge } from '@/components/signin';
import { canSignInToday } from '@/types/signin';

// 动效组件
import { useConfetti } from '@/components/effects/confetti';
import { useCoinFly } from '@/components/effects/coin-fly';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { AnimatedCheckmark } from '@/components/effects/animated-checkmark';
import { SparkleBackground, LightRays } from '@/components/effects/sparkle-background';

// 图标
import { 
  RiCalendarCheckLine, 
  RiGiftFill, 
  RiCheckDoubleLine,
  RiTimeLine,
  RiAlertLine,
  RiArrowRightSLine,
  RiCheckboxCircleFill,
  RiShoppingBag3Line,
  RiSparklingLine,
  RiCoinsFill,
} from '@remixicon/react';

// 动画
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { SPRINGS } from '@/lib/animation/constants';

// 通知
import { toast } from 'sonner';

/**
 * 签到弹窗属性
 */
export interface SignInModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 签到弹窗组件
 * @description 复用 ResponsiveModal，整合庆祝动画 + 触觉反馈
 */
export function SignInModal({ open, onClose }: SignInModalProps) {
  const t = useText();
  const router = useRouter();
  const { config } = useGlobalConfigStore();
  
  // 签到按钮引用（用于金币飞入动画起点）
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  
  // 签到结果状态（用于展示成功动画）
  const [signInResult, setSignInResult] = useState<SignInResult | null>(null);
  
  // 数据获取
  const { data: status, isLoading: isStatusLoading } = useSignInStatus();
  const { data: records } = useSignInRecords(7);
  const signInMutation = useSignIn();
  
  // 动效 Hooks
  const { triggerConfetti, triggerBurst } = useConfetti();
  const { triggerCoinFly, CoinFlyPortal, activeCoins } = useCoinFly();
  const isAnimating = activeCoins > 0;

  // 关闭弹窗时重置结果
  useEffect(() => {
    if (!open) {
      setSignInResult(null);
    }
  }, [open]);

  // 签到状态
  const normalSignIn = status?.normalSignIn;
  const svipSignIn = status?.svipSignIn;
  
  // 判断是否可以签到（包含普通+SVIP逻辑）
  const canSign = status ? canSignInToday(status) : false;

  // 是否显示签到完成/过期状态（需要购买引导）
  const showCompletedState = normalSignIn && 
    (normalSignIn.completed || normalSignIn.windowExpired);

  /**
   * 执行签到
   * @description 触觉反馈 + 金币飞入 + 礼花 + 成功提示
   */
  const handleSignIn = useCallback(async () => {
    if (!signInButtonRef.current) return;
    
    // 触觉反馈 - 按下
    haptic('medium');
    
    try {
      const result = await signInMutation.mutateAsync();
      
      // 保存结果用于展示
      setSignInResult(result);
      
      // 触觉反馈 - 成功
      haptic('success');
      
      // 触发庆祝动画编排
      // 1. 金币飞入动画（使用按钮元素作为起始位置）
      triggerCoinFly(signInButtonRef.current);
      
      // 2. 礼花动画（延迟触发，配合金币飞行节奏）
      setTimeout(() => {
        triggerBurst();
      }, 400);
      
      // 3. 大礼花（多重奖励时，额外庆祝）
      if (result.rewards.length > 1) {
        setTimeout(() => {
          triggerConfetti();
        }, 800);
      }

      // 成功提示
      const symbol = config?.currencySymbol || 'د.م.';
      toast.success(
        t.withVars('toast.signin_success', { amount: `${symbol}${result.totalAmount}` }),
        { duration: 3000 }
      );
    } catch (error) {
      // 触觉反馈 - 失败
      haptic('error');
      console.error('签到失败:', error);
    }
  }, [signInMutation, triggerCoinFly, triggerBurst, triggerConfetti, t, config?.currencySymbol]);

  /**
   * 前往活动中心
   */
  const handleGoActivities = useCallback(() => {
    haptic('light');
    onClose();
    router.push('/activities');
  }, [onClose, router]);

  /**
   * 前往产品页（购买引导）
   */
  const handleGoBuy = useCallback(() => {
    haptic('light');
    onClose();
    router.push('/products');
  }, [onClose, router]);

  return (
    <>
      {/* 金币飞行动画 Portal */}
      <CoinFlyPortal />

      <ResponsiveModal
        open={open}
        onOpenChange={(isOpen) => !isOpen && onClose()}
        title={t('signin.title', 'تسجيل الحضور')}
      >
        <LazyMotion features={domAnimation}>
          <div className="space-y-4 pb-safe">
            <AnimatePresence mode="wait">
              {/* 加载状态 */}
              {isStatusLoading ? (
                <m.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={SPRINGS.gentle}
                >
                  <SignInModalSkeleton />
                </m.div>
              ) : !status ? (
                <m.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <SignInErrorState onRetry={() => window.location.reload()} />
                </m.div>
              ) : signInResult ? (
                /* 签到成功展示 - 带精美切换动画 */
                <m.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={SPRINGS.bouncy}
                >
                  <SignInSuccessView 
                    result={signInResult} 
                    onClose={onClose}
                    onGoActivities={handleGoActivities}
                    isSvip={signInResult.rewards.some(r => r.type === 'SVIP')}
                  />
                </m.div>
              ) : showCompletedState ? (
                /* 普通用户签到完成/过期状态 */
                <m.div
                  key="completed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={SPRINGS.gentle}
                >
                  <SignInCompletedState
                    type={normalSignIn!.completed ? 'completed' : 'expired'}
                    onGoBuy={handleGoBuy}
                    onGoActivities={handleGoActivities}
                  />
                </m.div>
              ) : (
                /* 签到主界面 */
                <m.div
                  key="main"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={SPRINGS.gentle}
                  className="space-y-4"
                >
                  {/* 普通签到区域 */}
                  <NormalSignInSection
                    status={normalSignIn!}
                    records={records?.records ?? []}
                    canSign={canSign}
                    isLoading={signInMutation.isPending || isAnimating}
                    onSignIn={handleSignIn}
                    buttonRef={signInButtonRef}
                  />

                  {/* SVIP 签到区域（仅 SVIP 用户显示） */}
                  {svipSignIn?.available && (
                    <SvipSignInSection
                      svipStatus={svipSignIn}
                      onSignIn={handleSignIn}
                      isLoading={signInMutation.isPending || isAnimating}
                    />
                  )}

                  {/* 非 SVIP 用户显示升级提示 */}
                  {!svipSignIn?.available && <SvipUpgradeBadge />}

                  {/* 活动中心入口 */}
                  <ActivityCenterLink onClick={handleGoActivities} />
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </LazyMotion>
      </ResponsiveModal>
    </>
  );
}

/**
 * 普通签到区域组件 - 高端美学增强版
 */
interface NormalSignInSectionProps {
  status: NonNullable<ReturnType<typeof useSignInStatus>['data']>['normalSignIn'];
  records: SignInRecord[];
  canSign: boolean;
  isLoading: boolean;
  onSignIn: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

function NormalSignInSection({
  status,
  records,
  canSign,
  isLoading,
  onSignIn,
  buttonRef,
}: NormalSignInSectionProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';

  const showProgress = !status.completed && !status.windowExpired;

  return (
    <div className="space-y-4">
      {/* 奖励展示卡片 - 高端渐变 + 微光动效 */}
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRINGS.gentle}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* 背景渐变层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/12 via-gold-500/8 to-primary-600/12" />
        
        {/* 微光扫过效果 */}
        <m.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />
        
        <div className="relative flex items-center justify-between p-4 border border-primary-500/20 rounded-2xl">
          <div className="flex items-center gap-3">
            {/* 礼物图标 - 渐变背景 + 微缩放动画 */}
            <m.div
              className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-primary-500/25 to-gold-500/20 shadow-sm"
              animate={canSign ? { 
                scale: [1, 1.05, 1],
                rotate: [0, 3, -3, 0],
              } : {}}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <RiGiftFill className="size-6 text-primary-500" />
            </m.div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('signin.daily.reward', 'مكافأة يومية')}
              </p>
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-bold text-primary-500">+</span>
                <span className="text-sm font-semibold text-primary-500">{currencySymbol}</span>
                <AnimatedNumber
                  value={parseFloat(status.reward) || 0}
                  decimals={config?.currencyDecimals ?? 0}
                  duration={0.8}
                  className="text-xl font-bold text-foreground tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* 签到按钮 */}
          {canSign ? (
            <PulseWrapper type="glow" color="primary" enabled={!isLoading}>
              <Button
                ref={buttonRef}
                onClick={onSignIn}
                disabled={isLoading}
                size="lg"
                className={cn(
                  'px-6 rounded-xl',
                  'bg-gradient-to-r from-primary-500 to-primary-600',
                  'shadow-glow shadow-primary-500/30',
                  'active:scale-95 transition-transform'
                )}
              >
                <RiCalendarCheckLine className="size-5 mr-2" />
                {t('signin.btn.checkin', 'تسجيل الحضور')}
              </Button>
            </PulseWrapper>
          ) : status.todaySigned ? (
            <m.div 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-500"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRINGS.bouncy}
            >
              <RiCheckDoubleLine className="size-5" />
              <span className="font-medium">{t('signin.done', 'مكتمل')}</span>
            </m.div>
          ) : null}
        </div>
      </m.div>

      {/* 普通用户：3天签到进度 */}
      {showProgress && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRINGS.gentle, delay: 0.1 }}
        >
          <SignInProgress
            currentStreak={status.currentStreak}
            targetDays={status.targetDays}
            completed={status.completed}
          />
        </m.div>
      )}

      {/* 窗口期剩余天数提示 */}
      {!status.completed && !status.windowExpired && status.remainingWindowDays > 0 && (
        <m.p
          className="text-xs text-warning-600 text-center flex items-center justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <RiTimeLine className="size-3.5" />
          {t.withVars('signin.window_remaining', { remaining: status.remainingWindowDays.toString() })}
        </m.p>
      )}

      {/* 签到日历 */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 0.15 }}
      >
        <SignInCalendar
          records={records}
          currentStreak={status.currentStreak}
          targetDays={status.targetDays}
          dailyReward={status.reward}
          todaySigned={status.todaySigned}
          canSign={canSign}
        />
      </m.div>
    </div>
  );
}

/**
 * 签到成功展示组件 - 高端庆祝动画
 * @description 集成 AnimatedNumber、星光背景、光线射线、精美勾选动画
 */
interface SignInSuccessViewProps {
  result: SignInResult;
  onClose: () => void;
  onGoActivities: () => void;
  isSvip: boolean;
}

function SignInSuccessView({ result, onClose, onGoActivities, isSvip }: SignInSuccessViewProps) {
  const t = useText();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';

  return (
    <div className="relative flex flex-col items-center py-6 space-y-5 overflow-hidden">
      {/* 星光闪烁背景 - 丰富粒子 */}
      <SparkleBackground 
        count={18} 
        color={isSvip ? 'primary' : 'gold'} 
        sizeRange={[2, 6]} 
      />
      
      {/* 光线射线效果 - 增添辉煌感 */}
      <LightRays 
        rayCount={10} 
        color={isSvip ? 'rgba(167, 139, 250, 0.08)' : 'rgba(249, 115, 22, 0.06)'} 
      />

      {/* 精美 SVG 勾选动画 */}
      <m.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
      >
        <AnimatedCheckmark
          size="lg"
          theme={isSvip ? 'primary' : 'success'}
          delay={0.2}
          showRing
        />
      </m.div>

      {/* 成功文案 - 渐入动画编排 */}
      <m.div 
        className="text-center space-y-1.5 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 0.7 }}
      >
        <h3 className="text-xl font-bold text-foreground">
          {t('signin.success', 'تم تسجيل الحضور بنجاح')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {result.signInCompleted
            ? t('signin.normal_completed', 'لقد أكملت مهمة الحضور لمدة 3 أيام')
            : t.withVars('signin.continuous_days', { n: result.newStreak.toString() })}
        </p>
      </m.div>

      {/* 奖励金额展示 - 精美渐变卡片 + AnimatedNumber */}
      <m.div
        className="relative w-full max-w-[280px] overflow-hidden rounded-2xl"
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ ...SPRINGS.bouncy, delay: 0.9 }}
      >
        {/* 卡片背景 */}
        <div className={cn(
          'absolute inset-0',
          isSvip 
            ? 'bg-gradient-to-br from-violet-500/15 via-primary-500/10 to-violet-600/15'
            : 'bg-gradient-to-br from-primary-500/12 via-gold-500/8 to-primary-600/12'
        )} />

        {/* 微光效果 */}
        <m.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 2, delay: 1.2, ease: 'easeInOut' }}
        />

        <div className={cn(
          'relative flex flex-col items-center py-5 px-6 border rounded-2xl',
          isSvip ? 'border-violet-500/20' : 'border-primary-500/20'
        )}>
          {/* 金币图标 */}
          <m.div
            initial={{ rotate: -30, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ ...SPRINGS.bouncy, delay: 1.0 }}
          >
            <RiCoinsFill className={cn(
              'size-8 mb-2',
              isSvip ? 'text-violet-500' : 'text-gold-500'
            )} />
          </m.div>

          {/* 金额 - AnimatedNumber 滚动效果 */}
          <div className="flex items-baseline gap-1">
            <m.span 
              className="text-lg font-bold text-primary-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              +
            </m.span>
            <m.span 
              className="text-sm font-semibold text-primary-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              {currencySymbol}
            </m.span>
            <AnimatedNumber
              value={parseFloat(result.totalAmount as string) || 0}
              decimals={config?.currencyDecimals ?? 0}
              duration={1.5}
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600 tabular-nums"
            />
          </div>
          
          {/* 奖励来源标签 */}
          {result.rewards.length > 1 && (
            <m.div 
              className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              <RiSparklingLine className="size-3.5 text-gold-500" />
              <span>{t('signin.total_reward', 'إجمالي المكافأة')}</span>
            </m.div>
          )}
        </div>
      </m.div>

      {/* 多重奖励明细 */}
      {result.rewards.length > 1 && (
        <m.div
          className="w-full space-y-2 px-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRINGS.gentle, delay: 1.3 }}
        >
          {result.rewards.map((reward, index) => (
            <m.div
              key={index}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...SPRINGS.gentle, delay: 1.4 + index * 0.1 }}
            >
              <span className="text-sm text-muted-foreground">
                {reward.type === 'SVIP' ? 'SVIP' : t('signin.daily.reward', 'مكافأة يومية')}
              </span>
              <span className="text-sm font-semibold text-primary-500">
                +{currencySymbol}{reward.amount}
              </span>
            </m.div>
          ))}
        </m.div>
      )}

      {/* 操作按钮区 */}
      <m.div
        className="w-full space-y-3 pt-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 1.5 }}
      >
        {/* 分隔线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
        
        {/* 确认按钮 */}
        <Button
          onClick={() => { haptic('light'); onClose(); }}
          className={cn(
            'w-full h-12 rounded-xl font-semibold',
            'bg-gradient-to-r from-primary-500 to-primary-600',
            'shadow-glow-sm hover:shadow-glow',
            'text-white'
          )}
        >
          {t('btn.confirm', 'تأكيد')}
        </Button>

        {/* 活动中心入口 */}
        <ActivityCenterLink onClick={onGoActivities} />
      </m.div>
    </div>
  );
}

/**
 * 普通用户签到完成/过期状态
 * @description 高端引导设计，带精美动画
 */
interface SignInCompletedStateProps {
  type: 'completed' | 'expired';
  onGoBuy: () => void;
  onGoActivities: () => void;
}

function SignInCompletedState({ type, onGoBuy, onGoActivities }: SignInCompletedStateProps) {
  const t = useText();

  return (
    <div className="text-center py-6 space-y-6">
      {/* 状态图标 - 带入场动画 */}
      <m.div 
        className="flex justify-center"
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={SPRINGS.bouncy}
      >
        {type === 'completed' ? (
          <div className="relative flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-primary-500/15 to-primary-600/10">
            <RiCheckboxCircleFill className="size-10 text-primary-500" />
            {/* 装饰光环 */}
            <m.div
              className="absolute inset-0 rounded-full border-2 border-primary-500/30"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700">
            <RiTimeLine className="size-10 text-neutral-400" />
          </div>
        )}
      </m.div>

      {/* 状态说明 */}
      <m.p
        className="text-neutral-600 dark:text-neutral-400 px-4 leading-relaxed"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 0.2 }}
      >
        {type === 'completed' 
          ? t('signin.normal_completed', 'لقد أكملت الحضور لمدة 3 أيام! اشترِ منتجاً للاستمرار.')
          : t('signin.window_expired', 'انتهت فترة الحضور. اشترِ منتجاً للاستمرار.')
        }
      </m.p>

      {/* 购买引导按钮 */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRINGS.gentle, delay: 0.3 }}
      >
        <Button
          className={cn(
            'w-full h-12 rounded-xl font-semibold',
            'bg-gradient-to-r from-primary-500 to-primary-600',
            'shadow-glow-sm',
          )}
          size="lg"
          onClick={onGoBuy}
        >
          <RiShoppingBag3Line className="size-5 mr-2" />
          {t('signin.btn_go_buy', 'اذهب للشراء')}
        </Button>
      </m.div>

      {/* 活动中心入口 */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <ActivityCenterLink onClick={onGoActivities} />
      </m.div>
    </div>
  );
}

/**
 * 活动中心入口链接 - 带箭头悬浮动画
 */
function ActivityCenterLink({ onClick }: { onClick: () => void }) {
  const t = useText();

  return (
    <m.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.97 }}
      className="w-full flex items-center justify-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors py-2 group"
    >
      {t('signin.go_activities', 'عرض المزيد من الأنشطة')}
      <RiArrowRightSLine className="size-4 transition-transform group-hover:translate-x-0.5" />
    </m.button>
  );
}

/**
 * 签到弹窗骨架屏 - 带呼吸动画
 */
function SignInModalSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 奖励卡片骨架 */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* 进度条骨架 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="size-4 rounded-full" />
          ))}
        </div>
      </div>

      {/* 日历骨架 */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 签到错误状态 - 带振动反馈
 */
function SignInErrorState({ onRetry }: { onRetry: () => void }) {
  const t = useText();

  return (
    <m.div
      className="flex flex-col items-center py-8 space-y-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRINGS.gentle}
    >
      <m.div 
        className="flex items-center justify-center size-16 rounded-full bg-destructive/10"
        initial={{ rotate: -5 }}
        animate={{ rotate: [0, -3, 3, -2, 2, 0] }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <RiAlertLine className="size-8 text-destructive" />
      </m.div>
      <p className="text-sm text-muted-foreground text-center">
        {t('signin.error.load', 'خطأ في تحميل حالة الحضور')}
      </p>
      <Button 
        onClick={() => { haptic('light'); onRetry(); }} 
        variant="secondary" 
        size="sm"
      >
        {t('btn.retry', 'إعادة المحاولة')}
      </Button>
    </m.div>
  );
}
