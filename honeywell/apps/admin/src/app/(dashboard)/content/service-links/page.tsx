/**
 * @file 客服链接配置页
 * @description 管理用户端右下角悬浮客服按钮的链接列表
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.3-客服链接配置页.md
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Switch,
  Space,
  Typography,
  Spin,
  Empty,
  Alert,
  message,
} from 'antd';
import { RiAddLine, RiEditLine, RiDeleteBinLine } from '@remixicon/react';
import { PageContainer } from '@ant-design/pro-layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 组件
import { DragSortList } from '@/components/tables/DragSortList';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { ServiceLinkIcon } from './components/ServiceLinkIcon';
import { ServiceLinkForm } from './components/ServiceLinkForm';
import { ServicePreview } from './components/ServicePreview';

// 服务
import { getServiceLinks, updateServiceLinks } from '@/services/content';

// 类型
import type { ServiceLink, ServiceLinkFormValues } from '@/types/service-link';
import { PRESET_ICONS } from '@/types/service-link';

const { Text, Paragraph } = Typography;

/**
 * 扩展 ServiceLink 类型以支持 DragSortList
 */
interface SortableServiceLink {
  /** 唯一标识（DragSortList 要求） */
  id: string | number;
  /** 数组索引 */
  index: number;
  /** 客服渠道名称 */
  name: string;
  /** 图标 */
  icon: string;
  /** 跳转链接 */
  url: string;
  /** 是否启用 */
  isActive: boolean;
  /** 允许额外字段 */
  [key: string]: unknown;
}

/**
 * 客服链接配置页
 */
