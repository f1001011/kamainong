/**
 * @file 团队关系查询页
 * @description 后台管理系统团队关系查询页面，支持搜索用户、查看上下级关系、团队统计
 * @depends 开发文档/开发文档.md 第13.15节 - 团队关系管理
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20节
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Empty,
  Spin,
  Tag,
  Select,
  DatePicker,
  App,
  Tooltip,
  Divider,
} from 'antd';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import {
  RiSearchLine,
  RiTeamLine,
  RiUserLine,
  RiArrowRightLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiUserStarLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
} from '@remixicon/react';
import { Pie } from '@ant-design/charts';

import { UserInfoCard } from '@/components/business/UserInfoCard';
import { UserStatusBadge } from '@/components/common/StatusBadge';
import { AmountDisplay } from '@/components/common/AmountDisplay';
import { TimeDisplay } from '@/components/common/TimeDisplay';
import { QuickFilters } from '@/components/tables/QuickFilters';
import { ExportButton } from '@/components/reports/ExportButton';
import { StatisticCard, StatisticCardGroup } from '@/components/common/StatisticCard';

import {
  queryTeamRelation,
  getUplineChain,
  getDownlineMembers,
  getTeamStats,
  exportDownlineMembers,
} from '@/services/team';

import type {
  TeamQueryResult,
  TeamMemberInfo,
  UplineChainNode,
  DownlineMemberItem,
  DownlineListParams,
  TeamStatsResult,
} from '@/types/team';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

/**
 * 层级颜色配置
 */
const LEVEL_COLORS = {
  1: { bg: '#e6f4ff', border: '#91caff', text: '#1677ff', label: '一级' },
  2: { bg: '#f6ffed', border: '#b7eb8f', text: '#52c41a', label: '二级' },
  3: { bg: '#fff7e6', border: '#ffd591', text: '#fa8c16', label: '三级' },
};

/**
 * 上级链路节点组件
 * @description 文档要求：三级上级 → 二级上级 → 一级上级 → 当前用户
 * 每个节点显示：用户ID、手机号、VIP等级、状态（可点击跳转详情）
 */
function UplineNode({
  node,
  onSwitchUser,
  onViewDetail,
  isFirst = false,
}: {
  node: UplineChainNode;
  onSwitchUser?: (userId: number) => void;
  onViewDetail?: (userId: number) => void;
  isFirst?: boolean;
}) {
  const levelConfig = LEVEL_COLORS[node.level];

  if (!node.user) {
    return null; // 无上级时不显示该节点
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {!isFirst && (
        <RiArrowRightLine
          size={20}
          style={{ margin: '0 12px', color: '#8c8c8c' }}
        />
      )}
      <Card
        size="small"
        style={{
          minWidth: 200,
          background: levelConfig.bg,
          borderColor: levelConfig.border,
          borderRadius: 8,
        }}
        styles={{
          body: { padding: '12px 16px' },
        }}
      >
        <Tag
          color={levelConfig.text}
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            fontSize: 11,
          }}
        >
          {levelConfig.label}上级
        </Tag>
        <UserInfoCard
          userId={node.user.id}
          phone={node.user.phone}
          nickname={node.user.nickname}
          avatarUrl={node.user.avatarUrl}
          vipLevel={node.user.vipLevel}
          status={node.user.status}
          clickable={false}
          size="small"
        />
        {/* 操作按钮 */}
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', fontSize: 12 }}
            onClick={() => onViewDetail?.(node.user!.id)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            style={{ padding: 0, height: 'auto', fontSize: 12 }}
            onClick={() => onSwitchUser?.(node.user!.id)}
          >
            查团队
          </Button>
        </div>
      </Card>
    </div>
  );
}

/**
 * 当前用户节点组件
 * @description 显示在上级链路的最右端
 */
