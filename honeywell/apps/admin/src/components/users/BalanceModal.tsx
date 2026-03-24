/**
 * @file 调整余额弹窗
 * @description 单个用户余额调整弹窗
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md 第6.1节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Radio,
  InputNumber,
  Input,
  Typography,
  Space,
  Alert,
  App,
} from 'antd';
import { RiMoneyDollarCircleLine } from '@remixicon/react';
import { adjustUserBalance } from '@/services/users';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import { formatCurrency } from '@/utils/format';
import type { UserListItem, BalanceAdjustType } from '@/types/users';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface BalanceModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserListItem | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  type: BalanceAdjustType;
  amount: number;
  remark: string;
}

/**
 * 调整余额弹窗
 * @description 依据：04.3.1-用户列表页.md 第6.1节
 */
export function BalanceModal({ open, user, onClose, onSuccess }: BalanceModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const config = useGlobalConfig();

  // 监听类型变化，用于校验扣减金额
  const adjustType = Form.useWatch('type', form);

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        type: 'ADD',
        amount: undefined,
        remark: '',
      });
    }
  }, [open, form]);

  // 提交处理
  const handleSubmit = async () => {
    if (!user) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const result = await adjustUserBalance(user.id, {
        type: values.type,
        amount: values.amount.toFixed(2),
        remark: values.remark || undefined,
      });

      message.success(`余额调整成功，调整后余额：${formatCurrency(result.balanceAfter)}`);
      onSuccess();
      onClose();
    } catch (error) {
      // 错误已在 request 中处理
      console.error('调整余额失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 校验扣减金额不超过可用余额
  const validateAmount = (_: unknown, value: number) => {
    if (!value || value <= 0) {
      return Promise.reject(new Error('请输入有效金额'));
    }
    if (adjustType === 'DEDUCT' && user) {
      const availableBalance = Number(user.availableBalance);
      if (value > availableBalance) {
        return Promise.reject(new Error('扣减金额不能超过当前可用余额'));
      }
    }
    return Promise.resolve();
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <RiMoneyDollarCircleLine size={20} />
          <span>调整余额 - 用户 {user.phone}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确定调整"
      cancelText="取消"
      width={500}
      destroyOnHidden
    >
      {/* 当前余额信息 */}
      <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <Space direction="vertical" size={4}>
          <Text type="secondary">当前可用余额</Text>
          <Title level={4} style={{ margin: 0 }}>
            {formatCurrency(user.availableBalance)}
          </Title>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: 'ADD',
        }}
      >
        {/* 操作类型 */}
        <Form.Item
          name="type"
          label="操作类型"
          rules={[{ required: true, message: '请选择操作类型' }]}
        >
          <Radio.Group>
            <Radio value="ADD">增加余额</Radio>
            <Radio value="DEDUCT">扣减余额</Radio>
          </Radio.Group>
        </Form.Item>

        {/* 调整金额 */}
        <Form.Item
          name="amount"
          label="调整金额"
          rules={[
            { required: true, message: '请输入调整金额' },
            { validator: validateAmount },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入金额"
            min={0.01}
            max={999999999}
            precision={2}
            prefix={config.currencySymbol}
          />
        </Form.Item>

        {/* 扣减提示 */}
        {adjustType === 'DEDUCT' && (
          <Alert
            message="扣减金额不能超过当前可用余额"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 备注说明 */}
        <Form.Item
          name="remark"
          label="备注说明"
        >
          <TextArea
            placeholder="请输入备注（选填，会记入操作日志）"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default BalanceModal;
