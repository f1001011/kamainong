/**
 * @file 内容管理服务
 * @description 后台内容管理：Banner、公告、客服链接、海报配置、关于我们
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11节 - 内容管理接口
 */

import { prisma, Prisma } from '@/lib/prisma';
import { BusinessError, Errors } from '@/lib/errors';
import type {
  BannerLinkType,
  AnnouncementTarget,
  PopupFrequency,
} from '@honeywell/database';

// ================================
// 类型定义
// ================================

/**
 * Banner 列表项
 */
export interface BannerListItem {
  id: number;
  imageUrl: string;
  linkType: BannerLinkType;
  linkUrl: string | null;
  productId: number | null;
  productName?: string | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  sortOrder: number;
  isEffective: boolean; // 是否在有效期内
  createdAt: string;
  updatedAt: string;
}

/**
 * Banner 列表筛选参数
 */
export interface BannerListParams {
  isActive?: boolean;
  keyword?: string;
}

/**
 * Banner 创建/更新数据
 */
export interface BannerFormData {
  imageUrl: string;
  linkType: BannerLinkType;
  linkUrl?: string | null;
  productId?: number | null;
  startAt?: string | null;
  endAt?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * 公告列表项
 */
export interface AdminAnnouncementListItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  targetType: AnnouncementTarget;
  targetUserIds: number[] | null;
  targetUserCount: number;
  popupFrequency: PopupFrequency;
  buttons: AnnouncementButton[] | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  sortOrder: number;
  isEffective: boolean;
  readCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 公告按钮配置
 * @description 依据：04.8.2-公告管理页.md 第10节 - 按钮配置
 */
export interface AnnouncementButton {
  text: string;
  type: 'primary' | 'default';
  action: 'close' | 'link';
  url?: string;
}

/**
 * 公告列表筛选参数
 * @description 依据：04.8.2-公告管理页.md 第6节 - 筛选条件
 */
export interface AnnouncementListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
  targetType?: AnnouncementTarget;
  popupFrequency?: PopupFrequency;
  effectiveStartDate?: string;
  effectiveEndDate?: string;
  sortField?: 'id' | 'sortOrder' | 'createdAt';
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 公告创建/更新数据
 */
export interface AnnouncementFormData {
  title: string;
  content: string;
  imageUrl?: string | null;
  targetType?: AnnouncementTarget;
  targetUserIds?: number[] | null;
  popupFrequency?: PopupFrequency;
  buttons?: AnnouncementButton[] | null;
  startAt?: string | null;
  endAt?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 客服链接项
 */
export interface ServiceLinkItem {
  index: number;
  name: string;
  icon: string;
  url: string;
  isActive: boolean;
}

/**
 * 海报配置
 */
export interface PosterConfig {
  backgroundImage: string;
  qrCodePositionX: number;
  qrCodePositionY: number;
  qrCodeSize: number;
  inviteCodePositionX: number;
  inviteCodePositionY: number;
  inviteCodeFontSize: number;
  inviteCodeColor: string;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: { code: string; message: string };
  }>;
}

// ================================
// Banner 管理服务
// ================================

/**
 * 获取 Banner 列表
 * @description 依据：02.4-后台API接口清单.md 第11.1节
 */
export async function getBannerList(params: BannerListParams = {}): Promise<{ list: BannerListItem[] }> {
  const { isActive, keyword } = params;
  const now = new Date();

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }

  // 查询 Banner 列表
  const banners = await prisma.banner.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  // 获取关联的产品信息
  const productIds = banners
    .filter((b) => b.productId)
    .map((b) => b.productId as number);

  const products = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      })
    : [];

  const productMap = new Map(products.map((p) => [p.id, p.name]));

  // 格式化返回数据
  const list: BannerListItem[] = banners.map((banner) => {
    // 检查是否在有效期内
    let isEffective = banner.isActive;
    if (isEffective) {
      if (banner.startAt && banner.startAt > now) {
        isEffective = false;
      }
      if (banner.endAt && banner.endAt < now) {
        isEffective = false;
      }
    }

    return {
      id: banner.id,
      imageUrl: banner.imageUrl,
      linkType: banner.linkType,
      linkUrl: banner.linkUrl,
      productId: banner.productId,
      productName: banner.productId ? productMap.get(banner.productId) : null,
      startAt: banner.startAt?.toISOString() ?? null,
      endAt: banner.endAt?.toISOString() ?? null,
      isActive: banner.isActive,
      sortOrder: banner.sortOrder,
      isEffective,
      createdAt: banner.createdAt.toISOString(),
      updatedAt: banner.updatedAt.toISOString(),
    };
  });

  return { list };
}

