/**
 * @file 用户列表页
 * @description 后台管理系统用户列表页面，支持搜索筛选、批量操作、单条操作
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节
 */

'use client';

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Tag,
  Space,
  Button,
  Dropdown,
  Typography,
  Tooltip,
  App,
  InputNumber,
} from 'antd';
import type { MenuProps } from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMoreLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiProhibitedLine,
  RiShieldCheckLine,
  RiWalletLine,
  RiBankCardLine,
} from '@remixicon/react';

import { fetchUserList, batchBanUsers, batchUnbanUsers, resetUserPassword, clearUserBankCards } from '@/services/users';
import { formatCurrency } from '@/utils/format';
import { TimeDisplay } from '@/components/common';
import { BatchOperationBar } from '@/components/tables';
import { BatchResultModal, ConfirmModal } from '@/components/modals';
import { ListPageSkeleton } from '@/components/tables/ListPageSkeleton';
import {
  BalanceModal,
  GiftProductModal,
  BanModal,
  BatchBalanceModal,
  BlacklistModal,
} from '@/components/users';
import type {
  UserListItem,
  UserListParams,
  BlacklistType,
  BatchOperationResponse,
} from '@/types/users';
import {
  VIP_LEVEL_OPTIONS,
  SVIP_LEVEL_OPTIONS,
  HAS_POSITION_OPTIONS,
  HAS_PURCHASED_PAID_OPTIONS,
} from '@/types/users';

const { Text } = Typography;

/**
 * 密码显示组件
 * @description 支持显示/隐藏密码切换
 */
function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <Space size={4}>
      <Text style={{ fontFamily: 'monospace' }}>
        {visible ? password : '••••••••'}
      </Text>
      <Tooltip title={visible ? '隐藏密码' : '查看密码'}>
        <Button
          type="link"
          size="small"
          icon={visible ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
          onClick={() => setVisible(!visible)}
          style={{ padding: 0 }}
        />
      </Tooltip>
    </Space>
  );
}

/**
 * 批量操作结果失败记录类型
 */
interface FailedRecord {
  id: string | number;
  name?: string;
  reason: string;
}

/**
 * 用户列表页面
 * @description 依据：04.3.1-用户列表页.md
 */
