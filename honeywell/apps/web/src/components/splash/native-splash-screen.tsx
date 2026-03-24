/**
 * @file 原生应用开屏动画
 * @description "Emerald Luxe" - 翡翠绿+香槟金高端开屏动画
 * 仅在 Capacitor 原生环境中显示，浏览器端直接跳过
 *
 * 视觉设计：
 * - 深色翡翠背景 + 呼吸极光
 * - 金色悬浮粒子系统
 * - 嵌套钻石 Logo 进场动画
 * - 金色渐变品牌名 + 微光扫过
 * - 底部加载条渐变填充
 *
 * 兼容性：纯 CSS 动画，兼容 Android WebView 80+
 */

'use client';

import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
}

const PARTICLES: Particle[] = [
  { id: 0, x: 12, delay: 0.0, duration: 5.2, size: 2.0, opacity: 0.45, drift: 18 },
  { id: 1, x: 28, delay: 0.8, duration: 4.1, size: 2.8, opacity: 0.35, drift: -10 },
  { id: 2, x: 45, delay: 1.5, duration: 6.0, size: 1.6, opacity: 0.5, drift: 25 },
  { id: 3, x: 62, delay: 0.3, duration: 3.5, size: 3.2, opacity: 0.3, drift: -22 },
  { id: 4, x: 78, delay: 1.2, duration: 4.8, size: 2.4, opacity: 0.42, drift: 8 },
  { id: 5, x: 20, delay: 2.0, duration: 5.5, size: 1.8, opacity: 0.38, drift: -15 },
  { id: 6, x: 35, delay: 0.5, duration: 3.8, size: 3.0, opacity: 0.28, drift: 20 },
  { id: 7, x: 55, delay: 1.8, duration: 4.5, size: 2.2, opacity: 0.48, drift: -8 },
  { id: 8, x: 72, delay: 0.7, duration: 5.0, size: 1.5, opacity: 0.33, drift: 12 },
  { id: 9, x: 88, delay: 1.4, duration: 3.2, size: 2.6, opacity: 0.4, drift: -18 },
  { id: 10, x: 42, delay: 2.2, duration: 4.3, size: 1.9, opacity: 0.36, drift: 14 },
  { id: 11, x: 8, delay: 0.9, duration: 5.8, size: 2.1, opacity: 0.44, drift: -6 },
];

const SPLASH_CSS = `
@keyframes _sp_aurora1 {
  0%, 100% { transform: scale(1) translate(0,0); opacity: 0.35; }
  33% { transform: scale(1.2) translate(20px,-25px); opacity: 0.55; }
  66% { transform: scale(0.85) translate(-15px,18px); opacity: 0.3; }
}
@keyframes _sp_aurora2 {
  0%, 100% { transform: scale(1.1) translate(0,0); opacity: 0.25; }
  50% { transform: scale(0.8) translate(-25px,-15px); opacity: 0.45; }
}
@keyframes _sp_aurora3 {
  0%, 100% { transform: scale(0.9) translate(0,0); opacity: 0.2; }
  40% { transform: scale(1.15) translate(10px,20px); opacity: 0.4; }
  70% { transform: scale(1) translate(-10px,-5px); opacity: 0.25; }
}
@keyframes _sp_float {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: var(--_sp_op, 0.4); }
  90% { opacity: var(--_sp_op, 0.4); }
  100% { transform: translateY(-100vh) translateX(var(--_sp_drift, 20px)); opacity: 0; }
}
@keyframes _sp_ring_spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes _sp_ring_pulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.75; }
}
@keyframes _sp_diamond_in {
  0% { transform: scale(0) rotate(0deg); opacity: 0; }
  50% { transform: scale(1.08) rotate(2deg); opacity: 0.9; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes _sp_text_up {
  0% { transform: translateY(24px); opacity: 0; filter: blur(6px); }
  100% { transform: translateY(0); opacity: 1; filter: blur(0); }
}
@keyframes _sp_shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes _sp_fill {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
@keyframes _sp_glow {
  0%, 100% { transform: scale(1); opacity: 0.25; }
  50% { transform: scale(1.25); opacity: 0.5; }
}
@keyframes _sp_light_ray {
  0% { transform: translateX(-100%) rotate(25deg); opacity: 0; }
  15% { opacity: 0.6; }
  85% { opacity: 0.6; }
  100% { transform: translateX(250%) rotate(25deg); opacity: 0; }
}
`;

