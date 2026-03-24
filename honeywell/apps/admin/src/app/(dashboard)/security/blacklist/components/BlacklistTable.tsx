/**
 * @file 黑名单列表表格组件
 * @description 展示黑名单列表，支持搜索、筛选、排序、批量操作
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.2-黑名单管理页.md 第六节
 */

'use client';

import React, { useState, useCallback } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Space, Button, Popconfirm, Table, Empty, Typography } from 'antd';
import { RiDeleteBinLine, RiUploadLine, RiFileAddLine } from '@remixicon/react';
import { getBlacklistList } from '@/services/blacklist';
import { get } from '@/utils/request';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { MaskedText } from '@/components/common/MaskedText';
import type { Blacklist, BlacklistType } from '@/types/blacklist';
import { blacklistTypeMap } from '@/types/blacklist';

const { Text } = Typography;

interface BlacklistTableProps {
  /** 表格操作引用 */
  actionRef: React.RefObject<ActionType | null>;
  /** 当前黑名单类型 */
  type: BlacklistType;
  /** 删除回调 */
  onDelete: (id: number) => void;
  /** 批量删除回调 */
  onBatchDelete: (ids: number[]) => void;
  /** 打开导入弹窗 */
  onOpenImport: () => void;
  /** 删除加载中（正在删除的ID） */
  deleteLoading: number | null;
  /** 批量删除加载中 */
  batchDeleteLoading: boolean;
}

/**
 * 黑名单列表表格
 */
