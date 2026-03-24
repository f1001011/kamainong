/**
 * @file 产品类型定义
 * @description 产品管理相关的 TypeScript 类型定义
 * @depends 开发文档/04-后台管理端/04.5-产品管理/04.5.1-产品列表页.md
 */

/**
 * 产品类型枚举
 * @description 用于判断产品是体验产品还是付费产品，决定是否触发返佣
 */
export type ProductType = 'TRIAL' | 'PAID' | 'FINANCIAL';

/**
 * 产品系列枚举
 * @description 用于区分产品系列，PO系列无等级要求，VIP系列需对应VIP等级
 */
export type ProductSeries = 'PO' | 'VIP' | 'VIC' | 'NWS' | 'QLD' | 'FINANCIAL';

/**
 * 产品状态枚举
 * @description 产品上下架状态
 */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

/**
 * 产品列表项
 * @description 依据：04.5.1-产品列表页.md 第7.3节
 */
export interface ProductListItem {
  /** 产品ID */
  id: number;
  /** 产品编码 */
  code: string;
  /** 产品名称 */
  name: string;
  /** 产品类型（TRIAL=体验 PAID=付费） - 禁止用code判断 */
  type: ProductType;
  /** 产品系列（PO=Po系列 VIP=VIP系列） - 禁止用code判断 */
  series: ProductSeries;
  /** 产品价格 */
  price: string;
  /** 日收益 */
  dailyIncome: string;
  /** 周期天数 */
  cycleDays: number;
  /** 总收益 */
  totalIncome: string;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantVipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantSvipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  requireVipLevel?: number;
  /** 限购数量（遗留字段） */
  purchaseLimit: number;
  /** 单用户限购数量（null=不限购） */
  userPurchaseLimit: number | null;
  /** 前端显示的限购数（null=不显示） */
  displayUserLimit: number | null;
  /** 产品主图 */
  mainImage: string | null;
  /** 产品状态 */
  status: ProductStatus;
  /** 排序权重 */
  sortOrder: number;
  /** 累计销售数量 */
  totalSold: number;
  /** 累计销售金额 */
  totalAmount: string;
  /** 是否显示新手推荐角标 */
  showRecommendBadge: boolean;
  /** 自定义角标文案 */
  customBadgeText: string | null;
  /** 全局库存 */
  globalStock: number | null;
  /** 全局已售 */
  globalSold: number | null;
  /** 产品销售状态 */
  productStatus: 'OPEN' | 'COMING_SOON' | 'CLOSED' | null;
  /** SVIP每日奖励 */
  svipDailyReward: number | null;
  /** SVIP所需持仓数 */
  svipRequireCount: number | null;
  /** 到期返还本金 */
  returnPrincipal: boolean;
  /** 活跃持仓数量（用于判断能否删除） */
  activePositionCount?: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 产品列表查询参数
 * @description 依据：04.5.1-产品列表页.md 第7.2节
 */
export interface ProductListParams {
  /** 产品名称/编码模糊搜索 */
  name?: string;
  /** 产品系列 */
  series?: ProductSeries;
  /** 产品类型 */
  type?: ProductType;
  /** 状态 */
  status?: ProductStatus;
  /** 价格最小值 */
  priceMin?: number;
  /** 价格最大值 */
  priceMax?: number;
}

/**
 * 产品状态变更请求
 * @description 依据：04.5.1-产品列表页.md 第7.4节
 */
export interface ProductStatusChangeRequest {
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * 产品排序请求
 * @description 依据：04.5.1-产品列表页.md 第7.5节
 */
export interface ProductSortRequest {
  /** 按排序后的顺序传入产品ID数组 */
  ids: number[];
}

/**
 * 批量状态变更请求
 * @description 依据：04.5.1-产品列表页.md 第7.6节
 */
export interface ProductBatchStatusRequest {
  /** 产品ID数组 */
  ids: number[];
  /** 目标状态 */
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * 批量操作结果
 * @description 依据：API规范 第12节
 */
export interface BatchOperationResult {
  /** 总数 */
  total: number;
  /** 成功数 */
  succeeded: number;
  /** 失败数 */
  failed: number;
  /** 详细结果 */
  results: Array<{
    id: number;
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * 产品类型选项配置
 */
export const PRODUCT_TYPE_OPTIONS = [
  { value: 'TRIAL', label: '体验产品', color: 'default' },
  { value: 'PAID', label: '付费产品', color: 'success' },
  { value: 'FINANCIAL', label: '理财产品', color: 'processing' },
];

/**
 * 产品系列选项配置
 */
export const PRODUCT_SERIES_OPTIONS = [
  { value: 'PO', label: 'Po系列', color: 'blue' },
  { value: 'VIP', label: 'VIP系列', color: 'gold' },
  { value: 'VIC', label: 'VIC系列', color: 'cyan' },
  { value: 'NWS', label: 'NWS系列', color: 'green' },
  { value: 'QLD', label: 'QLD系列', color: 'purple' },
  { value: 'FINANCIAL', label: '理财系列', color: 'magenta' },
];

/**
 * 产品状态选项配置
 */
export const PRODUCT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '上架', color: 'success' },
  { value: 'INACTIVE', label: '下架', color: 'default' },
];

/**
 * 产品详情
 * @description 依据：04.5.2-产品编辑页.md 第8.4节
 */
export interface ProductDetail {
  /** 产品ID */
  id: number;
  /** 产品编码 */
  code: string;
  /** 产品名称 */
  name: string;
  /** 产品类型（TRIAL=体验 PAID=付费） */
  type: ProductType;
  /** 产品系列（PO=Po系列 VIP=VIP系列） */
  series: ProductSeries;
  /** 产品价格 */
  price: string;
  /** 日收益 */
  dailyIncome: string;
  /** 周期天数 */
  cycleDays: number;
  /** 总收益（自动计算） */
  totalIncome: string;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantVipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantSvipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  requireVipLevel?: number;
  /** 限购数量（遗留字段） */
  purchaseLimit: number;
  /** 单用户限购数量（null=不限购） */
  userPurchaseLimit: number | null;
  /** 全局库存（null=不限） */
  globalStock: number | null;
  /** 全局已售 */
  globalSold: number;
  /** 前端显示的限购数（null=不显示） */
  displayUserLimit: number | null;
  /** SVIP每日奖励金额 */
  svipDailyReward: number | null;
  /** SVIP需要持仓数 */
  svipRequireCount: number | null;
  /** 到期是否返还本金 */
  returnPrincipal: boolean;
  /** 产品销售状态 OPEN/COMING_SOON/CLOSED */
  productStatus: string;
  /** 产品主图URL */
  mainImage: string | null;
  /** 详情图片URL数组 */
  detailImages: string[] | null;
  /** 富文本详情内容 */
  detailContent: string | null;
  /** 是否显示新手推荐角标 */
  showRecommendBadge: boolean;
  /** 自定义角标文案 */
  customBadgeText: string | null;
  /** 产品状态 */
  status: ProductStatus;
  /** 排序权重 */
  sortOrder: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 产品表单数据
 * @description 依据：04.5.2-产品编辑页.md 第8.2节
 */
export interface ProductFormData {
  /** 产品编码（唯一标识，1-20位字母数字） */
  code: string;
  /** 产品名称（1-100字符） */
  name: string;
  /** 产品类型 */
  type: ProductType;
  /** 产品系列 */
  series: ProductSeries;
  /** 价格（字符串，精确2位小数） */
  price: string;
  /** 日收益 */
  dailyIncome: string;
  /** 周期天数（1-9999） */
  cycleDays: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantVipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  grantSvipLevel?: number;
  /** @deprecated 新产品体系不使用，保留向后兼容 */
  requireVipLevel?: number;
  /** 限购数量（≥1） */
  purchaseLimit: number;
  /** 产品主图URL */
  mainImage?: string | null;
  /** 详情图片URL数组 */
  detailImages?: string[] | null;
  /** 富文本详情内容 */
  detailContent?: string | null;
  /** 是否显示新手推荐角标 */
  showRecommendBadge: boolean;
  /** 自定义角标文案（最多50字符） */
  customBadgeText?: string | null;
  /** 排序权重（数值越大越靠前） */
  sortOrder: number;
  /** 产品状态 */
  status: 'ACTIVE' | 'INACTIVE';
  /** 全局库存 */
  globalStock?: number | null;
  /** 用户购买限制 */
  userPurchaseLimit?: number | null;
  /** 显示用户限购数 */
  displayUserLimit?: number | null;
  /** SVIP每日奖励 */
  svipDailyReward?: number | null;
  /** SVIP所需持仓数 */
  svipRequireCount?: number | null;
  /** 是否返还本金 */
  returnPrincipal?: boolean;
  /** 产品销售状态 */
  productStatus?: 'OPEN' | 'COMING_SOON' | 'CLOSED';
}

/**
 * VIP等级选项（赠送）
 * @description 依据：04.5.2-产品编辑页.md 第3.3节
 */
export const VIP_GRANT_OPTIONS = [
  { value: 0, label: '不赠送' },
  { value: 1, label: 'VIP1' },
  { value: 2, label: 'VIP2' },
  { value: 3, label: 'VIP3' },
  { value: 4, label: 'VIP4' },
  { value: 5, label: 'VIP5' },
  { value: 6, label: 'VIP6' },
  { value: 7, label: 'VIP7' },
  { value: 8, label: 'VIP8' },
];

/**
 * VIP等级选项（要求）
 * @description 依据：04.5.2-产品编辑页.md 第3.3节
 */
export const VIP_REQUIRE_OPTIONS = [
  { value: 0, label: '无要求' },
  { value: 1, label: '需VIP1' },
  { value: 2, label: '需VIP2' },
  { value: 3, label: '需VIP3' },
  { value: 4, label: '需VIP4' },
  { value: 5, label: '需VIP5' },
  { value: 6, label: '需VIP6' },
  { value: 7, label: '需VIP7' },
  { value: 8, label: '需VIP8' },
];

/**
 * 周期快捷按钮配置
 */
export const CYCLE_QUICK_OPTIONS = [30, 90, 180, 365];

/**
 * 产品销售状态选项
 */
export const PRODUCT_SALE_STATUS_OPTIONS = [
  { value: 'OPEN', label: '开放购买', color: 'success' },
  { value: 'COMING_SOON', label: '即将开放', color: 'warning' },
  { value: 'CLOSED', label: '已关闭', color: 'default' },
];
