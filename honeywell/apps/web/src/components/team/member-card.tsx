/**
 * @file 团队成员卡片组件
 * @description 显示团队成员信息，包含头像、昵称、等级标签和有效邀请标记
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo } from 'react';
import { m } from 'motion/react';
import { RiCheckboxCircleFill, RiUser3Fill } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores/global-config';
import { formatCurrency } from '@/lib/format';
import { formatSystemTime, DEFAULT_SYSTEM_TIMEZONE } from '@/lib/timezone';
import { SPRINGS } from '@/lib/animation';

/**
 * 团队成员数据类型
 * @description 依据：02.3-前端API接口清单.md GET /api/team/members
 */
export interface TeamMember {
  /** 用户ID */
  id: number;
  /** 手机号（脱敏） */
  phone: string;
  /** 昵称 */
  nickname: string | null;
  /** 头像URL */
  avatar: string | null;
  /** 层级：1=直接邀请，2=二级，3=三级 */
  level: 1 | 2 | 3;
  /** VIP等级 */
  vipLevel: number;
  /** 是否有效邀请（完成首充+首购） */
  isValidInvite: boolean;
  /** 贡献返佣金额 */
  contributedCommission: string;
  /** 注册时间 */
  registeredAt: string;
}

/**
 * 团队成员卡片组件属性
 */
interface MemberCardProps {
  /** 成员信息 */
  member: TeamMember;
  /** 自定义样式 */
  className?: string;
}

/**
 * 获取层级标签颜色配置
 * @description 依据：03.10.1-我的团队页.md 第3.5节
 */
function getLevelConfig(level: 1 | 2 | 3) {
  switch (level) {
    case 1:
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
        label: 'L1',
      };
    case 2:
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
        label: 'L2',
      };
    case 3:
      return {
        bgColor: 'bg-primary-100',
        textColor: 'text-primary-600',
        label: 'L3',
      };
  }
}

/**
 * 团队成员卡片组件
 * @description 显示成员头像、昵称、层级标签，有效邀请显示绿色勾
 * 
 * @example
 * ```tsx
 * <MemberCard member={memberData} />
 * ```
 */
export const MemberCard = memo(function MemberCard({
  member,
  className,
}: MemberCardProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const config = useGlobalConfigStore((s) => s.config);
  const timezone = config?.systemTimezone || DEFAULT_SYSTEM_TIMEZONE;
  
  const levelConfig = getLevelConfig(member.level);
  
  // 显示名称：优先昵称，其次脱敏手机号
  const displayName = member.nickname || member.phone;
  
  return (
    <m.div
      className={cn(
        'bg-neutral-50 rounded-xl p-4 border border-neutral-100/50 transition-shadow hover:shadow-soft',
        className
      )}
      initial={isAnimationEnabled ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRINGS.gentle}
    >
      {/* 顶部：头像 + 基本信息 */}
      <div className="flex items-start gap-3 mb-3">
        {/* 头像 */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
            {member.avatar ? (
              <img
                src={member.avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <RiUser3Fill className="w-6 h-6 text-neutral-400" />
            )}
          </div>
        </div>
        
        {/* 信息区 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* 昵称/手机号 */}
            <span className="text-sm font-medium text-neutral-500 truncate">
              {displayName}
            </span>
            
            {/* VIP 徽章 */}
            {member.vipLevel > 0 && (
              <span className="shrink-0 bg-gradient-to-r from-warning to-warning-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                VIP{member.vipLevel}
              </span>
            )}
            
            {/* 层级标签 */}
            <span
              className={cn(
                'shrink-0 px-1.5 py-0.5 text-xs font-medium rounded',
                levelConfig.bgColor,
                levelConfig.textColor
              )}
            >
              {levelConfig.label}
            </span>
          </div>
          
          <p className="text-xs text-neutral-400">{member.phone}</p>
        </div>
        
        {/* 有效邀请标识 */}
        {member.isValidInvite && (
          <div className="flex items-center gap-1 bg-success-50 text-success text-[10px] font-medium px-2 py-1 rounded-full">
            <RiCheckboxCircleFill className="w-3 h-3" />
            <span>{t('team.valid_invite', 'صالح')}</span>
          </div>
        )}
      </div>
      
      {/* 分割线 */}
      <div className="border-t border-neutral-200 my-3" />
      
      {/* 底部：贡献与注册时间 */}
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-neutral-400">{t('team.contributed', 'المساهمة')}: </span>
          <span className="text-neutral-500 font-medium">
            {config ? formatCurrency(member.contributedCommission, config) : member.contributedCommission}
          </span>
        </div>
        <div>
          <span className="text-neutral-400">{t('team.registered_at', 'التسجيل')}: </span>
          <span className="text-neutral-500">
            {formatSystemTime(member.registeredAt, timezone, 'yyyy-MM-dd')}
          </span>
        </div>
      </div>
    </m.div>
  );
});

export default MemberCard;
