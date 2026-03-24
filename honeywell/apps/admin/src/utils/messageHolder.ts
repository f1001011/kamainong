/**
 * @file 全局 Message 实例持有器
 * @description 解决非 React 组件中使用 antd message 的静态方法警告
 * @see https://ant.design/components/app-cn#%E5%9F%BA%E6%9C%AC%E7%94%A8%E6%B3%95
 */

import type { MessageInstance } from 'antd/es/message/interface';

/**
 * 全局 message 实例
 * @description 由 MessageHolder 组件在挂载时设置
 */
let messageInstance: MessageInstance | null = null;

/**
 * 设置 message 实例
 * @param instance - antd message 实例
 */
export function setMessageInstance(instance: MessageInstance): void {
  messageInstance = instance;
}

/**
 * 获取 message 实例
 * @returns message 实例或 null
 */
export function getMessageInstance(): MessageInstance | null {
  return messageInstance;
}

/**
 * 显示成功消息
 */
export function showSuccess(content: string): void {
  if (messageInstance) {
    messageInstance.success(content);
  } else {
    console.log('[Success]', content);
  }
}

/**
 * 显示错误消息
 */
export function showError(content: string): void {
  if (messageInstance) {
    messageInstance.error(content);
  } else {
    console.error('[Error]', content);
  }
}

/**
 * 显示警告消息
 */
export function showWarning(content: string): void {
  if (messageInstance) {
    messageInstance.warning(content);
  } else {
    console.warn('[Warning]', content);
  }
}

/**
 * 显示提示消息
 */
export function showInfo(content: string): void {
  if (messageInstance) {
    messageInstance.info(content);
  } else {
    console.info('[Info]', content);
  }
}
