/**
 * @file 渠道链接类型定义
 * @description 渠道链接管理模块的 TypeScript 类型
 * @depends 渠道链接.md 第5.3节 - 类型定义
 */

/** 渠道统计摘要 */
export interface ChannelStats {
  registerCount: number;
  firstRechargeCount: number;
  firstRechargeRate: string;       // 百分比字符串（如 "53.33"）
  repeatRechargeCount: number;
  totalGrossRecharge: string;      // 毛额（如 "30000.00"）
  totalFee: string;                // 手续费（如 "5000.00"）
  totalNetRecharge: string;        // 净额（如 "25000.00"）
  avgRechargePerUser: string;      // 人均（如 "375.00"）
}

/** 渠道列表项 */
export interface MarketingChannelItem {
  id: number;
  name: string;
  userId: number;
  userPhone: string;
  userInviteCode: string;
  inviteLink: string;
  isActive: boolean;
  remark: string | null;
  stats: ChannelStats;
  createdAt: string;
}

/** 渠道列表请求参数 */
export interface MarketingChannelListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: string;
}

/** 创建渠道请求 */
export interface CreateChannelRequest {
  name: string;
  userId: number;
  remark?: string;
}

/** 更新渠道请求 */
export interface UpdateChannelRequest {
  name?: string;
  remark?: string;
  isActive?: boolean;
}

/** 渠道下线用户 */
export interface ChannelUserItem {
  id: number;
  phone: string;
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  rechargeCount: number;
  totalRechargeAmount: string;
  firstRechargeAt: string | null;
  lastRechargeAt: string | null;
}

/** 渠道详情响应 */
export interface ChannelDetailResponse {
  channel: MarketingChannelItem;
  users: {
    list: ChannelUserItem[];
    pagination: { page: number; pageSize: number; total: number };
  };
}
