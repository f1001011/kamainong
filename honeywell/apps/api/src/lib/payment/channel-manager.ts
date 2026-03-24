/**
 * @file 支付通道管理器
 * @description 管理多个支付通道，从数据库加载配置，提供统一的通道获取接口
 * @depends 开发文档/05-后端服务/05.2-支付通道集成.md 第2.4节 - 通道管理器
 */

import { prisma } from '@/lib/prisma';
import {
  PaymentChannel,
  ChannelConfig,
} from './types';
import { LWPayChannel } from './lwpay.channel';
import { UZPayChannel } from './uzpay.channel';
import { JYPayChannel } from './jypay.channel';
import { HTPayChannel } from './htpay.channel';
import { getCache, setCache, deleteCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis';
import crypto from 'crypto';

/**
 * 通道密钥解密工具
 * @description 与 channel.service.ts 中的 encrypt/decrypt 保持一致
 * 使用 AES-256-CBC 解密存储的敏感密钥
 */
const ENCRYPTION_KEY = process.env.CHANNEL_ENCRYPTION_KEY || 'honeywell-channel-secret-key-32!';

/**
 * 解密字符串
 * @description 兼容未加密的旧数据（不含 ':' 分隔符的直接返回原文）
 */
function decryptKey(encryptedText: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const parts = encryptedText.split(':');
    // 如果不是加密格式（不含':'），直接返回（兼容未加密的旧数据）
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
    console.warn('[PaymentChannelManager] 密钥解密失败，使用原始值');
    return encryptedText;
  }
}

/**
 * 支付通道管理器
 * 负责加载和管理所有支付通道
 */
export class PaymentChannelManager {
  private channels: Map<string, PaymentChannel> = new Map();
  private channelConfigs: Map<string, ChannelConfig> = new Map();
  private initialized = false;

  /**
   * 初始化通道管理器
   * 从数据库加载所有支付通道配置
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 尝试从缓存获取通道配置
    const cacheKey = CACHE_KEYS.PAYMENT_CHANNEL_CONFIG;
    const cachedConfigs = await getCache<ChannelConfig[]>(cacheKey);

    let configs: ChannelConfig[];

    if (cachedConfigs) {
      configs = cachedConfigs;
    } else {
      // 从数据库加载所有通道（不过滤 channelStatus）
      // 原因：即使通道状态为 ERROR/WARNING，仍需处理回调、查询订单等操作
      // channelStatus 仅用于业务决策（如选择代付通道），不应阻止基础功能
      const dbChannels = await prisma.paymentChannel.findMany();

      // 定义数据库通道记录的类型
      type DBChannel = {
        code: string;
        name: string;
        merchantId: string;
        paySecretKey: string;
        transferSecretKey: string;
        gatewayUrl: string;
        bankCode: string | null;
        payType: string | null;
        payEnabled: boolean;
        transferEnabled: boolean;
        callbackIps: string | null;
        extraConfig: unknown;
      };
      
      configs = (dbChannels as unknown as DBChannel[]).map((ch) => ({
        code: ch.code,
        name: ch.name,
        merchantId: ch.merchantId,
        // 解密密钥（兼容未加密的旧数据）
        paySecretKey: decryptKey(ch.paySecretKey),
        transferSecretKey: decryptKey(ch.transferSecretKey || ''),
        gatewayUrl: ch.gatewayUrl,
        bankCode: ch.bankCode || '',
        payType: ch.payType || undefined,
        payEnabled: ch.payEnabled,
        transferEnabled: ch.transferEnabled,
        extraConfig: (ch.extraConfig as Record<string, unknown>) || undefined,
        // 解析白名单（逗号分隔字符串转数组）
        callbackIps: ch.callbackIps
          ? ch.callbackIps.split(',').map((ip: string) => ip.trim()).filter(Boolean)
          : [],
      }));

      // 缓存5分钟
      await setCache(cacheKey, configs, CACHE_TTL.MEDIUM);
    }

    // 创建通道实例并存储配置
    for (const config of configs) {
      const channel = this.createChannel(config);
      if (channel) {
        this.channels.set(config.code, channel);
        this.channelConfigs.set(config.code, config);
      }
    }

    this.initialized = true;
    console.log(
      `[PaymentChannelManager] 已加载 ${this.channels.size} 个支付通道`
    );
  }

  /**
   * 根据配置创建通道实例
   */
  private createChannel(config: ChannelConfig): PaymentChannel | null {
    switch (config.code) {
      case 'LWPAY':
        return new LWPayChannel(config);
      case 'UZPAY':
        return new UZPayChannel(config);
      case 'JYPAY':
        return new JYPayChannel(config);
      case 'HTPAY':
        return new HTPayChannel(config);
      default:
        console.warn(`[PaymentChannelManager] 未知通道类型: ${config.code}`);
        return null;
    }
  }

  /**
   * 获取指定通道
   * @param code 通道代码
   * @returns 支付通道实例
   */
  async getChannel(code: string): Promise<PaymentChannel | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.channels.get(code) || null;
  }

  /**
   * 获取所有已启用代收的通道
   * @returns 支付通道列表
   */
  async getPayEnabledChannels(): Promise<PaymentChannel[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return Array.from(this.channels.values());
  }

  /**
   * 验证回调IP白名单
   * @param channelCode 通道代码
   * @param ip 请求IP
   * @returns 是否在白名单中（未配置白名单则不校验，返回true）
   */
  verifyCallbackIp(channelCode: string, ip: string): boolean {
    const config = this.channelConfigs.get(channelCode);
    if (!config?.callbackIps || config.callbackIps.length === 0) {
      return true; // 未配置白名单则不校验
    }
    return config.callbackIps.includes(ip);
  }

  /**
   * 刷新通道配置（清除缓存并重新加载）
   */
  async refresh(): Promise<void> {
    this.channels.clear();
    this.channelConfigs.clear();
    this.initialized = false;
    // 同时清除 Redis 缓存，确保从数据库重新加载最新配置
    await deleteCache(CACHE_KEYS.PAYMENT_CHANNEL_CONFIG);
    await this.initialize();
  }
}

// 单例导出
export const paymentChannelManager = new PaymentChannelManager();
