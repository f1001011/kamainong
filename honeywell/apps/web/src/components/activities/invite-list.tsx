/**
 * @file 邀请记录列表组件
 * @description 展示被邀请人列表，含头像、昵称、有效状态
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md 第5节
 * @depends 开发文档/01-设计系统/01.1-设计Token.md
 */

'use client';

import { useMemo } from 'react';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS, STAGGER } from '@/lib/animation/constants';
import { 
  RiCheckboxCircleLine, 
  RiCloseLine,
  RiUserLine,
  RiShoppingCartLine,
  RiCalendarCheckLine
} from '@remixicon/react';
import type { InviteRecord } from '@/types/activity';

/**
 * 邀请列表组件属性
 */
export interface InviteListProps {
  /** 邀请记录列表 */
  records: InviteRecord[];
  /** 是否显示分组标题 */
  showGroupTitle?: boolean;
  /** 是否显示空状态 */
  showEmpty?: boolean;
  /** 自定义空状态文案 */
  emptyText?: string;
  /** 自定义类名 */
  className?: string;
  /** 最大显示数量（不传则显示全部） */
  maxShow?: number;
}

/**
 * 单个邀请记录项组件属性
 */
interface InviteItemProps {
  record: InviteRecord;
  index: number;
}

/**
 * 获取用户头像显示
 * @description 有头像显示头像，无头像显示首字母
 */
function getAvatarDisplay(record: InviteRecord): { type: 'image' | 'letter'; content: string } {
  if (record.avatar) {
    return { type: 'image', content: record.avatar };
  }
  
  // 取昵称或手机号首字符
  const displayName = record.nickname || record.phone;
  const firstChar = displayName.charAt(0).toUpperCase();
  return { type: 'letter', content: firstChar };
}

/**
 * 格式化脱敏手机号
 * @description 确保显示格式一致
 */
function formatMaskedPhone(phone: string): string {
  // 假设手机号已脱敏（如：912***678），保持原样
  return phone;
}

/**
 * 单个邀请记录项
 */
function InviteItem({ record, index }: InviteItemProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 头像显示
  const avatar = getAvatarDisplay(record);
  
  // 显示名称（优先昵称，次选手机号）
  const displayName = record.nickname || formatMaskedPhone(record.phone);

  // 有效类型图标和文案
  const getValidTypeInfo = () => {
    if (!record.isValid || !record.validType) {
      return null;
    }
    
    switch (record.validType) {
      case 'RECHARGE_PURCHASE':
        return {
          icon: RiShoppingCartLine,
          text: t('activity.invite.validByPurchase', 'تم الشراء'),
        };
      case 'COMPLETE_SIGNIN':
        return {
          icon: RiCalendarCheckLine,
          text: t('activity.invite.validBySignin', '3 أيام تسجيل دخول'),
        };
      default:
        return null;
    }
  };

  const validTypeInfo = getValidTypeInfo();

  const itemContent = (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        'bg-white border border-neutral-100',
        'transition-colors hover:bg-neutral-50'
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          'size-10 rounded-full flex items-center justify-center flex-shrink-0',
          record.isValid 
            ? 'bg-gradient-to-br from-primary-50 to-primary-100' 
            : 'bg-neutral-100'
        )}
      >
        {avatar.type === 'image' ? (
          <img
            src={avatar.content}
            alt=""
            className="size-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className={cn(
            'text-sm font-semibold',
            record.isValid ? 'text-primary-500' : 'text-neutral-400'
          )}>
            {avatar.content}
          </span>
        )}
      </div>

      {/* 信息区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'font-medium truncate',
            record.isValid ? 'text-neutral-800' : 'text-neutral-500'
          )}>
            {displayName}
          </span>
        </div>
        
        {/* 有效类型说明 */}
        {validTypeInfo && (
          <div className="flex items-center gap-1 mt-0.5">
            <validTypeInfo.icon className="size-3 text-success" />
            <span className="text-xs text-success">
              {validTypeInfo.text}
            </span>
          </div>
        )}
      </div>

      {/* 状态标识 */}
      <div className="flex-shrink-0">
        {record.isValid ? (
          <div className="flex items-center gap-1 text-success">
            <RiCheckboxCircleLine className="size-4" />
            <span className="text-xs font-medium">
              {t('activity.invite.valid', 'صالح')}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-neutral-400">
            <RiCloseLine className="size-4" />
            <span className="text-xs">
              {t('activity.invite.invalid', 'معلّق')}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (isAnimationEnabled) {
    return (
      <m.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          ...SPRINGS.gentle,
          delay: index * STAGGER.fast,
        }}
      >
        {itemContent}
      </m.div>
    );
  }

  return itemContent;
}

