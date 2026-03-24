import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * 获取用户已购产品列表
 * @route GET /api/admin/users/[id]/purchased-products
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async () => {
    try {
      const { id } = await params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return errorResponse('VALIDATION_ERROR', '用户ID无效', 400);
      }

      const purchases = await prisma.userProductPurchase.findMany({
        where: { userId },
        include: {
          product: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const list = purchases.map(p => ({
        productId: p.productId,
        productName: p.product.name,
        purchaseCount: p.purchaseCount,
        lastPurchasedAt: p.updatedAt,
      }));

      return successResponse(list, '获取用户已购产品成功');
    } catch (error) {
      console.error('[User Purchased Products Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取用户已购产品失败');
    }
  });
}
