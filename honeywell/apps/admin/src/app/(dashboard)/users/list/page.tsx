/**
 * @file 用户列表重定向页
 * @description 旧路径 /users/list 重定向到 /users，避免重复页面
 */

import { redirect } from 'next/navigation';

export default function UsersListRedirect() {
  redirect('/users');
}
