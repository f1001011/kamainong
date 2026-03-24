/**
 * @file 修改密码页
 * @description 用户修改密码页面，修改成功后自动退出登录
 * @depends 开发文档/03-前端用户端/03.7.3-修改密码页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 * @depends 02.3-前端API接口清单.md - PUT /api/user/password
 *
 * 路由路径: /security/password
 * 页面标题: page.change_password → "تغيير كلمة المرور"
 *
 * 2026高端美学设计要点：
 * - 银行级安全视觉感
 * - 大间距表单设计
 * - 密码强度指示器（根据配置显示）
 * - 修改成功自动退出
 */
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
} from '@remixicon/react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useUserStore } from '@/stores/user';
import { cn } from '@/lib/utils';
import { slideUpVariants, listContainerVariants, listItemVariants } from '@/lib/animation/variants';

interface ChangePasswordFormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 密码强度计算函数
 * @description 依据：03.7.3-修改密码页.md 第3.4节
 * 弱：仅满足最低长度要求
 * 中：满足长度 + 包含字母和数字
 * 强：满足长度 + 字母 + 数字 + 特殊字符或长度 >= 12
 */
function calculatePasswordStrength(password: string, minLen: number = 6): 'weak' | 'medium' | 'strong' | null {
  if (!password || password.length < minLen) return null;

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLong = password.length >= minLen + 4;

  if (hasLetter && hasNumber && (hasSpecial || isLong)) {
    return 'strong';
  }
  if (hasLetter && hasNumber) {
    return 'medium';
  }
  return 'weak';
}

/**
 * 密码强度指示器组件
 * @description 依据：03.7.3-修改密码页.md 第4.6-4.7节
 */
function PasswordStrengthIndicator({
  password,
  show,
  minLength = 6,
}: {
  password: string;
  show: boolean;
  minLength?: number;
}) {
  const t = useText();

  if (!show || !password) return null;

  const strength = calculatePasswordStrength(password, minLength);
  if (!strength) return null;

  const strengthConfig = {
    weak: {
      width: '30%',
      gradient: 'bg-gradient-to-r from-red-400 to-gold-400',
      label: 'password.weak',
      color: 'text-red-500',
    },
    medium: {
      width: '60%',
      gradient: 'bg-gradient-to-r from-gold-400 to-gold-500',
      label: 'password.medium',
      color: 'text-gold-500',
    },
    strong: {
      width: '100%',
      gradient: 'bg-gradient-to-r from-primary-400 to-primary-300',
      label: 'password.strong',
      color: 'text-primary-500',
    },
  };

  const config = strengthConfig[strength];

  return (
    <div className="space-y-1.5 mt-2">
      {/* 强度条 */}
      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <m.div
          initial={{ width: 0 }}
          animate={{ width: config.width }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('h-full rounded-full', config.gradient)}
        />
      </div>

      {/* 强度文字 */}
      <p className={cn('text-xs', config.color)}>
        {t(config.label)}
      </p>
    </div>
  );
}

/**
 * 密码输入框组件
 * @description 依据：03.7.3-修改密码页.md 第6.6节
 */
