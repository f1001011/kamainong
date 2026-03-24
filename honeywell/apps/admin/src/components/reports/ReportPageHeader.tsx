/**
 * @file 报表页面头部组件
 * @description 报表页面的标题栏，包含标题、日期选择器、导出按钮
 * @depends 开发文档/04-后台管理端/04.2-数据报表/ - 页面结构
 */

'use client';

import React from 'react';
import { Typography, Space } from 'antd';
import { DateRangePicker } from './DateRangePicker';
import { ExportButton } from './ExportButton';
import type { DateRangeParams, QuickDateRange } from '@/types/reports';

const { Title } = Typography;

interface ReportPageHeaderProps {
  /** 页面标题 */
  title: string;
  /** 日期范围变化回调 */
  onDateRangeChange: (range: DateRangeParams) => void;
  /** 导出 Excel 回调 */
  onExportExcel?: () => Promise<void>;
  /** 导出图表回调 */
  onExportChart?: () => Promise<void>;
  /** 打印回调 */
  onPrint?: () => void;
  /** 预估导出行数 */
  estimatedRows?: number;
  /** 默认快捷日期选项 */
  defaultQuickOption?: QuickDateRange;
  /** 是否正在加载 */
  loading?: boolean;
  /** 额外的操作按钮 */
  extra?: React.ReactNode;
  /** 只显示 Excel 导出 */
  excelOnly?: boolean;
}

/**
 * 报表页面头部
 * @description 统一的报表页面顶部布局
 */
export function ReportPageHeader({
  title,
  onDateRangeChange,
  onExportExcel,
  onExportChart,
  onPrint,
  estimatedRows,
  defaultQuickOption = 'last7days',
  loading = false,
  extra,
  excelOnly = true,
}: ReportPageHeaderProps) {
  return (
    <div className="report-page-header">
      {/* 第一行：标题和导出按钮 */}
      <div className="report-header-top">
        <Title level={4} className="report-title">
          {title}
        </Title>
        <Space>
          {extra}
          <ExportButton
            onExportExcel={onExportExcel}
            onExportChart={onExportChart}
            onPrint={onPrint}
            estimatedRows={estimatedRows}
            disabled={loading}
            excelOnly={excelOnly}
          />
        </Space>
      </div>

      {/* 第二行：日期选择器 */}
      <div className="report-header-filter">
        <DateRangePicker
          defaultQuickOption={defaultQuickOption}
          onChange={onDateRangeChange}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default ReportPageHeader;
