/**
 * @file 邀请信息接口
 * @description GET /api/invite/info - 获取邀请码、链接、二维码
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.1节 - 邀请信息
 *
 * 调用时机：进入邀请页面
 * 认证要求：是（Bearer Token）
 *
 * 核心功能：
 * 1. 返回用户邀请码（8位）
 * 2. 返回邀请链接（站点域名从 GlobalConfig.site_domain 读取，禁止硬编码）
 * 3. 返回二维码 Data URL（使用 qrcode 库生成 Base64 PNG 格式）
 * 
 * 响应格式（依据：02.3-前端API接口清单.md 第13.1节）：
 * {
 *   "success": true,
 *   "data": {
 *     "inviteCode": "XYZ45678",
 *     "inviteLink": "https://www.LLES-MA.com/register?ref=XYZ45678",
 *     "qrCodeUrl": "data:image/png;base64,..."
 *   }
 * }
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { getInviteInfo } from '@/services/invite.service';

/**
 * GET /api/invite/info
 * @description 获取用户邀请信息
 * @returns 邀请码、邀请链接、二维码 Data URL
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    try {
      // 获取邀请信息（邀请码、链接、二维码）
      const inviteInfo = await getInviteInfo(userId);

      return successResponse(inviteInfo);
    } catch (error) {
      console.error('[InviteInfo] 获取邀请信息失败:', error);

      // 业务错误：使用 BusinessError 统一处理
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }

      // 未知错误：返回通用错误提示（西班牙语）
      return errorResponse(
        'INTERNAL_ERROR',
        'خطأ في الحصول على معلومات الدعوة',
        500
      );
    }
  });
}