/**
 * 获取 Banner 详情
 */
export async function getBannerDetail(id: number): Promise<BannerListItem> {
  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new BusinessError('BANNER_NOT_FOUND', 'Banner不存在', 404);
  }

  // 获取产品名称
  let productName: string | null = null;
  if (banner.productId) {
    const product = await prisma.product.findUnique({
      where: { id: banner.productId },
      select: { name: true },
    });
    productName = product?.name ?? null;
  }

  const now = new Date();
  let isEffective = banner.isActive;
  if (isEffective) {
    if (banner.startAt && banner.startAt > now) {
      isEffective = false;
    }
    if (banner.endAt && banner.endAt < now) {
      isEffective = false;
    }
  }

  return {
    id: banner.id,
    imageUrl: banner.imageUrl,
    linkType: banner.linkType,
    linkUrl: banner.linkUrl,
    productId: banner.productId,
    productName,
    startAt: banner.startAt?.toISOString() ?? null,
    endAt: banner.endAt?.toISOString() ?? null,
    isActive: banner.isActive,
    sortOrder: banner.sortOrder,
    isEffective,
    createdAt: banner.createdAt.toISOString(),
    updatedAt: banner.updatedAt.toISOString(),
  };
}

/**
 * 创建 Banner
 * @description 依据：02.4-后台API接口清单.md 第11.1节
 */
export async function createBanner(data: BannerFormData): Promise<BannerListItem> {
  // 如果是产品跳转，验证产品是否存在
  if (data.linkType === 'PRODUCT' && data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      throw Errors.adminProductNotFound();
    }
  }

  const banner = await prisma.banner.create({
    data: {
      imageUrl: data.imageUrl,
      linkType: data.linkType,
      linkUrl: data.linkUrl ?? null,
      productId: data.productId ?? null,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return getBannerDetail(banner.id);
}

/**
 * 更新 Banner
 */
export async function updateBanner(id: number, data: Partial<BannerFormData>): Promise<BannerListItem> {
  // 检查 Banner 是否存在
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new BusinessError('BANNER_NOT_FOUND', 'Banner不存在', 404);
  }

  // 如果是产品跳转，验证产品是否存在
  if (data.linkType === 'PRODUCT' && data.productId) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) {
      throw Errors.adminProductNotFound();
    }
  }

  // 准备更新数据
  const updateData: Record<string, unknown> = {};
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.linkType !== undefined) updateData.linkType = data.linkType;
  if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
  if (data.productId !== undefined) updateData.productId = data.productId;
  if (data.startAt !== undefined) updateData.startAt = data.startAt ? new Date(data.startAt) : null;
  if (data.endAt !== undefined) updateData.endAt = data.endAt ? new Date(data.endAt) : null;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  await prisma.banner.update({
    where: { id },
    data: updateData,
  });

  return getBannerDetail(id);
}

/**
 * 删除 Banner
 */
export async function deleteBanner(id: number): Promise<void> {
  const existing = await prisma.banner.findUnique({ where: { id } });
  if (!existing) {
    throw new BusinessError('BANNER_NOT_FOUND', 'Banner不存在', 404);
  }

  await prisma.banner.delete({ where: { id } });
}

/**
 * Banner 排序
 * @description 依据：02.4-后台API接口清单.md 第11.1节
 */
