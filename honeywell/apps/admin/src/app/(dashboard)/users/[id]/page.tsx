/**
 * @file 用户详情页
 * @description 后台管理系统用户详情页面，包含7个Tab
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.2-用户详情页.md
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Breadcrumb,
  Tabs,
  Card,
  Descriptions,
  Typography,
  Tag,
  Space,
  Button,
  Spin,
  App,
  Modal,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiHome4Line,
  RiUserLine,
  RiListUnordered,
  RiEyeLine,
  RiEyeOffLine,
  RiExternalLinkLine,
  RiForbidLine,
} from '@remixicon/react';
import Link from 'next/link';

// 服务
import {
  fetchUserDetail,
  fetchUserBankCards,
  fetchUserPositionOrders,
  fetchUserRechargeOrders,
  fetchUserWithdrawOrders,
  fetchUserTransactions,
  fetchUserTeam,
  resetUserPassword,
  fetchProducts,
  blacklistBankCard,
  restoreUserPurchase,
} from '@/services/users';

// 组件
import {
  AmountDisplay,
  TimeDisplay,
  MaskedPhone,
  MaskedBankCard,
  CopyButton,
  UserStatusBadge,
  RechargeStatusBadge,
  WithdrawStatusBadge,
  PositionStatusBadge,
} from '@/components';
import {
  UserDetailHeader,
  BalanceModal,
  GiftProductModal,
  BanModal,
  RestorePurchaseModal,
  LevelModal,
  UplineModal,
  BlacklistModal,
} from '@/components/users';
import { formatCurrency } from '@/utils/format';

// 类型
import type {
  UserDetail,
  UserDetailTabKey,
  BankCard,
  PositionOrderItem,
  PositionOrderParams,
  RechargeOrderItem,
  RechargeOrderParams,
  WithdrawOrderItem,
  WithdrawOrderParams,
  TransactionItem,
  TransactionParams,
  TeamMemberItem,
  TeamMemberParams,
  TeamSummary,
  ProductItem,
  BlacklistType,
} from '@/types/users';
import {
  POSITION_STATUS_OPTIONS,
  RECHARGE_STATUS_OPTIONS,
  WITHDRAW_STATUS_OPTIONS,
  TRANSACTION_TYPE_OPTIONS,
  TEAM_LEVEL_OPTIONS,
  POSITION_ORDER_TYPE_OPTIONS,
  TRANSACTION_TYPE_LABELS,
} from '@/types/users';

const { Text, Title, Paragraph } = Typography;

/**
 * Tab键与URL参数的映射
 */
const TAB_KEYS: Record<string, UserDetailTabKey> = {
  basic: 'basic',
  bankCards: 'bankCards',
  positions: 'positions',
  recharges: 'recharges',
  withdraws: 'withdraws',
  transactions: 'transactions',
  team: 'team',
};

/**
 * 密码显示组件
 */
function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <Space size={4}>
      <Text style={{ fontFamily: 'monospace' }}>
        {visible ? password : '••••••••'}
      </Text>
      <Button
        type="link"
        size="small"
        icon={visible ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
        onClick={() => setVisible(!visible)}
        style={{ padding: 0 }}
      />
    </Space>
  );
}

/**
 * 状态标记Tag
 */
function StatusTag({ value, label }: { value: boolean; label: string }) {
  return (
    <Tag color={value ? 'success' : 'default'}>
      {value ? '是' : '否'}
    </Tag>
  );
}

/**
 * 用户详情页
 */
