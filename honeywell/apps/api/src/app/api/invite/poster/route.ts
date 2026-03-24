/**
 * @file 邀请海报配置接口
 * @description GET /api/invite/poster - 获取邀请海报配置
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.2节 - 邀请海报配置
 * @depends 开发文档/02-数据层/02.1-数据库设计.md GlobalConfig - invite_poster_* 配置项
 *
 * 调用时机：生成邀请海报时
 * 认证要求：是（Bearer Token）
 *
 * 核心功能：
 * 1. 返回海报背景图 URL（从 GlobalConfig.invite_poster_bg 读取）
 * 2. 返回二维码位置配置（x, y, size）
 * 3. 返回邀请码位置配置（x, y, fontSize, color）
 *
 * 数据库配置项（依据：02.1-数据库设计.md 邀请海报配置）：
 * - invite_poster_bg: 海报背景图URL
 * - invite_qr_position_x: 二维码X坐标(%)
 * - invite_qr_position_y: 二维码Y坐标(%)
 * - invite_qr_size: 二维码尺寸(px)
 * - invite_code_position_x: 邀请码X坐标(%)
 * - invite_code_position_y: 邀请码Y坐标(%)
 * - invite_code_font_size: 邀请码字体大小(px)
 * - invite_code_color: 邀请码字体颜色
 *
 * 响应格式（依据：02.3-前端API接口清单.md 第13.2节）：
 * {
 *   "success": true,
 *   "data": {
 *     "backgroundImage": "/images/poster/invite_bg.png",
 *     "qrCodePosition": { "x": 37, "y": 78, "size": 180 },
 *     "inviteCodePosition": { "x": 50, "y": 94, "fontSize": 16, "color": "#333333" }
 *   }
 * }
 *
 * 前端海报生成说明：
 * 1. 加载背景图
 * 2. 在指定位置绘制二维码（从 /api/invite/info 获取 qrCodeUrl）
 * 3. 在指定位置绘制邀请码文字
 * 4. 调用 JS Bridge saveImageToGallery 保存（APP环境）或浏览器下载（Web环境）
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import { getInvitePosterConfig } from '@/services/invite.service';

/**
 * GET /api/invite/poster
 * @description 获取邀请海报配置
 * @returns 海报背景图、二维码位置、邀请码位置配置
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      // 获取海报配置（从数据库 GlobalConfig 表读取，禁止硬编码）
      const posterConfig = await getInvitePosterConfig();

      return successResponse(posterConfig);
    } catch (error) {
      console.error('[InvitePoster] 获取海报配置失败:', error);

      // 业务错误：使用 BusinessError 统一处理
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }

      // 未知错误：返回通用错误提示（西班牙语）
      return errorResponse(
        'INTERNAL_ERROR',
        'خطأ في الحصول على إعدادات الملصق',
        500
      );
    }
  });
}
