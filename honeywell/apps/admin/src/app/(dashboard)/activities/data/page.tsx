/**
 * @file 活动数据明细页
 * @description 显示签到记录、拉新邀请记录、拉新奖励领取记录、连单奖励领取记录
 * @depends 开发文档/开发文档.md 第13.22节 - 活动数据详情
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第8节
 */

'use client';

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  Tabs,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Button,
  Tag,
  Typography,
  Row,
  Col,
  App,
  Badge,
  Tooltip,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiSearchLine,
  RiRefreshLine,
  RiGiftLine,
  RiUserAddLine,
  RiAwardFill,
  RiVipCrownFill,
  RiCalendarCheckLine,
  RiFileList3Line,
  RiShoppingBag3Line,
} from '@remixicon/react';
import dayjs from 'dayjs';

import {
  fetchNormalSignInRecords,
  fetchSvipSignInRecords,
  fetchValidInvitations,
  fetchInviteRewardClaims,
  fetchCollectionClaims,
  type NormalSignInRecord,
  type SvipSignInRecord,
  type ValidInvitationRecord,
  type InviteRewardClaimRecord,
  type CollectionClaimRecord,
  type NormalSignInParams,
  type SvipSignInParams,
  type ValidInvitationParams,
  type InviteRewardClaimParams,
  type CollectionClaimParams,
} from '@/services/activities';
import { AmountDisplay, TimeDisplay } from '@/components/common';
import { StatisticCard, StatisticCardGroup } from '@/components/common/StatisticCard';
import { QuickFilters } from '@/components/tables';
import { ExportButton } from '@/components/reports';
import { UserInfoCard, UserBrief } from '@/components/business';
import { exportToExcel } from '@/utils/export';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * 签到类型选项（Tab1内部切换）
 */
type SignInType = 'normal' | 'svip';

/**
 * SVIP等级颜色配置
 */
const SVIP_COLORS: Record<number, string> = {
  1: '#1677ff',
  2: '#722ed1',
  3: '#eb2f96',
  4: '#fa8c16',
  5: '#faad14',
  6: '#52c41a',
  7: '#13c2c2',
  8: '#f5222d',
};

/**
 * 拉新奖励档位配置
 */
const INVITE_REWARD_TIERS: Record<number, { label: string; amount: number }> = {
  1: { label: '1人', amount: 10 },
  10: { label: '10人', amount: 58 },
  30: { label: '30人', amount: 198 },
  60: { label: '60人', amount: 498 },
  100: { label: '100人', amount: 998 },
};

/**
 * 连单奖励档位配置
 */
const COLLECTION_REWARD_TIERS: Record<number, { label: string; products: string[] }> = {
  1: { label: 'VIP1+2', products: ['VIP1', 'VIP2'] },
  2: { label: 'VIP1+2+3', products: ['VIP1', 'VIP2', 'VIP3'] },
  3: { label: 'VIP1+2+3+4', products: ['VIP1', 'VIP2', 'VIP3', 'VIP4'] },
  4: { label: 'VIP1+2+3+4+5', products: ['VIP1', 'VIP2', 'VIP3', 'VIP4', 'VIP5'] },
};

/**
 * 活动数据明细页
 */