function CurrentUserNode({
  user,
  isTopLevel,
  hasUpline,
}: {
  user: TeamMemberInfo;
  isTopLevel: boolean;
  hasUpline: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {/* 有上级时显示箭头 */}
      {hasUpline && (
        <RiArrowRightLine
          size={20}
          style={{ margin: '0 12px', color: '#8c8c8c' }}
        />
      )}
      <Card
        size="small"
        style={{
          minWidth: 220,
          background: 'linear-gradient(135deg, #fff7e6 0%, #fff 100%)',
          borderColor: '#ffd591',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(250, 140, 22, 0.15)',
        }}
        styles={{
          body: { padding: '16px' },
        }}
      >
        <Tag
          color="#fa8c16"
          style={{
            position: 'absolute',
            top: -10,
            left: 12,
            fontSize: 11,
          }}
        >
          当前用户
        </Tag>
        <UserInfoCard
          userId={user.id}
          phone={user.phone}
          nickname={user.nickname}
          avatarUrl={user.avatarUrl}
          vipLevel={user.vipLevel}
          status={user.status}
          clickable={false}
        />
        {isTopLevel && (
          <div style={{ marginTop: 8 }}>
            <Tag color="default">顶级用户，无邀请人</Tag>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * 团队关系查询页面
 */
export default function TeamQueryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();

  // URL参数中的用户ID
  const urlUserId = searchParams.get('userId');

  // 搜索状态
  const [searchType, setSearchType] = useState<'userId' | 'phone' | 'inviteCode'>('userId');
  const [searchValue, setSearchValue] = useState(urlUserId || '');
  const [searching, setSearching] = useState(false);

  // 查询结果
  const [queryResult, setQueryResult] = useState<TeamQueryResult | null>(null);
  const [uplineChain, setUplineChain] = useState<UplineChainNode[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStatsResult | null>(null);

  // 下级列表筛选
  const [currentLevel, setCurrentLevel] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [validInviteFilter, setValidInviteFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 层级Tab选项（带数量）
  const levelOptions = [
    { value: '', label: '全部', count: queryResult?.downlineSummary.totalCount || 0 },
    { value: '1', label: '一级下级', count: queryResult?.downlineSummary.level1Count || 0 },
    { value: '2', label: '二级下级', count: queryResult?.downlineSummary.level2Count || 0 },
    { value: '3', label: '三级下级', count: queryResult?.downlineSummary.level3Count || 0 },
  ];

  /**
   * 执行团队关系查询
   */
  const handleSearch = useCallback(async () => {
    if (!searchValue.trim()) {
      message.warning('请输入查询条件');
      return;
    }

    setSearching(true);
    try {
      // 构建查询参数
      const params: Record<string, string | number> = {};
      if (searchType === 'userId') {
        params.userId = parseInt(searchValue, 10);
      } else if (searchType === 'phone') {
        params.phone = searchValue;
      } else {
        params.inviteCode = searchValue;
      }

      // 查询团队关系
      const result = await queryTeamRelation(params);
      setQueryResult(result);

      // 查询上级链路
      const upline = await getUplineChain(result.user.id);
      setUplineChain(upline.chain);

      // 查询团队统计
      const stats = await getTeamStats(result.user.id);
      setTeamStats(stats);

      // 重置筛选并刷新列表
      setCurrentLevel('');
      setStatusFilter('');
      setValidInviteFilter('');
      setDateRange(null);
      actionRef.current?.reload();
    } catch (error) {
      // 错误已在 request 中处理
      setQueryResult(null);
      setUplineChain([]);
      setTeamStats(null);
    } finally {
      setSearching(false);
    }
  }, [searchType, searchValue, message]);

  /**
   * 切换查询目标
   */
  const handleSwitchUser = useCallback(
    (userId: number) => {
      setSearchType('userId');
      setSearchValue(String(userId));
      // 更新URL
      router.push(`/team/query?userId=${userId}`);
    },
    [router]
  );

  /**
   * URL参数变化时自动查询
   * @description 当 URL 中有 userId 参数时，自动触发查询
   */
  useEffect(() => {
    if (urlUserId && urlUserId !== searchValue) {
      setSearchType('userId');
      setSearchValue(urlUserId);
    }
  }, [urlUserId, searchValue]);

  /**
   * 搜索值变化时自动执行查询（仅当从 URL 参数触发时）
   */
  useEffect(() => {
    if (urlUserId && searchValue === urlUserId && !queryResult) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue, urlUserId]);

  /**
   * 导出下级成员
   */
  const handleExport = useCallback(async () => {
    if (!queryResult?.user.id) return;

    const params: DownlineListParams = {};
    if (currentLevel) params.level = parseInt(currentLevel, 10) as 1 | 2 | 3;
    if (statusFilter) params.status = statusFilter as 'ACTIVE' | 'BANNED';
    if (validInviteFilter) params.isValidInvite = validInviteFilter === 'true';
    if (dateRange) {
      params.startDate = dateRange[0];
      params.endDate = dateRange[1];
    }

    const blob = await exportDownlineMembers(queryResult.user.id, params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team_members_${queryResult.user.id}_${Date.now()}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queryResult, currentLevel, statusFilter, validInviteFilter, dateRange]);

  /**
   * 下级成员表格列配置
   */
  const columns: ProColumns<DownlineMemberItem>[] = [
    {
      title: '用户信息',
      dataIndex: 'user',
      width: 220,
      render: (_, record) => (
        <UserInfoCard
          userId={record.id}
          phone={record.phone}
          nickname={record.nickname}
          avatarUrl={record.avatarUrl}
          vipLevel={record.vipLevel}
          status={record.status}
          size="small"
        />
      ),
    },
    {
      title: '层级',
      dataIndex: 'level',
      width: 80,
      render: (_, record) => {
        const config = LEVEL_COLORS[record.level];
        return (
          <Tag color={config.text}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      width: 170,
      render: (_, record) => <TimeDisplay value={record.registeredAt} />,
    },
    {
      title: 'VIP等级',
      dataIndex: 'vipLevel',
      width: 90,
      render: (_, record) => (
        <Tag color={record.vipLevel > 0 ? 'blue' : 'default'}>
          VIP{record.vipLevel}
        </Tag>
      ),
    },
    {
      title: '有效邀请',
      dataIndex: 'isValidInvite',
      width: 90,
      render: (_, record) =>
        record.isValidInvite ? (
          <Tag color="success" icon={<RiCheckboxCircleLine size={12} />}>
            是
          </Tag>
        ) : (
          <Tag color="default" icon={<RiCloseCircleLine size={12} />}>
            否
          </Tag>
        ),
    },
    {
      title: '贡献返佣',
      dataIndex: 'contributedCommission',
      width: 120,
      render: (_, record) => (
        <AmountDisplay value={record.contributedCommission} />
      ),
    },
    {
      title: '下级人数',
      dataIndex: 'subDownlineCount',
      width: 90,
      render: (_, record) => (
        <Tooltip title="点击查看该用户的团队">
          <a onClick={() => handleSwitchUser(record.id)}>
            {record.subDownlineCount}人
          </a>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="view" onClick={() => router.push(`/users/${record.id}`)}>
          详情
        </a>,
        <a key="team" onClick={() => handleSwitchUser(record.id)}>
          团队
        </a>,
      ],
    },
  ];

  /**
   * 人数分布饼图配置
   */
  const memberDistributionData = teamStats
    ? [
        { type: '一级下级', value: teamStats.teamSummary.level1Count },
        { type: '二级下级', value: teamStats.teamSummary.level2Count },
        { type: '三级下级', value: teamStats.teamSummary.level3Count },
      ]
    : [];

  const memberStatusData = teamStats
    ? [
        { type: '活跃用户', value: teamStats.teamSummary.activeCount },
        { type: '封禁用户', value: teamStats.teamSummary.bannedCount },
      ]
    : [];

  const commissionDistributionData = teamStats
    ? [
        { type: '一级返佣', value: parseFloat(teamStats.commissionSummary.level1Commission) },
        { type: '二级返佣', value: parseFloat(teamStats.commissionSummary.level2Commission) },
        { type: '三级返佣', value: parseFloat(teamStats.commissionSummary.level3Commission) },
      ]
    : [];

  const pieConfig = {
    height: 180,
    innerRadius: 0.6,
    radius: 0.9,
    label: {
      text: 'value',
      position: 'outside' as const,
    },
    legend: {
      color: {
        position: 'bottom' as const,
        layout: { justifyContent: 'center' },
      },
    },
    interaction: {
      elementHighlight: true,
    },
  };

  return (
    <div className="team-query-page">
      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          <RiTeamLine size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          团队关系查询
        </Title>

        <Space size={12}>
          <Select
            value={searchType}
            onChange={setSearchType}
            style={{ width: 120 }}
            options={[
              { value: 'userId', label: '用户ID' },
              { value: 'phone', label: '手机号' },
              { value: 'inviteCode', label: '邀请码' },
            ]}
          />
          <Input
            placeholder={
              searchType === 'userId'
                ? '请输入用户ID'
                : searchType === 'phone'
                ? '请输入手机号'
                : '请输入邀请码'
            }
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<RiSearchLine size={16} />}
            onClick={handleSearch}
            loading={searching}
          >
            查询
          </Button>
        </Space>
      </Card>

      {/* 查询结果 */}
      {searching ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">查询中...</Text>
            </div>
          </div>
        </Card>
      ) : queryResult ? (
        <>
          {/* 上级链路可视化 */}
          {/* 文档要求方向：三级上级 → 二级上级 → 一级上级 → 当前用户 */}
          <Card
            title={
              <Space>
                <RiUserLine size={18} />
                <span>上级链路</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 0',
                overflowX: 'auto',
              }}
            >
              {/* 按从远到近的顺序显示上级：三级 → 二级 → 一级 → 当前用户 */}
              {uplineChain
                .filter((n) => n.user)
                .slice()
                .reverse() // 反转数组，从三级开始显示
                .map((node, index) => (
                  <UplineNode
                    key={node.level}
                    node={node}
                    onSwitchUser={handleSwitchUser}
                    onViewDetail={(userId) => router.push(`/users/${userId}`)}
                    isFirst={index === 0}
                  />
                ))}

              {/* 当前用户 - 显示在最右端 */}
              <CurrentUserNode
                user={queryResult.user}
                isTopLevel={uplineChain.every((n) => !n.user)}
                hasUpline={uplineChain.some((n) => n.user)}
              />
            </div>
          </Card>

          {/* 下级统计摘要 - 文档要求：一级成员数、二级成员数、三级成员数、累计获得返佣金额、有效邀请人数 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="一级下级"
                value={queryResult.downlineSummary.level1Count}
                prefix={<RiGroupLine size={20} style={{ color: LEVEL_COLORS[1].text }} />}
                suffix="人"
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="二级下级"
                value={queryResult.downlineSummary.level2Count}
                prefix={<RiGroupLine size={20} style={{ color: LEVEL_COLORS[2].text }} />}
                suffix="人"
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="三级下级"
                value={queryResult.downlineSummary.level3Count}
                prefix={<RiGroupLine size={20} style={{ color: LEVEL_COLORS[3].text }} />}
                suffix="人"
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="团队总人数"
                value={queryResult.downlineSummary.totalCount}
                prefix={<RiTeamLine size={20} style={{ color: '#722ed1' }} />}
                suffix="人"
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="累计返佣"
                value={teamStats?.commissionSummary.totalCommission || '0.00'}
                prefix={<RiMoneyDollarCircleLine size={20} style={{ color: '#fa8c16' }} />}
                isCurrency
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <StatisticCard
                title="有效邀请"
                value={teamStats?.validInviteSummary.totalValidInvites || 0}
                prefix={<RiUserStarLine size={20} style={{ color: '#52c41a' }} />}
                suffix="人"
              />
            </Col>
          </Row>

          {/* 团队统计图表 */}
          {teamStats && (
            <Card
              title={
                <Space>
                  <RiMoneyDollarCircleLine size={18} />
                  <span>团队统计</span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <Text strong>各级人数分布</Text>
                  </div>
                  <Pie
                    {...pieConfig}
                    data={memberDistributionData}
                    angleField="value"
                    colorField="type"
                    color={[LEVEL_COLORS[1].text, LEVEL_COLORS[2].text, LEVEL_COLORS[3].text]}
                  />
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <Text strong>活跃/封禁分布</Text>
                  </div>
                  <Pie
                    {...pieConfig}
                    data={memberStatusData}
                    angleField="value"
                    colorField="type"
                    color={['#52c41a', '#ff4d4f']}
                  />
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <Text strong>各级返佣占比</Text>
                  </div>
                  <Pie
                    {...pieConfig}
                    data={commissionDistributionData}
                    angleField="value"
                    colorField="type"
                    color={[LEVEL_COLORS[1].text, LEVEL_COLORS[2].text, LEVEL_COLORS[3].text]}
                  />
                </Col>
              </Row>

              {/* 返佣金额汇总 */}
              <Divider style={{ margin: '16px 0' }} />
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">总返佣</Text>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>
                      <AmountDisplay value={teamStats.commissionSummary.totalCommission} size="large" />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">一级返佣</Text>
                    <div style={{ fontSize: 16, fontWeight: 500, color: LEVEL_COLORS[1].text }}>
                      <AmountDisplay value={teamStats.commissionSummary.level1Commission} />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">二级返佣</Text>
                    <div style={{ fontSize: 16, fontWeight: 500, color: LEVEL_COLORS[2].text }}>
                      <AmountDisplay value={teamStats.commissionSummary.level2Commission} />
                    </div>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">三级返佣</Text>
                    <div style={{ fontSize: 16, fontWeight: 500, color: LEVEL_COLORS[3].text }}>
                      <AmountDisplay value={teamStats.commissionSummary.level3Commission} />
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {/* 下级成员列表 */}
          <Card
            title={
              <Space>
                <RiGroupLine size={18} />
                <span>下级成员列表</span>
              </Space>
            }
            extra={
              <ExportButton
                onExportExcel={handleExport}
                excelOnly
                size="small"
              />
            }
          >
            {/* Tab筛选 */}
            <div style={{ marginBottom: 16 }}>
              <QuickFilters
                options={levelOptions}
                value={currentLevel}
                onChange={(v) => {
                  setCurrentLevel(v as string || '');
                  actionRef.current?.reload();
                }}
              />
            </div>

            {/* 高级筛选 */}
            <div style={{ marginBottom: 16 }}>
              <Space wrap>
                <Select
                  placeholder="状态筛选"
                  value={statusFilter || undefined}
                  onChange={(v) => {
                    setStatusFilter(v || '');
                    actionRef.current?.reload();
                  }}
                  allowClear
                  style={{ width: 120 }}
                  options={[
                    { value: 'ACTIVE', label: '正常' },
                    { value: 'BANNED', label: '封禁' },
                  ]}
                />
                <Select
                  placeholder="有效邀请"
                  value={validInviteFilter || undefined}
                  onChange={(v) => {
                    setValidInviteFilter(v || '');
                    actionRef.current?.reload();
                  }}
                  allowClear
                  style={{ width: 120 }}
                  options={[
                    { value: 'true', label: '是' },
                    { value: 'false', label: '否' },
                  ]}
                />
                <RangePicker
                  placeholder={['注册开始', '注册结束']}
                  onChange={(_, dateStrings) => {
                    setDateRange(dateStrings[0] ? [dateStrings[0], dateStrings[1]] : null);
                    actionRef.current?.reload();
                  }}
                />
              </Space>
            </div>

            {/* 表格 */}
            <ProTable<DownlineMemberItem>
              columns={columns}
              actionRef={actionRef}
              rowKey="id"
              search={false}
              options={false}
              request={async (params) => {
                if (!queryResult?.user.id) {
                  return { data: [], success: true, total: 0 };
                }

                const queryParams: DownlineListParams = {
                  page: params.current,
                  pageSize: params.pageSize,
                };

                if (currentLevel) {
                  queryParams.level = parseInt(currentLevel, 10) as 1 | 2 | 3;
                }
                if (statusFilter) {
                  queryParams.status = statusFilter as 'ACTIVE' | 'BANNED';
                }
                if (validInviteFilter) {
                  queryParams.isValidInvite = validInviteFilter === 'true';
                }
                if (dateRange) {
                  queryParams.startDate = dateRange[0];
                  queryParams.endDate = dateRange[1];
                }

                try {
                  const data = await getDownlineMembers(queryResult.user.id, queryParams);
                  return {
                    data: data.list,
                    success: true,
                    total: data.pagination.total,
                  };
                } catch {
                  return { data: [], success: false, total: 0 };
                }
              }}
              pagination={{
                defaultPageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </>
      ) : (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="请输入用户ID、手机号或邀请码进行查询"
          />
        </Card>
      )}
    </div>
  );
}