export default function ServiceLinksPage() {
  const queryClient = useQueryClient();

  // 状态管理
  const [links, setLinks] = useState<SortableServiceLink[]>([]);
  const [editingLink, setEditingLink] = useState<ServiceLink | null>(null);
  const [deleteLink, setDeleteLink] = useState<ServiceLink | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 获取客服链接列表
  const { data, isLoading, error } = useQuery({
    queryKey: ['service-links'],
    queryFn: getServiceLinks,
  });

  // 更新客服链接
  const updateMutation = useMutation({
    mutationFn: updateServiceLinks,
    onSuccess: () => {
      message.success('配置保存成功');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['service-links'] });
    },
    onError: (error: Error) => {
      message.error(error.message || '保存失败，请重试');
    },
  });

  // 初始化数据
  useEffect(() => {
    if (data?.list) {
      const sortableLinks: SortableServiceLink[] = data.list.map((link, index) => ({
        ...link,
        id: link.index ?? index,
        index: link.index ?? index,
      }));
      setLinks(sortableLinks);
    }
  }, [data]);

  /**
   * 拖拽排序回调
   */
  const handleSortChange = useCallback((newItems: SortableServiceLink[]) => {
    // 重新分配索引
    const reindexedItems = newItems.map((item, idx) => ({
      ...item,
      id: idx,
      index: idx,
    }));
    setLinks(reindexedItems);
    setHasChanges(true);
  }, []);

  /**
   * 打开添加表单
   * @description 依据：04.8.3-客服链接配置页.md 第7节 - 最多添加10个客服渠道
   */
  const handleAdd = () => {
    // 数量限制：最多10个客服渠道
    if (links.length >= 10) {
      message.warning('最多添加10个客服渠道');
      return;
    }
    setEditingLink(null);
    setIsFormOpen(true);
  };

  /**
   * 打开编辑表单
   */
  const handleEdit = (link: ServiceLink) => {
    setEditingLink(link);
    setIsFormOpen(true);
  };

  /**
   * 打开删除确认
   */
  const handleDeleteClick = (link: ServiceLink) => {
    setDeleteLink(link);
  };

  /**
   * 确认删除
   */
  const handleDeleteConfirm = () => {
    if (!deleteLink) return;

    setLinks((items) => {
      const newItems = items.filter((item) => item.index !== deleteLink.index);
      return newItems.map((item, idx) => ({
        ...item,
        id: idx,
        index: idx,
      }));
    });
    setDeleteLink(null);
    setHasChanges(true);
  };

  /**
   * 切换启用状态
   */
  const handleToggleActive = (link: ServiceLink) => {
    setLinks((items) =>
      items.map((item) =>
        item.index === link.index ? { ...item, isActive: !item.isActive } : item
      )
    );
    setHasChanges(true);
  };

  /**
   * 表单提交
   */
  const handleFormSubmit = (values: ServiceLinkFormValues) => {
    // 合成 icon 值
    const icon = values.iconType === 'preset' ? values.presetIcon! : values.customIcon!;

    if (editingLink !== null) {
      // 编辑模式
      setLinks((items) =>
        items.map((item) =>
          item.index === editingLink.index
            ? { ...item, name: values.name, icon, url: values.url, isActive: values.isActive }
            : item
        )
      );
    } else {
      // 添加模式
      setLinks((items) => [
        ...items,
        {
          id: items.length,
          index: items.length,
          name: values.name,
          icon,
          url: values.url,
          isActive: values.isActive,
        },
      ]);
    }

    setIsFormOpen(false);
    setHasChanges(true);
  };

  /**
   * 保存配置
   */
  const handleSave = async () => {
    // 构建请求数据（去除 id 字段）
    const listToSave = links.map(({ id, index, ...rest }) => rest);
    await updateMutation.mutateAsync({ list: listToSave });
  };

  /**
   * 重置配置
   */
  const handleReset = () => {
    if (data?.list) {
      const sortableLinks: SortableServiceLink[] = data.list.map((link, index) => ({
        ...link,
        id: link.index ?? index,
        index: link.index ?? index,
      }));
      setLinks(sortableLinks);
      setHasChanges(false);
    }
  };

  /**
   * 渲染列表项
   */
  const renderItem = (item: SortableServiceLink, _index: number, _isDragging: boolean) => {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          opacity: item.isActive ? 1 : 0.6,
        }}
      >
        {/* 图标 */}
        <div
          style={{
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            flexShrink: 0,
          }}
        >
          <ServiceLinkIcon icon={item.icon} size={24} />
        </div>

        {/* 信息 */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <Text strong style={{ display: 'block', marginBottom: 2 }}>
            {item.name}
          </Text>
          <Paragraph
            style={{
              fontSize: 12,
              color: '#999',
              marginBottom: 0,
            }}
            ellipsis={{ rows: 1 }}
            copyable={{ text: item.url, tooltips: ['复制链接', '已复制'] }}
          >
            {item.url}
          </Paragraph>
        </div>

        {/* 状态开关 */}
        <div style={{ flexShrink: 0 }}>
          <Switch
            checked={item.isActive}
            onChange={() => handleToggleActive(item)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
          />
        </div>

        {/* 操作按钮 */}
        <div style={{ flexShrink: 0 }}>
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<RiEditLine size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item);
              }}
            >
              编辑
            </Button>
            <Button
              type="text"
              size="small"
              danger
              icon={<RiDeleteBinLine size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item);
              }}
            >
              删除
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  // 获取启用的链接（用于预览）
  const activeLinks = links.filter((link) => link.isActive);

  return (
    <PageContainer
      header={{
        title: '客服链接配置',
        breadcrumb: {
          items: [{ title: '内容管理' }, { title: '客服链接' }],
        },
      }}
    >
      <Spin spinning={isLoading}>
        {error && (
          <Alert
            message="加载失败"
            description="获取客服链接配置失败，请刷新页面重试"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={24}>
          {/* 左侧列表区 */}
          <Col xs={24} lg={14}>
            <Card
              title="客服链接列表"
              extra={
                <Button
                  type="primary"
                  icon={<RiAddLine size={16} />}
                  onClick={handleAdd}
                >
                  添加客服链接
                </Button>
              }
              bordered={false}
            >
              {links.length === 0 ? (
                <Empty
                  description="暂无客服链接，点击上方按钮添加"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <>
                  {links.length >= 5 && (
                    <Alert
                      message="建议最多配置5个客服渠道，避免菜单过长影响用户体验"
                      type="warning"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <DragSortList
                    items={links}
                    onSortChange={handleSortChange}
                    renderItem={renderItem}
                    showIndex
                    maxHeight={500}
                  />
                </>
              )}
            </Card>
          </Col>

          {/* 右侧预览区 */}
          <Col xs={24} lg={10}>
            <Card title="悬浮菜单预览" bordered={false}>
              <ServicePreview links={activeLinks} />
            </Card>

            <Card bordered={false} style={{ marginTop: 16 }}>
              <div style={{ color: '#666', fontSize: 13, lineHeight: 1.8 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  使用说明
                </Text>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  <li>拖拽左侧拖动图标可调整展示顺序</li>
                  <li>禁用的链接不会显示给用户</li>
                  <li>建议最多配置5个客服渠道</li>
                  <li>修改后需点击"保存配置"才会生效</li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 底部操作栏 */}
        <Card bordered={false} style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button onClick={handleReset} disabled={!hasChanges || updateMutation.isPending}>
              重置
            </Button>
            <Button
              type="primary"
              onClick={handleSave}
              loading={updateMutation.isPending}
              disabled={!hasChanges}
            >
              保存配置
            </Button>
          </div>
        </Card>
      </Spin>

      {/* 添加/编辑弹窗 */}
      <ServiceLinkForm
        open={isFormOpen}
        initialValues={editingLink}
        onSubmit={handleFormSubmit}
        onCancel={() => setIsFormOpen(false)}
      />

      {/* 删除确认弹窗 */}
      <ConfirmModal
        open={!!deleteLink}
        onClose={() => setDeleteLink(null)}
        onConfirm={handleDeleteConfirm}
        title="确认删除"
        content={`确定删除客服渠道"${deleteLink?.name}"吗？`}
        danger
        confirmText="删除"
      />
    </PageContainer>
  );
}
