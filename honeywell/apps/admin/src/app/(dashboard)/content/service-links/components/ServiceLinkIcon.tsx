/**
 * @file 客服图标显示组件
 * @description 支持预设图标（小写字符串）和自定义图片URL
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.3-客服链接配置页.md
 */

'use client';

import React from 'react';
import {
  RiTelegramFill,
  RiWhatsappFill,
  RiCustomerService2Fill,
  RiCustomerServiceFill,
  RiMessengerFill,
  RiLineFill,
  RiWechatFill,
  RiMailFill,
  RiPhoneFill,
} from '@remixicon/react';
import { Image } from 'antd';
import { PRESET_ICON_COLORS } from '@/types/service-link';

interface ServiceLinkIconProps {
  /** 图标标识（预设图标或URL） */
  icon: string;
  /** 图标尺寸 */
  size?: number;
  /** 自定义颜色（预设图标时生效） */
  color?: string;
}

/**
 * 预设图标映射
 * 使用小写字符串作为 key，与前端 FloatingService 组件一致
 */
const ICON_MAP: Record<string, typeof RiTelegramFill> = {
  telegram: RiTelegramFill,
  whatsapp: RiWhatsappFill,
  online_service: RiCustomerService2Fill,
  messenger: RiMessengerFill,
  line: RiLineFill,
  wechat: RiWechatFill,
  email: RiMailFill,
  phone: RiPhoneFill,
};

/**
 * 客服图标组件
 * @description 根据 icon 值自动判断是预设图标还是自定义图片
 */
export function ServiceLinkIcon({ icon, size = 24, color }: ServiceLinkIconProps) {
  // 检查是否为预设图标（小写字符串格式）
  const IconComponent = ICON_MAP[icon];

  if (IconComponent) {
    const iconColor = color || PRESET_ICON_COLORS[icon] || '#666';
    return <IconComponent size={size} color={iconColor} />;
  }

  // 自定义图标（URL）
  if (icon.startsWith('/') || icon.startsWith('http')) {
    return (
      <Image
        src={icon}
        alt="客服图标"
        width={size}
        height={size}
        style={{ objectFit: 'contain', borderRadius: 4 }}
        preview={false}
        fallback="/images/placeholder-icon.png"
      />
    );
  }

  // 默认图标（无法识别时使用）
  return <RiCustomerServiceFill size={size} color="#999" />;
}

export default ServiceLinkIcon;
