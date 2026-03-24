/**
 * @file 在线用户列表接口
 * @description GET /api/admin/realtime/online-users/list
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第22.2节
 *
 * 查询参数：
 * - page: 页码（默认1）
 * - pageSize: 每页数量（默认50）
 *
 * 返回数据：
 * - list: 在线用户列表
 *   - userId: 用户ID
 *   - phone: 手机号
 *   - nickname: 昵称
 *   - vipLevel: VIP等级
 *   - lastHeartbeatAt: 最后心跳时间
 *   - lastActiveIp: 最后活跃IP
 *   - deviceType: 设备类型
 *   - onlineDuration: 本次在线时长（秒）
 * - pagination: 分页信息
 *
 * 在线判断规则：
 * - 心跳超时时间从 GlobalConfig.heartbeat_timeout 读取（默认120秒）
 *
 * 缓存策略：不缓存，支持10-30秒轮询
 */

import { NextRequest } from 'next/server';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getOnlineUsersList } from '@/services/realtime.service';

/**
 * 获取在线用户列表
 * @route GET /api/admin/realtime/online-users/list
 * @auth 需要管理员登录
 */
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      // 解析查询参数
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

      // 参数校验
      if (page < 1) {
        return errorResponse('VALIDATION_ERROR', '页码不能小于1', 400);
      }
      if (pageSize < 1 || pageSize > 100) {
        return errorResponse('VALIDATION_ERROR', '每页数量需在1-100之间', 400);
      }

      // 获取在线用户列表（不使用缓存）
      const result = await getOnlineUsersList(page, pageSize);

      return successResponse(result, '获取在线用户列表成功');
    } catch (error) {
      console.error('[Realtime Online Users List Error]', error);
      return errorResponse('INTERNAL_ERROR', '获取在线用户列表失败');
    }
  });
}
