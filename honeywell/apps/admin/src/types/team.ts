/**
 * @file 团队关系管理类型定义
 * @description 团队关系查询相关的类型定义
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第20节
 */

/**
 * 团队成员基本信息
 */
export interface TeamMemberInfo {
  /** 用户ID */
  id: number;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname: string | null;
  /** 头像URL */
  avatarUrl?: string | null;
  /** VIP等级 */
  vipLevel: number;
  /** 用户状态 */
  status: 'ACTIVE' | 'BANNED';
  /** 注册时间 */
  createdAt: string;
}

/**
 * 上级链路节点
 */
export interface UplineChainNode {
  /** 层级（1=一级上级，2=二级上级，3=三级上级） */
  level: 1 | 2 | 3;
  /** 上级用户信息，无上级时为null */
  user: TeamMemberInfo | null;
}

/**
 * 下级成员统计摘要
 */
export interface DownlineSummary {
  /** 一级下级数量 */
  level1Count: number;
  /** 二级下级数量 */
  level2Count: number;
  /** 三级下级数量 */
  level3Count: number;
  /** 团队总人数 */
  totalCount: number;
}

/**
 * 团队关系查询结果
 */
export interface TeamQueryResult {
  /** 目标用户信息 */
  user: TeamMemberInfo;
  /** 上级链路（三级） */
  upline: {
    level1: TeamMemberInfo | null;
    level2: TeamMemberInfo | null;
    level3: TeamMemberInfo | null;
  };
  /** 下级统计摘要 */
  downlineSummary: DownlineSummary;
}

/**
 * 上级链路查询结果
 */
export interface UplineChainResult {
  /** 上级链路数组 */
  chain: UplineChainNode[];
}

/**
 * 下级成员列表项
 */
export interface DownlineMemberItem {
  /** 成员ID */
  id: number;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname: string | null;
  /** 头像URL */
  avatarUrl?: string | null;
  /** 相对于目标用户的层级（1/2/3） */
  level: 1 | 2 | 3;
  /** VIP等级 */
  vipLevel: number;
  /** 账号状态 */
  status: 'ACTIVE' | 'BANNED';
  /** 是否为有效邀请 */
  isValidInvite: boolean;
  /** 贡献的返佣总额 */
  contributedCommission: string;
  /** 注册时间 */
  registeredAt: string;
  /** 嵌套下级数量（该成员自己的下线数） */
  subDownlineCount: number;
}

/**
 * 下级成员列表查询参数
 */
export interface DownlineListParams {
  /** 层级筛选（1=一级 | 2=二级 | 3=三级，不传=全部） */
  level?: 1 | 2 | 3;
  /** 状态筛选 */
  status?: 'ACTIVE' | 'BANNED';
  /** 是否有效邀请筛选 */
  isValidInvite?: boolean;
  /** 注册开始时间 */
  startDate?: string;
  /** 注册结束时间 */
  endDate?: string;
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
}

/**
 * 下级成员列表响应
 */
export interface DownlineListResponse {
  list: DownlineMemberItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 团队统计数据 - 团队人数统计
 */
export interface TeamSummaryStats {
  /** 一级下线数量 */
  level1Count: number;
  /** 二级下线数量 */
  level2Count: number;
  /** 三级下线数量 */
  level3Count: number;
  /** 团队总人数 */
  totalCount: number;
  /** 活跃成员数量（状态为 ACTIVE） */
  activeCount: number;
  /** 封禁成员数量（状态为 BANNED） */
  bannedCount: number;
  /** 已付费成员数量（购买过付费产品） */
  paidCount: number;
}

/**
 * 团队统计数据 - 返佣汇总
 */
export interface CommissionSummary {
  /** 总返佣金额 */
  totalCommission: string;
  /** 一级返佣总额 */
  level1Commission: string;
  /** 二级返佣总额 */
  level2Commission: string;
  /** 三级返佣总额 */
  level3Commission: string;
}

/**
 * 团队统计数据 - 有效邀请统计
 */
export interface ValidInviteSummary {
  /** 总有效邀请数量 */
  totalValidInvites: number;
  /** 通过充值+购买成为有效邀请的数量 */
  rechargePurchaseCount: number;
  /** 通过完成签到成为有效邀请的数量 */
  completeSigninCount: number;
}

/**
 * 团队统计数据完整响应
 */
export interface TeamStatsResult {
  /** 团队人数统计 */
  teamSummary: TeamSummaryStats;
  /** 返佣汇总 */
  commissionSummary: CommissionSummary;
  /** 有效邀请统计 */
  validInviteSummary: ValidInviteSummary;
}

/**
 * 团队关系查询参数（三选一）
 */
export interface TeamQueryParams {
  /** 用户ID */
  userId?: number;
  /** 手机号 */
  phone?: string;
  /** 邀请码 */
  inviteCode?: string;
}

/**
 * 下级成员层级Tab选项
 */
export const DOWNLINE_LEVEL_OPTIONS = [
  { value: '', label: '全部', count: 0 },
  { value: '1', label: '一级下级', count: 0 },
  { value: '2', label: '二级下级', count: 0 },
  { value: '3', label: '三级下级', count: 0 },
] as const;

/**
 * 用户状态选项
 */
export const TEAM_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'ACTIVE', label: '正常' },
  { value: 'BANNED', label: '封禁' },
] as const;

/**
 * 有效邀请筛选选项
 */
export const VALID_INVITE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'true', label: '是' },
  { value: 'false', label: '否' },
] as const;
