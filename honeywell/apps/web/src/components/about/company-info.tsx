/**
 * @file 公司信息组件
 * @description 展示公司Logo、名称和介绍信息
 * @depends 开发文档/03-功能模块/03.13.1-关于我们页.md
 * @depends 01.1-设计Token.md - 2026高端美学配色
 */

'use client';

import { m } from 'motion/react';
import Image from 'next/image';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeVariants, SPRINGS } from '@/lib/animation';

/**
 * Hero区域配置类型
 * 依据：02.3-前端API接口清单.md 第16.1节 - content.hero结构
 */
export interface HeroContent {
  title: string;
  subtitle: string;
  logoUrl?: string;
  backgroundImage?: string;
}

/**
 * 内容段落类型
 * 依据：02.3-前端API接口清单.md 第16.1节 - sections结构
 */
export interface ContentSection {
  id: string;
  type: 'text' | 'image' | 'quote';
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
}

/**
 * 公司信息组件属性
 */
export interface CompanyInfoProps {
  /** Hero区域配置 */
  hero?: HeroContent;
  /** 内容段落列表 */
  sections?: ContentSection[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 公司信息骨架屏
 */
function CompanyInfoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Logo骨架屏 */}
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-2xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      {/* 内容骨架屏 */}
      <div className="bg-white rounded-2xl shadow-soft p-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

/**
 * 公司信息组件
 * @description 展示公司Logo、名称和介绍文案，采用2026高端美学设计
 * 依据：核心开发规范.md - 所有内容必须从配置获取
 * 
 * @example
 * ```tsx
 * <CompanyInfo
 *   hero={{
 *     title: "Su socio de confianza",
 *     subtitle: "Brindando servicios de calidad",
 *     logoUrl: "/images/logo.png"
 *   }}
 *   sections={[
 *     { id: "intro", type: "text", content: "<p>Somos...</p>" }
 *   ]}
 * />
 * ```
 */
export function CompanyInfo({
  hero,
  sections = [],
  isLoading = false,
  className,
}: CompanyInfoProps) {
  const { config } = useGlobalConfig();

  // 加载状态
  if (isLoading) {
    return <CompanyInfoSkeleton />;
  }

  // 获取Logo URL，优先使用页面配置，其次使用全局配置
  const logoUrl = hero?.logoUrl || config.siteLogo;
  const siteName = config.siteName || 'lendlease';

  /**
   * 渲染内容段落
   * 依据：02.3-前端API接口清单.md - sections[].type 决定渲染方式
   */
  const renderSection = (section: ContentSection) => {
    switch (section.type) {
      case 'text':
        // 富文本内容需要过滤XSS
        // 依据：02.3-前端API接口清单.md - 前端需使用DOMPurify过滤XSS
        if (section.content) {
          const sanitizedContent = DOMPurify.sanitize(section.content);
          return (
            <div
              key={section.id}
              className="prose prose-neutral prose-sm max-w-none
                prose-p:text-neutral-600 prose-p:leading-relaxed
                prose-headings:text-neutral-800 prose-headings:font-medium
                prose-strong:text-neutral-700"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          );
        }
        return null;

      case 'quote':
        return (
          <div
            key={section.id}
            className="relative pl-4 border-l-4 border-primary-400 bg-gradient-to-r from-primary-50/50 to-transparent py-4 pr-4 rounded-r-xl"
          >
            <p className="text-neutral-700 italic leading-relaxed">
              {section.content}
            </p>
          </div>
        );

      case 'image':
        if (section.imageUrl) {
          return (
            <div key={section.id} className="relative w-full aspect-video rounded-xl overflow-hidden">
              <Image
                src={section.imageUrl}
                alt={section.imageAlt || ''}
                fill
                className="object-cover"
              />
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <m.div
      className={cn('space-y-6', className)}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      transition={SPRINGS.gentle}
    >
      {/* Hero区域 - Logo和标题 */}
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        {/* Logo */}
        {logoUrl ? (
          <m.div
            className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-soft-lg bg-white"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
          >
            <Image
              src={logoUrl}
              alt={siteName}
              fill
              className="object-contain p-2"
              priority
            />
          </m.div>
        ) : (
          // Logo fallback - 文字Logo
          <m.div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 
              flex items-center justify-center shadow-soft-lg"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...SPRINGS.bouncy, delay: 0.1 }}
          >
            <span className="text-3xl font-bold text-white">
              {siteName.charAt(0)}
            </span>
          </m.div>
        )}

        {/* 平台名称 */}
        <m.h1
          className="text-2xl font-bold text-neutral-800 tracking-tight"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRINGS.gentle, delay: 0.2 }}
        >
          {siteName}
        </m.h1>

        {/* 标题/Slogan */}
        {hero?.title && (
          <m.p
            className="text-lg font-medium text-primary-600"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRINGS.gentle, delay: 0.25 }}
          >
            {hero.title}
          </m.p>
        )}

        {/* 副标题 */}
        {hero?.subtitle && (
          <m.p
            className="text-sm text-neutral-500 max-w-xs"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...SPRINGS.gentle, delay: 0.3 }}
          >
            {hero.subtitle}
          </m.p>
        )}
      </div>

      {/* 公司介绍卡片 */}
      {sections.length > 0 && (
        <m.div
          className="bg-white rounded-2xl shadow-soft p-6 space-y-5"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...SPRINGS.gentle, delay: 0.35 }}
        >
          {sections.map((section) => renderSection(section))}
        </m.div>
      )}
    </m.div>
  );
}
