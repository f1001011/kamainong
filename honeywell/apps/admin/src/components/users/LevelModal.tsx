/**
 * @file 修改等级弹窗
 * @description 修改用户的VIP/SVIP等级
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md 第10.4节
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Typography,
  Space,
  Alert,
  App,
  Tag,
  Descriptions,
} from 'antd';
import { RiVipCrownFill, RiInformationLine, RiVipDiamondFill } from '@remixicon/react';
import { updateUserLevel } from '@/services/users';
import type { UserDetail, UpdateLevelParams } from '@/types/users';
import { VIP_LEVEL_OPTIONS, SVIP_LEVEL_OPTIONS } from '@/types/users';

const { Text, Title } = Typography;

export interface LevelModalProps {
  /** 是否显示 */
  open: boolean;
  /** 用户信息 */
  user: UserDetail | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

interface FormValues {
  vipLevel: number;
  svipLevel: number;
}

/**
 * 修改等级弹窗
 */
export function LevelModal({
  open,
  user,
  onClose,
  onSuccess,
}: LevelModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // 重置表单并设置初始值
  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        vipLevel: user.vipLevel,
        svipLevel: user.svipLevel,
      });
    }
  }, [open, user, form]);

  // 提交处理
  const handleSubmit = async () => {
    if (!user) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // 只提交有变化的字段
      const params: UpdateLevelParams = {};
      if (values.vipLevel !== user.vipLevel) {
        params.vipLevel = values.vipLevel;
      }
      if (values.svipLevel !== user.svipLevel) {
        params.svipLevel = values.svipLevel;
      }

      // 检查是否有变化
      if (Object.keys(params).length === 0) {
        message.warning('等级未做任何修改');
        return;
      }

      await updateUserLevel(user.id, params);
      message.success('等级修改成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('修改等级失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      title={
        <Space>
          <RiVipCrownFill size={20} />
          <span>修改用户等级 - {user.phone}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="确定修改"
      cancelText="取消"
      width={480}
      destroyOnHidden
    >
      {/* 当前等级显示 */}
      <div
        style={{
          marginBottom: 24,
          padding: 16,
          background: '#f5f5f5',
          borderRadius: 8,
        }}
      >
        <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
          当前等级
        </Text>
        <Space size={16}>
          <Tag
            icon={<RiVipCrownFill size={14} style={{ marginRight: 4 }} />}
            color="blue"
            style={{ padding: '4px 12px', fontSize: 14 }}
          >
            VIP{user.vipLevel}
          </Tag>
          <Tag
            icon={<RiVipDiamondFill size={14} style={{ marginRight: 4 }} />}
            color="gold"
            style={{ padding: '4px 12px', fontSize: 14 }}
          >
            SVIP{user.svipLevel}
          </Tag>
        </Space>
      </div>

      <Form form={form} layout="vertical">
        {/* VIP等级 */}
        <Form.Item
          name="vipLevel"
          label={
            <Space>
              <RiVipCrownFill size={16} style={{ color: '#1677ff' }} />
              <span>VIP等级</span>
            </Space>
          }
          rules={[{ required: true, message: '请选择VIP等级' }]}
        >
          <Select
            placeholder="请选择VIP等级"
            options={VIP_LEVEL_OPTIONS}
          />
        </Form.Item>

        {/* SVIP等级 */}
        <Form.Item
          name="svipLevel"
          label={
            <Space>
              <RiVipDiamondFill size={16} style={{ color: '#d4a017' }} />
              <span>SVIP等级</span>
            </Space>
          }
          rules={[{ required: true, message: '请选择SVIP等级' }]}
        >
          <Select
            placeholder="请选择SVIP等级"
            options={SVIP_LEVEL_OPTIONS}
          />
        </Form.Item>

        {/* 提示信息 */}
        <Alert
          message="修改等级不会影响已有持仓订单的收益"
          type="warning"
          showIcon
          icon={<RiInformationLine size={16} />}
        />
      </Form>
    </Modal>
  );
}

export default LevelModal;
