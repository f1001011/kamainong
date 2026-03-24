/**
 * @file 列表页骨架屏组件
 * @description 列表页加载时的骨架屏占位
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React from 'react';
import { Skeleton, Card, Space, Row, Col } from 'antd';

export interface ListPageSkeletonProps {
  /** 是否显示统计卡片区骨架 */
  showStats?: boolean;
  /** 统计卡片数量 */
  statsCount?: number;
  /** 是否显示搜索区骨架 */
  showSearch?: boolean;
  /** 搜索项数量 */
  searchCount?: number;
  /** 表格行数 */
  rows?: number;
  /** 表格列数 */
  columns?: number;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

/**
 * 搜索区骨架
 */
function SearchSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Card
      style={{
        marginBottom: 'var(--spacing-md, 16px)',
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
        border: '1px solid var(--border-light, #f0f0f0)',
      }}
      styles={{
        body: {
          padding: 'var(--spacing-lg, 20px) var(--card-padding, 24px)',
        },
      }}
    >
      <Row gutter={16}>
        {Array.from({ length: count }).map((_, index) => (
          <Col key={index} span={Math.floor(24 / count)}>
            <Skeleton.Input
              active
              size="small"
              style={{ width: '100%', marginBottom: 8 }}
            />
            <Skeleton.Input
              active
              style={{ width: '100%' }}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
}

/**
 * 统计卡片区骨架
 */
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Row gutter={16} style={{ marginBottom: 'var(--spacing-md, 16px)' }}>
      {Array.from({ length: count }).map((_, index) => (
        <Col key={index} span={Math.floor(24 / count)}>
          <Card
            style={{
              borderRadius: 'var(--radius-lg, 12px)',
              boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
              border: '1px solid var(--border-light, #f0f0f0)',
            }}
            styles={{
              body: {
                padding: 'var(--card-padding-sm, 16px) var(--spacing-lg, 20px)',
              },
            }}
          >
            <Skeleton.Input
              active
              size="small"
              style={{ width: 80, marginBottom: 12 }}
            />
            <Skeleton.Input
              active
              size="large"
              style={{ width: 120 }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

/**
 * 表格区骨架
 */
function TableSkeleton({
  rows = 10,
  columns = 6,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <Card
      style={{
        borderRadius: 'var(--radius-lg, 12px)',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))',
        border: '1px solid var(--border-light, #f0f0f0)',
        overflow: 'hidden',
      }}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      {/* 表头 */}
      <div
        style={{
          display: 'flex',
          padding: '12px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          gap: 16,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton.Input
            key={index}
            active
            size="small"
            style={{
              width: index === 0 ? 40 : index === columns - 1 ? 100 : 80,
              flex: index === 0 || index === columns - 1 ? 'none' : 1,
            }}
          />
        ))}
      </div>

      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          style={{
            display: 'flex',
            padding: '16px',
            borderBottom: rowIndex < rows - 1 ? '1px solid #f0f0f0' : 'none',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={colIndex}
              active
              size="small"
              style={{
                width: colIndex === 0 ? 40 : colIndex === columns - 1 ? 100 : '100%',
                flex: colIndex === 0 || colIndex === columns - 1 ? 'none' : 1,
              }}
            />
          ))}
        </div>
      ))}

      {/* 分页器 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '16px',
          borderTop: '1px solid #f0f0f0',
          gap: 8,
        }}
      >
        <Skeleton.Button active size="small" />
        <Skeleton.Input active size="small" style={{ width: 32 }} />
        <Skeleton.Input active size="small" style={{ width: 32 }} />
        <Skeleton.Input active size="small" style={{ width: 32 }} />
        <Skeleton.Button active size="small" />
      </div>
    </Card>
  );
}

/**
 * 列表页骨架屏
 * @description 列表页加载时的完整骨架屏
 * @example
 * <ListPageSkeleton
 *   showStats
 *   statsCount={4}
 *   showSearch
 *   searchCount={3}
 *   rows={10}
 * />
 */
export function ListPageSkeleton({
  showStats = false,
  statsCount = 4,
  showSearch = true,
  searchCount = 4,
  rows = 10,
  columns = 6,
  className,
  style,
}: ListPageSkeletonProps) {
  return (
    <div className={className} style={style}>
      {/* 统计卡片区 */}
      {showStats && <StatsSkeleton count={statsCount} />}

      {/* 搜索区 */}
      {showSearch && <SearchSkeleton count={searchCount} />}

      {/* 表格区 */}
      <TableSkeleton rows={rows} columns={columns} />
    </div>
  );
}

/**
 * 详情页骨架屏
 */
export function DetailPageSkeleton({
  showHeader = true,
  sections = 2,
  className,
  style,
}: {
  showHeader?: boolean;
  sections?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {/* 头部 */}
      {showHeader && (
        <Card
          style={{ marginBottom: 16, borderRadius: 12 }}
          styles={{
            body: {
              padding: '24px',
            },
          }}
        >
          <Space size={16}>
            <Skeleton.Avatar active size={64} />
            <div>
              <Skeleton.Input active style={{ width: 200, marginBottom: 8 }} />
              <Skeleton.Input active size="small" style={{ width: 150 }} />
            </div>
          </Space>
        </Card>
      )}

      {/* 内容区 */}
      {Array.from({ length: sections }).map((_, index) => (
        <Card
          key={index}
          style={{ marginBottom: 16, borderRadius: 12 }}
          styles={{
            body: {
              padding: '24px',
            },
          }}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      ))}
    </div>
  );
}

export default ListPageSkeleton;