/**
 * InviteList 邀请记录列表组件
 * @description 展示被邀请人列表，含头像、昵称、有效状态
 * 依据：03.11.3-拉新裂变活动页.md 第5节
 * 
 * @example
 * ```tsx
 * <InviteList
 *   records={inviteRecords}
 *   showGroupTitle
 *   maxShow={10}
 * />
 * ```
 */
export function InviteList({
  records,
  showGroupTitle = true,
  showEmpty = true,
  emptyText,
  className,
  maxShow,
}: InviteListProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();

  // 分组：有效邀请 / 待生效邀请
  const { validRecords, pendingRecords } = useMemo(() => {
    const valid = records.filter(r => r.isValid);
    const pending = records.filter(r => !r.isValid);
    return { validRecords: valid, pendingRecords: pending };
  }, [records]);

  // 统计数据
  const stats = useMemo(() => ({
    total: records.length,
    valid: validRecords.length,
    pending: pendingRecords.length,
  }), [records.length, validRecords.length, pendingRecords.length]);

  // 限制显示数量
  const displayRecords = useMemo(() => {
    if (!maxShow) return records;
    return records.slice(0, maxShow);
  }, [records, maxShow]);

  // 空状态
  if (records.length === 0 && showEmpty) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center py-12',
        'text-neutral-400',
        className
      )}>
        <RiUserLine className="size-12 mb-3 text-neutral-300" />
        <p className="text-sm">
          {emptyText || t('activity.invite.empty', 'لا توجد لديك دعوات بعد')}
        </p>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className={cn('space-y-4', className)}>
        {/* 统计标题 */}
        {showGroupTitle && (
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-neutral-800">
              {t('activity.invite.listTitle', 'المدعوون')}
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-success">
                {t('activity.invite.validCount', 'صالحون')}: {stats.valid}
              </span>
              <span className="text-neutral-400">
                {t('activity.invite.pendingCount', 'معلّقون')}: {stats.pending}
              </span>
            </div>
          </div>
        )}

        {/* 列表内容 */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {displayRecords.map((record, index) => (
              <InviteItem
                key={record.id}
                record={record}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* 更多提示 */}
        {maxShow && records.length > maxShow && (
          <p className="text-center text-xs text-neutral-400 pt-2">
            {t('activity.invite.moreHint', 'يتم عرض {n} من {total} مدعو')
              .replace('{n}', String(maxShow))
              .replace('{total}', String(records.length))}
          </p>
        )}
      </div>
    </LazyMotion>
  );
}

/**
 * InviteListSkeleton 邀请列表骨架屏
 */
export function InviteListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {/* 标题骨架 */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded bg-neutral-200 animate-pulse" />
        <div className="h-4 w-32 rounded bg-neutral-200 animate-pulse" />
      </div>
      
      {/* 列表骨架 */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-neutral-100 animate-pulse"
          >
            <div className="size-10 rounded-full bg-neutral-200" />
            <div className="flex-1">
              <div className="h-4 w-24 rounded bg-neutral-200 mb-1" />
              <div className="h-3 w-32 rounded bg-neutral-200" />
            </div>
            <div className="h-4 w-12 rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
