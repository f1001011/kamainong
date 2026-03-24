/**
 * @file 产品列表接口
 * @description GET /api/products - 获取产品列表
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第4.1节 - 产品列表
 * @depends 开发文档/开发文档.md 第8节 - 产品系统
 *
 * 核心业务规则：
 * 1. 只返回上架状态（ACTIVE）的产品
 * 2. 支持按系列（series）筛选：PO / VIP
 * 3. 返回用户购买状态和锁定原因
 * 4. VIP 产品需检查用户等级
 * 5. ⚠️ 禁止使用 code 字段判断产品类型
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { verifyToken } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 请求参数校验
// ================================

/**
 * 查询参数 Schema
 */
const QuerySchema = z.object({
  // 产品系列筛选（可选，支持逗号分隔的多值，如 'VIC,NWS,QLD' 或 'FINANCIAL'）
  series: z.string().optional(),
});

// ================================
// 类型定义
// ================================

interface ProductWithUserStatus {
  id: number;
  code: string;
  name: string;
  type: string;
  series: string;
  price: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  grantVipLevel: number;
  grantSvipLevel: number;
  requireVipLevel: number;
  purchaseLimit: number;
  mainImage: string | null;
  showRecommendBadge: boolean;
  customBadgeText: string | null;
  status: string;
  globalStock: number | null;
  globalSold: number;
  globalStockRemaining: number | null;
  userPurchaseLimit: number | null;
  displayUserLimit: number | null;
  svipDailyReward: string | null;
  svipRequireCount: number | null;
  returnPrincipal: boolean;
  productStatus: string;
  // 用户相关状态
  purchased: boolean;
  purchaseCount: number;
  canPurchase: boolean;
  lockReason: 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null;
}

// ================================
// 辅助函数
// ================================

/**
 * 检查产品是否被用户购买过
 * @description 依据：开发文档.md 第8.4节 - 限购定义
 */
async function checkUserPurchases(
  userId: number,
  productIds: number[]
): Promise<Map<number, number>> {
  const purchases = await prisma.userProductPurchase.findMany({
    where: {
      userId,
      productId: { in: productIds },
    },
    select: {
      productId: true,
      purchaseCount: true,
    },
  });

  const purchaseMap = new Map<number, number>();
  for (const purchase of purchases) {
    purchaseMap.set(purchase.productId, purchase.purchaseCount);
  }
  return purchaseMap;
}

/**
 * 格式化 Decimal 为字符串
 */
function formatDecimal(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * 尝试从 Token 获取用户 ID（可选认证，失败静默忽略）
 * @description 公开接口使用，Token 无效时返回 null 而非 401 错误
 */
function tryGetUserId(request: NextRequest): number | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyToken(token);
    return payload.userId;
  } catch {
    // Token 无效时静默返回 null，不抛出错误
    return null;
  }
}

// ================================
// 产品列表（公开接口）
// ================================

/**
 * GET /api/products - 产品列表（公开接口，无需登录）
 * @description 返回所有上架产品，但用户相关状态（purchased、canPurchase）需要登录
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 解析查询参数
    const { searchParams } = new URL(request.url);
    const seriesParam = searchParams.get('series');

    const queryResult = QuerySchema.safeParse({
      series: seriesParam || undefined,
    });

    if (!queryResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        queryResult.error.errors[0]?.message || 'خطأ في التحقق من المعلمات',
        400
      );
    }

    const { series } = queryResult.data;

    // 2. 尝试获取用户ID（可选认证，Token 无效时静默忽略）
    const userId = tryGetUserId(request);

    // 3. 返回产品列表
    return handleProductList(request, userId, series);
  } catch (error) {
    console.error('[Products] 获取产品列表失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al obtener lista de productos', 500);
  }
}

// 产品数据库查询结果类型
interface ProductQueryResult {
  id: number;
  code: string;
  name: string;
  type: string;
  series: string;
  price: Decimal;
  dailyIncome: Decimal;
  cycleDays: number;
  totalIncome: Decimal;
  grantVipLevel: number;
  grantSvipLevel: number;
  requireVipLevel: number;
  purchaseLimit: number;
  mainImage: string | null;
  showRecommendBadge: boolean;
  customBadgeText: string | null;
  status: string;
  globalStock: number | null;
  globalSold: number;
  userPurchaseLimit: number | null;
  displayUserLimit: number | null;
  svipDailyReward: Decimal | null;
  svipRequireCount: number | null;
  returnPrincipal: boolean;
  productStatus: string;
}

/**
 * 处理产品列表逻辑
 */
