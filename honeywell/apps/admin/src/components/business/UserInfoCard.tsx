/**
 * @file 用户信息卡片组件
 * @description 显示用户头像、手机号、昵称、VIP等级、状态等信息
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Avatar, Space, Typography, Tag, Tooltip } from 'antd';
import Link from 'next/link';
import {
  RiUser3Fill,
  RiVipCrownFill,
  RiShieldCheckFill,
  RiShieldFill,
} from '@remixicon/react';
import { MaskedPhone } from '@/components/common/MaskedText';
import { UserStatusBadge } from '@/components/common/StatusBadge';

const { Text } = Typography;

/**
 * VIP等级颜色配置
 */
const VIP_COLORS: Record<number, { color: string; bgColor: string; text: string }> = {
  0: { color: '#8c8c8c', bgColor: '#f5f5f5', text: '普通' },
  1: { color: '#1677ff', bgColor: '#e6f4ff', text: 'VIP1' },
  2: { color: '#722ed1', bgColor: '#f9f0ff', text: 'VIP2' },
  3: { color: '#eb2f96', bgColor: '#fff0f6', text: 'VIP3' },
  4: { color: '#fa8c16', bgColor: '#fff7e6', text: 'VIP4' },
  5: { color: '#faad14', bgColor: '#fffbe6', text: 'VIP5' },
};

export interface UserInfoCardProps {
  /** 用户ID */
  userId: number;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname?: string | null;
  /** 头像URL */
  avatarUrl?: string | null;
  /** VIP等级 */
  vipLevel?: number;
  /** 用户状态 */
  status?: 'ACTIVE' | 'BANNED';
  /** 是否显示状态标签 */
  showStatus?: boolean;
  /** 是否显示VIP标签 */
  showVip?: boolean;
  /** 是否可点击跳转用户详情 */
  clickable?: boolean;
  /** 卡片尺寸 */
  size?: 'small' | 'default' | 'large';
  /** 布局方向 */
  layout?: 'horizontal' | 'vertical';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 获取VIP配置
 */
function getVipConfig(level: number) {
  return VIP_COLORS[level] || VIP_COLORS[0];
}

/**
 * 用户信息卡片
 * @description 显示用户头像、手机号、昵称、VIP等级、状态
 * @example
 * <UserInfoCard
 *   userId={1}
 *   phone="13800138000"
 *   nickname="张三"
 *   vipLevel={2}
 *   status="ACTIVE"
 *   clickable
 * />
 */
export function UserInfoCard({
  userId,
  phone,
  nickname,
  avatarUrl,
  vipLevel = 0,
  status = 'ACTIVE',
  showStatus = true,
  showVip = true,
  clickable = true,
  size = 'default',
  layout = 'horizontal',
  className,
  style,
}: UserInfoCardProps) {
  const vipConfig = getVipConfig(vipLevel);

  // 计算尺寸
  const sizeConfig = {
    small: { avatar: 32, fontSize: 12, gap: 8 },
    default: { avatar: 40, fontSize: 14, gap: 12 },
    large: { avatar: 48, fontSize: 16, gap: 16 },
  };

  const { avatar: avatarSize, fontSize, gap } = sizeConfig[size];

  // 用户ID显示
  const userIdDisplay = (
    <Text
      type="secondary"
      style={{
        fontSize: size === 'small' ? 11 : 12,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      ID: {userId}
    </Text>
  );

  // 用户信息内容
  const userContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: layout === 'vertical' ? 'column' : 'row',
        alignItems: layout === 'vertical' ? 'center' : 'flex-start',
        gap,
        ...style,
      }}
      className={className}
    >
      {/* 头像 */}
      <Avatar
        size={avatarSize}
        src={avatarUrl}
        icon={<RiUser3Fill size={avatarSize * 0.6} />}
        style={{
          backgroundColor: vipConfig.bgColor,
          color: vipConfig.color,
          flexShrink: 0,
        }}
      />

      {/* 信息区 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          textAlign: layout === 'vertical' ? 'center' : 'left',
        }}
      >
        {/* 第一行：昵称/手机号 + VIP */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            justifyContent: layout === 'vertical' ? 'center' : 'flex-start',
          }}
        >
          {nickname ? (
            <Text
              strong
              style={{ fontSize }}
              ellipsis={{ tooltip: nickname }}
            >
              {nickname}
            </Text>
          ) : (
            <MaskedPhone value={phone} copyable={false} />
          )}

