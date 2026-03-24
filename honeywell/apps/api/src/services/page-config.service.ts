/**
 * @file 页面配置与内容服务
 * @description 处理页面配置、动画配置、Banner、客服链接、银行列表等核心业务逻辑
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.5~1.11节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.14~2.15节、第2.8节、第2.12节
 */

import { prisma } from '@/lib/prisma';
import {
  getOrSet,
  CACHE_KEYS,
  CACHE_TTL,
  deleteCache,
} from '@/lib/redis';
import { Errors } from '@/lib/errors';

// ================================
// 类型定义
// ================================

/**
 * 推荐产品数据（精简版，用于首页展示）
 * @description 与前端 ProductCardData 保持一致
 */
export interface RecommendProduct {
  /** 产品 ID */
  id: number;
  /** 产品编码 */
  code: string;
  /** 产品名称 */
  name: string;
  /** 产品类型：TRIAL=体验产品, PAID=付费产品 */
  type: 'TRIAL' | 'PAID';
  /** 产品系列：PO=普通系列, VIP=VIP系列 */
  series: 'PO' | 'VIP';
  /** 价格（字符串，保持精度） */
  price: string;
  /** 日收益率（字符串） */
  dailyIncome: string;
  /** 周期天数 */
  cycleDays: number;
  /** 总收益（字符串） */
  totalIncome: string;
  /** 授予 VIP 等级 */
  grantVipLevel?: number;
  /** 授予 SVIP 等级 */
  grantSvipLevel?: number;
  /** 需要 VIP 等级才能购买 */
  requireVipLevel?: number;
  /** 购买限制数量 */
  purchaseLimit?: number;
  /** 主图 URL */
  mainImage?: string | null;
  /** 是否显示推荐角标 */
  showRecommendBadge?: boolean;
  /** 自定义角标文字 */
  customBadgeText?: string | null;
  /** 状态 */
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * 首页配置
 * @description 依据：02.3-前端API接口清单.md 第1.6节
 * 注意：文档定义返回 recommendProductIds，但前端实际需要 recommendProducts（完整产品数据）
 * 为保持兼容性，同时返回两个字段
 */
export interface HomeConfig {
  /** 推荐产品开关 */
  recommendEnabled: boolean;
  /** 推荐区域标题 */
  recommendTitle: string;
  /** 推荐展示模式：list=单列纵向列表 | scroll=横向滚动 | grid=网格 */
  recommendDisplayMode: 'list' | 'scroll' | 'grid';
  /** 推荐产品ID列表（文档定义字段） */
  recommendProductIds: number[];
  /** 最大展示数量 */
  recommendMaxCount: number;
  /** 快捷入口配置 */
  quickEntries: QuickEntry[];
  /** 今日收益显示开关 */
  todayIncomeVisible: boolean;
  /** 签到入口显示开关 */
  signInEntryVisible: boolean;
  /** Banner显示开关 */
  bannerVisible: boolean;
  /** 跑马灯显示开关 */
  marqueeVisible: boolean;
  /** 推荐产品列表（前端实际需要的完整产品数据） */
  recommendProducts: RecommendProduct[];
}

/**
 * 快捷入口配置
 */
export interface QuickEntry {
  /** 入口标识 */
  key: string;
  /** 图标名称（Remix Icon） */
  icon: string;
  /** 显示文案 */
  label: string;
  /** 是否显示 */
  visible: boolean;
  /** 排序权重 */
  sortOrder: number;
  /** 跳转链接（可选，支持站内路径和站外URL） */
  link?: string;
}

/**
 * 个人中心配置
 * @description 依据：02.3-前端API接口清单.md 第1.7节
 */
export interface ProfileConfig {
  /** 菜单项配置 */
  menuItems: ProfileMenuItem[];
}

/**
 * 个人中心菜单项
 */
export interface ProfileMenuItem {
  /** 菜单标识（用于文案映射） */
  key: string;
  /** 图标名称（Remix Icon） */
  icon: string;
  /** 跳转路由 */
  route: string;
  /** 角标配置 */
  badge: { type: 'dot' | 'count'; source?: string } | null;
  /** 是否显示 */
  visible: boolean;
  /** 排序权重 */
  order: number;
}

/**
 * 产品页配置
 * @description 依据：02.3-前端API接口清单.md 第1.8节
 */
export interface ProductsConfig {
  /** Tab1名称 */
  tab1Name: string;
  /** Tab1筛选条件 */
  tab1Filter: string;
  /** Tab2名称 */
  tab2Name: string;
  /** Tab2筛选条件 */
  tab2Filter: string;
  /** 默认Tab */
  defaultTab: number;
  /** 列表布局：single=单列 | double=双列 | auto=自适应 */
  listLayout: 'single' | 'double' | 'auto';
  /** 卡片样式 */
  cardStyle: 'standard' | 'compact' | 'large';
  /** VIP角标颜色 */
  vipBadgeColor: string;
  /** 已购买角标文案 */
  purchasedBadge: string;
  /** 锁定提示文案 */
  lockedTip: string;
}

/**
 * 动画配置
 * @description 依据：02.3-前端API接口清单.md 第1.9节
 */
export interface AnimationConfig {
  /** 全局动画开关 */
  animationEnabled: boolean;
  /** 动画速度倍率 */
  animationSpeed: number;
  /** 减弱动画模式 */
  reducedMotion: boolean;
  /** 庆祝效果开关 */
  celebrationEffect: boolean;
  /** 页面过渡动画 */
  pageTransition: boolean;
  /** 骨架屏加载 */
  skeletonLoading: boolean;
  /** 下拉刷新动画 */
  pullToRefresh: boolean;
}

/**
 * Banner项
 * @description 依据：02.1-数据库设计.md 第2.8节
 */
export interface BannerItem {
  /** Banner ID */
  id: number;
  /** 图片URL */
  imageUrl: string;
  /** 链接类型 */
  linkType: 'NONE' | 'INTERNAL' | 'EXTERNAL' | 'PRODUCT';
  /** 跳转链接 */
  linkUrl: string | null;
  /** 产品ID（当linkType=PRODUCT时） */
  productId: number | null;
}

/**
 * 客服链接项
 * @description 依据：02.3-前端API接口清单.md 第1.10节
 */
export interface ServiceLinkItem {
  /** 显示名称 */
  name: string;
  /** 图标URL */
  icon: string;
  /** 跳转链接 */
  url: string;
}

/**
 * 银行项
 * @description 依据：02.1-数据库设计.md 第2.12节
 */
export interface BankItem {
  /** 银行编码 */
  code: string;
  /** 银行名称 */
  name: string;
}

// ================================
// 页面配置服务类
// ================================

/**
 * 页面配置与内容服务
 */
export class PageConfigService {
  // ================================
  // 首页配置
  // ================================

