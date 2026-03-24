/**
 * @file 设置页面重定向
 * @description 重定向到安全设置页面
 */

import { redirect } from 'next/navigation';

/**
 * 设置页面
 * @description 自动重定向到 /settings/security
 */
export default function SettingsPage() {
  redirect('/settings/security');
}
