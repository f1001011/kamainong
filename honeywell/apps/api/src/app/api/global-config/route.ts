/**
 * @file 全局配置接口
 * @description GET /api/global-config - 获取全局配置（站点名、货币、时区、财务配置、安全配置等）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.1节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 GlobalConfig表
 * 
 * 调用时机：应用启动
 * 认证要求：否
 * 
 * 核心功能：
 * 1. 返回网站基础配置、财务配置、密码规则配置等
 * 2. 支持 Redis 缓存，TTL 5分钟
 * 3. 带 version 和 updatedAt 用于前端热更新检测
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getGlobalConfig } from '@/services/config.service';

/**
 * GET /api/global-config
 * @description 获取全局配置
 * @returns 全局配置数据（包含站点、地区、时区、财务、安全等配置）
 */
export async function GET(_request: NextRequest) {
  try {
    // 从服务层获取全局配置（带缓存）
    const config = await getGlobalConfig();
    
    return successResponse(config);
  } catch (error) {
    console.error('[GlobalConfig] 获取全局配置失败:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'خطأ في الحصول على الإعدادات',
      500
    );
  }
}
