/**
 * @file 用户详情页头部组件
 * @description 显示用户概要信息和快捷操作按钮
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md 第2节
 */

'use client';

import React from 'react';
import { Avatar, Space, Typography, Tag, Button, Dropdown, Skeleton } from 'antd';
import type { MenuProps } from 'antd';
import {
  RiUser3Fill,
  RiVipCrownFill,
  RiMoreLine,
  RiMoneyDollarCircleLine,
  RiGiftLine,
  RiRefreshLine,
  RiVipDiamondFill,
  RiShieldCheckFill,
  RiLockLine,
  RiForbidLine,
  RiCheckLine,
  RiLink,
  RiKeyLine,
} from '@remixicon/react';
import { CopyButton } from '@/components/common';
import { UserStatusBadge } from '@/components/common/StatusBadge';
import type { UserDetail } from '@/types/users';

const { Text, Title } = Typography;

/**
 * VIP等级颜色配置
 */
const VIP_COLORS: Record<number, { color: string; bgColor: string }> = {
  0: { color: '#8c8c8c', bgColor: '#f5f5f5' },
  1: { color: '#1677ff', bgColor: '#e6f4ff' },
  2: { color: '#722ed1', bgColor: '#f9f0ff' },
  3: { color: '#eb2f96', bgColor: '#fff0f6' },
  4: { color: '#fa8c16', bgColor: '#fff7e6' },
  5: { color: '#faad14', bgColor: '#fffbe6' },
  6: { color: '#13c2c2', bgColor: '#e6fffb' },
  7: { color: '#52c41a', bgColor: '#f6ffed' },
  8: { color: '#f5222d', bgColor: '#fff1f0' },
};

/**
 * SVIP等级颜色配置
 */
const SVIP_COLORS: Record<number, { color: string; bgColor: string }> = {
  0: { color: '#8c8c8c', bgColor: '#f5f5f5' },
  1: { color: '#d4a017', bgColor: '#fffbe6' },
  2: { color: '#c88f00', bgColor: '#fff8e6' },
  3: { color: '#b8860b', bgColor: '#fff5e6' },
  4: { color: '#a67c00', bgColor: '#fff2e6' },
  5: { color: '#9a7200', bgColor: '#ffefd6' },
  6: { color: '#8b6914', bgColor: '#ffebcc' },
  7: { color: '#7d5f0e', bgColor: '#ffe8c2' },
  8: { color: '#6f5400', bgColor: '#ffe4b8' },
};

export interface UserDetailHeaderProps {
  /** 用户详情数据 */
  user: UserDetail | null;
  /** 加载状态 */
  loading?: boolean;
  /** 打开调整余额弹窗 */
  onAdjustBalance?: () => void;
  /** 打开赠送产品弹窗 */
  onGiftProduct?: () => void;
  /** 打开恢复限购弹窗 */
  onRestorePurchase?: () => void;
  /** 打开修改等级弹窗 */
  onUpdateLevel?: () => void;
  /** 打开封禁/解封弹窗 */
  onBanUnban?: () => void;
  /** 重置密码 */
  onResetPassword?: () => void;
  /** 拉黑手机号 */
  onBlacklistPhone?: () => void;
  /** 拉黑注册IP */
  onBlacklistIP?: () => void;
  /** 查看邀请链路 */
  onViewUpline?: () => void;
}

/**
 * 获取VIP配置
 */
function getVipConfig(level: number) {
  return VIP_COLORS[level] || VIP_COLORS[0];
}

/**
 * 获取SVIP配置
 */
function getSvipConfig(level: number) {
  return SVIP_COLORS[level] || SVIP_COLORS[0];
}

/**
 * 用户详情页头部组件
 */
