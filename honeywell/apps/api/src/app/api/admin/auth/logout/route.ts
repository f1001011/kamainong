/**
 * @file 管理员退出登录接口
 * @description POST /api/admin/auth/logout - 退出登录
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第1节 - 认证接口
 *
 * 核心业务规则：
 * 1. 需要携带有效 Token
 * 2. 退出登录（前端清除 Token 即可）
 * 3. 服务端暂不维护 Token 黑名单（可扩展）
 */

import { NextRequest } from 'next/server';
import { successResponse } from '@/lib/response';
import { withAdminAuth } from '@/middleware/auth';

// ================================
// 路由处理
// ================================

/**
 * 退出登录处理器
 * @description 需要鉴权的路由，通过 withAdminAuth 中间件保护
 * @param _request 请求对象（未使用）
 * @param _adminId 管理员ID（未使用）
 */
async function logoutHandler(_request: NextRequest, _adminId: number) {
  // 目前前端清除 Token 即可，服务端暂不维护黑名单
  // 如需服务端失效 Token，可以：
  // 1. 将 Token 加入 Redis 黑名单（TTL = Token 剩余有效期）
  // 2. 更新管理员 tokenVersion 字段（需要数据库支持）

  return successResponse(null, '退出成功');
}

/**
 * POST /api/admin/auth/logout
 * @description 管理员退出登录
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, logoutHandler);
}