export async function updateBannerSort(items: Array<{ id: number; sortOrder: number }>): Promise<void> {
  // 使用事务批量更新排序
  await prisma.$transaction(
    items.map((item) =>
      prisma.banner.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
}

/**
 * 批量启用/禁用 Banner
 */
export async function batchUpdateBannerStatus(ids: number[], isActive: boolean): Promise<BatchOperationResult> {
  const results: BatchOperationResult['results'] = [];
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      const existing = await prisma.banner.findUnique({ where: { id } });
      if (!existing) {
        results.push({
          id,
          success: false,
          error: { code: 'BANNER_NOT_FOUND', message: 'Banner不存在' },
        });
        failed++;
        continue;
      }

      await prisma.banner.update({
        where: { id },
        data: { isActive },
      });

      results.push({ id, success: true });
      succeeded++;
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新失败' },
      });
      failed++;
    }
  }

  return { total: ids.length, succeeded, failed, results };
}

/**
 * 批量删除 Banner
 */
export async function batchDeleteBanner(ids: number[]): Promise<BatchOperationResult> {
  const results: BatchOperationResult['results'] = [];
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      const existing = await prisma.banner.findUnique({ where: { id } });
      if (!existing) {
        results.push({
          id,
          success: false,
          error: { code: 'BANNER_NOT_FOUND', message: 'Banner不存在' },
        });
        failed++;
        continue;
      }

      await prisma.banner.delete({ where: { id } });
      results.push({ id, success: true });
      succeeded++;
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'DELETE_FAILED', message: '删除失败' },
      });
      failed++;
    }
  }

  return { total: ids.length, succeeded, failed, results };
}

// ================================
// 公告管理服务
// ================================

/**
 * 获取公告列表（后台管理）
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 */
export async function getAdminAnnouncementList(params: AnnouncementListParams = {}): Promise<{
  list: AdminAnnouncementListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const { 
    page = 1, 
    pageSize = 20, 
    keyword, 
    isActive, 
    targetType,
    popupFrequency,
    effectiveStartDate,
    effectiveEndDate,
    sortField,
    sortOrder,
  } = params;
  const now = new Date();

  // 构建查询条件
  const where: Record<string, unknown> = {};
  if (typeof isActive === 'boolean') {
    where.isActive = isActive;
  }
  if (targetType) {
    where.targetType = targetType;
  }
  if (popupFrequency) {
    where.popupFrequency = popupFrequency;
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } },
    ];
  }

  // 生效时间范围筛选
  if (effectiveStartDate || effectiveEndDate) {
    // 筛选在指定时间范围内生效的公告
    const timeConditions: unknown[] = [];
    
    if (effectiveStartDate) {
      const startDate = new Date(effectiveStartDate);
      // 公告的开始时间在筛选开始之后，或者公告结束时间在筛选开始之后（或无结束时间）
      timeConditions.push({
        OR: [
          { startAt: { gte: startDate } },
          { endAt: { gte: startDate } },
          { AND: [{ startAt: null }, { endAt: null }] }, // 长期有效的公告
        ],
      });
    }
    
    if (effectiveEndDate) {
      const endDate = new Date(effectiveEndDate);
      // 公告的开始时间在筛选结束之前（或无开始时间）
      timeConditions.push({
        OR: [
          { startAt: { lte: endDate } },
          { startAt: null },
        ],
      });
    }
    
    if (timeConditions.length > 0) {
      where.AND = timeConditions;
    }
  }

  // 查询总数
  const total = await prisma.announcement.count({ where });

  // 构建排序条件
  type OrderByField = 'id' | 'sortOrder' | 'createdAt';
  type OrderByDirection = 'asc' | 'desc';
  const orderBy: { [key in OrderByField]?: OrderByDirection }[] = [];
  
  if (sortField && sortOrder) {
    const direction: OrderByDirection = sortOrder === 'ascend' ? 'asc' : 'desc';
    orderBy.push({ [sortField]: direction });
  }
  
  // 默认排序：排序值升序、创建时间降序
  if (orderBy.length === 0) {
    orderBy.push({ sortOrder: 'asc' }, { createdAt: 'desc' });
  }

  // 查询公告列表
  const announcements = await prisma.announcement.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy,
    include: {
      _count: {
        select: { readRecords: true },
      },
    },
  });

  // 格式化返回数据
  const list: AdminAnnouncementListItem[] = announcements.map((announcement) => {
    // 检查是否在有效期内
    let isEffective = announcement.isActive;
    if (isEffective) {
      if (announcement.startAt && announcement.startAt > now) {
        isEffective = false;
      }
      if (announcement.endAt && announcement.endAt < now) {
        isEffective = false;
      }
    }

    // 解析目标用户ID
    const targetUserIds = announcement.targetUserIds as number[] | null;
    const targetUserCount = targetUserIds?.length ?? 0;

    // 解析按钮配置
    let buttons: AnnouncementButton[] | null = null;
    if (announcement.buttons) {
      try {
        buttons = announcement.buttons as unknown as AnnouncementButton[];
      } catch {
        buttons = null;
      }
    }

    return {
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      imageUrl: announcement.imageUrl,
      targetType: announcement.targetType,
      targetUserIds,
      targetUserCount,
      popupFrequency: announcement.popupFrequency,
      buttons,
      startAt: announcement.startAt?.toISOString() ?? null,
      endAt: announcement.endAt?.toISOString() ?? null,
      isActive: announcement.isActive,
      sortOrder: announcement.sortOrder,
      isEffective,
      readCount: announcement._count.readRecords,
      createdAt: announcement.createdAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    };
  });

  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取公告详情（后台管理）
 */
