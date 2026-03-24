/**
 * @file 通用奖励展示组件
 * @description 奖励金额展示，含弹跳动画和数字动画效果，供活动页复用
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.2-签到功能.md
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 */

'use client';

import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores';
import { AnimatedNumber } from './animated-number';
import { cn } from '@/lib/utils';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { SPRINGS } from '@/lib/animation/constants';
import { RiCoinLine, RiGiftLine } from '@remixicon/react';

/**
 * 奖励类型
 */
export type RewardType = 'normal' | 'svip' | 'bonus' | 'commission';

/**
 * 奖励展示组件属性
 */
export interface RewardDisplayProps {
  /** 奖励金额 */
  amount: number | string;
  /** 奖励类型 */
  type?: RewardType;
  /** 是否播放弹跳动画 */
  animate?: boolean;
  /** 是否显示加号前缀 */
  showPlus?: boolean;
  /** 是否显示货币符号 */
  showCurrency?: boolean;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义样式 */
  className?: string;
  /** 文字样式 */
  textClassName?: string;
  /** 是否高亮 */
  highlight?: boolean;
  /** 动画延迟（毫秒） */
  delay?: number;
}

/**
 * 尺寸配置
 */
const sizeConfig = {
  sm: {
    text: 'text-sm',
    icon: 'size-4',
    gap: 'gap-1',
  },
  md: {
    text: 'text-base',
    icon: 'size-5',
    gap: 'gap-1.5',
  },
  lg: {
    text: 'text-lg',
    icon: 'size-6',
    gap: 'gap-2',
  },
  xl: {
    text: 'text-2xl',
    icon: 'size-7',
    gap: 'gap-2',
  },
};

/**
 * 类型颜色配置
 */
const typeColors: Record<RewardType, string> = {
  normal: 'text-warning',
  svip: 'text-primary-500',
  bonus: 'text-primary-500',
  commission: 'text-success',
};

/**
 * 高亮背景颜色配置
 */
const highlightBg: Record<RewardType, string> = {
  normal: 'bg-warning/10',
  svip: 'bg-primary-500/10',
  bonus: 'bg-primary-500/10',
  commission: 'bg-success/10',
};

/**
 * 奖励图标组件
 */
function RewardIcon({ type, className }: { type: RewardType; className?: string }) {
  switch (type) {
    case 'svip':
      return <RiGiftLine className={cn('text-primary-500', className)} />;
    case 'bonus':
    case 'commission':
      return <RiCoinLine className={cn('text-success', className)} />;
    default:
      return <RiCoinLine className={cn('text-warning', className)} />;
  }
}

/**
 * 通用奖励展示组件
 * @description 复用说明：后续 FE-20/21 活动领取奖励可直接复用
 * 
 * @example
 * // 普通签到奖励
 * <RewardDisplay amount="1.00" type="normal" animate showPlus />
 * 
 * // SVIP签到奖励（紫色主题）
 * <RewardDisplay amount="8.00" type="svip" animate showPlus />
 * 
 * // 邀请返佣
 * <RewardDisplay amount={commissionAmount} type="commission" size="lg" />
 */
export function RewardDisplay({
  amount,
  type = 'normal',
  animate = false,
  showPlus = false,
  showCurrency = true,
  showIcon = true,
  size = 'md',
  className,
  textClassName,
  highlight = false,
  delay = 0,
}: RewardDisplayProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  const { config } = useGlobalConfigStore();
  const currencySymbol = config?.currencySymbol || 'د.م.';
  
  // 解析金额
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // 尺寸配置
  const sizeStyles = sizeConfig[size];
  
  // 颜色配置
  const colorClass = typeColors[type];
  const bgClass = highlight ? highlightBg[type] : '';
  
  // 是否启用动画
  const shouldAnimate = animate && isAnimationEnabled;

  // 构建前缀
  const prefix = `${showPlus ? '+' : ''}${showCurrency ? currencySymbol : ''}`;

  // 内容组件
  const Content = (
    <span
      className={cn(
        'inline-flex items-center font-semibold',
        sizeStyles.text,
        sizeStyles.gap,
        colorClass,
        highlight && 'rounded-full px-3 py-1',
        bgClass,
        textClassName
      )}
    >
      {showIcon && <RewardIcon type={type} className={sizeStyles.icon} />}
      <AnimatedNumber
        value={numericAmount}
        prefix={prefix}
        decimals={config?.currencyDecimals ?? 0}
        duration={shouldAnimate ? 800 : 0}
        className={textClassName}
      />
    </span>
  );

  // 不需要动画时直接返回
  if (!shouldAnimate) {
    return <span className={className}>{Content}</span>;
  }

  // 带弹跳动画的展示
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        <m.span
          className={cn('inline-block', className)}
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            ...SPRINGS.bouncy,
            delay: delay / 1000, // 转换为秒
          }}
        >
          {Content}
        </m.span>
      </AnimatePresence>
    </LazyMotion>
  );
}

/**
 * 多重奖励展示组件
 * @description 用于同时展示普通+SVIP双重奖励
 */
export interface MultiRewardDisplayProps {
  /** 奖励列表 */
  rewards: Array<{
    type: 'NORMAL' | 'SVIP';
    amount: string;
  }>;
  /** 是否播放动画 */
  animate?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义样式 */
  className?: string;
}

/**
 * 多重奖励展示
 */
export function MultiRewardDisplay({
  rewards,
  animate = false,
  size = 'md',
  className,
}: MultiRewardDisplayProps) {
  const { isAnimationEnabled } = useAnimationConfig();
  const shouldAnimate = animate && isAnimationEnabled;

  if (rewards.length === 0) return null;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={cn('flex flex-col items-center gap-2', className)}
        initial={shouldAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {rewards.map((reward, index) => (
          <RewardDisplay
            key={`${reward.type}-${index}`}
            amount={reward.amount}
            type={reward.type.toLowerCase() as RewardType}
            animate={shouldAnimate}
            showPlus
            size={size}
            delay={index * 150} // 错开动画时间
          />
        ))}
      </m.div>
    </LazyMotion>
  );
}

/**
 * 总奖励展示组件
 * @description 用于展示签到成功后的总奖励金额
 */
export interface TotalRewardDisplayProps {
  /** 总金额 */
  totalAmount: string | number;
  /** 是否播放动画 */
  animate?: boolean;
  /** 自定义样式 */
  className?: string;
}

/**
 * 总奖励展示
 */
export function TotalRewardDisplay({
  totalAmount,
  animate = false,
  className,
}: TotalRewardDisplayProps) {
  return (
    <RewardDisplay
      amount={totalAmount}
      type="normal"
      animate={animate}
      showPlus
      size="xl"
      highlight
      className={className}
    />
  );
}
