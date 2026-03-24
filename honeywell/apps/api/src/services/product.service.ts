/**
 * @file 产品管理服务
 * @description 后台管理端产品管理相关功能
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节 - 产品管理接口
 * @depends 开发文档/04-后台管理端/04.5-产品管理/04.5.1-产品列表页.md
 * @depends 开发文档/04-后台管理端/04.5-产品管理/04.5.2-产品编辑页.md
 *
 * 核心功能：
 * 1. 产品列表查询（多条件筛选、含销售统计）
 * 2. 产品详情查询
 * 3. 产品创建/更新
 * 4. 产品删除（软删除）
 * 5. 产品上下架
 * 6. 产品排序
 * 7. 批量上下架
 *
 * 业务规则（依据：开发文档.md 第8.0.0节）：
 * - 使用 type 字段判断产品类型（TRIAL/PAID），禁止使用 code 字段
 * - 使用 series 字段判断产品系列（PO/VIP）
 * - 有活跃持仓订单的产品禁止删除
 * - 删除使用软删除，设置 status 为 'deleted'（自定义状态）
 */

import { prisma } from '@/lib/prisma';
import { BusinessError } from '@/lib/errors';
import { Prisma, ProductType, ProductSeries, ProductStatus, PositionStatus } from '@honeywell/database';

// ================================
// 类型定义
// ================================

/** 产品列表查询参数 */
export interface ProductListParams {
  name?: string;                    // 产品名称/编码模糊搜索
  series?: ProductSeries;           // 产品系列
  type?: ProductType;               // 产品类型
  status?: ProductStatus;           // 状态
  priceMin?: number;                // 价格最小值
  priceMax?: number;                // 价格最大值
}

/** 产品创建/更新参数 */
export interface ProductFormData {
  code: string;
  name: string;
  type: ProductType;
  series: ProductSeries;
  price: string;
  dailyIncome: string;
  cycleDays: number;
  grantVipLevel?: number;
  grantSvipLevel?: number;
  requireVipLevel?: number;
  purchaseLimit: number;
  mainImage?: string | null;
  detailImages?: string[] | null;
  detailContent?: string | null;
  showRecommendBadge?: boolean;
  customBadgeText?: string | null;
  sortOrder?: number;
  status?: ProductStatus;
  userPurchaseLimit?: number | null;
  globalStock?: number | null;
  displayUserLimit?: number | null;
  svipDailyReward?: number | null;
  svipRequireCount?: number | null;
  returnPrincipal?: boolean;
  productStatus?: string;
}

/** 批量状态更新参数 */
export interface BatchStatusParams {
  ids: number[];
  status: ProductStatus;
}

/** 排序更新参数 */
export interface SortParams {
  ids: number[];
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 */
function formatAmount(value: Prisma.Decimal | number | null): string {
  if (value === null || value === undefined) return '0.00';
  return Number(value).toFixed(2);
}

// ================================
// 产品列表
// ================================

/**
 * 获取产品列表
 * @description 依据：02.4-后台API接口清单.md 第7.1节
 * 返回产品列表及销售统计数据
 * 
 * 注意：默认排除已删除的产品，除非明确筛选 status=DELETED
 */
export async function getProductList(params: ProductListParams) {
  const {
    name,
    series,
    type,
    status,
    priceMin,
    priceMax,
  } = params;

  // 构建查询条件
  const where: Prisma.ProductWhereInput = {};

  // 名称/编码模糊搜索
  if (name) {
    where.OR = [
      { name: { contains: name } },
      { code: { contains: name } },
    ];
  }

  // 产品系列筛选
  if (series) {
    where.series = series;
  }

  // 产品类型筛选
  if (type) {
    where.type = type;
  }

  // 状态筛选：默认排除已删除产品
  if (status) {
    where.status = status;
  } else {
    // 未指定状态时，默认排除已删除的产品
    where.status = { not: 'DELETED' };
  }

  // 价格范围筛选
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) {
      where.price.gte = priceMin;
    }
    if (priceMax !== undefined) {
      where.price.lte = priceMax;
    }
  }

  // 查询产品列表（按排序权重降序，数字越大越靠前）
  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { sortOrder: 'desc' },
      { id: 'asc' },
    ],
  });

  // 获取每个产品的销售统计（通过持仓订单统计）
  const productIds = products.map(p => p.id);
  
  // 统计销售数量和销售金额
  const salesStats = await prisma.positionOrder.groupBy({
    by: ['productId'],
    where: {
      productId: { in: productIds },
    },
    _count: { id: true },
    _sum: { purchaseAmount: true },
  });

  // 构建销售统计 Map
  const salesMap = new Map(
    salesStats.map(stat => [
      stat.productId,
      {
        totalSold: stat._count.id,
        totalAmount: Number(stat._sum.purchaseAmount || 0),
      },
    ])
  );

  // 格式化返回数据
  const list = products.map(product => {
    const sales = salesMap.get(product.id) || { totalSold: 0, totalAmount: 0 };
    return {
      id: product.id,
      code: product.code,
      name: product.name,
      type: product.type,
      series: product.series,
      price: formatAmount(product.price),
      dailyIncome: formatAmount(product.dailyIncome),
      cycleDays: product.cycleDays,
      totalIncome: formatAmount(product.totalIncome),
      grantVipLevel: product.grantVipLevel,
      grantSvipLevel: product.grantSvipLevel,
      requireVipLevel: product.requireVipLevel,
      purchaseLimit: product.purchaseLimit,
      userPurchaseLimit: product.userPurchaseLimit,
      displayUserLimit: product.displayUserLimit,
      mainImage: product.mainImage,
      showRecommendBadge: product.showRecommendBadge,
      customBadgeText: product.customBadgeText,
      status: product.status,
      sortOrder: product.sortOrder,
      globalStock: product.globalStock,
      globalSold: product.globalSold,
      productStatus: product.productStatus,
      svipDailyReward: product.svipDailyReward ? Number(product.svipDailyReward) : null,
      svipRequireCount: product.svipRequireCount,
      returnPrincipal: product.returnPrincipal,
      // 销售统计
      totalSold: sales.totalSold,
      totalAmount: formatAmount(sales.totalAmount),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  });

  return { list };
}

