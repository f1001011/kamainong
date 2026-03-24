/**
 * @file 支付回调模拟测试脚本
 * @description 模拟 LWPAY 和 UZPAY 的充值/提现回调，用于测试回调处理逻辑
 * @depends 开发文档/附录/lwpay.md - LWPAY 回调参数
 * @depends 开发文档/附录/uzpay.md - UZPAY 回调参数
 *
 * 使用方式：
 * npx tsx scripts/test-callback.ts [channel] [type] [orderNo] [amount] [status]
 *
 * 示例：
 * npx tsx scripts/test-callback.ts lwpay recharge RC20260205ABC123 100.00 success
 * npx tsx scripts/test-callback.ts uzpay withdraw WD20260205XYZ456 50.00 failed
 */

import crypto from 'crypto';

// ================================
// 配置（需要与实际配置一致）
// ================================
const CONFIG = {
  LWPAY: {
    merchantId: '10155',
    paySecretKey: 'k9vjrzy9j98qphg8st5dj65qye68ywbc',
    transferSecretKey: 'k9vjrzy9j98qphg8st5dj65qye68ywbc', // 代付密钥
  },
  UZPAY: {
    merchantId: '701999002',
    paySecretKey: 'imzdixz6zub3jc2whtcw47wxhsluuy5y',
    transferSecretKey: 'EJQACNFEVOME7MSIYZL2VBI6TNCGUEPL', // 代付密钥不同！
  },
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002';

// ================================
// 工具函数
// ================================

/**
 * MD5 加密
 */
function md5(str: string): string {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex');
}

/**
 * 参数排序并拼接
 */
function sortAndJoin(params: Record<string, string>): string {
  const keys = Object.keys(params).filter(
    (key) => params[key] !== '' && params[key] !== null && params[key] !== undefined
  );
  keys.sort();
  return keys.map((key) => `${key}=${params[key]}`).join('&');
}

/**
 * 生成 LWPAY 签名（大写）
 */
function generateLWPaySign(params: Record<string, string>, key: string): string {
  const stringA = sortAndJoin(params);
  const stringSignTemp = stringA + '&key=' + key;
  return md5(stringSignTemp).toUpperCase();
}

/**
 * 生成 UZPAY 签名（小写）
 */
function generateUZPaySign(params: Record<string, string>, key: string): string {
  const stringA = sortAndJoin(params);
  const stringSignTemp = stringA + '&key=' + key;
  return md5(stringSignTemp).toLowerCase();
}

/**
 * 获取当前时间字符串
 */
function getCurrentDateTime(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ================================
// 回调数据生成器
// ================================

/**
 * 生成 LWPAY 充值回调数据
 * @depends lwpay.md 第四节 - 代收回调通知
 */
function generateLWPayRechargeCallback(
  orderNo: string,
  amount: string,
  success: boolean
): Record<string, string> {
  const params: Record<string, string> = {
    memberid: CONFIG.LWPAY.merchantId,
    orderid: orderNo,
    amount: amount,
    transaction_id: 'PT' + Date.now(),
    datetime: getCurrentDateTime(),
    returncode: success ? '00' : '01',
    refCode: success ? '1' : '0',
  };

  // 生成签名
  params.sign = generateLWPaySign(params, CONFIG.LWPAY.paySecretKey);

  return params;
}

/**
 * 生成 LWPAY 代付回调数据
 * @depends lwpay.md 第七节 - 代付回调通知
 */
function generateLWPayWithdrawCallback(
  orderNo: string,
  amount: string,
  success: boolean
): Record<string, string> {
  const params: Record<string, string> = {
    memberid: CONFIG.LWPAY.merchantId,
    orderid: orderNo,
    amount: amount,
    transaction_id: 'DF' + Date.now(),
    datetime: getCurrentDateTime(),
    returncode: success ? '00' : '01',
    refCode: success ? '1' : '2', // 1=成功，2=失败，3=冲正
    refMsg: success ? 'success' : '代付失败',
  };

  // 使用代付密钥生成签名
  params.sign = generateLWPaySign(params, CONFIG.LWPAY.transferSecretKey);

  return params;
}

/**
 * 生成 UZPAY 充值回调数据
 * @depends uzpay.md 交易异步通知
 */
function generateUZPayRechargeCallback(
  orderNo: string,
  amount: string,
  success: boolean
): Record<string, string> {
  const signParams: Record<string, string> = {
    tradeResult: success ? '1' : '2',
    mchId: CONFIG.UZPAY.merchantId,
    mchOrderNo: orderNo,
    oriAmount: amount,
    amount: amount,
    orderDate: getCurrentDateTime(),
    orderNo: 'UZ' + Date.now(),
  };

  const params = { ...signParams };
  params.sign = generateUZPaySign(signParams, CONFIG.UZPAY.paySecretKey);
  params.signType = 'MD5';

  return params;
}

/**
 * 生成 UZPAY 代付回调数据
 * @depends uzpay.md 代付异步通知
 */
function generateUZPayWithdrawCallback(
  orderNo: string,
  amount: string,
  success: boolean
): Record<string, string> {
  const signParams: Record<string, string> = {
    tradeResult: success ? '1' : '2', // 1=成功，2=失败
    merTransferId: orderNo,
    merNo: CONFIG.UZPAY.merchantId,
    tradeNo: 'TF' + Date.now(),
    transferAmount: amount,
    applyDate: getCurrentDateTime(),
    version: '1.0',
    respCode: 'SUCCESS',
  };

  const params = { ...signParams };
  // 使用代付密钥生成签名
  params.sign = generateUZPaySign(signParams, CONFIG.UZPAY.transferSecretKey);
  params.signType = 'MD5';

  return params;
}

// ================================
// 发送回调请求
// ================================

/**
 * 发送回调请求
 */
async function sendCallback(
  channel: string,
  type: string,
  payload: Record<string, string>
): Promise<void> {
  const url = `${API_BASE_URL}/api/callback/${channel.toLowerCase()}/${type}`;

  console.log('\n========================================');
  console.log(`发送 ${channel.toUpperCase()} ${type} 回调`);
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('========================================\n');

  try {
    // 使用 form-urlencoded 格式发送
    const body = Object.entries(payload)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    const responseText = await response.text();

    console.log('Response Status:', response.status);
    console.log('Response Body:', responseText);

    // 判断是否成功
    const expectedSuccess =
      channel.toUpperCase() === 'LWPAY' ? 'OK' : 'success';
    if (responseText === expectedSuccess) {
      console.log('\n✅ 回调处理成功！');
    } else {
      console.log('\n❌ 回调处理失败，响应:', responseText);
    }
  } catch (error) {
    console.error('\n❌ 请求失败:', error);
  }
}

// ================================
// 主函数
// ================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.log(`
支付回调模拟测试脚本

使用方式：
  npx tsx scripts/test-callback.ts [channel] [type] [orderNo] [amount] [status]

参数说明：
  channel  - 支付通道：lwpay 或 uzpay
  type     - 回调类型：recharge（充值）或 withdraw（提现）
  orderNo  - 订单号（必须是数据库中存在的订单）
  amount   - 金额（例如：100.00）
  status   - 状态：success 或 failed

示例：
  # 模拟 LWPAY 充值成功回调
  npx tsx scripts/test-callback.ts lwpay recharge RC20260205ABC123 100.00 success

  # 模拟 UZPAY 提现失败回调
  npx tsx scripts/test-callback.ts uzpay withdraw WD20260205XYZ456 50.00 failed

  # 运行所有测试（使用测试订单号）
  npx tsx scripts/test-callback.ts test
`);
    return;
  }

  // 运行测试模式
  if (args[0] === 'test') {
    console.log('运行测试模式...\n');
    console.log('注意：测试模式需要数据库中有对应的订单，否则会返回错误。');
    console.log('请先创建测试订单，然后手动指定订单号运行测试。\n');
    return;
  }

  const [channel, type, orderNo, amount, status] = args;
  const isSuccess = status.toLowerCase() === 'success';

  // 验证参数
  if (!['lwpay', 'uzpay'].includes(channel.toLowerCase())) {
    console.error('错误：通道必须是 lwpay 或 uzpay');
    return;
  }

  if (!['recharge', 'withdraw'].includes(type.toLowerCase())) {
    console.error('错误：类型必须是 recharge 或 withdraw');
    return;
  }

  // 生成回调数据
  let payload: Record<string, string>;

  if (channel.toLowerCase() === 'lwpay') {
    if (type.toLowerCase() === 'recharge') {
      payload = generateLWPayRechargeCallback(orderNo, amount, isSuccess);
    } else {
      payload = generateLWPayWithdrawCallback(orderNo, amount, isSuccess);
    }
  } else {
    if (type.toLowerCase() === 'recharge') {
      payload = generateUZPayRechargeCallback(orderNo, amount, isSuccess);
    } else {
      payload = generateUZPayWithdrawCallback(orderNo, amount, isSuccess);
    }
  }

  // 发送回调
  await sendCallback(channel, type, payload);
}

main().catch(console.error);
