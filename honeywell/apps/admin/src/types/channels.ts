/**
 * @file 支付通道类型定义
 * @description 支付通道列表、详情、配置相关类型
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第9节 - 支付通道接口
 */

/**
 * 通道状态枚举
 * @description 依据：04.7.1-支付通道管理页.md 第3.2节
 */
export type ChannelStatus = 'NORMAL' | 'WARNING' | 'ERROR';

/**
 * 通道状态选项
 */
export const CHANNEL_STATUS_OPTIONS = [
  { value: 'NORMAL', label: '正常', color: '#52c41a' },
  { value: 'WARNING', label: '警告', color: '#faad14' },
  { value: 'ERROR', label: '异常', color: '#f5222d' },
];

/**
 * 支付通道列表项
 * @description 依据：02.4-后台API接口清单.md 第9.1节
 */
export interface ChannelListItem {
  id: number;
  /** 通道编码 */
  code: string;
  /** 通道名称 */
  name: string;
  /** 商户ID */
  merchantId: string;
  /** 网关地址 */
  gatewayUrl: string;
  /** 银行编码 */
  bankCode: string | null;
  /** 代收点位（百分比，如 3.50 表示 3.50%） */
  payFeeRate: string;
  /** 代付点位（百分比，如 2.00 表示 2.00%） */
  transferFeeRate: string;
  /** 代收开关 */
  payEnabled: boolean;
  /** 代付开关 */
  transferEnabled: boolean;
  /** 通道状态 */
  channelStatus: ChannelStatus;
  /** 近1小时成功率 (0-100) */
  hourlySuccessRate: string;
  /** 近7天成功率 (0-100) */
  weeklySuccessRate: string;
  /** 平均响应时间 (毫秒) */
  avgResponseTime: number;
  /** 连续失败次数 */
  consecutiveFailures: number;
  /** 最后检测时间 */
  lastCheckAt: string | null;
  /** 今日充值金额 */
  todayRecharge: string;
  /** 今日充值笔数 */
  todayRechargeCount: number;
  /** 今日提现金额 */
  todayWithdraw: string;
  /** 今日提现笔数 */
  todayWithdrawCount: number;
  /** 通道余额 */
  balance: string;
  /** 余额最后更新时间 */
  balanceUpdatedAt: string | null;
  /** 回调IP白名单（逗号分隔） */
  callbackIps: string | null;
}

/**
 * 通道详情
 * @description 依据：02.4-后台API接口清单.md 第9.1节
 */
export interface ChannelDetail extends ChannelListItem {
  /** 代收密钥（脱敏） */
  paySecretKey: string;
  /** 代付密钥（脱敏） */
  transferSecretKey: string;
  /** 代收类型 */
  payType: string | null;
  /** 最小金额 */
  minAmount: string | null;
  /** 最大金额 */
  maxAmount: string | null;
  /** 排序权重 */
  sortOrder: number;
  /** 备注 */
  remark: string | null;
  /** 昨日充值金额 */
  yesterdayRecharge: string;
  /** 昨日提现金额 */
  yesterdayWithdraw: string;
  /** 累计充值金额 */
  totalRecharge: string;
  /** 累计提现金额 */
  totalWithdraw: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 扩展配置（JYPAY: transferGatewayUrl, rsaPublicKey） */
  extraConfig?: Record<string, unknown> | null;
}

/**
 * 更新通道配置参数
 * @description 依据：02.4-后台API接口清单.md 第9.2节
 */
export interface UpdateChannelParams {
  /** 通道名称 */
  name?: string;
  /** 商户ID */
  merchantId?: string;
  /** 代收密钥（空=不修改） */
  paySecretKey?: string;
  /** 代付密钥（空=不修改） */
  transferSecretKey?: string;
  /** 网关地址 */
  gatewayUrl?: string;
  /** 银行编码 */
  bankCode?: string | null;
  /** 代收类型 */
  payType?: string | null;
  /** 代收点位（百分比） */
  payFeeRate?: string | null;
  /** 代付点位（百分比） */
  transferFeeRate?: string | null;
  /** 代收开关 */
  payEnabled?: boolean;
  /** 代付开关 */
  transferEnabled?: boolean;
  /** 回调IP白名单（逗号分隔） */
  callbackIps?: string | null;
  /** 最小金额 */
  minAmount?: string | null;
  /** 最大金额 */
  maxAmount?: string | null;
  /** 排序权重 */
  sortOrder?: number;
  /** 备注 */
  remark?: string | null;
  /** 扩展配置（JYPAY: transferGatewayUrl, rsaPublicKey） */
  extraConfig?: Record<string, unknown> | null;
}

/**
 * 测试连接结果
 * @description 依据：04.7.1-支付通道管理页.md 第4.1节
 */
export interface TestConnectionResult {
  /** 是否成功 */
  success: boolean;
  /** 响应时间（毫秒） */
  responseTime: number;
  /** 消息 */
  message: string;
  /** 网关地址 */
  gatewayUrl?: string;
  /** 返回状态码 */
  statusCode?: number;
  /** 商户验证结果 */
  merchantVerified?: boolean;
  /** 签名验证结果 */
  signatureVerified?: boolean;
  /** 错误类型（失败时） */
  errorType?: string;
  /** 错误详情（失败时） */
  errorDetail?: string;
}

/**
 * 余额查询结果
 * @description 依据后端 channel.service.ts queryBalance 返回结构
 */
export interface BalanceQueryResult {
  /** 余额（可能为 null 表示查询失败） */
  balance: string | null;
  /** 冻结余额（仅 UZPAY） */
  frozenBalance?: string;
  /** 可用余额（仅 UZPAY） */
  availableBalance?: string;
  /** 消息 */
  message: string;
}

/**
 * 通道签名规则（只读展示）
 * @description 依据：04.7.1-支付通道管理页.md 第4.3.3节
 */
export interface ChannelSignatureInfo {
  /** 签名算法 */
  algorithm: string;
  /** 签名结果格式 */
  signatureCase: 'uppercase' | 'lowercase';
  /** 成功回调响应 */
  callbackResponse: string;
}

/**
 * 获取通道签名规则
 */
export function getChannelSignatureInfo(code: string): ChannelSignatureInfo {
  switch (code) {
    case 'LWPAY':
      return {
        algorithm: 'MD5',
        signatureCase: 'uppercase',
        callbackResponse: 'OK',
      };
    case 'UZPAY':
      return {
        algorithm: 'MD5',
        signatureCase: 'lowercase',
        callbackResponse: 'success',
      };
    case 'JYPAY':
      return {
        algorithm: 'HmacSHA256（代付加RSA）',
        signatureCase: 'lowercase',
        callbackResponse: 'SUCCESS',
      };
    case 'HTPAY':
      return {
        algorithm: 'MD5（签名在Headers中）',
        signatureCase: 'lowercase',
        callbackResponse: 'HTTP 200',
      };
    default:
      return {
        algorithm: 'MD5',
        signatureCase: 'uppercase',
        callbackResponse: 'OK',
      };
  }
}
