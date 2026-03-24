/**
 * @file 异常告警面板组件
 * @description 展示系统异常告警，支持点击跳转
 * @depends 开发文档/04-后台管理端/04.1.1-仪表盘页.md - UX设计规范
 */

'use client';

import React from 'react';
import { Card, List, Typography, Space, Skeleton, Empty, Badge } from 'antd';
import { useRouter } from 'next/navigation';
import {
  RiAlertLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiServerLine,
  RiWalletLine,
  RiStackLine,
} from '@remixicon/react';
import type { AlertsData, AlertItem, AlertType } from '@/types/dashboard';
import { ALERT_TYPE_MAP } from '@/services/dashboard';

const { Text, Title } = Typography;

interface AlertPanelProps {
  /** 告警数据 */
  data: AlertsData | null;
  /** 是否加载中 */
  loading?: boolean;
}

/**
 * 告警类型图标映射
 */
const ALERT_ICON_MAP: Record<AlertType, React.ReactNode> = {
  INCOME_EXCEPTION: <RiWalletLine size={20} />,
  CHANNEL_ERROR: <RiServerLine size={20} />,
  WITHDRAW_BACKLOG: <RiStackLine size={20} />,
  SYSTEM_ERROR: <RiErrorWarningLine size={20} />,
};

/**
 * 单个告警项
 */
function AlertItem({ alert, onClick }: { alert: AlertItem; onClick: () => void }) {
  const icon = ALERT_ICON_MAP[alert.type] || <RiAlertLine size={20} />;
  const typeInfo = ALERT_TYPE_MAP[alert.type];

  return (
    <div className="alert-item" onClick={onClick}>
      <div className="alert-item-icon">
        {icon}
      </div>
      <div className="alert-item-content">
        <div className="alert-item-header">
          <Text strong className="alert-type">
            {typeInfo?.label || alert.type}
          </Text>
          {alert.count && (
            <Badge count={alert.count} className="alert-count" />
          )}
        </div>
        <Text type="secondary" className="alert-message">
          {alert.message}
        </Text>
      </div>
      <div className="alert-item-arrow">
        <RiErrorWarningLine size={16} />
      </div>
    </div>
  );
}

/**
 * 正常状态显示
 */
function NormalStatus() {
  return (
    <div className="alert-normal">
      <div className="alert-normal-icon">
        <RiCheckboxCircleLine size={48} />
      </div>
      <Title level={5} className="alert-normal-title">
        系统运行正常
      </Title>
      <Text type="secondary">
        暂无异常告警
      </Text>
    </div>
  );
}

/**
 * 异常告警面板
 */
export function AlertPanel({ data, loading }: AlertPanelProps) {
  const router = useRouter();

  // 处理告警点击
  const handleAlertClick = (alert: AlertItem) => {
    const typeInfo = ALERT_TYPE_MAP[alert.type];
    if (typeInfo?.route) {
      router.push(typeInfo.route);
    }
  };

  const hasAlerts = data?.alerts && data.alerts.length > 0;

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <RiAlertLine size={16} />
            <span>异常告警</span>
          </Space>
        }
        variant="borderless"
        className="dashboard-alert-card"
      >
        <Skeleton active paragraph={{ rows: 4 }} />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <RiAlertLine size={16} className={hasAlerts ? 'alert-icon-warning' : ''} />
          <span>异常告警</span>
          {hasAlerts && (
            <Badge
              count={data?.alerts.length}
              style={{ backgroundColor: '#ff4d4f' }}
            />
          )}
        </Space>
      }
      variant="borderless"
      className={`dashboard-alert-card ${hasAlerts ? 'has-alerts' : ''}`}
    >
      {hasAlerts ? (
        <div className="alert-list">
          {data?.alerts.map((alert, index) => (
            <AlertItem
              key={`${alert.type}-${index}`}
              alert={alert}
              onClick={() => handleAlertClick(alert)}
            />
          ))}
        </div>
      ) : (
        <NormalStatus />
      )}
    </Card>
  );
}

export default AlertPanel;
