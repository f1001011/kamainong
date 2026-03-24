/**
 * @file Banner 类型定义
 * @description Banner管理相关的 TypeScript 类型定义
 * @depends 开发文档/04-后台管理端/04.8-内容管理/04.8.1-Banner管理页.md
 */

/**
 * Banner 跳转类型枚举
 * @description Banner点击后的跳转行为类型
 */
export type BannerLinkType = 'NONE' | 'INTERNAL' | 'EXTERNAL' | 'PRODUCT';

/**
 * Banner 数据结构
 * @description 依据：04.8.1-Banner管理页.md 第7.1节
 */
export interface Banner {
  /** Banner ID */
  id: number;
  /** Banner图片URL */
  imageUrl: string;
  /** 跳转类型 */
  linkType: BannerLinkType;
  /** 跳转链接（linkType=INTERNAL/EXTERNAL时使用） */
  linkUrl: string | null;
  /** 关联产品ID（linkType=PRODUCT时使用） */
  productId: number | null;
  /** 关联产品名称（列表返回） */
  productName?: string;
  /** 生效开始时间 */
  startAt: string | null;
  /** 生效结束时间 */
  endAt: string | null;
  /** 是否启用 */
  isActive: boolean;
  /** 排序顺序（数值越小越靠前） */
  sortOrder: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * Banner 列表查询参数
 * @description 依据：04.8.1-Banner管理页.md 第3.3节
 */
export interface BannerListParams {
  /** 当前页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 跳转类型筛选 */
  linkType?: BannerLinkType;
  /** 启用状态筛选 */
  isActive?: boolean;
  /** 生效时间范围-开始 */
  startDate?: string;
  /** 生效时间范围-结束 */
  endDate?: string;
}

/**
 * Banner 列表响应
 */
export interface BannerListResponse {
  list: Banner[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Banner 表单数据
 * @description 依据：04.8.1-Banner管理页.md 第4.2节
 */
export interface BannerFormData {
  /** Banner图片URL */
  imageUrl: string;
  /** 跳转类型 */
  linkType: BannerLinkType;
  /** 跳转链接 */
  linkUrl?: string | null;
  /** 关联产品ID */
  productId?: number | null;
  /** 生效开始时间 */
  startAt?: string | null;
  /** 生效结束时间 */
  endAt?: string | null;
  /** 是否启用 */
  isActive: boolean;
}

/**
 * Banner 排序请求
 * @description 依据：04.8.1-Banner管理页.md 第5.2节
 */
export interface BannerSortRequest {
  /** 按排序后的顺序传入Banner ID数组 */
  ids: number[];
}

/**
 * Banner 批量状态变更请求
 * @description 依据：04.8.1-Banner管理页.md 第6.2节
 */
export interface BannerBatchStatusRequest {
  /** Banner ID数组 */
  ids: number[];
  /** 目标状态 */
  isActive: boolean;
}

/**
 * Banner 批量删除请求
 */
export interface BannerBatchDeleteRequest {
  /** Banner ID数组 */
  ids: number[];
}

/**
 * 批量操作结果
 * @description 依据：04.0-后台架构.md 第5.5节
 */
export interface BannerBatchOperationResult {
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
 * 跳转类型选项配置
 */
export const BANNER_LINK_TYPE_OPTIONS = [
  { value: 'NONE', label: '无跳转' },
  { value: 'INTERNAL', label: '内部页面' },
  { value: 'EXTERNAL', label: '外部链接' },
  { value: 'PRODUCT', label: '产品详情' },
];

/**
 * 内部页面路径选项配置
 * @description 依据：04.8.1-Banner管理页.md 第4.4节
 */
export const INTERNAL_PATH_OPTIONS = [
  { value: '/products', label: '产品列表' },
  { value: '/activities', label: '活动中心' },
  { value: '/team', label: '我的团队' },
  { value: '/recharge', label: '充值页面' },
  { value: '/withdraw', label: '提现页面' },
  { value: '/profile', label: '个人中心' },
  { value: '/about', label: '关于我们' },
];

/**
 * URL验证正则
 * @description 依据：04.8.1-Banner管理页.md 第4.6节
 */
export const URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

/**
 * Banner 生效状态枚举
 */
export type BannerEffectiveStatus = 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'EXPIRING_SOON' | 'NOT_STARTED';

/**
 * 判断 Banner 是否在生效时间内
 * @description 依据：04.8.1-Banner管理页.md 第11.6节
 */
export function getBannerEffectiveStatus(banner: Banner): BannerEffectiveStatus {
  // 首先检查是否禁用
  if (!banner.isActive) {
    return 'DISABLED';
  }

  const now = new Date();
  
  // 检查开始时间
  if (banner.startAt && new Date(banner.startAt) > now) {
    return 'NOT_STARTED'; // 未到开始时间
  }
  
  // 检查结束时间
  if (banner.endAt) {
    const endDate = new Date(banner.endAt);
    if (endDate < now) {
      return 'EXPIRED'; // 已过结束时间
    }
    
    // 检查是否即将过期（7天内）
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    if (endDate <= sevenDaysLater) {
      return 'EXPIRING_SOON';
    }
  }
  
  return 'ACTIVE';
}
