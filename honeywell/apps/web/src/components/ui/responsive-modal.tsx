/**
 * @file 响应式弹窗组件
 * @description 
 *   - composable 模式（公告弹窗等）：移动端和桌面端统一使用 Dialog 居中弹窗
 *   - 非 composable 模式：移动端使用 Drawer 底部抽屉，桌面端使用 Dialog
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

'use client';

import { type ReactNode, createContext, useContext, forwardRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { Drawer } from 'vaul';
import { m, AnimatePresence } from 'motion/react';
import { RiCloseLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useDevice } from '@/hooks/use-media-query';
import { useText } from '@/hooks/use-text';
import { overlayVariants, scaleVariants, drawerVariants } from '@/lib/animation';

// ================================
// Context 用于子组件获取设备信息
// ================================
interface ModalContextValue {
  /** 是否移动端 */
  isMobile: boolean;
  /** 是否使用组合模式（决定子组件用 Dialog 还是 Drawer） */
  isComposable: boolean;
}
const ResponsiveModalContext = createContext<ModalContextValue>({ isMobile: false, isComposable: false });

/**
 * 响应式弹窗属性
 */
export interface ResponsiveModalProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 弹窗标题 */
  title?: string;
  /** 弹窗描述 */
  description?: string;
  /** 弹窗内容 */
  children: ReactNode;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 遮罩层是否可点击关闭 */
  dismissible?: boolean;
  /** 
   * 是否使用组合模式（使用 ResponsiveModalContent 等子组件构建布局）
   * 默认 false，会自动包裹内容
   * 设为 true 时需要手动使用 ResponsiveModalContent 包裹
   * 
   * 注意：composable 模式下移动端和桌面端统一使用 Dialog 居中弹窗
   *       （因为 vaul Drawer 会强制底部定位，无法居中）
   */
  composable?: boolean;
}

/**
 * 响应式弹窗组件
 * @description 
 *   composable=true: 统一使用 Dialog 居中弹窗（移动端+桌面端）
 *   composable=false: 移动端 Drawer 底部抽屉，桌面端 Dialog 居中弹窗
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  showClose = true,
  className,
  dismissible = true,
  composable = false,
}: ResponsiveModalProps) {
  const { isMobile } = useDevice();
  const t = useText();

  // ========================================
  // 组合模式：统一使用 Dialog（移动端+桌面端）
  // vaul 的 Drawer.Content 会通过 JS 内联样式强制底部定位，
  // CSS 无法覆盖，因此居中弹窗必须使用 Dialog
  // ========================================
  if (composable) {
    return (
      <ResponsiveModalContext.Provider value={{ isMobile, isComposable: true }}>
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <AnimatePresence>
            {open && (
              <Dialog.Portal forceMount>
                <Dialog.Overlay asChild>
                  <m.div
                    className="fixed inset-0 z-50 bg-black/40"
                    variants={overlayVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={dismissible ? () => onOpenChange(false) : undefined}
                  />
                </Dialog.Overlay>
                {children}
              </Dialog.Portal>
            )}
          </AnimatePresence>
        </Dialog.Root>
      </ResponsiveModalContext.Provider>
    );
  }

  // ========================================
  // 非组合模式 - 移动端使用 Drawer 底部抽屉
  // ========================================
  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={{ isMobile: true, isComposable: false }}>
        <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content
              className={cn(
                'fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-2xl bg-white',
                'max-h-[90vh]',
                'pb-[env(safe-area-inset-bottom,0px)]',
                className
              )}
              aria-describedby={description ? undefined : undefined}
            >
              {/* 拖动指示条 */}
              <div className="mx-auto mt-4 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-neutral-200" />

              {/* 无障碍标题 */}
              {!title && (
                <VisuallyHidden.Root asChild>
                  <Drawer.Title>{t('a11y.modal', 'نافذة منبثقة')}</Drawer.Title>
                </VisuallyHidden.Root>
              )}
              {!description && (
                <VisuallyHidden.Root asChild>
                  <Drawer.Description>{t('a11y.modal_content', 'محتوى النافذة المنبثقة')}</Drawer.Description>
                </VisuallyHidden.Root>
              )}
              
              {/* 头部 */}
              {(title || showClose) && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 shrink-0">
                  <div className="flex-1">
                    {title && (
                      <Drawer.Title className="text-lg font-semibold text-foreground">
                        {title}
                      </Drawer.Title>
                    )}
                    {description && (
                      <Drawer.Description className="mt-0.5 text-sm text-neutral-400">
                        {description}
                      </Drawer.Description>
                    )}
                  </div>
                  {showClose && (
                    <button
                      onClick={() => onOpenChange(false)}
                      className="rounded-full p-2 hover:bg-neutral-100 transition-colors"
                      aria-label={t('aria.close', 'إغلاق')}
                    >
                      <RiCloseLine className="h-5 w-5 text-neutral-400" />
                    </button>
                  )}
                </div>
              )}
              
              {/* 内容区域 */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {children}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </ResponsiveModalContext.Provider>
    );
  }

  // ========================================
  // 非组合模式 - 桌面端使用 Dialog 居中弹窗
  // ========================================
  return (
    <ResponsiveModalContext.Provider value={{ isMobile: false, isComposable: false }}>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <m.div
                  className="fixed inset-0 z-50 bg-black/40"
                  variants={overlayVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={dismissible ? () => onOpenChange(false) : undefined}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild aria-describedby={description ? undefined : undefined}>
                <m.div
                  className={cn(
                    'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-soft-lg',
                    className
                  )}
                  variants={scaleVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {!title && (
                    <VisuallyHidden.Root asChild>
                      <Dialog.Title>{t('a11y.modal', 'نافذة منبثقة')}</Dialog.Title>
                    </VisuallyHidden.Root>
                  )}
                  {!description && (
                    <VisuallyHidden.Root asChild>
                      <Dialog.Description>{t('a11y.modal_content', 'محتوى النافذة المنبثقة')}</Dialog.Description>
                    </VisuallyHidden.Root>
                  )}

                  {(title || showClose) && (
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        {title && (
                          <Dialog.Title className="text-lg font-semibold text-foreground">
                            {title}
                          </Dialog.Title>
                        )}
                        {description && (
                          <Dialog.Description className="mt-1 text-sm text-neutral-400">
                            {description}
                          </Dialog.Description>
                        )}
                      </div>
                      {showClose && (
                        <Dialog.Close asChild>
                          <button
                            className="rounded-full p-2 hover:bg-neutral-100 transition-colors -mr-2 -mt-2"
                            aria-label={t('aria.close', 'إغلاق')}
                          >
                            <RiCloseLine className="h-5 w-5 text-neutral-400" />
                          </button>
                        </Dialog.Close>
                      )}
                    </div>
                  )}

                  {children}
                </m.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </ResponsiveModalContext.Provider>
  );
}

// ================================
// 组合式 API 子组件
// ================================

export interface ComposableResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
}

