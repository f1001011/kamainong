/**
 * @file 文件上传接口
 * @description POST /api/upload - 文件上传（multipart/form-data）
 * @depends 开发文档/02-数据层/02.2-API规范.md 第9节 - 文件上传规范
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第1.11节 - 文件上传
 *
 * 核心业务规则：
 * 1. 需要认证（Bearer Token）
 * 2. 支持多种文件类型：avatar(头像)、product(产品图)、banner、poster
 * 3. 根据类型限制文件大小和格式
 * 4. 校验 MIME 类型（不仅看扩展名，通过文件头魔数校验）
 * 5. 文件重命名：{timestamp}_{随机串}.{ext}
 * 6. 存储路径：/uploads/{type}/{年月}/{文件名}
 */

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getOrSet, CACHE_TTL } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

// ================================
// 常量定义
// ================================

/**
 * 上传类型配置
 * @description 依据：02.2-API规范.md 第9.2节 - 上传限制
 */
const UPLOAD_CONFIG = {
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    configKey: 'avatar_max_size',
  },
  product: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'product_image_max_size',
  },
  banner: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'banner_max_size',
  },
  poster: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'poster_bg_max_size',
  },
  community: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'community_image_max_size',
  },
} as const;

type UploadType = keyof typeof UPLOAD_CONFIG;

/**
 * 文件头魔数映射表
 * @description 用于验证真实的 MIME 类型，防止伪造扩展名
 */
const MAGIC_NUMBERS: Record<string, { offset: number; bytes: number[]; mimeType: string }[]> = {
  jpeg: [
    { offset: 0, bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' },
  ],
  jpg: [
    { offset: 0, bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' },
  ],
  png: [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimeType: 'image/png' },
  ],
  gif: [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mimeType: 'image/gif' }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mimeType: 'image/gif' }, // GIF89a
  ],
  webp: [
    // WEBP 文件头：RIFF....WEBP
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' }, // RIFF
  ],
};

// ================================
// 辅助函数
// ================================

/**
 * 从数据库获取文件大小限制配置
 * @description 依据：02.1-数据库设计.md 第2.7节 - 配置值存储单位为字节
 * @param configKey 配置键名
 * @param defaultSize 默认大小（字节）
 */
async function getMaxSizeFromConfig(configKey: string, defaultSize: number): Promise<number> {
  try {
    const config = await getOrSet<number>(
      `config:${configKey}`,
      async () => {
        const result = await prisma.globalConfig.findUnique({
          where: { key: configKey },
        });
        // 配置存储的是字节（依据：02.1-数据库设计.md 第2.7节）
        return result?.value ? (result.value as number) : defaultSize;
      },
      CACHE_TTL.CONFIG_GLOBAL
    );
    return config;
  } catch {
    return defaultSize;
  }
}

/**
 * 通过文件头魔数验证 MIME 类型
 * @description 不仅看扩展名，通过文件内容验证真实类型
 * @param buffer 文件 buffer
 * @param extension 文件扩展名
 * @returns 验证后的 MIME 类型，若不匹配返回 null
 */
function verifyMimeType(buffer: Buffer, extension: string): string | null {
  const ext = extension.toLowerCase();
  const magicRules = MAGIC_NUMBERS[ext];

  if (!magicRules) {
    return null;
  }

  for (const rule of magicRules) {
    const { offset, bytes, mimeType } = rule;

    // 检查 buffer 长度是否足够
    if (buffer.length < offset + bytes.length) {
      continue;
    }

    // 对比文件头魔数
    let match = true;
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[offset + i] !== bytes[i]) {
        match = false;
        break;
      }
    }

    // 特殊处理 WEBP：需要额外检查第8-11字节是否为 'WEBP'
    if (match && ext === 'webp') {
      if (buffer.length >= 12) {
        const webpSignature = buffer.slice(8, 12).toString('ascii');
        if (webpSignature !== 'WEBP') {
          match = false;
        }
      } else {
        match = false;
      }
    }

    if (match) {
      return mimeType;
    }
  }

  return null;
}

