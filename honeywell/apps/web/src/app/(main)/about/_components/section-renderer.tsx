/**
 * @file 内容段落渲染器
 * @description 渲染不同类型的内容段落 - 高端企业级视觉
 * 支持段落类型：text / image / quote / stats / features
 * HTML 内容被解析为结构化区块（intro + h2 卡片），确保跨浏览器兼容
 */

'use client';

import { useMemo } from 'react';
import { m } from 'motion/react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation/constants';

/**
 * 统计项
 */
interface StatItem {
  value: string;
  label: string;
}

/**
 * 特性项
 */
interface FeatureItem {
  title: string;
  description: string;
}

/**
 * 内容段落类型
 */
export interface AboutSection {
  id: string;
  type: 'text' | 'image' | 'quote' | 'stats' | 'features';
  title?: string;
  subtitle?: string;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  stats?: StatItem[];
  features?: FeatureItem[];
}

interface SectionRendererProps {
  section: AboutSection;
  index: number;
}

/**
 * 解析后的内容块
 */
interface ContentBlock {
  type: 'intro' | 'card';
  title?: string;
  paragraphs: string[];
}

/**
 * 将 HTML 解析为结构化区块
 * 每个 h2 + 后续 p 构成一个卡片，h2 之前的 p 作为 intro
 */
function parseHtmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = template.content;
  const children = Array.from(fragment.children);

  let currentBlock: ContentBlock | null = null;

  for (const child of children) {
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'h2') {
      currentBlock = {
        type: 'card',
        title: child.textContent || '',
        paragraphs: [],
      };
      blocks.push(currentBlock);
    } else if (tagName === 'p') {
      if (!currentBlock || currentBlock.type === 'intro') {
        if (!currentBlock) {
          currentBlock = { type: 'intro', paragraphs: [] };
          blocks.push(currentBlock);
        }
        currentBlock.paragraphs.push(child.innerHTML);
      } else {
        currentBlock.paragraphs.push(child.innerHTML);
      }
    }
  }

  return blocks;
}

/**
 * 内容段落渲染器 - 企业级多类型布局
 */
