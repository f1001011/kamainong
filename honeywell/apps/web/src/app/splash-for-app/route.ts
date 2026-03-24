/**
 * @file APK 开屏页 Route Handler
 * @description 纯 HTML 开屏动画，供 Capacitor 首次加载使用
 * 无 React、无外部资源，老机型兼容；约 2.5s 后跳转至 /?source=app
 */

const SPLASH_DURATION_MS = 2600;
const REDIRECT_URL = '/?source=app';

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="theme-color" content="#0A1A12">
  <title>lendlease</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      height: 100%;
      background: #0A1A12;
      color: #fff;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      overflow: hidden;
      -webkit-tap-highlight-color: transparent;
    }
    .wrap {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      position: relative;
    }
    .bg-glow {
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(201,169,110,0.15) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 2.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
      50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
    }
    .logo-wrap {
      position: relative;
      z-index: 1;
      width: 88px;
      height: 88px;
      animation: logoIn 1s ease-out forwards;
      opacity: 0;
    }
    @keyframes logoIn {
      0% { opacity: 0; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
    .logo {
      width: 100%;
      height: 100%;
      display: block;
    }
    .brand {
      position: relative;
      z-index: 1;
      margin-top: 20px;
      font-size: 22px;
      letter-spacing: 0.2em;
      font-weight: 600;
      color: rgba(255,255,255,0.95);
      animation: textIn 0.8s ease-out 0.3s forwards;
      opacity: 0;
    }
    @keyframes textIn {
      0% { opacity: 0; transform: translateY(8px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .bar {
      position: relative;
      z-index: 1;
      margin-top: 32px;
      width: 120px;
      height: 3px;
      background: rgba(201,169,110,0.25);
      border-radius: 2px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      width: 0;
      background: linear-gradient(90deg, #C9A96E, #E8D5A3);
      border-radius: 2px;
      animation: fillBar 2s ease-out 0.5s forwards;
    }
    @keyframes fillBar {
      0% { width: 0; }
      100% { width: 100%; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="bg-glow" aria-hidden="true"></div>
    <div class="logo-wrap">
      <svg class="logo" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M40 8L72 40L40 72L8 40Z" stroke="#C9A96E" stroke-width="1.2" stroke-linejoin="round" opacity="0.9"/>
        <path d="M40 18L62 40L40 62L18 40Z" stroke="#C9A96E" stroke-width="0.8" stroke-linejoin="round" opacity="0.45"/>
        <path d="M40 27L53 40L40 53L27 40Z" stroke="#C9A96E" stroke-width="1.4" stroke-linejoin="round" fill="rgba(201,169,110,0.12)"/>
        <circle cx="40" cy="40" r="3.5" fill="#C9A96E" opacity="0.95"/>
      </svg>
    </div>
    <div class="brand">lendlease</div>
    <div class="bar"><div class="bar-fill"></div></div>
  </div>
  <script>
    (function(){
      var t = setTimeout(function(){
        window.location.replace('${REDIRECT_URL}');
      }, ${SPLASH_DURATION_MS});
    })();
  </script>
</body>
</html>`;

export function GET() {
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