/**
 * 生成上传文件名
 * @description 格式：{timestamp}_{随机串}.{ext}
 */
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(1) || 'jpg';
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(6).toString('hex'); // 12位随机字符

  return `${timestamp}_${randomStr}.${ext}`;
}

/**
 * 生成存储路径
 * @description 格式：/uploads/{type}/{年月}/{文件名}
 */
function generateStoragePath(type: string, fileName: string): { relativePath: string; absolutePath: string } {
  // 获取年月（格式：YYYYMM）
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 相对路径（用于返回给前端）
  const relativePath = `/uploads/${type}/${yearMonth}/${fileName}`;

  // 绝对路径（用于文件存储）
  // 在 Next.js 中，public 目录下的文件可以直接通过 URL 访问
  const absolutePath = path.join(process.cwd(), 'public', 'uploads', type, yearMonth, fileName);

  return { relativePath, absolutePath };
}

/**
 * 确保目录存在
 */
async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

/**
 * 获取文件扩展名
 */
function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return ext || 'jpg';
}

/**
 * 验证上传类型
 */
function isValidUploadType(type: string): type is UploadType {
  return type in UPLOAD_CONFIG;
}

// ================================
// 路由处理
// ================================

/**
 * POST /api/upload
 * @description 文件上传（multipart/form-data）
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (_req, userId) => {
    try {
      // 1. 解析 multipart/form-data
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const type = formData.get('type') as string | null;

      // 2. 参数校验
      if (!file) {
        return errorResponse('VALIDATION_ERROR', 'يرجى اختيار ملف', 400);
      }

      if (!type) {
        return errorResponse('VALIDATION_ERROR', 'يرجى تحديد نوع الرفع', 400);
      }

      if (!isValidUploadType(type)) {
        return errorResponse('VALIDATION_ERROR', `不支持的上传类型: ${type}`, 400);
      }

      // 3. 获取类型配置
      const config = UPLOAD_CONFIG[type];
      const maxSize = await getMaxSizeFromConfig(config.configKey, config.maxSize);

      // 4. 校验文件大小
      if (file.size > maxSize) {
        const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
        return errorResponse(
          'VALIDATION_ERROR',
          `文件大小超出限制，最大 ${maxSizeMB}MB`,
          400
        );
      }

      // 5. 获取文件扩展名
      const extension = getExtension(file.name);

      // 6. 读取文件 buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // 7. 校验 MIME 类型（通过文件头魔数验证）
      const verifiedMimeType = verifyMimeType(buffer, extension);

      if (!verifiedMimeType) {
        return errorResponse(
          'VALIDATION_ERROR',
          `文件格式无效或不支持，请上传 ${config.allowedMimeTypes.map(m => m.split('/')[1].toUpperCase()).join('/')} 格式`,
          400
        );
      }

      // 8. 检查 MIME 类型是否在允许列表中
      if (!(config.allowedMimeTypes as readonly string[]).includes(verifiedMimeType)) {
        return errorResponse(
          'VALIDATION_ERROR',
          `该上传类型不支持 ${verifiedMimeType.split('/')[1].toUpperCase()} 格式`,
          400
        );
      }

      // 9. 生成文件名和存储路径
      const fileName = generateFileName(file.name);
      const { relativePath, absolutePath } = generateStoragePath(type, fileName);

      // 10. 确保目录存在
      await ensureDir(absolutePath);

      // 11. 写入文件
      await writeFile(absolutePath, buffer);

      // 12. 记录日志（开发环境）
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Upload] 用户 ${userId} 上传文件: ${relativePath}, 类型: ${type}, 大小: ${file.size} bytes`);
      }

      // 13. 返回上传结果
      return successResponse({
        url: relativePath,
      });
    } catch (error) {
      console.error('[Upload] 上传失败:', error);
      return errorResponse('INTERNAL_ERROR', 'خطأ في رفع الملف، حاول لاحقاً', 500);
    }
  });
}
