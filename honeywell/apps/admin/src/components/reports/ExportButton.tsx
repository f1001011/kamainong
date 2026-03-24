/**
 * @file 导出按钮组件
 * @description 报表页面的导出功能按钮
 * @depends 开发文档/04-后台管理端/04.2-数据报表/ - 导出功能
 */

'use client';

import React, { useState } from 'react';
import { Button, Dropdown, message, Space, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  RiFileExcel2Line,
  RiImageLine,
  RiPrinterLine,
  RiDownloadLine,
} from '@remixicon/react';

interface ExportButtonProps {
  /** 导出 Excel 的回调 */
  onExportExcel?: () => Promise<void>;
  /** 导出图表图片的回调 */
  onExportChart?: () => Promise<void>;
  /** 打印报表的回调 */
  onPrint?: () => void;
  /** 预估行数（显示在按钮上） */
  estimatedRows?: number;
  /** 是否只显示 Excel 导出 */
  excelOnly?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 按钮尺寸 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * 导出按钮
 * @description 支持导出 Excel、图表图片、打印功能
 */
export function ExportButton({
  onExportExcel,
  onExportChart,
  onPrint,
  estimatedRows,
  excelOnly = false,
  disabled = false,
  className,
  size = 'middle',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<string | null>(null);

  /**
   * 处理 Excel 导出
   */
  const handleExportExcel = async () => {
    if (!onExportExcel) return;

    setExporting(true);
    setExportType('excel');
    try {
      await onExportExcel();
      message.success('导出成功');
    } catch (error) {
      console.error('导出Excel失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  /**
   * 处理图表导出
   */
  const handleExportChart = async () => {
    if (!onExportChart) return;

    setExporting(true);
    setExportType('chart');
    try {
      await onExportChart();
      message.success('图表已保存');
    } catch (error) {
      console.error('导出图表失败:', error);
      message.error('导出失败，请稍后重试');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  /**
   * 处理打印
   */
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  // 只导出 Excel 的简单按钮
  if (excelOnly) {
    return (
      <Button
        type="primary"
        icon={<RiFileExcel2Line size={16} />}
        onClick={handleExportExcel}
        loading={exporting}
        disabled={disabled}
        className={className}
        size={size}
      >
        导出Excel
        {estimatedRows && estimatedRows > 0 && (
          <span className="export-rows-hint">
            ({estimatedRows.toLocaleString()}行)
          </span>
        )}
      </Button>
    );
  }

  // 下拉菜单选项
  const menuItems: MenuProps['items'] = [
    {
      key: 'excel',
      label: (
        <Space>
          <RiFileExcel2Line size={16} />
          导出Excel
          {estimatedRows && estimatedRows > 0 && (
            <span style={{ color: '#999' }}>
              ({estimatedRows.toLocaleString()}行)
            </span>
          )}
        </Space>
      ),
      onClick: handleExportExcel,
      disabled: !onExportExcel,
    },
    {
      key: 'chart',
      label: (
        <Space>
          <RiImageLine size={16} />
          下载图表
        </Space>
      ),
      onClick: handleExportChart,
      disabled: !onExportChart,
    },
    {
      type: 'divider',
    },
    {
      key: 'print',
      label: (
        <Space>
          <RiPrinterLine size={16} />
          打印报表
        </Space>
      ),
      onClick: handlePrint,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      disabled={disabled}
      trigger={['click']}
    >
      <Button
        type="primary"
        icon={<RiDownloadLine size={16} />}
        loading={exporting}
        className={className}
        size={size}
      >
        {exporting ? (exportType === 'excel' ? '导出中...' : '处理中...') : '导出'}
      </Button>
    </Dropdown>
  );
}

export default ExportButton;
