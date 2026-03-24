/**
 * @file 配置版本号接口
 * @description GET /api/config/versions - 获取所有配置的版本号集合，用于前端热更新检测
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.3节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 GlobalConfig表
 * 
 * 调用时机：每分钟轮询 + 页面获取焦点
 * 认证要求：否
 * 
 * 核心功能：
 * 1. 返回全局配置、文案配置、时区配置的版本号和更新时间
 * 2. 用于前端检测配置是否有更新，支持热更新
 * 3. 不缓存，直接从数据库读取最新值
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getConfigVersions } from '@/services/config.service';

/**
 * GET /api/config/versions
 * @description 获取配置版本号集合
 * @returns 配置版本号数据（globalConfigVersion、textsVersion、timezoneVersion）
 */
export async function GET(_request: NextRequest) {
  try {
    // 从服务层获取配置版本号（不缓存，实时获取）
    const versions = await getConfigVersions();
    
    return successResponse(versions);
  } catch (error) {
    console.error('[ConfigVersions] 获取配置版本号失败:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'خطأ في الحصول على إصدارات الإعدادات',
      500
    );
  }
}
