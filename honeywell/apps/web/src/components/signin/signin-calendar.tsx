/**
 * @file 签到日历组件
 * @description 展示7日/长期签到日历，已签到显示绿色勾，今日可签显示脉冲动画
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { SPRINGS } from '@/lib/animation/constants';
import { PulseWrapper } from '@/components/effects/pulse-wrapper';
import { RiCheckLine, RiGiftLine } from '@remixicon/react';
import type { SignInRecord } from '@/types/signin';
import { getGlobalConfig } from '@/stores/global-config';
import { formatSystemTime, getTodayStart } from '@/lib/timezone';

/**
 * 日历项属性
 */
interface CalendarDay {
  /** 日期字符串 YYYY-MM-DD */
  date: string;
  /** 显示的日期文字（周几或日期） */
  label: string;
  /** 是否已签到 */
  signed: boolean;
  /** 是否为今天 */
  isToday: boolean;
  /** 是否可签到 */
  canSign: boolean;
  /** 奖励金额 */
  reward?: string;
}

/**
 * 签到日历组件属性
 */
export interface SignInCalendarProps {
  /** 签到记录列表 */
  records: SignInRecord[];
  /** 当前连续签到天数 */
  currentStreak: number;
  /** 目标签到天数（普通用户为3，VIP/SVIP为0表示无限制） */
  targetDays: number;
  /** 每日奖励金额 */
  dailyReward: string;
  /** 今日是否已签到 */
  todaySigned: boolean;
  /** 是否可以签到 */
  canSign: boolean;
  /** 是否显示完整7天（false则只显示3天进度） */
  showFullWeek?: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * 获取周几文字
 */
function getWeekdayLabel(date: Date): string {
  const weekdays = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
  return weekdays[date.getDay()];
}

/**
 * 签到日历组件
 * @description 展示7日签到日历，支持普通用户和VIP/SVIP用户
 */
export function SignInCalendar({
  records,
  currentStreak,
  targetDays,
  dailyReward,
  todaySigned,
  canSign,
  showFullWeek = true,
  className,
}: SignInCalendarProps) {
  const t = useText();

  // 构建日历数据（使用系统时区）
  const calendarDays = useMemo((): CalendarDay[] => {
    const { systemTimezone } = getGlobalConfig();
    
    // 获取系统时区的今天日期字符串（YYYY-MM-DD）
    const todayStr = formatSystemTime(new Date().toISOString(), systemTimezone, 'yyyy-MM-dd');
    
    const days: CalendarDay[] = [];
    const recordMap = new Map(records.map(r => [r.date, r]));
    
    // 显示天数：普通用户7天，VIP/SVIP用户也是7天
    const displayDays = showFullWeek ? 7 : 3;
    
    // 使用系统时区的今天开始时间作为基准
    const todayStart = getTodayStart(systemTimezone);
    
    for (let i = 0; i < displayDays; i++) {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - (displayDays - 1 - i));
      
      // 使用系统时区格式化日期
      const dateStr = formatSystemTime(date.toISOString(), systemTimezone, 'yyyy-MM-dd');
      const record = recordMap.get(dateStr);
      const isToday = dateStr === todayStr;
      
      days.push({
        date: dateStr,
        label: getWeekdayLabel(date),
        signed: record?.signed ?? false,
        isToday,
        canSign: isToday && canSign && !todaySigned,
        reward: record?.amount ?? dailyReward,
      });
    }
    
    return days;
  }, [records, canSign, todaySigned, dailyReward, showFullWeek]);

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn('space-y-3', className)}>
        {/* 日历标题 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('signin.calendar.title', 'تقويم تسجيل الحضور')}
          </span>
          {targetDays > 0 && (
            <span className="text-sm font-medium text-primary-500">
              {currentStreak}/{targetDays} {t('signin.days', 'أيام')}
            </span>
          )}
        </div>

        {/* 日历格子 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <m.div
              key={day.date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRINGS.gentle, delay: index * 0.05 }}
            >
              <CalendarDayItem day={day} />
            </m.div>
          ))}
        </div>
      </div>
    </LazyMotion>
  );
}

/**
 * 单个日历项组件
 */
function CalendarDayItem({ day }: { day: CalendarDay }) {
  const t = useText();

  // 今日可签到：使用脉冲动画
  if (day.canSign) {
    return (
      <PulseWrapper type="glow" color="primary" enabled>
        <div
          className={cn(
            'flex flex-col items-center justify-center',
            'w-full aspect-square rounded-xl',
            'bg-primary-500/10 border-2 border-primary-500',
            'transition-colors'
          )}
        >
          <span className="text-xs text-primary-500 font-medium">
            {t('signin.today', 'اليوم')}
          </span>
          <RiGiftLine className="size-5 text-primary-500 mt-0.5" />
        </div>
      </PulseWrapper>
    );
  }

  // 已签到：绿色勾
  if (day.signed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'w-full aspect-square rounded-xl',
          'bg-primary-500/10 border border-primary-500/30'
        )}
      >
        <span className="text-xs text-muted-foreground">{day.label}</span>
        <RiCheckLine className="size-5 text-primary-500 mt-0.5" />
      </div>
    );
  }

  // 今日已签到
  if (day.isToday) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center',
          'w-full aspect-square rounded-xl',
          'bg-primary-500/10 border-2 border-primary-500'
        )}
      >
        <span className="text-xs text-primary-500 font-medium">
            {t('signin.today', 'اليوم')}
          </span>
          <RiCheckLine className="size-5 text-primary-500 mt-0.5" />
      </div>
    );
  }

  // 未签到
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'w-full aspect-square rounded-xl',
        'bg-muted/50 border border-border/50'
      )}
    >
      <span className="text-xs text-muted-foreground">{day.label}</span>
      <span className="text-[10px] text-muted-foreground/70 mt-0.5">-</span>
    </div>
  );
}

