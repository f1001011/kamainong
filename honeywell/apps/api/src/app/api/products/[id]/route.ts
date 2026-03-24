/**
 * @file 产品详情接口
 * @description GET /api/products/:id - 获取产品详情
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第4.2节 - 产品详情
 * @depends 开发文档/开发文档.md 第8节 - 产品系统
 *
 * 核心业务规则：
 * 1. 返回产品完整信息（包含详情图和富文本内容）
 * 2. 返回用户购买状态和锁定原因
 * 3. VIP 产品需检查用户等级
 * 4. ⚠️ 禁止使用 code 字段判断产品类型
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { Errors } from '@/lib/errors';
import { verifyToken } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 类型定义
// ================================

interface ProductDetailResponse {
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
  detailImages: string[];
  detailContent: string | null;
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
  canPurchase: boolean;
  lockReason: 'VIP_REQUIRED' | 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null;
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化 Decimal 为字符串
 */
function formatDecimal(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * 尝试从 Token 获取用户 ID（可选认证）
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
    return null;
  }
}

// ================================
// 路由处理
// ================================

/**
 * GET /api/products/:id - 产品详情
 * @description 公开接口，但用户相关状态需要登录
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. 获取产品 ID
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId) || productId <= 0) {
      return errorResponse('VALIDATION_ERROR', 'صيغة معرف المنتج غير صحيحة', 400);
    }

    // 2. 查询产品信息
    const product = await prisma.product.findUnique({
      where: { id: productId },
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
        detailImages: true,
        detailContent: true,
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

    // 3. 检查产品是否存在
    if (!product) {
      throw Errors.productNotFound();
    }

    // 4. 检查产品是否上架
    if (product.status !== 'ACTIVE') {
      throw Errors.productInactive();
    }

    // 5. 获取用户信息（可选）
    const userId = tryGetUserId(request);
    let userVipLevel = 0;
    let purchaseCount = 0;

    if (userId) {
      // 获取用户 VIP 等级
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { vipLevel: true },
      });
      userVipLevel = user?.vipLevel ?? 0;

      // 获取购买记录
      const purchase = await prisma.userProductPurchase.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        select: { purchaseCount: true },
      });
      purchaseCount = purchase?.purchaseCount ?? 0;
    }

    // 6. 计算用户购买状态（userPurchaseLimit 为 null 表示无限购，不再使用遗留字段 purchaseLimit）
    const purchased = product.userPurchaseLimit !== null
      ? purchaseCount >= product.userPurchaseLimit
      : false;

    // 计算剩余库存（与列表 API 格式一致）
    const globalStockRemaining = product.globalStock !== null
      ? product.globalStock - product.globalSold
      : null;
    const stockExhausted = globalStockRemaining !== null && globalStockRemaining <= 0;

    // 计算锁定原因
    // 依据：开发文档.md 第8.1节 - VIP 系列购买规则
    // ⚠️ 使用 series 字段判断，禁止使用 code
    let lockReason: 'VIP_REQUIRED' | 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null = null;
    let canPurchase = true;

    if (purchased) {
      lockReason = 'ALREADY_PURCHASED';
      canPurchase = false;
    } else if (stockExhausted) {
      lockReason = 'STOCK_EXHAUSTED';
      canPurchase = false;
    } else if (
      product.series === 'VIP' &&
      product.requireVipLevel > userVipLevel
    ) {
      lockReason = 'VIP_REQUIRED';
      canPurchase = false;
    }

    if (product.productStatus !== 'OPEN') {
      canPurchase = false;
    }

    // 7. 格式化详情图列表
    let detailImages: string[] = [];
    if (product.detailImages) {
      try {
        // detailImages 存储为 JSON 数组
        if (Array.isArray(product.detailImages)) {
          detailImages = product.detailImages as string[];
        }
      } catch {
        detailImages = [];
      }
    }

    // 8. 返回产品详情
    const response: ProductDetailResponse = {
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
      detailImages,
      detailContent: product.detailContent,
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
      // 用户相关状态（未登录时默认值）
      purchased: userId ? purchased : false,
      canPurchase: userId ? canPurchase : true,
      lockReason: userId ? lockReason : null,
    };

    return successResponse(response);
  } catch (error) {
    // 业务错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      const bizError = error as {
        code: string;
        message: string;
        httpStatus: number;
      };
      return errorResponse(bizError.code, bizError.message, bizError.httpStatus);
    }

    console.error('[ProductDetail] 获取产品详情失败:', error);
    return errorResponse('INTERNAL_ERROR', 'Error al obtener detalle del producto', 500);
  }
}
