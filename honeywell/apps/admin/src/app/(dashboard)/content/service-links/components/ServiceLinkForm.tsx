/**
 * @file 客服链接表单弹窗
 * @description 添加/编辑客服链接的表单弹窗
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.3-客服链接配置页.md
 */

'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  Select,
  Switch,
  Space,
  Upload,
  Button,
  message,
  Image,
} from 'antd';
import { RiUploadCloud2Line, RiDeleteBinLine } from '@remixicon/react';
import type { UploadFile } from 'antd/es/upload/interface';
import { ServiceLinkIcon } from './ServiceLinkIcon';
import { uploadFile } from '@/services/content';
import type {
  ServiceLink,
  ServiceLinkFormValues,
  PresetIcon,
} from '@/types/service-link';
import { PRESET_ICONS } from '@/types/service-link';

interface ServiceLinkFormProps {
  /** 是否显示 */
  open: boolean;
  /** 编辑时的初始数据 */
  initialValues: ServiceLink | null;
  /** 提交回调 */
  onSubmit: (values: ServiceLinkFormValues) => void;
  /** 取消回调 */
  onCancel: () => void;
}

/**
 * 客服链接表单弹窗
 */
export function ServiceLinkForm({
  open,
  initialValues,
  onSubmit,
  onCancel,
}: ServiceLinkFormProps) {
  const [form] = Form.useForm<ServiceLinkFormValues>();
  const [uploading, setUploading] = useState(false);
  
  // 监听图标类型变化
  const iconType = Form.useWatch('iconType', form);
  const customIcon = Form.useWatch('customIcon', form);

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (initialValues) {
        // 编辑模式：判断图标类型
        const isPreset = PRESET_ICONS.some((p) => p.value === initialValues.icon);
        form.setFieldsValue({
          name: initialValues.name,
          iconType: isPreset ? 'preset' : 'custom',
          presetIcon: isPreset ? (initialValues.icon as PresetIcon) : undefined,
          customIcon: isPreset ? undefined : initialValues.icon,
          url: initialValues.url,
          isActive: initialValues.isActive,
        });
      } else {
        // 添加模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          iconType: 'preset',
          isActive: true,
        });
      }
    }
  }, [open, initialValues, form]);

  /**
   * 处理图片上传
   */
  const handleUpload = async (file: File) => {
    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      message.error('不支持的图片格式，请上传 PNG、JPG 或 SVG 格式');
      return false;
    }

    // 验证文件大小（最大 500KB）
    if (file.size > 500 * 1024) {
      message.error('图标文件过大，请选择小于 500KB 的图片');
      return false;
    }

    try {
      setUploading(true);
      const result = await uploadFile(file, 'service');
      form.setFieldValue('customIcon', result.url);
      message.success('图标上传成功');
    } catch (error) {
      message.error('图标上传失败');
    } finally {
      setUploading(false);
    }

    return false;
  };

  /**
   * 删除自定义图标
   */
  const handleRemoveIcon = () => {
    form.setFieldValue('customIcon', undefined);
  };

  /**
   * 提交表单
   */
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      // 验证失败，表单会自动显示错误
    }
  };

  return (
    <Modal
      title={initialValues ? '编辑客服链接' : '添加客服链接'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="确定"
      cancelText="取消"
      width={520}
      destroyOnHidden
      confirmLoading={uploading}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        style={{ marginTop: 24 }}
      >
        {/* 渠道名称 */}
        <Form.Item
          name="name"
          label="渠道名称"
          rules={[
            { required: true, message: '请输入客服渠道名称' },
            { max: 20, message: '名称最多20个字符' },
          ]}
        >
          <Input
            placeholder="例如：在线客服、Telegram群组"
            maxLength={20}
            showCount
          />
        </Form.Item>

        {/* 图标类型 */}
        <Form.Item
          name="iconType"
          label="图标类型"
          rules={[{ required: true, message: '请选择图标类型' }]}
        >
          <Radio.Group>
            <Radio value="preset">预设图标</Radio>
            <Radio value="custom">自定义上传</Radio>
          </Radio.Group>
        </Form.Item>

        {/* 预设图标选择 */}
        {iconType === 'preset' && (
          <Form.Item
            name="presetIcon"
            label="选择图标"
            rules={[{ required: true, message: '请选择预设图标' }]}
          >
            <Select
              placeholder="请选择图标"
              style={{ width: '100%' }}
              optionLabelProp="label"
            >
              {PRESET_ICONS.map((icon) => (
                <Select.Option
                  key={icon.value}
                  value={icon.value}
                  label={
                    <Space>
                      <ServiceLinkIcon icon={icon.value} size={16} />
                      <span>{icon.label}</span>
                    </Space>
                  }
                >
                  <Space>
                    <ServiceLinkIcon icon={icon.value} size={20} color={icon.color} />
                    <span>{icon.label}</span>
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* 自定义图标上传 */}
        {iconType === 'custom' && (
          <Form.Item
            name="customIcon"
            label="上传图标"
            rules={[{ required: true, message: '请上传自定义图标' }]}
            extra="支持 PNG、JPG、SVG 格式，建议尺寸 64x64px，最大 500KB"
          >
            {customIcon ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 12,
                  background: '#fafafa',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                }}
              >
                <Image
                  src={customIcon}
                  alt="自定义图标"
                  width={48}
                  height={48}
                  style={{ objectFit: 'contain', borderRadius: 4 }}
                  preview={false}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#333' }}>已上传图标</div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#999',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 280,
                    }}
                  >
                    {customIcon}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<RiDeleteBinLine size={16} />}
                  onClick={handleRemoveIcon}
                >
                  删除
                </Button>
              </div>
            ) : (
              <Upload.Dragger
                accept=".png,.jpg,.jpeg,.svg"
                showUploadList={false}
                beforeUpload={handleUpload}
                disabled={uploading}
              >
                <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                  <RiUploadCloud2Line size={40} color="#1677ff" />
                </p>
                <p className="ant-upload-text" style={{ fontSize: 14 }}>
                  {uploading ? '上传中...' : '点击或拖拽上传图标'}
                </p>
              </Upload.Dragger>
            )}
          </Form.Item>
        )}

        {/* 跳转链接 */}
        <Form.Item
          name="url"
          label="跳转链接"
          rules={[
            { required: true, message: '请输入跳转链接' },
            { type: 'url', message: '请输入有效的URL地址' },
            {
              pattern: /^https?:\/\//,
              message: '链接必须以 http:// 或 https:// 开头',
            },
          ]}
        >
          <Input placeholder="例如：https://t.me/lendlease_group" />
        </Form.Item>

        {/* 启用状态 */}
        <Form.Item
          name="isActive"
          label="启用状态"
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default ServiceLinkForm;
