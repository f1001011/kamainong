/**
 * @file Next.js 中间件
 * @description 路由守卫，处理认证重定向
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第4.3节 - 路由守卫实现
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 公开路径（不需要认证）
 */
const PUBLIC_PATHS = ['/login'];

/**
 * 静态资源路径（跳过中间件处理）
 */
const STATIC_PATHS = ['/api', '/_next', '/favicon.ico'];

/**
 * 检查是否为公开路径
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

/**
 * 检查是否为静态资源路径
 */
function isStaticPath(pathname: string): boolean {
  return STATIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * 中间件函数
 * @description 处理认证状态的路由重定向
 * 
 * 路由守卫逻辑：
 * 1. 已登录 + 访问登录页 → 重定向到仪表盘
 * 2. 未登录 + 访问受保护页面 → 重定向到登录页
 * 
 * 注意：由于 middleware 无法访问 localStorage，
 * 认证状态通过 cookie 传递。客户端登录成功时会同时设置 cookie。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源
  if (isStaticPath(pathname)) {
    return NextResponse.next();
  }

  // 从 cookie 获取 token
  const token = request.cookies.get('admin_token')?.value;
  const isAuthenticated = !!token;

  // 是否为登录页
  const isLoginPage = pathname === '/login';

  // 是否为公开路径
  const isPublic = isPublicPath(pathname);

  // 已登录访问登录页 → 重定向到仪表盘
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 未登录访问受保护页面 → 重定向到登录页
  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    // 保存原始请求路径，登录后可以跳转回去
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * 中间件匹配配置
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - api (API 路由)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 静态资源文件
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
