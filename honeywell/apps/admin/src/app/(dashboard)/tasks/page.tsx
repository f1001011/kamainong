/**
 * @file 定时任务列表页
 * @description 后台管理系统定时任务监控页面，展示任务状态、支持手动执行
 * @depends 开发文档.md 第13.20节 - 定时任务监控
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第17节 - 定时任务接口
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  Switch,
  Tooltip,
  Progress,
  App,
  Badge,
  Skeleton,
  Empty,
  Modal,
  Form,
  InputNumber,
  Switch as AntSwitch,
  Checkbox,
  Spin,
} from 'antd';
import {
  RiRefreshLine,
  RiPlayCircleLine,
  RiFileListLine,
  RiTimerLine,
  RiCheckboxCircleFill,
  RiCloseCircleFill,
  RiLoaderLine,
  RiAlertLine,
  RiSettings4Line,
} from '@remixicon/react';

import { get, post, put } from '@/utils/request';
import { TimeDisplay } from '@/components/common';
import { StatisticCard, StatisticCardGroup } from '@/components/common';
import type { Task, TaskListResponse, AlertConfig } from '@/types/tasks';
import { cronToChineseDescription, formatDuration } from '@/types/tasks';

const { Title, Text, Paragraph } = Typography;

/**
 * 任务卡片组件
 */
interface TaskCardProps {
  task: Task;
  onToggle: (taskCode: string, enabled: boolean) => void;
  onRun: (taskCode: string, taskName: string) => void;
  onViewLogs: (taskCode: string) => void;
  toggling: boolean;
  running: boolean;
}

