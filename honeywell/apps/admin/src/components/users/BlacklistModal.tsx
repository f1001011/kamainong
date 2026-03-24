/**
 * @file 拉黑确认弹窗
 * @description 将用户相关信息加入黑名单的确认弹窗
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md 第6.5节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Typography,
  Space,
  Alert,
  App,
} from 'antd';
import { RiProhibitedLine } from '@remixicon/react';
import { addToBlacklist } from '@/services/users';
import type { UserListItem, BlacklistType } from '@/types/users';

const { Text } = Typography;
const { TextArea } = Input;

export interface BlacklistModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserListItem | null;
  /** 拉黑类型 */
  type: BlacklistType;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  reason: string;
}

/**
 * 拉黑类型标签映射
 */
const BLACKLIST_TYPE_LABELS: Record<BlacklistType, { label: string; warning: string }> = {
  PHONE: {
    label: '手机号',
    warning: '该手机号将无法注册新账号和登录已有账号',
  },
  IP: {
    label: '注册IP',
    warning: '该IP地址将无法注册新账号',
  },
  BANK_CARD: {
    label: '银行卡',
    warning: '该银行卡将无法用于提现',
  },
};

/**
 * 拉黑确认弹窗
 * @description 依据：04.3.1-用户列表页.md 第6.5节
 */
export function BlacklistModal({
  open,
  user,
  type,
  onClose,
  onSuccess,
}: BlacklistModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const typeInfo = BLACKLIST_TYPE_LABELS[type];

  // 获取拉黑的值
  const getValue = (): string => {
    if (!user) return '';
    switch (type) {
      case 'PHONE':
        return user.phone;
      case 'IP':
        return user.registerIp || '';
      case 'BANK_CARD':
        return ''; // 银行卡需要从用户详情获取
      default:
        return '';
    }
  };

  const value = getValue();

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  // 提交处理
  const handleSubmit = async () => {
    if (!user || !value) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      await addToBlacklist({
        type,
        value,
        reason: values.reason || undefined,
      });

      message.success(`${typeInfo.label} ${value} 已加入黑名单`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('拉黑操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  // IP为空时提示
  if (type === 'IP' && !user.registerIp) {
    return (
      <Modal
        title={
          <Space>
            <RiProhibitedLine size={20} style={{ color: '#ff4d4f' }} />
            <span>拉黑{typeInfo.label}</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={450}
      >
        <Alert
          message="无法拉黑"
          description="该用户没有注册IP记录"
          type="warning"
          showIcon
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <Space>
          <RiProhibitedLine size={20} style={{ color: '#ff4d4f' }} />
          <span>拉黑{typeInfo.label}确认</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确定拉黑"
      okButtonProps={{ danger: true }}
      cancelText="取消"
      width={480}
      destroyOnHidden
    >
      {/* 确认提示 */}
      <div style={{ marginBottom: 16 }}>
        <Text>
          确定要将{typeInfo.label} <Text strong code>{value}</Text> 加入黑名单吗？
        </Text>
      </div>

      {/* 影响说明 */}
      <Alert
        message="拉黑后的影响"
        description={typeInfo.warning}
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        {/* 拉黑原因 */}
        <Form.Item name="reason" label="拉黑原因">
          <TextArea
            placeholder="请输入拉黑原因（选填，会记入黑名单备注）"
            rows={3}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default BlacklistModal;
