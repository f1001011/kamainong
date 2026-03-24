/**
 * @file 安全设置页
 * @description 用户安全中心，展示账号安全相关设置
 * @depends 开发文档/03-前端用户端/03.7.2-安全设置页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 *
 * 路由路径: /security
 * 页面标题: page.security → "Configuración de seguridad"
 *
 * 2026高端美学设计要点：
 * - 银行APP级安全感设计
 * - 白色卡片 + 柔和阴影
 * - 功能入口：图标（圆形）+ 名称 + 描述 + 箭头
 * - 页面有充足留白，呼吸感强
 */
'use client';

import { useRouter } from 'next/navigation';
import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiLockLine } from '@remixicon/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { cn } from '@/lib/utils';
import { slideUpVariants, listContainerVariants, listItemVariants } from '@/lib/animation/variants';

/**
 * 安全功能入口配置（静态列表）
 * @description 依据：开发文档.md 第4.2节 - 当前仅修改密码功能
 */
const securityMenuItems = [
  {
    key: 'change_password',
    icon: RiLockLine,
    route: '/security/password',
    hasDescription: true,
  },
  // 未来扩展预留：
  // { key: 'payment_password', icon: RiLockPasswordLine, route: '/security/payment' },
  // { key: 'device_management', icon: RiSmartphoneLine, route: '/security/devices' },
];

export default function SecurityPage() {
  const router = useRouter();
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();

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
              {t('page.security', 'إعدادات الأمان')}
            </h1>
          </header>

          {/* 内容区域 */}
          <m.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="px-4 md:px-6 md:max-w-2xl md:mx-auto pt-4 space-y-4"
          >
            {securityMenuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <m.div
                  key={item.key}
                  variants={listItemVariants}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(item.route)}
                  className={cn(
                    'bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-2xl p-5',
                    'cursor-pointer hover:bg-neutral-50 transition-colors'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* 图标区域 - 圆形，符合文档规范 */}
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-primary-500" />
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-neutral-800 font-medium">
                          {t(`menu.${item.key}`, 'تغيير كلمة المرور')}
                        </h3>
                        <RiArrowRightSLine className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      </div>

                      {/* 功能描述 */}
                      {item.hasDescription && (
                        <p className="text-neutral-500 text-sm mt-1.5 leading-relaxed">
                          {t(`menu.${item.key}_desc`, 'قم بتحديث كلمة المرور بانتظام لمزيد من الأمان')}
                        </p>
                      )}
                    </div>
                  </div>
                </m.div>
              );
            })}
          </m.div>

          {/* 底部留白 */}
          <div className="h-20 md:h-4" />
        </m.div>
      </MotionConfig>
    </LazyMotion>
  );
}
