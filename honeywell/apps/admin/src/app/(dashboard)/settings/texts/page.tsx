/**
 * @file 文案管理页
 * @description 管理全站文案配置，支持分类筛选、行内编辑、变量预览、批量导入导出、版本历史
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.2-文案管理页.md
 */

'use client';

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  PageContainer,
  ProTable,
  ModalForm,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Tabs,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
  Modal,
  Upload,
  Radio,
  Alert,
  Table,
  Input,
  Card,
  Drawer,
  Form,
  Checkbox,
  Divider,
  DatePicker,
  Select,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  RiUploadLine,
  RiDownloadLine,
  RiHistoryLine,
  RiEditLine,
  RiEyeLine,
  RiArrowGoBackLine,
  RiRefreshLine,
  RiCheckLine,
  RiCloseLine,
  RiFilterLine,
} from '@remixicon/react';
import dayjs from 'dayjs';

import { TimeDisplay } from '@/components/common/TimeDisplay';
import { ExportButton } from '@/components/reports/ExportButton';
import { DetailDrawer, DetailSection } from '@/components/modals/DetailDrawer';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { showSuccess } from '@/utils/messageHolder';

import {
  fetchTexts,
  updateText,
  importTexts,
  exportTexts,
  getTextVersions,
  rollbackTextVersion,
  parseJsonFile,
  parseCsvFile,
  checkTextsExist,
} from '@/services/texts';

import {
  CATEGORY_TABS,
  CATEGORY_COLORS,
  CATEGORY_NAMES,
  generatePreviewText,
  parseTextWithVariables,
} from '@/types/texts';

import type {
  TextConfigItem,
  TextVersionRecord,
  ImportPreviewItem,
  ConflictStrategy,
} from '@/types/texts';

const { Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// ============================================================================
// 变量高亮显示组件
// ============================================================================

interface HighlightedTextProps {
  text: string;
  maxLength?: number;
}

/**
 * 带变量高亮的文本显示组件
 */
function HighlightedText({ text, maxLength = 100 }: HighlightedTextProps) {
  const displayText = maxLength && text.length > maxLength 
    ? text.slice(0, maxLength) + '...'
    : text;
  
  const displayParts = parseTextWithVariables(displayText);
  
  return (
    <Tooltip title={text} placement="topLeft">
      <span>
        {displayParts.map((part, index) =>
          part.type === 'variable' ? (
            <Tag key={index} color="blue" style={{ margin: '0 2px' }}>
              {part.content}
            </Tag>
          ) : (
            <span key={index}>{part.content}</span>
          )
        )}
      </span>
    </Tooltip>
  );
}

// ============================================================================
// 行内编辑单元格组件
// ============================================================================

interface EditableCellProps {
  value: string;
  record: TextConfigItem;
  onSave: (key: string, value: string) => Promise<void>;
}

/**
 * 可行内编辑的单元格
 * @description 双击进入编辑模式，失焦或回车保存，ESC 取消
 */
function EditableCell({ value, record, onSave }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // 进入编辑模式时聚焦输入框
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);
  
  // 双击进入编辑模式
  const handleDoubleClick = () => {
    setEditing(true);
    setInputValue(value);
  };
  
  // 保存编辑
  const handleSave = async () => {
    if (inputValue === value) {
      setEditing(false);
      return;
    }
    
    setSaving(true);
    try {
      await onSave(record.key, inputValue);
      setEditing(false);
    } catch (error) {
      // 保存失败，恢复原值
      setInputValue(value);
    } finally {
      setSaving(false);
    }
  };
  
  // 取消编辑
  const handleCancel = () => {
    setInputValue(value);
    setEditing(false);
  };
  
  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <Input.TextArea
          ref={inputRef as any}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={saving}
          style={{ flex: 1 }}
        />
        <Space direction="vertical" size={2}>
          <Button
            type="primary"
            size="small"
            icon={<RiCheckLine size={12} />}
            onClick={handleSave}
            loading={saving}
            style={{ padding: '0 4px' }}
          />
          <Button
            size="small"
            icon={<RiCloseLine size={12} />}
            onClick={handleCancel}
            disabled={saving}
            style={{ padding: '0 4px' }}
          />
        </Space>
      </div>
    );
  }
  
  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{ cursor: 'pointer', minHeight: 22 }}
      title="双击编辑"
    >
      <HighlightedText text={value} maxLength={50} />
    </div>
  );
}

// ============================================================================
// 预览弹窗组件
// ============================================================================

