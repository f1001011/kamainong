/**
 * @file Providers 统一导出和组合
 * @description 所有 Provider 的统一入口，提供组合 Provider 组件
 */

'use client';

import type { ReactNode } from 'react';
import { MotionProvider } from './motion-provider';
import { QueryProvider } from './query-provider';
import { ToastProvider } from './toast-provider';
import { AppInitializer } from './app-initializer';
import { AuthGuard } from './auth-guard';
import { CapacitorProvider } from './capacitor-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export { MotionProvider } from './motion-provider';
export { QueryProvider } from './query-provider';
export { ToastProvider, toast } from './toast-provider';
export { AppInitializer } from './app-initializer';
export { AuthGuard } from './auth-guard';
export { CapacitorProvider } from './capacitor-provider';

/**
 * 组合 Providers 属性
 */
interface ProvidersProps {
  children: ReactNode;
}

/**
 * 组合 Providers 组件
 * @description 将所有 Provider 组合成一个组件，用于根布局
 * AppInitializer 负责启动时加载全局配置和用户信息，解决页面刷新后登录状态丢失的问题
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <MotionProvider>
        <CapacitorProvider>
          <TooltipProvider>
            <AppInitializer>
              <AuthGuard>
                {children}
              </AuthGuard>
            </AppInitializer>
            <ToastProvider />
          </TooltipProvider>
        </CapacitorProvider>
      </MotionProvider>
    </QueryProvider>
  );
}
