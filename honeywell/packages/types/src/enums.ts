/**
 * 枚举类型定义
 * 与 Prisma Schema 中的枚举保持一致
 */

// ==================== 用户相关 ====================

/** 用户状态 */
export enum UserStatus {
  /** 正常 */
  ACTIVE = 'ACTIVE',
  /** 封禁 */
  BANNED = 'BANNED',
}

/** 证件类型（摩洛哥） */
export enum DocumentType {
  /** 公民身份证 */
  CC = 'CC',
  /** 外国人身份证 */
  CE = 'CE',
  /** 税号 */
  NIT = 'NIT',
  /** 护照 */
  PP = 'PP',
}

// ==================== 产品相关 ====================

/** 产品类型 */
export enum ProductType {
  /** 体验产品（注册赠送金购买） */
  TRIAL = 'TRIAL',
  /** 付费产品（VIC/NWS/QLD 系列） */
  PAID = 'PAID',
  /** 理财产品（到期返本金+利息） */
  FINANCIAL = 'FINANCIAL',
}

/** 产品系列 */
export enum ProductSeries {
  /** PO系列 */
  PO = 'PO',
  /** VIP系列 */
  VIP = 'VIP',
  /** VIC系列（无限购） */
  VIC = 'VIC',
  /** NWS系列（全局库存+个人限购） */
  NWS = 'NWS',
  /** QLD系列（全局库存+个人限购） */
  QLD = 'QLD',
  /** 理财系列（个人限购5份） */
  FINANCIAL = 'FINANCIAL',
}

/** 产品状态 */
export enum ProductStatus {
  /** 上架 */
  ACTIVE = 'ACTIVE',
  /** 下架 */
  INACTIVE = 'INACTIVE',
  /** 已删除 */
  DELETED = 'DELETED',
}

// ==================== 订单相关 ====================

