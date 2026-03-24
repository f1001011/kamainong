/**
 * @file 路由守卫中间件
 * @description 处理认证路由保护、APK 应用模式检测、重定向逻辑
 * @reference 开发文档/03-前端用户端/03.0-前端架构.md 第3.2节
 *
 * APK 模式说明：
 * Capacitor 启动 URL 携带 ?source=app 参数 → 中间件设置 is_app cookie →
 * 后续请求通过 cookie 识别 APK 用户 → 跳过 /welcome 直达 /login
 * 网站更新后 APK 用户无需重新下载，WebView 直接加载最新线上内容
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 认证页面路由（未登录可访问，已登录则重定向到首页）
 */
const authPaths = ['/login', '/register', '/forgot-password', '/welcome'];

/**
 * 开放路由（登录/未登录均可访问，不做重定向）
 * splash-for-app：APK 开屏页，纯 HTML 动画后跳转 /?source=app
 */
const openPaths = ['/profile/app-download', '/about', '/splash-for-app'];

/**
 * 静态资源路径（跳过中间件处理）
 * 包含 /downloads 目录（APK 下载）
 */
const staticPaths = ['/api', '/_next', '/favicon.ico', '/logo', '/images', '/videos', '/manifest.json', '/downloads'];

/**
 * 路由守卫中间件
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 跳过静态资源和 API 路由
  if (staticPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // ====== APK 应用入口标记 ======
  // Capacitor 首次打开时 URL 携带 ?source=app，设置长期 cookie 后去除参数
  if (request.nextUrl.searchParams.get('source') === 'app') {
    const dest = token ? new URL('/', request.url) : new URL('/login', request.url);
    const response = NextResponse.redirect(dest);
    response.cookies.set('is_app', '1', {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    return response;
  }

  const isApp = request.cookies.get('is_app')?.value === '1';
  const isAuthPath = authPaths.includes(pathname);
  const isOpenPath = openPaths.some((p) => pathname.startsWith(p));

  // 开放路由 → 登录/未登录均直接放行
  if (isOpenPath) {
    return NextResponse.next();
  }

  // APK 用户访问 /welcome → 直接去 /login（APK 不需要官网落地页）
  if (isApp && pathname === '/welcome') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 已登录用户访问认证页 → 重定向到首页
  if (isAuthPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 已登录用户访问非公开路径 → 正常通过
  if (token) {
    return NextResponse.next();
  }

  // 未登录用户访问根路径
  if (!token && pathname === '/') {
    if (isApp) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // 未登录用户访问其他需认证页面 → 重定向到登录页
  if (!isAuthPath && !token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * 中间件配置
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\..*$).*)',
  ],
};