export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { message, modal } = App.useApp();

  const userId = Number(params.id);

  // 用户详情
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab状态
  const initialTab = (searchParams.get('tab') as UserDetailTabKey) || 'basic';
  const [activeTab, setActiveTab] = useState<UserDetailTabKey>(initialTab);

  // Tab数据加载状态（用于懒加载）
  const [tabLoadedMap, setTabLoadedMap] = useState<Record<string, boolean>>({
    basic: true, // 基本信息默认加载
  });

  // 银行卡数据
  const [bankCards, setBankCards] = useState<BankCard[]>([]);
  const [bankCardsLoading, setBankCardsLoading] = useState(false);

  // 团队统计
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);

  // 产品列表（用于赠送产品）
  const [products, setProducts] = useState<ProductItem[]>([]);

  // 弹窗状态
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [uplineModalOpen, setUplineModalOpen] = useState(false);
  const [blacklistModalOpen, setBlacklistModalOpen] = useState(false);
  const [blacklistType, setBlacklistType] = useState<BlacklistType>('PHONE');

  // ProTable refs
  const positionsTableRef = useRef<ActionType>(null);
  const rechargesTableRef = useRef<ActionType>(null);
  const withdrawsTableRef = useRef<ActionType>(null);
  const transactionsTableRef = useRef<ActionType>(null);
  const teamTableRef = useRef<ActionType>(null);

  // 加载用户详情
  const loadUserDetail = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchUserDetail(userId);
      setUser(data);
    } catch (error) {
      console.error('加载用户详情失败:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    loadUserDetail();
    fetchProducts().then((res) => setProducts(res.list || []));
  }, [loadUserDetail]);

  // Tab切换
  const handleTabChange = useCallback((key: string) => {
    const tabKey = key as UserDetailTabKey;
    setActiveTab(tabKey);
    // 更新URL参数
    router.replace(`/users/${userId}?tab=${tabKey}`, { scroll: false });
    // 标记Tab为已加载
    setTabLoadedMap((prev) => ({ ...prev, [tabKey]: true }));
  }, [userId, router]);

  // 加载银行卡数据
  const loadBankCards = useCallback(async () => {
    if (bankCardsLoading || bankCards.length > 0) return;
    setBankCardsLoading(true);
    try {
      const res = await fetchUserBankCards(userId);
      setBankCards(res.list || []);
    } catch (error) {
      console.error('加载银行卡失败:', error);
    } finally {
      setBankCardsLoading(false);
    }
  }, [userId, bankCardsLoading, bankCards.length]);

  // 银行卡Tab激活时加载
  useEffect(() => {
    if (activeTab === 'bankCards' && tabLoadedMap.bankCards) {
      loadBankCards();
    }
  }, [activeTab, tabLoadedMap, loadBankCards]);

  // 重置密码
  const handleResetPassword = useCallback(() => {
    if (!user) return;
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
          loadUserDetail();
        } catch (error) {
          // 错误已在 request 中处理
        }
      },
    });
  }, [user, modal, loadUserDetail]);

  // 拉黑手机号
  const handleBlacklistPhone = useCallback(() => {
    setBlacklistType('PHONE');
    setBlacklistModalOpen(true);
  }, []);

  // 拉黑注册IP
  const handleBlacklistIP = useCallback(() => {
    setBlacklistType('IP');
    setBlacklistModalOpen(true);
  }, []);

  // 跳转用户详情
  const navigateToUser = useCallback((targetUserId: number) => {
    router.push(`/users/${targetUserId}`);
  }, [router]);

  // 操作成功后刷新
  const handleOperationSuccess = useCallback(() => {
    loadUserDetail();
    // 刷新相关Tab
    positionsTableRef.current?.reload();
    rechargesTableRef.current?.reload();
    withdrawsTableRef.current?.reload();
    transactionsTableRef.current?.reload();
  }, [loadUserDetail]);

  // ==================== 基本信息Tab ====================
  const renderBasicInfo = () => {
    if (!user) return null;

    // 提现门槛满足计算
    const withdrawThresholdMet = user.hasRecharged && user.hasPurchasedPaid;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16 }}>
        {/* 账户信息 */}
        <Card title="账户信息" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="用户ID">
              <Space>
                <Text copyable>{user.id}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              <Text copyable>{user.phone}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="密码">
              <PasswordCell password={user.password} />
            </Descriptions.Item>
            <Descriptions.Item label="昵称">
              {user.nickname || <Text type="secondary">未设置</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="邀请码">
              <Space>
                <Text style={{ fontFamily: 'monospace' }}>{user.inviteCode}</Text>
                <CopyButton text={user.inviteCode} />
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <UserStatusBadge status={user.status} />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 等级信息 */}
        <Card title="等级信息" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="VIP等级">
              <Tag color="blue">VIP{user.vipLevel}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="SVIP等级">
              <Tag color="gold">SVIP{user.svipLevel}</Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 余额信息 */}
        <Card title="余额信息" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="可用余额">
              <AmountDisplay value={user.availableBalance} size="default" />
            </Descriptions.Item>
            <Descriptions.Item label="冻结余额">
              <AmountDisplay
                value={user.frozenBalance}
                size="default"
                style={{ color: Number(user.frozenBalance) > 0 ? '#ff4d4f' : undefined }}
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 邀请关系 */}
        <Card title="邀请关系" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="一级上级">
              {user.inviter ? (
                <Space>
                  <Text>{user.inviter.phone}</Text>
                  <Text type="secondary">(ID:{user.inviter.id})</Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<RiExternalLinkLine size={14} />}
                    onClick={() => navigateToUser(user.inviter!.id)}
                    style={{ padding: 0 }}
                  >
                    跳转
                  </Button>
                </Space>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="二级上级">
              {user.level2Inviter ? (
                <Space>
                  <Text>{user.level2Inviter.phone}</Text>
                  <Text type="secondary">(ID:{user.level2Inviter.id})</Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<RiExternalLinkLine size={14} />}
                    onClick={() => navigateToUser(user.level2Inviter!.id)}
                    style={{ padding: 0 }}
                  >
                    跳转
                  </Button>
                </Space>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="三级上级">
              {user.level3Inviter ? (
                <Space>
                  <Text>{user.level3Inviter.phone}</Text>
                  <Text type="secondary">(ID:{user.level3Inviter.id})</Text>
                  <Button
                    type="link"
                    size="small"
                    icon={<RiExternalLinkLine size={14} />}
                    onClick={() => navigateToUser(user.level3Inviter!.id)}
                    style={{ padding: 0 }}
                  >
                    跳转
                  </Button>
                </Space>
              ) : (
                <Text type="secondary">无</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 登录信息 */}
        <Card title="登录信息" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="注册IP">
              {user.registerIp || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              <TimeDisplay value={user.createdAt} />
            </Descriptions.Item>
            <Descriptions.Item label="最后登录IP">
              {user.lastLoginIp || <Text type="secondary">-</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录时间">
              <TimeDisplay value={user.lastLoginAt} />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 状态标记 */}
        <Card title="状态标记" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="已购买体验产品">
              <StatusTag value={user.hasPurchasedTrial} label="已购买体验产品" />
            </Descriptions.Item>
            <Descriptions.Item label="已购买付费产品">
              <StatusTag value={user.hasPurchasedPaid} label="已购买付费产品" />
            </Descriptions.Item>
            <Descriptions.Item label="提现门槛满足">
              <StatusTag value={withdrawThresholdMet} label="提现门槛满足" />
            </Descriptions.Item>
            <Descriptions.Item label="已完成首购">
              <StatusTag value={user.firstPurchaseDone} label="已完成首购" />
            </Descriptions.Item>
            <Descriptions.Item label="已进行过充值">
              <StatusTag value={user.hasRecharged} label="已进行过充值" />
            </Descriptions.Item>
            <Descriptions.Item label="充值后已购买">
              <StatusTag value={user.hasPurchasedAfterRecharge} label="充值后已购买" />
            </Descriptions.Item>
            <Descriptions.Item label="签到任务完成">
              <StatusTag value={user.signInCompleted} label="签到任务完成" />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 累计数据 */}
        <Card title="累计数据" size="small">
          <Descriptions column={1} size="small" styles={{ label: { width: 100 } }}>
            <Descriptions.Item label="累计充值">
              <AmountDisplay value={user.totalRecharge} />
            </Descriptions.Item>
            <Descriptions.Item label="累计提现">
              <AmountDisplay value={user.totalWithdraw} />
            </Descriptions.Item>
            <Descriptions.Item label="累计收益">
              <AmountDisplay value={user.totalIncome} />
            </Descriptions.Item>
            <Descriptions.Item label="累计返佣">
              <AmountDisplay value={user.totalCommission} />
            </Descriptions.Item>
            <Descriptions.Item label="团队总人数">
              <Text>{user.teamCount}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="一级团队">
              <Text>{user.level1Count}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="二级团队">
              <Text>{user.level2Count}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="三级团队">
              <Text>{user.level3Count}</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    );
  };

  // ==================== 银行卡Tab ====================
  const bankCardColumns: ProColumns<BankCard>[] = [
    {
      title: '银行名称',
      dataIndex: 'bankName',
      width: 200,
    },
    {
      title: '银行账号',
      dataIndex: 'accountNo',
      width: 180,
      render: (_, record) => (
        <Space>
          <Text style={{ fontFamily: 'monospace' }}>{record.accountNo}</Text>
          <CopyButton text={record.accountNo} />
        </Space>
      ),
    },
    {
      title: '持卡人姓名',
      dataIndex: 'accountName',
      width: 120,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: '证件类型',
      dataIndex: 'documentType',
      width: 100,
    },
    {
      title: '证件号码',
      dataIndex: 'documentNo',
      width: 140,
    },
    {
      title: '状态',
      dataIndex: 'isDeleted',
      width: 80,
      render: (_, record) => (
        <Tag color={record.isDeleted ? 'default' : 'success'}>
          {record.isDeleted ? '已删除' : '正常'}
        </Tag>
      ),
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            modal.info({
              title: '银行卡详情',
              width: 500,
              content: (
                <Descriptions column={1} size="small" style={{ marginTop: 16 }}>
                  <Descriptions.Item label="银行名称">{record.bankName}</Descriptions.Item>
                  <Descriptions.Item label="银行编码">{record.bankCode}</Descriptions.Item>
                  <Descriptions.Item label="银行账号">{record.accountNo}</Descriptions.Item>
                  <Descriptions.Item label="持卡人姓名">{record.accountName}</Descriptions.Item>
                  <Descriptions.Item label="手机号">{record.phone}</Descriptions.Item>
                  <Descriptions.Item label="证件类型">{record.documentType}</Descriptions.Item>
                  <Descriptions.Item label="证件号码">{record.documentNo}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={record.isDeleted ? 'default' : 'success'}>
                      {record.isDeleted ? '已删除' : '正常'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="添加时间">
                    <TimeDisplay value={record.createdAt} />
                  </Descriptions.Item>
                </Descriptions>
              ),
              okText: '关闭',
            });
          }}
        >
          查看
        </a>,
        <a
          key="blacklist"
          style={{ color: '#ff4d4f' }}
          onClick={() => {
            modal.confirm({
              title: '拉黑银行卡',
              content: `确定将银行卡 ${record.accountNo} 加入黑名单？拉黑后，该银行卡将无法被任何用户绑定。`,
              okText: '确定拉黑',
              okButtonProps: { danger: true },
              cancelText: '取消',
              onOk: async () => {
                try {
                  await blacklistBankCard(record.accountNo, `后台拉黑 - 用户ID:${userId}`);
                  message.success('银行卡已加入黑名单');
                } catch (error: unknown) {
                  message.error('拉黑失败：' + ((error as Error).message || '未知错误'));
                }
              },
            });
          }}
        >
          拉黑
        </a>,
      ],
    },
  ];

  const renderBankCards = () => (
    <Spin spinning={bankCardsLoading}>
      <ProTable<BankCard>
        columns={bankCardColumns}
        dataSource={bankCards}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        scroll={{ x: 1200 }}
      />
    </Spin>
  );

  // ==================== 持仓订单Tab ====================
  const positionColumns: ProColumns<PositionOrderItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Text style={{ fontFamily: 'monospace' }}>{record.orderNo}</Text>
          <CopyButton text={record.orderNo} />
        </Space>
      ),
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '购买金额',
      dataIndex: 'purchaseAmount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.purchaseAmount} />,
    },
    {
      title: '每日收益',
      dataIndex: 'dailyIncome',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.dailyIncome} />,
    },
    {
      title: '周期天数',
      dataIndex: 'cycleDays',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '已发天数',
      dataIndex: 'paidDays',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '已获收益',
      dataIndex: 'earnedIncome',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.earnedIncome} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      valueType: 'select',
      fieldProps: { options: POSITION_STATUS_OPTIONS },
      render: (_, record) => <PositionStatusBadge status={record.status} />,
    },
    {
      title: '来源',
      dataIndex: 'isGift',
      width: 80,
      valueType: 'select',
      fieldProps: { options: POSITION_ORDER_TYPE_OPTIONS },
      render: (_, record) => (
        <Tag color={record.isGift ? 'purple' : 'blue'}>
          {record.isGift ? '赠送' : '购买'}
        </Tag>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => <TimeDisplay value={record.startAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            router.push(`/positions/${record.id}`);
          }}
        >
          详情
        </a>,
        <a
          key="restore"
          onClick={() => {
            modal.confirm({
              title: '恢复限购',
              content: (
                <div>
                  <p>确定为用户 <Text strong>{user?.phone}</Text> 恢复产品「<Text strong>{record.productName}</Text>」的购买资格吗？</p>
                  <Text type="secondary">每次操作仅恢复1次购买资格</Text>
                </div>
              ),
              okText: '确定恢复',
              cancelText: '取消',
              onOk: async () => {
                try {
                  await restoreUserPurchase(userId, record.productId);
                  message.success('已恢复1次购买资格');
                } catch (error: unknown) {
                  message.error('恢复失败：' + ((error as Error).message || '未知错误'));
                }
              },
            });
          }}
        >
          恢复限购
        </a>,
      ],
    },
  ];

  const renderPositions = () => (
    <ProTable<PositionOrderItem>
      columns={positionColumns}
      actionRef={positionsTableRef}
      rowKey="id"
      request={async (params) => {
        const queryParams: PositionOrderParams = {
          page: params.current,
          pageSize: params.pageSize,
          status: params.status,
          orderType: params.isGift,
        };
        try {
          const data = await fetchUserPositionOrders(userId, queryParams);
          return {
            data: data.list,
            success: true,
            total: data.pagination.total,
          };
        } catch {
          return { data: [], success: false, total: 0 };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      scroll={{ x: 1200 }}
    />
  );

  // ==================== 充值记录Tab ====================
  const rechargeColumns: ProColumns<RechargeOrderItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Text style={{ fontFamily: 'monospace' }}>{record.orderNo}</Text>
          <CopyButton text={record.orderNo} />
        </Space>
      ),
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.amount} />,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.actualAmount ? (
          <AmountDisplay value={record.actualAmount} />
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '支付通道',
      dataIndex: 'channelCode',
      width: 100,
      valueType: 'select',
      fieldProps: {
        options: [
          { value: 'LWPAY', label: 'LWPAY' },
          { value: 'UZPAY', label: 'UZPAY' },
        ],
      },
      render: (_, record) => <Tag>{record.channelName || record.channelCode}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: { options: RECHARGE_STATUS_OPTIONS },
      render: (_, record) => <RechargeStatusBadge status={record.status} />,
    },
    {
      title: '三方单号',
      dataIndex: 'thirdOrderNo',
      width: 150,
      hideInSearch: true,
      render: (_, record) =>
        record.thirdOrderNo || <Text type="secondary">-</Text>,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
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
      title: '回调时间',
      dataIndex: 'callbackAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => <TimeDisplay value={record.callbackAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            router.push(`/recharges/${record.id}`);
          }}
        >
          详情
        </a>,
      ],
    },
  ];

  const renderRecharges = () => (
    <ProTable<RechargeOrderItem>
      columns={rechargeColumns}
      actionRef={rechargesTableRef}
      rowKey="id"
      request={async (params) => {
        const queryParams: RechargeOrderParams = {
          page: params.current,
          pageSize: params.pageSize,
          status: params.status,
          channelCode: params.channelCode,
          startDate: params.startDate,
          endDate: params.endDate,
        };
        try {
          const data = await fetchUserRechargeOrders(userId, queryParams);
          return {
            data: data.list,
            success: true,
            total: data.pagination.total,
          };
        } catch {
          return { data: [], success: false, total: 0 };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      scroll={{ x: 1200 }}
    />
  );

  // ==================== 提现记录Tab ====================
  const withdrawColumns: ProColumns<WithdrawOrderItem>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          <Text style={{ fontFamily: 'monospace' }}>{record.orderNo}</Text>
          <CopyButton text={record.orderNo} />
        </Space>
      ),
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.amount} />,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.fee} />,
    },
    {
      title: '实际到账',
      dataIndex: 'actualAmount',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.actualAmount} />,
    },
    {
      title: '银行',
      dataIndex: 'bankName',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '卡号后4位',
      dataIndex: 'accountNoMask',
      width: 100,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      fieldProps: { options: WITHDRAW_STATUS_OPTIONS },
      render: (_, record) => <WithdrawStatusBadge status={record.status} />,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
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
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="detail"
          onClick={() => {
            router.push(`/withdraws/${record.id}`);
          }}
        >
          详情
        </a>,
      ],
    },
  ];

  const renderWithdraws = () => (
    <ProTable<WithdrawOrderItem>
      columns={withdrawColumns}
      actionRef={withdrawsTableRef}
      rowKey="id"
      request={async (params) => {
        const queryParams: WithdrawOrderParams = {
          page: params.current,
          pageSize: params.pageSize,
          status: params.status,
          startDate: params.startDate,
          endDate: params.endDate,
        };
        try {
          const data = await fetchUserWithdrawOrders(userId, queryParams);
          return {
            data: data.list,
            success: true,
            total: data.pagination.total,
          };
        } catch {
          return { data: [], success: false, total: 0 };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      scroll={{ x: 1000 }}
    />
  );

  // ==================== 资金流水Tab ====================
  const transactionColumns: ProColumns<TransactionItem>[] = [
    {
      title: '流水ID',
      dataIndex: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      valueType: 'select',
      fieldProps: { options: TRANSACTION_TYPE_OPTIONS },
      render: (_, record) => (
        <Tag>{TRANSACTION_TYPE_LABELS[record.type] || record.typeName}</Tag>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        const amount = Number(record.amount);
        const isPositive = amount >= 0;
        return (
          <Text
            style={{
              fontFamily: 'Roboto Mono, monospace',
              color: isPositive ? '#52c41a' : '#ff4d4f',
            }}
          >
            {isPositive ? '+' : ''}{formatCurrency(record.amount)}
          </Text>
        );
      },
    },
    {
      title: '变动后余额',
      dataIndex: 'balanceAfter',
      width: 120,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.balanceAfter} />,
    },
    {
      title: '关联订单号',
      dataIndex: 'relatedOrderNo',
      width: 180,
      hideInSearch: true,
      render: (_, record) =>
        record.relatedOrderNo ? (
          <Space>
            <Text style={{ fontFamily: 'monospace' }}>{record.relatedOrderNo}</Text>
            <CopyButton text={record.relatedOrderNo} />
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) =>
        record.remark || <Text type="secondary">-</Text>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 160,
      valueType: 'dateRange',
      render: (_, record) => <TimeDisplay value={record.createdAt} />,
      search: {
        transform: (value) => ({
          startDate: value?.[0],
          endDate: value?.[1],
        }),
      },
    },
  ];

  const renderTransactions = () => (
    <ProTable<TransactionItem>
      columns={transactionColumns}
      actionRef={transactionsTableRef}
      rowKey="id"
      request={async (params) => {
        const queryParams: TransactionParams = {
          page: params.current,
          pageSize: params.pageSize,
          type: params.type,
          startDate: params.startDate,
          endDate: params.endDate,
        };
        try {
          const data = await fetchUserTransactions(userId, queryParams);
          return {
            data: data.list,
            success: true,
            total: data.pagination.total,
          };
        } catch {
          return { data: [], success: false, total: 0 };
        }
      }}
      search={{
        labelWidth: 'auto',
        defaultCollapsed: true,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
      }}
      scroll={{ x: 1000 }}
    />
  );

  // ==================== 团队成员Tab ====================
  const [teamLevel, setTeamLevel] = useState<1 | 2 | 3 | undefined>(undefined);

  const teamColumns: ProColumns<TeamMemberItem>[] = [
    {
      title: '用户ID',
      dataIndex: 'id',
      width: 80,
      hideInSearch: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
      render: (_, record) => (
        <a onClick={() => navigateToUser(record.id)}>{record.phone}</a>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 100,
      hideInSearch: true,
      render: (_, record) =>
        record.nickname || <Text type="secondary">-</Text>,
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 80,
      hideInSearch: true, // 使用子Tab切换，不在搜索栏显示
      render: (_, record) => {
        const labels = ['', '一级', '二级', '三级'];
        return <Tag>{labels[record.level]}</Tag>;
      },
    },
    {
      title: 'VIP等级',
      dataIndex: 'vipLevel',
      width: 80,
      hideInSearch: true,
      render: (_, record) => <Tag color="blue">VIP{record.vipLevel}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      hideInSearch: true,
      render: (_, record) => <UserStatusBadge status={record.status} />,
    },
    {
      title: '有效邀请',
      dataIndex: 'isValidInvite',
      width: 90,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.isValidInvite ? 'success' : 'default'}>
          {record.isValidInvite ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '贡献返佣',
      dataIndex: 'contributedCommission',
      width: 100,
      hideInSearch: true,
      render: (_, record) => <AmountDisplay value={record.contributedCommission} />,
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      width: 160,
      hideInSearch: true,
      render: (_, record) => <TimeDisplay value={record.registeredAt} />,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <a key="detail" onClick={() => navigateToUser(record.id)}>
          详情
        </a>,
      ],
    },
  ];

  const renderTeam = () => (
    <div>
      {/* 团队统计摘要 */}
      {teamSummary && (
        <div
          style={{
            marginBottom: 16,
            padding: 16,
            background: '#fafafa',
            borderRadius: 8,
          }}
        >
          <Space size={32}>
            <Text>一级 <Text strong>{teamSummary.level1Count}</Text> 人</Text>
            <Text>二级 <Text strong>{teamSummary.level2Count}</Text> 人</Text>
            <Text>三级 <Text strong>{teamSummary.level3Count}</Text> 人</Text>
            <Text>共计 <Text strong>{teamSummary.totalCount}</Text> 人</Text>
            <Text>
              贡献返佣 <AmountDisplay value={teamSummary.totalCommission} />
            </Text>
          </Space>
        </div>
      )}

      {/* 子Tab切换 */}
      <Tabs
        activeKey={teamLevel === undefined ? 'all' : String(teamLevel)}
        onChange={(key) => {
          if (key === 'all') {
            setTeamLevel(undefined);
          } else {
            setTeamLevel(Number(key) as 1 | 2 | 3);
          }
          teamTableRef.current?.reload();
        }}
        items={[
          { key: 'all', label: `全部${teamSummary ? `(${teamSummary.totalCount})` : ''}` },
          { key: '1', label: `一级${teamSummary ? `(${teamSummary.level1Count})` : ''}` },
          { key: '2', label: `二级${teamSummary ? `(${teamSummary.level2Count})` : ''}` },
          { key: '3', label: `三级${teamSummary ? `(${teamSummary.level3Count})` : ''}` },
        ]}
        style={{ marginBottom: 16 }}
      />

      <ProTable<TeamMemberItem>
        columns={teamColumns}
        actionRef={teamTableRef}
        rowKey="id"
        params={{ teamLevel }}
        request={async (params) => {
          const queryParams: TeamMemberParams = {
            page: params.current,
            pageSize: params.pageSize,
            level: teamLevel,
            keyword: params.phone,
          };
          try {
            const data = await fetchUserTeam(userId, queryParams);
            setTeamSummary(data.summary);
            return {
              data: data.list,
              success: true,
              total: data.pagination.total,
            };
          } catch {
            return { data: [], success: false, total: 0 };
          }
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
        scroll={{ x: 1000 }}
      />
    </div>
  );

  // Tab配置
  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: renderBasicInfo(),
    },
    {
      key: 'bankCards',
      label: '银行卡',
      children: tabLoadedMap.bankCards ? renderBankCards() : <Spin />,
    },
    {
      key: 'positions',
      label: '持仓订单',
      children: tabLoadedMap.positions ? renderPositions() : <Spin />,
    },
    {
      key: 'recharges',
      label: '充值记录',
      children: tabLoadedMap.recharges ? renderRecharges() : <Spin />,
    },
    {
      key: 'withdraws',
      label: '提现记录',
      children: tabLoadedMap.withdraws ? renderWithdraws() : <Spin />,
    },
    {
      key: 'transactions',
      label: '资金流水',
      children: tabLoadedMap.transactions ? renderTransactions() : <Spin />,
    },
    {
      key: 'team',
      label: '团队成员',
      children: tabLoadedMap.team ? renderTeam() : <Spin />,
    },
  ];

  return (
    <div className="user-detail-page">
      {/* 面包屑导航 */}
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            href: '/',
            title: (
              <Space>
                <RiHome4Line size={14} />
                <span>首页</span>
              </Space>
            ),
          },
          {
            href: '/users/list',
            title: (
              <Space>
                <RiUserLine size={14} />
                <span>用户管理</span>
              </Space>
            ),
          },
          {
            title: (
              <Space>
                <RiListUnordered size={14} />
                <span>用户详情</span>
              </Space>
            ),
          },
        ]}
      />

      {/* 页面头部 */}
      <UserDetailHeader
        user={user}
        loading={loading}
        onAdjustBalance={() => setBalanceModalOpen(true)}
        onGiftProduct={() => setGiftModalOpen(true)}
        onRestorePurchase={() => setRestoreModalOpen(true)}
        onUpdateLevel={() => setLevelModalOpen(true)}
        onBanUnban={() => setBanModalOpen(true)}
        onResetPassword={handleResetPassword}
        onBlacklistPhone={handleBlacklistPhone}
        onBlacklistIP={handleBlacklistIP}
        onViewUpline={() => setUplineModalOpen(true)}
      />

      {/* Tab内容 */}
      <Card style={{ marginTop: 16 }}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
      </Card>

      {/* 弹窗 */}
      <BalanceModal
        open={balanceModalOpen}
        user={user as any}
        onClose={() => setBalanceModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
      <GiftProductModal
        open={giftModalOpen}
        user={user as any}
        onClose={() => setGiftModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
      <BanModal
        open={banModalOpen}
        user={user as any}
        action={user?.status === 'ACTIVE' ? 'ban' : 'unban'}
        onClose={() => setBanModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
      <RestorePurchaseModal
        open={restoreModalOpen}
        user={user}
        onClose={() => setRestoreModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
      <LevelModal
        open={levelModalOpen}
        user={user}
        onClose={() => setLevelModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
      <UplineModal
        open={uplineModalOpen}
        user={user}
        onClose={() => setUplineModalOpen(false)}
      />
      <BlacklistModal
        open={blacklistModalOpen}
        user={user as any}
        type={blacklistType}
        onClose={() => setBlacklistModalOpen(false)}
        onSuccess={handleOperationSuccess}
      />
    </div>
  );
}
