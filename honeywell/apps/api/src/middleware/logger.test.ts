/**
 * @file 日志中间件测试
 * @description 测试 withLogger 中间件的日志记录功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { withLogger } from './logger';

describe('withLogger', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // 监听 console.log
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  /**
   * 创建模拟请求
   */
  function createMockRequest(
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {}
  ): NextRequest {
    return new NextRequest(url, {
      method,
      headers: new Headers(headers),
    });
  }

  it('应该记录请求开始日志', async () => {
    const request = createMockRequest('http://localhost:3002/api/test', 'POST');
    const mockResponse = new Response(JSON.stringify({ success: true }), {
      status: 200,
    });

    await withLogger(request, async () => mockResponse);

    // 验证请求开始日志被调用
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    const firstCallArg = consoleSpy.mock.calls[0][0] as string;
    expect(firstCallArg).toContain('POST');
    expect(firstCallArg).toContain('/api/test');
    expect(firstCallArg).toContain('IP:');
  });

  it('应该记录响应完成日志（包含状态码和耗时）', async () => {
    const request = createMockRequest('http://localhost:3002/api/users', 'GET');
    const mockResponse = new Response(JSON.stringify({ data: [] }), {
      status: 200,
    });

    await withLogger(request, async () => mockResponse);

    // 验证响应完成日志被调用
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    const secondCallArg = consoleSpy.mock.calls[1][0] as string;
    expect(secondCallArg).toContain('GET');
    expect(secondCallArg).toContain('/api/users');
    expect(secondCallArg).toContain('200');
    expect(secondCallArg).toMatch(/\d+ms/); // 包含耗时
  });

  it('应该正确获取 X-Forwarded-For 中的 IP', async () => {
    const request = createMockRequest(
      'http://localhost:3002/api/test',
      'GET',
      { 'x-forwarded-for': '192.168.1.100, 10.0.0.1' }
    );
    const mockResponse = new Response('OK', { status: 200 });

    await withLogger(request, async () => mockResponse);

    const firstCallArg = consoleSpy.mock.calls[0][0] as string;
    expect(firstCallArg).toContain('192.168.1.100');
  });

  it('应该正确获取 X-Real-IP 中的 IP', async () => {
    const request = createMockRequest(
      'http://localhost:3002/api/test',
      'GET',
      { 'x-real-ip': '10.20.30.40' }
    );
    const mockResponse = new Response('OK', { status: 200 });

    await withLogger(request, async () => mockResponse);

    const firstCallArg = consoleSpy.mock.calls[0][0] as string;
    expect(firstCallArg).toContain('10.20.30.40');
  });

  it('应该返回原始响应', async () => {
    const request = createMockRequest('http://localhost:3002/api/data', 'GET');
    const mockResponse = new Response(
      JSON.stringify({ success: true, data: { id: 1 } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

    const result = await withLogger(request, async () => mockResponse);

    expect(result).toBe(mockResponse);
    expect(result.status).toBe(200);
  });

  it('应该正确记录错误响应的状态码', async () => {
    const request = createMockRequest('http://localhost:3002/api/error', 'POST');
    const errorResponse = new Response(
      JSON.stringify({ success: false, error: { code: 'ERROR' } }),
      { status: 500 }
    );

    await withLogger(request, async () => errorResponse);

    const secondCallArg = consoleSpy.mock.calls[1][0] as string;
    expect(secondCallArg).toContain('500');
  });
});
