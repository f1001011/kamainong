/**
 * @file 文案版本号接口
 * @description GET /api/texts/version - 获取文案版本号，用于增量更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.2节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 GlobalConfig表
 * 
 * 调用时机：定时轮询（每分钟）+ 页面激活时
 * 认证要求：否
 * 
 * 核心功能：
 * 1. 仅返回文案版本号和更新时间
 * 2. 用于前端检测文案是否需要刷新
 * 3. 不缓存，直接从数据库读取最新值
 * 4. 轻量级接口，减少带宽占用
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getTextVersion } from '@/services/config.service';

/**
 * GET /api/texts/version
 * @description 获取文案版本号
 * @returns 文案版本号数据（version、updatedAt）
 */
export async function GET(_request: NextRequest) {
  try {
    // 从服务层获取文案版本号（不缓存，实时获取）
    const version = await getTextVersion();
    
    return successResponse(version);
  } catch (error) {
    console.error('[TextVersion] 获取文案版本号失败:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'خطأ في الحصول على إصدار النصوص',
      500
    );
  }
}
