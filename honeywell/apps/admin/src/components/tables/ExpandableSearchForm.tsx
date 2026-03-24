/**
 * @file 可展开搜索表单组件
 * @description 支持展开/收起高级筛选的搜索表单
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Form, Button, Space, Row, Col, FormInstance } from 'antd';
import { RiArrowDownSLine, RiArrowUpSLine, RiSearchLine, RiRefreshLine } from '@remixicon/react';

/**
 * 搜索项配置
 */
export interface SearchFieldConfig {
  /** 字段名 */
  name: string;
  /** 标签 */
  label?: string;
  /** 表单组件 */
  component: React.ReactNode;
  /** 是否为高级筛选项（展开后才显示） */
  advanced?: boolean;
  /** 占据列数（默认1） */
  span?: number;
}

export interface ExpandableSearchFormProps {
  /** 搜索项配置 */
  fields: SearchFieldConfig[];
  /** 搜索回调 */
  onSearch: (values: Record<string, unknown>) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 每行显示列数 */
  columns?: number;
  /** 表单实例（可选，用于外部控制） */
  form?: FormInstance;
  /** 初始值 */
  initialValues?: Record<string, unknown>;
  /** 加载状态 */
  loading?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示收起按钮 */
  showCollapse?: boolean;
}

/**
 * 可展开搜索表单
 * @description 第一行显示常用筛选项，展开后显示高级筛选
 * @example
 * <ExpandableSearchForm
 *   fields={[
 *     { name: 'phone', label: '手机号', component: <Input placeholder="请输入手机号" /> },
 *     { name: 'status', label: '状态', component: <Select options={statusOptions} /> },
 *     { name: 'dateRange', label: '时间范围', component: <DatePicker.RangePicker />, advanced: true },
 *   ]}
 *   onSearch={handleSearch}
 *   columns={4}
 * />
 */
export function ExpandableSearchForm({
  fields,
  onSearch,
  onReset,
  defaultExpanded = false,
  columns = 4,
  form: externalForm,
  initialValues,
  loading = false,
  className,
  style,
  showCollapse = true,
}: ExpandableSearchFormProps) {
  // 内部表单实例
  const [internalForm] = Form.useForm();
  const form = externalForm || internalForm;

  // 展开状态
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 分离基础字段和高级字段
  const { basicFields, advancedFields } = useMemo(() => {
    const basic: SearchFieldConfig[] = [];
    const advanced: SearchFieldConfig[] = [];

    fields.forEach((field) => {
      if (field.advanced) {
        advanced.push(field);
      } else {
        basic.push(field);
      }
    });

    return { basicFields: basic, advancedFields: advanced };
  }, [fields]);

  // 是否有高级筛选
  const hasAdvanced = advancedFields.length > 0;

  /**
   * 切换展开状态
   */
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = useCallback(async () => {
    try {
      const values = await form.validateFields();
      onSearch(values);
    } catch (error) {
      // 表单验证失败，不执行搜索
      console.log('表单验证失败:', error);
    }
  }, [form, onSearch]);

  /**
   * 处理重置
   */
  const handleReset = useCallback(() => {
    form.resetFields();
    onReset?.();
    onSearch({});
  }, [form, onReset, onSearch]);

  /**
   * 计算列宽
   */
  const getColSpan = (span: number = 1) => {
    return Math.floor(24 / columns) * span;
  };

  /**
   * 渲染搜索项
   */
  const renderFields = (fieldList: SearchFieldConfig[]) => {
    return fieldList.map((field) => (
      <Col key={field.name} span={getColSpan(field.span)}>
        <Form.Item
          name={field.name}
          label={field.label}
          style={{ marginBottom: 16 }}
        >
          {field.component}
        </Form.Item>
      </Col>
    ));
  };

  return (
    <div
      className={`expandable-search-form ${className || ''}`}
      style={{
        background: 'var(--bg-card, #fff)',
        padding: 'var(--spacing-lg, 20px) var(--card-padding, 24px) var(--spacing-xs, 4px)',
        borderRadius: 'var(--radius-lg, 12px)',
        marginBottom: 'var(--spacing-md, 16px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04))',
        border: '1px solid var(--border-light, #f0f0f0)',
        transition: 'box-shadow 0.3s ease',
        ...style,
      }}
    >
      <Form
        form={form}
        initialValues={initialValues}
        layout="vertical"
      >
        {/* 基础筛选项 */}
        <Row gutter={16}>
          {renderFields(basicFields)}

          {/* 操作按钮 - 与基础项同行 */}
          <Col
            span={getColSpan(1)}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              paddingBottom: 16,
            }}
          >
            <Space size={8}>
              <Button
                type="primary"
                icon={<RiSearchLine size={16} />}
                onClick={handleSearch}
                loading={loading}
              >
                搜索
              </Button>
              <Button
                icon={<RiRefreshLine size={16} />}
                onClick={handleReset}
              >
                重置
              </Button>
              {hasAdvanced && showCollapse && (
                <Button
                  type="link"
                  onClick={toggleExpanded}
                  style={{ padding: '4px 0' }}
                >
                  {expanded ? '收起' : '展开'}
                  {expanded ? (
                    <RiArrowUpSLine size={16} style={{ marginLeft: 4 }} />
                  ) : (
                    <RiArrowDownSLine size={16} style={{ marginLeft: 4 }} />
                  )}
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* 高级筛选项（可折叠） */}
        {hasAdvanced && (
          <div
            style={{
              maxHeight: expanded ? 500 : 0,
              overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: expanded ? 1 : 0,
              marginTop: expanded ? 'var(--spacing-xs, 8px)' : 0,
            }}
          >
            <div
              style={{
                paddingTop: 'var(--spacing-md, 16px)',
                borderTop: '1px dashed var(--border-light, #f0f0f0)',
              }}
            >
              <Row gutter={16}>
                {renderFields(advancedFields)}
              </Row>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}

export default ExpandableSearchForm;