// ================================
// 产品详情
// ================================

/**
 * 获取产品详情
 * @description 依据：02.4-后台API接口清单.md 第7节
 */
export async function getProductDetail(productId: number) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404);
  }

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    type: product.type,
    series: product.series,
    price: formatAmount(product.price),
    dailyIncome: formatAmount(product.dailyIncome),
    cycleDays: product.cycleDays,
    totalIncome: formatAmount(product.totalIncome),
    grantVipLevel: product.grantVipLevel,
    grantSvipLevel: product.grantSvipLevel,
    requireVipLevel: product.requireVipLevel,
    purchaseLimit: product.purchaseLimit,
    userPurchaseLimit: product.userPurchaseLimit,
    globalStock: product.globalStock,
    globalSold: product.globalSold,
    displayUserLimit: product.displayUserLimit,
    svipDailyReward: product.svipDailyReward ? Number(product.svipDailyReward) : null,
    svipRequireCount: product.svipRequireCount,
    returnPrincipal: product.returnPrincipal,
    productStatus: product.productStatus,
    mainImage: product.mainImage,
    detailImages: product.detailImages as string[] | null,
    detailContent: product.detailContent,
    showRecommendBadge: product.showRecommendBadge,
    customBadgeText: product.customBadgeText,
    status: product.status,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// ================================
// 产品创建
// ================================

/**
 * 创建产品
 * @description 依据：02.4-后台API接口清单.md 第7.2节
 */
export async function createProduct(data: ProductFormData) {
  // 检查编码是否已存在
  const existingProduct = await prisma.product.findUnique({
    where: { code: data.code },
  });

  if (existingProduct) {
    throw new BusinessError('PRODUCT_CODE_EXISTS', '产品编码已存在', 400);
  }

  // 计算总收益（使用 Decimal 精确运算，避免浮点精度问题）
  const dailyIncome = parseFloat(data.dailyIncome);
  const totalIncome = new Prisma.Decimal(dailyIncome).mul(data.cycleDays);

  // 创建产品
  const product = await prisma.product.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      series: data.series,
      price: parseFloat(data.price),
      dailyIncome: dailyIncome,
      cycleDays: data.cycleDays,
      totalIncome: totalIncome,
      grantVipLevel: data.grantVipLevel ?? 0,
      grantSvipLevel: data.grantSvipLevel ?? 0,
      requireVipLevel: data.requireVipLevel ?? 0,
      purchaseLimit: data.purchaseLimit ?? 1,
      userPurchaseLimit: data.userPurchaseLimit ?? null,
      globalStock: data.globalStock ?? null,
      displayUserLimit: data.displayUserLimit ?? null,
      svipDailyReward: data.svipDailyReward ?? null,
      svipRequireCount: data.svipRequireCount ?? null,
      returnPrincipal: data.returnPrincipal ?? false,
      productStatus: data.productStatus ?? 'OPEN',
      mainImage: data.mainImage || null,
      detailImages: data.detailImages ?? Prisma.JsonNull,
      detailContent: data.detailContent || null,
      showRecommendBadge: data.showRecommendBadge ?? false,
      customBadgeText: data.customBadgeText || null,
      sortOrder: data.sortOrder ?? 0,
      status: data.status ?? 'ACTIVE',
    },
  });

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    type: product.type,
    series: product.series,
    price: formatAmount(product.price),
    dailyIncome: formatAmount(product.dailyIncome),
    cycleDays: product.cycleDays,
    totalIncome: formatAmount(product.totalIncome),
    grantVipLevel: product.grantVipLevel,
    grantSvipLevel: product.grantSvipLevel,
    requireVipLevel: product.requireVipLevel,
    purchaseLimit: product.purchaseLimit,
    userPurchaseLimit: product.userPurchaseLimit,
    globalStock: product.globalStock,
    globalSold: product.globalSold,
    displayUserLimit: product.displayUserLimit,
    svipDailyReward: product.svipDailyReward ? Number(product.svipDailyReward) : null,
    svipRequireCount: product.svipRequireCount,
    returnPrincipal: product.returnPrincipal,
    productStatus: product.productStatus,
    mainImage: product.mainImage,
    detailImages: product.detailImages,
    detailContent: product.detailContent,
    showRecommendBadge: product.showRecommendBadge,
    customBadgeText: product.customBadgeText,
    status: product.status,
    sortOrder: product.sortOrder,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// ================================
