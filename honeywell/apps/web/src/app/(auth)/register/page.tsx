/**
 * @file 注册页
 * @description 视频背景上的深色毛玻璃注册卡片
 * 与登录页统一的深色半透明卡片设计
 */

'use client';

import { m } from 'motion/react';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RegisterForm } from '@/components/auth/register-form';
import { useAnimationConfig } from '@/hooks/use-animation-config';

function RegisterFormWrapper() {
  const searchParams = useSearchParams();
  const inviteCodeFromUrl = searchParams.get('ref') || '';
  const isInviteCodeLocked = !!inviteCodeFromUrl;

  return (
    <RegisterForm
      defaultInviteCode={inviteCodeFromUrl}
      isInviteCodeLocked={isInviteCodeLocked}
    />
  );
}

export default function RegisterPage() {
  const { isAnimationEnabled, getSpring } = useAnimationConfig();

  return (
    <m.div
      initial={isAnimationEnabled ? { opacity: 0, y: 40, scale: 0.95 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[420px]"
    >
      {/* 深色毛玻璃卡片 */}
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, y: 15 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...getSpring('gentle'), delay: 0.15 }}
        className="relative overflow-hidden rounded-2xl p-5 md:p-7"
        style={{
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(40px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* 顶部金色装饰线 */}
        <div
          className="absolute top-0 left-8 right-8 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4) 50%, transparent)' }}
        />

        {/* 光线扫过效果 */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <m.div
            animate={isAnimationEnabled ? { x: ['-100%', '250%'] } : {}}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 10, ease: 'easeInOut' }}
            className="absolute top-0 w-[30%] h-full opacity-[0.04]"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 50%, transparent)',
              transform: 'skewX(-15deg)',
            }}
          />
        </div>

        {/* 内发光 */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.04) 0%, transparent 60%)' }}
        />

        <div className="relative z-10">
          <Suspense fallback={<RegisterFormSkeleton />}>
            <RegisterFormWrapper />
          </Suspense>
        </div>
      </m.div>
    </m.div>
  );
}

function RegisterFormSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="text-center space-y-2 mb-6">
        <div className="h-7 w-40 bg-white/10 rounded-lg mx-auto" />
        <div className="h-4 w-56 bg-white/5 rounded-lg mx-auto" />
      </div>
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-white/5 rounded" />
            <div className="h-12 bg-white/5 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-white/10 rounded-xl" />
      <div className="h-4 w-48 bg-white/5 rounded-lg mx-auto" />
    </div>
  );
}
