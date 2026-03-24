/**
 * @file 首页系统公告弹窗
 * @description "Obsidian Aurora 5.0" - Magic UI 灵感高端公告弹窗
 * 增强效果：
 * - 毛玻璃遮罩背景（backdrop-filter: blur）
 * - 奢华入场动画（scale + blur + translateY 组合）
 * - 更精致的卡片阴影和圆角
 * - 头部渐变装饰线
 * - 按钮 hover shimmer 效果
 *
 * 使用纯 React Portal + 内联样式确保定位不被覆盖
 * 所有定位使用 inline style
 * @depends 开发文档.md 第12.3节 - 系统公告弹窗
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RiNotification3Fill, RiCloseLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { useText } from '@/hooks/use-text';
import { useRouter } from 'next/navigation';
import { sanitizeHtml } from '@/lib/sanitize';

// ================================
// 类型定义
// ================================

export interface AnnouncementButton {
  text: string;
  type: 'primary' | 'default';
  action: 'close' | 'link';
  url?: string;
}

export interface AnnouncementData {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  buttons?: AnnouncementButton[] | null;
  createdAt: string;
}

export interface HomeAnnouncementModalProps {
  announcement?: AnnouncementData | null;
  open?: boolean;
  onClose?: () => void;
  onConfirm?: (id: number) => void;
  onDismiss?: (id: number) => void;
  className?: string;
}

// ================================
// 本地存储逻辑
// ================================

function getDismissedAnnouncements(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('dismissed_announcements');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveDismissedAnnouncement(id: number): void {
  if (typeof window === 'undefined') return;
  try {
    const dismissed = getDismissedAnnouncements();
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem('dismissed_announcements', JSON.stringify(dismissed.slice(-50)));
    }
  } catch { /* 忽略 */ }
}

export function isAnnouncementDismissed(id: number): boolean {
  return getDismissedAnnouncements().includes(id);
}

// ================================
// 内联样式定义 - 5.0 高端版本（毛玻璃 + 奢华阴影）
// ================================

/** 遮罩层样式 - 毛玻璃效果 */
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 9999,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  WebkitBackdropFilter: 'blur(12px) saturate(1.2)',
  backdropFilter: 'blur(12px) saturate(1.2)',
  animation: 'modal-overlay-in 0.35s ease-out forwards',
};

/** 居中容器样式 */
const centerContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
};

/** 弹窗卡片样式 - 奢华版本 */
const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  maxHeight: 'calc(100vh - 64px)',
  backgroundColor: '#ffffff',
  borderRadius: '20px',
  boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1), 0 0 80px rgba(var(--color-primary-rgb),0.06)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  animation: 'modal-luxury-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
};

/** 头部样式 */
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  padding: '20px 24px 8px 24px',
  flexShrink: 0,
  position: 'relative',
};

/** 内容区域样式 */
const contentStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '8px 24px',
};

/** 底部样式 - 渐变分割线 */
const footerStyle: React.CSSProperties = {
  padding: '14px 24px 22px 24px',
  flexShrink: 0,
  borderTop: 'none',
  position: 'relative',
};

// ================================
// 组件
// ================================

