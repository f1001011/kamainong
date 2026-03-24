/**
 * @file 海报预览组件
 * @description 实时预览海报效果，支持拖拽定位二维码和邀请码
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.4-邀请海报配置页.md 第9.3节
 */

'use client';

import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Empty, Typography, Image as AntImage } from 'antd';
import { RiDragMove2Line, RiQrCodeLine, RiText } from '@remixicon/react';
import { QRCodeSVG } from 'qrcode.react';
import { SAMPLE_INVITE_CODE, SAMPLE_INVITE_URL } from '@/types/poster';

const { Text } = Typography;

/**
 * 预览组件属性
 */
interface PosterPreviewProps {
  /** 背景图URL */
  backgroundImage?: string;
  /** 二维码X坐标（百分比） */
  qrCodePositionX: number;
  /** 二维码Y坐标（百分比） */
  qrCodePositionY: number;
  /** 二维码尺寸（像素） */
  qrCodeSize: number;
  /** 邀请码X坐标（百分比） */
  inviteCodePositionX: number;
  /** 邀请码Y坐标（百分比） */
  inviteCodePositionY: number;
  /** 邀请码字体大小（像素） */
  inviteCodeFontSize: number;
  /** 邀请码字体颜色 */
  inviteCodeColor: string;
  /** 二维码位置变化回调 */
  onQrCodePositionChange?: (x: number, y: number) => void;
  /** 邀请码位置变化回调 */
  onInviteCodePositionChange?: (x: number, y: number) => void;
}

/**
 * 当前拖拽元素类型
 */
type DraggingElement = 'qrcode' | 'invitecode' | null;

/**
 * 海报预览组件
 * @description 支持实时预览和拖拽定位
 */
