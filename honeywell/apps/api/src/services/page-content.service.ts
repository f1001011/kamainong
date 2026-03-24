/**
 * @file 页面内容服务
 * @description 处理页面内容的查询业务逻辑
 * 支持结构化段落类型：text / image / quote / stats / features
 * 当数据库无内容时提供高品质西班牙语默认内容
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第16节 - 页面内容接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md PageContent表
 */

import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/errors';

/**
 * 统计项
 */
export interface StatItem {
  value: string;
  label: string;
}

/**
 * 特性/优势项
 */
export interface FeatureItem {
  title: string;
  description: string;
}

/**
 * 页面内容Hero区域配置
 */
export interface PageContentHero {
  title: string;
  subtitle: string;
  logoUrl?: string;
  backgroundImage?: string;
}

/**
 * 页面内容段落
 * @description 支持 text / image / quote / stats / features 五种类型
 */
export interface PageContentSection {
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

/**
 * 关于我们页面内容结构
 */
export interface AboutUsContent {
  hero: PageContentHero;
  sections: PageContentSection[];
  appVersion?: string;
}

/**
 * 页面内容响应
 * @description 依据：02.3-前端API接口清单.md 第16.1节
 */
export interface PageContentResult {
  pageId: string;
  content: AboutUsContent | Record<string, unknown>;
  updatedAt: string;
}

/**
 * 支持的页面ID列表
 */
export const VALID_PAGE_IDS = ['about_us'] as const;
export type ValidPageId = (typeof VALID_PAGE_IDS)[number];

/**
 * 页面内容服务类
 */
export class PageContentService {
  /**
   * 获取页面内容
   * @description 依据：02.3-前端API接口清单.md 第16.1节
   * 当数据库无记录时，about_us 页面返回默认高品质内容
   * @param pageId 页面标识，如 about_us
   * @returns 页面内容，包含 pageId、content、updatedAt
   * @throws PAGE_NOT_FOUND - 页面内容不存在（非 about_us 页面）
   */
  async getPageContent(pageId: string): Promise<PageContentResult> {
    const pageContent = await prisma.pageContent.findUnique({
      where: { pageId },
      select: {
        pageId: true,
        content: true,
        updatedAt: true,
      },
    });

    // 数据库无记录时，about_us 返回默认内容，其他页面返回 404
    if (!pageContent) {
      if (pageId === 'about_us') {
        return {
          pageId,
          content: this.getDefaultAboutContent(),
          updatedAt: new Date().toISOString(),
        };
      }
      throw Errors.pageNotFound();
    }

    let content = pageContent.content as AboutUsContent | Record<string, unknown>;

    if (pageId === 'about_us') {
      content = this.normalizeAboutUsContent(content);
    }

    return {
      pageId: pageContent.pageId,
      content,
      updatedAt: pageContent.updatedAt.toISOString(),
    };
  }

  /**
   * 规范化关于我们页面内容
   * @description 将后台保存的简单 HTML 格式转换为前端期望的结构化格式
   * - 后台格式：{ html: string } 或 { content: string }
   * - 前端期望：{ hero: {...}, sections: [...] }
   * @param content 原始内容
   * @returns 规范化后的内容
   */
  private normalizeAboutUsContent(content: AboutUsContent | Record<string, unknown>): AboutUsContent {
    if (content && 'sections' in content && Array.isArray(content.sections)) {
      return content as AboutUsContent;
    }

    const rawContent = content as Record<string, unknown>;
    const htmlContent = (rawContent?.html as string)
      || (rawContent?.content as string)
      || '';

    const hero: PageContentHero = {
      title: (rawContent?.heroTitle as string) || 'استثمارات ذكية لمستقبلك',
      subtitle: (rawContent?.heroSubtitle as string) || 'منصة رائدة للاستثمار العقاري الرقمي في المغرب',
    };

    if (!htmlContent || htmlContent.trim() === '' || htmlContent === '<p><br></p>') {
      return this.getDefaultAboutContent();
    }

    return {
      hero,
      sections: [
        {
          id: 'main-content',
          type: 'text' as const,
          content: htmlContent,
        },
      ],
    };
  }