export function SectionRenderer({ section, index }: SectionRendererProps) {
  const { isAnimationEnabled } = useAnimationConfig();

  const motionProps = isAnimationEnabled
    ? {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: {
          ...SPRINGS.gentle,
          delay: index * 0.04,
        },
      }
    : {};

  // ━━━ 统计数字段落 ━━━
  if (section.type === 'stats' && section.stats?.length) {
    return (
      <m.div className="px-4 md:px-6 py-4" {...motionProps}>
        <div className="max-w-3xl mx-auto">
          {section.title && (
            <div className="text-center mb-5">
              <h3 className="text-base md:text-lg font-bold text-neutral-800 tracking-tight">
                {section.title}
              </h3>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {section.stats.map((stat, i) => (
              <m.div
                key={i}
                className={cn(
                  'relative text-center py-5 px-3 rounded-2xl overflow-hidden',
                  'bg-gradient-to-br from-white via-primary-50/60 to-gold-50/30',
                  'border border-primary-100/40',
                  'shadow-sm shadow-primary-100/20',
                )}
                initial={isAnimationEnabled ? { opacity: 0, scale: 0.9 } : undefined}
                whileInView={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
                viewport={{ once: true }}
                transition={{ ...SPRINGS.bouncy, delay: i * 0.08 }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{
                    background: 'linear-gradient(90deg, transparent, var(--color-primary-400), var(--color-gold-400), transparent)',
                  }}
                />
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-br from-primary-700 to-primary-500 bg-clip-text text-transparent leading-tight">
                  {stat.value}
                </div>
                <div className="text-[11px] md:text-xs text-neutral-500 mt-1.5 leading-snug">
                  {stat.label}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>
    );
  }

  // ━━━ 特性/优势段落 ━━━
  if (section.type === 'features' && section.features?.length) {
    return (
      <m.div className="px-4 md:px-6 py-4" {...motionProps}>
        <div className="max-w-3xl mx-auto">
          {(section.title || section.subtitle) && (
            <div className="text-center mb-5">
              {section.title && (
                <h3 className="text-base md:text-lg font-bold text-neutral-800 tracking-tight">
                  {section.title}
                </h3>
              )}
              {section.subtitle && (
                <p className="text-[13px] md:text-sm text-neutral-500 mt-1.5 leading-relaxed">
                  {section.subtitle}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {section.features.map((feature, i) => (
              <m.div
                key={i}
                className={cn(
                  'group relative p-4 md:p-5 rounded-2xl overflow-hidden',
                  'bg-white',
                  'border border-neutral-100/80',
                  'shadow-sm hover:shadow-md',
                  'transition-shadow duration-300',
                )}
                initial={isAnimationEnabled ? { opacity: 0, y: 16 } : undefined}
                whileInView={isAnimationEnabled ? { opacity: 1, y: 0 } : undefined}
                viewport={{ once: true }}
                transition={{ ...SPRINGS.gentle, delay: i * 0.08 }}
              >
                <div
                  className="absolute top-0 left-0 w-[3px] h-full"
                  style={{
                    background: 'linear-gradient(180deg, var(--color-primary-500), var(--color-primary-300))',
                  }}
                />
                <h4 className="text-[14px] md:text-[15px] font-semibold text-neutral-900 leading-snug pl-2">
                  {feature.title}
                </h4>
                <p className="text-[12.5px] md:text-[13.5px] text-neutral-500 leading-relaxed mt-2 pl-2">
                  {feature.description}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </m.div>
    );
  }

  // ━━━ 文本段落 - 解析为结构化卡片 ━━━
  if (section.type === 'text' && section.content) {
    const sanitizedContent = DOMPurify.sanitize(section.content);

    return (
      <m.div className="px-4 md:px-6" {...motionProps}>
        <div className="max-w-3xl mx-auto">
          <ParsedContent html={sanitizedContent} />
        </div>
      </m.div>
    );
  }

  // ━━━ 引用段落 ━━━
  if (section.type === 'quote' && section.content) {
    return (
      <m.div className="px-4 md:px-6 py-3" {...motionProps}>
        <div className="max-w-3xl mx-auto">
          <div
            className={cn(
              'relative py-7 px-6 md:px-8 rounded-2xl overflow-hidden',
              'bg-gradient-to-br from-primary-50/90 via-gold-50/40 to-white',
              'border border-primary-100/40',
            )}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-gold-400), transparent)',
              }}
            />
            <div className="absolute top-2 left-5 text-6xl leading-none text-primary-200/40 font-serif select-none">
              &ldquo;
            </div>
            <blockquote
              className={cn(
                'relative z-10 pt-5',
                'text-[14.5px] md:text-[15.5px]',
                'font-medium italic leading-[1.85]',
                'text-neutral-600',
              )}
            >
              {section.content}
            </blockquote>
            <div className="absolute bottom-2 right-5 text-6xl leading-none text-primary-200/40 font-serif select-none rotate-180">
              &ldquo;
            </div>
          </div>
        </div>
      </m.div>
    );
  }

  // ━━━ 图片段落 ━━━
  if (section.type === 'image' && section.imageUrl) {
    return (
      <m.div
        className="px-4 md:px-6 py-3"
        initial={isAnimationEnabled ? { opacity: 0, scale: 0.96 } : undefined}
        whileInView={isAnimationEnabled ? { opacity: 1, scale: 1 } : undefined}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ ...SPRINGS.gentle }}
      >
        <figure className="max-w-3xl mx-auto">
          <div
            className={cn(
              'rounded-2xl overflow-hidden',
              'shadow-lg shadow-neutral-200/40',
              'ring-1 ring-neutral-100/80',
              'aspect-video relative',
            )}
          >
            {/* 数据库动态图片用原生 img，不受 next/image remotePatterns 域名限制 */}
            <img
              src={section.imageUrl}
              alt={section.imageAlt || ''}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.06) 100%)',
              }}
            />
          </div>
          {section.imageAlt && (
            <figcaption className="mt-3 text-[11px] text-neutral-400 text-center tracking-wide italic">
              {section.imageAlt}
            </figcaption>
          )}
        </figure>
      </m.div>
    );
  }

  return null;
}

/**
 * 解析 HTML 并渲染为卡片式布局
 */
function ParsedContent({ html }: { html: string }) {
  const { isAnimationEnabled } = useAnimationConfig();

  const blocks = useMemo(() => {
    if (typeof document === 'undefined') return [];
    return parseHtmlToBlocks(html);
  }, [html]);

  if (typeof document === 'undefined' || blocks.length === 0) {
    return (
      <div
        className="text-[15px] leading-[1.85] text-neutral-600"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        const cardMotion = isAnimationEnabled
          ? {
              initial: { opacity: 0, y: 16 } as const,
              whileInView: { opacity: 1, y: 0 } as const,
              viewport: { once: true, margin: '-40px' } as const,
              transition: { ...SPRINGS.gentle, delay: i * 0.06 },
            }
          : {};

        if (block.type === 'intro') {
          return (
            <m.div key={`intro-${i}`} {...cardMotion}>
              {block.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className="text-[14.5px] md:text-[15.5px] leading-[1.85] text-neutral-600 mb-4 last:mb-0"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </m.div>
          );
        }

        return (
          <m.div
            key={`card-${i}`}
            className={cn(
              'rounded-2xl overflow-hidden',
              'bg-gradient-to-br from-primary-50/70 via-gold-50/30 to-white',
              'border border-primary-100/40',
            )}
            {...cardMotion}
          >
            <div className="px-4 pt-4 pb-2 md:px-5 md:pt-5 md:pb-2.5 flex items-center gap-2.5">
              <div
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(180deg, var(--color-primary-600), var(--color-primary-400))' }}
              />
              <h3 className="text-[15px] md:text-[17px] font-bold text-neutral-900 leading-snug">
                {block.title}
              </h3>
            </div>
            <div className="px-4 pb-4 md:px-5 md:pb-5">
              {block.paragraphs.map((p, j) => (
                <p
                  key={j}
                  className="text-[13px] md:text-[14px] leading-[1.85] text-neutral-500 mb-2 last:mb-0 [&_strong]:text-primary-700 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: p }}
                />
              ))}
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
