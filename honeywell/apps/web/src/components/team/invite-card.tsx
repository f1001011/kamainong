/**
 * @file 邀请卡片组件
 * @description 显示邀请码、邀请链接、二维码分享功能
 * @reference 开发文档/03.10.1-我的团队页.md
 */

'use client';

import { memo, useCallback, useState } from 'react';
import { m } from 'motion/react';
import { 
  RiFileCopyLine, 
  RiQrCodeLine,
  RiCheckLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { CopyButton } from '@/components/ui/copy-button';
import { SPRINGS } from '@/lib/animation';

/**
 * 邀请信息类型
 * @description 依据：02.3-前端API接口清单.md GET /api/invite/info
 */
export interface InviteInfo {
  /** 邀请码 */
  inviteCode: string;
  /** 邀请链接 */
  inviteLink: string;
  /** 二维码图片URL（Base64 Data URL） */
  qrCodeUrl?: string;
  /** 已邀请人数 */
  inviteCount?: number;
  /** 累计返佣 */
  totalCommission?: string;
}

/**
 * 邀请卡片组件属性
 */
interface InviteCardProps {
  /** 邀请信息 */
  inviteInfo: InviteInfo;
  /** 打开分享海报弹窗 */
  onOpenPoster?: () => void;
  /** 自定义样式 */
  className?: string;
}

/**
 * 邀请卡片组件
 * @description 大号邀请码 + 复制按钮、邀请链接 + 复制按钮、二维码分享按钮
 * 
 * @example
 * ```tsx
 * <InviteCard inviteInfo={info} onOpenPoster={() => setShowPoster(true)} />
 * ```
 */
export const InviteCard = memo(function InviteCard({
  inviteInfo,
  onOpenPoster,
  className,
}: InviteCardProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const [linkCopied, setLinkCopied] = useState(false);
  
  /**
   * 复制链接按钮点击处理
   */
  const handleCopyLink = useCallback(async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(inviteInfo.inviteLink);
      } else {
        // Fallback: 使用 execCommand
        const textarea = document.createElement('textarea');
        textarea.value = inviteInfo.inviteLink;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      setLinkCopied(true);
      toast.success(t('toast.copy_success'));
      
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      toast.error(t('toast.copy_failed'));
    }
  }, [inviteInfo.inviteLink, t]);
  
  return (
    <m.div
      className={cn(
        'rounded-2xl bg-white border border-neutral-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4',
        className
      )}
      initial={isAnimationEnabled ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRINGS.gentle, delay: 0.1 }}
    >
      <h3 className="text-sm font-bold text-neutral-800 mb-3">
        {t('team.inviteTitle')}
      </h3>
      
      {/* 邀请码展示 */}
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3 flex items-center justify-between">
        <span className="text-lg font-bold font-mono text-primary-500 tracking-wider">
          {inviteInfo.inviteCode}
        </span>
        <CopyButton
          text={inviteInfo.inviteCode}
          className="shrink-0"
        />
      </div>
      
      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        <button
          className="rounded-xl border border-neutral-200 bg-white h-11 text-sm font-semibold text-neutral-600 flex items-center justify-center gap-2"
          onClick={handleCopyLink}
        >
          {linkCopied
            ? <RiCheckLine className="w-4 h-4 text-success" />
            : <RiFileCopyLine className="w-4 h-4" />
          }
          {linkCopied
            ? t('status.copied')
            : t('team.copyLink')
          }
        </button>
        
        <button
          className="rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 h-11 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(var(--color-primary-rgb),0.2)] flex items-center justify-center gap-2"
          onClick={onOpenPoster}
        >
          <RiQrCodeLine className="w-4 h-4" />
          {t('team.sharePoster')}
        </button>
      </div>
    </m.div>
  );
});

export default InviteCard;
