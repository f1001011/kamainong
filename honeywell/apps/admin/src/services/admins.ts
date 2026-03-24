/**
 * @file 管理员管理 API 服务
 * @description 管理员列表、增删改查、状态切换、密码重置等 API
 * @depends 开发文档/04-后台管理端/04.10-安全管理/04.10.1-管理员管理页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第14.1节
 */

import { get, post, put, del } from '@/utils/request';
import type {
  Admin,
  AdminQueryParams,
  AdminListResponse,
  AdminResponse,
  StatusResponse,
  CreateAdminFormData,
  UpdateAdminFormData,
} from '@/types/admins';

/**
 * 获取管理员列表
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint GET /api/admin/admins
 */
export async function fetchAdminList(params: AdminQueryParams): Promise<AdminListResponse> {
  // 处理参数
  const processedParams: Record<string, unknown> = { ...params };
  
  // isActive 参数处理
  if (params.isActive !== undefined) {
    processedParams.isActive = params.isActive;
  }
  
  return get<AdminListResponse>('/admins', processedParams);
}

/**
 * 获取单个管理员详情
 * @endpoint GET /api/admin/admins/:id
 */
export async function fetchAdminDetail(id: number): Promise<Admin> {
  return get<Admin>(`/admins/${id}`);
}

/**
 * 创建管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint POST /api/admin/admins
 */
export async function createAdmin(
  data: Omit<CreateAdminFormData, 'confirmPassword'>
): Promise<AdminResponse> {
  return post<AdminResponse>('/admins', data);
}

/**
 * 更新管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint PUT /api/admin/admins/:id
 */
export async function updateAdmin(
  id: number,
  data: UpdateAdminFormData
): Promise<AdminResponse> {
  return put<AdminResponse>(`/admins/${id}`, data);
}

/**
 * 删除管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint DELETE /api/admin/admins/:id
 */
export async function deleteAdmin(id: number): Promise<{ message: string }> {
  return del<{ message: string }>(`/admins/${id}`);
}

/**
 * 启用/禁用管理员
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint PUT /api/admin/admins/:id/status
 */
export async function toggleAdminStatus(
  id: number,
  isActive: boolean
): Promise<StatusResponse> {
  return put<StatusResponse>(`/admins/${id}/status`, { isActive });
}

/**
 * 重置管理员密码
 * @description 依据：02.4-后台API接口清单.md 第14.1节
 * @endpoint PUT /api/admin/admins/:id/password
 */
export async function resetAdminPassword(
  id: number,
  password: string
): Promise<{ message: string }> {
  return put<{ message: string }>(`/admins/${id}/password`, { 
    newPassword: password,
    confirmPassword: password,
  });
}

/**
 * 自动生成随机密码
 * @description 本地生成，8-12位字符，包含字母和数字
 */
export function generateRandomPassword(): string {
  const length = Math.floor(Math.random() * 5) + 8; // 8-12位
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const all = lowercase + uppercase + numbers;
  
  let password = '';
  // 确保至少有一个小写字母、一个大写字母、一个数字
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  
  // 填充剩余字符
  for (let i = 3; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