// 产品更新
// ================================

/**
 * 更新产品
 * @description 依据：02.4-后台API接口清单.md 第7.2节
 */
export async function updateProduct(productId: number, data: Partial<ProductFormData>) {
  // 检查产品是否存在
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404);
  }

  // 如果要修改编码，检查编码是否与其他产品冲突
  if (data.code && data.code !== product.code) {
    const existingProduct = await prisma.product.findUnique({
      where: { code: data.code },
    });

    if (existingProduct) {
      throw new BusinessError('PRODUCT_CODE_EXISTS', '产品编码已存在', 400);
    }
  }

  // 构建更新数据
  const updateData: Prisma.ProductUpdateInput = {};

  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.series !== undefined) updateData.series = data.series;
  if (data.price !== undefined) updateData.price = parseFloat(data.price);
  if (data.dailyIncome !== undefined) updateData.dailyIncome = parseFloat(data.dailyIncome);
  if (data.cycleDays !== undefined) updateData.cycleDays = data.cycleDays;
  if (data.grantVipLevel !== undefined) updateData.grantVipLevel = data.grantVipLevel;
  if (data.grantSvipLevel !== undefined) updateData.grantSvipLevel = data.grantSvipLevel;
  if (data.requireVipLevel !== undefined) updateData.requireVipLevel = data.requireVipLevel;
  if (data.purchaseLimit !== undefined) updateData.purchaseLimit = data.purchaseLimit;
  if (data.userPurchaseLimit !== undefined) updateData.userPurchaseLimit = data.userPurchaseLimit;
  if (data.globalStock !== undefined) updateData.globalStock = data.globalStock;
  if (data.displayUserLimit !== undefined) updateData.displayUserLimit = data.displayUserLimit;
  if (data.svipDailyReward !== undefined) updateData.svipDailyReward = data.svipDailyReward;
  if (data.svipRequireCount !== undefined) updateData.svipRequireCount = data.svipRequireCount;
  if (data.returnPrincipal !== undefined) updateData.returnPrincipal = data.returnPrincipal;
  if (data.productStatus !== undefined) updateData.productStatus = data.productStatus;
  if (data.mainImage !== undefined) updateData.mainImage = data.mainImage;
  if (data.detailImages !== undefined) updateData.detailImages = data.detailImages ?? Prisma.JsonNull;
  if (data.detailContent !== undefined) updateData.detailContent = data.detailContent;
  if (data.showRecommendBadge !== undefined) updateData.showRecommendBadge = data.showRecommendBadge;
  if (data.customBadgeText !== undefined) updateData.customBadgeText = data.customBadgeText;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.status !== undefined) updateData.status = data.status;

  // 如果更新了日收益或周期天数，重新计算总收益
  if (data.dailyIncome !== undefined || data.cycleDays !== undefined) {
    const newDailyIncome = data.dailyIncome !== undefined 
      ? parseFloat(data.dailyIncome) 
      : Number(product.dailyIncome);
    const newCycleDays = data.cycleDays !== undefined 
      ? data.cycleDays 
      : product.cycleDays;
    // 使用 Decimal 精确运算，避免浮点精度问题
    updateData.totalIncome = new Prisma.Decimal(newDailyIncome).mul(newCycleDays);
  }

  // 更新产品
  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  return {
    id: updatedProduct.id,
    code: updatedProduct.code,
    name: updatedProduct.name,
    type: updatedProduct.type,
    series: updatedProduct.series,
    price: formatAmount(updatedProduct.price),
    dailyIncome: formatAmount(updatedProduct.dailyIncome),
    cycleDays: updatedProduct.cycleDays,
    totalIncome: formatAmount(updatedProduct.totalIncome),
    grantVipLevel: updatedProduct.grantVipLevel,
    grantSvipLevel: updatedProduct.grantSvipLevel,
    requireVipLevel: updatedProduct.requireVipLevel,
    purchaseLimit: updatedProduct.purchaseLimit,
    userPurchaseLimit: updatedProduct.userPurchaseLimit,
    globalStock: updatedProduct.globalStock,
    globalSold: updatedProduct.globalSold,
    displayUserLimit: updatedProduct.displayUserLimit,
    svipDailyReward: updatedProduct.svipDailyReward ? Number(updatedProduct.svipDailyReward) : null,
    svipRequireCount: updatedProduct.svipRequireCount,
    returnPrincipal: updatedProduct.returnPrincipal,
    productStatus: updatedProduct.productStatus,
    mainImage: updatedProduct.mainImage,
    detailImages: updatedProduct.detailImages,
    detailContent: updatedProduct.detailContent,
    showRecommendBadge: updatedProduct.showRecommendBadge,
    customBadgeText: updatedProduct.customBadgeText,
    status: updatedProduct.status,
    sortOrder: updatedProduct.sortOrder,
    createdAt: updatedProduct.createdAt.toISOString(),
    updatedAt: updatedProduct.updatedAt.toISOString(),
  };
}

