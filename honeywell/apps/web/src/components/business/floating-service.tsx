/**
 * @file 悬浮客服按钮组件
 * @description 圆形悬浮按钮，支持多个客服渠道，柔和阴影 + 微妙边框 + 呼吸动画 + 悬停光晕
 * @reference 开发文档/03-前端用户端/03.0-前端架构.md 第4节
 * @depends 后端 API: GET /api/service-links - 获取客服链接列表
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { m, AnimatePresence } from 'motion/react';
import { RiCustomerServiceFill, RiCloseLine, RiWhatsappFill, RiTelegramFill, RiMessengerFill, RiMailFill, RiPhoneFill, RiExternalLinkLine } from '@remixicon/react';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { SPRINGS } from '@/lib/animation/constants';
import api from '@/lib/api';

/**
 * 客服链接数据结构
 */
interface ServiceLink {
  /** 显示名称 */
  name: string;
  /** 图标标识 */
  icon: string;
  /** 跳转链接 */
  url: string;
}

/**
 * 客服链接列表响应
 */
interface ServiceLinksResponse {
  list: ServiceLink[];
}

/**
 * 根据图标标识获取对应的图标组件
 */
function getIconComponent(icon: string) {
  const iconMap: Record<string, React.ReactNode> = {
    'whatsapp': <RiWhatsappFill className="w-5 h-5" />,
    'telegram': <RiTelegramFill className="w-5 h-5" />,
    'messenger': <RiMessengerFill className="w-5 h-5" />,
    'email': <RiMailFill className="w-5 h-5" />,
    'phone': <RiPhoneFill className="w-5 h-5" />,
  };
  return iconMap[icon.toLowerCase()] || <RiExternalLinkLine className="w-5 h-5" />;
}

/**
 * 呼吸动画变体
 * @description ease 使用元组形式以满足 Motion 类型要求
 */
const breatheVariants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

/**
 * 菜单项动画变体
 */
const menuItemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.9 },
};

/**
 * 悬浮客服按钮组件
 * @description 位置：页面靠右垂直居中悬浮
 * 支持单个链接（直接打开）或多个链接（展开菜单）
 */
export function FloatingService() {
  const { isAnimationEnabled } = useAnimationConfig();
  const [isExpanded, setIsExpanded] = useState(false);

  // 从 API 获取客服链接列表
  const { data: serviceLinks, isLoading } = useQuery({
    queryKey: ['service-links'],
    queryFn: () => api.get<ServiceLinksResponse>('/service-links'),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  const links = serviceLinks?.list || [];

  // 如果没有链接或正在加载，不显示
  if (isLoading || links.length === 0) {
    return null;
  }

  /**
   * 处理点击事件
   * 如果只有一个链接，直接打开；否则展开菜单
   */
  const handleMainClick = () => {
    if (links.length === 1) {
      window.open(links[0].url, '_blank');
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  /**
   * 处理链接点击
   */
  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
    setIsExpanded(false);
  };

  const mainButton = (
    <button
      onClick={handleMainClick}
      className={cn(
        // 圆形按钮
        'w-14 h-14 rounded-full',
        // 背景渐变
        'bg-gradient-to-br from-primary-400 to-primary-500',
        // 柔和阴影 + 发光
        'shadow-glow-sm',
        // 微妙边框
        'border border-primary-300/50',
        // Flex 居中
        'flex items-center justify-center',
        // 过渡效果
        'transition-all duration-200',
        // 悬停效果
        'hover:shadow-glow hover:scale-105',
        // 点击效果
        'active:scale-95',
        // 聚焦样式
        'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2'
      )}
      aria-label="اتصل بخدمة العملاء"
      aria-expanded={isExpanded}
    >
      {isExpanded ? (
        <RiCloseLine className="w-6 h-6 text-white" />
      ) : (
        <RiCustomerServiceFill className="w-6 h-6 text-white" />
      )}
    </button>
  );

  return (
    <div
      className={cn(
        // 固定定位 - 靠右居中悬浮
        'fixed right-4 z-50',
        // 垂直居中
        'top-1/2 -translate-y-1/2',
      )}
    >
      {/* 展开的客服链接菜单 */}
      <AnimatePresence>
        {isExpanded && links.length > 1 && (
          <m.div
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-16 right-0 flex flex-col gap-2 mb-2"
          >
            {links.map((link: ServiceLink, index: number) => (
              <m.button
                key={link.url}
                variants={menuItemVariants}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleLinkClick(link.url)}
                className={cn(
                  // 圆角按钮
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  // 背景
                  'bg-white/90 backdrop-blur-sm',
                  // 阴影
                  'shadow-lg',
                  // 边框
                  'border border-neutral-200',
                  // 过渡
                  'transition-all duration-200',
                  // 悬停效果
                  'hover:bg-white hover:shadow-xl hover:scale-105',
                  // 点击效果
                  'active:scale-95',
                  // 文本样式
                  'text-sm font-medium text-neutral-700',
                  // 最小宽度
                  'min-w-max'
                )}
              >
                <span className="text-primary-500">
                  {getIconComponent(link.icon)}
                </span>
                <span>{link.name}</span>
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>

      {/* 主按钮 */}
      {isAnimationEnabled && !isExpanded ? (
        <m.div
          variants={breatheVariants}
          animate="animate"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRINGS.snappy}
        >
          {mainButton}
        </m.div>
      ) : (
        mainButton
      )}
    </div>
  );
}
