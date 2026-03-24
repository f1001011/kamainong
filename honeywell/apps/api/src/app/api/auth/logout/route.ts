/**
 * @file 用户退出登录接口
 * @description POST /api/auth/logout - 退出登录
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第2节 - 认证接口
 *
 * 核心业务规则：
 * 1. 需要认证（Bearer Token）
 * 2. 服务端无状态，退出登录仅返回成功
 * 3. 客户端负责清除本地存储的 Token
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse } from '@/lib/response';

// ================================
// 路由处理
// ================================

/**
 * POST /api/auth/logout
 * @description 用户退出登录
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    // JWT 是无状态的，退出登录只需客户端清除 Token
    // 如果需要实现 Token 黑名单，可以在这里添加逻辑
    return successResponse(null, 'تم تسجيل الخروج بنجاح');
  });
}
