/**
 * @file 支付通道管理服务
 * @description 后台管理端 - 支付通道管理服务（通道列表、详情、配置更新、测试连接、余额查询）
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9节 - 支付通道接口
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.4节 - PaymentChannel表
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@honeywell/database';
import { BusinessError } from '@/lib/errors';
import crypto from 'crypto';
import { deleteCache, CACHE_KEYS } from '@/lib/redis';
import { paymentChannelManager } from '@/lib/payment/channel-manager';

/**
 * 通道密钥加密工具
 * @description 使用 AES-256-CBC 加密存储敏感密钥
 */
const ENCRYPTION_KEY = process.env.CHANNEL_ENCRYPTION_KEY || 'honeywell-channel-secret-key-32!';
const IV_LENGTH = 16;

/**
 * 加密字符串
 */
function encrypt(text: string): string {
  // 确保密钥长度为32字节（AES-256）
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 解密字符串
 */
function decrypt(encryptedText: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = encryptedText.split(':');
    // 如果不是加密格式，直接返回（兼容未加密的旧数据）
    if (parts.length !== 2) {
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    // 解密失败，返回原文（可能是未加密数据）
    return encryptedText;
  }
}

/**
 * 脱敏密钥（仅显示前4位和后4位）
 */
function maskSecretKey(key: string): string {
  if (!key || key.length < 8) {
    return '****';
  }
  return key.slice(0, 4) + '****' + key.slice(-4);
}

/**
 * 通道列表项类型
 * @description 依据：04.7.1-支付通道管理页.md 第3.1节 - 通道卡片结构
 */
interface ChannelListItem {
  id: number;
  code: string;
  name: string;
  merchantId: string;
  gatewayUrl: string;
  bankCode: string | null;
  /** 代收点位（百分比，如 3.50 表示 3.50%） */
  payFeeRate: string;
  /** 代付点位（百分比，如 2.00 表示 2.00%） */
  transferFeeRate: string;
  payEnabled: boolean;
  transferEnabled: boolean;
  channelStatus: string;
  hourlySuccessRate: string;
  weeklySuccessRate: string;
  avgResponseTime: number;
  consecutiveFailures: number;
  lastCheckAt: string | null;
  todayRecharge: string;
  todayRechargeCount: number;
  todayWithdraw: string;
  todayWithdrawCount: number;
  balance: string;
  balanceUpdatedAt: string | null;
  callbackIps: string | null;
}

/**
 * 通道详情类型
 * @description 依据：04.7.1-支付通道管理页.md 第4.3节 - 详情抽屉
 */
interface ChannelDetail {
  id: number;
  code: string;
  name: string;
  merchantId: string;
  paySecretKey: string;  // 脱敏后的密钥
  transferSecretKey: string;  // 脱敏后的密钥
  gatewayUrl: string;
  bankCode: string | null;
  payType: string | null;
  /** 代收点位（百分比） */
  payFeeRate: string;
  /** 代付点位（百分比） */
  transferFeeRate: string;
  payEnabled: boolean;
  transferEnabled: boolean;
  channelStatus: string;
  lastCheckAt: string | null;
  consecutiveFailures: number;
  hourlySuccessRate: string;
  weeklySuccessRate: string;
  avgResponseTime: number;
  todayRecharge: string;
  todayRechargeCount: number;
  todayWithdraw: string;
  todayWithdrawCount: number;
  yesterdayRecharge: string;
  yesterdayWithdraw: string;
  totalRecharge: string;
  totalWithdraw: string;
  balance: string;
  balanceUpdatedAt: string | null;
  callbackIps: string | null;
  minAmount: string | null;
  maxAmount: string | null;
  sortOrder: number;
  remark: string | null;
  extraConfig?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 更新通道配置参数
 */
interface UpdateChannelParams {
  name?: string;
  merchantId?: string;
  paySecretKey?: string;
  transferSecretKey?: string;
  gatewayUrl?: string;
  bankCode?: string | null;
  payType?: string | null;
  /** 代收点位（百分比，如 "3.50"） */
  payFeeRate?: string | null;
  /** 代付点位（百分比，如 "2.00"） */
  transferFeeRate?: string | null;
  payEnabled?: boolean;
  transferEnabled?: boolean;
  callbackIps?: string | null;
  minAmount?: string | null;
  maxAmount?: string | null;
  sortOrder?: number;
  remark?: string | null;
  extraConfig?: Record<string, unknown> | null;
}

/**
 * 测试连接结果
 */
interface TestConnectionResult {
  success: boolean;
  responseTime: number;
  message: string;
  rawResponse?: unknown;
}

/**
 * 支付通道管理服务类
 */
class ChannelService {
  /**
   * 获取通道列表
   * @description 依据：02.4-后台API接口清单.md 第9.1节 - 通道列表
   * @returns 通道列表（含状态、成功率、今日充值提现）
   */
  async getList(): Promise<{ list: ChannelListItem[] }> {
    const channels = await prisma.paymentChannel.findMany({
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    // 获取今日日期范围（用于统计今日订单数）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 获取各通道今日订单统计
    const [rechargeStats, withdrawStats] = await Promise.all([
      // 今日充值订单统计
      prisma.rechargeOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'PAID',
          createdAt: { gte: today, lt: tomorrow },
        },
        _count: { id: true },
      }),
      // 今日提现订单统计
      prisma.withdrawOrder.groupBy({
        by: ['channelId'],
        where: {
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow },
        },
        _count: { id: true },
      }),
    ]);

    // 构建统计映射
    const rechargeCountMap: Record<number, number> = {};
    rechargeStats.forEach((stat) => {
      if (stat.channelId) {
        rechargeCountMap[stat.channelId] = stat._count.id;
      }
    });

    const withdrawCountMap: Record<number, number> = {};
    withdrawStats.forEach((stat) => {
      if (stat.channelId) {
        withdrawCountMap[stat.channelId] = stat._count.id;
      }
    });

    const list: ChannelListItem[] = channels.map((ch) => ({
      id: ch.id,
      code: ch.code,
      name: ch.name,
      merchantId: ch.merchantId,
      gatewayUrl: ch.gatewayUrl,
      bankCode: ch.bankCode,
      payFeeRate: ch.payFeeRate.toString(),
      transferFeeRate: ch.transferFeeRate.toString(),
      payEnabled: ch.payEnabled,
      transferEnabled: ch.transferEnabled,
      channelStatus: ch.channelStatus,
      hourlySuccessRate: ch.hourlySuccessRate ? ch.hourlySuccessRate.toString() : '0.00',
      weeklySuccessRate: ch.weeklySuccessRate ? ch.weeklySuccessRate.toString() : '0.00',
      avgResponseTime: ch.avgResponseTime || 0,
      consecutiveFailures: ch.consecutiveFailures,
      lastCheckAt: ch.lastCheckAt ? ch.lastCheckAt.toISOString() : null,
      todayRecharge: ch.todayRecharge.toString(),
      todayRechargeCount: rechargeCountMap[ch.id] || 0,
      todayWithdraw: ch.todayWithdraw.toString(),
      todayWithdrawCount: withdrawCountMap[ch.id] || 0,
      balance: ch.balance ? ch.balance.toString() : '0.00',
      balanceUpdatedAt: ch.balanceUpdatedAt ? ch.balanceUpdatedAt.toISOString() : null,
      callbackIps: ch.callbackIps,
    }));

    return { list };
  }

  /**
   * 获取通道详情
   * @description 依据：02.4-后台API接口清单.md 第9.2节 - 通道详情
   * @param id 通道ID
   * @returns 通道详情（密钥脱敏显示）
   */
  async getDetail(id: number): Promise<ChannelDetail> {
    const channel = await prisma.paymentChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new BusinessError('CHANNEL_NOT_FOUND', '通道不存在', 404);
    }

    // 获取今日和昨日日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 获取今日和昨日订单统计
    const [todayRechargeCount, todayWithdrawCount, yesterdayRecharge, yesterdayWithdraw] = await Promise.all([
      // 今日充值笔数
      prisma.rechargeOrder.count({
        where: {
          channelId: id,
          status: 'PAID',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      // 今日提现笔数
      prisma.withdrawOrder.count({
        where: {
          channelId: id,
          status: 'COMPLETED',
          createdAt: { gte: today, lt: tomorrow },
        },
      }),
      // 昨日充值金额
      prisma.rechargeOrder.aggregate({
        where: {
          channelId: id,
          status: 'PAID',
          createdAt: { gte: yesterday, lt: today },
        },
        _sum: { actualAmount: true },
      }),
      // 昨日提现金额 - 使用 actualAmount（扣除手续费后的实际到账金额）
      prisma.withdrawOrder.aggregate({
        where: {
          channelId: id,
          status: 'COMPLETED',
          createdAt: { gte: yesterday, lt: today },
        },
        _sum: { actualAmount: true },
      }),
    ]);

    return {
      id: channel.id,
      code: channel.code,
      name: channel.name,
      merchantId: channel.merchantId,
      // 密钥脱敏显示
      paySecretKey: maskSecretKey(decrypt(channel.paySecretKey)),
      transferSecretKey: maskSecretKey(decrypt(channel.transferSecretKey)),
      gatewayUrl: channel.gatewayUrl,
      bankCode: channel.bankCode,
      payType: channel.payType,
      payFeeRate: channel.payFeeRate.toString(),
      transferFeeRate: channel.transferFeeRate.toString(),
      payEnabled: channel.payEnabled,
      transferEnabled: channel.transferEnabled,
      channelStatus: channel.channelStatus,
      lastCheckAt: channel.lastCheckAt ? channel.lastCheckAt.toISOString() : null,
      consecutiveFailures: channel.consecutiveFailures,
      hourlySuccessRate: channel.hourlySuccessRate ? channel.hourlySuccessRate.toString() : '0.00',
      weeklySuccessRate: channel.weeklySuccessRate ? channel.weeklySuccessRate.toString() : '0.00',
      avgResponseTime: channel.avgResponseTime || 0,
      todayRecharge: channel.todayRecharge.toString(),
      todayRechargeCount,
      todayWithdraw: channel.todayWithdraw.toString(),
      todayWithdrawCount,
      yesterdayRecharge: yesterdayRecharge._sum.actualAmount?.toString() || '0.00',
      yesterdayWithdraw: yesterdayWithdraw._sum.actualAmount?.toString() || '0.00',
      totalRecharge: channel.totalRecharge.toString(),
      totalWithdraw: channel.totalWithdraw.toString(),
      balance: channel.balance ? channel.balance.toString() : '0.00',
      balanceUpdatedAt: channel.balanceUpdatedAt ? channel.balanceUpdatedAt.toISOString() : null,
      callbackIps: channel.callbackIps,
      minAmount: channel.minAmount ? channel.minAmount.toString() : null,
      maxAmount: channel.maxAmount ? channel.maxAmount.toString() : null,
      sortOrder: channel.sortOrder,
      remark: channel.remark,
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
      extraConfig: channel.extraConfig as Record<string, unknown> | null,
    };
  }

  /**
   * 更新通道配置
   * @description 依据：02.4-后台API接口清单.md 第9.2节 - 更新通道配置
   * @param id 通道ID
   * @param params 更新参数
   * @returns 更新后的通道详情
   */
  async updateConfig(id: number, params: UpdateChannelParams): Promise<ChannelDetail> {
    // 检查通道是否存在
    const existing = await prisma.paymentChannel.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new BusinessError('CHANNEL_NOT_FOUND', '通道不存在', 404);
    }

    // 如果要启用代付，自动关闭其他通道的代付功能
    // 依据：04.7.1-支付通道管理页.md 第3.3.2节 - 代付开关互斥，开启时自动关闭其他通道
    if (params.transferEnabled === true) {
      await prisma.paymentChannel.updateMany({
        where: {
          transferEnabled: true,
          id: { not: id },
        },
        data: {
          transferEnabled: false,
        },
      });
    }

    // 构建更新数据
    const updateData: Prisma.PaymentChannelUpdateInput = {};

    if (params.name !== undefined) updateData.name = params.name;
    if (params.merchantId !== undefined) updateData.merchantId = params.merchantId;
    if (params.gatewayUrl !== undefined) updateData.gatewayUrl = params.gatewayUrl;
    if (params.bankCode !== undefined) updateData.bankCode = params.bankCode;
    if (params.payType !== undefined) updateData.payType = params.payType;
    // 通道费率配置
    if (params.payFeeRate !== undefined) {
      updateData.payFeeRate = params.payFeeRate ? new Prisma.Decimal(params.payFeeRate) : new Prisma.Decimal(0);
    }
    if (params.transferFeeRate !== undefined) {
      updateData.transferFeeRate = params.transferFeeRate ? new Prisma.Decimal(params.transferFeeRate) : new Prisma.Decimal(0);
    }
    if (params.payEnabled !== undefined) updateData.payEnabled = params.payEnabled;
    if (params.transferEnabled !== undefined) updateData.transferEnabled = params.transferEnabled;
    if (params.callbackIps !== undefined) updateData.callbackIps = params.callbackIps;
    if (params.sortOrder !== undefined) updateData.sortOrder = params.sortOrder;
    if (params.remark !== undefined) updateData.remark = params.remark;
    if (params.extraConfig !== undefined) {
      updateData.extraConfig = params.extraConfig === null
        ? Prisma.JsonNull
        : (params.extraConfig as Prisma.InputJsonValue);
    }
    if (params.minAmount !== undefined) {
      updateData.minAmount = params.minAmount ? new Prisma.Decimal(params.minAmount) : null;
    }
    if (params.maxAmount !== undefined) {
      updateData.maxAmount = params.maxAmount ? new Prisma.Decimal(params.maxAmount) : null;
    }

    // 密钥加密存储
    if (params.paySecretKey !== undefined) {
      updateData.paySecretKey = encrypt(params.paySecretKey);
    }
    if (params.transferSecretKey !== undefined) {
      updateData.transferSecretKey = encrypt(params.transferSecretKey);
    }

    // 执行更新
    await prisma.paymentChannel.update({
      where: { id },
      data: updateData,
    });

    // 清除通道配置缓存并刷新通道管理器，使配置立即生效
    // 依据：05.2-支付通道集成.md 第2.2节 - refreshChannels 后台修改配置后调用
    await deleteCache(CACHE_KEYS.PAYMENT_CHANNEL_CONFIG);
    await paymentChannelManager.refresh();

    // 返回更新后的详情
    return this.getDetail(id);
  }

  /**
   * 测试通道连接
   * @description 依据：02.4-后台API接口清单.md 第9.3节 - 测试通道连接
   * @param id 通道ID
   * @returns 测试结果（含响应时间）
   */
  async testConnection(id: number): Promise<TestConnectionResult> {
    const channel = await prisma.paymentChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new BusinessError('CHANNEL_NOT_FOUND', '通道不存在', 404);
    }

    const startTime = Date.now();

    try {
      // 根据通道类型执行不同的测试
      if (channel.code === 'LWPAY') {
        return await this.testLwpayConnection(channel, startTime);
      } else if (channel.code === 'UZPAY') {
        return await this.testUzpayConnection(channel, startTime);
      } else if (channel.code === 'JYPAY') {
        return await this.testJypayConnection(channel, startTime);
      } else if (channel.code === 'HTPAY') {
        return await this.testHtpayConnection(channel, startTime);
      } else {
        return {
          success: false,
          responseTime: Date.now() - startTime,
          message: `未知通道类型: ${channel.code}`,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : '未知错误';
      return {
        success: false,
        responseTime,
        message: `连接失败: ${message}`,
      };
    }
  }

  /**
   * 测试 LWPAY 通道连接
   */
  private async testLwpayConnection(
    channel: {
      gatewayUrl: string;
      merchantId: string;
      paySecretKey: string;
    },
    startTime: number
  ): Promise<TestConnectionResult> {
    // 使用查询接口测试连接
    const url = `${channel.gatewayUrl}/Pay_Trade_query.html`;
    const secretKey = decrypt(channel.paySecretKey);

    // 构建测试请求参数
    const params: Record<string, string> = {
      pay_memberid: channel.merchantId,
      pay_orderid: 'TEST_' + Date.now(),
    };

    // 生成签名
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const stringSignTemp = stringA + '&key=' + secretKey;
    const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
    params.pay_md5sign = sign;

    // 发起请求
    const formBody = Object.keys(params)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    // 验证响应
    if (response.ok) {
      // 尝试解析JSON响应
      try {
        const data = JSON.parse(responseText);
        // LWPAY 查询接口返回 returncode 字段
        // 即使订单不存在也说明接口可用
        return {
          success: true,
          responseTime,
          message: '连接成功',
          rawResponse: data,
        };
      } catch {
        // 响应不是JSON格式
        return {
          success: true,
          responseTime,
          message: '连接成功（响应格式非标准）',
          rawResponse: responseText,
        };
      }
    } else {
      return {
        success: false,
        responseTime,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }
  }

  /**
   * 测试 UZPAY 通道连接
   */
  private async testUzpayConnection(
    channel: {
      gatewayUrl: string;
      merchantId: string;
      transferSecretKey: string;
    },
    startTime: number
  ): Promise<TestConnectionResult> {
    // 使用代付查询接口测试连接
    const url = `${channel.gatewayUrl}/query/transfer`;
    const secretKey = decrypt(channel.transferSecretKey);

    // 构建测试请求参数
    const params: Record<string, string> = {
      mch_id: channel.merchantId,
      mch_transferId: 'TEST_' + Date.now(),
    };

    // 生成签名（UZPAY 签名转小写）
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const stringSignTemp = stringA + '&key=' + secretKey;
    const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toLowerCase();
    params.sign = sign;
    params.sign_type = 'MD5';

    // 发起请求
    const formBody = Object.keys(params)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    // 验证响应
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        // UZPAY 响应包含 respCode 字段
        return {
          success: true,
          responseTime,
          message: '连接成功',
          rawResponse: data,
        };
      } catch {
        return {
          success: true,
          responseTime,
          message: '连接成功（响应格式非标准）',
          rawResponse: responseText,
        };
      }
    } else {
      return {
        success: false,
        responseTime,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }
  }

  /**
   * 查询通道余额
   * @description 依据：02.4-后台API接口清单.md 第9.4节 - 查询通道余额
   * @depends lwpay.md 第九节 - 商户余额查询
   * @depends uzpay.md 查询账号余额
   * @param id 通道ID
   * @returns 余额信息
   */
  async queryBalance(id: number): Promise<{
    balance: string | null;
    frozenBalance?: string;
    availableBalance?: string;
    message: string;
  }> {
    const channel = await prisma.paymentChannel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new BusinessError('CHANNEL_NOT_FOUND', '通道不存在', 404);
    }

    try {
      if (channel.code === 'LWPAY') {
        return await this.queryLwpayBalance(channel);
      } else if (channel.code === 'UZPAY') {
        return await this.queryUzpayBalance(channel);
      } else if (channel.code === 'JYPAY') {
        return await this.queryJypayBalance(channel);
      } else if (channel.code === 'HTPAY') {
        return {
          balance: null,
          message: 'HTPAY 不支持余额查询接口，请登录商户后台查看',
        };
      } else {
        return {
          balance: null,
          message: `未知通道类型: ${channel.code}`,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      return {
        balance: null,
        message: `查询失败: ${message}`,
      };
    }
  }

  /**
   * 查询 LWPAY 商户余额
   * @description 依据：lwpay.md 第九节 - 商户余额查询
   * 接口地址：POST /Payment_Dfpay_checkbalance
   */
  private async queryLwpayBalance(channel: {
    gatewayUrl: string;
    merchantId: string;
    paySecretKey: string;
  }): Promise<{ balance: string | null; message: string }> {
    const url = `${channel.gatewayUrl}/Payment_Dfpay_checkbalance`;
    const secretKey = decrypt(channel.paySecretKey);

    // 构建请求参数
    const params: Record<string, string> = {
      mchid: channel.merchantId,
    };

    // 生成签名（LWPAY 签名转大写）
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const stringSignTemp = stringA + '&key=' + secretKey;
    const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
    params.pay_md5sign = sign;

    // 发起请求
    const formBody = Object.keys(params)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        balance: null,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }

    try {
      const data = JSON.parse(responseText);
      // LWPAY 余额响应格式：{ status: "success", msg: "success", balance: "10000.00" }
      if (data.status === 'success') {
        return {
          balance: data.balance,
          message: '查询成功',
        };
      } else {
        return {
          balance: null,
          message: data.msg || '查询失败',
        };
      }
    } catch {
      return {
        balance: null,
        message: '响应格式解析失败',
      };
    }
  }

  /**
   * 查询 UZPAY 商户余额
   * @description 依据：uzpay.md 查询账号余额
   * 接口地址：POST /query/balance
   */
  private async queryUzpayBalance(channel: {
    gatewayUrl: string;
    merchantId: string;
    transferSecretKey: string;
  }): Promise<{
    balance: string | null;
    frozenBalance?: string;
    availableBalance?: string;
    message: string;
  }> {
    const url = `${channel.gatewayUrl}/query/balance`;
    const secretKey = decrypt(channel.transferSecretKey);

    // 构建请求参数
    const params: Record<string, string> = {
      mch_id: channel.merchantId,
    };

    // 生成签名（UZPAY 签名转小写）
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const stringSignTemp = stringA + '&key=' + secretKey;
    const sign = crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toLowerCase();
    params.sign = sign;
    params.sign_type = 'MD5';

    // 发起请求
    const formBody = Object.keys(params)
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody,
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        balance: null,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }

    try {
      const data = JSON.parse(responseText);
      // UZPAY 余额响应格式：
      // { respCode: "SUCCESS", amount: 855, frozenAmount: 53, availableAmount: 802, ... }
      if (data.respCode === 'SUCCESS') {
        return {
          balance: String(data.amount),
          frozenBalance: String(data.frozenAmount),
          availableBalance: String(data.availableAmount),
          message: '查询成功',
        };
      } else {
        return {
          balance: null,
          message: data.errorMsg || '查询失败',
        };
      }
    } catch {
      return {
        balance: null,
        message: '响应格式解析失败',
      };
    }
  }

  /**
   * 测试 JYPAY 通道连接
   * @description 使用代收查询接口测试（不存在的订单也能验证连通性）
   */
  private async testJypayConnection(
    channel: {
      gatewayUrl: string;
      merchantId: string;
      paySecretKey: string;
    },
    startTime: number
  ): Promise<TestConnectionResult> {
    const url = `${channel.gatewayUrl}/payin/orderQuery`;
    const secretKey = decrypt(channel.paySecretKey);

    const timestamp = Date.now().toString();
    const params: Record<string, string> = {
      merNo: channel.merchantId,
      requestNo: `TEST_${Date.now()}`,
      merOrderNo: `TEST_${Date.now()}`,
      orderNo: '',
      timestamp: timestamp,
    };

    // HmacSHA256 签名
    const sortedKeys = Object.keys(params)
      .filter((k) => params[k] !== '' && params[k] !== null && params[k] !== undefined && k !== 'sign')
      .sort();
    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    params.sign = crypto.createHmac('sha256', secretKey).update(signStr).digest('hex');

    // 发起 JSON POST 请求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        return {
          success: true,
          responseTime,
          message: '连接成功',
          rawResponse: data,
        };
      } catch {
        return {
          success: true,
          responseTime,
          message: '连接成功（响应格式非标准）',
          rawResponse: responseText,
        };
      }
    } else {
      return {
        success: false,
        responseTime,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }
  }

  /**
   * 查询 JYPAY 商户余额
   * @depends jypay.md 代付余额查询
   * @description 接口地址：POST /payout/balanceQuery（使用代付网关）
   */
  private async queryJypayBalance(channel: {
    gatewayUrl: string;
    merchantId: string;
    paySecretKey: string;
    extraConfig?: unknown;
  }): Promise<{ balance: string | null; message: string }> {
    // 余额查询走代付网关
    const extraConfig = channel.extraConfig as Record<string, string> | null;
    const transferGatewayUrl = extraConfig?.transferGatewayUrl
      || channel.gatewayUrl.replace('nkhbz', 'twerf');
    const url = `${transferGatewayUrl}/payout/balanceQuery`;
    const secretKey = decrypt(channel.paySecretKey);

    const timestamp = Date.now().toString();
    const params: Record<string, string> = {
      merNo: channel.merchantId,
      requestNo: `BAL_${Date.now()}`,
      timestamp: timestamp,
    };

    // HmacSHA256 签名
    const sortedKeys = Object.keys(params)
      .filter((k) => params[k] !== '' && k !== 'sign')
      .sort();
    const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    params.sign = crypto.createHmac('sha256', secretKey).update(signStr).digest('hex');

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        balance: null,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }

    try {
      const data = JSON.parse(responseText);
      if (data.code === 200 && data.data) {
        const respData = data.data as Record<string, unknown>;
        return {
          balance: String(respData.balance || respData.availableBalance || '0'),
          message: '查询成功',
        };
      } else {
        return {
          balance: null,
          message: (data.msg as string) || '查询失败',
        };
      }
    } catch {
      return {
        balance: null,
        message: '响应格式解析失败',
      };
    }
  }

  /**
   * 测试 HTPAY 通道连接
   * @description 使用查询接口测试连通性（不存在的订单也能验证接口可达）
   */
  private async testHtpayConnection(
    channel: {
      gatewayUrl: string;
      merchantId: string;
      paySecretKey: string;
    },
    startTime: number
  ): Promise<TestConnectionResult> {
    const secretKey = decrypt(channel.paySecretKey);

    const body: Record<string, unknown> = {
      merchant_id: channel.merchantId,
      order_id: `TEST_${Date.now()}`,
      action: 'pay',
    };

    const json = JSON.stringify(body);
    const reqtime = Math.floor(Date.now() / 1000).toString();
    const reqsign = crypto.createHash('md5').update(json + reqtime + secretKey, 'utf8').digest('hex');

    const url = `${channel.gatewayUrl}/index/Api/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'reqsign': reqsign,
        'reqtime': reqtime,
      },
      body: json,
      signal: AbortSignal.timeout(10000),
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        // 即使订单不存在也说明接口可用
        return {
          success: true,
          responseTime,
          message: '连接成功',
          rawResponse: data,
        };
      } catch {
        return {
          success: true,
          responseTime,
          message: '连接成功（响应格式非标准）',
          rawResponse: responseText,
        };
      }
    } else {
      return {
        success: false,
        responseTime,
        message: `HTTP ${response.status}: ${responseText}`,
      };
    }
  }

  /**
   * 更新通道状态（定时任务调用）
   * @description 根据成功率更新通道状态
   * @depends 04.7.1-支付通道管理页.md 第3.2节 - 通道状态标签
   * @param id 通道ID
   * @param successRate 成功率
   * @param avgResponseTime 平均响应时间
   */
  async updateChannelStatus(
    id: number,
    successRate: number,
    avgResponseTime: number
  ): Promise<void> {
    // 依据：04.7.1-支付通道管理页.md 第3.2节 - 通道状态标签
    // - 成功率 >= 90% → NORMAL（正常）
    // - 成功率 50%-90% → WARNING（警告）
    // - 成功率 < 50% → ERROR（异常）
    let status: 'NORMAL' | 'WARNING' | 'ERROR';
    if (successRate >= 90) {
      status = 'NORMAL';
    } else if (successRate >= 50) {
      status = 'WARNING';
    } else {
      status = 'ERROR';
    }

    await prisma.paymentChannel.update({
      where: { id },
      data: {
        channelStatus: status,
        hourlySuccessRate: new Prisma.Decimal(successRate.toFixed(2)),
        avgResponseTime: Math.round(avgResponseTime),
        lastCheckAt: new Date(),
      },
    });
  }
}

// 单例导出
export const channelService = new ChannelService();
