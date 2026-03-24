/**
 * @file 返佣记录卡片组件
 * @description 显示单条返佣记录信息，包含来源用户头像、产品名称、返佣金额
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo } from 'react';
import { m } from 'motion/react';
import { RiUser3Fill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores/global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { SPRINGS } from '@/lib/animation';

/**
 * 返佣记录数据类型
 * @description 依据：02.3-前端API接口清单.md GET /api/team/commissions
 */
export interface CommissionRecord {
  /** 记录ID */
  id: number;
  /** 来源用户昵称 */
  sourceUserNickname: string | null;
  /** 来源用户头像 */
  sourceUserAvatar: string | null;
  /** 来源用户手机号（脱敏） */
  sourceUserPhone: string;
  /** 返佣层级枚举 */
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  /** 返佣层级文案 */
  levelName: string;
  /** 返佣比例（百分比） */
  rate: string;
  /** 产品价格（基础金额） */
  baseAmount: string;
  /** 返佣金额 */
  amount: string;
  /** 产品名称 */
  productName: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 返佣记录卡片组件属性
 */
interface CommissionCardProps {
  /** 返佣记录 */
  record: CommissionRecord;
  /** 自定义样式 */
  className?: string;
}

/**
 * 获取返佣层级配置
 * @description 依据：03.10.1-我的团队页.md 第3.6节
 * - 一级返佣：主色（primary）
 * - 二级返佣：薰衣草色（lavender）
 * - 三级返佣：薄荷色（mint）
 */
function getCommissionLevelConfig(level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3') {
  switch (level) {
    case 'LEVEL_1':
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
      };
    case 'LEVEL_2':
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
      };
    case 'LEVEL_3':
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
      };
  }
}

/**
 * 返佣记录卡片组件
 * @description 显示来源用户头像、产品名称、绿色返佣金额
 * 
 * @example
 * ```tsx
 * <CommissionCard record={commissionData} />
 * ```
 */
export const CommissionCard = memo(function CommissionCard({
  record,
  className,
}: CommissionCardProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const config = useGlobalConfigStore((s) => s.config);
  const timezone = config?.systemTimezone || DEFAULT_SYSTEM_TIMEZONE;
  
  const levelConfig = getCommissionLevelConfig(record.level);
  
  // 来源用户显示名称
  const sourceUserName = record.sourceUserNickname || record.sourceUserPhone;
  
  return (
    <m.div
      className={cn(
        'bg-white rounded-xl p-4 border border-neutral-100 shadow-soft',
        className
      )}
      initial={isAnimationEnabled ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRINGS.gentle}
    >
      {/* 顶部：来源用户 + 层级标签 */}
      <div className="flex items-start gap-3 mb-3">
        {/* 来源用户头像 */}
        <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center">
          {record.sourceUserAvatar ? (
            <img
              src={record.sourceUserAvatar}
              alt={sourceUserName}
              className="w-full h-full object-cover"
            />
          ) : (
            <RiUser3Fill className="w-5 h-5 text-neutral-400" />
          )}
        </div>
        
        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* 来源用户名称 */}
            <span className="text-sm font-medium text-neutral-500 truncate">
              {sourceUserName}
            </span>
            
            {/* 返佣层级标签 */}
            <span
              className={cn(
                'shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full',
                levelConfig.bgColor,
                levelConfig.textColor
              )}
            >
              {record.levelName}
            </span>
          </div>
          
          {/* 产品名称 */}
          <p className="text-xs text-neutral-400">{record.productName}</p>
        </div>
      </div>
      
      {/* 计算详情 */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
        <span>
          {t('team.commission_product')}: {config ? formatCurrency(record.baseAmount, config) : record.baseAmount}
        </span>
        <span>
          {t('team.commission_rate')}: {record.rate}%
        </span>
      </div>
      
      {/* 分割线 */}
      <div className="border-t border-neutral-100 my-3" />
      
      {/* 底部：返佣金额 + 时间 */}
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-success">
          +{config ? formatCurrency(record.amount, config) : record.amount}
        </span>
        <span className="text-xs text-neutral-400">
          {formatSystemTime(record.createdAt, timezone, 'yyyy-MM-dd HH:mm')}
        </span>
      </div>
    </m.div>
  );
});

export default CommissionCard;
