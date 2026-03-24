/**
 * @file 根布局组件
 * @description "Metropolitan Prestige 2.0" 根布局
 * 字体: Cairo(阿拉伯语标题+正文) + Noto Sans Arabic(备选)
 */

import type { Metadata, Viewport } from 'next';
import { Providers } from '@/providers';
import { ExternalLinkHandler } from '@/components/app/external-link-handler';
import './globals.css';

export const metadata: Metadata = {
  title: 'lendlease - استثمارات ذكية',
  description: 'منصة استثمار آمنة ومربحة للسوق المغربي',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'lendlease',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0D6B3D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-neutral-50 text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          <ExternalLinkHandler />
          {children}
        </Providers>
      </body>
    </html>
  );
}
