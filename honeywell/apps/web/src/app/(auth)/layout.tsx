/**
 * @file 认证布局
 * @description 全屏视频背景 + 底部暗色渐变遮罩 + 高端毛玻璃卡片容器
 * 视频素材：北京城市天际线延时摄影
 */

'use client';

import { useRef, useEffect, useState } from 'react';
import { m } from 'motion/react';
import { useAnimationConfig } from '@/hooks/use-animation-config';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAnimationEnabled } = useAnimationConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = 0.75;
    const tryPlay = () => {
      video.play().then(() => {
        setVideoLoaded(true);
      }).catch(() => {
        setTimeout(tryPlay, 500);
      });
    };
    if (video.readyState >= 3) {
      setVideoLoaded(true);
    } else {
      video.addEventListener('canplay', () => setVideoLoaded(true), { once: true });
    }
    tryPlay();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* 全屏视频背景 - 上移显示更多城市天际线 */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onCanPlay={() => setVideoLoaded(true)}
        onLoadedData={() => setVideoLoaded(true)}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: videoLoaded ? 1 : 0,
          transition: 'opacity 1.2s ease-out',
          objectPosition: 'center 30%',
        }}
        src="/videos/auth-bg.mp4"
      />

      {/* 渐变遮罩 - 仅底部区域半透明，上方保持视频清晰可见 */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.05) 55%, transparent 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 20%)',
          }}
        />
      </div>

      {/* 装饰性光晕 */}
      {isAnimationEnabled && (
        <>
          <m.div
            animate={{
              opacity: [0.03, 0.06, 0.03],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(var(--color-primary-rgb),0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
        </>
      )}

      {/* 顶部 Logo - 浮在视频上方 */}
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-8 sm:pt-12"
      >
        <img
          src="/images/logo.png"
          alt="Lendlease"
          className="h-8 sm:h-10 w-auto object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
        />
      </m.div>

      {/* 内容区域 - 固定一屏，底部对齐，不滚动 */}
      <div className="relative z-10 h-screen flex items-end justify-center px-5 pb-5 sm:pb-8">
        {children}
      </div>
    </div>
  );
}
