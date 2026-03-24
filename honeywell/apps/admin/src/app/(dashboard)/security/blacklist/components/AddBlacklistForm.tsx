/**
 * @file 添加黑名单表单弹窗
 * @description 添加单条黑名单记录，支持手机号/IP/银行卡三种类型
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第七节
 */

'use client';

import React, { useEffect } from 'react';
import { ModalForm, ProFormRadio, ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Form } from 'antd';
import type { BlacklistType, BlacklistFormData } from '@/types/blacklist';
import { blacklistTypeMap } from '@/types/blacklist';

interface AddBlacklistFormProps {
  /** 是否显示 */
  visible: boolean;
  /** 默认黑名单类型 */
  defaultType: BlacklistType;
  /** 取消回调 */
  onCancel: () => void;
  /** 提交回调 */
  onSubmit: (values: BlacklistFormData) => Promise<void>;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 手机号验证规则（摩洛哥9位数字）
 */
const phoneRules = [
  { required: true, message: '请输入手机号' },
  { pattern: /^\d{9}$/, message: '请输入9位数字手机号' },
];

/**
 * IP验证规则（支持通配符）
 */
const ipRules = [
  { required: true, message: '请输入IP地址' },
  {
    pattern: /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/,
    message: '请输入有效的IP地址格式，支持通配符如 192.168.*.*',
  },
];

/**
 * 银行卡号验证规则（8-20位数字）
 */
const bankCardRules = [
  { required: true, message: '请输入银行卡号' },
  { pattern: /^\d{16,19}$/, message: '请输入16-19位数字的银行卡号' },
];

/**
 * 获取验证规则
 */
const getValueRules = (type: BlacklistType) => {
  switch (type) {
    case 'PHONE':
      return phoneRules;
    case 'IP':
      return ipRules;
    case 'BANK_CARD':
      return bankCardRules;
    default:
      return phoneRules;
  }
};

/**
 * 添加黑名单表单
 */
const AddBlacklistForm: React.FC<AddBlacklistFormProps> = ({
  visible,
  defaultType,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();

  // 监听类型变化
  const currentType = Form.useWatch('type', form) as BlacklistType;

  // 弹窗打开时设置默认类型
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ type: defaultType });
    }
  }, [visible, defaultType, form]);

  // 获取当前类型配置
  const currentConfig = blacklistTypeMap[currentType || defaultType];

  return (
    <ModalForm<BlacklistFormData>
      title="添加黑名单"
      form={form}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
          form.resetFields();
        }
      }}
      onFinish={async (values) => {
        await onSubmit(values);
        form.resetFields();
        return true;
      }}
      submitter={{
        searchConfig: {
          submitText: '确定添加',
          resetText: '取消',
        },
        submitButtonProps: {
          loading,
        },
      }}
      modalProps={{
        destroyOnHidden: true,
        maskClosable: false,
      }}
      width={500}
    >
      <ProFormRadio.Group
        name="type"
        label="黑名单类型"
        rules={[{ required: true, message: '请选择黑名单类型' }]}
        options={[
          { label: '手机号', value: 'PHONE' },
          { label: 'IP地址', value: 'IP' },
          { label: '银行卡号', value: 'BANK_CARD' },
        ]}
        fieldProps={{
          onChange: () => {
            // 类型切换时清空value字段
            form.setFieldValue('value', '');
            // 清除value字段的错误提示
            form.setFields([{ name: 'value', errors: [] }]);
          },
        }}
      />

      <ProFormText
        name="value"
        label={currentConfig?.valueLabel || '值'}
        placeholder={currentConfig?.placeholder}
        rules={getValueRules(currentType || defaultType)}
        fieldProps={{
          maxLength: currentType === 'BANK_CARD' ? 19 : currentType === 'PHONE' ? 9 : 50, // 摩洛哥9位手机号
        }}
      />

      <ProFormTextArea
        name="reason"
        label="添加原因"
        placeholder="选填，最多500字符"
        fieldProps={{
          maxLength: 500,
          showCount: true,
          rows: 3,
        }}
        rules={[{ max: 500, message: '添加原因最多500字符' }]}
      />
    </ModalForm>
  );
};

export default AddBlacklistForm;
