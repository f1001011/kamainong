/**
 * @file 邀请链路弹窗
 * @description 显示用户的邀请链路关系
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md 第10.5节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Space,
  Spin,
  Tag,
  Button,
  Card,
  Empty,
} from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiLink,
  RiArrowDownLine,
  RiUser3Fill,
  RiVipCrownFill,
  RiExternalLinkLine,
} from '@remixicon/react';
import { fetchUserUpline } from '@/services/users';
import { UserStatusBadge } from '@/components/common/StatusBadge';
import type { UserDetail, UplineResponse, UserBrief } from '@/types/users';

const { Text, Title } = Typography;

export interface UplineModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserDetail | null;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 用户卡片组件
 */
function UserCard({
  user,
  level,
  isCurrent = false,
  onJump,
}: {
  user: UserBrief | null;
  level: string;
  isCurrent?: boolean;
  onJump?: (userId: number) => void;
}) {
  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{level}</Text>
        <Card
          size="small"
          style={{
            marginTop: 4,
            background: '#fafafa',
            borderColor: '#e8e8e8',
            borderStyle: 'dashed',
          }}
        >
          <Text type="secondary">无上级</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <Text
        type="secondary"
        style={{
          fontSize: 12,
          fontWeight: isCurrent ? 600 : 400,
          color: isCurrent ? '#1677ff' : undefined,
        }}
      >
        {level}
      </Text>
      <Card
        size="small"
        style={{
          marginTop: 4,
          background: isCurrent ? '#e6f4ff' : '#fff',
          borderColor: isCurrent ? '#1677ff' : '#e8e8e8',
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {/* ID */}
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {user.id}
          </Text>
          
          {/* 手机号 */}
          <Text strong style={{ fontSize: 14 }}>
            {user.phone}
          </Text>
          
          {/* 昵称 */}
          {user.nickname && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user.nickname}
            </Text>
          )}
          
          {/* VIP + 状态 */}
          <Space size={4} style={{ marginTop: 4 }}>
            <Tag
              icon={<RiVipCrownFill size={12} style={{ marginRight: 2 }} />}
              color="blue"
              style={{ margin: 0, fontSize: 11, padding: '0 6px' }}
            >
              VIP{user.vipLevel}
            </Tag>
            <UserStatusBadge status={user.status} />
          </Space>
          
          {/* 跳转按钮（非当前用户） */}
          {!isCurrent && onJump && (
            <Button
              type="link"
              size="small"
              icon={<RiExternalLinkLine size={14} />}
              onClick={() => onJump(user.id)}
              style={{ marginTop: 8, padding: 0, height: 'auto' }}
            >
              查看详情
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
}

/**
 * 箭头组件
 */
function Arrow() {
  return (
    <div style={{ textAlign: 'center', margin: '4px 0' }}>
      <RiArrowDownLine size={20} style={{ color: '#d9d9d9' }} />
    </div>
  );
}

/**
 * 邀请链路弹窗
 */
export function UplineModal({
  open,
  user,
  onClose,
}: UplineModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uplineData, setUplineData] = useState<UplineResponse | null>(null);

  // 加载邀请链路数据
  useEffect(() => {
    if (open && user) {
      setLoading(true);
      fetchUserUpline(user.id)
        .then((res) => {
          setUplineData(res);
        })
        .catch((error) => {
          console.error('加载邀请链路失败:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, user]);

  // 跳转到用户详情
  const handleJump = (userId: number) => {
    onClose();
    router.push(`/users/${userId}`);
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <RiLink size={20} />
          <span>邀请链路 - {user.phone}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={400}
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div style={{ padding: '16px 0' }}>
          {/* 三级上级 */}
          <UserCard
            user={uplineData?.level3 || null}
            level="三级上级"
            onJump={handleJump}
          />
          
          <Arrow />
          
          {/* 二级上级 */}
          <UserCard
            user={uplineData?.level2 || null}
            level="二级上级"
            onJump={handleJump}
          />
          
          <Arrow />
          
          {/* 一级上级（直接邀请人） */}
          <UserCard
            user={uplineData?.level1 || null}
            level="一级上级（直接邀请人）"
            onJump={handleJump}
          />
          
          <Arrow />
          
          {/* 当前用户 */}
          <UserCard
            user={uplineData?.user || null}
            level="当前用户"
            isCurrent
          />
        </div>
      </Spin>
    </Modal>
  );
}

export default UplineModal;
