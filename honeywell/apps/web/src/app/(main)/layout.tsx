/**
 * @file 主布局组件
 * @description "Obsidian Aurora 3.0" - 深空背景底纹 + 浮岛导航 + 侧边栏
 * 底部预留浮岛导航空间(pb-28)，而不是传统的 pb-20
 */

'use client';

import { BottomNav, Sidebar, PageTransition } from '@/components/layout';
import { FloatingService } from '@/components/business';

/**
 * 主布局结构
 */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-premium-subtle">
      {/* 电脑端侧边栏 */}
      <Sidebar />

      {/* 内容区域 - pb-28 为浮岛导航留足空间 */}
      <main className="min-h-screen pb-28 md:pl-60 md:pb-6">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* 移动端浮岛底部导航 */}
      <BottomNav />

      {/* 悬浮客服按钮 */}
      <FloatingService />
    </div>
  );
}
