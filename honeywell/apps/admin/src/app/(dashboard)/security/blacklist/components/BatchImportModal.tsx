/**
 * @file 批量导入黑名单弹窗
 * @description 支持批量粘贴导入黑名单，实时预检校验
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第八节
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Select, Input, Typography, Space, Tag, Alert } from 'antd';
import { RiCheckboxCircleLine, RiCloseCircleLine, RiInformationLine } from '@remixicon/react';
import type { BlacklistType, PreCheckResult } from '@/types/blacklist';
import { blacklistTypeMap } from '@/types/blacklist';

const { TextArea } = Input;
const { Text } = Typography;

interface BatchImportModalProps {
  /** 是否显示 */
  visible: boolean;
  /** 默认黑名单类型 */
  defaultType: BlacklistType;
  /** 取消回调 */
  onCancel: () => void;
  /** 提交回调 */
  onSubmit: (data: { type: string; values: string[]; reason?: string }) => Promise<void>;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 校验单条值
 * @description 与后端验证规则保持一致
 */
function validateValue(value: string, type: BlacklistType): { valid: boolean; error?: string } {
  switch (type) {
    case 'PHONE':
      // 摩洛哥手机号：9位数字
      if (!/^\d{9}$/.test(value)) {
        return { valid: false, error: '手机号格式错误（需9位数字）' };
      }
      break;
    case 'IP':
      // 支持通配符，如 192.168.*.*
      if (!/^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/.test(value)) {
        return { valid: false, error: 'IP格式错误' };
      }
      break;
    case 'BANK_CARD':
      // 银行卡号：16-19位数字
      if (!/^\d{16,19}$/.test(value)) {
        return { valid: false, error: '银行卡号格式错误（需16-19位数字）' };
      }
      break;
  }
  return { valid: true };
}

/**
 * 预检输入数据
 */
function preCheckValues(input: string, type: BlacklistType): PreCheckResult {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const total = lines.length;
  const seen = new Set<string>();
  const duplicatesList: string[] = [];
  const invalidItems: Array<{ value: string; error: string }> = [];
  const validValues: string[] = [];

  lines.forEach((line) => {
    // 检查重复
    if (seen.has(line)) {
      duplicatesList.push(line);
      return;
    }
    seen.add(line);

    // 校验格式
    const result = validateValue(line, type);
    if (!result.valid) {
      invalidItems.push({ value: line, error: result.error! });
    } else {
      validValues.push(line);
    }
  });

  return {
    total,
    valid: validValues.length,
    invalid: invalidItems.length,
    duplicates: duplicatesList.length,
    invalidItems,
  };
}

/**
 * 批量导入弹窗
 */
const BatchImportModal: React.FC<BatchImportModalProps> = ({
  visible,
  defaultType,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const [preCheckResult, setPreCheckResult] = useState<PreCheckResult | null>(null);

  // 监听type和values变化
  const currentType = Form.useWatch('type', form) as BlacklistType;
  const inputValues = Form.useWatch('values', form) as string;

  // 弹窗打开时重置
  useEffect(() => {
    if (visible) {
      form.setFieldsValue({ type: defaultType, values: '', reason: '' });
      setPreCheckResult(null);
    }
  }, [visible, defaultType, form]);

  // 输入变化时预检
  useEffect(() => {
    if (inputValues && currentType) {
      const result = preCheckValues(inputValues, currentType);
      setPreCheckResult(result);
    } else {
      setPreCheckResult(null);
    }
  }, [inputValues, currentType]);

  // 当前类型配置
  const currentConfig = useMemo(() => {
    return blacklistTypeMap[currentType || defaultType];
  }, [currentType, defaultType]);

  /**
   * 提交处理
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // 解析并去重
      const lines = values.values
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);

      const uniqueValues = [...new Set(lines)] as string[];

      // 过滤掉格式错误的
      const validValues = uniqueValues.filter((v) => validateValue(v, values.type).valid);

      if (validValues.length === 0) {
        return;
      }

      await onSubmit({
        type: values.type,
        values: validValues,
        reason: values.reason || undefined,
      });
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  /**
   * 获取预检结果的Alert类型
   */
  const getAlertType = () => {
    if (!preCheckResult) return 'info';
    if (preCheckResult.valid === 0) return 'error';
    if (preCheckResult.invalid > 0 || preCheckResult.duplicates > 0) return 'warning';
    return 'success';
  };

  return (
    <Modal
      title="批量导入黑名单"
      open={visible}
      onCancel={() => {
        onCancel();
        form.resetFields();
        setPreCheckResult(null);
      }}
      onOk={handleSubmit}
      okText="确定导入"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
      okButtonProps={{
        disabled: !preCheckResult || preCheckResult.valid === 0,
      }}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="黑名单类型"
          rules={[{ required: true, message: '请选择黑名单类型' }]}
        >
          <Select
            options={[
              { label: '手机号黑名单', value: 'PHONE' },
              { label: 'IP黑名单', value: 'IP' },
              { label: '银行卡黑名单', value: 'BANK_CARD' },
            ]}
            onChange={() => {
              form.setFieldValue('values', '');
              setPreCheckResult(null);
            }}
          />
        </Form.Item>

        <Form.Item
          name="values"
          label="导入数据"
          rules={[{ required: true, message: '请输入要导入的数据' }]}
          extra={
            <Text type="secondary">
              每行输入一条，将自动去重和校验格式。
              {currentConfig && ` 当前格式要求：${currentConfig.placeholder}`}
            </Text>
          }
        >
          <TextArea rows={8} placeholder={`请输入${currentConfig?.valueLabel || '数据'}，每行一条`} />
        </Form.Item>

        <Form.Item name="reason" label="添加原因" rules={[{ max: 500, message: '添加原因最多500字符' }]}>
          <Input placeholder="选填，批量导入的统一原因" maxLength={500} />
        </Form.Item>

        {/* 预检结果显示 */}
        {preCheckResult && (
          <Alert
            type={getAlertType()}
            showIcon
            icon={
              getAlertType() === 'success' ? (
                <RiCheckboxCircleLine size={16} />
              ) : getAlertType() === 'error' ? (
                <RiCloseCircleLine size={16} />
              ) : (
                <RiInformationLine size={16} />
              )
            }
            message={
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap>
                  <span>预检结果：</span>
                  <Tag color="blue">共 {preCheckResult.total} 条</Tag>
                  <Tag color="green">有效 {preCheckResult.valid} 条</Tag>
                  {preCheckResult.invalid > 0 && <Tag color="red">格式错误 {preCheckResult.invalid} 条</Tag>}
                  {preCheckResult.duplicates > 0 && <Tag color="orange">重复 {preCheckResult.duplicates} 条</Tag>}
                </Space>

                {/* 显示部分格式错误项 */}
                {preCheckResult.invalidItems.length > 0 && preCheckResult.invalidItems.length <= 5 && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      格式错误项：
                    </Text>
                    {preCheckResult.invalidItems.map((item, index) => (
                      <div key={index} style={{ fontSize: 12, marginLeft: 8 }}>
                        <Text type="danger" style={{ fontFamily: 'monospace' }}>
                          {item.value}
                        </Text>
                        <Text type="secondary"> - {item.error}</Text>
                      </div>
                    ))}
                  </div>
                )}
                {preCheckResult.invalidItems.length > 5 && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    （还有 {preCheckResult.invalidItems.length - 5} 条格式错误...）
                  </Text>
                )}
              </Space>
            }
          />
        )}
      </Form>
    </Modal>
  );
};

export default BatchImportModal;
