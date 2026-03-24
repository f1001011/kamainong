/**
 * @file 登录表单组件
 * @description 深色毛玻璃主题输入框
 * 半透明暗色输入框 + 金色聚焦发光 + 精美按钮
 * 2026高端美学：登录成功触觉反馈 + 按钮渐变微光
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { m } from 'motion/react';
import { toast } from 'sonner';
import Link from 'next/link';

import { loginSchema, type LoginFormData } from '@/lib/validations';
import { useText } from '@/hooks/use-text';
import { useUserStore } from '@/stores/user';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import api from '@/lib/api';
import { SPRINGS } from '@/lib/animation/constants';
import { haptic } from '@/lib/haptic';

import {
  RiPhoneLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiCheckLine,
} from '@remixicon/react';

import type { User } from '@/types';

interface LoginResponse {
  token: string;
  user: User;
}

export function LoginForm() {
  const router = useRouter();
  const t = useText();
  const { setUser, setToken } = useUserStore();
  const { isAnimationEnabled, getSpring } = useAnimationConfig();
  const [redirectPath, setRedirectPath] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectPath(params.get('redirect') || '/');
  }, []);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakePhone, setShakePhone] = useState(false);
  const [shakePassword, setShakePassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const triggerShake = (field: 'phone' | 'password') => {
    if (field === 'phone') {
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 500);
    } else {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 500);
    }
  };

  const handleApiError = (code: string) => {
    haptic('error');
    
    switch (code) {
      case 'INVALID_CREDENTIALS':
        toast.error(t('error.invalid_credentials', 'رقم الهاتف أو كلمة المرور غير صحيحة'));
        triggerShake('password');
        break;
      case 'USER_BANNED':
        toast.error(t('error.user_banned', 'تم تعليق حسابك. تواصل مع الدعم.'));
        break;
      case 'RATE_LIMITED':
        toast.error(t('error.rate_limited', 'محاولات كثيرة جداً. انتظر لحظة.'));
        break;
      case 'USER_NOT_FOUND':
        toast.error(t('error.user_not_found', 'المستخدم غير موجود'));
        triggerShake('phone');
        break;
      default:
        toast.error(t('toast.login_failed', 'فشل تسجيل الدخول'));
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    let loginSucceeded = false;
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        phone: data.phone,
        password: data.password,
      });
      loginSucceeded = true;
      setToken(response.token);
      setUser(response.user);
      document.cookie = `token=${response.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      haptic('success');
      
      setIsSuccess(true);
      toast.success(t('toast.login_success', 'تم تسجيل الدخول بنجاح'));
      
      // 使用 window.location.href 作为可靠跳转，避免 router.push 被各种因素阻断
      setTimeout(() => {
        window.location.href = redirectPath;
      }, 600);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        handleApiError((error as { code: string }).code);
      } else {
        haptic('error');
        toast.error(t('toast.network_error', 'خطأ في الشبكة، حاول مرة أخرى'));
      }
    } finally {
      if (!loginSucceeded) {
        setIsSubmitting(false);
      }
    }
  };

  const onInvalid = () => {
    if (errors.phone) triggerShake('phone');
    if (errors.password) triggerShake('password');
  };

  const shakeAnimation = { x: [-8, 8, -4, 4, 0], transition: { duration: 0.4 } };

  const inputBaseClass = `
    w-full h-11 pl-10 pr-4
    bg-white/[0.07] border rounded-xl
    text-white placeholder:text-white/30
    transition-all duration-200
    focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/40
    focus:bg-white/[0.1]
    disabled:bg-white/[0.03] disabled:cursor-not-allowed
  `;

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
      {/* 标题区域 */}
      <div className="text-center mb-3">
        <h1 className="text-xl font-bold text-white mb-1">
          {t('page.login_title', 'تسجيل الدخول')}
        </h1>
        <p className="text-xs text-white/45">
          {t('page.login_subtitle', 'أدخل حسابك للمتابعة')}
        </p>
      </div>

      {/* 手机号 - 带 +212 国家代码前缀 */}
      <m.div
        animate={shakePhone && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-white/60">
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
              text-white placeholder:text-white/30
              transition-all duration-200
              focus:outline-none focus:ring-1 focus:ring-amber-400/40 focus:border-amber-400/40
              focus:bg-white/[0.1]
              disabled:bg-white/[0.03] disabled:cursor-not-allowed
              ${errors.phone ? 'border-red-400/60 focus:ring-red-400/30 focus:border-red-400/60' : 'border-white/10'}
            `}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.phone.message || '', errors.phone.message || '')}
          </p>
        )}
      </m.div>

      {/* 密码 */}
      <m.div
        animate={shakePassword && isAnimationEnabled ? shakeAnimation : {}}
        className="space-y-2"
      >
        <label className="block text-sm font-medium text-white/60">
          {t('label.password', 'كلمة المرور')}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
            <RiLockPasswordLine className="w-5 h-5" />
          </div>
          <input
            {...register('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder={t('placeholder.password', 'أدخل كلمة المرور')}
            disabled={isSubmitting}
            autoComplete="current-password"
            className={`${inputBaseClass} pr-12 ${errors.password ? 'border-red-400/60 focus:ring-red-400/30 focus:border-red-400/60' : 'border-white/10'}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors p-1"
            tabIndex={-1}
          >
            {showPassword ? <RiEyeOffLine className="w-5 h-5" /> : <RiEyeLine className="w-5 h-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 mt-1">
            {t(errors.password.message || '', errors.password.message || '')}
          </p>
        )}
      </m.div>

      {/* 忘记密码链接 */}
      <div className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs text-white/35 hover:text-amber-400/70 transition-colors"
        >
          {t('link.forgot_password', 'هل نسيت كلمة المرور؟')}
        </Link>
      </div>

      {/* 登录按钮 */}
      <m.button
        type="submit"
        disabled={isSubmitting || isSuccess}
        whileHover={isAnimationEnabled && !isSubmitting && !isSuccess ? { scale: 1.02 } : {}}
        whileTap={isAnimationEnabled && !isSubmitting && !isSuccess ? { scale: 0.97 } : {}}
        transition={getSpring('snappy')}
        animate={isSuccess ? { scale: [1, 1.05, 1] } : {}}
        className={`
          w-full h-11 rounded-xl font-bold text-sm tracking-wide
          ${isSuccess 
            ? 'bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.3)]' 
            : 'bg-white text-neutral-900 hover:bg-white/90'
          }
          focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent
          disabled:cursor-not-allowed
          transition-all duration-300
          flex items-center justify-center gap-2
        `}
        style={!isSuccess ? {
          boxShadow: '0 4px 20px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.03)',
        } : undefined}
      >
        {isSuccess ? (
          <m.div
            className="flex items-center gap-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRINGS.bouncy}
          >
            <RiCheckLine className="w-5 h-5" />
            {t('toast.login_success', 'تم تسجيل الدخول بنجاح')}
          </m.div>
        ) : isSubmitting ? (
          <>
            <RiLoader4Line className="w-5 h-5 animate-spin" />
            {t('btn.logging_in', 'جارٍ الدخول...')}
          </>
        ) : (
          t('btn.login', 'تسجيل الدخول')
        )}
      </m.button>

      {/* 注册链接 */}
      <p className="text-center text-sm text-white/40">
        {t('tip.no_account', 'ليس لديك حساب؟')}{' '}
        <Link
          href="/register"
          className="text-amber-400/80 font-semibold hover:text-amber-400 transition-colors"
        >
          {t('link.go_register', 'سجّل الآن')}
        </Link>
      </p>
    </form>
  );
}
