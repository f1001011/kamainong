/**
 * @file 首页签到卡片 — Bento 网格左侧（62%宽）
 * @description 环形SVG进度条 + card-premium 金色顶条 + 签到CTA
 * 数据来源：GET /api/signin/status（normalSignIn）
 */

'use client';

import { useState } from 'react';
import { m } from 'motion/react';
import {
  RiCalendarCheckFill,
  RiCheckLine,
} from '@remixicon/react';
import { SignInModal } from '@/components/business/signin-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useText } from '@/hooks/use-text';
import { cn } from '@/lib/utils';
import type { SignInStatusResponse } from '@/types/signin';

export interface HomeSigninCardProps {
  status?: SignInStatusResponse | null;
  isLoading?: boolean;
  className?: string;
}

/** 环形进度条 */
function RingProgress({ current, total }: { current: number; total: number }) {
  const size = 52;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? current / total : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(var(--color-gold-rgb), 0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="var(--color-gold-500)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-heading text-sm text-neutral-700">
          {current}/{total}
        </span>
      </div>
    </div>
  );
}

export function HomeSigninCard({
  status,
  isLoading = false,
  className,
}: HomeSigninCardProps) {
  const t = useText();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return (
      <div className={cn(
        'rounded-[20px] bg-white p-5 shadow-architectural h-full',
        className,
      )}>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-7 h-7 rounded-lg" />
          <Skeleton width={70} height={16} />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton width={90} height={36} />
          <Skeleton circle width={52} height={52} />
        </div>
        <Skeleton className="w-full h-10 rounded-xl mt-4" />
      </div>
    );
  }

  const normal = status?.normalSignIn;
  const currentStreak = normal?.currentStreak ?? 0;
  const targetDays = normal?.targetDays ?? 3;
  const todaySigned = normal?.todaySigned ?? false;
  const completed = normal?.completed ?? false;
  const reward = normal?.reward ?? '0';

  return (
    <>
      <m.div
        whileTap={{ scale: 0.98, boxShadow: '1px 2px 6px rgba(0,0,0,0.03)' }}
        className={cn(
          'rounded-[20px] card-premium',
          'bg-white',
          'shadow-architectural',
          'p-5 cursor-pointer transition-all duration-300',
          'hover:shadow-architectural-hover',
          'h-full flex flex-col',
          className,
        )}
        onClick={() => {
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          setShowModal(true);
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gold-50 flex items-center justify-center">
            <RiCalendarCheckFill className="w-4 h-4 text-gold-500" />
          </div>
          <span className="text-sm font-bold text-neutral-800">
            {t('home.dailySignin', 'التوقيع اليومي')}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4 flex-1">
          <div>
            {targetDays > 0 ? (
              <div className="text-lg font-bold text-neutral-800">
                {completed ? (
                  t('signin.completed', 'مكتمل')
                ) : (
                  <>
                    {t('signin.day', 'يوم')} {currentStreak} {t('common.of', 'من')} {targetDays}
                  </>
                )}
              </div>
            ) : (
              <div className="text-lg font-bold text-neutral-800">
                {todaySigned
                  ? t('signin.todayDone', 'تم التوقيع اليوم')
                  : t('signin.dailyReward', 'مكافأة يومية')}
              </div>
            )}
          </div>
          {targetDays > 0 && (
            <RingProgress current={currentStreak} total={targetDays} />
          )}
        </div>

        {completed ? (
          <div className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary-50 text-primary-600 text-sm font-semibold">
            <RiCheckLine className="w-4 h-4" />
            {t('signin.allCompleted', 'مكتمل')}
          </div>
        ) : todaySigned ? (
          <div className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-neutral-100 text-neutral-400 text-sm font-semibold">
            <RiCheckLine className="w-4 h-4" />
            {t('signin.signed', 'تم التوقيع')}
          </div>
        ) : (
          <m.button
            whileTap={{ scale: 0.95 }}
            className={cn(
              'w-full h-10 rounded-xl text-[13px] font-semibold tracking-[0.05em]',
              'bg-gradient-to-r from-primary-500 to-primary-600 text-white',
              'shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.25)]',
              'hover:shadow-[0_4px_12px_rgba(var(--color-primary-rgb),0.35)]',
              'active:bg-primary-600',
              'transition-all duration-200',
            )}
            onClick={(e) => {
              e.stopPropagation();
              (e.currentTarget as HTMLElement).blur();
              setShowModal(true);
            }}
          >
            {t('signin.signNow', 'توقيع')} +{reward}
          </m.button>
        )}
      </m.div>

      <SignInModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
