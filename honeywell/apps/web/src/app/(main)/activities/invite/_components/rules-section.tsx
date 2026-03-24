/**
 * @file 规则说明区组件 - 重构版
 * @description 金属质感卡片 + 金色序号 + 衬线标题，可折叠
 * @depends 活动邀请.md 第4.4节 - 规则说明区设计
 */

'use client';

import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { RiInformationLine, RiArrowDownSLine } from '@remixicon/react';

interface RulesSectionProps {
  className?: string;
}

/**
 * 规则说明区 - 金属质感卡片 + 金色渐变序号
 */
export function RulesSection({ className }: RulesSectionProps) {
  const t = useText();
  const { isAnimationEnabled, getSpring } = useAnimationConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  const rules = [
    t('invite.rule_valid_1'),
    t('invite.rule_valid_2'),
    t('invite.rule_claim'),
    t('invite.rule_expire'),
  ];

  return (
    <div className={cn(
      'card-metallic rounded-2xl overflow-hidden',
      className
    )}>
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center">
            <RiInformationLine className="w-4 h-4 text-gold-700" />
          </div>
          <span className="text-sm font-heading text-neutral-700">
            {t('invite.rule_title')}
          </span>
        </div>
        <m.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={getSpring('gentle')}
        >
          <RiArrowDownSLine className="w-5 h-5 text-neutral-400" />
        </m.div>
      </button>

      {/* 规则内容 */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <m.div
            initial={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
            animate={isAnimationEnabled ? { height: 'auto', opacity: 1 } : undefined}
            exit={isAnimationEnabled ? { height: 0, opacity: 0 } : undefined}
            transition={getSpring('gentle')}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-neutral-100/60">
              <ul className="pt-4 space-y-3">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-neutral-500">
                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-100 to-gold-200 text-gold-800 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
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
    </div>
  );
}
