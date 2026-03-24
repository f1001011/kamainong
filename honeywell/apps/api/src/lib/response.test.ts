/**
 * @file 统一响应格式测试
 * @description 测试 successResponse、paginatedResponse、errorResponse
 * @depends 开发文档/02-数据层/02.2-API规范.md 第2节 - 响应格式
 */

import { describe, it, expect } from 'vitest';
import { successResponse, paginatedResponse, errorResponse } from './response';

describe('统一响应格式', () => {
  describe('successResponse - 成功响应', () => {
    it('应返回正确的成功响应格式', async () => {
      const data = { id: 1, name: 'test' };
      const response = successResponse(data);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        success: true,
        data: { id: 1, name: 'test' },
        message: '操作成功',
      });
    });

    it('应支持自定义消息', async () => {
      const data = { result: 'ok' };
      const response = successResponse(data, '创建成功');
      const json = await response.json();

      expect(json.message).toBe('创建成功');
    });

    it('应支持空数据', async () => {
      const response = successResponse(null);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });
  });

  describe('paginatedResponse - 分页响应', () => {
    it('应返回正确的分页响应格式', async () => {
      const list = [{ id: 1 }, { id: 2 }];
      const pagination = { page: 1, pageSize: 20, total: 100 };

      const response = paginatedResponse(list, pagination);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({
        success: true,
        data: {
          list: [{ id: 1 }, { id: 2 }],
          pagination: {
            page: 1,
            pageSize: 20,
            total: 100,
            totalPages: 5,
          },
        },
      });
    });

    it('应正确计算总页数', async () => {
      const list = [{ id: 1 }];
      const pagination = { page: 1, pageSize: 10, total: 25 };

      const response = paginatedResponse(list, pagination);
      const json = await response.json();

      expect(json.data.pagination.totalPages).toBe(3); // ceil(25/10) = 3
    });

    it('应支持额外数据', async () => {
      const list = [{ id: 1 }];
      const pagination = { page: 1, pageSize: 20, total: 1 };
      const extra = { summary: { totalAmount: 100 } };

      const response = paginatedResponse(list, pagination, extra);
      const json = await response.json();

      expect(json.data.summary).toEqual({ totalAmount: 100 });
    });

    it('应处理空列表', async () => {
      const list: unknown[] = [];
      const pagination = { page: 1, pageSize: 20, total: 0 };

      const response = paginatedResponse(list, pagination);
      const json = await response.json();

      expect(json.data.list).toEqual([]);
      expect(json.data.pagination.totalPages).toBe(0);
    });
  });

  describe('errorResponse - 错误响应', () => {
    it('应返回正确的错误响应格式', async () => {
      const response = errorResponse('INSUFFICIENT_BALANCE', '余额不足');
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: '余额不足',
        },
      });
    });

    it('应支持自定义 HTTP 状态码', async () => {
      const response = errorResponse('UNAUTHORIZED', '请先登录', 401);

      expect(response.status).toBe(401);
    });

    it('应支持额外数据', async () => {
      const response = errorResponse(
        'RATE_LIMITED',
        '请求过于频繁',
        429,
        { retryAfter: 30 }
      );
      const json = await response.json();

      expect(json.error.retryAfter).toBe(30);
    });

    it('默认状态码应为 400', async () => {
      const response = errorResponse('VALIDATION_ERROR', '参数错误');

      expect(response.status).toBe(400);
    });
  });
});
