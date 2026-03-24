/**
 * @file 站内信管理 - 列表 API
 * @description 后台管理站内信列表获取
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第21.1节 - 站内信列表
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { paginatedResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  adminNotificationService,
  type AdminNotificationListParams,
} from '@/services/admin-notification.service';
import type { NotificationType } from '@honeywell/database';

// 有效的通知类型列表
const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'RECHARGE_SUCCESS',
  'WITHDRAW_APPROVED',
  'WITHDRAW_COMPLETED',
  'WITHDRAW_REJECTED',
  'WITHDRAW_FAILED',
  'INCOME_RECEIVED',
  'COMMISSION_RECEIVED',
  'SIGN_IN_REWARD',
  'ACTIVITY_REWARD',
  'SYSTEM_ANNOUNCEMENT',
];

// ================================
// GET /api/admin/notifications - 站内信列表
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async (req, _adminId) => {
    try {
      const { searchParams } = new URL(req.url);
      
      // 解析查询参数
      const params: AdminNotificationListParams = {
        page: parseInt(searchParams.get('page') ?? '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') ?? '20', 10),
      };

      // 用户ID筛选
      const userIdStr = searchParams.get('userId');
      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        if (!isNaN(userId) && userId > 0) {
          params.userId = userId;
        }
      }

      // 用户手机号筛选
      const userPhone = searchParams.get('userPhone');
      if (userPhone) {
        params.userPhone = userPhone;
      }

      // 通知类型筛选（支持多选，用逗号分隔）
      const typeStr = searchParams.get('type');
      if (typeStr) {
        const types = typeStr.split(',').filter(t => 
          VALID_NOTIFICATION_TYPES.includes(t as NotificationType)
        ) as NotificationType[];
        if (types.length === 1) {
          params.type = types[0];
        } else if (types.length > 1) {
          params.types = types;
        }
      }

      // 已读状态筛选
      const isReadStr = searchParams.get('isRead');
      if (isReadStr !== null) {
        params.isRead = isReadStr === 'true';
      }

      // 时间范围筛选
      const startDate = searchParams.get('startDate');
      if (startDate) {
        params.startDate = startDate;
      }

      const endDate = searchParams.get('endDate');
      if (endDate) {
        params.endDate = endDate;
      }

      const result = await adminNotificationService.getNotificationList(params);
      return paginatedResponse(result.list, result.pagination);
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[站内信列表] 获取失败:', error);
      return errorResponse('SYSTEM_ERROR', '获取站内信列表失败', 500);
    }
  });
}
