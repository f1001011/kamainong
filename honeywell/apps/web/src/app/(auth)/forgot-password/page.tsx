/**
 * @file 忘记密码页
 * @description 引导用户通过客服渠道找回密码
 * 视频背景上的深色毛玻璃卡片，页面文案通过 TextConfig 系统可在后台动态配置
 */

'use client';

import { m } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  RiArrowLeftLine,
  RiWhatsappFill,
  RiTelegramFill,
  RiMessengerFill,
  RiMailFill,
  RiPhoneFill,
  RiCustomerServiceFill,
  RiExternalLinkLine,
  RiShieldKeyholeLine,
} from '@remixicon/react';

import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import api from '@/lib/api';

interface ServiceLink {
  name: string;
  icon: string;
  url: string;
}

interface ServiceLinksResponse {
  list: ServiceLink[];
}

const ICON_COLORS: Record<string, string> = {
  telegram: '#0088cc',
  whatsapp: '#25D366',
  messenger: '#006AFF',
  email: '#EA4335',
  phone: '#34A853',
  online_service: 'var(--color-primary-500)',
  line: '#00B900',
  wechat: '#07C160',
};

const ICON_BG_COLORS: Record<string, string> = {
  telegram: 'rgba(0,136,204,0.15)',
  whatsapp: 'rgba(37,211,102,0.15)',
  messenger: 'rgba(0,106,255,0.15)',
  email: 'rgba(234,67,53,0.15)',
  phone: 'rgba(52,168,83,0.15)',
  online_service: 'rgba(var(--color-primary-rgb),0.15)',
  line: 'rgba(0,185,0,0.15)',
  wechat: 'rgba(7,193,96,0.15)',
};

function getIconComponent(icon: string, size: string = 'w-6 h-6') {
  const iconMap: Record<string, React.ReactNode> = {
    whatsapp: <RiWhatsappFill className={size} />,
    telegram: <RiTelegramFill className={size} />,
    messenger: <RiMessengerFill className={size} />,
    email: <RiMailFill className={size} />,
    phone: <RiPhoneFill className={size} />,
    online_service: <RiCustomerServiceFill className={size} />,
  };
  return iconMap[icon.toLowerCase()] || <RiExternalLinkLine className={size} />;
}

export default function ForgotPasswordPage() {
  const t = useText();
  const { isAnimationEnabled, getSpring } = useAnimationConfig();

  const { data: serviceLinks, isLoading } = useQuery({
    queryKey: ['service-links'],
    queryFn: () => api.get<ServiceLinksResponse>('/service-links'),
    staleTime: 5 * 60 * 1000,
  });

  const links = serviceLinks?.list || [];

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
        className="relative overflow-hidden rounded-3xl p-6 md:p-8"
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
          {/* 返回登录 */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
          >
            <RiArrowLeftLine className="w-4 h-4" />
            {t('link.back_to_login')}
          </Link>

          {/* 图标 */}
          <div className="flex justify-center mb-5">
            <m.div
              initial={isAnimationEnabled ? { scale: 0, rotate: -20 } : false}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...getSpring('bouncy'), delay: 0.25 }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.25))',
                border: '1px solid rgba(212,175,55,0.2)',
                boxShadow: '0 0 30px rgba(212,175,55,0.08)',
              }}
            >
              <RiShieldKeyholeLine className="w-8 h-8 text-amber-400" />
            </m.div>
          </div>

          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('page.forgot_password_title')}
            </h1>
            <p className="text-sm text-white/50">
              {t('page.forgot_password_subtitle')}
            </p>
          </div>

          {/* 说明文案 */}
          <p className="text-sm text-white/45 text-center mb-6 leading-relaxed">
            {t('page.forgot_password_desc')}
          </p>

          {/* 客服链接列表 */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : links.length > 0 ? (
              links.map((link, index) => {
                const iconKey = link.icon.toLowerCase();
                const iconColor = ICON_COLORS[iconKey] || 'var(--color-primary-500)';
                const iconBg = ICON_BG_COLORS[iconKey] || 'rgba(var(--color-primary-rgb),0.15)';

                return (
                  <m.a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={isAnimationEnabled ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.08 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-200 group cursor-pointer"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: iconBg, color: iconColor }}
                    >
                      {getIconComponent(link.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                        {link.name}
                      </span>
                    </div>
                    <RiExternalLinkLine className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
                  </m.a>
                );
              })
            ) : (
              <div className="text-center py-6 text-sm text-white/30">
                {t('empty.noData')}
              </div>
            )}
          </div>

          {/* 底部返回登录 */}
          <p className="text-center text-sm text-white/40 mt-8">
            <Link
              href="/login"
              className="text-amber-400/80 font-semibold hover:text-amber-400 transition-colors"
            >
              {t('link.back_to_login')}
            </Link>
          </p>
        </div>
      </m.div>
    </m.div>
  );
}
