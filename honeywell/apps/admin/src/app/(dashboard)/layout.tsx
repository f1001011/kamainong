/**
 * @file Dashboard 路由组布局
 * @description 包含 ProLayout 的主布局和全局错误边界
 */

'use client';

import React from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { ErrorBoundary } from '@/components/common';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <AdminLayout>{children}</AdminLayout>
    </ErrorBoundary>
  );
}