export interface ResponsiveModalContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * 响应式弹窗内容区域
 * @description 
 *   composable 模式：统一使用 Dialog.Content 居中弹窗
 *   非 composable 模式：移动端用 Drawer.Content，桌面端用 Dialog.Content
 */
export const ResponsiveModalContent = forwardRef<HTMLDivElement, ResponsiveModalContentProps>(
  ({ children, className }, ref) => {
    const { isMobile, isComposable } = useContext(ResponsiveModalContext);
    
    // 组合模式：统一使用 Dialog（不用 Drawer，因为 Drawer 会强制底部定位）
    if (isComposable) {
      return (
        <Dialog.Content asChild>
          <m.div
            ref={ref}
            className={cn(
              // 居中定位
              'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
              // 宽度：移动端留边距，桌面端固定最大宽度
              'w-[calc(100%-32px)] max-w-md',
              // 圆角、背景、阴影
              'rounded-2xl bg-white p-6 shadow-soft-lg',
              // flex 布局 + 最大高度，内容可滚动
              'flex flex-col max-h-[85vh]',
              className
            )}
            variants={scaleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </m.div>
        </Dialog.Content>
      );
    }

    // 非组合模式 - 移动端用 Drawer
    if (isMobile) {
      return (
        <Drawer.Content
          ref={ref}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 mt-24 flex flex-col rounded-t-2xl bg-white',
            'max-h-[90vh]',
            'pb-[env(safe-area-inset-bottom,0px)]',
            className
          )}
        >
          <div className="mx-auto mt-4 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-neutral-200" />
          <div className="flex flex-1 flex-col min-h-0 px-4 pb-4">
            {children}
          </div>
        </Drawer.Content>
      );
    }
    
    // 非组合模式 - 桌面端用 Dialog
    return (
      <Dialog.Content asChild>
        <m.div
          ref={ref}
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-soft-lg',
            'max-h-[85vh] flex flex-col',
            className
          )}
          variants={scaleVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </m.div>
      </Dialog.Content>
    );
  }
);
ResponsiveModalContent.displayName = 'ResponsiveModalContent';

