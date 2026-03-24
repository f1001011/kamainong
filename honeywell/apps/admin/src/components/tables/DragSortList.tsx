/**
 * @file 拖拽排序列表组件
 * @description 基于 @dnd-kit 实现的拖拽排序列表
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第11节 - 常用组件规范
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { List, Typography } from 'antd';
import { RiDraggable } from '@remixicon/react';

const { Text } = Typography;

/**
 * 可排序项类型
 */
export interface SortableItem {
  /** 唯一标识 */
  id: string | number;
  /** 显示名称 */
  name?: string;
  /** 其他数据 */
  [key: string]: unknown;
}

/**
 * 排序项渲染函数类型
 */
export type SortableItemRenderer<T extends SortableItem> = (
  item: T,
  index: number,
  isDragging: boolean
) => React.ReactNode;

export interface DragSortListProps<T extends SortableItem> {
  /** 数据列表 */
  items: T[];
  /** 排序变化回调 */
  onSortChange: (items: T[]) => void;
  /** 自定义渲染项 */
  renderItem?: SortableItemRenderer<T>;
  /** 是否显示序号 */
  showIndex?: boolean;
  /** 是否禁用拖拽 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 列表高度（超出滚动） */
  maxHeight?: number;
}

/**
 * 可排序列表项组件
 */
function SortableListItem<T extends SortableItem>({
  item,
  index,
  renderItem,
  showIndex,
  disabled,
}: {
  item: T;
  index: number;
  renderItem?: SortableItemRenderer<T>;
  showIndex?: boolean;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#e6f4ff' : '#fff',
    borderRadius: 8,
    marginBottom: 8,
    border: isDragging ? '2px dashed #1677ff' : '1px solid #f0f0f0',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          gap: 12,
        }}
      >
        {/* 拖拽把手 */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: disabled ? 'not-allowed' : 'grab',
            color: disabled ? '#bfbfbf' : '#8c8c8c',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
            borderRadius: 4,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.color = '#262626';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = disabled ? '#bfbfbf' : '#8c8c8c';
          }}
        >
          <RiDraggable size={18} />
        </div>

        {/* 序号 */}
        {showIndex && (
          <Text
            type="secondary"
            style={{
              minWidth: 24,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1}
          </Text>
        )}

        {/* 内容 */}
        <div style={{ flex: 1 }}>
          {renderItem ? (
            renderItem(item, index, isDragging)
          ) : (
            <Text>{item.name || String(item.id)}</Text>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 拖拽覆盖层项
 */
function DragOverlayItem<T extends SortableItem>({
  item,
  index,
  renderItem,
  showIndex,
}: {
  item: T;
  index: number;
  renderItem?: SortableItemRenderer<T>;
  showIndex?: boolean;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        border: '2px solid #1677ff',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          gap: 12,
        }}
      >
        {/* 拖拽把手 */}
        <div
          style={{
            color: '#1677ff',
            display: 'flex',
            alignItems: 'center',
            padding: 4,
          }}
        >
          <RiDraggable size={18} />
        </div>

        {/* 序号 */}
        {showIndex && (
          <Text
            type="secondary"
            style={{
              minWidth: 24,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {index + 1}
          </Text>
        )}

        {/* 内容 */}
        <div style={{ flex: 1 }}>
          {renderItem ? (
            renderItem(item, index, true)
          ) : (
            <Text>{item.name || String(item.id)}</Text>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 拖拽排序列表
 * @description 支持拖拽排序的列表组件，基于 @dnd-kit 实现
 * @example
 * <DragSortList
 *   items={products}
 *   onSortChange={setProducts}
 *   showIndex
 *   renderItem={(item) => (
 *     <div>{item.name}</div>
 *   )}
 * />
 */
export function DragSortList<T extends SortableItem>({
  items,
  onSortChange,
  renderItem,
  showIndex = false,
  disabled = false,
  className,
  style,
  maxHeight,
}: DragSortListProps<T>) {
  // 当前拖拽的项
  const [activeId, setActiveId] = useState<string | number | null>(null);

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * 拖拽开始
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  /**
   * 拖拽结束
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onSortChange(newItems);
        }
      }
    },
    [items, onSortChange]
  );

  // 获取当前拖拽项
  const activeItem = activeId
    ? items.find((item) => item.id === activeId)
    : null;
  const activeIndex = activeId
    ? items.findIndex((item) => item.id === activeId)
    : -1;

  return (
    <div
      className={className}
      style={{
        maxHeight,
        overflow: maxHeight ? 'auto' : undefined,
        ...style,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item, index) => (
            <SortableListItem
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
              showIndex={showIndex}
              disabled={disabled}
            />
          ))}
        </SortableContext>

        {/* 拖拽覆盖层 */}
        <DragOverlay>
          {activeItem && (
            <DragOverlayItem
              item={activeItem}
              index={activeIndex}
              renderItem={renderItem}
              showIndex={showIndex}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* 空状态 */}
      {items.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 0',
            color: '#8c8c8c',
          }}
        >
          <Text type="secondary">暂无数据</Text>
        </div>
      )}
    </div>
  );
}

export default DragSortList;