async function handleProductList(
  request: NextRequest,
  userId: number | null,
  series?: string
): Promise<Response> {
  // 1. 构建查询条件（支持逗号分隔的多系列筛选，如 'VIC,NWS,QLD'）
  const whereCondition: Record<string, unknown> = {
    status: 'ACTIVE',
  };

  if (series) {
    const seriesList = series.split(',').map(s => s.trim()).filter(Boolean);
    if (seriesList.length === 1) {
      whereCondition.series = seriesList[0];
    } else if (seriesList.length > 1) {
      whereCondition.series = { in: seriesList };
    }
  }

  // 2. 查询产品列表
  const products: ProductQueryResult[] = await prisma.product.findMany({
    where: whereCondition,
    orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      series: true,
      price: true,
      dailyIncome: true,
      cycleDays: true,
      totalIncome: true,
      grantVipLevel: true,
      grantSvipLevel: true,
      requireVipLevel: true,
      purchaseLimit: true,
      mainImage: true,
      showRecommendBadge: true,
      customBadgeText: true,
      status: true,
      globalStock: true,
      globalSold: true,
      userPurchaseLimit: true,
      displayUserLimit: true,
      svipDailyReward: true,
      svipRequireCount: true,
      returnPrincipal: true,
      productStatus: true,
    },
  });

  // 3. 获取用户购买记录
  let purchaseMap = new Map<number, number>();

  if (userId) {
    purchaseMap = await checkUserPurchases(
      userId,
      products.map((p: ProductQueryResult) => p.id)
    );
  }

  // 4. 格式化返回数据
  const productList: ProductWithUserStatus[] = products.map((product: ProductQueryResult) => {
    const purchaseCount = purchaseMap.get(product.id) ?? 0;
    const purchased = product.userPurchaseLimit !== null
      ? purchaseCount >= product.userPurchaseLimit
      : false;

    const globalStockRemaining = product.globalStock !== null
      ? product.globalStock - product.globalSold
      : null;
    const stockExhausted = globalStockRemaining !== null && globalStockRemaining <= 0;

    let lockReason: 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null = null;
    let canPurchase = true;

    if (purchased) {
      lockReason = 'ALREADY_PURCHASED';
      canPurchase = false;
    } else if (stockExhausted) {
      lockReason = 'STOCK_EXHAUSTED';
      canPurchase = false;
    }

    if (product.productStatus !== 'OPEN') {
      canPurchase = false;
    }

    return {
      id: product.id,
      code: product.code,
      name: product.name,
      type: product.type,
      series: product.series,
      price: formatDecimal(product.price),
      dailyIncome: formatDecimal(product.dailyIncome),
      cycleDays: product.cycleDays,
      totalIncome: formatDecimal(product.totalIncome),
      grantVipLevel: product.grantVipLevel,
      grantSvipLevel: product.grantSvipLevel,
      requireVipLevel: product.requireVipLevel,
      purchaseLimit: product.purchaseLimit,
      mainImage: product.mainImage,
      showRecommendBadge: product.showRecommendBadge,
      customBadgeText: product.customBadgeText,
      status: product.status,
      globalStock: product.globalStock,
      globalSold: product.globalSold,
      globalStockRemaining,
      userPurchaseLimit: product.userPurchaseLimit,
      displayUserLimit: product.displayUserLimit,
      svipDailyReward: product.svipDailyReward ? formatDecimal(product.svipDailyReward) : null,
      svipRequireCount: product.svipRequireCount,
      returnPrincipal: product.returnPrincipal,
      productStatus: product.productStatus,
      purchased: userId ? purchased : false,
      purchaseCount: userId ? purchaseCount : 0,
      canPurchase: userId ? canPurchase : true,
      lockReason: userId ? lockReason : null,
    };
  });

  return successResponse({
    list: productList,
  });
}
