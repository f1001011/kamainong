/**
 * @file 联系方式组件
 * @description 展示客服联系方式，支持WhatsApp/Telegram等跳转
 * @depends 开发文档/03-功能模块/03.13.1-关于我们页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { m } from 'motion/react';
import {
  RiWhatsappFill,
  RiTelegramFill,
  RiMailFill,
  RiCustomerService2Fill,
  RiExternalLinkLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { Skeleton } from '@/components/ui/skeleton';
import { SPRINGS } from '@/lib/animation';

/**
 * 联系方式项类型
 * 依据：02.3-前端API接口清单.md 第1.10节 - service_links结构
 */
export interface ContactItem {
  /** 显示名称 */
  name: string;
  /** 图标URL（可选，有则使用自定义图标） */
  icon?: string;
  /** 跳转链接 */
  url: string;
  /** 联系方式类型，用于选择内置图标 */
  type?: 'whatsapp' | 'telegram' | 'email' | 'livechat' | 'other';
}

/**
 * 联系方式组件属性
 */
export interface ContactInfoProps {
  /** 联系方式列表 */
  contacts?: ContactItem[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 根据URL推断联系方式类型
 * @description 根据URL特征自动识别类型
 */
function inferContactType(url: string): ContactItem['type'] {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('wa.me') || lowerUrl.includes('whatsapp')) {
    return 'whatsapp';
  }
  if (lowerUrl.includes('t.me') || lowerUrl.includes('telegram')) {
    return 'telegram';
  }
  if (lowerUrl.includes('mailto:') || lowerUrl.includes('@')) {
    return 'email';
  }
  return 'other';
}

/**
 * 获取联系方式图标
 * @description 根据类型返回对应的Remix Icon
 * 依据：核心开发规范.md - 禁止使用Emoji，统一使用Remix Icon
 */
function getContactIcon(type: ContactItem['type']) {
  switch (type) {
    case 'whatsapp':
      return RiWhatsappFill;
    case 'telegram':
      return RiTelegramFill;
    case 'email':
      return RiMailFill;
    case 'livechat':
      return RiCustomerService2Fill;
    default:
      return RiExternalLinkLine;
  }
}

/**
 * 获取联系方式图标背景色
 * @description 根据类型返回品牌色
 */
function getContactBgColor(type: ContactItem['type']): string {
  switch (type) {
    case 'whatsapp':
      return 'bg-[#25D366]/10 text-[#25D366]';
    case 'telegram':
      return 'bg-[#0088cc]/10 text-[#0088cc]';
    case 'email':
      return 'bg-primary-100 text-primary-600';
    case 'livechat':
      return 'bg-gold-100 text-gold-600';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

/**
 * 联系方式骨架屏
 */
function ContactInfoSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-soft p-5 space-y-3">
      <Skeleton className="h-5 w-32 mb-4" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-5 h-5" />
        </div>
      ))}
    </div>
  );
}

/**
 * 单个联系方式项
 */
function ContactItemCard({
  contact,
  index,
}: {
  contact: ContactItem;
  index: number;
}) {
  // 推断或使用指定的类型
  const contactType = contact.type || inferContactType(contact.url);
  const IconComponent = getContactIcon(contactType);
  const bgColorClass = getContactBgColor(contactType);

  /**
   * 处理点击跳转
   * 依据：03.13.1-关于我们页.md - 客服链接支持WhatsApp/Telegram跳转
   */
  const handleClick = () => {
    // 在新窗口打开外部链接
    window.open(contact.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <m.button
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl',
        'transition-colors duration-200',
        'hover:bg-neutral-50 active:bg-neutral-100',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/20'
      )}
      onClick={handleClick}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ...SPRINGS.gentle, delay: 0.1 + index * 0.05 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 图标 */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          bgColorClass
        )}
      >
        <IconComponent className="w-5 h-5" />
      </div>

      {/* 名称 */}
      <span className="flex-1 text-left text-sm font-medium text-neutral-700">
        {contact.name}
      </span>

      {/* 跳转指示 */}
      <RiExternalLinkLine className="w-4 h-4 text-neutral-400" />
    </m.button>
  );
}

/**
 * 联系方式组件
 * @description 展示客服联系方式列表，支持多种联系方式跳转
 * 依据：核心开发规范.md - 所有内容必须从配置获取
 * 
 * @example
 * ```tsx
 * <ContactInfo
 *   contacts={[
 *     { name: "WhatsApp", url: "https://wa.me/123456789" },
 *     { name: "Telegram", url: "https://t.me/support" }
 *   ]}
 * />
 * ```
 */
export function ContactInfo({
  contacts = [],
  isLoading = false,
  className,
}: ContactInfoProps) {
  const t = useText();

  // 加载状态
  if (isLoading) {
    return <ContactInfoSkeleton />;
  }

  // 无联系方式时不显示
  if (contacts.length === 0) {
    return null;
  }

  return (
    <m.div
      className={cn('bg-white rounded-2xl shadow-soft p-5', className)}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SPRINGS.gentle, delay: 0.4 }}
    >
      {/* 标题 */}
      <h2 className="text-base font-semibold text-neutral-800 mb-4">
        {t('about.contact_title', 'اتصل بنا')}
      </h2>

      {/* 联系方式列表 */}
      <div className="space-y-1">
        {contacts.map((contact, index) => (
          <ContactItemCard
            key={contact.url || index}
            contact={contact}
            index={index}
          />
        ))}
      </div>
    </m.div>
  );
}
