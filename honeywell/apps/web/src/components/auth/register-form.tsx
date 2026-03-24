/**
 * @file 注册表单组件
 * @description 深色毛玻璃主题注册表单 - 输入框动画、密码强度指示、邀请码锁定、错误抖动
 * @reference 开发文档/03-前端用户端/03.1-登录注册/03.1.2-注册页.md
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { m } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';

import { phoneSchema, createPasswordSchema, inviteCodeSchema } from '@/lib/validations';
import { z } from 'zod';
import { useText } from '@/hooks/use-text';
import { useUserStore } from '@/stores/user';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfig } from '@/hooks/use-global-config';
import api from '@/lib/api';

import { PasswordStrength } from './password-strength';
import { SuccessRewardModal } from '@/components/effects/success-reward-modal';

import {
  RiPhoneLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiGiftLine,
  RiLockLine,
  RiShieldCheckLine,
} from '@remixicon/react';

import type { User } from '@/types';

interface RegisterResponse {
  token: string;
  user: User;
}

interface RegisterFormProps {
  defaultInviteCode: string;
  isInviteCodeLocked: boolean;
}

export function RegisterForm({ defaultInviteCode, isInviteCodeLocked }: RegisterFormProps) {
  const router = useRouter();
  const t = useText();
  const { setUser, setToken } = useUserStore();
  const { isAnimationEnabled, getSpring } = useAnimationConfig();
  const { config } = useGlobalConfig();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakePhone, setShakePhone] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);
  const [shakeConfirmPassword, setShakeConfirmPassword] = useState(false);
  const [shakeInviteCode, setShakeInviteCode] = useState(false);
  const [shakeLockIcon, setShakeLockIcon] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [registerRewardAmount, setRegisterRewardAmount] = useState(0);

  const registerSchema = useMemo(() => {
    const pwSchema = createPasswordSchema({
      minLength: config.passwordMinLength ?? 6,
      maxLength: config.passwordMaxLength ?? 32,
      requireLetter: config.passwordRequireLetter ?? true,
      requireNumber: config.passwordRequireNumber ?? true,
    });
    return z.object({
      phone: phoneSchema,
      password: pwSchema,
      confirmPassword: z.string(),
      inviteCode: inviteCodeSchema,
    }).refine((data) => data.password === data.confirmPassword, {
      message: 'كلمات المرور غير متطابقة',
      path: ['confirmPassword'],
    });
  }, [config]);

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phone: '',
      password: '',
      confirmPassword: '',
      inviteCode: defaultInviteCode,
    },
  });

  const passwordValue = watch('password', '');

  const triggerShake = useCallback((field: 'phone' | 'password' | 'confirmPassword' | 'inviteCode') => {
    const setShake = {
      phone: setShakePhone,
      password: setShakePassword,
      confirmPassword: setShakeConfirmPassword,
      inviteCode: setShakeInviteCode,
    }[field];

    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleLockedInviteCodeClick = useCallback(() => {
    setShakeLockIcon(true);
    setTimeout(() => setShakeLockIcon(false), 300);
    toast.info(t('tip.invite_code_locked', 'هذا الرمز من رابط الدعوة الخاص بك'));
  }, [t]);

  const handleApiError = useCallback((code: string) => {
    switch (code) {
      case 'PHONE_ALREADY_EXISTS':
        toast.error(t('error.phone_already_exists', 'هذا الرقم مسجل بالفعل'));
        triggerShake('phone');
        break;
      case 'INVALID_INVITE_CODE':
        toast.warning(t('error.invalid_invite_code', 'رمز الدعوة غير صالح'));
        break;
      case 'REGISTER_IP_LIMIT':
        toast.error(t('error.register_ip_limit', 'عدد كبير من التسجيلات من هذا العنوان'));
        break;
      case 'RATE_LIMITED':
        toast.error(t('error.rate_limited', 'محاولات كثيرة جداً. انتظر لحظة.'));
        break;
      default:
        toast.error(t('toast.register_failed', 'فشل التسجيل'));
    }
  }, [t, triggerShake]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);

    try {
      const response = await api.post<RegisterResponse>('/auth/register', {
        phone: data.phone,
        password: data.password,
        inviteCode: data.inviteCode || undefined,
      });

      setToken(response.token);
      setUser(response.user);
      document.cookie = `token=${response.token}; path=/; max-age=${7 * 24 * 60 * 60}`;

      const rewardAmount = Number(config.registerBonus) || 0;
      if (rewardAmount > 0 && isAnimationEnabled) {
        setRegisterRewardAmount(rewardAmount);
        setShowRewardModal(true);
      } else {
        toast.success(t('toast.register_success', 'تم التسجيل بنجاح'));
        router.push('/');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        handleApiError((error as { code: string }).code);
      } else {
        toast.error(t('toast.network_error', 'خطأ في الشبكة، حاول مرة أخرى'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = () => {
    if (errors.phone) triggerShake('phone');
    if (errors.password) triggerShake('password');
    if (errors.confirmPassword) triggerShake('confirmPassword');
    if (errors.inviteCode) triggerShake('inviteCode');
  };

  const shakeAnimation = {
    x: [-8, 8, -4, 4, 0],
    transition: { duration: 0.4 },
  };

  const lockShakeAnimation = {
    rotate: [-5, 5, -3, 3, 0],
    transition: { duration: 0.3 },
  };

  const inputClass = `
    w-full h-11 pl-10 pr-4
    bg-white/[0.07] border rounded-xl
    text-white placeholder:text-white/30 text-sm
    transition-all duration-200
    focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/40
    focus:bg-white/[0.1]
    disabled:bg-white/[0.03] disabled:cursor-not-allowed
  `;

  const errorBorder = 'border-red-400/60 focus:ring-red-400/30 focus:border-red-400/60';
  const normalBorder = 'border-white/10';

  return (
    <>
    <SuccessRewardModal
      open={showRewardModal}
      onClose={() => {
        setShowRewardModal(false);
        router.push('/');
      }}
      scene="register"
      amount={registerRewardAmount}
      checkmarkTheme="gold"
      showConfetti
      showSparkles
      showLightRays
      onPrimaryAction={() => {
        setShowRewardModal(false);
        router.push('/');
      }}
      onSecondaryAction={() => {
        setShowRewardModal(false);
        router.push('/profile');
      }}
    />

    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-3">
      {/* 标题区域 */}
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold text-white mb-1">
          {t('page.register_title', 'إنشاء حساب')}
        </h1>
        <p className="text-xs text-white/45">
          {t('page.register_subtitle', 'سجّل للبدء')}
        </p>
      </div>

      {/* 手机号输入框 - 带 +212 国家代码前缀 */}
      <m.div
        animate={shakePhone && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-1"
      >
        <label className="block text-xs font-medium text-white/60">
          {t('label.phone', 'رقم الهاتف')}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-0 top-0 bottom-0 flex items-center pl-3 gap-2 pointer-events-none">
            <RiPhoneLine className="w-5 h-5 text-white/30" />
            <span className="text-sm font-medium text-white/45 select-none">
              {t('label.phone_prefix', '+212')}
            </span>
            <div className="w-px h-5 bg-white/10" />
          </div>
          <input
            {...register('phone')}
            type="tel"
            inputMode="numeric"
            maxLength={9}
            placeholder={t('placeholder.phone', 'أدخل 9 أرقام')}
            disabled={isSubmitting}
            autoComplete="tel"
            className={`
              w-full h-11 pl-[5.5rem] pr-4
              bg-white/[0.07] border rounded-xl
              text-white placeholder:text-white/30 text-sm
              transition-all duration-200
              focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/40
              focus:bg-white/[0.1]
              disabled:bg-white/[0.03] disabled:cursor-not-allowed
              ${errors.phone ? errorBorder : normalBorder}
            `}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.phone.message || '', errors.phone.message || '')}
          </p>
        )}
      </m.div>

      {/* 密码输入框 */}
      <m.div
        animate={shakePassword && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-1"
      >
        <label className="block text-xs font-medium text-white/60">
          {t('label.password', 'كلمة المرور')}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <RiLockPasswordLine className="w-5 h-5" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('placeholder.password_register', `أحرف + أرقام، الحد الأدنى ${config.passwordMinLength ?? 6}`)}
            disabled={isSubmitting}
            autoComplete="new-password"
            className={`${inputClass} pr-12 ${errors.password ? errorBorder : normalBorder}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? (
              <RiEyeOffLine className="w-5 h-5" />
            ) : (
              <RiEyeLine className="w-5 h-5" />
            )}
          </button>
        </div>

        <PasswordStrength password={passwordValue} />

        {errors.password && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.password.message || '', errors.password.message || '')}
          </p>
        )}
      </m.div>

      {/* 确认密码输入框 */}
      <m.div
        animate={shakeConfirmPassword && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-1"
      >
        <label className="block text-xs font-medium text-white/60">
          {t('label.confirm_password', 'تأكيد كلمة المرور')}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <RiShieldCheckLine className="w-5 h-5" />
          </div>
          <input
            {...register('confirmPassword')}
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder={t('placeholder.confirm_password', 'أعد إدخال كلمة المرور')}
            disabled={isSubmitting}
            autoComplete="new-password"
            className={`${inputClass} pr-12 ${errors.confirmPassword ? errorBorder : normalBorder}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <RiEyeOffLine className="w-5 h-5" />
            ) : (
              <RiEyeLine className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.confirmPassword.message || '', errors.confirmPassword.message || '')}
          </p>
        )}
      </m.div>

      {/* 邀请码输入框 */}
      <m.div
        animate={shakeInviteCode && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-1"
      >
        <label className="block text-xs font-medium text-white/60">
          {t('label.invite_code', 'رمز الدعوة')}
          {!isInviteCodeLocked && (
            <span className="text-white/30 font-normal ml-1">
              ({t('label.optional', 'اختياري')})
            </span>
          )}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <RiGiftLine className="w-5 h-5" />
          </div>

          {isInviteCodeLocked ? (
            <div
              onClick={handleLockedInviteCodeClick}
              className="w-full h-11 pl-10 pr-12
                         bg-white/[0.04] border border-white/10 rounded-xl
                         flex items-center text-white/50 cursor-not-allowed
                         transition-all duration-200"
            >
              {defaultInviteCode}
              <m.div
                animate={shakeLockIcon && isAnimationEnabled ? lockShakeAnimation : {}}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
              >
                <RiLockLine className="w-5 h-5" />
              </m.div>
            </div>
          ) : (
            <input
              {...register('inviteCode')}
              type="text"
              maxLength={8}
              placeholder={t('placeholder.invite_code', 'أدخل رمز من 8 أحرف')}
              disabled={isSubmitting}
              autoComplete="off"
              className={`${inputClass} ${errors.inviteCode ? errorBorder : normalBorder}`}
            />
          )}
        </div>

        {isInviteCodeLocked && (
          <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
            <RiLockLine className="w-3 h-3" />
            {t('tip.invite_from_link', 'من رابط الدعوة')}
          </p>
        )}

        {errors.inviteCode && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.inviteCode.message || '', errors.inviteCode.message || '')}
          </p>
        )}
      </m.div>

      {/* 注册按钮 */}
      <m.button
        type="submit"
        disabled={isSubmitting}
        whileHover={isAnimationEnabled && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={isAnimationEnabled && !isSubmitting ? { scale: 0.97 } : {}}
        transition={getSpring('snappy')}
        className="
          w-full h-11 rounded-xl font-bold text-sm tracking-wide
          bg-white text-neutral-900 hover:bg-white/90
          focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
          disabled:opacity-70 disabled:cursor-not-allowed
          transition-colors duration-200
          flex items-center justify-center gap-2
        "
        style={{
          boxShadow: '0 4px 20px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.03)',
        }}
      >
        {isSubmitting ? (
          <>
            <RiLoader4Line className="w-5 h-5 animate-spin" />
            {t('btn.registering', 'جارٍ التسجيل...')}
          </>
        ) : (
          t('btn.register', 'تسجيل')
        )}
      </m.button>

      {/* 登录链接 */}
      <p className="text-center text-sm text-white/40">
        {t('tip.has_account', 'لديك حساب بالفعل؟')}{' '}
        <Link
          href="/login"
          className="text-amber-400/80 font-semibold hover:text-amber-400 transition-colors"
        >
          {t('link.go_login', 'تسجيل الدخول')}
        </Link>
      </p>
    </form>
    </>
  );
}
