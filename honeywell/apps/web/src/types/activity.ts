/**
 * @file 活动模块类型定义
 * @description 拉新裂变、连单奖励等活动相关类型
 * @depends 开发文档/02-数据层/02.3-前端API接口清单.md 第11节
 * @depends 开发文档/03-前端用户端/03.11-活动模块/03.11.3-拉新裂变活动页.md
 */

// ========================================
// 通用阶梯类型
// ========================================

/**
 * 阶梯状态枚举
 * @description 奖励阶梯的三种状态
 */
export type TierStatus = 'LOCKED' | 'CLAIMABLE' | 'CLAIMED';

/**
 * 通用奖励阶梯数据结构
 * @description 可用于拉新裂变、连单奖励等多种活动
 */
export interface RewardTier {
  /** 阶梯序号 */
  tier: number;
  /** 阶梯名称（可选） */
  name?: string;
  /** 所需数量/条件 */
  requiredCount: number;
  /** 奖励金额（Decimal字符串） */
  reward: string;
  /** 当前状态 */
  status: TierStatus;
}

// ========================================
// 拉新裂变活动类型
// ========================================

/**
 * 拉新裂变阶梯数据结构
 * @description 依据：02.3-前端API接口清单 第11.2节
 */
export interface InviteTier extends RewardTier {
  /** 所需邀请人数 */
  requiredCount: number;
}

/**
 * 拉新裂变活动数据
 * @description 依据：02.3-前端API接口清单 第11.2节
 */
export interface InviteActivityData {
  /** 活动名称（后台配置文案） */
  activityName: string;
  /** 活动描述（后台配置文案） */
  activityDesc: string;
  /** 当前有效邀请人数 */
  validInviteCount: number;
  /** 阶梯配置列表 */
  tiers: InviteTier[];
  /** 邀请记录（可选，分页加载） */
  inviteList?: InviteRecord[];
}

/**
 * 邀请记录
 * @description 被邀请人的记录
 */
export interface InviteRecord {
  /** 用户ID */
  id: number;
  /** 头像URL */
  avatar: string | null;
  /** 昵称 */
  nickname: string | null;
  /** 手机号（脱敏） */
  phone: string;
  /** 是否为有效邀请 */
  isValid: boolean;
  /** 有效类型（有效时显示） */
  validType?: 'RECHARGE_PURCHASE' | 'COMPLETE_SIGNIN';
  /** 注册时间 */
  registeredAt: string;
}

/**
 * 领取奖励请求
 * @description POST /api/activities/invite-reward/claim
 */
export interface ClaimRewardRequest {
  /** 阶梯序号 */
  tier: number;
}

/**
 * 领取奖励响应（data 字段）
 * @description message 在响应根级别，由 api 层处理
 */
export interface ClaimRewardResult {
  /** 领取的阶梯序号 */
  tier: number;
  /** 领取金额（Decimal字符串） */
  reward: string;
  /** 领取后余额 */
  balanceAfter: string;
}

// ========================================
// 连单奖励活动类型
// ========================================

/**
 * 连单奖励所需产品
 * @description 依据：02.3-前端API接口清单 第11.4节
 */
export interface CollectionProduct {
  /** 产品ID */
  id: number;
  /** 产品名称 */
  name: string;
  /** 产品图标 */
  icon?: string;
  /** 是否已购买 */
  isPurchased: boolean;
}

/**
 * 连单奖励阶梯数据结构
 * @description 依据：02.3-前端API接口清单 第11.4节
 */
export interface CollectionTier {
  /** 阶梯序号 */
  tier: number;
  /** 阶梯名称（后台配置文案） */
  name: string;
  /** 所需产品组合 */
  requiredProducts: CollectionProduct[];
  /** 奖励金额（Decimal字符串） */
  reward: string;
  /** 当前状态 */
  status: TierStatus;
}

/**
 * 连单奖励活动数据
 * @description 依据：02.3-前端API接口清单 第11.4节
 */
export interface CollectionActivityData {
  /** 活动名称（后台配置文案） */
  activityName: string;
  /** 活动描述（后台配置文案） */
  activityDesc: string;
  /** 前置条件 */
  prerequisite: {
    /** 条件描述（后台配置文案） */
    description: string;
    /** 是否满足前置条件 */
    isMet: boolean;
  };
  /** 已购买的VIP产品列表 */
  purchasedProducts: {
    id: number;
    name: string;
    icon: string;
  }[];
  /** 阶梯配置列表 */
  tiers: CollectionTier[];
}

// ========================================
// 通用奖励阶梯组件属性类型
// ========================================

/**
 * 通用奖励阶梯组件属性
 * @description 供 reward-tiers.tsx 组件使用，FE-20/FE-21 复用
 */
export interface RewardTiersProps {
  /** 阶梯配置列表 */
  tiers: RewardTier[];
  /** 当前进度值（用于计算进度条） */
  currentProgress: number;
  /** 领取回调 */
  onClaim: (tier: number, event: React.MouseEvent) => void;
  /** 当前正在领取的阶梯（用于 loading 状态） */
  claimingTier?: number | null;
  /** 是否禁用领取（如：活动已结束） */
  disabled?: boolean;
  /** 进度单位文案（如："invitaciones"、"productos"） */
  progressUnit?: string;
  /** 阶梯标题文案（如："Nivel {n}"） */
  tierTitleTemplate?: string;
  /** 需求文案模板（如："Invitar {n} amigos"） */
  requirementTemplate?: string;
  /** 自定义类名 */
  className?: string;
}
