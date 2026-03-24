/**
 * @file 产品管理 API 服务
 * @description 产品列表、状态切换、排序、批量操作、创建、编辑相关 API 请求封装
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第7节 - 产品管理接口
 */

import { get, put, post, del, upload as uploadFile } from '@/utils/request';
import type {
  ProductListItem,
  ProductListParams,
  ProductStatusChangeRequest,
  ProductSortRequest,
  ProductBatchStatusRequest,
  BatchOperationResult,
  ProductDetail,
  ProductFormData,
} from '@/types/products';

/**
 * 产品列表响应
 */
export interface ProductListResponse {
  list: ProductListItem[];
}

/**
 * 获取产品列表
 * @description 依据：02.4-后台API接口清单.md 第7.1节
 * @endpoint GET /api/admin/products
 */
export async function fetchProductList(
  params?: ProductListParams
): Promise<ProductListResponse> {
  return get<ProductListResponse>('/products', params as Record<string, unknown>);
}

/**
 * 获取产品详情
 * @description 依据：02.4-后台API接口清单.md 第7.2节
 * @endpoint GET /api/admin/products/:id
 */
export async function fetchProductDetail(productId: number): Promise<ProductDetail> {
  return get<ProductDetail>(`/products/${productId}`);
}

/**
 * 更新产品状态（上下架）
 * @description 依据：02.4-后台API接口清单.md 第7节
 * @endpoint PUT /api/admin/products/:id/status
 */
export async function updateProductStatus(
  productId: number,
  data: ProductStatusChangeRequest
): Promise<void> {
  return put<void>(`/products/${productId}/status`, data);
}

/**
 * 更新产品排序
 * @description 依据：02.4-后台API接口清单.md 第7节
 * @endpoint PUT /api/admin/products/sort
 */
export async function updateProductSort(data: ProductSortRequest): Promise<void> {
  return put<void>('/products/sort', data);
}

/**
 * 批量更新产品状态
 * @description 依据：02.4-后台API接口清单.md 第7.4节
 * @endpoint POST /api/admin/products/batch-status
 */
export async function batchUpdateProductStatus(
  data: ProductBatchStatusRequest
): Promise<BatchOperationResult> {
  return post<BatchOperationResult>('/products/batch-status', data);
}

/**
 * 删除产品（软删除）
 * @description 依据：02.4-后台API接口清单.md 第7.3节
 * @endpoint DELETE /api/admin/products/:id
 */
export async function deleteProduct(productId: number): Promise<void> {
  return del<void>(`/products/${productId}`);
}

/**
 * 创建产品
 * @description 依据：04.5.2-产品编辑页.md 第8节
 * @endpoint POST /api/admin/products
 */
export async function createProduct(data: ProductFormData): Promise<ProductDetail> {
  return post<ProductDetail>('/products', data);
}

/**
 * 更新产品
 * @description 依据：04.5.2-产品编辑页.md 第8节
 * @endpoint PUT /api/admin/products/:id
 */
export async function updateProduct(
  productId: number,
  data: Partial<ProductFormData>
): Promise<ProductDetail> {
  return put<ProductDetail>(`/products/${productId}`, data);
}

/**
 * 上传响应
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

/**
 * 上传产品图片
 * @description 依据：04.5.2-产品编辑页.md 第5节 + 02.2-API规范.md 第9节
 * @endpoint POST /api/admin/upload（使用管理员认证接口）
 */
export async function uploadProductImage(file: File): Promise<UploadResponse> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'product');
  
  const response = await fetch(`${API_BASE_URL}/api/admin/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') || '' : ''}`,
    },
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || '上传失败');
  }
  return result.data;
}
