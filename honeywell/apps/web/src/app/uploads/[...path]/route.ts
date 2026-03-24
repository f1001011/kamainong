/**
 * @file 上传文件静态服务路由（用户前端）
 * @description GET /uploads/{type}/{yearMonth}/{fileName} - 提供上传文件的访问
 *
 * 核心说明：
 * - Next.js 生产模式不提供构建后新增到 public/ 的文件
 * - 此路由通过软链接读取 API 服务器的上传文件
 * - 支持正确的 Content-Type、缓存控制、安全检查
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

/** 支持的 MIME 类型映射 */
const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
};

/**
 * GET /uploads/[...path]
 * @description 动态读取并返回上传的文件（通过软链接访问 API 服务器的 uploads 目录）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;

    // 安全检查：防止路径遍历攻击
    if (
      !pathSegments ||
      pathSegments.length === 0 ||
      pathSegments.some(segment => segment === '..' || segment.startsWith('/') || segment.includes('\\'))
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 构建文件路径（通过软链接访问实际文件）
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

    // 二次安全检查：确保解析后的路径包含 uploads
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.includes('/uploads/')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 获取文件扩展名并检查是否为允许的类型
    const ext = path.extname(filePath).toLowerCase().slice(1);
    const mimeType = MIME_TYPES[ext];
    if (!mimeType) {
      return new NextResponse('Unsupported file type', { status: 415 });
    }

    // 检查文件是否存在
    try {
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        return new NextResponse('Not Found', { status: 404 });
      }
    } catch {
      return new NextResponse('Not Found', { status: 404 });
    }

    // 读取文件
    const fileBuffer = await readFile(filePath);

    // 返回文件（带长期缓存头）
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('[Uploads] 文件服务错误:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