export function UserDetailHeader({
  user,
  loading = false,
  onAdjustBalance,
  onGiftProduct,
  onRestorePurchase,
  onUpdateLevel,
  onBanUnban,
  onResetPassword,
  onBlacklistPhone,
  onBlacklistIP,
  onViewUpline,
}: UserDetailHeaderProps) {
  // 加载状态
  if (loading || !user) {
    return (
      <div className="user-detail-header" style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
        <Skeleton avatar active paragraph={{ rows: 2 }} />
      </div>
    );
  }

  const vipConfig = getVipConfig(user.vipLevel);
  const svipConfig = getSvipConfig(user.svipLevel);

  // 更多菜单
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'resetPassword',
      icon: <RiKeyLine size={16} />,
      label: '重置密码',
      onClick: onResetPassword,
    },
    {
      key: 'blacklistPhone',
      icon: <RiForbidLine size={16} />,
      label: '拉黑手机号',
      onClick: onBlacklistPhone,
    },
    {
      key: 'blacklistIP',
      icon: <RiLockLine size={16} />,
      label: '拉黑注册IP',
      disabled: !user.registerIp,
      onClick: onBlacklistIP,
    },
    { type: 'divider' },
    {
      key: 'viewUpline',
      icon: <RiLink size={16} />,
      label: '查看邀请链路',
      onClick: onViewUpline,
    },
  ];

  return (
    <div
      className="user-detail-header"
      style={{
        padding: 24,
        background: 'linear-gradient(135deg, #fff 0%, #fafafa 100%)',
        borderRadius: 8,
        border: '1px solid #f0f0f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        {/* 用户头像 */}
        <Avatar
          size={80}
          src={user.avatarUrl}
          icon={<RiUser3Fill size={48} />}
          style={{
            backgroundColor: vipConfig.bgColor,
            color: vipConfig.color,
            flexShrink: 0,
          }}
        />

        {/* 用户信息 */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {/* 手机号 + 昵称 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Title level={4} style={{ margin: 0 }}>
              {user.phone}
            </Title>
            {user.nickname && (
              <Text type="secondary" style={{ fontSize: 16 }}>
                {user.nickname}
              </Text>
            )}
          </div>

          {/* VIP + SVIP + 状态 */}
          <Space size={8} style={{ marginTop: 8 }}>
            {/* VIP标签 */}
            <Tag
              icon={<RiVipCrownFill size={14} style={{ marginRight: 4 }} />}
              style={{
                margin: 0,
                padding: '4px 12px',
                fontSize: 13,
                border: 'none',
                background: `linear-gradient(135deg, ${vipConfig.bgColor} 0%, #fff 100%)`,
                color: vipConfig.color,
                borderRadius: 6,
                boxShadow: `0 2px 4px ${vipConfig.color}20`,
              }}
            >
              VIP{user.vipLevel}
            </Tag>

            {/* SVIP标签 */}
            <Tag
              icon={<RiVipDiamondFill size={14} style={{ marginRight: 4 }} />}
              style={{
                margin: 0,
                padding: '4px 12px',
                fontSize: 13,
                border: 'none',
                background: `linear-gradient(135deg, ${svipConfig.bgColor} 0%, #fff 100%)`,
                color: svipConfig.color,
                borderRadius: 6,
                boxShadow: `0 2px 4px ${svipConfig.color}20`,
              }}
            >
              SVIP{user.svipLevel}
            </Tag>

            {/* 状态标签 */}
            <UserStatusBadge status={user.status} />
          </Space>

          {/* 邀请码 */}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text type="secondary">邀请码：</Text>
            <Text strong style={{ fontFamily: 'monospace', fontSize: 14 }}>
              {user.inviteCode}
            </Text>
            <CopyButton text={user.inviteCode} successMessage="邀请码已复制" />
          </div>
        </div>

        {/* 操作按钮区 */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            icon={<RiMoneyDollarCircleLine size={16} />}
            onClick={onAdjustBalance}
          >
            调整余额
          </Button>
          <Button
            icon={<RiGiftLine size={16} />}
            onClick={onGiftProduct}
          >
            赠送产品
          </Button>
          <Button
            icon={<RiRefreshLine size={16} />}
            onClick={onRestorePurchase}
          >
            恢复限购
          </Button>
          <Button
            icon={<RiVipCrownFill size={16} />}
            onClick={onUpdateLevel}
          >
            修改等级
          </Button>
          <Button
            icon={user.status === 'ACTIVE' ? <RiForbidLine size={16} /> : <RiCheckLine size={16} />}
            danger={user.status === 'ACTIVE'}
            onClick={onBanUnban}
          >
            {user.status === 'ACTIVE' ? '封禁' : '解封'}
          </Button>
          <Dropdown menu={{ items: moreMenuItems }} placement="bottomRight">
            <Button icon={<RiMoreLine size={16} />}>
              更多
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 样式 */}
      <style jsx global>{`
        .user-detail-header:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
}

export default UserDetailHeader;