// formatDateStr 已被 formatSystemTime 替代，使用系统时区格式化日期

/**
 * 签到进度条组件
 * @description 3天签到进度展示，用于普通用户
 */
export interface SignInProgressProps {
  /** 当前连续签到天数 */
  currentStreak: number;
  /** 目标天数 */
  targetDays: number;
  /** 是否已完成 */
  completed: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * 签到进度展示
 */
export function SignInProgress({
  currentStreak,
  targetDays,
  completed,
  className,
}: SignInProgressProps) {
  const t = useText();
  
  // 计算进度百分比
  const progress = Math.min(100, (currentStreak / targetDays) * 100);

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn('space-y-2', className)}>
        {/* 进度标签 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('signin.progress.title', 'تقدم تسجيل الحضور')}
          </span>
          <span className={cn(
            'font-medium',
            completed ? 'text-primary-500' : 'text-foreground'
          )}>
            {currentStreak}/{targetDays} {t('signin.days', 'أيام')}
          </span>
        </div>

        {/* 进度条 */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <m.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full',
              completed
                ? 'bg-gradient-to-r from-primary-400 to-primary-500'
                : 'bg-gradient-to-r from-primary-400 to-primary-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={SPRINGS.gentle}
          />
        </div>

        {/* 里程碑点 */}
        <div className="flex justify-between">
          {Array.from({ length: targetDays }, (_, i) => (
            <div
              key={i}
              className={cn(
                'flex flex-col items-center',
                i + 1 <= currentStreak ? 'text-primary-500' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'size-4 rounded-full flex items-center justify-center',
                  i + 1 <= currentStreak
                    ? 'bg-primary-500 text-white'
                    : 'bg-muted border border-border'
                )}
              >
                {i + 1 <= currentStreak && (
                  <RiCheckLine className="size-3" />
                )}
              </div>
              <span className="text-xs mt-1">
                {t('signin.day', 'يوم')} {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
    </LazyMotion>
  );
}
