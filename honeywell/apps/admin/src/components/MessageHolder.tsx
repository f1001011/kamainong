/**
 * @file Message 实例持有组件
 * @description 在应用加载时初始化全局 message 实例
 */

'use client';

import { useEffect } from 'react';
import { App } from 'antd';
import { setMessageInstance } from '@/utils/messageHolder';

/**
 * MessageHolder 组件
 * @description 必须放在 antd App 组件内部
 */
export function MessageHolder() {
  const { message } = App.useApp();

  useEffect(() => {
    // 将 message 实例注册到全局持有器
    setMessageInstance(message);
  }, [message]);

  return null;
}
