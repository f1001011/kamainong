/**
 * @file 邀请服务
 * @description 处理邀请码、邀请链接、二维码生成、海报配置等
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13节 - 邀请接口
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.4节 - 海报配置使用 poster_config JSON 字段
 * 
 * 数据库配置项（统一使用 poster_config JSON 字段）：
 * - poster_config: 海报配置JSON对象，包含 backgroundImage、qrCodePositionX/Y、qrCodeSize、
 *                  inviteCodePositionX/Y、inviteCodeFontSize、inviteCodeColor
 */

import QRCode from 'qrcode';
import { prisma } from '../lib/prisma';
import { CACHE_KEYS, CACHE_TTL, getOrSet } from '../lib/redis';
import { BusinessError } from '../lib/errors';

// ================================
// 类型定义
// ================================

/**
 * 邀请信息响应数据结构
 * @description 包含邀请码、邀请链接、二维码 Data URL
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.1节
 */
export interface InviteInfoResponse {
  /** 用户邀请码（8位） */
  inviteCode: string;
  /** 邀请链接，格式：https://{domain}/register?ref={inviteCode} */
  inviteLink: string;
  /** 二维码 Data URL（Base64格式） */
  qrCodeUrl: string;
}

/**
 * 二维码位置配置
 */
interface QRCodePosition {
  /** X坐标百分比（相对于海报宽度） */
  x: number;
  /** Y坐标百分比（相对于海报高度） */
  y: number;
  /** 二维码尺寸（px） */
  size: number;
}

/**
 * 邀请码位置配置
 */
interface InviteCodePosition {
  /** X坐标百分比 */
  x: number;
  /** Y坐标百分比 */
  y: number;
  /** 字体大小（px） */
  fontSize: number;
  /** 字体颜色 */
  color: string;
}

/**
 * 邀请海报配置响应数据结构
 * @description 包含海报背景图、二维码位置、邀请码位置等配置
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.2节
 */
export interface InvitePosterResponse {
  /** 海报背景图URL */
  backgroundImage: string;
  /** 二维码位置配置 */
  qrCodePosition: QRCodePosition;
  /** 邀请码位置配置 */
  inviteCodePosition: InviteCodePosition;
}

// ================================
// 辅助函数
// ================================

/**
 * 从数据库获取单个全局配置值
 * @param key - 配置键
 * @returns 配置值或 undefined
 */
async function getConfigValue<T>(key: string): Promise<T | undefined> {
  const config = await prisma.globalConfig.findUnique({
    where: { key },
  });
  return config?.value as T | undefined;
}

/**
 * 生成邀请链接
 * @description 依据：API接口清单 第13.1节 - 邀请链接格式
 * @param domain - 站点域名
 * @param inviteCode - 邀请码
 * @returns 完整邀请链接
 */
function buildInviteLink(domain: string, inviteCode: string): string {
  // 确保域名有协议前缀
  const normalizedDomain = domain.startsWith('http') ? domain : `https://${domain}`;
  // 移除末尾斜杠
  const cleanDomain = normalizedDomain.replace(/\/$/, '');
  return `${cleanDomain}/register?ref=${inviteCode}`;
}

/**
 * 生成二维码 Base64 Data URL
 * @description 使用 qrcode 库生成 PNG 格式的二维码
 * @param content - 二维码内容
 * @returns Base64 Data URL
 */
async function generateQRCodeDataUrl(content: string): Promise<string> {
  try {
    // 生成 PNG 格式的二维码 Data URL
    const dataUrl = await QRCode.toDataURL(content, {
      width: 256,           // 二维码图片宽度
      margin: 2,            // 边距
      color: {
        dark: '#000000',    // 前景色（黑色）
        light: '#ffffff',   // 背景色（白色）
      },
      errorCorrectionLevel: 'M',  // 纠错级别：M（中等）
    });
    return dataUrl;
  } catch (error) {
    console.error('[InviteService] 生成二维码失败:', error);
    throw new Error('خطأ في إنشاء رمز QR');
  }
}

// ================================
// 核心服务函数
// ================================

/**
 * 获取用户邀请信息
 * @description 获取邀请码、邀请链接、二维码 Data URL
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.1节
 * @param userId - 用户ID
 * @returns 邀请信息响应数据
 * @throws BusinessError USER_NOT_FOUND - 用户不存在
 * @throws BusinessError CONFIG_ERROR - 站点域名未配置
 */
export async function getInviteInfo(userId: number): Promise<InviteInfoResponse> {
  // 1. 获取用户邀请码
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true },
  });

  if (!user || !user.inviteCode) {
    throw new BusinessError('USER_NOT_FOUND', 'المستخدم غير موجود', 404);
  }

  // 2. 从数据库获取站点域名（依据：核心开发规范 - 禁止硬编码，必须从数据库获取）
  const siteDomain = await getConfigValue<string>('site_domain');
  if (!siteDomain) {
    throw new BusinessError('CONFIG_ERROR', 'إعدادات الموقع غير مكتملة', 500);
  }

  // 3. 生成邀请链接（格式：https://{domain}/register?ref={inviteCode}）
  const inviteLink = buildInviteLink(siteDomain, user.inviteCode);

  // 4. 使用 qrcode 库生成二维码 Base64 Data URL
  const qrCodeUrl = await generateQRCodeDataUrl(inviteLink);

  return {
    inviteCode: user.inviteCode,
    inviteLink,
    qrCodeUrl,
  };
}

/**
 * 后台海报配置数据结构（与 content-management.service.ts 保持一致）
 * @description 后台使用扁平结构，前端需要转换为嵌套结构
 */
interface StoredPosterConfig {
  backgroundImage?: string;
  qrCodePositionX?: number;
  qrCodePositionY?: number;
  qrCodeSize?: number;
  inviteCodePositionX?: number;
  inviteCodePositionY?: number;
  inviteCodeFontSize?: number;
  inviteCodeColor?: string;
}

/**
 * 获取邀请海报配置
 * @description 从数据库获取海报背景图、二维码位置、邀请码位置等配置
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第13.2节
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第11.4节 - 使用 poster_config JSON 字段统一存储
 * @returns 海报配置响应数据
 */
export async function getInvitePosterConfig(): Promise<InvitePosterResponse> {
  // 使用缓存获取海报配置（配置不常变化）
  return getOrSet<InvitePosterResponse>(
    `${CACHE_KEYS.CONFIG.GLOBAL}:poster`,
    async () => {
      // 从数据库获取 poster_config JSON 字段（与后台管理统一使用同一个字段）
      const config = await prisma.globalConfig.findUnique({
        where: { key: 'poster_config' },
      });

      // 解析存储的配置（后台使用扁平结构）
      const stored = (config?.value as StoredPosterConfig) ?? {};

      // 默认值设计说明：
      // - 二维码：居中(50%)，黄金分割位置(62%)，180px便于扫描
      // - 邀请码：居中(50%)，二维码下方(82%)，24px金色字体(高端感)
      // 转换为前端需要的嵌套结构
      return {
        backgroundImage: stored.backgroundImage ?? '/images/poster/invite_bg.png',
        qrCodePosition: {
          x: stored.qrCodePositionX ?? 50,
          y: stored.qrCodePositionY ?? 62,
          size: stored.qrCodeSize ?? 180,
        },
        inviteCodePosition: {
          x: stored.inviteCodePositionX ?? 50,
          y: stored.inviteCodePositionY ?? 82,
          fontSize: stored.inviteCodeFontSize ?? 24,
          color: stored.inviteCodeColor ?? '#C9A962',
        },
      };
    },
    CACHE_TTL.CONFIG_GLOBAL
  );
}
