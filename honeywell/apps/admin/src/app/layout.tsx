/**
 * @file 根布局
 * @description Next.js 应用根布局，配置全局样式和 Ant Design
 */

import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ProgressBarProvider, ReactQueryProvider } from './providers';
import { MessageHolder } from '@/components/MessageHolder';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'lendlease Admin',
    template: '%s | lendlease Admin',
  },
  description: 'lendlease 后台管理系统',
  // 注意：需要在 public 目录下添加 favicon.ico 文件
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

/**
 * 主题色（Ant Design 默认蓝色）
 */
const PRIMARY_COLOR = '#1677ff';

/**
 * Ant Design 主题配置
 * @description 使用 Ant Design 默认蓝色主题
 */
const antdTheme = {
  token: {
    // 主色调（Ant Design 默认蓝色）
    colorPrimary: PRIMARY_COLOR,
    // 链接颜色
    colorLink: PRIMARY_COLOR,
    colorLinkHover: '#4096ff',
    // 边框圆角
    borderRadius: 6,
    // 控件高度
    controlHeight: 36,
  },
  components: {
    Button: {
      colorPrimary: PRIMARY_COLOR,
      algorithm: true,
    },
    Menu: {
      itemSelectedBg: `${PRIMARY_COLOR}10`,
      itemSelectedColor: PRIMARY_COLOR,
    },
    Table: {
      headerBg: '#fafafa',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={antdTheme}>
            <App>
              <ReactQueryProvider>
                <MessageHolder />
                <Suspense fallback={null}>
                  <ProgressBarProvider />
                </Suspense>
                {children}
              </ReactQueryProvider>
            </App>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
