/**
 * @file APK 下载页
 * @description 个人中心 - 应用下载页面
 * 展示应用特色功能、下载入口、安装指引
 * APK 内访问时显示「已在使用」提示
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import {
  RiArrowLeftSLine,
  RiFlashlightLine,
  RiNotification3Line,
  RiRocketLine,
  RiShieldCheckLine,
  RiDownload2Line,
  RiCheckboxCircleFill,
  RiInformationLine,
  RiSmartphoneLine,
  RiSettings3Line,
  RiInstallLine,
  RiFileDownloadLine,
} from '@remixicon/react';

import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { listContainerVariants, listItemVariants } from '@/lib/animation/variants';
import { isNativeApp } from '@/lib/capacitor';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: RiFlashlightLine,
    titleDefault: 'وصول سريع',
    descDefault: 'افتح مباشرة من شاشتك الرئيسية',
    color: 'text-primary-500',
    bg: 'bg-primary-50',
  },
  {
    icon: RiNotification3Line,
    titleDefault: 'الإشعارات',
    descDefault: 'تنبيهات فورية لاستثماراتك',
    color: 'text-gold-600',
    bg: 'bg-gold-50',
  },
  {
    icon: RiRocketLine,
    titleDefault: 'أداء أفضل',
    descDefault: 'تجربة أكثر سلاسة وسرعة',
    color: 'text-info',
    bg: 'bg-info-50',
  },
  {
    icon: RiShieldCheckLine,
    titleDefault: 'أمان متقدم',
    descDefault: 'حماية وتشفير البيانات',
    color: 'text-success-600',
    bg: 'bg-success-50',
  },
];

const STEPS = [
  {
    icon: RiFileDownloadLine,
    titleDefault: 'تحميل',
    descDefault: 'اضغط على الزر للحصول على ملف APK',
  },
  {
    icon: RiSmartphoneLine,
    titleDefault: 'فتح الملف',
    descDefault: 'ابحث عن الملف في الإشعارات أو التنزيلات',
  },
  {
    icon: RiSettings3Line,
    titleDefault: 'السماح بالتثبيت',
    descDefault: 'اسمح بالتثبيت من مصادر غير معروفة إذا طُلب ذلك',
  },
  {
    icon: RiInstallLine,
    titleDefault: 'جاهز',
    descDefault: 'افتح التطبيق واستمتع بأفضل تجربة',
  },
];

export default function AppDownloadPage() {
  const router = useRouter();
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig
        transition={{ ...getSpring('gentle') }}
        reducedMotion={isAnimationEnabled ? 'never' : 'always'}
      >
        <div className="relative min-h-screen">
          {/* 翡翠绿英雄背景 */}
          <div
            className="absolute top-0 inset-x-0 h-80 overflow-hidden pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-dark-950)] via-[var(--color-primary-700)]/90 to-[var(--color-primary-500)]/80" />
            <m.div
              animate={
                isAnimationEnabled
                  ? { scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }
                  : {}
              }
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)',
              }}
            />
            <m.div
              animate={
                isAnimationEnabled
                  ? { scale: [1.1, 0.9, 1.1], opacity: [0.1, 0.2, 0.1] }
                  : {}
              }
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-32 -left-12 w-48 h-48 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(var(--color-gold-rgb),0.25) 0%, transparent 70%)',
              }}
            />
          </div>

          {/* 渐变过渡 */}
          <div className="absolute top-56 inset-x-0 h-32 bg-gradient-to-b from-transparent via-[#fafaf9]/60 to-[#fafaf9] pointer-events-none" />
          <div className="absolute top-[350px] inset-x-0 bottom-0 bg-[#fafaf9] pointer-events-none" />

          {/* 主内容 */}
          <main className="relative z-10 md:pl-60">
            <m.div
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
              className="px-4 py-6 space-y-5 max-w-lg mx-auto"
            >
              {/* 返回按钮 */}
              <m.div variants={listItemVariants}>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
                >
                  <RiArrowLeftSLine className="w-5 h-5" />
                  <span>{t('btn.back_profile', 'الملف الشخصي')}</span>
                </button>
              </m.div>

              {/* Hero 区域 */}
              <m.section
                variants={listItemVariants}
                className="text-center pt-6 pb-2"
              >
                {/* 钻石 Logo */}
                <div className="mx-auto mb-5 w-20 h-20 relative">
                  <div
                    className="absolute inset-[-12px] rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(var(--color-gold-rgb),0.2) 0%, transparent 70%)',
                    }}
                  />
                  <svg
                    viewBox="0 0 80 80"
                    fill="none"
                    className="w-full h-full relative z-10"
                  >
                    <path
                      d="M40 8L72 40L40 72L8 40Z"
                      stroke="var(--color-gold-400)"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                      opacity="0.8"
                    />
                    <path
                      d="M40 18L62 40L40 62L18 40Z"
                      stroke="var(--color-gold-500)"
                      strokeWidth="0.8"
                      strokeLinejoin="round"
                      opacity="0.4"
                    />
                    <path
                      d="M40 27L53 40L40 53L27 40Z"
                      stroke="var(--color-gold-400)"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                      fill="rgba(201,169,110,0.1)"
                    />
                    <circle cx="40" cy="40" r="3.5" fill="var(--color-gold-400)" opacity="0.9" />
                  </svg>
                </div>

                <h1
                  className="text-2xl tracking-wider text-white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  lendlease
                </h1>
                <p className="text-sm text-white/50 mt-2 tracking-wide">
                  {t(
                    'download.subtitle',
                    'حمّل تطبيقنا لنظام أندرويد'
                  )}
                </p>
              </m.section>

              {/* APK 内 → 已在使用提示 */}
              {isNative ? (
                <m.section variants={listItemVariants}>
                  <div className="card-floating p-8 text-center space-y-3">
                    <RiCheckboxCircleFill className="w-14 h-14 text-primary-500 mx-auto" />
                    <h2 className="text-lg font-bold text-foreground">
                      {t(
                        'download.already_using',
                        'أنت تستخدم التطبيق بالفعل'
                      )}
                    </h2>
                    <p className="text-sm text-neutral-400">
                      {t(
                        'download.already_desc',
                        'استمتع بأفضل تجربة استثمار'
                      )}
                    </p>
                  </div>
                </m.section>
              ) : (
                <>
                  {/* 特色功能 */}
                  <m.section variants={listItemVariants}>
                    <div className="grid grid-cols-2 gap-3">
                      {FEATURES.map((feat, idx) => (
                        <div
                          key={idx}
                          className="card-floating p-4 space-y-2.5"
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center',
                              feat.bg
                            )}
                          >
                            <feat.icon className={cn('w-5 h-5', feat.color)} />
                          </div>
                          <h3 className="text-sm font-bold text-foreground">
                            {t(
                              `download.feat_${idx}`,
                              feat.titleDefault
                            )}
                          </h3>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {t(
                              `download.feat_desc_${idx}`,
                              feat.descDefault
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </m.section>

                  {/* 下载按钮 */}
                  <m.section variants={listItemVariants}>
                    <a
                      href="/downloads/lendlease-v1.1.0.apk"
                      download="lendlease.apk"
                      className={cn(
                        'btn-gradient flex items-center justify-center gap-3',
                        'w-full h-14 rounded-2xl text-base'
                      )}
                    >
                      <RiDownload2Line className="w-5 h-5" />
                      {t('download.btn', 'تحميل APK')}
                    </a>
                    <p className="text-center text-xs text-neutral-400 mt-2.5">
                      Android 7.0+ &middot; v1.1.0
                    </p>
                  </m.section>

                  {/* 安装步骤 */}
                  <m.section variants={listItemVariants} className="space-y-3">
                    <h2 className="text-base font-bold text-foreground px-1">
                      {t('download.how_title', 'كيفية التثبيت')}
                    </h2>
                    <div className="card-floating divide-y divide-neutral-100">
                      {STEPS.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3.5 p-4"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary-600">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-foreground">
                              {t(
                                `download.step_${idx}`,
                                step.titleDefault
                              )}
                            </h3>
                            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                              {t(
                                `download.step_desc_${idx}`,
                                step.descDefault
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </m.section>

                  {/* 安全提示 */}
                  <m.section variants={listItemVariants}>
                    <div className="flex gap-3 p-4 bg-warning-50 rounded-2xl border border-warning/10">
                      <RiInformationLine className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-warning-600 leading-relaxed">
                        {t(
                          'download.security_note',
                          'إذا منع جهازك التثبيت، انتقل إلى الإعدادات > الأمان > السماح بالمصادر غير المعروفة لإتمام التثبيت.'
                        )}
                      </p>
                    </div>
                  </m.section>
                </>
              )}

              <div className="h-20 md:h-4" />
            </m.div>
          </main>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
