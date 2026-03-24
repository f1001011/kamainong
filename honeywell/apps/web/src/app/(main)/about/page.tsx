/**
 * @file 关于我们页
 * @description 高端品牌介绍页面，沉浸式企业形象展示
 * 设计理念：「Corporate Prestige」- 现代企业级视觉呈现
 * 全宽沉浸式 Hero + 优雅内容排版 + 品牌质感装饰
 * 内容完全后台可配置，零硬编码
 */

'use client';

import { m, LazyMotion, domAnimation, MotionConfig } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { RiArrowLeftLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useText, useAnimationConfig } from '@/hooks';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/business/empty-state';
import {
  AboutHero,
  SectionRenderer,
  AboutSkeleton,
  type HeroContent,
  type AboutSection,
} from './_components';

/**
 * 页面内容响应类型
 */
interface AboutContent {
  hero: HeroContent;
  sections: AboutSection[];
  appVersion?: string;
}

interface PageContentResponse {
  pageId: string;
  content: AboutContent;
  updatedAt: string;
}

/**
 * 关于我们页
 */
export default function AboutPage() {
  const router = useRouter();
  const t = useText();
  const { getSpring, isAnimationEnabled } = useAnimationConfig();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['page-content', 'about'],
    queryFn: () => api.get<PageContentResponse>('/pages/about_us'),
    staleTime: 30 * 60 * 1000,
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig transition={getSpring('gentle')}>
        <div className={cn('min-h-screen bg-white', 'md:pl-60')}>
          {/* 沉浸式导航栏 - 浮动毛玻璃 */}
          <PageHeader title={t('page.about')} onBack={handleBack} />

          {/* 加载态 */}
          {isLoading && <AboutSkeleton />}

          {/* 错误态 */}
          {isError && (
            <div className="flex flex-col items-center justify-center pt-20 px-6">
              <p className="text-neutral-500 mb-4">{t('about.error')}</p>
              <Button variant="secondary" onClick={() => refetch()}>
                {t('about.retry')}
              </Button>
            </div>
          )}

          {/* 内容为空 */}
          {!isLoading && !isError && (!data?.content || !data.content.sections?.length) && (
            <div className="pt-20 px-6">
              <EmptyState
                type="default"
                title={t('empty.about')}
                description={t('empty.about_tip')}
              />
            </div>
          )}

          {/* 正常内容展示 */}
          {!isLoading && !isError && data?.content && data.content.sections?.length > 0 && (
            <>
              {/* 沉浸式 Hero 区域 */}
              <AboutHero hero={data.content.hero} />

              {/* 内容主体 */}
              <main className="relative pt-6 pb-4 bg-gradient-to-b from-neutral-50/50 to-white">
                <div className="max-w-4xl mx-auto">
                  {data.content.sections.map((section: AboutSection, index: number) => (
                    <SectionRenderer
                      key={section.id}
                      section={section}
                      index={index}
                    />
                  ))}
                </div>
              </main>

              {/* 版本信息 */}
              {data.content.appVersion && (
                <footer className="py-10 text-center border-t border-neutral-100">
                  <span className="text-xs tracking-widest uppercase text-neutral-400">
                    {t('about.version')} {data.content.appVersion}
                  </span>
                </footer>
              )}

              {/* 底部安全区 */}
              <div className="pb-32 md:pb-16" />
            </>
          )}
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}

/**
 * 沉浸式页面头部导航
 */
interface PageHeaderProps {
  title: string;
  onBack: () => void;
}

function PageHeader({ title, onBack }: PageHeaderProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  return (
    <div
      className={cn(
        'sticky top-0 z-30',
        'px-4 h-14 flex items-center gap-3',
        'bg-white/70 backdrop-blur-2xl backdrop-saturate-150',
        'border-b border-neutral-100/60',
        'shadow-[0_1px_16px_rgba(0,0,0,0.04)]'
      )}
    >
      <m.button
        onClick={onBack}
        whileTap={isAnimationEnabled ? { scale: 0.9 } : undefined}
        className={cn(
          'flex items-center justify-center',
          'w-9 h-9 rounded-full',
          'bg-neutral-100/80 hover:bg-neutral-200/80',
          'transition-colors duration-200'
        )}
      >
        <RiArrowLeftLine className="w-5 h-5 text-neutral-600" />
      </m.button>
      <span className="text-base font-semibold text-neutral-800 tracking-tight">{title}</span>
    </div>
  );
}
