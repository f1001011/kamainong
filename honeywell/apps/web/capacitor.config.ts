/**
 * @file Capacitor 配置
 * @description 远程 URL 模式：先加载 HTML 开屏页，再跳转主站，APK 作为薄壳
 * 网站更新后用户无需重新下载；站外链接（客服、TG 等）由前端/原生用系统浏览器打开
 * 跨域：WebView origin 与主站一致，API 已配置 CORS
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lendlease.app',
  appName: 'Lendlease',
  webDir: 'cap-webdir',
  server: {
    // 开屏页不带 ?source=app（否则中间件会在 openPaths 之前拦截并跳过开屏页）
    // 开屏 HTML 动画结束后由 JS 跳转 /?source=app，由中间件设置 is_app cookie
    url: 'https://www.lles-ma.com/splash-for-app',
    cleartext: false,
    // Capacitor allowNavigation 使用主机名 glob 匹配（HostMask），非完整 URL
    allowNavigation: ['lles-ma.com', '*.lles-ma.com'],
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 15000,
      backgroundColor: '#0A1A12',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A1A12',
    },
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
    // 不设置 minWebViewVersion，老机型也可正常显示（Capacitor 默认有下限）
  },
};

export default config;