export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message, modal } = App.useApp();

  // 首次加载状态（用于骨架屏）
  const [initialLoading, setInitialLoading] = useState(true);

  // 选中的行
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<UserListItem[]>([]);

  // 弹窗状态
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [batchBalanceModalOpen, setBatchBalanceModalOpen] = useState(false);
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);

  // 批量操作结果弹窗
  const [batchResultModalOpen, setBatchResultModalOpen] = useState(false);
  const [batchResultData, setBatchResultData] = useState<{
    operationName: string;
    total: number;
    successCount: number;
    failedCount: number;
    failedRecords: FailedRecord[];
  } | null>(null);

  // 当前操作的用户
  const [currentUser, setCurrentUser] = useState<UserListItem | null>(null);
  const [banAction, setBanAction] = useState<'ban' | 'unban'>('ban');
  const [blacklistType, setBlacklistType] = useState<BlacklistType>('PHONE');

  // 批量操作loading
  const [batchLoading, setBatchLoading] = useState(false);

  /**
   * 从URL参数获取初始筛选条件
   * @description 支持 status, keyword, inviterId, registerIp 等参数预填
   */
  const getInitialParams = useCallback((): Partial<UserListParams> => {
    const params: Partial<UserListParams> = {};
    
    // 用户状态
    const status = searchParams.get('status');
    if (status === 'ACTIVE' || status === 'BANNED') {
      params.status = status;
    }
    
    // 关键词搜索
    const keyword = searchParams.get('keyword');
    if (keyword) {
      params.keyword = keyword;
    }
    
    // 上级邀请人ID
    const inviterId = searchParams.get('inviterId');
    if (inviterId) {
      params.inviterId = Number(inviterId);
    }
    
    // 上级邀请人手机号
    const inviterPhone = searchParams.get('inviterPhone');
    if (inviterPhone) {
      params.inviterPhone = inviterPhone;
    }
    
    // 注册IP
    const registerIp = searchParams.get('registerIp');
    if (registerIp) {
      params.registerIp = registerIp;
    }
    
    // VIP等级
    const vipLevel = searchParams.get('vipLevel');
    if (vipLevel) {
      params.vipLevel = vipLevel.split(',').map(Number);
    }
    
    // SVIP等级
    const svipLevel = searchParams.get('svipLevel');
    if (svipLevel) {
      params.svipLevel = svipLevel.split(',').map(Number);
    }
    
    // 是否有持仓
    const hasPosition = searchParams.get('hasPosition');
    if (hasPosition === 'true') {
      params.hasPosition = true;
    } else if (hasPosition === 'false') {
      params.hasPosition = false;
    }
    
    // 是否购买过付费产品
    const hasPurchasedPaid = searchParams.get('hasPurchasedPaid');
    if (hasPurchasedPaid === 'true') {
      params.hasPurchasedPaid = true;
    } else if (hasPurchasedPaid === 'false') {
      params.hasPurchasedPaid = false;
    }
    
    return params;
  }, [searchParams]);

  /**
   * 复制到剪贴板
   */
  const handleCopy = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        message.success(`${label}已复制`);
      } catch {
        message.error('复制失败');
      }
    },
    [message]
  );

  /**
   * 跳转到用户详情
   */
  const navigateToDetail = useCallback(
    (userId: number, tab?: string) => {
      const url = tab ? `/users/${userId}?tab=${tab}` : `/users/${userId}`;
      router.push(url);
    },
    [router]
  );

  /**
   * 打开余额调整弹窗
   */
  const openBalanceModal = useCallback((user: UserListItem) => {
    setCurrentUser(user);
    setBalanceModalOpen(true);
  }, []);

  /**
   * 打开赠送产品弹窗
   */
  const openGiftModal = useCallback((user: UserListItem) => {
    setCurrentUser(user);
    setGiftModalOpen(true);
  }, []);

  /**
   * 打开封禁/解封弹窗
   */
  const openBanModal = useCallback((user: UserListItem, action: 'ban' | 'unban') => {
    setCurrentUser(user);
    setBanAction(action);
    setBanModalOpen(true);
  }, []);

  /**
   * 打开拉黑弹窗
   */
  const openBlacklistModal = useCallback((user: UserListItem, type: BlacklistType) => {
    setCurrentUser(user);
    setBlacklistType(type);
    setBlacklistModalOpen(true);
  }, []);

  /**
   * 重置密码
   */
  const handleResetPassword = useCallback(
    (user: UserListItem) => {
      modal.confirm({
        title: '重置密码确认',
        content: (
          <div>
            <Text>确定要重置用户 <Text strong>{user.phone}</Text> 的密码吗？</Text>
            <br />
            <Text type="secondary">重置后将生成新的随机密码</Text>
          </div>
        ),
        okText: '确定重置',
        cancelText: '取消',
        onOk: async () => {
          try {
            const result = await resetUserPassword(user.id);
            modal.success({
              title: '密码已重置',
              content: (
                <div>
                  <Text>新密码：<Text strong code copyable>{result.newPassword}</Text></Text>
                </div>
              ),
            });
            actionRef.current?.reload();
          } catch (error) {
            // 错误已在 request 中处理
          }
        },
      });
    },
    [modal]
  );

  /**
   * 清空银行卡
   */
  const handleClearBankCards = useCallback(
    (user: UserListItem) => {
      modal.confirm({
        title: '清空银行卡确认',
        icon: <RiBankCardLine size={20} style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <Text>确定要清空用户 <Text strong>{user.phone}</Text> 的所有银行卡信息吗？</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="warning">此操作将：</Text>
              <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                <li><Text type="secondary">删除用户所有已绑定的银行卡</Text></li>
                <li><Text type="secondary">释放关联的账户手机号锁定记录</Text></li>
                <li><Text type="secondary">用户需要重新绑定银行卡才能提现</Text></li>
              </ul>
            </div>
          </div>
        ),
        okText: '确定清空',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            const result = await clearUserBankCards(user.id);
            message.success(`已清空 ${result.cardsCleared} 张银行卡，释放 ${result.locksCleared} 条锁定记录`);
            actionRef.current?.reload();
          } catch (error) {
            // 错误已在 request 中处理
          }
        },
      });
    },
    [modal, message]
  );

  /**
   * 处理批量操作结果
   * @description 使用 BatchResultModal 显示详细结果
   */
  const handleBatchResult = useCallback(
    (result: BatchOperationResponse, actionName: string) => {
      // 构建失败记录
      const failedRecords: FailedRecord[] = result.results
        .filter((r) => !r.success)
        .map((r) => {
          const user = selectedRows.find((u) => u.id === r.id);
          return {
            id: r.id,
            name: user?.phone || `用户 ${r.id}`,
            reason: r.error?.message || '操作失败',
          };
        });

      // 设置结果数据并打开弹窗
      setBatchResultData({
        operationName: actionName,
        total: result.total,
        successCount: result.succeeded,
        failedCount: result.failed,
        failedRecords,
      });
      setBatchResultModalOpen(true);

      // 清空选中
      setSelectedRowKeys([]);
      setSelectedRows([]);
    },
    [selectedRows]
  );

  /**
   * 刷新列表
   */
  const refreshList = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /**
   * 批量封禁
   */
  const handleBatchBan = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: '批量封禁确认',
      icon: <RiProhibitedLine size={20} style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Text>确定封禁已选的 <Text strong>{selectedRowKeys.length}</Text> 位用户？</Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">封禁后用户将无法登录，资金将被冻结</Text>
          </div>
        </div>
      ),
      okText: '确定封禁',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true);
        try {
          const result = await batchBanUsers({ ids: selectedRowKeys as number[] });
          handleBatchResult(result, '批量封禁');
        } catch (error) {
          // 错误已在 request 中处理
        } finally {
          setBatchLoading(false);
        }
      },
    });
  }, [selectedRowKeys, modal, handleBatchResult]);

  /**
   * 批量解封
   */
  const handleBatchUnban = useCallback(async () => {
    if (selectedRowKeys.length === 0) return;

    modal.confirm({
      title: '批量解封确认',
      icon: <RiShieldCheckLine size={20} style={{ color: '#52c41a' }} />,
      content: (
        <div>
          <Text>确定解封已选的 <Text strong>{selectedRowKeys.length}</Text> 位用户？</Text>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">解封后用户可正常登录，但冻结余额需手动处理</Text>
          </div>
        </div>
      ),
      okText: '确定解封',
      cancelText: '取消',
      onOk: async () => {
        setBatchLoading(true);
        try {
          const result = await batchUnbanUsers({ ids: selectedRowKeys as number[] });
          handleBatchResult(result, '批量解封');
        } catch (error) {
          // 错误已在 request 中处理
        } finally {
          setBatchLoading(false);
        }
      },
    });
  }, [selectedRowKeys, modal, handleBatchResult]);

  /**
   * 操作菜单配置
   */
  const getMoreMenuItems = useCallback(
    (record: UserListItem): MenuProps['items'] => [
      {
        key: 'ban',
        label: record.status === 'ACTIVE' ? '封禁' : '解封',
        icon: record.status === 'ACTIVE' 
          ? <RiProhibitedLine size={14} /> 
          : <RiShieldCheckLine size={14} />,
        onClick: () =>
          openBanModal(record, record.status === 'ACTIVE' ? 'ban' : 'unban'),
      },
      {
        key: 'gift',
        label: '赠送产品',
        onClick: () => openGiftModal(record),
      },
      {
        key: 'resetPwd',
        label: '重置密码',
        onClick: () => handleResetPassword(record),
      },
      {
        key: 'clearBankCards',
        label: '清空银行卡',
        icon: <RiBankCardLine size={14} />,
        onClick: () => handleClearBankCards(record),
      },
      { type: 'divider' },
      {
        key: 'blacklist',
        label: '拉黑',
        children: [
          {
            key: 'blacklist-phone',
            label: '拉黑手机号',
            onClick: () => openBlacklistModal(record, 'PHONE'),
          },
          {
            key: 'blacklist-ip',
            label: '拉黑注册IP',
            disabled: !record.registerIp,
            onClick: () => openBlacklistModal(record, 'IP'),
          },
        ],
      },
    ],
    [openBanModal, openGiftModal, handleResetPassword, handleClearBankCards, openBlacklistModal]
  );

  /**
   * 批量操作栏配置
   */
  const batchActions = useMemo(
    () => [
      {
        key: 'ban',
        label: '批量封禁',
        danger: true,
        loading: batchLoading,
        icon: <RiProhibitedLine size={16} />,
        onClick: handleBatchBan,
      },
      {
        key: 'unban',
        label: '批量解封',
        loading: batchLoading,
        icon: <RiShieldCheckLine size={16} />,
        onClick: handleBatchUnban,
      },
      {
        key: 'balance',
        label: '批量调余额',
        loading: batchLoading,
        icon: <RiWalletLine size={16} />,
        onClick: () => setBatchBalanceModalOpen(true),
      },
    ],
    [batchLoading, handleBatchBan, handleBatchUnban]
  );

  /**
   * 表格列配置
   * @description 依据：04.3.1-用户列表页.md 第3节
   */
  const columns: ProColumns<UserListItem>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={4}>
          <Text>{record.id}</Text>
          <Tooltip title="复制ID">
            <Button
              type="link"
              size="small"
              icon={<RiFileCopyLine size={12} />}
              onClick={() => handleCopy(String(record.id), 'ID')}
              style={{ padding: 0, height: 'auto' }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
      copyable: true,
      hideInSearch: true,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 100,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.nickname || <Text type="secondary">未设置</Text>,
    },
    {
      title: 'VIP',
      dataIndex: 'vipLevel',
      key: 'vipLevel_display',
      width: 80,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.vipLevel > 0 ? 'blue' : 'default'}>
          VIP{record.vipLevel}
        </Tag>
      ),
    },
    {
      title: 'SVIP',
      dataIndex: 'svipLevel',
      key: 'svipLevel_display',
      width: 80,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.svipLevel > 0 ? 'gold' : 'default'}>
          SVIP{record.svipLevel}
        </Tag>
      ),
    },
    {
      title: '可用余额',
      dataIndex: 'availableBalance',
      width: 120,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <Text style={{ fontFamily: 'Roboto Mono, monospace' }}>
          {formatCurrency(record.availableBalance)}
        </Text>
      ),
    },
    {
      title: '冻结余额',
      dataIndex: 'frozenBalance',
      width: 120,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => {
        const frozen = Number(record.frozenBalance);
        return (
          <Text
            style={{
              fontFamily: 'Roboto Mono, monospace',
              color: frozen > 0 ? '#ff4d4f' : undefined,
            }}
          >
            {formatCurrency(record.frozenBalance)}
          </Text>
        );
      },
    },
    {
      title: '密码',
      dataIndex: 'password',
      width: 120,
      hideInSearch: true,
      render: (_, record) => <PasswordCell password={record.password} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      valueEnum: {
        ACTIVE: { text: '正常', status: 'Success' },
        BANNED: { text: '封禁', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'ACTIVE' ? 'success' : 'error'}>
          {record.status === 'ACTIVE' ? '正常' : '封禁'}
        </Tag>
      ),
    },
    {
      title: '上级',
      dataIndex: 'inviterPhone',
      key: 'inviterPhone_display',
      width: 120,
      hideInSearch: true,
      render: (_, record) =>
        record.inviterPhone ? (
          <a onClick={() => record.inviterId && navigateToDetail(record.inviterId)}>
            {record.inviterPhone}
          </a>
        ) : (
          <Text type="secondary">无</Text>
        ),
    },
    {
      title: '团队人数',
      dataIndex: 'teamCount',
      width: 90,
      sorter: true,
      hideInSearch: true,
      render: (_, record) => (
        <a onClick={() => navigateToDetail(record.id, 'team')}>{record.teamCount}</a>
      ),
    },
    {
      title: '累计充值',
      dataIndex: 'totalRecharge',
      width: 120,
      sorter: true,
      hideInSearch: true,
      responsive: ['xl'],
      render: (_, record) => (
        <Text style={{ fontFamily: 'Roboto Mono, monospace' }}>
          {formatCurrency(record.totalRecharge)}
        </Text>
      ),
    },
    {
      title: '累计提现',
      dataIndex: 'totalWithdraw',
      width: 120,
      sorter: true,
      hideInSearch: true,
      responsive: ['xl'],
      render: (_, record) => (
        <Text style={{ fontFamily: 'Roboto Mono, monospace' }}>
          {formatCurrency(record.totalWithdraw)}
        </Text>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 170,
      sorter: true,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      width: 170,
      sorter: true,
      hideInSearch: true,
      responsive: ['xl'],
      render: (_, record) => <TimeDisplay value={record.lastLoginAt} />,
    },
    {
      title: '注册IP',
      dataIndex: 'registerIp',
      width: 130,
      hideInSearch: true,
      responsive: ['xxl'],
      render: (_, record) => record.registerIp || <Text type="secondary">-</Text>,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <a key="detail" onClick={() => navigateToDetail(record.id)}>
          详情
        </a>,
        <a key="balance" onClick={() => openBalanceModal(record)}>
          余额
        </a>,
        <Dropdown key="more" menu={{ items: getMoreMenuItems(record) }}>
          <a>
            更多 <RiMoreLine size={14} style={{ verticalAlign: 'middle' }} />
          </a>
        </Dropdown>,
      ],
    },
    // ================== 隐藏的搜索字段 ==================
    {
      title: '关键词',
      dataIndex: 'keyword',
      hideInTable: true,
      order: 10,
      fieldProps: {
        placeholder: '手机号/ID/邀请码',
      },
    },
    {
      title: 'VIP等级',
      dataIndex: 'vipLevelFilter',
      hideInTable: true,
      order: 9,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择VIP等级',
        options: VIP_LEVEL_OPTIONS,
        maxTagCount: 2,
      },
      search: {
        transform: (value) => ({ vipLevel: value }),
      },
    },
    {
      title: 'SVIP等级',
      dataIndex: 'svipLevelFilter',
      hideInTable: true,
      order: 8,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: '请选择SVIP等级',
        options: SVIP_LEVEL_OPTIONS,
        maxTagCount: 2,
      },
      search: {
        transform: (value) => ({ svipLevel: value }),
      },
    },
    {
      title: '上级邀请人',
      dataIndex: 'inviterPhoneFilter',
      hideInTable: true,
      order: 5,
      fieldProps: {
        placeholder: '上级用户手机号',
      },
      search: {
        transform: (value) => ({ inviterPhone: value }),
      },
    },
    {
      title: '注册IP',
      dataIndex: 'registerIp',
      key: 'registerIp_search',
      hideInTable: true,
      order: 4,
      fieldProps: {
        placeholder: '注册IP地址',
      },
    },
    {
      title: '余额范围',
      dataIndex: 'balanceRange',
      hideInTable: true,
      order: 3,
      renderFormItem: () => (
        <Space>
          <InputNumber
            placeholder="最小值"
            min={0}
            precision={0}
            style={{ width: 100 }}
          />
          <span>-</span>
          <InputNumber
            placeholder="最大值"
            min={0}
            precision={0}
            style={{ width: 100 }}
          />
        </Space>
      ),
      search: {
        transform: (value) => {
          if (!value) return {};
          // balanceRange 是一个数组 [min, max]
          return {
            balanceMin: value[0],
            balanceMax: value[1],
          };
        },
      },
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginRange',
      hideInTable: true,
      order: 2,
      valueType: 'dateRange',
      search: {
        transform: (value) => ({
          lastLoginStart: value?.[0],
          lastLoginEnd: value?.[1],
        }),
      },
    },
    {
      title: '是否有持仓',
      dataIndex: 'hasPosition',
      hideInTable: true,
      order: 1,
      valueType: 'select',
      fieldProps: {
        placeholder: '全部',
        options: HAS_POSITION_OPTIONS,
        allowClear: true,
      },
    },
    {
      title: '已购付费产品',
      dataIndex: 'hasPurchasedPaid',
      hideInTable: true,
      order: 0,
      valueType: 'select',
      fieldProps: {
        placeholder: '全部',
        options: HAS_PURCHASED_PAID_OPTIONS,
        allowClear: true,
      },
    },
  ];

  // 首次加载完成后关闭骨架屏
  useEffect(() => {
    // 短暂延迟确保 ProTable 已完成初始化
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // 骨架屏
  if (initialLoading) {
    return (
      <div className="users-page">
        <ListPageSkeleton
          showSearch
          searchCount={5}
          rows={10}
          columns={8}
        />
      </div>
    );
  }

  return (
    <div className="users-page">
      <ProTable<UserListItem>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 2200 }}
        request={async (params, sort) => {
          // 合并URL参数
          const initialParams = getInitialParams();
          const mergedParams: UserListParams = {
            ...initialParams,
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
            vipLevel: params.vipLevel,
            svipLevel: params.svipLevel,
            status: params.status,
            startDate: params.startDate,
            endDate: params.endDate,
            inviterPhone: params.inviterPhone,
            registerIp: params.registerIp,
            balanceMin: params.balanceMin,
            balanceMax: params.balanceMax,
            lastLoginStart: params.lastLoginStart,
            lastLoginEnd: params.lastLoginEnd,
            hasPosition: params.hasPosition === 'true' ? true : params.hasPosition === 'false' ? false : undefined,
            hasPurchasedPaid: params.hasPurchasedPaid === 'true' ? true : params.hasPurchasedPaid === 'false' ? false : undefined,
          };

          try {
            const data = await fetchUserList(mergedParams);
            return {
              data: data.list,
              success: true,
              total: data.pagination.total,
            };
          } catch {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        rowClassName={(record) =>
          record.status === 'BANNED' ? 'user-row-banned' : ''
        }
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: 6,
          collapseRender: (collapsed) => (collapsed ? '展开更多筛选' : '收起'),
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        headerTitle="用户列表"
        toolBarRender={() => [
          <Button
            key="refresh"
            icon={<RiRefreshLine size={16} />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
        onRow={(record) => ({
          onDoubleClick: () => navigateToDetail(record.id),
          style: {
            cursor: 'pointer',
            backgroundColor: record.status === 'BANNED' ? 'rgba(255,0,0,0.08)' : undefined,
          },
        })}
      />

      {/* 批量操作栏 */}
      <BatchOperationBar
        selectedCount={selectedRowKeys.length}
        actions={batchActions}
        onCancel={() => {
          setSelectedRowKeys([]);
          setSelectedRows([]);
        }}
      />

      {/* 批量操作结果弹窗 */}
      {batchResultData && (
        <BatchResultModal
          open={batchResultModalOpen}
          onClose={() => setBatchResultModalOpen(false)}
          onRefresh={refreshList}
          operationName={batchResultData.operationName}
          total={batchResultData.total}
          successCount={batchResultData.successCount}
          failedCount={batchResultData.failedCount}
          failedRecords={batchResultData.failedRecords}
        />
      )}

      {/* 调整余额弹窗 */}
      <BalanceModal
        open={balanceModalOpen}
        user={currentUser}
        onClose={() => setBalanceModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* 赠送产品弹窗 */}
      <GiftProductModal
        open={giftModalOpen}
        user={currentUser}
        onClose={() => setGiftModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* 封禁/解封弹窗 */}
      <BanModal
        open={banModalOpen}
        user={currentUser}
        action={banAction}
        onClose={() => setBanModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* 批量调余额弹窗 */}
      <BatchBalanceModal
        open={batchBalanceModalOpen}
        users={selectedRows}
        onClose={() => setBatchBalanceModalOpen(false)}
        onSuccess={() => {
          actionRef.current?.reload();
          setSelectedRowKeys([]);
          setSelectedRows([]);
        }}
      />

      {/* 拉黑弹窗 */}
      <BlacklistModal
        open={blacklistModalOpen}
        user={currentUser}
        type={blacklistType}
        onClose={() => setBlacklistModalOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* 样式 */}
      <style jsx global>{`
        .user-row-banned {
          background-color: rgba(255, 0, 0, 0.08) !important;
        }
        .user-row-banned:hover > td {
          background-color: rgba(255, 0, 0, 0.12) !important;
        }
        .users-page .ant-pro-table-search {
          margin-bottom: 16px;
          padding: 20px 24px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </div>
  );
}
