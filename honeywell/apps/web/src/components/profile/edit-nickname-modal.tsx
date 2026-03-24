/**
 * @file 编辑昵称弹窗组件
 * @description 用于修改用户昵称，支持长度限制和敏感词过滤提示
 * @depends 开发文档/03-前端用户端/03.7.1-个人中心页.md
 */

'use client';

import { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { cn } from '@/lib/utils';

/**
 * 编辑昵称弹窗属性
 */
export interface EditNicknameModalProps {
  /** 是否打开 */
  open: boolean;
  /** 打开状态变化回调 */
  onOpenChange: (open: boolean) => void;
  /** 当前昵称 */
  currentNickname: string | null;
  /** 提交回调 */
  onSubmit: (nickname: string) => Promise<void>;
  /** 是否正在提交 */
  isSubmitting?: boolean;
}

/**
 * 编辑昵称弹窗组件
 * @description 依据：开发文档/03.7.1-个人中心页.md
 * 
 * 功能要点：
 * - 输入框带字符计数
 * - 支持配置化的长度限制
 * - 提交时显示加载状态
 * 
 * @example
 * ```tsx
 * <EditNicknameModal
 *   open={showModal}
 *   onOpenChange={setShowModal}
 *   currentNickname={user.nickname}
 *   onSubmit={handleUpdateNickname}
 * />
 * ```
 */
export function EditNicknameModal({
  open,
  onOpenChange,
  currentNickname,
  onSubmit,
  isSubmitting = false,
}: EditNicknameModalProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  
  // 昵称最大长度（从配置获取，默认20）
  const maxLength = config.nicknameMaxLength || 20;
  const minLength = config.nicknameMinLength || 2;
  
  // 输入值
  const [value, setValue] = useState('');
  
  // 错误信息
  const [error, setError] = useState<string | null>(null);

  // 初始化值
  useEffect(() => {
    if (open) {
      setValue(currentNickname || '');
      setError(null);
    }
  }, [open, currentNickname]);

  /**
   * 处理输入变化
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // 限制最大长度
    if (newValue.length <= maxLength) {
      setValue(newValue);
      setError(null);
    }
  };

  /**
   * 验证昵称
   */
  const validateNickname = (nickname: string): boolean => {
    const trimmed = nickname.trim();
    
    if (trimmed.length < minLength) {
      setError(t('error.nickname_too_short', `يجب أن يتكون الاسم من ${minLength} أحرف على الأقل`));
      return false;
    }
    
    if (trimmed.length > maxLength) {
      setError(t('error.nickname_too_long', `لا يمكن أن يتجاوز الاسم ${maxLength} حرفًا`));
      return false;
    }
    
    return true;
  };

  /**
   * 处理提交
   */
  const handleSubmit = async () => {
    const trimmed = value.trim();
    
    if (!validateNickname(trimmed)) {
      return;
    }
    
    try {
      await onSubmit(trimmed);
      onOpenChange(false);
    } catch (err) {
      // 错误处理由父组件的 onSubmit 负责
      console.error('更新昵称失败:', err);
    }
  };

  /**
   * 处理回车提交
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('modal.edit_nickname_title', 'تعديل الاسم')}
      showClose={!isSubmitting}
      dismissible={!isSubmitting}
    >
      <div className="space-y-4">
        {/* 输入框 */}
        <div>
          <Input
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder.nickname', 'أدخل اسمك')}
            maxLength={maxLength}
            disabled={isSubmitting}
            autoFocus
            className={cn(
              error && 'border-error focus:border-error focus:ring-error/20'
            )}
          />
          
          {/* 字符计数和错误信息 */}
          <div className="flex justify-between mt-1.5 px-1">
            {error ? (
              <span className="text-xs text-error">{error}</span>
            ) : (
              <span className="text-xs text-neutral-400">
                {t('hint.nickname_length', `${minLength}-${maxLength} حرف`)}
              </span>
            )}
            <span className={cn(
              'text-xs',
              value.length >= maxLength ? 'text-error' : 'text-neutral-400'
            )}>
              {value.length}/{maxLength}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('btn.cancel', 'إلغاء')}
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!value.trim() || value.trim() === currentNickname}
          >
            {t('btn.save', 'حفظ')}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

EditNicknameModal.displayName = 'EditNicknameModal';