function TaskCard({ task, onToggle, onRun, onViewLogs, toggling, running }: TaskCardProps) {
  // 判断是否失败任务
  const isFailed = task.lastRunStatus === 'FAILED';
  const isRunning = task.lastRunStatus === 'RUNNING';

  return (
    <Card
      style={{
        borderRadius: 12,
        border: isFailed ? '2px solid #ff4d4f' : '1px solid #f0f0f0',
        boxShadow: isFailed
          ? '0 4px 12px rgba(255, 77, 79, 0.15)'
          : '0 1px 2px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.3s',
      }}
      styles={{
        body: { padding: 20 },
      }}
      hoverable
    >
      {/* 标题行 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <Space align="center">
            <Title level={5} style={{ margin: 0 }}>{task.taskName}</Title>
            {/* 状态指示灯 - 依据提示词要求：运行中使用绿色脉冲动画 */}
            {task.isEnabled ? (
              isRunning ? (
                <span className="task-status-running">
                  <Badge color="#52c41a" text={<Text style={{ fontSize: 12, color: '#52c41a' }}>运行中</Text>} />
                </span>
              ) : isFailed ? (
                <span className="task-status-failed">
                  <Badge status="error" text={<Text type="danger" style={{ fontSize: 12 }}>失败</Text>} />
                </span>
              ) : task.lastRunStatus === 'SUCCESS' ? (
                <Badge status="success" text={<Text type="success" style={{ fontSize: 12 }}>正常</Text>} />
              ) : (
                <Badge status="default" text={<Text type="secondary" style={{ fontSize: 12 }}>待运行</Text>} />
              )
            ) : (
              <Badge status="default" text={<Text type="secondary" style={{ fontSize: 12 }}>已禁用</Text>} />
            )}
          </Space>
          <Paragraph
            type="secondary"
            style={{ marginTop: 4, marginBottom: 0, fontSize: 13 }}
            ellipsis={{ rows: 2 }}
          >
            {task.description}
          </Paragraph>
        </div>
        <Switch
          checked={task.isEnabled}
          onChange={(checked) => onToggle(task.taskCode, checked)}
          loading={toggling}
          size="small"
        />
      </div>

      {/* 执行频率 */}
      <div style={{ marginBottom: 12 }}>
        <Space size={4}>
          <RiTimerLine size={14} style={{ color: '#8c8c8c' }} />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {cronToChineseDescription(task.cronExpression)}
          </Text>
          <Tooltip title={`Cron: ${task.cronExpression}`}>
            <Text type="secondary" style={{ fontSize: 12, color: '#bfbfbf' }}>
              ({task.cronExpression})
            </Text>
          </Tooltip>
        </Space>
      </div>

      {/* 上次执行信息 */}
      <div
        style={{
          background: isFailed ? '#fff1f0' : '#fafafa',
          borderRadius: 8,
          padding: '10px 12px',
          marginBottom: 12,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>上次执行</Text>
            <div style={{ marginTop: 4 }}>
              {task.lastRunAt ? (
                <TimeDisplay value={task.lastRunAt} format="datetime" style={{ fontSize: 13 }} />
              ) : (
                <Text type="secondary" style={{ fontSize: 13 }}>-</Text>
              )}
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>执行耗时</Text>
            <div style={{ marginTop: 4 }}>
              <Text style={{ fontSize: 13 }}>{formatDuration(task.lastRunDuration)}</Text>
            </div>
          </Col>
        </Row>
        {isFailed && task.consecutiveFailures && task.consecutiveFailures > 1 && (
          <div style={{ marginTop: 8 }}>
            <Text type="danger" style={{ fontSize: 12 }}>
              <RiAlertLine size={12} style={{ marginRight: 4 }} />
              连续失败 {task.consecutiveFailures} 次
            </Text>
          </div>
        )}
      </div>

      {/* 下次执行信息 */}
      {task.isEnabled && task.nextRunAt && (
        <div style={{ marginBottom: 16 }}>
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>下次执行：</Text>
            <TimeDisplay value={task.nextRunAt} format="datetime" style={{ fontSize: 12 }} />
          </Space>
        </div>
      )}

      {/* 操作按钮 */}
      <Space>
        <Button
          type="primary"
          size="small"
          icon={<RiPlayCircleLine size={14} />}
          onClick={() => onRun(task.taskCode, task.taskName)}
          loading={running}
          disabled={!task.isEnabled}
        >
          手动执行
        </Button>
        <Button
          size="small"
          icon={<RiFileListLine size={14} />}
          onClick={() => onViewLogs(task.taskCode)}
        >
          查看日志
        </Button>
      </Space>
    </Card>
  );
}

/**
 * 定时任务监控页面
 * @description 依据：开发文档.md 第13.20节、02.4-后台API接口清单.md 第17节
 */
export default function TasksPage() {
  const router = useRouter();
  const { message, modal } = App.useApp();

  // 状态
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  
  // 告警配置弹窗状态
  const [alertConfigVisible, setAlertConfigVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [alertConfigLoading, setAlertConfigLoading] = useState(false);

  // 自动刷新定时器
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 计算健康度（前端计算）
   * @description 基于启用任务中成功任务的比例
   */
  const calculateHealthRate = useCallback((taskList: Task[]): number => {
    const enabledTasks = taskList.filter((t) => t.isEnabled && t.lastRunStatus);
    if (enabledTasks.length === 0) return 100;
    const successTasks = enabledTasks.filter((t) => t.lastRunStatus === 'SUCCESS');
    return (successTasks.length / enabledTasks.length) * 100;
  }, []);

  /**
   * 获取任务列表
   * @description 依据：02.4-后台API接口清单.md 第17.1节
   */
  const fetchTasks = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await get<TaskListResponse>('/tasks');
      // 失败任务置顶
      const sortedTasks = [...response.list].sort((a, b) => {
        // 失败任务优先
        if (a.lastRunStatus === 'FAILED' && b.lastRunStatus !== 'FAILED') return -1;
        if (a.lastRunStatus !== 'FAILED' && b.lastRunStatus === 'FAILED') return 1;
        // 运行中任务其次
        if (a.lastRunStatus === 'RUNNING' && b.lastRunStatus !== 'RUNNING') return -1;
        if (a.lastRunStatus !== 'RUNNING' && b.lastRunStatus === 'RUNNING') return 1;
        // 按任务名称排序
        return a.taskName.localeCompare(b.taskName);
      });
      setTasks(sortedTasks);
      setLastRefreshedAt(new Date());
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * 获取告警配置
   * @description 依据：02.4-后台API接口清单.md 第17.3节
   */
  const fetchAlertConfig = useCallback(async () => {
    setAlertConfigLoading(true);
    try {
      const response = await get<AlertConfig>('/tasks/alert-config');
      setAlertConfig(response);
    } catch (error) {
      console.error('获取告警配置失败:', error);
    } finally {
      setAlertConfigLoading(false);
    }
  }, []);
  
  /**
   * 打开告警配置弹窗
   */
  const handleOpenAlertConfig = useCallback(() => {
    setAlertConfigVisible(true);
    fetchAlertConfig();
  }, [fetchAlertConfig]);

  /**
   * 启用/禁用任务
   */
  const handleToggleTask = useCallback(async (taskCode: string, enabled: boolean) => {
    setTogglingTask(taskCode);
    try {
      await post(`/tasks/${taskCode}/toggle`, { enabled });
      message.success(enabled ? '任务已启用' : '任务已禁用');
      await fetchTasks();
    } catch (error) {
      console.error('切换任务状态失败:', error);
    } finally {
      setTogglingTask(null);
    }
  }, [fetchTasks, message]);

  /**
   * 手动执行任务
   */
  const handleRunTask = useCallback((taskCode: string, taskName: string) => {
    modal.confirm({
      title: '确认手动执行',
      content: (
        <div>
          <Text>确定要手动执行任务【{taskName}】吗？</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            手动执行将立即触发任务，不影响正常调度。
          </Text>
        </div>
      ),
      okText: '确认执行',
      cancelText: '取消',
      onOk: async () => {
        setRunningTask(taskCode);
        try {
          await post(`/tasks/${taskCode}/run`);
          message.success('任务已开始执行');
          // 延迟刷新，等待任务状态更新
          setTimeout(() => fetchTasks(), 1000);
        } catch (error) {
          console.error('手动执行任务失败:', error);
        } finally {
          setRunningTask(null);
        }
      },
    });
  }, [modal, message, fetchTasks]);

  /**
   * 查看任务日志
   */
  const handleViewLogs = useCallback((taskCode: string) => {
    router.push(`/tasks/${taskCode}/logs`);
  }, [router]);

  /**
   * 切换自动刷新
   */
  const handleAutoRefreshChange = useCallback((checked: boolean) => {
    setAutoRefresh(checked);
    if (checked) {
      message.info('已开启自动刷新（每30秒）');
    } else {
      message.info('已关闭自动刷新');
    }
  }, [message]);

  // 初始加载
  useEffect(() => {
    fetchTasks(true);
  }, [fetchTasks]);

  // 自动刷新
  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        fetchTasks();
      }, 30000); // 每30秒刷新
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, fetchTasks]);

  // 计算统计数据
  const enabledTasks = tasks.filter((t) => t.isEnabled);
  const failedTasks = tasks.filter((t) => t.lastRunStatus === 'FAILED');
  const runningTasks = tasks.filter((t) => t.lastRunStatus === 'RUNNING');
  
  // 计算健康度
  const healthRate = calculateHealthRate(tasks);

  // 健康度颜色
  const getHealthColor = (rate: number) => {
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ marginBottom: 8 }}>定时任务监控</Title>
          <Text type="secondary">监控系统定时任务的执行状态，及时发现异常</Text>
        </div>
        <Button
          icon={<RiSettings4Line size={16} />}
          onClick={handleOpenAlertConfig}
        >
          告警配置
        </Button>
      </div>

      {/* 健康度仪表盘 */}
      <Card
        style={{ marginBottom: 24, borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}
      >
        <Row gutter={24} align="middle">
          <Col flex="auto">
            <StatisticCardGroup columns={4} gap={16}>
              <StatisticCard
                title="任务健康度"
                value={`${healthRate.toFixed(1)}%`}
                valueStyle={{ color: getHealthColor(healthRate) }}
                prefix={
                  <Progress
                    type="circle"
                    percent={healthRate}
                    size={40}
                    strokeColor={getHealthColor(healthRate)}
                    format={() => ''}
                  />
                }
                tooltip="近24小时任务成功率"
              />
              <StatisticCard
                title="已启用任务"
                value={enabledTasks.length}
                suffix={`/ ${tasks.length}`}
                prefix={<RiCheckboxCircleFill size={20} style={{ color: '#52c41a' }} />}
              />
              <StatisticCard
                title="失败任务"
                value={failedTasks.length}
                valueStyle={{ color: failedTasks.length > 0 ? '#ff4d4f' : undefined }}
                prefix={<RiCloseCircleFill size={20} style={{ color: failedTasks.length > 0 ? '#ff4d4f' : '#8c8c8c' }} />}
              />
              <StatisticCard
                title="运行中任务"
                value={runningTasks.length}
                prefix={<RiLoaderLine size={20} style={{ color: '#1677ff' }} />}
              />
            </StatisticCardGroup>
          </Col>
        </Row>

        {/* 刷新控制 */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              上次刷新：{lastRefreshedAt ? <TimeDisplay value={lastRefreshedAt} format="datetime" /> : '-'}
            </Text>
          </Space>
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>自动刷新</Text>
            <Switch
              size="small"
              checked={autoRefresh}
              onChange={handleAutoRefreshChange}
            />
            <Button
              type="text"
              icon={<RiRefreshLine size={16} />}
              onClick={() => fetchTasks(true)}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      {/* 任务卡片网格 */}
      {loading && tasks.length === 0 ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Col key={i} xs={24} sm={12} lg={8}>
              <Card style={{ borderRadius: 12 }}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      ) : tasks.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无定时任务" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {tasks.map((task) => (
            <Col key={task.taskCode} xs={24} sm={12} lg={8}>
              <TaskCard
                task={task}
                onToggle={handleToggleTask}
                onRun={handleRunTask}
                onViewLogs={handleViewLogs}
                toggling={togglingTask === task.taskCode}
                running={runningTask === task.taskCode}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* 告警配置弹窗 */}
      <AlertConfigModal
        open={alertConfigVisible}
        config={alertConfig}
        loading={alertConfigLoading}
        onClose={() => setAlertConfigVisible(false)}
        onSuccess={() => {
          setAlertConfigVisible(false);
          message.success('告警配置更新成功');
        }}
      />

      {/* 动画样式 */}
      <style jsx global>{`
        /* 运行中状态 - 绿色脉冲动画 */
        .task-status-running .ant-badge-status-dot {
          animation: task-pulse 1.5s ease-in-out infinite;
        }
        @keyframes task-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
        
        /* 失败状态 - 闪烁动画 */
        .task-status-failed .ant-badge-status-dot {
          animation: task-blink 1s ease-in-out infinite;
        }
        @keyframes task-blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 告警配置弹窗组件
 * @description 依据：开发文档.md 第13.20.3节 告警配置
 */

interface AlertConfigModalProps {
  open: boolean;
  config: AlertConfig | null;
  loading: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AlertConfigModal({ open, config, loading, onClose, onSuccess }: AlertConfigModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // 配置加载后设置表单值
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        taskFailureAlertEnabled: config.taskFailureAlertEnabled,
        consecutiveFailureThreshold: config.consecutiveFailureThreshold,
        executionTimeoutThreshold: config.executionTimeoutThreshold,
        alertMethod: config.alertMethod,
      });
    }
  }, [config, form]);

  /**
   * 提交告警配置
   * @description 依据：02.4-后台API接口清单.md 第17.3节
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await put('/tasks/alert-config', values);
      onSuccess();
    } catch (error) {
      console.error('更新告警配置失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="告警配置"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText="保存"
      cancelText="取消"
      width={480}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin tip="加载配置中..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            taskFailureAlertEnabled: true,
            consecutiveFailureThreshold: 3,
            executionTimeoutThreshold: 300,
            alertMethod: ['admin_notification'],
          }}
        >
          <Form.Item
            name="taskFailureAlertEnabled"
            label="任务失败告警"
            valuePropName="checked"
          >
            <AntSwitch checkedChildren="开启" unCheckedChildren="关闭" />
          </Form.Item>

          <Form.Item
            name="consecutiveFailureThreshold"
            label="连续失败告警阈值"
            tooltip="任务连续失败N次后触发告警"
            rules={[{ required: true, message: '请输入连续失败阈值' }]}
          >
            <InputNumber
              min={1}
              max={10}
              addonAfter="次"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="executionTimeoutThreshold"
            label="执行超时阈值"
            tooltip="任务执行超过N秒视为超时"
            rules={[{ required: true, message: '请输入执行超时阈值' }]}
          >
            <InputNumber
              min={60}
              max={3600}
              addonAfter="秒"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="alertMethod"
            label="告警方式"
            rules={[{ required: true, message: '请选择至少一种告警方式' }]}
          >
            <Checkbox.Group>
              <Space direction="vertical">
                <Checkbox value="admin_notification">后台通知</Checkbox>
                <Checkbox value="email">邮件通知</Checkbox>
                <Checkbox value="webhook">Webhook</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
