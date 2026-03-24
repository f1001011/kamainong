/**
 * @file 日期分组标题组件
 * @description 流水列表中的日期分组标题
 * @depends 开发文档/03-前端用户端/03.9-资金明细/03.9.1-资金明细页.md
 */

'use client';

import { useText } from '@/hooks/use-text';

/**
 * DateGroupHeader 组件属性
 */
interface DateGroupHeaderProps {
  /** 日期字符串（YYYY-MM-DD格式） */
  date: string;
  /** 是否是今天 */
  isToday?: boolean;
  /** 是否是昨天 */
  isYesterday?: boolean;
}

/**
 * 日期分组标题组件
 * @description 显示日期分组标题，支持今日/昨日特殊显示
 */
export function DateGroupHeader({ date, isToday, isYesterday }: DateGroupHeaderProps) {
  const t = useText();

  // 显示文案
  let displayText = date;
  if (isToday) {
    displayText = t('date.today');
  } else if (isYesterday) {
    displayText = t('date.yesterday');
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
        {displayText}
      </span>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  );
}