  /**
   * 关于我们页面默认高品质内容
   * @description 投资/地产平台品牌调性，面向摩洛哥市场
   * 文案风格参考首页「建筑精度」设计语言
   * 所有文案均可通过后台 CMS 修改覆盖
   */
  private getDefaultAboutContent(): AboutUsContent {
    return {
      hero: {
        title: 'استثمارات ذكية لمستقبلك',
        subtitle: 'منصة رائدة للاستثمار العقاري الرقمي في المغرب',
        backgroundImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&q=80',
      },
      sections: [
        {
          id: 'intro',
          type: 'text',
          content:
            '<p>نحن منصة تكنولوجية رائدة تعيد تعريف الاستثمار العقاري في المغرب. ' +
            'من خلال بنيتنا التحتية الرقمية المتطورة، نفتح أبواب سوق العقارات ' +
            'ليتمكن كل شخص من بناء <strong>ثروة متينة ومربحة</strong>.</p>',
        },
        {
          id: 'hero-image',
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1200&q=80',
          imageAlt: 'هندسة معمارية حديثة — استثمار عقاري من الدرجة الأولى',
        },
        {
          id: 'mission-vision',
          type: 'text',
          content:
            '<h2>مهمتنا</h2>' +
            '<p>إتاحة الوصول إلى الاستثمارات العقارية من الدرجة الأولى، وتزويد كل مغربي ' +
            'بالأدوات والفرص للمشاركة في نمو قطاع العقارات بكل ' +
            '<strong>شفافية</strong> و<strong>أمان</strong> و<strong>عوائد تنافسية</strong>.</p>' +
            '<h2>رؤيتنا</h2>' +
            '<p>أن نكون المنصة الاستثمارية العقارية الرقمية الأكثر موثوقية وابتكاراً في أفريقيا، ' +
            'لقيادة تحول السوق المالي نحو نموذج أكثر شمولية وكفاءة ويسراً للجميع.</p>',
        },
        {
          id: 'platform-stats',
          type: 'stats',
          title: 'أرقام تدعم مسيرتنا',
          stats: [
            { value: '50K+', label: 'مستثمر نشط' },
            { value: 'MAD 12B+', label: 'رأس مال مُدار' },
            { value: '98.5%', label: 'رضا العملاء' },
            { value: '24/7', label: 'دعم متاح' },
          ],
        },
        {
          id: 'why-choose-us',
          type: 'features',
          title: 'لماذا تختارنا؟',
          subtitle: 'حلول استثمارية مصممة لتعظيم عوائدك',
          features: [
            {
              title: 'أمان بمستوى البنوك',
              description:
                'تشفير من طرف إلى طرف، مصادقة متعددة العوامل وحفظ آمن للأموال وفق أعلى معايير القطاع المالي.',
            },
            {
              title: 'عوائد تنافسية',
              description:
                'محافظ متنوعة ومحسّنة تقدم عوائد أعلى من متوسط سوق الاستثمار المغربي.',
            },
            {
              title: 'شفافية مطلقة',
              description:
                'تقارير مفصلة في الوقت الحقيقي، بدون تكاليف خفية. تحتفظ بالسيطرة الكاملة على كل درهم مستثمر.',
            },
            {
              title: 'دعم مؤسسي',
              description:
                'شراكات استراتيجية مع مطورين معتمدين ومشاريع عقارية موثقة في أهم مدن المغرب.',
            },
          ],
        },
        {
          id: 'team-image',
          type: 'image',
          imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
          imageAlt: 'فريق من المحترفين الملتزمين بنجاحك المالي',
        },
        {
          id: 'philosophy',
          type: 'quote',
          content:
            'نؤمن بشدة أن كل شخص يستحق الوصول إلى أفضل فرص الاستثمار. ' +
            'تقنيتنا تزيل الحواجز التقليدية ليتمكن الجميع من بناء مستقبل مالي أكثر ازدهاراً وأماناً.',
        },
        {
          id: 'commitment',
          type: 'text',
          content:
            '<h2>التزامنا</h2>' +
            '<p>نلتزم بالتميز في كل تفصيل من عملياتنا. من الاختيار الدقيق للمشاريع ' +
            'العقارية إلى الرعاية الشخصية لكل مستثمر، نعمل بلا كلل لتجاوز توقعاتكم ' +
            'وحماية ثقتكم.</p>' +
            '<p>فريقنا من المتخصصين في المالية والتكنولوجيا والعقارات يتعاون لتقديم أفضل الفرص ' +
            'في السوق المغربي، مدعومة بتحليلات عميقة وإدارة شفافة والتزام راسخ بنجاحكم المالي.</p>',
        },
      ],
    };
  }
}

// 单例导出
export const pageContentService = new PageContentService();