  /**
   * 获取首页配置
   * @description 依据：02.3-前端API接口清单.md 第1.6节
   * 同时返回文档定义的 recommendProductIds 和前端需要的 recommendProducts
   * @returns 首页配置数据（包含完整产品信息）
   */
  async getHomeConfig(): Promise<HomeConfig> {
    return getOrSet(
      CACHE_KEYS.PAGE.HOME,
      async () => {
        // 从 PageConfig 表获取首页配置
        const pageConfig = await prisma.pageConfig.findUnique({
          where: { pageType: 'home' },
        });

        // 如果没有配置，返回默认值
        if (!pageConfig) {
          return this.getDefaultHomeConfig();
        }

        // 安全解析 JSON 配置
        const config = pageConfig.config as Record<string, unknown> | null;
        if (!config) {
          return this.getDefaultHomeConfig();
        }

        // 获取快捷入口（仅返回可见的）
        // 注意：visible 未设置时默认为 true（数据库旧数据可能缺少此字段）
        // sortOrder 未设置时默认为 0
        const quickEntries = Array.isArray(config.quickEntries)
          ? (config.quickEntries as QuickEntry[])
              .filter(entry => entry.visible !== false)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          : this.getDefaultQuickEntries();

        // 获取推荐产品ID列表
        const recommendProductIds = Array.isArray(config.recommendProductIds)
          ? config.recommendProductIds as number[]
          : [];

        // 获取最大展示数量
        const maxCount = Number(config.recommendMaxCount ?? 6);

        // 查询完整的产品信息（将ID数组转换为产品对象数组）
        const recommendProducts = await this.getRecommendProducts(
          recommendProductIds.slice(0, maxCount)
        );

        return {
          // 文档定义的字段
          recommendEnabled: Boolean(config.recommendEnabled ?? true),
          recommendTitle: String(config.recommendTitle ?? 'Recomendados'),
          recommendDisplayMode: (config.recommendDisplayMode as HomeConfig['recommendDisplayMode']) ?? 'list',
          recommendProductIds,
          recommendMaxCount: maxCount,
          quickEntries,
          todayIncomeVisible: Boolean(config.todayIncomeVisible ?? true),
          signInEntryVisible: Boolean(config.signInEntryVisible ?? true),
          bannerVisible: Boolean(config.bannerVisible ?? true),
          marqueeVisible: Boolean(config.marqueeVisible ?? false),
          // 前端需要的完整产品数据
          recommendProducts,
        };
      },
      CACHE_TTL.PAGE_CONFIG
    );
  }