interface PreviewModalProps {
  visible: boolean;
  onClose: () => void;
  record: TextConfigItem | null;
}

/**
 * 文案预览弹窗
 */
function PreviewModal({ visible, onClose, record }: PreviewModalProps) {
  if (!record) return null;
  
  const previewText = generatePreviewText(record.value, record.variables);
  const hasVariables = record.variables && record.variables.length > 0;
  
  return (
    <Modal
      title={`预览文案 - ${record.key}`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={600}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">分类：</Text>
        <Tag color={CATEGORY_COLORS[record.category] || 'default'}>
          {CATEGORY_NAMES[record.category] || record.category}
        </Tag>
        {record.description && (
          <>
            <Divider type="vertical" />
            <Text type="secondary">描述：{record.description}</Text>
          </>
        )}
      </div>
      
      {hasVariables && (
        <Alert
          type="info"
          showIcon
          message="支持的变量"
          description={
            <Space size={4} wrap>
              {record.variables?.map((v) => (
                <Tag key={v} color="blue">{`{${v}}`}</Tag>
              ))}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Card title="原始文案" size="small" style={{ marginBottom: 16 }}>
        <HighlightedText text={record.value} maxLength={500} />
      </Card>
      
      {hasVariables && (
        <Card title="替换变量后效果" size="small">
          <Text>{previewText}</Text>
        </Card>
      )}
    </Modal>
  );
}

// ============================================================================
// 编辑弹窗组件
// ============================================================================

interface EditModalProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  record: TextConfigItem | null;
  onSuccess: () => void;
}

/**
 * 文案编辑弹窗
 */
function EditModal({ visible, onVisibleChange, record, onSuccess }: EditModalProps) {
  const [form] = Form.useForm();
  const [previewText, setPreviewText] = useState('');
  
  // 监听文案值变化，实时生成预览
  const handleValuesChange = useCallback((changedValues: { value?: string }) => {
    if (changedValues.value !== undefined && record) {
      const preview = generatePreviewText(changedValues.value, record.variables);
      setPreviewText(preview);
    }
  }, [record]);
  
  // 弹窗打开时初始化预览
  useEffect(() => {
    if (visible && record) {
      setPreviewText(generatePreviewText(record.value, record.variables));
    }
  }, [visible, record]);
  
  if (!record) return null;
  
  const hasVariables = record.variables && record.variables.length > 0;
  
  return (
    <ModalForm
      title={`编辑文案 - ${record.key}`}
      open={visible}
      onOpenChange={onVisibleChange}
      form={form}
      width={640}
      initialValues={{
        value: record.value,
      }}
      onValuesChange={handleValuesChange}
      onFinish={async (values) => {
        try {
          await updateText(record.key, { value: values.value });
          showSuccess('文案更新成功');
          onSuccess();
          return true;
        } catch (error) {
          return false;
        }
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
    >
      {/* Key 和分类信息 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Text>
            <Text strong>Key：</Text>
            <Typography.Text code copyable>
              {record.key}
            </Typography.Text>
          </Text>
          <Divider type="vertical" />
          <Text>
            <Text strong>分类：</Text>
            <Tag color={CATEGORY_COLORS[record.category] || 'default'}>
              {CATEGORY_NAMES[record.category] || record.category}
            </Tag>
          </Text>
        </Space>
        {record.description && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">描述：{record.description}</Text>
          </div>
        )}
      </div>
      
      {/* 支持的变量提示 */}
      {hasVariables && (
        <Alert
          type="info"
          showIcon
          message="支持的变量"
          description={
            <Space size={4} wrap>
              {record.variables?.map((v) => (
                <Tag key={v} color="blue">{`{${v}}`}</Tag>
              ))}
              <Text type="secondary" style={{ marginLeft: 8 }}>
                在文案中使用这些变量占位符，前端会自动替换为实际值
              </Text>
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* 文案内容 */}
      <ProFormTextArea
        name="value"
        label="文案内容"
        rules={[{ required: true, message: '请输入文案内容' }]}
        fieldProps={{
          rows: 4,
          showCount: true,
          maxLength: 1000,
          placeholder: '请输入文案内容，支持变量插值如 {amount}',
        }}
      />
      
      {/* 实时预览 */}
      {hasVariables && (
        <Card title="预览效果" size="small" style={{ marginTop: 16 }}>
          <Text>{previewText || '暂无内容'}</Text>
        </Card>
      )}
    </ModalForm>
  );
}

// ============================================================================
// 导入弹窗组件
// ============================================================================

interface ImportModalProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onSuccess: () => void;
}

/**
 * 批量导入弹窗
 */
function ImportModal({ visible, onVisibleChange, onSuccess }: ImportModalProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('OVERWRITE');
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  
  // 文件解析预览
  const handleFileChange = async (info: { file: UploadFile; fileList: UploadFile[] }) => {
    const file = info.file.originFileObj || (info.file as unknown as File);
    if (!file || !(file instanceof File)) {
      return;
    }
    
    setParsing(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let data: Record<string, string> = {};
      
      if (ext === 'json') {
        data = await parseJsonFile(file);
      } else if (ext === 'csv') {
        data = await parseCsvFile(file);
      } else if (ext === 'xlsx') {
        // XLSX 需要使用 xlsx 库解析（这里简化处理，提示用户转换格式）
        message.warning('XLSX 格式请先转换为 CSV 或 JSON 格式');
        return;
      } else {
        message.warning('暂不支持该文件格式，请使用 JSON 或 CSV');
        return;
      }
      
      // 检查哪些 key 已存在
      const keys = Object.keys(data);
      const existsMap = await checkTextsExist(keys);
      
      const preview: ImportPreviewItem[] = Object.entries(data).map(([key, value]) => ({
        key,
        value,
        exists: existsMap[key] || false,
      }));
      
      setPreviewData(preview);
      setFileList([info.file]);
    } catch (error) {
      message.error('文件解析失败，请检查文件格式');
      console.error('文件解析失败:', error);
    } finally {
      setParsing(false);
    }
  };
  
  // 执行导入
  const handleImport = async () => {
    if (previewData.length === 0) {
      message.warning('请先上传文件');
      return;
    }
    
    setImporting(true);
    try {
      const texts: Record<string, string> = {};
      previewData.forEach((item) => {
        texts[item.key] = item.value;
      });
      
      const result = await importTexts({
        texts,
        conflictStrategy,
      });
      
      if (result.updated > 0) {
        showSuccess(`导入成功：更新 ${result.updated} 条，跳过 ${result.skipped} 条`);
        onSuccess();
        handleClose();
      } else {
        message.info(`导入完成：跳过 ${result.skipped} 条`);
      }
    } catch (error) {
      message.error('导入失败，请检查文件格式');
    } finally {
      setImporting(false);
    }
  };
  
  // 关闭弹窗时重置状态
  const handleClose = () => {
    setFileList([]);
    setPreviewData([]);
    setConflictStrategy('OVERWRITE');
    onVisibleChange(false);
  };
  
  // 统计信息
  const existsCount = previewData.filter((item) => item.exists).length;
  const newCount = previewData.length - existsCount;
  
  return (
    <Modal
      title="批量导入文案"
      open={visible}
      onCancel={handleClose}
      onOk={handleImport}
      okText="开始导入"
      okButtonProps={{ loading: importing, disabled: previewData.length === 0 }}
      width={800}
      destroyOnHidden
    >
      {/* 文件上传区域 */}
      <Upload.Dragger
        accept=".json,.csv,.xlsx"
        maxCount={1}
        fileList={fileList}
        onChange={handleFileChange}
        beforeUpload={() => false}
        disabled={parsing}
      >
        <p className="ant-upload-drag-icon">
          <RiUploadLine size={48} color="#1677ff" />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此区域</p>
        <p className="ant-upload-hint">
          支持 JSON、CSV、XLSX 格式，文件大小不超过 5MB
        </p>
      </Upload.Dragger>
      
      {/* 格式说明 */}
      <Alert
        type="info"
        showIcon
        style={{ marginTop: 16 }}
        message="文件格式说明"
        description={
          <div>
            <p><strong>JSON 格式：</strong></p>
            <Typography.Text code style={{ display: 'block', marginBottom: 8 }}>
              {`{ "btn.confirm": "تأكيد", "btn.cancel": "إلغاء" }`}
            </Typography.Text>
            <p><strong>CSV/XLSX 格式：</strong></p>
            <Typography.Text type="secondary">
              两列：第一列为 Key，第二列为 Value
            </Typography.Text>
          </div>
        }
      />
      
      {/* 冲突处理策略 */}
      <div style={{ marginTop: 16 }}>
        <Text strong>冲突处理策略：</Text>
        <Radio.Group
          value={conflictStrategy}
          onChange={(e) => setConflictStrategy(e.target.value)}
          style={{ marginLeft: 16 }}
        >
          <Radio value="OVERWRITE">覆盖已有文案</Radio>
          <Radio value="SKIP">跳过已有文案</Radio>
        </Radio.Group>
      </div>
      
      {/* 预览表格 */}
      {previewData.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Text strong>预览（共 {previewData.length} 条）</Text>
            <Tag color="green">新增 {newCount} 条</Tag>
            <Tag color="orange">已存在 {existsCount} 条</Tag>
          </Space>
          <Table
            size="small"
            dataSource={previewData.slice(0, 10)}
            rowKey="key"
            columns={[
              { title: 'Key', dataIndex: 'key', width: 200, ellipsis: true },
              { title: 'Value', dataIndex: 'value', ellipsis: true },
              {
                title: '状态',
                dataIndex: 'exists',
                width: 100,
                render: (exists: boolean) => (
                  <Tag color={exists ? 'orange' : 'green'}>
                    {exists ? '已存在' : '新增'}
                  </Tag>
                ),
              },
            ]}
            pagination={false}
          />
          {previewData.length > 10 && (
            <Text type="secondary">... 还有 {previewData.length - 10} 条</Text>
          )}
        </div>
      )}
    </Modal>
  );
}

// ============================================================================
// 版本历史抽屉组件（使用 DetailDrawer）
// ============================================================================

interface VersionHistoryDrawerProps {
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  onRollback: () => void;
}

/**
 * 版本历史抽屉
 * @description 使用 DetailDrawer 组件，支持筛选和 diff 对比
 */
function VersionHistoryDrawer({ visible, onVisibleChange, onRollback }: VersionHistoryDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TextVersionRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [rollbackConfirmVisible, setRollbackConfirmVisible] = useState(false);
  const [rollbackRecord, setRollbackRecord] = useState<TextVersionRecord | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  
  // 筛选条件
  const [filterTextKey, setFilterTextKey] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  
  // 加载版本历史
  const fetchVersions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: 20 };
      
      // 应用筛选条件
      if (filterTextKey) {
        params.textKey = filterTextKey;
      }
      if (filterDateRange) {
        params.startDate = filterDateRange[0].format('YYYY-MM-DD');
        params.endDate = filterDateRange[1].format('YYYY-MM-DD');
      }
      
      const response = await getTextVersions(params);
      setData(response.list);
      setPagination({
        page: response.pagination.page,
        pageSize: response.pagination.pageSize,
        total: response.pagination.total,
      });
    } catch (error) {
      console.error('加载版本历史失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filterTextKey, filterDateRange]);
  
  // 打开时加载数据
  useEffect(() => {
    if (visible) {
      fetchVersions();
    }
  }, [visible, fetchVersions]);
  
  // 处理回滚
  const handleRollback = async () => {
    if (!rollbackRecord) return;
    
    setRollbackLoading(true);
    try {
      await rollbackTextVersion(rollbackRecord.version);
      showSuccess('回滚成功');
      setRollbackConfirmVisible(false);
      setRollbackRecord(null);
      onRollback();
      fetchVersions();
    } catch (error) {
      message.error('回滚失败');
    } finally {
      setRollbackLoading(false);
    }
  };
  
  // 打开回滚确认
  const openRollbackConfirm = (record: TextVersionRecord) => {
    setRollbackRecord(record);
    setRollbackConfirmVisible(true);
  };
  
  // 重置筛选
  const handleResetFilter = () => {
    setFilterTextKey('');
    setFilterDateRange(null);
  };
  
  // 应用筛选
  const handleApplyFilter = () => {
    fetchVersions(1);
  };
  
  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 80,
      render: (version: number) => <Tag color="blue">v{version}</Tag>,
    },
    {
      title: '文案 Key',
      dataIndex: 'textKey',
      width: 200,
      render: (key: string) => (
        <Typography.Text code copyable style={{ fontSize: 12 }}>
          {key}
        </Typography.Text>
      ),
    },
    {
      title: '修改前',
      dataIndex: 'oldValue',
      width: 200,
      ellipsis: true,
      render: (value: string | null) => (
        <Typography.Text type="secondary" delete={!!value} style={{ fontSize: 12 }}>
          {value || '(新增)'}
        </Typography.Text>
      ),
    },
    {
      title: '修改后',
      dataIndex: 'newValue',
      width: 200,
      ellipsis: true,
      render: (value: string) => (
        <Typography.Text type="success" style={{ fontSize: 12 }}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 100,
    },
    {
      title: '修改时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (time: string) => <TimeDisplay value={time} />,
    },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: TextVersionRecord) => (
        <Button
          type="link"
          size="small"
          icon={<RiArrowGoBackLine size={14} />}
          onClick={() => openRollbackConfirm(record)}
        >
          回滚
        </Button>
      ),
    },
  ];
  
  return (
    <>
      <DetailDrawer
        open={visible}
        onClose={() => onVisibleChange(false)}
        title="文案版本历史"
        subtitle={`共 ${pagination.total} 条修改记录`}
        width={1100}
      >
        {/* 筛选区域 */}
        <DetailSection title="筛选条件">
          <Space wrap style={{ marginBottom: 16 }}>
            <Input
              placeholder="文案 Key"
              value={filterTextKey}
              onChange={(e) => setFilterTextKey(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <RangePicker
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              placeholder={['开始日期', '结束日期']}
            />
            <Button type="primary" onClick={handleApplyFilter}>
              查询
            </Button>
            <Button onClick={handleResetFilter}>
              重置
            </Button>
            <Button
              icon={<RiRefreshLine size={16} />}
              onClick={() => fetchVersions()}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        </DetailSection>
        
        {/* 版本列表 */}
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条修改记录`,
            onChange: (page) => fetchVersions(page),
          }}
          scroll={{ x: 'max-content' }}
          size="small"
        />
      </DetailDrawer>
      
      {/* 回滚确认弹窗 */}
      <ConfirmModal
        open={rollbackConfirmVisible}
        onClose={() => {
          setRollbackConfirmVisible(false);
          setRollbackRecord(null);
        }}
        onConfirm={handleRollback}
        title="确认回滚"
        content={
          rollbackRecord
            ? `确定要将文案 "${rollbackRecord.textKey}" 回滚到版本 v${rollbackRecord.version} 吗？`
            : ''
        }
        type="warning"
        confirmText="确认回滚"
        loading={rollbackLoading}
        impacts={[
          '回滚后会创建新的版本记录',
          '文案值将恢复到该版本的修改前状态',
        ]}
      />
    </>
  );
}

// ============================================================================
// 主页面组件
// ============================================================================

/**
 * 文案管理页
 * @description 管理全站文案配置
 */
export default function TextsPage() {
  const actionRef = useRef<ActionType>(null);
  
  // 状态
  const [activeTab, setActiveTab] = useState('all');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editRecord, setEditRecord] = useState<TextConfigItem | null>(null);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<TextConfigItem | null>(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [versionDrawerVisible, setVersionDrawerVisible] = useState(false);
  
  // 行内编辑保存
  const handleInlineSave = useCallback(async (key: string, value: string) => {
    await updateText(key, { value });
    showSuccess('文案更新成功');
    actionRef.current?.reload();
  }, []);
  
  // 编辑文案（弹窗）
  const handleEdit = useCallback((record: TextConfigItem) => {
    setEditRecord(record);
    setEditModalVisible(true);
  }, []);
  
  // 预览文案
  const handlePreview = useCallback((record: TextConfigItem) => {
    setPreviewRecord(record);
    setPreviewModalVisible(true);
  }, []);
  
  // 刷新列表
  const handleRefresh = useCallback(() => {
    actionRef.current?.reload();
  }, []);
  
  // Tab 切换
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    actionRef.current?.reload();
  }, []);
  
  // 导出处理
  const handleExport = useCallback(async () => {
    await exportTexts({
      format: 'json',
      categories: activeTab !== 'all' ? [activeTab] : undefined,
    });
  }, [activeTab]);
  
  // 表格列定义
  const columns: ProColumns<TextConfigItem>[] = useMemo(
    () => [
      {
        title: 'Key',
        dataIndex: 'key',
        width: 200,
        ellipsis: true,
        copyable: true,
        sorter: true, // 支持排序
        fieldProps: {
          placeholder: '请输入文案Key',
        },
        render: (_, record) => (
          <Typography.Text code copyable={{ text: record.key }} style={{ fontSize: 12 }}>
            {record.key}
          </Typography.Text>
        ),
      },
      {
        title: '当前值',
        dataIndex: 'value',
        width: 300,
        ellipsis: true,
        fieldProps: {
          placeholder: '请输入文案内容',
        },
        render: (_, record) => (
          <EditableCell
            value={record.value}
            record={record}
            onSave={handleInlineSave}
          />
        ),
      },
      {
        title: '分类',
        dataIndex: 'category',
        width: 100,
        valueType: 'select',
        valueEnum: Object.fromEntries(
          CATEGORY_TABS.filter((tab) => tab.key !== 'all').map((tab) => [
            tab.key,
            { text: tab.label },
          ])
        ),
        hideInSearch: true, // 使用 Tab 筛选，不在搜索栏显示
        sorter: true, // 支持排序
        render: (_, record) => (
          <Tag color={CATEGORY_COLORS[record.category] || 'default'}>
            {CATEGORY_NAMES[record.category] || record.category}
          </Tag>
        ),
      },
      {
        title: '描述',
        dataIndex: 'description',
        width: 200,
        ellipsis: true,
        search: false,
        responsive: ['xl'],
        render: (_, record) => (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.description || '-'}
          </Typography.Text>
        ),
      },
      {
        title: '变量',
        dataIndex: 'variables',
        width: 150,
        search: false,
        responsive: ['xl'],
        render: (_, record) => (
          <Space size={4} wrap>
            {record.variables?.map((v) => (
              <Tag key={v} color="blue" style={{ fontSize: 11 }}>
                {`{${v}}`}
              </Tag>
            ))}
            {(!record.variables || record.variables.length === 0) && '-'}
          </Space>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'updatedAt',
        width: 150,
        valueType: 'dateTime',
        search: false,
        sorter: true, // 支持排序
        responsive: ['lg'],
        render: (_, record) => <TimeDisplay value={record.updatedAt} />,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 120,
        fixed: 'right',
        render: (_, record) => [
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<RiEditLine size={14} />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>,
          <Button
            key="preview"
            type="link"
            size="small"
            icon={<RiEyeLine size={14} />}
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>,
        ],
      },
    ],
    [handleEdit, handlePreview, handleInlineSave]
  );
  
  // Tab 项配置
  const tabItems = useMemo(
    () =>
      CATEGORY_TABS.map((tab) => ({
        key: tab.key,
        label: tab.label,
      })),
    []
  );
  
  return (
    <PageContainer
      header={{
        title: '文案管理',
      }}
      content={
        <Paragraph type="secondary">
          管理全站文案配置，支持分类筛选、行内编辑（双击编辑）、变量预览、批量导入导出、版本历史回滚
        </Paragraph>
      }
      extra={
        <Space>
          <Button
            icon={<RiUploadLine size={16} />}
            onClick={() => setImportModalVisible(true)}
          >
            导入
          </Button>
          <ExportButton
            onExportExcel={handleExport}
            excelOnly
          />
          <Button
            icon={<RiHistoryLine size={16} />}
            onClick={() => setVersionDrawerVisible(true)}
          >
            版本历史
          </Button>
        </Space>
      }
    >
      {/* 分类 Tab */}
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />
      
      {/* 文案列表 */}
      <ProTable<TextConfigItem>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          span: 8,
          searchText: '查询',
          resetText: '重置',
        }}
        pagination={{
          defaultPageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100', '200'],
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条文案`,
        }}
        options={{
          density: true,
          reload: true,
          setting: true,
        }}
        columnsState={{
          persistenceKey: 'texts-list-columns',
          persistenceType: 'localStorage',
        }}
        request={async (params, sort) => {
          try {
            // 构建排序参数
            const sortField = Object.keys(sort || {})[0];
            const sortOrder = sortField ? sort[sortField] : undefined;
            
            const response = await fetchTexts({
              page: params.current,
              pageSize: params.pageSize,
              keyword: params.key || params.value, // 支持 Key 和内容搜索
              category: activeTab !== 'all' ? activeTab : undefined,
              sortField,
              sortOrder: sortOrder as 'ascend' | 'descend' | undefined,
            });
            return {
              data: response.list,
              total: response.pagination.total,
              success: true,
            };
          } catch (error) {
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        scroll={{ x: 'max-content' }}
      />
      
      {/* 编辑弹窗 */}
      <EditModal
        visible={editModalVisible}
        onVisibleChange={setEditModalVisible}
        record={editRecord}
        onSuccess={handleRefresh}
      />
      
      {/* 预览弹窗 */}
      <PreviewModal
        visible={previewModalVisible}
        onClose={() => setPreviewModalVisible(false)}
        record={previewRecord}
      />
      
      {/* 导入弹窗 */}
      <ImportModal
        visible={importModalVisible}
        onVisibleChange={setImportModalVisible}
        onSuccess={handleRefresh}
      />
      
      {/* 版本历史抽屉（使用 DetailDrawer） */}
      <VersionHistoryDrawer
        visible={versionDrawerVisible}
        onVisibleChange={setVersionDrawerVisible}
        onRollback={handleRefresh}
      />
    </PageContainer>
  );
}