// ================================
// 产品删除（软删除）
// ================================

/**
 * 删除产品（软删除）
 * @description 依据：02.4-后台API接口清单.md 第7.3节
 * - 有活跃持仓订单的产品禁止删除
 * - 软删除：设置 status 为 DELETED（历史订单数据保留）
 */
export async function deleteProduct(productId: number) {
  // 检查产品是否存在
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404);
  }

  // 已删除的产品不能重复删除
  if (product.status === 'DELETED') {
    throw new BusinessError('PRODUCT_ALREADY_DELETED', '产品已被删除', 400);
  }

  // 检查是否有活跃持仓订单
  const activeOrderCount = await prisma.positionOrder.count({
    where: {
      productId: productId,
      status: PositionStatus.ACTIVE,
    },
  });

  if (activeOrderCount > 0) {
    throw new BusinessError(
      'PRODUCT_HAS_ACTIVE_ORDERS',
      `该产品存在 ${activeOrderCount} 个活跃持仓订单，无法删除`,
      400
    );
  }

  // 软删除：设置状态为 DELETED
  await prisma.product.update({
    where: { id: productId },
    data: { status: 'DELETED' },
  });

  return { success: true };
}

// ================================
// 产品上下架
// ================================

/**
 * 更新产品状态（上下架）
 * @description 依据：02.4-后台API接口清单.md 第7节
 */
export async function updateProductStatus(productId: number, status: ProductStatus) {
  // 检查产品是否存在
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new BusinessError('PRODUCT_NOT_FOUND', '产品不存在', 404);
  }

  // 更新状态
  await prisma.product.update({
    where: { id: productId },
    data: { status },
  });

  return { success: true };
}

// ================================
// 产品排序
// ================================

/**
 * 更新产品排序
 * @description 依据：02.4-后台API接口清单.md 第7节
 * 传入排序后的产品ID数组，按顺序更新 sortOrder
 */
export async function updateProductSort(params: SortParams) {
  const { ids } = params;

  // 批量更新 sortOrder（数组顺序反过来，因为数字越大越靠前）
  const updates = ids.map((id, index) => 
    prisma.product.update({
      where: { id },
      data: { sortOrder: ids.length - index },
    })
  );

  await Promise.all(updates);

  return { success: true };
}

// ================================
// 批量上下架
// ================================

/**
 * 批量更新产品状态
 * @description 依据：02.4-后台API接口清单.md 第7.4节
 */
export async function batchUpdateProductStatus(params: BatchStatusParams) {
  const { ids, status } = params;

  const results: { id: number; success: boolean; error?: { code: string; message: string } }[] = [];

  // 逐个更新并记录结果
  for (const id of ids) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        results.push({
          id,
          success: false,
          error: { code: 'PRODUCT_NOT_FOUND', message: '产品不存在' },
        });
        continue;
      }

      await prisma.product.update({
        where: { id },
        data: { status },
      });

      results.push({ id, success: true });
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新失败' },
      });
    }
  }

  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    total: ids.length,
    succeeded,
    failed,
    results,
  };
}