/**
 * 响应式弹窗头部区域
 */
export interface ResponsiveModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveModalHeader = forwardRef<HTMLDivElement, ResponsiveModalHeaderProps>(
  ({ children, className }, ref) => (
    <div ref={ref} className={cn('mb-4 flex items-start justify-between shrink-0', className)}>
      <div className="flex-1">{children}</div>
    </div>
  )
);
ResponsiveModalHeader.displayName = 'ResponsiveModalHeader';

/**
 * 响应式弹窗标题
 * @description composable 模式下统一使用 Dialog.Title
 */
export interface ResponsiveModalTitleProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveModalTitle = forwardRef<HTMLHeadingElement, ResponsiveModalTitleProps>(
  ({ children, className }, ref) => {
    const { isMobile, isComposable } = useContext(ResponsiveModalContext);
    
    // 组合模式统一用 Dialog.Title
    if (isComposable || !isMobile) {
      return (
        <Dialog.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)}>
          {children}
        </Dialog.Title>
      );
    }
    
    // 非组合模式移动端用 Drawer.Title
    return (
      <Drawer.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)}>
        {children}
      </Drawer.Title>
    );
  }
);
ResponsiveModalTitle.displayName = 'ResponsiveModalTitle';

/**
 * 响应式弹窗描述
 * @description 支持 asChild 属性，允许自定义渲染元素（避免 p > div 嵌套错误）
 *              内容区域使用 flex-1 + overflow-y-auto 实现长内容滚动
 */
export interface ResponsiveModalDescriptionProps {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
}

export const ResponsiveModalDescription = forwardRef<HTMLElement, ResponsiveModalDescriptionProps>(
  ({ children, className, asChild = false }, ref) => {
    const { isMobile, isComposable } = useContext(ResponsiveModalContext);
    
    // 组合模式统一用 Dialog.Description
    if (isComposable || !isMobile) {
      return (
        <Dialog.Description 
          ref={ref as React.Ref<HTMLParagraphElement>} 
          className={cn(
            'mt-1 text-sm text-neutral-400',
            // 内容区域可滚动
            'flex-1 min-h-0 overflow-y-auto',
            className
          )}
          asChild={asChild}
        >
          {children}
        </Dialog.Description>
      );
    }
    
    // 非组合模式移动端用 Drawer.Description
    return (
      <Drawer.Description 
        ref={ref as React.Ref<HTMLParagraphElement>} 
        className={cn(
          'mt-1 text-sm text-neutral-400',
          'flex-1 min-h-0 overflow-y-auto',
          className
        )}
        asChild={asChild}
      >
        {children}
      </Drawer.Description>
    );
  }
);
ResponsiveModalDescription.displayName = 'ResponsiveModalDescription';

/**
 * 响应式弹窗底部区域
 * @description shrink-0 确保 Footer 始终可见，不被内容挤压
 */
export interface ResponsiveModalFooterProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveModalFooter = forwardRef<HTMLDivElement, ResponsiveModalFooterProps>(
  ({ children, className }, ref) => (
    <div 
      ref={ref} 
      className={cn(
        'mt-4 flex justify-end gap-2 shrink-0 pt-2',
        className
      )}
    >
      {children}
    </div>
  )
);
ResponsiveModalFooter.displayName = 'ResponsiveModalFooter';

/**
 * 响应式弹窗关闭按钮
 * @description composable 模式下统一使用 Dialog.Close
 */
export interface ResponsiveModalCloseProps {
  children?: ReactNode;
  className?: string;
}

export const ResponsiveModalClose = forwardRef<HTMLButtonElement, ResponsiveModalCloseProps>(
  ({ children, className }, ref) => {
    const { isMobile, isComposable } = useContext(ResponsiveModalContext);
    
    // 组合模式统一用 Dialog.Close
    if (isComposable || !isMobile) {
      return (
        <Dialog.Close ref={ref} asChild>
          <button className={cn('rounded-full p-2 hover:bg-neutral-100 transition-colors', className)}>
            {children || <RiCloseLine className="h-5 w-5 text-neutral-400" />}
          </button>
        </Dialog.Close>
      );
    }
    
    // 非组合模式移动端用 Drawer.Close
    return (
      <Drawer.Close ref={ref} className={cn('', className)}>
        {children || <RiCloseLine className="h-5 w-5 text-neutral-400" />}
      </Drawer.Close>
    );
  }
);
ResponsiveModalClose.displayName = 'ResponsiveModalClose';
