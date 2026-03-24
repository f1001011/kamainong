/**
 * @file 管理员文件上传接口
 * @description POST /api/admin/upload - 管理员文件上传（multipart/form-data）
 * @depends 开发文档/02-数据层/02.2-API规范.md 第9节 - 文件上传规范
 *
 * 核心说明：
 * - 复用 /api/upload 的所有上传逻辑（校验、存储等）
 * - 使用 withAdminAuth 认证（管理员 JWT Token）
 * - 解决管理后台上传图片时 admin_token 无法通过 withAuth 用户认证的问题
 * - 额外支持 'service' 类型（客服图标等管理端专属上传类型）
 */

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { getOrSet, CACHE_TTL } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

// ================================
// 常量定义（与 /api/upload 保持一致）
// ================================

/**
 * 上传类型配置
 * @description 管理端支持所有用户端类型 + 额外的管理端类型（service）
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
  service: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'service_icon_max_size',
  },
  content: {
    maxSize: 5 * 1024 * 1024, // 5MB（富文本内容图片）
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    configKey: 'content_image_max_size',
  },
} as const;

type UploadType = keyof typeof UPLOAD_CONFIG;

/**
 * 文件头魔数映射表
 */
const MAGIC_NUMBERS: Record<string, { offset: number; bytes: number[]; mimeType: string }[]> = {
  jpeg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' }],
  jpg: [{ offset: 0, bytes: [0xff, 0xd8, 0xff], mimeType: 'image/jpeg' }],
  png: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], mimeType: 'image/png' }],
  gif: [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mimeType: 'image/gif' },
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mimeType: 'image/gif' },
  ],
  webp: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' }],
};

// ================================
// 辅助函数
// ================================

async function getMaxSizeFromConfig(configKey: string, defaultSize: number): Promise<number> {
  try {
    const config = await getOrSet<number>(
      `config:${configKey}`,
      async () => {
        const result = await prisma.globalConfig.findUnique({
          where: { key: configKey },
        });
        return result?.value ? (result.value as number) : defaultSize;
      },
      CACHE_TTL.CONFIG_GLOBAL
    );
    return config;
  } catch {
    return defaultSize;
  }
}

function verifyMimeType(buffer: Buffer, extension: string): string | null {
  const ext = extension.toLowerCase();
  const magicRules = MAGIC_NUMBERS[ext];
  if (!magicRules) return null;

  for (const rule of magicRules) {
    const { offset, bytes, mimeType } = rule;
    if (buffer.length < offset + bytes.length) continue;

    let match = true;
    for (let i = 0; i < bytes.length; i++) {
      if (buffer[offset + i] !== bytes[i]) {
        match = false;
        break;
      }
    }

    // WEBP 额外校验
    if (match && ext === 'webp') {
      if (buffer.length >= 12) {
        const webpSignature = buffer.slice(8, 12).toString('ascii');
        if (webpSignature !== 'WEBP') match = false;
      } else {
        match = false;
      }
    }

    if (match) return mimeType;
  }

  return null;
}

function generateFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(1) || 'jpg';
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(6).toString('hex');
  return `${timestamp}_${randomStr}.${ext}`;
}

function generateStoragePath(type: string, fileName: string): { relativePath: string; absolutePath: string } {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const relativePath = `/uploads/${type}/${yearMonth}/${fileName}`;
  const absolutePath = path.join(process.cwd(), 'public', 'uploads', type, yearMonth, fileName);
  return { relativePath, absolutePath };
}

async function ensureDir(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase().slice(1) || 'jpg';
}

function isValidUploadType(type: string): type is UploadType {
  return type in UPLOAD_CONFIG;
}

// ================================
// 路由处理
// ================================

/**
 * POST /api/admin/upload
 * @description 管理员文件上传（使用管理员认证）
 */
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (_req, adminId) => {
    try {
      // 1. 解析 multipart/form-data
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const type = formData.get('type') as string | null;

      // 2. 参数校验
      if (!file) {
        return errorResponse('VALIDATION_ERROR', '请选择要上传的文件', 400);
      }

      if (!type) {
        return errorResponse('VALIDATION_ERROR', '请指定上传类型', 400);
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
        return errorResponse('VALIDATION_ERROR', `文件大小超出限制，最大 ${maxSizeMB}MB`, 400);
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
          `文件格式无效，请上传 ${config.allowedMimeTypes.map(m => m.split('/')[1].toUpperCase()).join('/')} 格式`,
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

      // 12. 记录日志
      console.log(`[AdminUpload] 管理员 ${adminId} 上传文件: ${relativePath}, 类型: ${type}, 大小: ${file.size} bytes`);

      // 13. 返回上传结果
      return successResponse({
        url: relativePath,
      });
    } catch (error) {
      console.error('[AdminUpload] 上传失败:', error);
      return errorResponse('INTERNAL_ERROR', '上传失败，请稍后重试', 500);
    }
  });
}
