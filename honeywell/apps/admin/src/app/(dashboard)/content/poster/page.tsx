/**
 * @file 邀请海报配置页
 * @description 管理邀请海报的背景图、二维码位置、邀请码位置等配置
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.4-邀请海报配置页.md
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Form,
  InputNumber,
  Slider,
  ColorPicker,
  Upload,
  Image,
  Divider,
  Spin,
  message,
} from 'antd';
import type { UploadProps } from 'antd';
import type { Color } from 'antd/es/color-picker';
import {
  RiUploadCloud2Line,
  RiDeleteBinLine,
  RiRefreshLine,
  RiSave3Line,
  RiArrowGoBackLine,
  RiImageLine,
} from '@remixicon/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { PosterPreview } from './components/PosterPreview';
import {
  getPosterConfig,
  updatePosterConfig,
  uploadPosterBackground,
} from '@/services/content';
import {
  DEFAULT_POSTER_CONFIG,
  POSTER_CONFIG_LIMITS,
  type PosterConfig,
  type PosterConfigFormValues,
} from '@/types/poster';

const { Title, Text, Paragraph } = Typography;

/**
 * 邀请海报配置页主组件
 * @description 左右分栏布局，左侧配置表单，右侧实时预览
 */
export default function PosterConfigPage() {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<PosterConfigFormValues>();
  
  // 表单值状态（用于实时预览）
  const [formValues, setFormValues] = useState<PosterConfig>(DEFAULT_POSTER_CONFIG);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 获取配置
  const {
    data: config,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['poster-config'],
    queryFn: getPosterConfig,
  });

  // 更新配置
  const updateMutation = useMutation({
    mutationFn: updatePosterConfig,
    onSuccess: () => {
      message.success('配置保存成功');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['poster-config'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '保存失败，请重试');
    },
  });

  // 初始化表单值
  useEffect(() => {
    if (config) {
      form.setFieldsValue(config);
      setFormValues(config);
      setHasChanges(false);
    }
  }, [config, form]);

  /**
   * 处理表单值变化
   * @description 实时更新预览
   */
  const handleFormValuesChange = useCallback(
    (_changedValues: Partial<PosterConfigFormValues>, allValues: PosterConfigFormValues) => {
      setFormValues(allValues);
      setHasChanges(true);
    },
    []
  );

  /**
   * 处理颜色变化
   * @description ColorPicker 的值需要特殊处理
   */
  const handleColorChange = useCallback(
    (color: Color) => {
      const hexColor = color.toHexString();
      form.setFieldValue('inviteCodeColor', hexColor);
      setFormValues((prev) => ({ ...prev, inviteCodeColor: hexColor }));
      setHasChanges(true);
    },
    [form]
  );

  /**
   * 处理二维码位置拖拽变化
   * @description 从预览组件同步到表单
   */
  const handleQrCodePositionChange = useCallback(
    (x: number, y: number) => {
      form.setFieldsValue({
        qrCodePositionX: x,
        qrCodePositionY: y,
      });
      setFormValues((prev) => ({
        ...prev,
        qrCodePositionX: x,
        qrCodePositionY: y,
      }));
      setHasChanges(true);
    },
    [form]
  );

  /**
   * 处理邀请码位置拖拽变化
   * @description 从预览组件同步到表单
   */
  const handleInviteCodePositionChange = useCallback(
    (x: number, y: number) => {
      form.setFieldsValue({
        inviteCodePositionX: x,
        inviteCodePositionY: y,
      });
      setFormValues((prev) => ({
        ...prev,
        inviteCodePositionX: x,
        inviteCodePositionY: y,
      }));
      setHasChanges(true);
    },
    [form]
  );

  /**
   * 处理图片上传
   */
  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);

    try {
      const result = await uploadPosterBackground(file as File);
      const imageUrl = result.url;
      
      form.setFieldValue('backgroundImage', imageUrl);
      setFormValues((prev) => ({ ...prev, backgroundImage: imageUrl }));
      setHasChanges(true);
      
      onSuccess?.(result);
      message.success('背景图上传成功');
    } catch (error) {
      onError?.(error as Error);
      message.error('背景图上传失败');
    } finally {
      setUploading(false);
    }
  };

  /**
   * 上传前校验
   */
  const beforeUpload = (file: File) => {
    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
    if (!isValidType) {
      message.error('仅支持 JPG/PNG/WEBP 格式');
      return false;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB');
      return false;
    }
    return true;
  };

  /**
   * 删除背景图
   */
  const handleRemoveImage = useCallback(() => {
    form.setFieldValue('backgroundImage', '');
    setFormValues((prev) => ({ ...prev, backgroundImage: '' }));
    setHasChanges(true);
  }, [form]);

  /**
   * 重置表单
   */
  const handleReset = useCallback(() => {
    if (config) {
      form.setFieldsValue(config);
      setFormValues(config);
      setHasChanges(false);
      message.info('已重置为上次保存的配置');
    }
  }, [config, form]);

  /**
   * 保存配置
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 检查背景图是否上传
      if (!values.backgroundImage) {
        message.warning('请先上传海报背景图');
        return;
      }

      await updateMutation.mutateAsync(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  /**
   * 渲染滑块+输入框组合
   */
  const renderSliderInput = (
    name: keyof PosterConfigFormValues,
    min: number,
    max: number,
    suffix: string = '%'
  ) => (
    <Row gutter={16} align="middle">
      <Col flex="1">
        <Slider
          min={min}
          max={max}
          value={formValues[name] as number}
          onChange={(value) => {
            form.setFieldValue(name, value);
            setFormValues((prev) => ({ ...prev, [name]: value }));
            setHasChanges(true);
          }}
        />
      </Col>
      <Col style={{ width: 100 }}>
        <Form.Item name={name} noStyle>
          <InputNumber
            min={min}
            max={max}
            precision={0}
            style={{ width: '100%' }}
            addonAfter={suffix}
          />
        </Form.Item>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            邀请海报配置
          </Title>
          <Text type="secondary">
            配置用户端邀请海报的背景图、二维码位置和邀请码样式
          </Text>
        </div>
        <Space>
          <Button
            icon={<RiArrowGoBackLine size={16} />}
            onClick={handleReset}
            disabled={!hasChanges}
          >
            重置
          </Button>
          <Button
            type="primary"
            icon={<RiSave3Line size={16} />}
            onClick={handleSubmit}
            loading={updateMutation.isPending}
            disabled={!hasChanges}
          >
            保存配置
          </Button>
        </Space>
      </div>

      <Spin spinning={isLoading}>
        <Row gutter={24}>
          {/* 左侧配置区 */}
          <Col xs={24} lg={10} xl={9}>
            <Card
              title="配置选项"
              bordered={false}
              styles={{ body: { paddingBottom: 8 } }}
            >
              <Form
                form={form}
                layout="vertical"
                initialValues={DEFAULT_POSTER_CONFIG}
                onValuesChange={handleFormValuesChange}
              >
                {/* 背景图上传 */}
                <Form.Item
                  label="海报背景图"
                  name="backgroundImage"
                  extra="支持 JPG/PNG/WEBP 格式，最大 10MB，推荐尺寸 750x1334px（iPhone比例）"
                >
                  <div>
                    {formValues.backgroundImage ? (
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        <Image
                          src={formValues.backgroundImage}
                          alt="海报背景预览"
                          width={200}
                          height={100}
                          style={{ objectFit: 'cover', display: 'block' }}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<RiDeleteBinLine size={16} />}
                          onClick={handleRemoveImage}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                          }}
                        />
                      </div>
                    ) : (
                      <Upload
                        accept=".jpg,.jpeg,.png,.webp"
                        showUploadList={false}
                        customRequest={handleUpload}
                        beforeUpload={beforeUpload}
                      >
                        <Button
                          icon={uploading ? <Spin size="small" /> : <RiUploadCloud2Line size={16} />}
                          disabled={uploading}
                          style={{
                            width: 200,
                            height: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px dashed #d9d9d9',
                            borderRadius: 8,
                          }}
                        >
                          <RiImageLine size={24} style={{ marginBottom: 8, color: '#8c8c8c' }} />
                          <span>{uploading ? '上传中...' : '点击上传背景图'}</span>
                        </Button>
                      </Upload>
                    )}
                  </div>
                </Form.Item>

                <Divider>二维码配置</Divider>

                {/* 二维码X坐标 */}
                <Form.Item
                  label="水平位置 (X坐标)"
                  tooltip="二维码中心点相对于海报左边缘的水平位置（百分比）"
                >
                  {renderSliderInput(
                    'qrCodePositionX',
                    POSTER_CONFIG_LIMITS.qrCodePositionX.min,
                    POSTER_CONFIG_LIMITS.qrCodePositionX.max
                  )}
                </Form.Item>

                {/* 二维码Y坐标 */}
                <Form.Item
                  label="垂直位置 (Y坐标)"
                  tooltip="二维码中心点相对于海报上边缘的垂直位置（百分比）"
                >
                  {renderSliderInput(
                    'qrCodePositionY',
                    POSTER_CONFIG_LIMITS.qrCodePositionY.min,
                    POSTER_CONFIG_LIMITS.qrCodePositionY.max
                  )}
                </Form.Item>

                {/* 二维码尺寸 */}
                <Form.Item
                  label="二维码尺寸"
                  tooltip="二维码的宽高尺寸（像素），正方形"
                >
                  {renderSliderInput(
                    'qrCodeSize',
                    POSTER_CONFIG_LIMITS.qrCodeSize.min,
                    POSTER_CONFIG_LIMITS.qrCodeSize.max,
                    'px'
                  )}
                </Form.Item>

                <Divider>邀请码配置</Divider>

                {/* 邀请码X坐标 */}
                <Form.Item
                  label="水平位置 (X坐标)"
                  tooltip="邀请码中心点相对于海报左边缘的水平位置（百分比）"
                >
                  {renderSliderInput(
                    'inviteCodePositionX',
                    POSTER_CONFIG_LIMITS.inviteCodePositionX.min,
                    POSTER_CONFIG_LIMITS.inviteCodePositionX.max
                  )}
                </Form.Item>

                {/* 邀请码Y坐标 */}
                <Form.Item
                  label="垂直位置 (Y坐标)"
                  tooltip="邀请码中心点相对于海报上边缘的垂直位置（百分比）"
                >
                  {renderSliderInput(
                    'inviteCodePositionY',
                    POSTER_CONFIG_LIMITS.inviteCodePositionY.min,
                    POSTER_CONFIG_LIMITS.inviteCodePositionY.max
                  )}
                </Form.Item>

                {/* 邀请码字体大小 */}
                <Form.Item
                  label="字体大小"
                  tooltip="邀请码文字的字体大小（像素）"
                >
                  {renderSliderInput(
                    'inviteCodeFontSize',
                    POSTER_CONFIG_LIMITS.inviteCodeFontSize.min,
                    POSTER_CONFIG_LIMITS.inviteCodeFontSize.max,
                    'px'
                  )}
                </Form.Item>

                {/* 邀请码字体颜色 */}
                <Form.Item
                  label="字体颜色"
                  name="inviteCodeColor"
                  tooltip="邀请码文字的颜色"
                >
                  <ColorPicker
                    showText
                    value={formValues.inviteCodeColor}
                    onChange={handleColorChange}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧预览区 */}
          <Col xs={24} lg={14} xl={15}>
            <Card
              title="实时预览"
              bordered={false}
              extra={
                <Button
                  type="text"
                  icon={<RiRefreshLine size={16} />}
                  onClick={() => refetch()}
                  loading={isLoading}
                >
                  刷新
                </Button>
              }
            >
              <PosterPreview
                backgroundImage={formValues.backgroundImage}
                qrCodePositionX={formValues.qrCodePositionX}
                qrCodePositionY={formValues.qrCodePositionY}
                qrCodeSize={formValues.qrCodeSize}
                inviteCodePositionX={formValues.inviteCodePositionX}
                inviteCodePositionY={formValues.inviteCodePositionY}
                inviteCodeFontSize={formValues.inviteCodeFontSize}
                inviteCodeColor={formValues.inviteCodeColor}
                onQrCodePositionChange={handleQrCodePositionChange}
                onInviteCodePositionChange={handleInviteCodePositionChange}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* 变更提示 */}
      {hasChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor: '#fff',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 100,
          }}
        >
          <Text>您有未保存的更改</Text>
          <Space>
            <Button size="small" onClick={handleReset}>
              放弃更改
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={handleSubmit}
              loading={updateMutation.isPending}
            >
              保存
            </Button>
          </Space>
        </div>
      )}
    </div>
  );
}