export async function getAdminAnnouncementDetail(id: number): Promise<AdminAnnouncementListItem> {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: {
      _count: {
        select: { readRecords: true },
      },
    },
  });

  if (!announcement) {
    throw Errors.announcementNotFound();
  }

  const now = new Date();
  let isEffective = announcement.isActive;
  if (isEffective) {
    if (announcement.startAt && announcement.startAt > now) {
      isEffective = false;
    }
    if (announcement.endAt && announcement.endAt < now) {
      isEffective = false;
    }
  }

  const targetUserIds = announcement.targetUserIds as number[] | null;
  let buttons: AnnouncementButton[] | null = null;
  if (announcement.buttons) {
    try {
      buttons = announcement.buttons as unknown as AnnouncementButton[];
    } catch {
      buttons = null;
    }
  }

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    imageUrl: announcement.imageUrl,
    targetType: announcement.targetType,
    targetUserIds,
    targetUserCount: targetUserIds?.length ?? 0,
    popupFrequency: announcement.popupFrequency,
    buttons,
    startAt: announcement.startAt?.toISOString() ?? null,
    endAt: announcement.endAt?.toISOString() ?? null,
    isActive: announcement.isActive,
    sortOrder: announcement.sortOrder,
    isEffective,
    readCount: announcement._count.readRecords,
    createdAt: announcement.createdAt.toISOString(),
    updatedAt: announcement.updatedAt.toISOString(),
  };
}

/**
 * 创建公告
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 */
export async function createAnnouncement(data: AnnouncementFormData): Promise<AdminAnnouncementListItem> {
  const announcement = await prisma.announcement.create({
    data: {
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl ?? null,
      targetType: data.targetType ?? 'ALL',
      targetUserIds: data.targetUserIds ?? Prisma.JsonNull,
      popupFrequency: data.popupFrequency ?? 'ONCE',
      buttons: data.buttons ? (data.buttons as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });

  return getAdminAnnouncementDetail(announcement.id);
}

/**
 * 更新公告
 */
export async function updateAnnouncement(id: number, data: Partial<AnnouncementFormData>): Promise<AdminAnnouncementListItem> {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    throw Errors.announcementNotFound();
  }

  // 准备更新数据
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.targetType !== undefined) updateData.targetType = data.targetType;
  if (data.targetUserIds !== undefined) updateData.targetUserIds = data.targetUserIds ?? Prisma.JsonNull;
  if (data.popupFrequency !== undefined) updateData.popupFrequency = data.popupFrequency;
  if (data.buttons !== undefined) updateData.buttons = data.buttons ? (data.buttons as unknown as Prisma.InputJsonValue) : Prisma.JsonNull;
  if (data.startAt !== undefined) updateData.startAt = data.startAt ? new Date(data.startAt) : null;
  if (data.endAt !== undefined) updateData.endAt = data.endAt ? new Date(data.endAt) : null;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  await prisma.announcement.update({
    where: { id },
    data: updateData,
  });

  return getAdminAnnouncementDetail(id);
}

/**
 * 删除公告
 */