export function HomeAnnouncementModal({
  announcement,
  open = false,
  onClose,
  onConfirm,
  onDismiss,
}: HomeAnnouncementModalProps) {
  const t = useText();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 客户端挂载检测（Portal 需要 DOM）
  useEffect(() => {
    setMounted(true);
  }, []);

  // 同步外部 open 状态
  useEffect(() => {
    if (open) {
      setIsOpen(true);
      setIsClosing(false);
    }
  }, [open]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 注入动画 CSS（只注入一次）
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = 'announcement-modal-animation-v5';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes modal-close-out {
        from { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        to { opacity: 0; transform: scale(0.95) translateY(8px); filter: blur(4px); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  /** 关闭动画后再真正关闭 */
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      onClose?.();
    }, 250);
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (announcement) onConfirm?.(announcement.id);
    handleClose();
  }, [announcement, onConfirm, handleClose]);

  const handleButtonClick = useCallback((button: AnnouncementButton) => {
    if (button.action === 'link' && button.url) {
      if (button.url.startsWith('/')) router.push(button.url);
      else window.open(button.url, '_blank');
    }
    handleClose();
    if (announcement) onConfirm?.(announcement.id);
  }, [announcement, onConfirm, handleClose, router]);

  const handleDismiss = useCallback(() => {
    if (announcement) {
      saveDismissedAnnouncement(announcement.id);
      onDismiss?.(announcement.id);
    }
    handleClose();
  }, [announcement, onDismiss, handleClose]);

  // 不渲染条件
  if (!announcement || !isOpen || !mounted) return null;

  const hasCustomButtons = announcement.buttons && announcement.buttons.length > 0;

  // 关闭动画样式覆盖
  const closingCardStyle: React.CSSProperties = isClosing
    ? { ...cardStyle, animation: 'modal-close-out 0.25s ease-in forwards' }
    : cardStyle;

  const closingOverlayStyle: React.CSSProperties = isClosing
    ? { ...overlayStyle, opacity: 0, transition: 'opacity 0.25s ease-in' }
    : overlayStyle;

  const modalContent = (
    <>
      {/* 遮罩层 - 毛玻璃效果 */}
      <div style={closingOverlayStyle} onClick={handleClose} />

      {/* 居中容器 */}
      <div style={centerContainerStyle}>
        {/* 弹窗卡片 - 奢华设计 */}
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-title"
          style={closingCardStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 卡片顶部渐变装饰线 */}
          <div
            style={{
              height: '3px',
              background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-500), var(--color-primary-600), var(--color-primary-500), var(--color-primary-400))',
              backgroundSize: '200% 100%',
              animation: 'gradient-flow 3s ease infinite',
              flexShrink: 0,
              borderRadius: '20px 20px 0 0',
            }}
          />

          {/* 公告图片 */}
          {announcement.imageUrl && (
            <div style={{ width: '100%', aspectRatio: '750/400', overflow: 'hidden', flexShrink: 0 }}>
              <img
                src={announcement.imageUrl}
                alt={announcement.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* 头部 */}
          <div style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              {/* 图标容器 - 品牌色渐变圆 */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-primary-500))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(var(--color-primary-rgb),0.25)',
                }}
              >
                <RiNotification3Fill style={{ width: '16px', height: '16px', color: '#ffffff' }} />
              </div>
              <h2
                id="announcement-title"
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#1a1a1a',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {announcement.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              aria-label={t('common.close')}
              style={{
                border: 'none',
                background: '#f5f5f4',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#e7e5e4';
                (e.target as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = '#f5f5f4';
                (e.target as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <RiCloseLine style={{ width: '18px', height: '18px', color: '#78716c', pointerEvents: 'none' }} />
            </button>
          </div>

          {/* 内容区域 - 可滚动 */}
          <div style={contentStyle}>
            <div
              className="prose prose-sm prose-neutral max-w-none text-sm text-neutral-500 leading-relaxed"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.content) }}
            />
          </div>

          {/* 底部按钮 - 渐变分割线 */}
          <div style={footerStyle}>
            {/* 精致渐变分割线 */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20px',
                right: '20px',
                height: '1px',
                background: 'linear-gradient(90deg, transparent, #e7e5e4 30%, #e7e5e4 70%, transparent)',
              }}
            />
            {hasCustomButtons ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                {announcement.buttons!.map((button, index) => (
                  <Button
                    key={index}
                    variant={button.type === 'primary' ? 'primary' : 'secondary'}
                    onClick={() => handleButtonClick(button)}
                    className="flex-1"
                  >
                    {button.text}
                  </Button>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-neutral-400 text-xs hover:text-neutral-500"
                >
                  {t('announcement.dontShowAgain')}
                </Button>
                <Button onClick={handleConfirm} size="sm">
                  {t('common.close')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // 使用 Portal 渲染到 body
  return createPortal(modalContent, document.body);
}
