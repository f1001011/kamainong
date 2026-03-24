/**
 * @file 拉新裂变活动头部组件
 * @description 展示活动名称、描述和当前邀请进度
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第3节
 */

'use client';

import { m, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation/constants';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { RiUserAddFill, RiMedalFill } from '@remixicon/react';

/**
 * 头部组件属性
 */
interface InviteActivityHeaderProps {
  /** 活动名称 */
  activityName: string;
  /** 活动描述 */
  activityDesc: string;
  /** 当前有效邀请人数 */
  validInviteCount: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * InviteActivityHeader 活动头部
 * @description 展示活动标题和当前邀请进度统计
 * 依据：03.11.3-拉新裂变活动页.md 第3.1节
 * 
 * @example
 * ```tsx
 * <InviteActivityHeader
 *   activityName="Recompensa por invitación"
 *   activityDesc="Invita amigos y gana premios"
 *   validInviteCount={5}
 * />
 * ```
 */
export function InviteActivityHeader({
  activityName,
  activityDesc,
  validInviteCount,
  className,
}: InviteActivityHeaderProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, y: -20 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRINGS.gentle}
        className={cn(
          'relative overflow-hidden rounded-2xl p-5',
          'bg-gradient-to-br from-primary-50 via-white to-primary-50',
          'border border-primary-100/50',
          className
        )}
      >
        {/* 装饰性背景图案 */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10">
          <RiMedalFill className="size-32 text-primary-500" />
        </div>

        {/* 活动信息 */}
        <div className="relative z-10">
          {/* 活动名称 */}
          <h1 className="text-xl font-bold text-neutral-800 mb-2">
            {activityName}
          </h1>
          
          {/* 活动描述 */}
          <p className="text-sm text-neutral-500 mb-4">
            {activityDesc}
          </p>

          {/* 邀请统计 */}
          <div className="flex items-center gap-4">
            {/* 有效邀请数 */}
            <div className="flex items-center gap-2 bg-white/80 rounded-xl px-4 py-2.5 shadow-soft">
              <div className="size-10 rounded-full bg-primary-100 flex items-center justify-center">
                <RiUserAddFill className="size-5 text-primary-500" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">
                  {t('activity.invite.validCount', 'دعوات صالحة')}
                </p>
                <p className="text-2xl font-bold text-primary-600 tabular-nums">
                  <AnimatedNumber 
                    value={validInviteCount} 
                    decimals={0}
                    duration={isAnimationEnabled ? 800 : 0}
                  />
                </p>
              </div>
            </div>
          </div>
        </div>
      </m.div>
    </LazyMotion>
  );
}
