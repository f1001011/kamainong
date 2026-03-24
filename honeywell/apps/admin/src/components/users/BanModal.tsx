/**
 * @file 封禁用户确认弹窗
 * @description 封禁/解封用户的二次确认弹窗，包含用户摘要信息和影响说明
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md 第6.3节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  Alert,
  App,
  Divider,
} from 'antd';
import { RiAlertLine, RiShieldLine } from '@remixicon/react';
import { banUser, unbanUser } from '@/services/users';
import { UserInfoCard } from '@/components/business/UserInfoCard';
import { formatCurrency } from '@/utils/format';
import type { UserListItem } from '@/types/users';

const { Text } = Typography;
const { TextArea } = Input;

/**
 * 常用封禁原因选项
 */
const BAN_REASON_OPTIONS = [
  { value: '违规操作', label: '违规操作' },
  { value: '恶意刷单', label: '恶意刷单' },
  { value: '欺诈行为', label: '欺诈行为' },
  { value: '多账号操作', label: '多账号操作' },
  { value: '恶意投诉', label: '恶意投诉' },
  { value: 'custom', label: '自定义原因...' },
];

export interface BanModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserListItem | null;
  /** 操作类型：封禁或解封 */
  action: 'ban' | 'unban';
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  reasonType: string;
  customReason: string;
}

/**
 * 封禁/解封用户确认弹窗
 * @description 依据：04.3.1-用户列表页.md 第6.3节
 * @features
 * - 显示用户摘要信息（UserInfoCard）
 * - 封禁原因支持预设选项和自定义输入
 * - 显示操作影响提示列表
 * - danger=true 危险操作样式
 */
export function BanModal({ open, user, action, onClose, onSuccess }: BanModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const isBan = action === 'ban';

  // 监听原因类型变化
  const reasonType = Form.useWatch('reasonType', form);
  const showCustomInput = reasonType === 'custom';

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        reasonType: '',
        customReason: '',
      });
    }
  }, [open, form]);

  // 提交处理
  const handleSubmit = async () => {
    // 防御性检查：确保 user 和 user.id 都存在
    if (!user || user.id === undefined || user.id === null) {
      console.error('封禁/解封操作失败：用户信息无效', { user });
      message.error('用户信息无效，请刷新页面后重试');
      return;
    }

    try {
      setLoading(true);

      if (isBan) {
        const values = await form.validateFields();
        // 获取封禁原因
        const reason =
          values.reasonType === 'custom'
            ? values.customReason
            : values.reasonType || undefined;

        await banUser(user.id, { reason });
        message.success('用户已封禁');
      } else {
        await unbanUser(user.id);
        message.success('用户已解封');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('操作失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          {isBan ? (
            <RiAlertLine size={20} style={{ color: '#ff4d4f' }} />
          ) : (
            <RiShieldLine size={20} style={{ color: '#52c41a' }} />
          )}
          <span>{isBan ? '封禁用户确认' : '解封用户确认'}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText={isBan ? '确定封禁' : '确定解封'}
      okButtonProps={{
        danger: isBan,
      }}
      cancelText="取消"
      width={520}
      destroyOnHidden
    >
      {/* 用户信息卡片 */}
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: isBan ? 'rgba(255, 77, 79, 0.04)' : 'rgba(82, 196, 26, 0.04)',
          borderRadius: 12,
          border: `1px solid ${isBan ? 'rgba(255, 77, 79, 0.1)' : 'rgba(82, 196, 26, 0.1)'}`,
        }}
      >
        <UserInfoCard
          userId={user.id}
          phone={user.phone}
          nickname={user.nickname}
          vipLevel={user.vipLevel}
          status={user.status}
          showStatus
          showVip
          clickable={false}
          size="default"
        />
        
        {/* 用户余额信息 */}
        <Divider style={{ margin: '12px 0' }} />
        <Space size={24}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>可用余额</Text>
            <div>
              <Text strong style={{ fontFamily: 'Roboto Mono, monospace' }}>
                {formatCurrency(user.availableBalance)}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>冻结余额</Text>
            <div>
              <Text 
                strong 
                style={{ 
                  fontFamily: 'Roboto Mono, monospace',
                  color: Number(user.frozenBalance) > 0 ? '#ff4d4f' : undefined,
                }}
              >
                {formatCurrency(user.frozenBalance)}
              </Text>
            </div>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>团队人数</Text>
            <div>
              <Text strong>{user.teamCount}</Text>
            </div>
          </div>
        </Space>
      </div>

      {isBan ? (
        <>
          {/* 封禁影响说明 */}
          <Alert
            message="封禁后将自动执行以下操作"
            description={
              <ul style={{ margin: 0, paddingLeft: 16, marginTop: 8 }}>
                <li>可用余额全部转入冻结余额</li>
                <li>待审核提现订单自动拒绝并退回</li>
                <li>持仓收益停止发放（封禁期间不补发）</li>
                <li>禁止用户登录系统</li>
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form form={form} layout="vertical">
            {/* 封禁原因 - 选择 */}
            <Form.Item name="reasonType" label="封禁原因">
              <Select
                placeholder="请选择封禁原因（选填）"
                options={BAN_REASON_OPTIONS}
                allowClear
              />
            </Form.Item>

            {/* 自定义封禁原因 */}
            {showCustomInput && (
              <Form.Item
                name="customReason"
                label="自定义原因"
                rules={[
                  {
                    required: showCustomInput,
                    message: '请输入自定义封禁原因',
                  },
                ]}
              >
                <TextArea
                  placeholder="请输入封禁原因"
                  rows={3}
                  maxLength={200}
                  showCount
                />
              </Form.Item>
            )}
          </Form>
        </>
      ) : (
        <>
          {/* 解封确认内容 */}
          <Alert
            message="解封后用户将恢复正常使用"
            description={
              <ul style={{ margin: 0, paddingLeft: 16, marginTop: 8 }}>
                <li>用户可以正常登录系统</li>
                <li>用户可以正常充值、购买产品</li>
                <li>用户可以正常发起提现申请</li>
                <li style={{ color: '#faad14' }}>
                  被冻结的余额需要管理员手动处理
                </li>
              </ul>
            }
            type="info"
            showIcon
          />
        </>
      )}
    </Modal>
  );
}

export default BanModal;