export function PosterPreview({
  backgroundImage,
  qrCodePositionX = 37,
  qrCodePositionY = 78,
  qrCodeSize = 180,
  inviteCodePositionX = 50,
  inviteCodePositionY = 94,
  inviteCodeFontSize = 16,
  inviteCodeColor = '#333333',
  onQrCodePositionChange,
  onInviteCodePositionChange,
}: PosterPreviewProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [draggingElement, setDraggingElement] = useState<DraggingElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 重置图片加载状态
  useEffect(() => {
    if (backgroundImage) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [backgroundImage]);

  /**
   * 计算二维码样式
   */
  const qrCodeStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: `${qrCodePositionX}%`,
      top: `${qrCodePositionY}%`,
      transform: 'translate(-50%, -50%)',
      cursor: draggingElement === 'qrcode' ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      transition: isDragging && draggingElement === 'qrcode' ? 'none' : 'all 0.15s ease',
      zIndex: draggingElement === 'qrcode' ? 20 : 10,
    }),
    [qrCodePositionX, qrCodePositionY, draggingElement, isDragging]
  );

  /**
   * 计算邀请码样式
   */
  const inviteCodeStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      left: `${inviteCodePositionX}%`,
      top: `${inviteCodePositionY}%`,
      transform: 'translateX(-50%)',
      fontSize: inviteCodeFontSize,
      color: inviteCodeColor,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontWeight: 600,
      cursor: draggingElement === 'invitecode' ? 'grabbing' : 'grab',
      userSelect: 'none' as const,
      letterSpacing: '0.08em',
      transition: isDragging && draggingElement === 'invitecode' ? 'none' : 'all 0.15s ease',
      textShadow: '0 1px 2px rgba(255,255,255,0.8)',
      zIndex: draggingElement === 'invitecode' ? 20 : 10,
    }),
    [inviteCodePositionX, inviteCodePositionY, inviteCodeFontSize, inviteCodeColor, draggingElement, isDragging]
  );

  /**
   * 计算新坐标（限制在0-100范围内）
   */
  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!posterRef.current) return null;
    
    const rect = posterRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    
    return { x: Math.round(x), y: Math.round(y) };
  }, []);

  /**
   * 处理二维码拖拽开始
   */
  const handleQrCodeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingElement('qrcode');
      setIsDragging(true);

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        
        const pos = calculatePosition(clientX, clientY);
        if (pos && onQrCodePositionChange) {
          onQrCodePositionChange(pos.x, pos.y);
        }
      };

      const handleUp = () => {
        setDraggingElement(null);
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
    },
    [calculatePosition, onQrCodePositionChange]
  );

  /**
   * 处理邀请码拖拽开始
   */
  const handleInviteCodeMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingElement('invitecode');
      setIsDragging(true);

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
        const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
        
        const pos = calculatePosition(clientX, clientY);
        if (pos && onInviteCodePositionChange) {
          onInviteCodePositionChange(pos.x, pos.y);
        }
      };

      const handleUp = () => {
        setDraggingElement(null);
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleUp);
    },
    [calculatePosition, onInviteCodePositionChange]
  );

  // 如果没有背景图，显示空状态
  if (!backgroundImage) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 400,
          backgroundColor: '#fafafa',
          border: '2px dashed #d9d9d9',
          borderRadius: 12,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: '#8c8c8c' }}>请先上传海报背景图</span>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* 手机模拟框 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 375,
          backgroundColor: '#000',
          borderRadius: 24,
          padding: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}
      >
        {/* 手机屏幕 */}
        <div
          ref={posterRef}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '9 / 16',
            borderRadius: 16,
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
          }}
        >
          {/* 背景图 */}
          {!imageError ? (
            <img
              src={backgroundImage}
              alt="海报背景"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
              draggable={false}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f0f0f0',
                color: '#999',
              }}
            >
              图片加载失败
            </div>
          )}

          {/* 二维码（可拖拽） */}
          <div
            style={qrCodeStyle}
            onMouseDown={handleQrCodeMouseDown}
            onTouchStart={handleQrCodeMouseDown}
            title="拖拽调整二维码位置"
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: 6,
                borderRadius: 6,
                boxShadow: draggingElement === 'qrcode'
                  ? '0 8px 24px rgba(22, 119, 255, 0.4)'
                  : '0 2px 8px rgba(0,0,0,0.15)',
                border: draggingElement === 'qrcode' ? '2px solid #1677ff' : '2px solid transparent',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }}
            >
              <QRCodeSVG
                value={SAMPLE_INVITE_URL}
                size={Math.min(qrCodeSize * 0.4, 120)}
                level="M"
                includeMargin={false}
              />
            </div>
            {/* 拖拽指示器 */}
            <div
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 20,
                height: 20,
                backgroundColor: '#1677ff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              <RiDragMove2Line size={12} color="#fff" />
            </div>
          </div>

          {/* 邀请码（可拖拽） */}
          <div
            style={inviteCodeStyle}
            onMouseDown={handleInviteCodeMouseDown}
            onTouchStart={handleInviteCodeMouseDown}
            title="拖拽调整邀请码位置"
          >
            <div
              style={{
                position: 'relative',
                padding: '4px 8px',
                backgroundColor: draggingElement === 'invitecode' ? 'rgba(22, 119, 255, 0.1)' : 'transparent',
                borderRadius: 4,
                border: draggingElement === 'invitecode' ? '1px dashed #1677ff' : '1px dashed transparent',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {SAMPLE_INVITE_CODE}
              {/* 拖拽指示器 */}
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 16,
                  height: 16,
                  backgroundColor: '#1677ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <RiDragMove2Line size={10} color="#fff" />
              </div>
            </div>
          </div>

          {/* 辅助网格线（拖拽时显示） */}
          {isDragging && (
            <>
              {/* 中心垂直线 */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: 'rgba(22, 119, 255, 0.3)',
                  pointerEvents: 'none',
                }}
              />
              {/* 中心水平线 */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(22, 119, 255, 0.3)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* 坐标信息显示 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: 375,
        }}
      >
        {/* 二维码信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <RiQrCodeLine size={16} style={{ color: '#1677ff' }} />
          <Text type="secondary">二维码</Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            X: {qrCodePositionX}%
          </Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            Y: {qrCodePositionY}%
          </Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            {qrCodeSize}px
          </Text>
        </div>

        {/* 邀请码信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <RiText size={16} style={{ color: '#1677ff' }} />
          <Text type="secondary">邀请码</Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            X: {inviteCodePositionX}%
          </Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            Y: {inviteCodePositionY}%
          </Text>
          <Text code style={{ fontFamily: 'monospace' }}>
            {inviteCodeFontSize}px
          </Text>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 2,
              backgroundColor: inviteCodeColor,
              border: '1px solid #e0e0e0',
            }}
          />
        </div>
      </div>

      {/* 拖拽提示 */}
      <div style={{ textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          <RiDragMove2Line size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          拖拽二维码或邀请码可直接调整位置，坐标会自动同步到左侧表单
        </Text>
      </div>
    </div>
  );
}

export default PosterPreview;