function PasswordInput({
  label,
  placeholder,
  error,
  showPassword,
  onToggleVisibility,
  disabled,
  ...inputProps
}: {
  label: string;
  placeholder: string;
  error?: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
  disabled?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">
        {label}
        <span className="text-red-500 ml-0.5">*</span>
      </label>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full h-12 px-4 pr-12 rounded-xl border transition-colors',
            'focus:outline-none focus:ring-2',
            error
              ? 'border-red-400 focus:ring-red-100'
              : 'border-neutral-200 focus:border-primary-400 focus:ring-primary-100',
            disabled && 'bg-neutral-100 cursor-not-allowed'
          )}
          {...inputProps}
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? (
            <RiEyeOffLine className="w-5 h-5" />
          ) : (
            <RiEyeLine className="w-5 h-5" />
          )}
        </button>
      </div>

      {error && (
        <m.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500"
        >
          {error}
        </m.p>
      )}
    </div>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const t = useText();
  const { config: globalConfig } = useGlobalConfig();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const { logout: logoutStore } = useUserStore();

  // 密码显示状态
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // 从全局配置获取密码规则
  const passwordConfig = useMemo(() => {
    return {
      minLength: globalConfig?.passwordMinLength ?? 6,
      maxLength: globalConfig?.passwordMaxLength ?? 32,
      requireLetter: globalConfig?.passwordRequireLetter ?? true,
      requireNumber: globalConfig?.passwordRequireNumber ?? true,
      showStrength: globalConfig?.passwordShowStrength ?? true,
    };
  }, [globalConfig]);

  // 动态创建表单验证 Schema
  const formSchema = useMemo(() => {
    return z.object({
      oldPassword: z.string().min(1, t('error.old_password_required')),
      newPassword: z.string()
        .min(passwordConfig.minLength, t.withVars('error.password_min_length', { min: passwordConfig.minLength }))
        .max(passwordConfig.maxLength, t.withVars('error.password_max_length', { max: passwordConfig.maxLength }))
        .refine(
          (val) => !passwordConfig.requireLetter || /[a-zA-Z]/.test(val),
          t('error.password_letter')
        )
        .refine(
          (val) => !passwordConfig.requireNumber || /\d/.test(val),
          t('error.password_number')
        ),
      confirmPassword: z.string().min(1, t('error.confirm_password_required')),
    }).refine(
      (data) => data.newPassword === data.confirmPassword,
      {
        message: t('error.password_mismatch'),
        path: ['confirmPassword'],
      }
    ).refine(
      (data) => data.oldPassword !== data.newPassword,
      {
        message: t('error.same_password'),
        path: ['newPassword'],
      }
    );
  }, [t, passwordConfig]);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  // 修改密码 mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) =>
      api.put<void>('/user/password', data as unknown as Record<string, unknown>),
    onSuccess: () => {
      // 显示成功提示
      toast.success(t('toast.password_changed'));

      // 延迟清除 Token 并跳转（给用户看到成功提示的时间）
      setTimeout(() => {
        // 1. 清除所有本地 Token
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');

        // 2. 清除用户状态（通过 store）
        logoutStore();

        // 3. 跳转登录页
        router.replace('/login');

        // 4. 显示重新登录提示
        toast.info(t('toast.redirect_login'));
      }, 1500);
    },
    onError: (error: Error & { code?: string }) => {
      // 依据：03.7.3-修改密码页.md 第6.5节 - 错误处理
      switch (error.code) {
        case 'OLD_PASSWORD_WRONG':
          // 聚焦旧密码输入框
          setError('oldPassword', { message: t('error.old_password_wrong') });
          setFocus('oldPassword');
          break;
        case 'SAME_PASSWORD':
          setError('newPassword', { message: t('error.same_password') });
          setFocus('newPassword');
          break;
        case 'VALIDATION_ERROR':
          toast.error(t('error.password_validation'));
          break;
        case 'RATE_LIMITED':
          toast.error(t('error.rate_limited'));
          break;
        default:
          toast.error(t('error.network'));
      }
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    await changePasswordMutation.mutateAsync({
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  const togglePasswordVisibility = (field: 'old' | 'new' | 'confirm') => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const isSubmitting = changePasswordMutation.isPending;

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        <m.div
          variants={slideUpVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="min-h-screen bg-immersive"
        >
          {/* 顶部导航 */}
          <header className="h-14 flex items-center px-4 gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center -ml-2"
            >
              <RiArrowLeftSLine className="w-6 h-6 text-neutral-600" />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-neutral-800">
              {t('page.change_password')}
            </h1>
          </header>

          {/* 内容区域 */}
          <m.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="px-4 md:px-6 md:max-w-md md:mx-auto pt-6"
          >
            {/* 表单卡片 */}
            <m.form
              variants={listItemVariants}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-6 space-y-5"
            >
              {/* 旧密码 */}
              <m.div variants={listItemVariants}>
                <PasswordInput
                  label={t('label.old_password')}
                  placeholder={t('placeholder.old_password')}
                  error={errors.oldPassword?.message}
                  showPassword={showPassword.old}
                  onToggleVisibility={() => togglePasswordVisibility('old')}
                  disabled={isSubmitting}
                  {...register('oldPassword')}
                />
              </m.div>

              {/* 新密码 */}
              <m.div variants={listItemVariants}>
                <PasswordInput
                  label={t('label.new_password')}
                  placeholder={t('placeholder.new_password')}
                  error={errors.newPassword?.message}
                  showPassword={showPassword.new}
                  onToggleVisibility={() => togglePasswordVisibility('new')}
                  disabled={isSubmitting}
                  {...register('newPassword')}
                />

                {/* 密码强度指示器 - 根据配置显示 */}
                <PasswordStrengthIndicator
                  password={newPassword}
                  show={passwordConfig.showStrength}
                  minLength={passwordConfig.minLength}
                />

                {/* 密码规则提示 */}
                <p className="text-xs text-neutral-400 mt-2">
                  {t.withVars('tip.password_rule', { min: passwordConfig.minLength })}
                </p>
              </m.div>

              {/* 确认密码 */}
              <m.div variants={listItemVariants}>
                <PasswordInput
                  label={t('label.confirm_password')}
                  placeholder={t('placeholder.confirm_password')}
                  error={errors.confirmPassword?.message}
                  showPassword={showPassword.confirm}
                  onToggleVisibility={() => togglePasswordVisibility('confirm')}
                  disabled={isSubmitting}
                  {...register('confirmPassword')}
                />
              </m.div>

              {/* 提交按钮 */}
              <m.div variants={listItemVariants} className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    'w-full h-12 rounded-xl font-medium text-white',
                    'transition-all duration-200',
                    isSubmitting
                      ? 'bg-neutral-300 cursor-not-allowed'
                      : 'bg-primary-500 shadow-glow-sm hover:bg-primary-600 active:scale-[0.98]'
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <RiLoader4Line className="w-5 h-5 animate-spin" />
                      {t('btn.submitting')}
                    </span>
                  ) : (
                    t('btn.submit')
                  )}
                </button>
              </m.div>
            </m.form>
          </m.div>

          {/* 底部留白 */}
          <div className="h-20 md:h-4" />
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
