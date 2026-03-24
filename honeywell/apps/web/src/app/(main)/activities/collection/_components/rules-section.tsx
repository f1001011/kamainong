/**
 * @file 活动规则区域组件
 * @description 可折叠的活动规则说明区域
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.4-连单奖励活动页.md 第4.7节
 */

'use client';

import { useState } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { RiInformationLine, RiArrowDownSLine } from '@remixicon/react';
import { SPRINGS } from '@/lib/animation';

/**
 * 活动规则区域组件属性
 */
interface RulesSectionProps {
  /** 自定义类名 */
  className?: string;
}

/**
 * 活动规则区域组件
 * @description 依据：03.11.4-连单奖励活动页.md 第4.7节 - 活动规则设计
 * 
 * 设计规范：
 * - 默认折叠，点击展开
 * - 淡灰背景 bg-neutral-50
 * - 规则内容从文案配置获取
 * 
 * @example
 * ```tsx
 * <RulesSection />
 * ```
 */
export function RulesSection({ className }: RulesSectionProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  // 规则列表（从文案配置获取）- 依据文档 2.7节 文案配置
  const rules = [
    t('collection.rule_prerequisite'),
    t('collection.rule_purchase'),
    t('collection.rule_claim'),
    t('collection.rule_expire'),
  ];

  return (
    <div className={cn('bg-white/60 backdrop-blur-sm rounded-2xl border border-neutral-100/80 overflow-hidden shadow-soft-sm', className)}>
      {/* 标题栏（可点击展开） */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center">
            <RiInformationLine className="w-4 h-4 text-neutral-500" />
          </div>
          <span className="text-sm font-semibold text-neutral-700">{t('collection.rule_title')}</span>
        </div>
        <m.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={SPRINGS.snappy}
        >
          <RiArrowDownSLine className="w-5 h-5 text-neutral-400" />
        </m.div>
      </button>

      {/* 规则内容（展开时显示） */}
      <LazyMotion features={domAnimation}>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <m.div
              initial={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
              animate={isAnimationEnabled ? { height: 'auto', opacity: 1 } : undefined}
              exit={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
              transition={SPRINGS.gentle}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 border-t border-neutral-100/80">
                <ul className="pt-4 space-y-3">
                  {rules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm text-neutral-500">
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </LazyMotion>
    </div>
  );
}
