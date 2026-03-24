/**
 * @file 分享海报弹窗组件
 * @description 生成包含邀请二维码的分享海报，支持保存到相册
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { m } from 'motion/react';
import { 
  RiDownloadLine, 
  RiShareLine,
  RiLoader4Line,
  RiCheckLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfigStore } from '@/stores/global-config';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SPRINGS } from '@/lib/animation';

/**
 * 海报数据类型
 * @description 依据：02.3-前端API接口清单.md GET /api/invite/poster
 */
export interface PosterData {
  /** 二维码图片URL */
  qrCodeUrl: string;
  /** 海报背景图URL（可选） */
  backgroundUrl?: string;
  /** 邀请码 */
  inviteCode: string;
  /** 邀请链接 */
  inviteLink: string;
}

/**
 * 分享海报弹窗组件属性
 */
interface SharePosterModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 海报数据 */
  posterData?: PosterData;
  /** 是否加载中 */
  isLoading?: boolean;
}

/**
 * JSBridge 类型声明
 */
declare global {
  interface Window {
    JSBridge?: {
      saveImageToGallery?: (imageUrl: string, callback?: (success: boolean) => void) => void;
    };
  }
}

/**
 * 分享海报弹窗组件
 * @description 显示二维码海报，支持保存到相册（App）或下载（H5）
 * 
 * @example
 * ```tsx
 * <SharePosterModal 
 *   open={showPoster} 
 *   onOpenChange={setShowPoster}
 *   posterData={posterData}
 * />
 * ```
 */
export const SharePosterModal = memo(function SharePosterModal({
  open,
  onOpenChange,
  posterData,
  isLoading = false,
}: SharePosterModalProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const config = useGlobalConfigStore((s) => s.config);
  const posterRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // 重置保存状态
  useEffect(() => {
    if (!open) {
      setIsSaved(false);
    }
  }, [open]);
  
  /**
   * 保存海报到相册/下载
   */
  const handleSave = useCallback(async () => {
    if (!posterData?.qrCodeUrl || isSaving) return;
    
    setIsSaving(true);
    
    try {
      // 优先使用 JSBridge 保存到相册（App环境）
      if (window.JSBridge?.saveImageToGallery) {
        window.JSBridge.saveImageToGallery(posterData.qrCodeUrl, (success) => {
          setIsSaving(false);
          if (success) {
            setIsSaved(true);
            toast.success(t('toast.saveSuccess', 'تم الحفظ بنجاح'));
          } else {
            toast.error(t('toast.saveFailed', 'خطأ في الحفظ'));
          }
        });
        return;
      }
      
      // H5 环境：下载图片
      const response = await fetch(posterData.qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `invite_${posterData.inviteCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setIsSaved(true);
      toast.success(t('toast.downloadSuccess', 'تم التحميل بنجاح'));
    } catch (error) {
      console.error('Save poster failed:', error);
      toast.error(t('toast.saveFailed', 'خطأ في الحفظ'));
    } finally {
      setIsSaving(false);
    }
  }, [posterData, isSaving, t]);
  
  /**
   * 分享功能（使用 Web Share API）
   */
  const handleShare = useCallback(async () => {
    if (!posterData) return;
    
    // 检查是否支持 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title: config?.siteName || 'lendlease',
          text: t('team.shareText', 'انضم واربح معي!'),
          url: posterData.inviteLink,
        });
      } catch (error) {
        // 用户取消分享不显示错误
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      // 不支持时复制链接
      try {
        await navigator.clipboard.writeText(posterData.inviteLink);
        toast.success(t('toast.copy_success', 'تم نسخ الرابط'));
      } catch {
        toast.error(t('toast.copyFailed', 'خطأ في النسخ'));
      }
    }
  }, [posterData, config, t]);
  
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('team.sharePosterTitle', 'مشاركة')}
    >
      <div className="flex flex-col items-center px-4 pb-6">
        {/* 海报预览区 */}
        <div
          ref={posterRef}
          className={cn(
            'relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden',
            'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600',
            'shadow-soft-lg'
          )}
        >
          {isLoading ? (
            /* 加载骨架 */
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
              <Skeleton className="w-40 h-40 rounded-xl bg-white/20" />
              <Skeleton className="w-32 h-6 mt-4 bg-white/20" />
              <Skeleton className="w-24 h-4 mt-2 bg-white/20" />
            </div>
          ) : posterData ? (
            /* 海报内容 */
            <m.div
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              initial={isAnimationEnabled ? { opacity: 0, scale: 0.9 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRINGS.gentle}
            >
              {/* 站点 Logo/名称 */}
              <div className="mb-4">
                {config?.siteLogo ? (
                  <img 
                    src={config.siteLogo} 
                    alt={config.siteName}
                    className="h-8 object-contain"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {config?.siteName || 'lendlease'}
                  </span>
                )}
              </div>
              
              {/* 二维码 */}
              <div className="w-40 h-40 bg-white rounded-xl p-3 shadow-soft">
                <img
                  src={posterData.qrCodeUrl}
                  alt="رمز QR"
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* 邀请码 */}
              <div className="mt-4 text-center">
                <p className="text-white/80 text-sm mb-1">
                  {t('team.inviteCode', 'رمز الدعوة')}
                </p>
                <p className="font-mono text-2xl font-bold text-white tracking-wider">
                  {posterData.inviteCode}
                </p>
              </div>
              
              {/* 口号 */}
              <p className="mt-4 text-white/70 text-sm text-center">
                {t('team.posterSlogan', 'امسح وانضم لتربح!')}
              </p>
            </m.div>
          ) : null}
        </div>
        
        {/* 操作按钮 */}
        <div className="w-full max-w-[280px] mt-6 grid grid-cols-2 gap-3">
          {/* 保存按钮 */}
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleSave}
            isLoading={isSaving}
            disabled={!posterData || isLoading}
            leftIcon={
              isSaved ? (
                <RiCheckLine className="w-5 h-5 text-primary-500" />
              ) : (
                <RiDownloadLine className="w-5 h-5" />
              )
            }
          >
            {isSaved 
              ? t('team.saved', 'تم الحفظ') 
              : t('team.save', 'حفظ')
            }
          </Button>
          
          {/* 分享按钮 */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleShare}
            disabled={!posterData || isLoading}
            leftIcon={<RiShareLine className="w-5 h-5" />}
          >
            {t('team.share', 'مشاركة')}
          </Button>
        </div>
        
        {/* 提示文字 */}
        <p className="mt-4 text-sm text-neutral-500 text-center">
          {t('team.shareHint', 'شارك مع أصدقائك لكسب العمولات')}
        </p>
      </div>
    </ResponsiveModal>
  );
});

export default SharePosterModal;