export default function ActivityDataPage() {
  const { message } = App.useApp();
  
  // Tab状态
  const [activeTab, setActiveTab] = useState<string>('signin');
  
  // 签到类型子Tab
  const [signInType, setSignInType] = useState<SignInType>('normal');
  
  // 表格引用
  const normalSignInRef = useRef<ActionType>(null);
  const svipSignInRef = useRef<ActionType>(null);
  const validInvitationRef = useRef<ActionType>(null);
  const inviteRewardRef = useRef<ActionType>(null);
  const collectionRef = useRef<ActionType>(null);
  
  // 统计数据
  const [signInSummary, setSignInSummary] = useState({ totalCount: 0, totalAmount: '0' });
  const [invitationSummary, setInvitationSummary] = useState({ totalCount: 0, rechargePurchaseCount: 0, completeSigninCount: 0 });
  const [inviteRewardSummary, setInviteRewardSummary] = useState({ totalCount: 0, totalAmount: '0' });
  const [collectionSummary, setCollectionSummary] = useState({ totalCount: 0, totalAmount: '0' });
  
  // 导出loading
  const [exporting, setExporting] = useState(false);

  // ==================== Tab1: 签到记录 ====================

  /**
   * 普通签到记录表格列
   */
  const normalSignInColumns: ProColumns<NormalSignInRecord>[] = useMemo(() => [
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.userId}
          phone={record.userPhone}
          nickname={record.userNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ userPhone: value }),
      },
      fieldProps: {
        placeholder: '用户ID/手机号',
      },
    },
    {
      title: '签到类型',
      dataIndex: 'signType',
      width: 100,
      hideInSearch: true,
      render: () => (
        <Tag color="default">普通签到</Tag>
      ),
    },
    {
      title: '签到日期',
      dataIndex: 'signDate',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.signDate} format="date" />
      ),
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight />
      ),
    },
    {
      title: '签到时间',
      dataIndex: 'createdAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.createdAt} />
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            startDate: dayjs(value[0]).format('YYYY-MM-DD'),
            endDate: dayjs(value[1]).format('YYYY-MM-DD'),
          };
        },
      },
    },
  ], []);

  /**
   * SVIP签到记录表格列
   */
  const svipSignInColumns: ProColumns<SvipSignInRecord>[] = useMemo(() => [
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.userId}
          phone={record.userPhone}
          nickname={record.userNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ userPhone: value }),
      },
      fieldProps: {
        placeholder: '用户ID/手机号',
      },
    },
    {
      title: '签到类型',
      dataIndex: 'signType',
      width: 100,
      hideInSearch: true,
      render: () => (
        <Tag color="blue" icon={<RiVipCrownFill size={12} />}>SVIP签到</Tag>
      ),
    },
    {
      title: 'SVIP等级',
      dataIndex: 'svipLevel',
      width: 120,
      valueType: 'select',
      valueEnum: {
        1: { text: 'SVIP1' },
        2: { text: 'SVIP2' },
        3: { text: 'SVIP3' },
        4: { text: 'SVIP4' },
        5: { text: 'SVIP5' },
        6: { text: 'SVIP6' },
        7: { text: 'SVIP7' },
        8: { text: 'SVIP8' },
      },
      fieldProps: {
        mode: 'multiple', // 文档要求：多选 SVIP1-8
        placeholder: '选择SVIP等级',
      },
      render: (_, record) => (
        <Tag
          icon={<RiVipCrownFill size={12} />}
          color={SVIP_COLORS[record.svipLevel] || '#8c8c8c'}
          style={{ border: 'none' }}
        >
          SVIP{record.svipLevel}
        </Tag>
      ),
    },
    {
      title: '签到日期',
      dataIndex: 'signDate',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.signDate} format="date" />
      ),
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight />
      ),
    },
    {
      title: '签到时间',
      dataIndex: 'createdAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.createdAt} />
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            startDate: dayjs(value[0]).format('YYYY-MM-DD'),
            endDate: dayjs(value[1]).format('YYYY-MM-DD'),
          };
        },
      },
    },
  ], []);

  // ==================== Tab2: 拉新有效邀请记录 ====================

  /**
   * 有效邀请记录表格列
   */
  const validInvitationColumns: ProColumns<ValidInvitationRecord>[] = useMemo(() => [
    {
      title: '邀请人',
      dataIndex: 'inviterId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.inviterId}
          phone={record.inviterPhone}
          nickname={record.inviterNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ inviterPhone: value }),
      },
      fieldProps: {
        placeholder: '邀请人ID/手机号',
      },
    },
    {
      title: '被邀请人',
      dataIndex: 'inviteeId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.inviteeId}
          phone={record.inviteePhone}
          nickname={record.inviteeNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ inviteePhone: value }),
      },
      fieldProps: {
        placeholder: '被邀请人ID/手机号',
      },
    },
    {
      title: '注册时间',
      dataIndex: 'inviteeRegisteredAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.inviteeRegisteredAt} />
      ),
    },
    {
      title: '有效类型',
      dataIndex: 'validType',
      width: 120,
      valueType: 'select',
      valueEnum: {
        RECHARGE_PURCHASE: { text: '充值购买', status: 'Success' },
        COMPLETE_SIGNIN: { text: '完成签到', status: 'Processing' },
      },
      fieldProps: {
        mode: 'multiple', // 文档要求：多选
        placeholder: '选择有效类型',
      },
      render: (_, record) => (
        <Tag color={record.validType === 'RECHARGE_PURCHASE' ? 'green' : 'blue'}>
          {record.validType === 'RECHARGE_PURCHASE' ? '充值购买' : '完成签到'}
        </Tag>
      ),
    },
    {
      title: '生效时间',
      dataIndex: 'validAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.validAt} />
      ),
    },
    {
      title: '是否已领奖',
      dataIndex: 'isRewardClaimed',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.isRewardClaimed ? 'success' : 'default'}>
          {record.isRewardClaimed ? '已领取' : '未领取'}
        </Tag>
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            startDate: dayjs(value[0]).format('YYYY-MM-DD'),
            endDate: dayjs(value[1]).format('YYYY-MM-DD'),
          };
        },
      },
    },
  ], []);

  // ==================== Tab3: 拉新奖励领取记录 ====================

  /**
   * 拉新奖励领取记录表格列
   */
  const inviteRewardColumns: ProColumns<InviteRewardClaimRecord>[] = useMemo(() => [
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.userId}
          phone={record.userPhone}
          nickname={record.userNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ userPhone: value }),
      },
      fieldProps: {
        placeholder: '用户ID/手机号',
      },
    },
    {
      title: '达成档位',
      dataIndex: 'rewardLevel',
      width: 120,
      valueType: 'select',
      valueEnum: {
        1: { text: '1人' },
        10: { text: '10人' },
        30: { text: '30人' },
        60: { text: '60人' },
        100: { text: '100人' },
      },
      render: (_, record) => {
        const tier = INVITE_REWARD_TIERS[record.rewardLevel];
        return (
          <Tag color="blue">
            {tier?.label || `${record.rewardLevel}人`}
          </Tag>
        );
      },
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight />
      ),
    },
    {
      title: '当时有效邀请数',
      dataIndex: 'validInviteCountAtClaim',
      width: 140,
      hideInSearch: true,
      render: (_, record) => (
        <Text strong style={{ color: '#1677ff' }}>
          {record.validInviteCountAtClaim} 人
        </Text>
      ),
    },
    {
      title: '领取时间',
      dataIndex: 'createdAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.createdAt} />
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            startDate: dayjs(value[0]).format('YYYY-MM-DD'),
            endDate: dayjs(value[1]).format('YYYY-MM-DD'),
          };
        },
      },
    },
  ], []);

  // ==================== Tab4: 连单奖励领取记录 ====================

  /**
   * 连单奖励领取记录表格列
   */
  const collectionColumns: ProColumns<CollectionClaimRecord>[] = useMemo(() => [
    {
      title: '用户信息',
      dataIndex: 'userId',
      width: 200,
      render: (_, record) => (
        <UserInfoCard
          userId={record.userId}
          phone={record.userPhone}
          nickname={record.userNickname}
          showStatus={false}
          showVip={false}
          size="small"
        />
      ),
      search: {
        transform: (value) => ({ userPhone: value }),
      },
      fieldProps: {
        placeholder: '用户ID/手机号',
      },
    },
    {
      title: '奖励档位',
      dataIndex: 'rewardLevel',
      width: 140,
      hideInSearch: true,
      render: (_, record) => {
        const tier = COLLECTION_REWARD_TIERS[record.rewardLevel];
        return (
          <Tag color="purple">
            {tier?.label || record.requiredProducts.join('+')}
          </Tag>
        );
      },
    },
    {
      title: '购买产品组合',
      dataIndex: 'purchasedProductsAtClaim',
      width: 200,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={4} wrap>
          {record.purchasedProductsAtClaim.map((product) => (
            <Tag key={product} color="blue">{product}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '奖励金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <AmountDisplay value={record.amount} highlight />
      ),
    },
    {
      title: '领取时间',
      dataIndex: 'createdAt',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <TimeDisplay value={record.createdAt} />
      ),
    },
    {
      title: '时间范围',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => {
          if (!value) return {};
          return {
            startDate: dayjs(value[0]).format('YYYY-MM-DD'),
            endDate: dayjs(value[1]).format('YYYY-MM-DD'),
          };
        },
      },
    },
  ], []);

  // ==================== 导出功能 ====================

  /**
   * 导出签到记录
   */
  const handleExportSignIn = useCallback(async () => {
    setExporting(true);
    try {
      const actionRef = signInType === 'normal' ? normalSignInRef : svipSignInRef;
      const fetchFn = signInType === 'normal' ? fetchNormalSignInRecords : fetchSvipSignInRecords;
      
      // 获取全部数据
      const res = await fetchFn({ page: 1, pageSize: 10000 });
      
      if (signInType === 'normal') {
        const data = res.list as NormalSignInRecord[];
        exportToExcel(
          data.map((item) => ({
            '用户ID': item.userId,
            '手机号': item.userPhone,
            '昵称': item.userNickname,
            '签到类型': '普通签到',
            '签到日期': item.signDate,
            '奖励金额': item.amount,
            '签到时间': item.createdAt,
          })),
          '普通签到记录'
        );
      } else {
        const data = res.list as SvipSignInRecord[];
        exportToExcel(
          data.map((item) => ({
            '用户ID': item.userId,
            '手机号': item.userPhone,
            '昵称': item.userNickname,
            '签到类型': 'SVIP签到',
            'SVIP等级': `SVIP${item.svipLevel}`,
            '签到日期': item.signDate,
            '奖励金额': item.amount,
            '签到时间': item.createdAt,
          })),
          'SVIP签到记录'
        );
      }
      
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [signInType, message]);

  /**
   * 导出有效邀请记录
   */
  const handleExportInvitation = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetchValidInvitations({ page: 1, pageSize: 10000 });
      exportToExcel(
        res.list.map((item) => ({
          '邀请人ID': item.inviterId,
          '邀请人手机号': item.inviterPhone,
          '邀请人昵称': item.inviterNickname,
          '被邀请人ID': item.inviteeId,
          '被邀请人手机号': item.inviteePhone,
          '被邀请人昵称': item.inviteeNickname,
          '注册时间': item.inviteeRegisteredAt,
          '有效类型': item.validType === 'RECHARGE_PURCHASE' ? '充值购买' : '完成签到',
          '生效时间': item.validAt,
          '是否已领奖': item.isRewardClaimed ? '是' : '否',
        })),
        '拉新有效邀请记录'
      );
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [message]);

  /**
   * 导出拉新奖励领取记录
   */
  const handleExportInviteReward = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetchInviteRewardClaims({ page: 1, pageSize: 10000 });
      exportToExcel(
        res.list.map((item) => ({
          '用户ID': item.userId,
          '手机号': item.userPhone,
          '昵称': item.userNickname,
          '达成档位': `${item.rewardLevel}人`,
          '奖励金额': item.amount,
          '当时有效邀请数': item.validInviteCountAtClaim,
          '领取时间': item.createdAt,
        })),
        '拉新奖励领取记录'
      );
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [message]);

  /**
   * 导出连单奖励领取记录
   */
  const handleExportCollection = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetchCollectionClaims({ page: 1, pageSize: 10000 });
      exportToExcel(
        res.list.map((item) => ({
          '用户ID': item.userId,
          '手机号': item.userPhone,
          '昵称': item.userNickname,
          '奖励档位': item.requiredProducts.join('+'),
          '购买产品组合': item.purchasedProductsAtClaim.join(', '),
          '奖励金额': item.amount,
          '领取时间': item.createdAt,
        })),
        '连单奖励领取记录'
      );
      message.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  }, [message]);

  // ==================== Tab 内容渲染 ====================

  /**
   * Tab1: 签到记录
   */
  const renderSignInTab = () => (
    <div>
      {/* 汇总统计卡片 */}
      <StatisticCardGroup columns={4} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="总签到人次"
          value={signInSummary.totalCount}
          prefix={<RiCalendarCheckLine size={20} />}
        />
        <StatisticCard
          title="总发放金额"
          value={signInSummary.totalAmount}
          isCurrency
          prefix={<RiGiftLine size={20} />}
        />
      </StatisticCardGroup>

      {/* 签到类型切换 */}
      <QuickFilters
        options={[
          { value: 'normal', label: '普通签到' },
          { value: 'svip', label: 'SVIP签到' },
        ]}
        value={signInType}
        onChange={(v) => setSignInType(v as SignInType)}
        style={{ marginBottom: 16 }}
      />

      {/* 普通签到表格 */}
      {signInType === 'normal' && (
        <ProTable<NormalSignInRecord>
          actionRef={normalSignInRef}
          columns={normalSignInColumns}
          rowKey="id"
          search={{
            labelWidth: 'auto',
            span: 6,
            defaultCollapsed: false,
          }}
          options={{
            density: false,
            fullScreen: false,
            reload: true,
            setting: true,
          }}
          toolbar={{
            actions: [
              <ExportButton
                key="export"
                onExportExcel={handleExportSignIn}
                excelOnly
                disabled={exporting}
              />,
            ],
          }}
          request={async (params) => {
            const { current, pageSize, ...rest } = params;
            try {
              const res = await fetchNormalSignInRecords({
                page: current || 1,
                pageSize: pageSize || 20,
                ...rest,
              });
              
              // 更新统计数据
              if (res.summary) {
                setSignInSummary({
                  totalCount: res.summary.totalCount,
                  totalAmount: res.summary.totalAmount,
                });
              }
              
              return {
                data: res.list,
                success: true,
                total: res.pagination.total,
              };
            } catch (error) {
              console.error('获取普通签到记录失败:', error);
              return { data: [], success: false, total: 0 };
            }
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
        />
      )}

      {/* SVIP签到表格 */}
      {signInType === 'svip' && (
        <ProTable<SvipSignInRecord>
          actionRef={svipSignInRef}
          columns={svipSignInColumns}
          rowKey="id"
          search={{
            labelWidth: 'auto',
            span: 6,
            defaultCollapsed: false,
          }}
          options={{
            density: false,
            fullScreen: false,
            reload: true,
            setting: true,
          }}
          toolbar={{
            actions: [
              <ExportButton
                key="export"
                onExportExcel={handleExportSignIn}
                excelOnly
                disabled={exporting}
              />,
            ],
          }}
          request={async (params) => {
            const { current, pageSize, ...rest } = params;
            try {
              const res = await fetchSvipSignInRecords({
                page: current || 1,
                pageSize: pageSize || 20,
                ...rest,
              });
              
              // 更新统计数据
              if (res.summary) {
                setSignInSummary({
                  totalCount: res.summary.totalCount,
                  totalAmount: res.summary.totalAmount,
                });
              }
              
              return {
                data: res.list,
                success: true,
                total: res.pagination.total,
              };
            } catch (error) {
              console.error('获取SVIP签到记录失败:', error);
              return { data: [], success: false, total: 0 };
            }
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: [10, 20, 50, 100],
          }}
        />
      )}
    </div>
  );

  /**
   * Tab2: 拉新有效邀请记录
   */
  const renderValidInvitationTab = () => (
    <div>
      {/* 汇总统计卡片 */}
      <StatisticCardGroup columns={4} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="总有效邀请数"
          value={invitationSummary.totalCount}
          prefix={<RiUserAddLine size={20} />}
        />
        <StatisticCard
          title="充值购买"
          value={invitationSummary.rechargePurchaseCount}
          suffix="人"
          prefix={<RiShoppingBag3Line size={20} />}
          tooltip="通过充值购买成为有效邀请"
        />
        <StatisticCard
          title="完成签到"
          value={invitationSummary.completeSigninCount}
          suffix="人"
          prefix={<RiCalendarCheckLine size={20} />}
          tooltip="通过完成签到成为有效邀请"
        />
      </StatisticCardGroup>

      {/* 表格 */}
      <ProTable<ValidInvitationRecord>
        actionRef={validInvitationRef}
        columns={validInvitationColumns}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: 6,
          defaultCollapsed: false,
        }}
        options={{
          density: false,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        toolbar={{
          actions: [
            <ExportButton
              key="export"
              onExportExcel={handleExportInvitation}
              excelOnly
              disabled={exporting}
            />,
          ],
        }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          try {
            const res = await fetchValidInvitations({
              page: current || 1,
              pageSize: pageSize || 20,
              ...rest,
            });
            
            // 更新统计数据
            if (res.summary) {
              setInvitationSummary({
                totalCount: res.summary.totalCount,
                rechargePurchaseCount: res.summary.rechargePurchaseCount,
                completeSigninCount: res.summary.completeSigninCount,
              });
            }
            
            return {
              data: res.list,
              success: true,
              total: res.pagination.total,
            };
          } catch (error) {
            console.error('获取有效邀请记录失败:', error);
            return { data: [], success: false, total: 0 };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  );

  /**
   * Tab3: 拉新奖励领取记录
   */
  const renderInviteRewardTab = () => (
    <div>
      {/* 汇总统计卡片 */}
      <StatisticCardGroup columns={4} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="总领取人数"
          value={inviteRewardSummary.totalCount}
          prefix={<RiAwardFill size={20} />}
        />
        <StatisticCard
          title="总发放金额"
          value={inviteRewardSummary.totalAmount}
          isCurrency
          prefix={<RiGiftLine size={20} />}
        />
      </StatisticCardGroup>

      {/* 表格 */}
      <ProTable<InviteRewardClaimRecord>
        actionRef={inviteRewardRef}
        columns={inviteRewardColumns}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: 6,
          defaultCollapsed: false,
        }}
        options={{
          density: false,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        toolbar={{
          actions: [
            <ExportButton
              key="export"
              onExportExcel={handleExportInviteReward}
              excelOnly
              disabled={exporting}
            />,
          ],
        }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          try {
            const res = await fetchInviteRewardClaims({
              page: current || 1,
              pageSize: pageSize || 20,
              ...rest,
            });
            
            // 更新统计数据
            if (res.summary) {
              setInviteRewardSummary({
                totalCount: res.summary.totalCount,
                totalAmount: res.summary.totalAmount,
              });
            }
            
            return {
              data: res.list,
              success: true,
              total: res.pagination.total,
            };
          } catch (error) {
            console.error('获取拉新奖励领取记录失败:', error);
            return { data: [], success: false, total: 0 };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  );

  /**
   * Tab4: 连单奖励领取记录
   */
  const renderCollectionTab = () => (
    <div>
      {/* 汇总统计卡片 */}
      <StatisticCardGroup columns={4} gap={16} style={{ marginBottom: 16 }}>
        <StatisticCard
          title="总领取人数"
          value={collectionSummary.totalCount}
          prefix={<RiFileList3Line size={20} />}
        />
        <StatisticCard
          title="总发放金额"
          value={collectionSummary.totalAmount}
          isCurrency
          prefix={<RiGiftLine size={20} />}
        />
      </StatisticCardGroup>

      {/* 表格 */}
      <ProTable<CollectionClaimRecord>
        actionRef={collectionRef}
        columns={collectionColumns}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          span: 6,
          defaultCollapsed: false,
        }}
        options={{
          density: false,
          fullScreen: false,
          reload: true,
          setting: true,
        }}
        toolbar={{
          actions: [
            <ExportButton
              key="export"
              onExportExcel={handleExportCollection}
              excelOnly
              disabled={exporting}
            />,
          ],
        }}
        request={async (params) => {
          const { current, pageSize, ...rest } = params;
          try {
            const res = await fetchCollectionClaims({
              page: current || 1,
              pageSize: pageSize || 20,
              ...rest,
            });
            
            // 更新统计数据
            if (res.summary) {
              setCollectionSummary({
                totalCount: res.summary.totalCount,
                totalAmount: res.summary.totalAmount,
              });
            }
            
            return {
              data: res.list,
              success: true,
              total: res.pagination.total,
            };
          } catch (error) {
            console.error('获取连单奖励领取记录失败:', error);
            return { data: [], success: false, total: 0 };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  );

  // ==================== 页面渲染 ====================

  const tabItems = useMemo(() => [
    {
      key: 'signin',
      label: (
        <span>
          <RiCalendarCheckLine size={16} style={{ marginRight: 8 }} />
          签到记录
        </span>
      ),
      children: renderSignInTab(),
    },
    {
      key: 'invitation',
      label: (
        <span>
          <RiUserAddLine size={16} style={{ marginRight: 8 }} />
          拉新有效邀请记录
        </span>
      ),
      children: renderValidInvitationTab(),
    },
    {
      key: 'inviteReward',
      label: (
        <span>
          <RiAwardFill size={16} style={{ marginRight: 8 }} />
          拉新奖励领取记录
        </span>
      ),
      children: renderInviteRewardTab(),
    },
    {
      key: 'collection',
      label: (
        <span>
          <RiShoppingBag3Line size={16} style={{ marginRight: 8 }} />
          连单奖励领取记录
        </span>
      ),
      children: renderCollectionTab(),
    },
  ], [
    signInType,
    signInSummary,
    invitationSummary,
    inviteRewardSummary,
    collectionSummary,
    exporting,
  ]);

  return (
    <div className="activity-data-page">
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>活动数据明细</Title>
        <Text type="secondary">查看各活动的数据明细和统计信息</Text>
      </div>

      {/* Tab切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
        size="large"
        style={{
          background: '#fff',
          padding: '20px 24px',
          borderRadius: 12,
        }}
      />
    </div>
  );
}
