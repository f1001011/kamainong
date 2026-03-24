/**
 * @file 登录页
 * @description 视频背景上的深色毛玻璃登录卡片
 * 深色半透明卡片 + 金色边框微光 + 光线扫过效果
 */

'use client';

import { m } from 'motion/react';
import { LoginForm } from '@/components/auth/login-form';
import { useAnimationConfig } from '@/hooks/use-animation-config';

export default function LoginPage() {
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
          <LoginForm />
        </div>
      </m.div>
    </m.div>
  );
}
