/**
 * @file 图片预览组件
 * @description 支持点击放大、缩放、拖动查看的图片预览组件
 * @reference 开发文档/03-前端/03.3-页面/03.3.2-产品详情页.md - 图片预览功能
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence, type PanInfo } from 'motion/react';
import { RiCloseLine, RiZoomInLine, RiZoomOutLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation';

export interface ImagePreviewProps {
  /** 图片URL */
  src: string;
  /** 图片alt文本 */
  alt?: string;
  /** 缩略图URL（可选，默认使用src） */
  thumbnail?: string;
  /** 容器类名 */
  className?: string;
  /** 图片类名 */
  imageClassName?: string;
  /** 子元素（可选，用于自定义触发区域） */
  children?: React.ReactNode;
  /** 是否显示缩放控制 */
  showZoomControls?: boolean;
}

// 缩放限制
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

/**
 * 图片预览组件
 * @description 点击图片打开全屏预览，支持缩放和拖动
 * 
 * @example
 * ```tsx
 * // 基本用法
 * <ImagePreview src="/product-image.jpg" alt="产品图片" />
 * 
 * // 自定义触发区域
 * <ImagePreview src="/product-image.jpg">
 *   <img src="/thumbnail.jpg" className="w-full rounded-xl" />
 * </ImagePreview>
 * ```
 */
export function ImagePreview({
  src,
  alt = '',
  thumbnail,
  className,
  imageClassName,
  children,
  showZoomControls = true,
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  
  const { isAnimationEnabled } = useAnimationConfig();
  const t = useText();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 客户端挂载检测（Portal需要）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 打开预览
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // 重置状态
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
  }, []);

  // 关闭预览
  const handleClose = useCallback(() => {
    setIsOpen(false);
    // 恢复背景滚动
    document.body.style.overflow = '';
  }, []);

  // 放大
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  // 缩小
  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      // 缩小到1倍时重置位置
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // 双击切换缩放
  const handleDoubleClick = useCallback(() => {
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  }, [zoom]);

  // 拖动处理
  const handleDrag = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (zoom <= 1) return;
      
      setPosition((prev) => ({
        x: prev.x + info.delta.x,
        y: prev.y + info.delta.y,
      }));
    },
    [zoom]
  );

  // 背景点击关闭
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // 只有点击背景才关闭，点击图片不关闭
      if (e.target === containerRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );

  // 键盘事件
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, handleZoomIn, handleZoomOut]);

  // 触发区域
  const trigger = children || (
    <img
      src={thumbnail || src}
      alt={alt}
      className={cn(
        'cursor-zoom-in transition-transform duration-200 hover:scale-[1.02]',
        imageClassName
      )}
      loading="lazy"
    />
  );

  // 预览弹层
  const previewPortal = mounted && createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={containerRef}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          initial={isAnimationEnabled ? { opacity: 0 } : undefined}
          animate={isAnimationEnabled ? { opacity: 1 } : undefined}
          exit={isAnimationEnabled ? { opacity: 0 } : undefined}
          transition={isAnimationEnabled ? { duration: 0.2 } : undefined}
          onClick={handleBackdropClick}
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top">
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label={t('aria.close_preview')}
            >
              <RiCloseLine className="h-6 w-6 text-white" />
            </button>

            {/* 缩放控制 */}
            {showZoomControls && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors',
                    zoom <= MIN_ZOOM
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/20'
                  )}
                  aria-label={t('aria.zoom_out')}
                >
                  <RiZoomOutLine className="h-5 w-5 text-white" />
                </button>
                
                <span className="min-w-[48px] text-center text-sm font-medium text-white tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors',
                    zoom >= MAX_ZOOM
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/20'
                  )}
                  aria-label={t('aria.zoom_in')}
                >
                  <RiZoomInLine className="h-5 w-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* 图片 */}
          <m.img
            ref={imageRef}
            src={src}
            alt={alt}
            className={cn(
              'max-h-[85vh] max-w-[90vw] select-none object-contain',
              zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            )}
            initial={isAnimationEnabled ? { scale: 0.9, opacity: 0 } : undefined}
            animate={
              isAnimationEnabled
                ? {
                    scale: zoom,
                    x: position.x,
                    y: position.y,
                    opacity: 1,
                  }
                : { scale: zoom, x: position.x, y: position.y }
            }
            exit={isAnimationEnabled ? { scale: 0.9, opacity: 0 } : undefined}
            transition={isAnimationEnabled ? SPRINGS.gentle : { duration: 0 }}
            onDoubleClick={handleDoubleClick}
            drag={zoom > 1}
            dragConstraints={{
              top: -200 * zoom,
              bottom: 200 * zoom,
              left: -200 * zoom,
              right: 200 * zoom,
            }}
            dragElastic={0.1}
            onDrag={handleDrag}
            draggable={false}
          />

          {/* 底部提示 */}
          <div className="absolute bottom-6 left-0 right-0 text-center safe-area-bottom">
            <p className="text-xs text-white/60">
              {zoom > 1 
                ? t('tip.image_drag') 
                : t('tip.image_zoom')}
            </p>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {/* 触发区域 */}
      <div
        className={cn('cursor-zoom-in', className)}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        {trigger}
      </div>

      {/* 预览弹层（Portal） */}
      {previewPortal}
    </>
  );
}

export default ImagePreview;
