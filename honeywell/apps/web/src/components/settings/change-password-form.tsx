/**
 * @file 修改密码表单组件
 * @description 修改密码表单，包含旧密码、新密码、确认密码输入框
 * @depends 开发文档/03-前端用户端/03.7.3-修改密码页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 * @depends 复用 components/auth/password-strength.tsx
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { m } from 'motion/react';
import {
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { PasswordStrength } from '@/components/auth/password-strength';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';

/**
 * 修改密码表单数据类型
 */
interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * 修改密码表单属性
 */
export interface ChangePasswordFormProps {
  /** 提交回调 */
  onSubmit: (data: { oldPassword: string; newPassword: string }) => Promise<void>;
  /** 是否正在提交 */
  isSubmitting?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 修改密码表单组件
 * @description 2026高端美学设计
 * - 大间距输入框
 * - 密码强度指示器
 * - 显示/隐藏密码切换
 * - 银行级安全视觉感
 * 
 * @example
 * ```tsx
 * <ChangePasswordForm
 *   onSubmit={handleChangePassword}
 *   isSubmitting={isPending}
 * />
 * ```
 */
export function ChangePasswordForm({
  onSubmit,
  isSubmitting = false,
  className,
}: ChangePasswordFormProps) {
  const t = useText();
  const { config } = useGlobalConfig();

  // 密码显示/隐藏状态
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 获取密码规则配置（从全局配置获取）
  const passwordMinLength = config.passwordMinLength ?? 6;
  const passwordMaxLength = config.passwordMaxLength ?? 32;
  const passwordRequireLetter = config.passwordRequireLetter ?? true;
  const passwordRequireNumber = config.passwordRequireNumber ?? true;

  /**
   * 表单验证 Schema
   * @description 依据：开发文档.md 第4.1节 - 密码规则
   * 密码必须包含字母和数字，长度从全局配置读取
   */
  const formSchema = z.object({
    oldPassword: z.string()
      .min(1, t('validation.required')),
    newPassword: z.string()
      .min(passwordMinLength, t.withVars('validation.password_min_length', { min: passwordMinLength }))
      .max(passwordMaxLength, t.withVars('validation.password_max_length', { max: passwordMaxLength }))
      .refine(
        (val) => !passwordRequireLetter || /[A-Za-z]/.test(val),
        t('validation.password_require_letter')
      )
      .refine(
        (val) => !passwordRequireNumber || /\d/.test(val),
        t('validation.password_require_number')
      ),
    confirmPassword: z.string()
      .min(1, t('validation.required')),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('validation.password_not_match'),
    path: ['confirmPassword'],
  }).refine((data) => data.oldPassword !== data.newPassword, {
    message: t('validation.password_same_as_old'),
    path: ['newPassword'],
  });

  // 表单状态
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // 监听新密码值（用于密码强度指示器）
  const newPassword = watch('newPassword');

  /**
   * 表单提交处理
   */
  const handleFormSubmit = async (data: ChangePasswordFormData) => {
    await onSubmit({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  /**
   * 渲染密码显示/隐藏按钮
   */
  const renderPasswordToggle = (show: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-neutral-400 hover:text-neutral-600 transition-colors p-1"
      tabIndex={-1}
    >
      {show ? (
        <RiEyeOffLine className="w-5 h-5" />
      ) : (
        <RiEyeLine className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <m.form
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
    >
      {/* 旧密码 */}
      <m.div variants={listItemVariants}>
        <FormField
          label={t('security.old_password')}
          error={errors.oldPassword?.message}
          required
        >
          <Input
            type={showOldPassword ? 'text' : 'password'}
            placeholder={t('placeholder.old_password')}
            leftElement={<RiLockPasswordLine className="w-5 h-5 text-neutral-400" />}
            rightElement={renderPasswordToggle(showOldPassword, () => setShowOldPassword(!showOldPassword))}
            error={errors.oldPassword?.message}
            disabled={isSubmitting}
            {...register('oldPassword')}
          />
        </FormField>
      </m.div>

      {/* 新密码 */}
      <m.div variants={listItemVariants}>
        <FormField
          label={t('security.new_password')}
          error={errors.newPassword?.message}
          helperText={t.withVars('security.password_hint', { min: passwordMinLength })}
          required
        >
          <Input
            type={showNewPassword ? 'text' : 'password'}
            placeholder={t('placeholder.new_password')}
            leftElement={<RiLockPasswordLine className="w-5 h-5 text-neutral-400" />}
            rightElement={renderPasswordToggle(showNewPassword, () => setShowNewPassword(!showNewPassword))}
            error={errors.newPassword?.message}
            disabled={isSubmitting}
            {...register('newPassword')}
          />
          {/* 密码强度指示器 - 复用注册页组件 */}
          <PasswordStrength password={newPassword} />
        </FormField>
      </m.div>

      {/* 确认新密码 */}
      <m.div variants={listItemVariants}>
        <FormField
          label={t('security.confirm_password')}
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('placeholder.confirm_password')}
            leftElement={<RiLockPasswordLine className="w-5 h-5 text-neutral-400" />}
            rightElement={renderPasswordToggle(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register('confirmPassword')}
          />
        </FormField>
      </m.div>

      {/* 提交按钮 */}
      <m.div variants={listItemVariants} className="pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText={t('btn.submitting')}
        >
          {t('btn.change_password')}
        </Button>
      </m.div>
    </m.form>
  );
}

ChangePasswordForm.displayName = 'ChangePasswordForm';