          {/* VIP标签 - 带渐变效果 */}
          {showVip && vipLevel > 0 && (
            <Tag
              icon={<RiVipCrownFill size={12} style={{ marginRight: 2 }} />}
              style={{
                margin: 0,
                padding: '2px 8px',
                fontSize: 11,
                lineHeight: '18px',
                border: 'none',
                background: `linear-gradient(135deg, ${vipConfig.bgColor} 0%, #fff 100%)`,
                color: vipConfig.color,
                borderRadius: 'var(--radius-sm, 6px)',
                boxShadow: `0 2px 4px ${vipConfig.color}15`,
              }}
            >
              {vipConfig.text}
            </Tag>
          )}
        </div>

        {/* 第二行：手机号（如果有昵称）+ 状态 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: layout === 'vertical' ? 'center' : 'flex-start',
          }}
        >
          {nickname && (
            <MaskedPhone
              value={phone}
              style={{ fontSize: size === 'small' ? 11 : 12 }}
            />
          )}

          {/* 用户ID（仅小尺寸或无昵称时显示） */}
          {(!nickname || size === 'small') && userIdDisplay}

          {/* 状态标签 */}
          {showStatus && status !== 'ACTIVE' && (
            <UserStatusBadge status={status} />
          )}
        </div>
      </div>
    </div>
  );

  // 可点击时包装 Link - 增加 hover 效果
  if (clickable) {
    return (
      <Link
        href={`/users/${userId}`}
        style={{
          textDecoration: 'none',
          color: 'inherit',
          display: 'inline-block',
          padding: 'var(--spacing-xs, 8px)',
          margin: 'calc(var(--spacing-xs, 8px) * -1)',
          borderRadius: 'var(--radius-md, 8px)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover, #fafafa)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <Tooltip title="点击查看用户详情">
          {userContent}
        </Tooltip>
      </Link>
    );
  }

  return userContent;
}

/**
 * 用户简要信息（仅头像+手机号）
 */
export function UserBrief({
  phone,
  avatarUrl,
  className,
  style,
}: {
  phone: string;
  avatarUrl?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Space size={8} className={className} style={style}>
      <Avatar
        size={24}
        src={avatarUrl}
        icon={<RiUser3Fill size={14} />}
        style={{ backgroundColor: '#f5f5f5', color: '#8c8c8c' }}
      />
      <MaskedPhone value={phone} copyable={false} />
    </Space>
  );
}

/**
 * 用户头像组（多用户）
 */
export function UserAvatarGroup({
  users,
  max = 5,
  size = 32,
}: {
  users: Array<{ id: number; avatarUrl?: string | null; nickname?: string }>;
  max?: number;
  size?: number;
}) {
  const displayUsers = users.slice(0, max);
  const extraCount = users.length - max;

  return (
    <Avatar.Group maxCount={max} size={size}>
      {displayUsers.map((user) => (
        <Tooltip key={user.id} title={user.nickname || `用户 ${user.id}`}>
          <Avatar
            src={user.avatarUrl}
            icon={<RiUser3Fill size={size * 0.6} />}
            style={{ backgroundColor: '#f5f5f5', color: '#8c8c8c' }}
          />
        </Tooltip>
      ))}
      {extraCount > 0 && (
        <Avatar style={{ backgroundColor: '#1677ff' }}>+{extraCount}</Avatar>
      )}
    </Avatar.Group>
  );
}

export default UserInfoCard;
