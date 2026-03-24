/**
 * @file 上传文件静态服务路由
 * @description GET /uploads/{type}/{yearMonth}/{fileName} - 提供上传文件的访问
 *
 * 核心说明：
 * - Next.js 生产模式（next start）不提供构建后新增到 public/ 的文件
 * - 此路由通过动态读取文件系统来提供上传的文件
 * - 支持正确的 Content-Type、缓存控制、安全检查
 * - 仅允许访问 /uploads/ 目录下的图片文件，防止目录遍历攻击
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

/**
 * 支持的 MIME 类型映射
 */
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
 * @description 动态读取并返回上传的文件
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;

    // 安全检查：防止路径遍历攻击（不允许 .. 或绝对路径）
    if (
      !pathSegments ||
      pathSegments.length === 0 ||
      pathSegments.some(segment => segment === '..' || segment.startsWith('/') || segment.includes('\\'))
    ) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // 构建文件路径（相对于 public/uploads/）
    const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

    // 二次安全检查：确保路径在 uploads 目录内
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsDir)) {
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

    // 返回文件（带缓存头，图片可以缓存较长时间）
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