export async function deleteAnnouncement(id: number): Promise<void> {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    throw Errors.announcementNotFound();
  }

  // 删除公告及其已读记录
  await prisma.$transaction([
    prisma.announcementRead.deleteMany({ where: { announcementId: id } }),
    prisma.announcement.delete({ where: { id } }),
  ]);
}

/**
 * 预览公告（返回渲染后的HTML内容）
 * @description 依据：02.4-后台API接口清单.md 第11.2节
 */
export async function previewAnnouncement(id: number): Promise<{
  title: string;
  content: string;
  imageUrl: string | null;
  buttons: AnnouncementButton[] | null;
}> {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: {
      title: true,
      content: true,
      imageUrl: true,
      buttons: true,
    },
  });

  if (!announcement) {
    throw Errors.announcementNotFound();
  }

  let buttons: AnnouncementButton[] | null = null;
  if (announcement.buttons) {
    try {
      buttons = announcement.buttons as unknown as AnnouncementButton[];
    } catch {
      buttons = null;
    }
  }

  return {
    title: announcement.title,
    content: announcement.content,
    imageUrl: announcement.imageUrl,
    buttons,
  };
}

/**
 * 批量启用/禁用公告
 */
export async function batchUpdateAnnouncementStatus(ids: number[], isActive: boolean): Promise<BatchOperationResult> {
  const results: BatchOperationResult['results'] = [];
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) {
        results.push({
          id,
          success: false,
          error: { code: 'ANNOUNCEMENT_NOT_FOUND', message: '公告不存在' },
        });
        failed++;
        continue;
      }

      await prisma.announcement.update({
        where: { id },
        data: { isActive },
      });

      results.push({ id, success: true });
      succeeded++;
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新失败' },
      });
      failed++;
    }
  }

  return { total: ids.length, succeeded, failed, results };
}

/**
 * 批量删除公告
 */
export async function batchDeleteAnnouncement(ids: number[]): Promise<BatchOperationResult> {
  const results: BatchOperationResult['results'] = [];
  let succeeded = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) {
        results.push({
          id,
          success: false,
          error: { code: 'ANNOUNCEMENT_NOT_FOUND', message: '公告不存在' },
        });
        failed++;
        continue;
      }

      // 删除公告及其已读记录
      await prisma.$transaction([
        prisma.announcementRead.deleteMany({ where: { announcementId: id } }),
        prisma.announcement.delete({ where: { id } }),
      ]);

      results.push({ id, success: true });
      succeeded++;
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'DELETE_FAILED', message: '删除失败' },
      });
      failed++;
    }
  }

  return { total: ids.length, succeeded, failed, results };
}

// ================================
// 客服链接配置服务
// ================================

/**
 * 获取客服链接列表
 * @description 依据：02.4-后台API接口清单.md 第11.3节
 * 客服链接存储在 GlobalConfig 表的 service_links JSON 字段中
 */
export async function getServiceLinks(): Promise<{ list: ServiceLinkItem[] }> {
  const config = await prisma.globalConfig.findUnique({
    where: { key: 'service_links' },
  });

  if (!config || !config.value) {
    return { list: [] };
  }

  const links = config.value as unknown as Array<{
    name: string;
    icon: string;
    url: string;
    isActive: boolean;
  }>;

  // 添加索引
  const list = links.map((link, index) => ({
    index,
    name: link.name,
    icon: link.icon,
    url: link.url,
    isActive: link.isActive ?? true,
  }));

  return { list };
}

/**
 * 更新客服链接列表（整体替换）
 * @description 依据：02.4-后台API接口清单.md 第11.3节
 */
export async function updateServiceLinks(
  list: Array<{ name: string; icon: string; url: string; isActive: boolean }>
): Promise<void> {
  await prisma.globalConfig.upsert({
    where: { key: 'service_links' },
    update: { value: list },
    create: {
      key: 'service_links',
      value: list,
      description: '客服链接配置',
    },
  });
}

// ================================
// 邀请海报配置服务
// ================================

/**
 * 获取邀请海报配置
 * @description 依据：02.4-后台API接口清单.md 第11.4节
 */
