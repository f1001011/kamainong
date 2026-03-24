/**
 * @file 用户服务测试脚本
 * @description 测试用户个人信息更新和心跳接口
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第3节 - 用户接口
 *
 * 使用方式：
 * npx tsx scripts/test-user-service.ts [test-type]
 *
 * 测试类型：
 * - profile: 测试更新个人信息接口（昵称/头像）
 * - heartbeat: 测试心跳上报接口
 * - all: 运行所有测试
 *
 * 示例：
 * npx tsx scripts/test-user-service.ts profile
 * npx tsx scripts/test-user-service.ts heartbeat
 * npx tsx scripts/test-user-service.ts all
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

// 测试用 Token（需要替换为有效的 Token）
const TEST_TOKEN = process.env.TEST_TOKEN || 'YOUR_TEST_TOKEN';

// ================================
// 工具函数
// ================================

/**
 * 发送 HTTP 请求
 */
async function request(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string
): Promise<{ status: number; data: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  return { status: response.status, data };
}

/**
 * 打印测试结果
 */
function printResult(testName: string, success: boolean, details: string): void {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${details}`);
}

/**
 * 打印分隔线
 */
function printSeparator(title: string): void {
  console.log('\n' + '='.repeat(50));
  console.log(` ${title}`);
  console.log('='.repeat(50) + '\n');
}

// ================================
// 测试用例
// ================================

/**
 * 测试更新个人信息接口
 */
async function testUpdateProfile(): Promise<void> {
  printSeparator('测试 PUT /api/user/profile - 更新个人信息');

  // 测试1：更新昵称（正常情况）
  console.log('📝 测试1：更新昵称（正常情况）');
  const nickname = `TestUser_${Date.now().toString().slice(-6)}`;
  const result1 = await request('PUT', '/api/user/profile', { nickname }, TEST_TOKEN);
  console.log('请求参数:', { nickname });
  console.log('响应:', JSON.stringify(result1.data, null, 2));
  printResult(
    '更新昵称',
    result1.status === 200,
    result1.status === 200 ? '成功' : `失败 - HTTP ${result1.status}`
  );

  // 测试2：更新头像（正常情况）
  console.log('\n📝 测试2：更新头像（正常情况）');
  const avatar = '/uploads/avatar/test-avatar.png';
  const result2 = await request('PUT', '/api/user/profile', { avatar }, TEST_TOKEN);
  console.log('请求参数:', { avatar });
  console.log('响应:', JSON.stringify(result2.data, null, 2));
  printResult(
    '更新头像',
    result2.status === 200,
    result2.status === 200 ? '成功' : `失败 - HTTP ${result2.status}`
  );

  // 测试3：昵称过短
  console.log('\n📝 测试3：昵称过短（应该失败）');
  const result3 = await request('PUT', '/api/user/profile', { nickname: 'A' }, TEST_TOKEN);
  console.log('请求参数:', { nickname: 'A' });
  console.log('响应:', JSON.stringify(result3.data, null, 2));
  printResult(
    '昵称过短校验',
    result3.status === 400,
    result3.status === 400 ? '正确拒绝' : `应该返回400，实际返回 ${result3.status}`
  );

  // 测试4：昵称过长（超过20个字符）
  console.log('\n📝 测试4：昵称过长（应该失败）');
  const longNickname = 'A'.repeat(30);
  const result4 = await request('PUT', '/api/user/profile', { nickname: longNickname }, TEST_TOKEN);
  console.log('请求参数:', { nickname: longNickname });
  console.log('响应:', JSON.stringify(result4.data, null, 2));
  printResult(
    '昵称过长校验',
    result4.status === 400,
    result4.status === 400 ? '正确拒绝' : `应该返回400，实际返回 ${result4.status}`
  );

  // 测试5：无参数
  console.log('\n📝 测试5：无参数（应该失败）');
  const result5 = await request('PUT', '/api/user/profile', {}, TEST_TOKEN);
  console.log('请求参数: {}');
  console.log('响应:', JSON.stringify(result5.data, null, 2));
  printResult(
    '无参数校验',
    result5.status === 400,
    result5.status === 400 ? '正确拒绝' : `应该返回400，实际返回 ${result5.status}`
  );

  // 测试6：未认证（无Token）
  console.log('\n📝 测试6：未认证（应该失败）');
  const result6 = await request('PUT', '/api/user/profile', { nickname: 'Test' });
  console.log('请求参数: { nickname: "Test" }, 无Token');
  console.log('响应:', JSON.stringify(result6.data, null, 2));
  printResult(
    '未认证校验',
    result6.status === 401,
    result6.status === 401 ? '正确拒绝' : `应该返回401，实际返回 ${result6.status}`
  );
}

/**
 * 测试心跳接口
 */
async function testHeartbeat(): Promise<void> {
  printSeparator('测试 /api/heartbeat - 心跳接口');

  // 测试1：GET 获取服务器时间（无需认证）
  console.log('📝 测试1：GET /api/heartbeat - 获取服务器时间（无需认证）');
  const result1 = await request('GET', '/api/heartbeat');
  console.log('响应:', JSON.stringify(result1.data, null, 2));
  printResult(
    'GET 服务器时间',
    result1.status === 200,
    result1.status === 200 ? '成功' : `失败 - HTTP ${result1.status}`
  );

  // 验证返回的服务器时间格式
  const responseData = result1.data as { data?: { serverTime?: string } };
  if (responseData?.data?.serverTime) {
    const serverTime = new Date(responseData.data.serverTime);
    const isValidTime = !isNaN(serverTime.getTime());
    printResult(
      '服务器时间格式',
      isValidTime,
      isValidTime ? `有效的 ISO 时间: ${responseData.data.serverTime}` : '无效的时间格式'
    );
  }

  // 测试2：POST 心跳上报（需要认证）
  console.log('\n📝 测试2：POST /api/heartbeat - 心跳上报（需要认证）');
  const result2 = await request('POST', '/api/heartbeat', undefined, TEST_TOKEN);
  console.log('响应:', JSON.stringify(result2.data, null, 2));
  printResult(
    'POST 心跳上报',
    result2.status === 200,
    result2.status === 200 ? '成功' : `失败 - HTTP ${result2.status}`
  );

  // 测试3：POST 心跳上报（未认证，应该失败）
  console.log('\n📝 测试3：POST /api/heartbeat - 未认证（应该失败）');
  const result3 = await request('POST', '/api/heartbeat');
  console.log('响应:', JSON.stringify(result3.data, null, 2));
  printResult(
    'POST 未认证校验',
    result3.status === 401,
    result3.status === 401 ? '正确拒绝' : `应该返回401，实际返回 ${result3.status}`
  );

  // 测试4：连续多次心跳（测试并发）
  console.log('\n📝 测试4：连续3次心跳上报（测试稳定性）');
  for (let i = 1; i <= 3; i++) {
    const result = await request('POST', '/api/heartbeat', undefined, TEST_TOKEN);
    printResult(
      `第${i}次心跳`,
      result.status === 200,
      result.status === 200 ? '成功' : `失败 - HTTP ${result.status}`
    );
    // 短暂延迟
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * 获取用户信息（用于验证更新结果）
 */
async function testGetProfile(): Promise<void> {
  printSeparator('测试 GET /api/user/profile - 获取用户信息');

  const result = await request('GET', '/api/user/profile', undefined, TEST_TOKEN);
  console.log('响应:', JSON.stringify(result.data, null, 2));
  printResult(
    '获取用户信息',
    result.status === 200,
    result.status === 200 ? '成功' : `失败 - HTTP ${result.status}`
  );
}

// ================================
// 主函数
// ================================

async function main(): Promise<void> {
  const testType = process.argv[2] || 'all';

  console.log('\n🚀 用户服务接口测试');
  console.log(`📍 API 地址: ${API_BASE_URL}`);
  console.log(`🔑 Token: ${TEST_TOKEN.substring(0, 20)}...`);
  console.log(`📋 测试类型: ${testType}`);

  if (TEST_TOKEN === 'YOUR_TEST_TOKEN') {
    console.log('\n⚠️  警告：请设置有效的 TEST_TOKEN 环境变量');
    console.log('   示例: TEST_TOKEN=eyJhbGci... npx tsx scripts/test-user-service.ts');
    console.log('\n   如果没有 Token，可以先通过登录接口获取：');
    console.log('   curl -X POST http://localhost:3002/api/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"phone":"987654321","password":"abc12345"}\'');
    console.log('\n');
  }

  try {
    switch (testType) {
      case 'profile':
        await testUpdateProfile();
        break;
      case 'heartbeat':
        await testHeartbeat();
        break;
      case 'get':
        await testGetProfile();
        break;
      case 'all':
        await testGetProfile();
        await testUpdateProfile();
        await testHeartbeat();
        break;
      default:
        console.log('❓ 未知的测试类型:', testType);
        console.log('   可用类型: profile, heartbeat, get, all');
    }
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }

  console.log('\n✨ 测试完成\n');
}

main();
