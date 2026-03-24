/**
 * @file 文案配置接口
 * @description GET /api/texts - 获取所有文案配置（多语言文案键值对）
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.4节
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.7节 TextConfig表
 * @depends 开发文档/开发文档.md 第12.1节 - 语言与文案配置系统
 * 
 * 调用时机：应用启动 + 文案版本变化时
 * 认证要求：否
 * 
 * 核心功能：
 * 1. 返回所有文案的键值对集合
 * 2. 支持 Redis 缓存，TTL 5分钟
 * 3. 带 version 和 updatedAt 用于前端增量更新检测
 * 4. 所有文案默认为西班牙语
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getTextsConfig } from '@/services/config.service';

/**
 * GET /api/texts
 * @description 获取文案配置
 * @returns 文案配置数据（version、updatedAt、texts 键值对）
 */
export async function GET(_request: NextRequest) {
  try {
    // 从服务层获取文案配置（带缓存）
    const textsConfig = await getTextsConfig();
    
    return successResponse(textsConfig);
  } catch (error) {
    console.error('[Texts] 获取文案配置失败:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Error al obtener los textos',  // 西班牙语：获取文案时出错
      500
    );
  }
}