/** 充值订单状态 */
export enum RechargeStatus {
  /** 待支付 */
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  /** 已支付 */
  PAID = 'PAID',
  /** 支付失败 */
  FAILED = 'FAILED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

/** 提现订单状态 */
export enum WithdrawStatus {
  /** 待审核 */
  PENDING_REVIEW = 'PENDING_REVIEW',
  /** 已批准 */
  APPROVED = 'APPROVED',
  /** 代付失败（余额仍冻结，待管理员处理） */
  PAYOUT_FAILED = 'PAYOUT_FAILED',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 失败 */
  FAILED = 'FAILED',
  /** 已拒绝 */
  REJECTED = 'REJECTED',
}

/** 持仓订单状态 */
export enum PositionStatus {
  /** 持仓中 */
  ACTIVE = 'ACTIVE',
  /** 已完成 */
  COMPLETED = 'COMPLETED',
  /** 已终止 */
  TERMINATED = 'TERMINATED',
}

/** 收益状态 */
export enum IncomeStatus {
  /** 待结算 */
  PENDING = 'PENDING',
  /** 已结算 */
  SETTLED = 'SETTLED',
  /** 结算失败 */
  FAILED = 'FAILED',
  /** 已取消 */
  CANCELLED = 'CANCELLED',
}

// ==================== 资金流水 ====================

/** 资金流水类型 */
export enum TransactionType {
  /** 充值 */
  RECHARGE = 'RECHARGE',
  /** 提现冻结 */
  WITHDRAW_FREEZE = 'WITHDRAW_FREEZE',
  /** 提现成功（扣款） */
  WITHDRAW_SUCCESS = 'WITHDRAW_SUCCESS',
  /** 提现退回（解冻） */
  WITHDRAW_REFUND = 'WITHDRAW_REFUND',
  /** 购买产品 */
  PURCHASE = 'PURCHASE',
  /** 产品收益 */
  INCOME = 'INCOME',
  /** 推荐返佣 */
  REFERRAL_COMMISSION = 'REFERRAL_COMMISSION',
  /** 每日签到奖励 */
  SIGN_IN = 'SIGN_IN',
  /** 活动奖励 */
  ACTIVITY_REWARD = 'ACTIVITY_REWARD',
  /** 注册赠送 */
  REGISTER_BONUS = 'REGISTER_BONUS',
  /** 后台手动增加 */
  ADMIN_ADD = 'ADMIN_ADD',
  /** 后台手动扣减 */
  ADMIN_DEDUCT = 'ADMIN_DEDUCT',
  /** SVIP每日奖励 */
  SVIP_DAILY_REWARD = 'SVIP_DAILY_REWARD',
  /** 周薪奖励 */
  WEEKLY_SALARY = 'WEEKLY_SALARY',
  /** 奖池奖励 */
  PRIZE_POOL = 'PRIZE_POOL',
  /** 转盘奖励 */
  SPIN_WHEEL = 'SPIN_WHEEL',
  /** 理财产品本金返还 */
  FINANCIAL_PRINCIPAL = 'FINANCIAL_PRINCIPAL',
  /** 社区凭证奖励 */
  COMMUNITY_REWARD = 'COMMUNITY_REWARD',
  /** 礼品码兑换 */
  GIFT_CODE = 'GIFT_CODE',
}

/** 返佣层级 */
export enum CommissionLevel {
  /** 一级返佣（12%） */
  LEVEL_1 = 'LEVEL_1',
  /** 二级返佣（3%） */
  LEVEL_2 = 'LEVEL_2',
  /** 三级返佣（1%） */
  LEVEL_3 = 'LEVEL_3',
}

// ==================== 系统配置 ====================

/** 支付通道状态 */
export enum ChannelStatus {
  /** 正常 */
  NORMAL = 'NORMAL',
  /** 警告 */
  WARNING = 'WARNING',
  /** 异常 */
  ERROR = 'ERROR',
}

/** Banner 链接类型 */
export enum BannerLinkType {
  /** 无链接 */
  NONE = 'NONE',
  /** 外部URL */
  URL = 'URL',
  /** 产品详情 */
  PRODUCT = 'PRODUCT',
}

/** 公告目标受众 */
export enum AnnouncementTarget {
  /** 所有用户 */
  ALL = 'ALL',
  /** 指定用户 */
  SPECIFIC = 'SPECIFIC',
}

/** 弹窗显示频率 */
export enum PopupFrequency {
  /** 仅一次 */
  ONCE = 'ONCE',
  /** 每次登录 */
  EVERY_LOGIN = 'EVERY_LOGIN',
  /** 每天一次 */
  DAILY = 'DAILY',
}

/** 签到类型 */
export enum SignInType {
  /** 普通签到 */
  NORMAL = 'NORMAL',
  /** SVIP签到 */
  SVIP = 'SVIP',
}

/** 有效邀请判定类型 */
export enum ValidInviteType {
  /** 充值+购买 */
  RECHARGE_PURCHASE = 'RECHARGE_PURCHASE',
  /** 完成签到 */
  COMPLETE_SIGNIN = 'COMPLETE_SIGNIN',
}

// ==================== 通知相关 ====================

/** 通知类型 */
export enum NotificationType {
  /** 充值成功 */
  RECHARGE_SUCCESS = 'RECHARGE_SUCCESS',
  /** 提现已批准 */
  WITHDRAW_APPROVED = 'WITHDRAW_APPROVED',
  /** 提现已完成 */
  WITHDRAW_COMPLETED = 'WITHDRAW_COMPLETED',
  /** 提现被拒绝 */
  WITHDRAW_REJECTED = 'WITHDRAW_REJECTED',
  /** 提现失败 */
  WITHDRAW_FAILED = 'WITHDRAW_FAILED',
  /** 收到收益 */
  INCOME_RECEIVED = 'INCOME_RECEIVED',
  /** 收到返佣 */
  COMMISSION_RECEIVED = 'COMMISSION_RECEIVED',
  /** 签到奖励 */
  SIGN_IN_REWARD = 'SIGN_IN_REWARD',
  /** 活动奖励 */
  ACTIVITY_REWARD = 'ACTIVITY_REWARD',
  /** 系统公告 */
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  /** SVIP每日奖励 */
  SVIP_DAILY_REWARD = 'SVIP_DAILY_REWARD',
  /** 周薪已领取 */
  WEEKLY_SALARY_CLAIMED = 'WEEKLY_SALARY_CLAIMED',
  /** 奖池已领取 */
  PRIZE_POOL_CLAIMED = 'PRIZE_POOL_CLAIMED',
  /** 转盘中奖 */
  SPIN_WHEEL_WIN = 'SPIN_WHEEL_WIN',
  /** 理财本金返还 */
  FINANCIAL_PRINCIPAL = 'FINANCIAL_PRINCIPAL',
  /** 社区帖子审核通过 */
  COMMUNITY_POST_APPROVED = 'COMMUNITY_POST_APPROVED',
  /** 社区帖子审核拒绝 */
  COMMUNITY_POST_REJECTED = 'COMMUNITY_POST_REJECTED',
  /** 社区凭证奖励 */
  COMMUNITY_REWARD = 'COMMUNITY_REWARD',
}

// ==================== 安全与日志 ====================

/** 黑名单类型 */
export enum BlacklistType {
  /** 手机号 */
  PHONE = 'PHONE',
  /** IP地址 */
  IP = 'IP',
  /** 银行卡号 */
  BANK_CARD = 'BANK_CARD',
}

/** 登录状态 */
export enum LoginStatus {
  /** 成功 */
  SUCCESS = 'SUCCESS',
  /** 失败 */
  FAILED = 'FAILED',
}

/** 定时任务运行状态 */
export enum TaskRunStatus {
  /** 成功 */
  SUCCESS = 'SUCCESS',
  /** 失败 */
  FAILED = 'FAILED',
  /** 运行中 */
  RUNNING = 'RUNNING',
}

// ==================== 礼品码 ====================

/** 礼品码金额类型 */
export enum GiftCodeAmountType {
  /** 固定金额 */
  FIXED = 'FIXED',
  /** 随机金额 */
  RANDOM = 'RANDOM',
}

/** 礼品码状态 */
export enum GiftCodeStatus {
  /** 有效 */
  ACTIVE = 'ACTIVE',
  /** 已禁用 */
  DISABLED = 'DISABLED',
  /** 已过期 */
  EXPIRED = 'EXPIRED',
  /** 已用完 */
  EXHAUSTED = 'EXHAUSTED',
}

/** 礼品码领取条件 */
export enum GiftCodeRequirement {
  /** 无条件 */
  NONE = 'NONE',
  /** 必须购买过付费产品 */
  MUST_PURCHASE = 'MUST_PURCHASE',
}

// ==================== 非 Prisma 枚举（业务常量） ====================

/** 订单号前缀 */
export const OrderPrefix = {
  /** 充值订单 */
  RECHARGE: 'RC',
  /** 提现订单 */
  WITHDRAW: 'WD',
  /** 持仓订单 */
  POSITION: 'PO',
} as const;

/** 支付通道代码 */
export enum PaymentChannelCode {
  /** LWPAY通道 */
  LWPAY = 'LWPAY',
  /** UZPAY通道 */
  UZPAY = 'UZPAY',
}