/**
 * 原生应用开屏动画组件
 * 仅在 Capacitor 原生容器中渲染，浏览器环境返回 null
 */
export function NativeSplashScreen() {
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(true);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cap = (window as Record<string, unknown>).Capacitor as
      | { isNativePlatform?: () => boolean }
      | undefined;
    const native = cap?.isNativePlatform?.() ?? false;

    if (native) {
      setIsNative(true);
    } else {
      setVisible(false);
    }
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const raf = requestAnimationFrame(() => {
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => SplashScreen.hide({ fadeOutDuration: 200 }))
        .catch(() => {});
    });

    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => setPhase(4), 1900),
      setTimeout(() => setPhase(5), 3400),
      setTimeout(() => setVisible(false), 4000),
    ];

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [isNative]);

  if (!visible) return null;

  const show = (minPhase: number) => phase >= minPhase;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SPLASH_CSS }} />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A1A12',
          transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
          opacity: phase >= 5 ? 0 : 1,
          pointerEvents: phase >= 5 ? 'none' : 'auto',
          overflow: 'hidden',
        }}
      >
        {/* ===== 极光背景层 ===== */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {/* 极光球 1 - 翡翠绿 左上 */}
          <div
            style={{
              position: 'absolute',
              top: '-15%',
              left: '-10%',
              width: '65%',
              height: '55%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(13,107,61,0.5) 0%, rgba(13,107,61,0.15) 40%, transparent 70%)',
              filter: 'blur(60px)',
              animation: show(1) ? '_sp_aurora1 8s ease-in-out infinite' : 'none',
              opacity: show(1) ? undefined : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
          {/* 极光球 2 - 香槟金 右下 */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              right: '-15%',
              width: '55%',
              height: '50%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(201,169,110,0.35) 0%, rgba(201,169,110,0.1) 40%, transparent 70%)',
              filter: 'blur(50px)',
              animation: show(1) ? '_sp_aurora2 10s ease-in-out infinite' : 'none',
              opacity: show(1) ? undefined : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
          {/* 极光球 3 - 浅翡翠 中下 */}
          <div
            style={{
              position: 'absolute',
              bottom: '20%',
              left: '25%',
              width: '50%',
              height: '40%',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(46,173,102,0.25) 0%, transparent 60%)',
              filter: 'blur(55px)',
              animation: show(1) ? '_sp_aurora3 12s ease-in-out infinite' : 'none',
              opacity: show(1) ? undefined : 0,
              transition: 'opacity 1s ease',
            }}
          />
          {/* 噪点纹理 */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.04,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '256px 256px',
              mixBlendMode: 'overlay',
            }}
          />
        </div>

        {/* ===== 粒子层 ===== */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {show(1) &&
            PARTICLES.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  bottom: '-5%',
                  left: `${p.x}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, #D4B468 0%, rgba(201,169,110,0.6) 60%, transparent 100%)',
                  boxShadow: '0 0 4px rgba(201,169,110,0.4)',
                  ['--_sp_op' as string]: p.opacity,
                  ['--_sp_drift' as string]: `${p.drift}px`,
                  animation: `_sp_float ${p.duration}s ${p.delay}s ease-in-out infinite`,
                }}
              />
            ))}
        </div>

        {/* ===== 光线扫过效果 ===== */}
        {show(2) && (
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '-20%',
              width: '25%',
              height: '30%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 60%, transparent)',
              animation: '_sp_light_ray 5s 1.5s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* ===== 内容层 ===== */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* 旋转金色光环 + 发光光晕 */}
          <div style={{ position: 'relative', width: '140px', height: '140px' }}>
            {/* 光晕 */}
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%)',
                opacity: show(2) ? 1 : 0,
                transition: 'opacity 0.6s ease',
                animation: show(2) ? '_sp_glow 4s ease-in-out infinite' : 'none',
              }}
            />
            {/* 旋转虚线圆环 */}
            <svg
              viewBox="0 0 140 140"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: show(2) ? 0.6 : 0,
                transition: 'opacity 0.8s ease',
                animation: show(2) ? '_sp_ring_spin 30s linear infinite' : 'none',
              }}
            >
              <circle
                cx="70"
                cy="70"
                r="66"
                fill="none"
                stroke="#C9A96E"
                strokeWidth="0.6"
                strokeDasharray="5 10"
                opacity="0.7"
              />
            </svg>
            {/* 脉冲外圈 */}
            <svg
              viewBox="0 0 140 140"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                opacity: show(2) ? 1 : 0,
                transition: 'opacity 1s ease',
                animation: show(2) ? '_sp_ring_pulse 3s ease-in-out infinite' : 'none',
              }}
            >
              <circle
                cx="70"
                cy="70"
                r="62"
                fill="none"
                stroke="url(#_sp_gold_grad)"
                strokeWidth="0.8"
              />
              <defs>
                <linearGradient id="_sp_gold_grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C9A96E" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#D4B468" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#C9A96E" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* ===== 钻石 Logo ===== */}
            <div
              style={{
                position: 'absolute',
                inset: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: show(2) ? 1 : 0,
                animation: show(2) ? '_sp_diamond_in 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards' : 'none',
              }}
            >
              <svg viewBox="0 0 80 80" fill="none" style={{ width: '100%', height: '100%' }}>
                {/* 外层钻石 */}
                <path
                  d="M40 8L72 40L40 72L8 40Z"
                  stroke="#C9A96E"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                  opacity="0.75"
                />
                {/* 中层钻石 */}
                <path
                  d="M40 18L62 40L40 62L18 40Z"
                  stroke="#D4B468"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                  opacity="0.4"
                />
                {/* 内层钻石 */}
                <path
                  d="M40 27L53 40L40 53L27 40Z"
                  stroke="#C9A96E"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                  fill="rgba(201,169,110,0.08)"
                />
                {/* 核心 */}
                <circle cx="40" cy="40" r="3.5" fill="#D4B468" opacity="0.9" />
                <circle cx="40" cy="40" r="1.5" fill="#F5EDD8" />
                {/* 装饰线 */}
                <line x1="40" y1="27" x2="40" y2="8" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
                <line x1="53" y1="40" x2="72" y2="40" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
                <line x1="40" y1="53" x2="40" y2="72" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
                <line x1="27" y1="40" x2="8" y2="40" stroke="#C9A96E" strokeWidth="0.4" opacity="0.3" />
              </svg>
            </div>
          </div>

          {/* ===== 品牌名 ===== */}
          <h1
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: '32px',
              fontWeight: 400,
              letterSpacing: '3px',
              margin: 0,
              opacity: show(3) ? 1 : 0,
              transform: show(3) ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
              background: 'linear-gradient(120deg, #C9A96E 0%, #F5EDD8 25%, #D4B468 50%, #F5EDD8 75%, #C9A96E 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: show(3) ? '_sp_shimmer 3s linear infinite' : 'none',
              textShadow: 'none',
            }}
          >
            lendlease
          </h1>

          {/* ===== 标语 ===== */}
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Segoe UI', system-ui, sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '5px',
              textTransform: 'uppercase',
              color: 'rgba(163,229,189,0.7)',
              margin: '-8px 0 0 0',
              opacity: show(4) ? 1 : 0,
              transform: show(4) ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s',
            }}
          >
            Inversiones Inteligentes
          </p>
        </div>

        {/* ===== 底部加载条 ===== */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '15%',
            right: '15%',
            height: '2px',
            borderRadius: '1px',
            background: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
            opacity: show(4) ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 'inherit',
              background: 'linear-gradient(90deg, #0D6B3D, #2EAD66 40%, #D4B468 80%, #C9A96E)',
              transformOrigin: 'left center',
              animation: show(4) ? '_sp_fill 1.4s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
            }}
          />
        </div>

        {/* ===== 底部版权 ===== */}
        <p
          style={{
            position: 'absolute',
            bottom: '32px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '1px',
            opacity: show(4) ? 1 : 0,
            transition: 'opacity 0.5s ease 0.3s',
          }}
        >
          &copy; {new Date().getFullYear()} Lendlease
        </p>
      </div>
    </>
  );
}
