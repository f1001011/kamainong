/**
 * @file 通用 Tab 组件
 * @description 简化的 Tab 组件，支持下划线滑动动画 + 窄屏横向滚动
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * @depends 开发文档/03-前端用户端/03.3-产品模块/03.3.1-产品列表页.md
 *
 * 复用说明：本组件将被以下页面复用
 * - FE-06 产品列表页
 * - FE-09 我的持仓页
 * - FE-11 充值记录页
 * - FE-15 提现记录页
 * - FE-17 团队页面
 *
 * 窄屏滚动架构（两层 div）：
 * - 外层 div：overflow-x-auto 滚动容器，宽度受父级约束
 * - 内层 div：flex 布局 + relative 定位（给指示器做锚点），min-w-full 保证宽屏填满
 *
 * 兼容性：iOS 13+ / Android 80+ / Chrome 60+
 * - 不使用 overflow-x:clip（Safari 16+ 才支持）
 * - 不使用 scrollIntoView options（Safari 15.4+ 才支持）
 * - 使用手动 scrollLeft 计算替代
 */

'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * Tab 选项定义
 */
export interface TabItem {
  /** 唯一标识 */
  key: string;
  /** 显示文案 */
  label: string;
}

/**
 * SimpleTabs 组件属性
 */
export interface SimpleTabsProps {
  /** Tab 选项列表 */
  items: TabItem[];
  /** 当前激活的 Tab key */
  activeKey: string;
  /** Tab 切换回调 */
  onChange: (key: string) => void;
  /** 自定义类名 */
  className?: string;
  /** 是否使用毛玻璃背景 */
  glass?: boolean;
  /** Tab 样式变体 */
  variant?: 'default' | 'pill';
}

/**
 * 下划线指示器样式
 */
interface IndicatorStyle {
  left: number;
  width: number;
}

/**
 * SimpleTabs 通用 Tab 组件
 * @description 支持下划线滑动动画 + 窄屏横向滚动的 Tab 组件
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState('1');
 *
 * <SimpleTabs
 *   items={[
 *     { key: '1', label: 'Productos Po' },
 *     { key: '2', label: 'Productos VIP' },
 *   ]}
 *   activeKey={activeTab}
 *   onChange={setActiveTab}
 * />
 * ```
 */
export function SimpleTabs({
  items,
  activeKey,
  onChange,
  className,
  glass = false,
  variant = 'default',
}: SimpleTabsProps) {
  /** 外层滚动容器 ref */
  const scrollRef = useRef<HTMLDivElement>(null);
  /** 内层 flex 容器 ref（指示器的 offsetParent） */
  const innerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({ left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const { isAnimationEnabled, getSpring } = useAnimationConfig();

  /**
   * 更新下划线指示器位置
   * 使用 offsetLeft/offsetWidth，在可滚动容器中指示器跟随内容定位
   */
  const updateIndicator = useCallback(() => {
    const activeTab = tabRefs.current.get(activeKey);

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeKey]);

  // 初始化时标记已挂载
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 更新指示器位置
  useLayoutEffect(() => {
    if (isMounted) {
      updateIndicator();
    }
  }, [isMounted, updateIndicator]);

  // 窗口大小变化时更新指示器
  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  /**
   * 将激活 Tab 滚动到可视区域中心
   * 使用手动 scrollLeft 计算，兼容 iOS 13+ / Safari < 15.4
   * 不使用 scrollIntoView({ inline: 'center' })（需要 Safari 15.4+）
   */
  const scrollActiveTabIntoView = useCallback(() => {
    const activeTab = tabRefs.current.get(activeKey);
    const container = scrollRef.current;

    if (!activeTab || !container) return;

    // 计算目标滚动位置：让 Tab 居中显示
    const targetScrollLeft =
      activeTab.offsetLeft - container.clientWidth / 2 + activeTab.offsetWidth / 2;

    // 安全范围限制
    const maxScroll = container.scrollWidth - container.clientWidth;
    const safeScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScroll));

    // 尝试平滑滚动（不支持的浏览器直接跳转）
    try {
      container.scrollTo({ left: safeScrollLeft, behavior: 'smooth' });
    } catch {
      container.scrollLeft = safeScrollLeft;
    }
  }, [activeKey]);

  // 活动 Tab 变化时，自动滚动到可见区域
  useEffect(() => {
    if (!isMounted) return;
    scrollActiveTabIntoView();
  }, [activeKey, isMounted, scrollActiveTabIntoView]);

  /**
   * 处理 Tab 点击
   */
  const handleTabClick = (key: string) => {
    if (key !== activeKey) {
      onChange(key);
    }
  };

  /**
   * 设置 Tab 引用
   */
  const setTabRef = (key: string) => (el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(key, el);
    } else {
      tabRefs.current.delete(key);
    }
  };

  // 弹簧动画配置
  const springConfig = getSpring('snappy');

  return (
    /* 外层：滚动容器 - 宽度受父级约束，内容溢出时可横向滚动 */
    <div
      ref={scrollRef}
      className={cn(
        'overflow-x-auto scrollbar-hide',
        glass && 'glass rounded-xl p-1',
        !glass && variant === 'default' && 'border-b border-neutral-200',
        className
      )}
    >
      {/* 内层：flex 布局 + 指示器锚点 - min-w-full 保证宽屏填满，可超出外层宽度 */}
      <div
        ref={innerRef}
        className="relative flex min-w-full"
      >
        {items.map((item) => {
          const isActive = activeKey === item.key;

          return (
            <button
              key={item.key}
              ref={setTabRef(item.key)}
              onClick={() => handleTabClick(item.key)}
              className={cn(
                /*
                 * flex 布局策略：
                 * grow       → 宽屏时均匀填充容器
                 * shrink-0   → 窄屏时不压缩，保证文字完整显示
                 * basis-auto → 以内容宽度为基准
                 * whitespace-nowrap → 文字不换行
                 */
                'grow shrink-0 basis-auto',
                'relative py-3 px-4 text-center whitespace-nowrap transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-inset',
                // 激活状态
                isActive
                  ? 'text-primary-500 font-semibold'
                  : 'text-neutral-500 hover:text-neutral-700',
                // Pill 变体样式
                variant === 'pill' && isActive && 'bg-primary-50 rounded-lg',
              )}
              type="button"
              role="tab"
              aria-selected={isActive}
            >
              {item.label}
            </button>
          );
        })}

        {/*
          下划线指示器 - 绝对定位在内层 flex 容器内，跟随滚动内容移动
          依据：01.2-动画系统.md - Tab下划线滑动动画
        */}
        {variant === 'default' && isMounted && (
          isAnimationEnabled ? (
            <m.div
              className="absolute bottom-0 h-0.5 bg-primary-500 rounded-full"
              initial={false}
              animate={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
              transition={springConfig}
            />
          ) : (
            <div
              className="absolute bottom-0 h-0.5 bg-primary-500 rounded-full transition-all duration-200"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          )
        )}
      </div>
    </div>
  );
}

/**
 * TabContent 内容切换动画容器
 * @description 配合 SimpleTabs 使用，提供内容区域的切换动画
 */
export interface TabContentProps {
  /** 当前激活的 Tab key */
  activeKey: string;
  /** 子内容映射 */
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

export function TabContent({
  activeKey,
  children,
  className,
}: TabContentProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  if (!isAnimationEnabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <m.div
        key={activeKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}
