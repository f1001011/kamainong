/**
 * @file 图片上传组件
 * @description 虚线边框上传区域 + 预览模式 + 移除按钮，支持 jpg/png/webp，最大 5MB
 */

'use client';

import { useCallback, useRef } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  RiCameraLine,
  RiCloseLine,
  RiImageAddLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { SPRINGS } from '@/lib/animation/constants';
import { toast } from 'sonner';

/** 允许的文件类型 */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface ImageUploaderProps {
  /** 当前图片 URL（已上传后的地址或 ObjectURL） */
  value?: string;
  /** 图片变更回调，传 File 对象用于上传 */
  onChange: (file: File | null) => void;
  /** 上传区标签文案 */
  label?: string;
  /** 自定义样式 */
  className?: string;
}

/**
 * 图片上传组件
 * @description 未上传：虚线边框 + 相机图标；已上传：图片预览 + 右上角移除按钮
 */
export function ImageUploader({ value, onChange, label, className }: ImageUploaderProps) {
  const t = useText();
  const inputRef = useRef<HTMLInputElement>(null);

  /** 处理文件选择 */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 类型校验
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(t('community.invalid_image_type', 'يُسمح فقط بصور JPG و PNG و WebP'));
        return;
      }

      // 大小校验
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(t('community.image_too_large', 'لا يمكن أن يتجاوز حجم الصورة 5MB'));
        return;
      }

      onChange(file);

      // 重置 input 以便重复选择同一文件
      e.target.value = '';
    },
    [onChange, t],
  );

  /** 移除图片 */
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange],
  );

  return (
    <div className={cn('relative', className)}>
      {label && (
        <p className="text-sm font-medium text-neutral-700 mb-2">{label}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {value ? (
          /* 预览模式 */
          <m.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={SPRINGS.gentle}
            className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-100"
          >
            <img
              src={value}
              alt={label || 'معاينة'}
              className="w-full h-full object-cover"
            />

            {/* 半透明遮罩 + 移除按钮 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={handleRemove}
              className={cn(
                'absolute top-2 right-2 w-7 h-7 rounded-full',
                'bg-black/50 backdrop-blur-sm text-white',
                'flex items-center justify-center',
                'hover:bg-red-500 active:scale-90 transition-all',
              )}
            >
              <RiCloseLine className="size-4" />
            </button>
          </m.div>
        ) : (
          /* 上传区域 */
          <m.button
            key="upload"
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRINGS.gentle}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'w-full aspect-[4/3] rounded-xl',
              'border-2 border-dashed border-neutral-200 hover:border-primary-300',
              'bg-neutral-50/50 hover:bg-primary-50/30',
              'flex flex-col items-center justify-center gap-2',
              'transition-all cursor-pointer group',
            )}
          >
            <div className="w-12 h-12 rounded-full bg-neutral-100 group-hover:bg-primary-100/60 flex items-center justify-center transition-colors">
              <RiCameraLine className="size-6 text-neutral-400 group-hover:text-primary-500 transition-colors" />
            </div>
            <span className="text-xs text-neutral-400 group-hover:text-primary-500 transition-colors">
              {t('community.tap_to_upload', 'انقر للرفع')}
            </span>
            <span className="text-[10px] text-neutral-300">
              JPG, PNG, WebP · Max 5MB
            </span>
          </m.button>
        )}
      </AnimatePresence>
    </div>
  );
}
