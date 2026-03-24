/**
 * @file 编辑头像弹窗组件
 * @description 用于上传和修改用户头像
 * @depends 开发文档/03-前端用户端/03.7.1-个人中心页.md
 * @depends 02.3-前端API接口清单.md 第1.11节 - POST /api/upload
 */

'use client';

import { useState, useRef } from 'react';
import { RiImageAddLine, RiCloseLine } from '@remixicon/react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * 编辑头像弹窗属性
 */
export interface EditAvatarModalProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 当前头像URL */
  currentAvatar: string | null;
  /** 上传成功回调（返回新头像URL） */
  onUpload: (file: File) => Promise<string>;
  /** 保存回调（使用新头像URL更新用户信息） */
  onSave: (avatarUrl: string) => Promise<void>;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

/**
 * 支持的图片格式
 */
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 编辑头像弹窗组件
 * @description 依据：开发文档/03.7.1-个人中心页.md
 * 
 * 功能要点：
 * - 支持点击选择或拖拽上传
 * - 图片预览
 * - 文件大小限制（从配置获取）
 * - 支持的格式：JPG/PNG/GIF/WEBP
 * 
 * @example
 * ```tsx
 * <EditAvatarModal
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   currentAvatar={user.avatar}
 *   onUpload={handleUpload}
 *   onSave={handleSaveAvatar}
 * />
 * ```
 */
export function EditAvatarModal({
  open,
  onOpenChange,
  currentAvatar,
  onUpload,
  onSave,
  isSubmitting = false,
}: EditAvatarModalProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  
  // 头像最大尺寸（从配置获取，默认2MB）
  const maxSizeKB = config.avatarMaxSize || 2048;
  const maxSizeBytes = maxSizeKB * 1024;
  
  // 选择的文件
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 预览URL
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // 上传状态
  const [isUploading, setIsUploading] = useState(false);
  // 已上传的URL
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 默认头像
  const defaultAvatar = '/images/avatar-default.png';

  /**
   * 重置状态
   */
  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setIsUploading(false);
  };

  /**
   * 处理弹窗关闭
   */
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  /**
   * 验证文件
   */
  const validateFile = (file: File): boolean => {
    // 检查文件类型
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error(t('error.invalid_image_format', 'صيغة الصورة غير صالحة. استخدم JPG أو PNG أو GIF أو WEBP'));
      return false;
    }
    
    // 检查文件大小
    if (file.size > maxSizeBytes) {
      toast.error(t('error.file_too_large', `الملف كبير جدًا. الحد الأقصى ${maxSizeKB / 1024}MB`));
      return false;
    }
    
    return true;
  };

  /**
   * 处理文件选择
   */
  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) {
      return;
    }
    
    setSelectedFile(file);
    setUploadedUrl(null);
    
    // 创建预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  /**
   * 处理文件输入变化
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // 重置 input 以允许选择相同文件
    e.target.value = '';
  };

  /**
   * 处理拖拽
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /**
   * 点击选择区域
   */
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  /**
   * 清除已选择的文件
   */
  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
  };

  /**
   * 处理保存
   */
  const handleSave = async () => {
    if (!selectedFile && !uploadedUrl) {
      return;
    }
    
    try {
      let avatarUrl = uploadedUrl;
      
      // 如果还没上传，先上传
      if (!avatarUrl && selectedFile) {
        setIsUploading(true);
        avatarUrl = await onUpload(selectedFile);
        setUploadedUrl(avatarUrl);
        setIsUploading(false);
      }
      
      // 保存头像
      if (avatarUrl) {
        await onSave(avatarUrl);
        handleOpenChange(false);
      }
    } catch (err) {
      setIsUploading(false);
      console.error('头像上传/保存失败:', err);
    }
  };

  // 当前显示的图片
  const displayImage = previewUrl || currentAvatar || defaultAvatar;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title={t('modal.edit_avatar_title', 'تعديل صورة الملف الشخصي')}
      showClose={!isSubmitting && !isUploading}
      dismissible={!isSubmitting && !isUploading}
    >
      <div className="space-y-4">
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* 头像预览/上传区 */}
        <div className="flex flex-col items-center gap-4">
          {/* 预览图 */}
          <div className="relative">
            <div className={cn(
              'w-32 h-32 rounded-full overflow-hidden',
              'border-2 border-neutral-200',
              'shadow-soft-md'
            )}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt="معاينة الصورة الشخصية"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
            </div>
            
            {/* 清除按钮（仅当有选择新文件时显示） */}
            {previewUrl && (
              <button
                type="button"
                onClick={handleClearFile}
                className={cn(
                  'absolute -top-1 -right-1',
                  'w-6 h-6 rounded-full',
                  'bg-error text-white',
                  'flex items-center justify-center',
                  'shadow-soft-md',
                  'hover:bg-red-600'
                )}
                aria-label={t('action.clear', 'مسح')}
              >
                <RiCloseLine className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 上传区域 */}
          <div
            onClick={handleClickUpload}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={cn(
              'w-full py-6 px-4',
              'border-2 border-dashed border-neutral-200 rounded-xl',
              'bg-neutral-50',
              'cursor-pointer',
              'hover:border-primary-300 hover:bg-primary-50/30',
              'transition-colors duration-200',
              'text-center'
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleClickUpload();
              }
            }}
          >
            <RiImageAddLine className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">
              {t('hint.click_or_drag', 'انقر أو اسحب صورة')}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {t('hint.image_format', `JPG, PNG, GIF, WEBP (الحد الأقصى ${maxSizeKB / 1024}MB)`)}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting || isUploading}
          >
            {t('btn.cancel', 'إلغاء')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSave}
            isLoading={isSubmitting || isUploading}
            disabled={!selectedFile && !uploadedUrl}
          >
            {t('btn.save', 'حفظ')}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

EditAvatarModal.displayName = 'EditAvatarModal';