export async function getPosterConfig(): Promise<PosterConfig> {
  const config = await prisma.globalConfig.findUnique({
    where: { key: 'poster_config' },
  });

  // 默认配置
  const defaultConfig: PosterConfig = {
    backgroundImage: '',
    qrCodePositionX: 37,
    qrCodePositionY: 78,
    qrCodeSize: 180,
    inviteCodePositionX: 50,
    inviteCodePositionY: 94,
    inviteCodeFontSize: 16,
    inviteCodeColor: '#333333',
  };

  if (!config || !config.value) {
    return defaultConfig;
  }

  const stored = config.value as unknown as Partial<PosterConfig>;
  return {
    backgroundImage: stored.backgroundImage ?? defaultConfig.backgroundImage,
    qrCodePositionX: stored.qrCodePositionX ?? defaultConfig.qrCodePositionX,
    qrCodePositionY: stored.qrCodePositionY ?? defaultConfig.qrCodePositionY,
    qrCodeSize: stored.qrCodeSize ?? defaultConfig.qrCodeSize,
    inviteCodePositionX: stored.inviteCodePositionX ?? defaultConfig.inviteCodePositionX,
    inviteCodePositionY: stored.inviteCodePositionY ?? defaultConfig.inviteCodePositionY,
    inviteCodeFontSize: stored.inviteCodeFontSize ?? defaultConfig.inviteCodeFontSize,
    inviteCodeColor: stored.inviteCodeColor ?? defaultConfig.inviteCodeColor,
  };
}

/**
 * 更新邀请海报配置
 * @description 依据：02.4-后台API接口清单.md 第11.4节
 */
export async function updatePosterConfig(config: Partial<PosterConfig>): Promise<PosterConfig> {
  // 获取当前配置
  const current = await getPosterConfig();

  // 合并更新
  const newConfig: PosterConfig = {
    backgroundImage: config.backgroundImage ?? current.backgroundImage,
    qrCodePositionX: config.qrCodePositionX ?? current.qrCodePositionX,
    qrCodePositionY: config.qrCodePositionY ?? current.qrCodePositionY,
    qrCodeSize: config.qrCodeSize ?? current.qrCodeSize,
    inviteCodePositionX: config.inviteCodePositionX ?? current.inviteCodePositionX,
    inviteCodePositionY: config.inviteCodePositionY ?? current.inviteCodePositionY,
    inviteCodeFontSize: config.inviteCodeFontSize ?? current.inviteCodeFontSize,
    inviteCodeColor: config.inviteCodeColor ?? current.inviteCodeColor,
  };

  await prisma.globalConfig.upsert({
    where: { key: 'poster_config' },
    update: { value: newConfig as unknown as Prisma.InputJsonValue },
    create: {
      key: 'poster_config',
      value: newConfig as unknown as Prisma.InputJsonValue,
      description: '邀请海报配置',
    },
  });

  return newConfig;
}

// ================================
// 关于我们页面配置服务
// ================================

/**
 * 获取关于我们页面内容
 * @description 依据：02.4-后台API接口清单.md 第11.5节
 */
export async function getAboutUsContent(): Promise<{ content: string }> {
  const pageContent = await prisma.pageContent.findUnique({
    where: { pageId: 'about_us' },
  });

  if (!pageContent) {
    return { content: '' };
  }

  // 获取内容字段
  const contentData = pageContent.content as unknown as { html?: string; content?: string };
  const content = contentData?.html ?? contentData?.content ?? '';

  return { content };
}

/**
 * 更新关于我们页面内容
 * @description 依据：02.4-后台API接口清单.md 第11.5节
 * 保留 heroTitle/heroSubtitle 字段（前端 Hero 区域使用）
 */
export async function updateAboutUsContent(content: string): Promise<void> {
  // 读取现有记录，保留 heroTitle/heroSubtitle 等额外字段
  const existing = await prisma.pageContent.findUnique({
    where: { pageId: 'about_us' },
  });
  const existingData = (existing?.content as Record<string, unknown>) || {};
  const merged = {
    ...(existingData.heroTitle ? { heroTitle: existingData.heroTitle } : {}),
    ...(existingData.heroSubtitle ? { heroSubtitle: existingData.heroSubtitle } : {}),
    html: content,
  };

  await prisma.pageContent.upsert({
    where: { pageId: 'about_us' },
    update: { content: merged },
    create: { pageId: 'about_us', content: merged },
  });
}