const BlacklistTable: React.FC<BlacklistTableProps> = ({
  actionRef,
  type,
  onDelete,
  onBatchDelete,
  onOpenImport,
  deleteLoading,
  batchDeleteLoading,
}) => {
  const typeConfig = blacklistTypeMap[type];
  // 是否有筛选条件（用于空状态显示）
  const [hasFilters, setHasFilters] = useState(false);

  /**
   * 渲染值列（根据类型决定是否脱敏）
   */
  const renderValue = (value: string) => {
    if (type === 'PHONE') {
      return <MaskedText value={value} maskType="phone" />;
    }
    if (type === 'BANK_CARD') {
      return <MaskedText value={value} maskType="bankCard" />;
    }
    // IP地址不脱敏
    return <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{value}</span>;
  };

  /**
   * 获取管理员列表（用于操作人筛选）
   * @description 依据：02.4-后台API接口清单.md 第14.1节
   */
  const fetchAdminOptions = useCallback(async () => {
    try {
      const response = await get<{
        list: Array<{ id: number; username: string; nickname?: string }>;
      }>('/admins', { isActive: true, pageSize: 100 });
      return response.list.map((admin) => ({
        label: admin.nickname || admin.username,
        value: admin.id,
      }));
    } catch {
      return [];
    }
  }, []);

  /**
   * 列定义
   * @description 依据：04.10.2-黑名单管理页.md 第六节
   */
  const columns: ProColumns<Blacklist>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
      sorter: true,
    },
    {
      title: typeConfig.valueLabel,
      dataIndex: 'value',
      width: type === 'BANK_CARD' ? 200 : 160,
      fieldProps: {
        placeholder: `搜索${typeConfig.valueLabel}`,
      },
      render: (_, record) => renderValue(record.value),
    },
    // 银行卡黑名单显示银行名称
    ...(type === 'BANK_CARD'
      ? [
          {
            title: '银行名称',
            dataIndex: 'bankName',
            width: 150,
            search: false,
            // 银行卡黑名单：银行名称在 >= 768px 显示
            responsive: ['md'] as ('md' | 'sm' | 'lg' | 'xl' | 'xxl')[],
            render: (_: unknown, record: Blacklist) => record.bankName || '-',
          },
        ]
      : []),
    {
      title: '添加原因',
      dataIndex: 'reason',
      width: type === 'BANK_CARD' ? 180 : 200,
      search: false,
      ellipsis: true,
      render: (_, record) => record.reason || '-',
    },
    {
      title: '操作人',
      dataIndex: 'createdBy',
      width: 100,
      valueType: 'select',
      // 手机号/IP黑名单：操作人在 >= 768px 显示
      // 银行卡黑名单：操作人在 >= 1200px 显示
      responsive: type === 'BANK_CARD' ? ['xl'] : ['md'],
      fieldProps: {
        showSearch: true,
        placeholder: '选择操作人',
      },
      request: fetchAdminOptions,
      render: (_, record) => record.createdByName || '-',
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 165,
      valueType: 'dateTimeRange',
      // 所有类型黑名单：添加时间在 >= 1200px 显示
      responsive: ['xl'],
      sorter: true,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => [
        <Popconfirm
          key="delete"
          title="确定移除该黑名单记录？"
          description="移除后对应项将恢复正常使用"
          onConfirm={() => onDelete(record.id)}
          okText="确定"
          cancelText="取消"
          okButtonProps={{ danger: true, loading: deleteLoading === record.id }}
        >
          <a style={{ color: '#ff4d4f' }}>移除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ProTable<Blacklist>
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      scroll={{ x: 'max-content' }}
      // 搜索配置
      search={{
        labelWidth: 'auto',
        defaultCollapsed: false,
        span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
      }}
      // 分页配置
      pagination={{
        defaultPageSize: 20,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条记录`,
      }}
      // 工具栏配置
      options={{
        density: true,
        fullScreen: true,
        reload: true,
        setting: true,
      }}
      // 列配置持久化
      columnsState={{
        persistenceKey: `blacklist-${type}-columns`,
        persistenceType: 'localStorage',
      }}
      // 批量操作
      rowSelection={{
        selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT],
      }}
      tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space>
          <span>已选 {selectedRowKeys.length} 项</span>
          <a onClick={onCleanSelected}>取消选择</a>
        </Space>
      )}
      tableAlertOptionRender={({ selectedRowKeys, onCleanSelected }) => (
        <Space>
          <Popconfirm
            title={`确定移除选中的 ${selectedRowKeys.length} 条黑名单记录？`}
            description="移除后对应项将恢复正常使用"
            onConfirm={() => {
              onBatchDelete(selectedRowKeys as number[]);
              onCleanSelected();
            }}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true, loading: batchDeleteLoading }}
          >
            <Button danger icon={<RiDeleteBinLine size={14} />} loading={batchDeleteLoading}>
              批量移除
            </Button>
          </Popconfirm>
          <Button icon={<RiUploadLine size={14} />} onClick={onOpenImport}>
            批量导入
          </Button>
        </Space>
      )}
      // 空状态 - 依据：04.10.2-黑名单管理页.md 第6.10节
      locale={{
        emptyText: hasFilters ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <span>暂无符合条件的数据</span>
                <Text type="secondary" style={{ fontSize: 12 }}>请调整筛选条件</Text>
              </Space>
            }
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical" size={4}>
                <span>暂无黑名单数据</span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <RiFileAddLine size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  点击右上角按钮添加黑名单
                </Text>
              </Space>
            }
          />
        ),
      }}
      // 数据请求
      request={async (params, sort) => {
        const { current, pageSize, value: keyword, createdBy, startDate, endDate } = params;

        // 检查是否有筛选条件
        const hasFilterConditions = !!(keyword || createdBy || startDate || endDate);
        setHasFilters(hasFilterConditions);

        // 构建排序参数
        let sortField: string | undefined;
        let sortOrder: 'ascend' | 'descend' | undefined;
        if (sort) {
          const sortKey = Object.keys(sort)[0];
          if (sortKey) {
            sortField = sortKey;
            sortOrder = sort[sortKey] as 'ascend' | 'descend';
          }
        }

        try {
          const response = await getBlacklistList({
            page: current,
            pageSize,
            type,
            keyword,
            createdBy: createdBy ? Number(createdBy) : undefined,
            startDate,
            endDate,
            sortField,
            sortOrder,
          });

          return {
            data: response.list,
            total: response.pagination.total,
            success: true,
          };
        } catch {
          return {
            data: [],
            total: 0,
            success: false,
          };
        }
      }}
    />
  );
};

export default BlacklistTable;