  /**
   * 根据产品ID列表获取完整产品信息
   * @description 将产品ID数组转换为前端期望的产品对象数组
   * @param productIds 产品ID列表
   * @returns 产品对象数组（按传入的ID顺序排列）
   */
  private async getRecommendProducts(productIds: number[]): Promise<RecommendProduct[]> {
    if (productIds.length === 0) {
      return [];
    }

    // 查询产品详情
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: 'ACTIVE', // 仅返回上架的产品
      },
    });

    // 按传入的ID顺序排序
    const productMap = new Map(products.map(p => [p.id, p]));
    const orderedProducts: RecommendProduct[] = [];

    for (const id of productIds) {
      const product = productMap.get(id);
      if (product) {
        orderedProducts.push({
          id: product.id,
          code: product.code,
          name: product.name,
          type: product.type as 'TRIAL' | 'PAID',
          series: product.series as 'PO' | 'VIP',
          price: product.price.toString(),
          dailyIncome: product.dailyIncome.toString(),
          cycleDays: product.cycleDays,
          totalIncome: product.totalIncome.toString(),
          grantVipLevel: product.grantVipLevel ?? undefined,
          grantSvipLevel: product.grantSvipLevel ?? undefined,
          requireVipLevel: product.requireVipLevel ?? undefined,
          purchaseLimit: product.purchaseLimit ?? undefined,
          mainImage: product.mainImage,
          showRecommendBadge: product.showRecommendBadge,
          customBadgeText: product.customBadgeText,
          status: product.status as 'ACTIVE' | 'INACTIVE',
        });
      }
    }

    return orderedProducts;
  }

  /**
   * 获取默认首页配置
   */
  private getDefaultHomeConfig(): HomeConfig {
    return {
      recommendEnabled: true,
      recommendTitle: 'Recomendados',
      recommendDisplayMode: 'list',
      recommendProductIds: [],
      recommendMaxCount: 6,
      quickEntries: this.getDefaultQuickEntries(),
      todayIncomeVisible: true,
      signInEntryVisible: true,
      bannerVisible: true,
      marqueeVisible: false,
      recommendProducts: [],
    };
  }

  /**
   * 获取默认快捷入口
   * @description 依据：开发文档.md 第12.3节 - "快捷入口：充值、提现、邀请、活动"
   */
  private getDefaultQuickEntries(): QuickEntry[] {
    return [
      { key: 'telegram', icon: 'RiTelegramFill', label: 'Telegram', visible: true, sortOrder: 1 },
      { key: 'whatsapp', icon: 'RiWhatsappFill', label: 'WhatsApp', visible: true, sortOrder: 2 },
      { key: 'team', icon: 'RiTeamFill', label: 'فريقي', visible: true, sortOrder: 3 },
      { key: 'invite', icon: 'RiGiftFill', label: 'Invitar', visible: true, sortOrder: 4 },
      { key: 'activities', icon: 'RiCalendarEventFill', label: 'Actividades', visible: true, sortOrder: 5 },
      { key: 'positions', icon: 'RiPieChartFill', label: 'أصولي', visible: true, sortOrder: 6 },
    ];
  }

  // ================================
  // 个人中心配置
  // ================================

  /**
   * 获取个人中心配置
   * @description 依据：02.3-前端API接口清单.md 第1.7节
   * @returns 个人中心配置数据
   */
  async getProfileConfig(): Promise<ProfileConfig> {
    return getOrSet(
      CACHE_KEYS.PAGE.PROFILE,
      async () => {
        // 从 PageConfig 表获取个人中心配置
        const pageConfig = await prisma.pageConfig.findUnique({
          where: { pageType: 'profile' },
        });

        // 如果没有配置，返回默认值
        if (!pageConfig) {
          return this.getDefaultProfileConfig();
        }

        // 安全解析 JSON 配置
        const config = pageConfig.config as Record<string, unknown> | null;
        if (!config) {
          return this.getDefaultProfileConfig();
        }

        const menuItems = Array.isArray(config.menuItems)
          ? (config.menuItems as ProfileMenuItem[])
              .filter(item => item.visible)
              .sort((a, b) => a.order - b.order)
          : this.getDefaultMenuItems();

        return { menuItems };
      },
      CACHE_TTL.PAGE_CONFIG
    );
  }

  /**
   * 获取默认个人中心配置
   */
  private getDefaultProfileConfig(): ProfileConfig {
    return {
      menuItems: this.getDefaultMenuItems(),
    };
  }

  /**
   * 获取默认菜单项
   */
  private getDefaultMenuItems(): ProfileMenuItem[] {
    return [
      { key: 'positions', icon: 'RiLineChartFill', route: '/positions', badge: null, visible: true, order: 1 },
      { key: 'recharge_history', icon: 'RiHistoryFill', route: '/recharge/records', badge: null, visible: true, order: 2 },
      { key: 'withdraw_history', icon: 'RiFileListFill', route: '/withdraw/records', badge: null, visible: true, order: 3 },
      { key: 'transactions', icon: 'RiExchangeFill', route: '/transactions', badge: null, visible: true, order: 4 },
      { key: 'team', icon: 'RiTeamFill', route: '/team', badge: null, visible: true, order: 5 },
      { key: 'bank_cards', icon: 'RiBankCardFill', route: '/bank-cards', badge: null, visible: true, order: 6 },
      { key: 'gift_code', icon: 'RiGiftFill', route: '/gift-code', badge: null, visible: true, order: 7 },
      { key: 'security', icon: 'RiShieldLine', route: '/security', badge: null, visible: true, order: 8 },
      { key: 'about', icon: 'RiInformationFill', route: '/about', badge: null, visible: true, order: 9 },
    ];
  }

  // ================================
  // 产品页配置
  // ================================

  /**
   * 获取产品页配置
   * @description 依据：02.3-前端API接口清单.md 第1.8节
   * @returns 产品页配置数据
   */
  async getProductsConfig(): Promise<ProductsConfig> {
    return getOrSet(
      CACHE_KEYS.PAGE.PRODUCT,
      async () => {
        // 从 PageConfig 表获取产品页配置
        const pageConfig = await prisma.pageConfig.findUnique({
          where: { pageType: 'product' },
        });

        // 如果没有配置，返回默认值
        if (!pageConfig) {
          return this.getDefaultProductsConfig();
        }

        // 安全解析 JSON 配置
        const config = pageConfig.config as Record<string, unknown> | null;
        if (!config) {
          return this.getDefaultProductsConfig();
        }

        return {
          tab1Name: String(config.tab1Name ?? 'Productos'),
          tab1Filter: String(config.tab1Filter ?? 'VIC,NWS,QLD'),
          tab2Name: String(config.tab2Name ?? 'Financiar'),
          tab2Filter: String(config.tab2Filter ?? 'FINANCIAL'),
          defaultTab: Number(config.defaultTab ?? 1),
          listLayout: (config.listLayout as ProductsConfig['listLayout']) ?? 'auto',
          cardStyle: (config.cardStyle as ProductsConfig['cardStyle']) ?? 'standard',
          vipBadgeColor: String(config.vipBadgeColor ?? '#f97316'),
          purchasedBadge: String(config.purchasedBadge ?? 'Adquirido'),
          lockedTip: String(config.lockedTip ?? 'Requiere VIP{level}'),
        };
      },
      CACHE_TTL.PAGE_CONFIG
    );
  }

  /**
   * 获取默认产品页配置
   */
  private getDefaultProductsConfig(): ProductsConfig {
    return {
      tab1Name: 'Productos',
      tab1Filter: 'VIC,NWS,QLD',
      tab2Name: 'Financiar',
      tab2Filter: 'FINANCIAL',
      defaultTab: 1,
      listLayout: 'auto',
      cardStyle: 'standard',
      vipBadgeColor: '#f97316',
      purchasedBadge: 'Adquirido',
      lockedTip: 'Agotado',
    };
  }

  // ================================
  // 动画配置
  // ================================

  /**
   * 获取动画配置
   * @description 依据：02.3-前端API接口清单.md 第1.9节
   * @returns 动画配置数据
   */
  async getAnimationConfig(): Promise<AnimationConfig> {
    return getOrSet(
      CACHE_KEYS.ANIMATION.CONFIG,
      async () => {
        // 从 AnimationConfig 表获取配置
        const animationConfig = await prisma.animationConfig.findFirst();

        // 如果没有配置，返回默认值
        if (!animationConfig) {
          return this.getDefaultAnimationConfig();
        }

        return {
          animationEnabled: animationConfig.animationEnabled,
          animationSpeed: Number(animationConfig.animationSpeed),
          reducedMotion: animationConfig.reducedMotion,
          celebrationEffect: animationConfig.celebrationEffect,
          pageTransition: animationConfig.pageTransition,
          skeletonLoading: animationConfig.skeletonLoading,
          pullToRefresh: animationConfig.pullToRefresh,
        };
      },
      CACHE_TTL.ANIMATION_CONFIG
    );
  }

  /**
   * 获取默认动画配置
   */
  private getDefaultAnimationConfig(): AnimationConfig {
    return {
      animationEnabled: true,
      animationSpeed: 1.0,
      reducedMotion: false,
      celebrationEffect: true,
      pageTransition: true,
      skeletonLoading: true,
      pullToRefresh: true,
    };
  }

  // ================================
  // Banner
  // ================================

  /**
   * 获取轮播Banner列表
   * @description 依据：02.1-数据库设计.md 第2.8节
   * 有效期检查：startAt 为空或 <= now() 且 endAt 为空或 >= now()
   * 
   * 缓存策略：1分钟短时间缓存
   * - Banner 有时效性（startAt/endAt），需要定期刷新
   * - 使用短时间缓存平衡数据库压力与实时性
   * 
   * @returns 有效的Banner列表
   */
  async getBanners(): Promise<BannerItem[]> {
    return getOrSet(
      CACHE_KEYS.BANNER.LIST,
      async () => {
        const now = new Date();

        // 查询有效的Banner
        // 条件：isActive = true 且在有效期内
        const banners = await prisma.banner.findMany({
          where: {
            isActive: true,
            // startAt 为空或 <= now()
            OR: [
              { startAt: null },
              { startAt: { lte: now } },
            ],
          },
          orderBy: {
            sortOrder: 'desc', // 按 sortOrder 降序排列
          },
        });

        // 再次过滤 endAt（Prisma 不支持同时使用 OR 和 AND 复杂条件）
        const validBanners = banners.filter(banner => {
          // endAt 为空或 >= now()
          return !banner.endAt || banner.endAt >= now;
        });

        return validBanners.map(banner => ({
          id: banner.id,
          imageUrl: banner.imageUrl,
          linkType: banner.linkType as BannerItem['linkType'],
          linkUrl: banner.linkUrl,
          productId: banner.productId,
        }));
      },
      CACHE_TTL.BANNER_LIST
    );
  }

  // ================================
  // 客服链接
  // ================================

  /**
   * 获取客服链接列表
   * @description 依据：02.3-前端API接口清单.md 第1.10节
   * 从 GlobalConfig 的 service_links 配置项获取
   * 仅返回 isActive 为 true 的链接（过滤禁用的链接）
   * @returns 客服链接列表
   */
  async getServiceLinks(): Promise<ServiceLinkItem[]> {
    // 从 GlobalConfig 表获取客服链接配置
    const config = await prisma.globalConfig.findUnique({
      where: { key: 'service_links' },
    });

    if (!config || !config.value) {
      return [];
    }

    // 安全解析 JSON 配置
    try {
      const links = config.value as unknown;
      if (Array.isArray(links)) {
        return links
          // 过滤掉 isActive 为 false 的链接（禁用的链接不返回给前端）
          .filter(link => link.isActive !== false)
          .map(link => ({
            name: String(link.name ?? ''),
            icon: String(link.icon ?? ''),
            url: String(link.url ?? ''),
          }))
          .filter(link => link.name && link.url);
      }
      return [];
    } catch {
      return [];
    }
  }

  // ================================
  // 银行列表
  // ================================

  /**
   * 获取银行列表
   * @description 依据：02.1-数据库设计.md 第2.12节
   * 仅返回 isActive = true 的银行，按 sortOrder 排序
   * @returns 银行列表
   */
  async getBanks(): Promise<BankItem[]> {
    return getOrSet(
      CACHE_KEYS.BANK.LIST,
      async () => {
        const banks = await prisma.bank.findMany({
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          select: {
            code: true,
            name: true,
          },
        });

        return banks.map(bank => ({
          code: bank.code,
          name: bank.name,
        }));
      },
      CACHE_TTL.BANK_LIST
    );
  }

  // ================================
  // 缓存清理
  // ================================

  /**
   * 清除首页配置缓存
   */
  async clearHomeConfigCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.PAGE.HOME);
  }

  /**
   * 清除个人中心配置缓存
   */
  async clearProfileConfigCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.PAGE.PROFILE);
  }

  /**
   * 清除产品页配置缓存
   */
  async clearProductsConfigCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.PAGE.PRODUCT);
  }

  /**
   * 清除动画配置缓存
   */
  async clearAnimationConfigCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.ANIMATION.CONFIG);
  }

  /**
   * 清除银行列表缓存
   */
  async clearBankListCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.BANK.LIST);
  }

  /**
   * 清除Banner列表缓存
   */
  async clearBannerListCache(): Promise<void> {
    await deleteCache(CACHE_KEYS.BANNER.LIST);
  }

  /**
   * 清除所有页面配置缓存
   */
  async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clearHomeConfigCache(),
      this.clearProfileConfigCache(),
      this.clearProductsConfigCache(),
      this.clearAnimationConfigCache(),
      this.clearBankListCache(),
      this.clearBannerListCache(),
    ]);
  }
}

// 单例导出
export const pageConfigService = new PageConfigService();
