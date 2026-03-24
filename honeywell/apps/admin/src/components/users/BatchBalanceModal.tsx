/**
 * @file 批量调整余额弹窗
 * @description 批量调整多个用户的余额
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md 第6.4节
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
  List,
  Tag,
} from 'antd';
import {
  RiMoneyDollarCircleLine,
  RiCheckLine,
  RiCloseLine,
} from '@remixicon/react';
import { batchAdjustBalance } from '@/services/users';
import { useGlobalConfig } from '@/hooks/useGlobalConfig';
import type { UserListItem, BalanceAdjustType, BatchOperationResponse } from '@/types/users';

const { Text, Title } = Typography;
const { TextArea } = Input;

export interface BatchBalanceModalProps {
  /** 是否显示 */
  open: boolean;
  /** 选中的用户列表 */
  users: UserListItem[];
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
 * 批量调整余额弹窗
 * @description 依据：04.3.1-用户列表页.md 第6.4节
 */
export function BatchBalanceModal({
  open,
  users,
  onClose,
  onSuccess,
}: BatchBalanceModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchOperationResponse | null>(null);
  const { message } = App.useApp();
  const config = useGlobalConfig();

  // 监听类型变化
  const adjustType = Form.useWatch('type', form);

  // 重置表单
  useEffect(() => {
    if (open) {
      form.resetFields();
      setResult(null);
      form.setFieldsValue({
        type: 'ADD',
        amount: undefined,
        remark: '',
      });
    }
  }, [open, form]);

  // 提交处理
  const handleSubmit = async () => {
    if (users.length === 0) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const res = await batchAdjustBalance({
        ids: users.map((u) => u.id),
        type: values.type,
        amount: values.amount.toFixed(2),
        remark: values.remark || undefined,
      });

      setResult(res);

      if (res.succeeded === res.total) {
        message.success(`批量操作成功，共 ${res.succeeded} 条`);
        onSuccess();
        onClose();
      } else if (res.succeeded > 0) {
        message.warning(`部分操作成功：成功 ${res.succeeded} 条，失败 ${res.failed} 条`);
      } else {
        message.error('批量操作失败');
      }
    } catch (error) {
      console.error('批量调整余额失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 关闭处理
  const handleClose = () => {
    if (result && result.succeeded > 0) {
      onSuccess();
    }
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <RiMoneyDollarCircleLine size={20} />
          <span>批量调整余额</span>
        </Space>
      }
      open={open}
      onCancel={handleClose}
      onOk={result ? handleClose : handleSubmit}
      confirmLoading={loading}
      okText={result ? '关闭' : '确定调整'}
      cancelText="取消"
      cancelButtonProps={{ style: { display: result ? 'none' : undefined } }}
      width={550}
      destroyOnHidden
    >
      {!result ? (
        <>
          {/* 已选用户数量 */}
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            <Text>
              已选择 <Text strong>{users.length}</Text> 位用户
            </Text>
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
                <Radio value="ADD">批量增加</Radio>
                <Radio value="DEDUCT">批量扣减</Radio>
              </Radio.Group>
            </Form.Item>

            {/* 调整金额 */}
            <Form.Item
              name="amount"
              label="调整金额"
              extra="每位用户统一调整此金额"
              rules={[
                { required: true, message: '请输入调整金额' },
                {
                  validator: (_, value) =>
                    value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('请输入有效金额')),
                },
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
                message="扣减时，余额不足的用户将操作失败"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 备注说明 */}
            <Form.Item name="remark" label="备注说明">
              <TextArea
                placeholder="请输入备注（选填，会记入操作日志）"
                rows={3}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Form>
        </>
      ) : (
        <>
          {/* 操作结果 */}
          <div style={{ marginBottom: 16 }}>
            <Space size={16}>
              <div>
                <Text type="secondary">总数：</Text>
                <Text strong>{result.total}</Text>
              </div>
              <div>
                <Text type="secondary">成功：</Text>
                <Text strong style={{ color: '#52c41a' }}>
                  {result.succeeded}
                </Text>
              </div>
              <div>
                <Text type="secondary">失败：</Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {result.failed}
                </Text>
              </div>
            </Space>
          </div>

          {/* 失败明细列表 */}
          {result.failed > 0 && (
            <List
              header={<Text strong>失败明细</Text>}
              bordered
              size="small"
              dataSource={result.results.filter((r) => !r.success)}
              renderItem={(item) => {
                const user = users.find((u) => u.id === item.id);
                return (
                  <List.Item>
                    <Space>
                      <RiCloseLine size={16} style={{ color: '#ff4d4f' }} />
                      <Text>{user?.phone || `ID: ${item.id}`}</Text>
                      <Tag color="error">{item.error?.message || '操作失败'}</Tag>
                    </Space>
                  </List.Item>
                );
              }}
              style={{ maxHeight: 300, overflow: 'auto' }}
            />
          )}
        </>
      )}
    </Modal>
  );
}

export default BatchBalanceModal;
