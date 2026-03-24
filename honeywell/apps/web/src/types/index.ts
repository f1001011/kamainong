/**
 * @file 类型定义统一导出
 * @description 前端所有 TypeScript 类型定义
 */

// ========================================
// 全局配置类型
// ========================================

/**
 * 全局配置
 * @description 从 /api/global-config 获取的站点全局配置
 */
export interface GlobalConfig {
  /** 站点名称 */
  siteName: string;
  /** 站点域名 */
  siteDomain?: string;
  /** 站点 Logo URL */
  siteLogo: string;
  /** 货币符号 */
  currencySymbol: string;
  /** 货币代码 */
  currencyCode: string;
  /** 货币符号后是否有空格 */
  currencySpace?: boolean;
  /** 货币小数位数（COP 为 0） */
  currencyDecimals?: number;
  /** 千分位分隔符（COP 为 '.'） */
  currencyThousandsSep?: string;
  /** 手机区号 */
  phoneAreaCode?: string;
  /** 手机号位数（摩洛哥为 9） */
  phoneDigitCount?: number;
  /** 系统时区 */
  systemTimezone: string;
  /** 时区显示名称 */
  timezoneDisplayName?: string;
  /** 客服 WhatsApp */
  serviceWhatsapp: string;
  /** 注册赠送金额 */
  registerBonus: number;
  /** 提现手续费百分比 */
  withdrawFeePercent: number;
  /** 提现时间窗口 */
  withdrawTimeRange?: string;
  /** 最小提现金额 */
  withdrawMinAmount?: string;
  /** 最大提现金额 */
  withdrawMaxAmount?: string;
  /** 最小充值金额 */
  minRechargeAmount: number;
  /** 最大充值金额 */
  maxRechargeAmount: number;
  /** 最小提现金额（旧字段，兼容） */
  minWithdrawAmount: number;
  /** 每日最大提现次数 */
  maxWithdrawTimesPerDay: number;
  /** 邀请返佣百分比 */
  inviteCommissionPercent: number;
  /** 充值预设档位 */
  rechargePresets?: number[];
  /** 充值最小金额 */
  rechargeMinAmount?: string;
  /** 充值最大金额 */
  rechargeMaxAmount?: string;
  /** 最大待支付订单数 */
  rechargeMaxPending?: number;
  /** 充值订单超时时间（分钟） */
  rechargeTimeoutMinutes?: number;
  /** 充值页提示文案 */
  rechargePageTips?: string;
  /** 提现页提示文案 */
  withdrawPageTips?: string;
  /** 是否启用资金流水时间筛选 - 依据：03.9.1-资金明细页.md 2.2节 */
  transactionTimeFilterEnabled?: boolean;
  /** 最大绑卡数量 */
  maxBindcardCount?: number;
  /** 密码最小长度 */
  passwordMinLength?: number;
  /** 密码最大长度 */
  passwordMaxLength?: number;
  /** 密码是否要求包含字母 */
  passwordRequireLetter?: boolean;
  /** 密码是否要求包含数字 */
  passwordRequireNumber?: boolean;
  /** 是否显示密码强度指示器 */
  passwordShowStrength?: boolean;
  /** 头像最大尺寸（KB） */
  avatarMaxSize?: number;
  /** 昵称最大长度 */
  nicknameMaxLength?: number;
  /** 昵称最小长度 */
  nicknameMinLength?: number;
  /** 心跳上报间隔（秒） */
  heartbeatInterval?: number;

  // === 提现扩展配置 ===
  /** 每日提现次数限制 */
  withdrawLimitDaily?: number;
  /** 提现快捷金额选项 */
  withdrawQuickAmounts?: number[];

  // === 注册与签到 ===
  /** 每日签到奖励金额 */
  signinDailyReward?: number;

  // === 返佣配置 ===
  /** 一级返佣比例 (%) */
  commissionLevel1Rate?: number;
  /** 二级返佣比例 (%) */
  commissionLevel2Rate?: number;
  /** 三级返佣比例 (%) */
  commissionLevel3Rate?: number;

  // === 客服配置 ===
  /** 客服服务时间 */
  serviceTimeRange?: string;

  // === 功能开关 ===
  /** SVIP 奖励是否启用 */
  svipRewardEnabled?: boolean;
  /** 周薪功能是否启用 */
  weeklySalaryEnabled?: boolean;
  /** 奖池功能是否启用 */
  prizePoolEnabled?: boolean;
  /** 转盘功能是否启用 */
  spinWheelEnabled?: boolean;
  /** 社区功能是否启用 */
  communityEnabled?: boolean;
  /** 理财产品功能是否启用 */
  financialProductEnabled?: boolean;

  /** 配置版本号 */
  version: number;
  /** 配置更新时间 */
  updatedAt?: string;
}

// ========================================
// 用户相关类型
// ========================================

/**
 * 用户信息
 */
export interface User {
  /** 用户ID */
  id: number;
  /** 手机号 */
  phone: string;
  /** 昵称 */
  nickname: string | null;
  /** 头像URL */
  avatar: string | null;
  /** 可用余额 */
  availableBalance: string;
  /** 冻结余额 */
  frozenBalance: string;
  /** 累计收益（可选，需通过API单独获取） */
  totalEarnings?: string;
  /** 累计充值（可选，需通过API单独获取） */
  totalRecharge?: string;
  /** 累计提现（可选，需通过API单独获取） */
  totalWithdraw?: string;
  /** 邀请码 */
  inviteCode: string;
  /** VIP等级 */
  vipLevel: number;
  /** SVIP等级 */
  svipLevel: number;
  /** 是否完成首购 */
  firstPurchaseDone: boolean;
  /** 用户状态 */
  status: 'ACTIVE' | 'BANNED';
  /** 注册时间 */
  createdAt: string;
}

/**
 * 用户VIP信息
 */
export interface UserVipInfo {
  /** 当前VIP等级 */
  level: number;
  /** VIP等级名称 */
  name: string;
  /** 升级所需购买金额 */
  upgradeRequiredAmount: number;
  /** 当前已购买金额 */
  currentPurchaseAmount: number;
}

// ========================================
// 产品相关类型
// ========================================

/**
 * 产品类型
 * TRIAL - 体验产品（不触发返佣）
 * PAID - 付费产品（VIC/NWS/QLD 系列，触发首购返佣）
 * FINANCIAL - 理财产品（到期返本金+利息，触发首购返佣）
 */
export type ProductType = 'TRIAL' | 'PAID' | 'FINANCIAL';

/**
 * 产品系列
 * PO - Po系列（旧，兼容）
 * VIP - VIP系列（旧，兼容）
 * VIC - VIC系列（无限购）
 * NWS - NWS系列（全局库存+个人限购）
 * QLD - QLD系列（全局库存+个人限购）
 * FINANCIAL - 理财系列（个人限购5份）
 */
export type ProductSeries = 'PO' | 'VIP' | 'VIC' | 'NWS' | 'QLD' | 'FINANCIAL';

/**
 * 产品销售状态
 * OPEN - 正常销售
 * COMING_SOON - 即将推出
 */
export type ProductSaleStatus = 'OPEN' | 'COMING_SOON';

/**
 * 产品锁定原因
 */
export type ProductLockReason = 'VIP_REQUIRED' | 'ALREADY_PURCHASED' | 'STOCK_EXHAUSTED' | null;

/**
 * 产品信息
 * @description 依据：02.3-前端API接口清单.md 第4.2节
 */
export interface Product {
  /** 产品ID - API请求使用 */
  id: number;
  /** 产品编码 - 仅后台识别，禁止用于业务判断 */
  code: string;
  /** 产品名称 - 前端显示 */
  name: string;
  /** 产品类型（用于业务判断）：TRIAL=体验 | PAID=付费 | FINANCIAL=理财 */
  type: ProductType;
  /** 产品系列（用于业务判断）：VIC/NWS/QLD/FINANCIAL */
  series: ProductSeries;
  /** 产品价格（Decimal字符串） */
  price: string;
  /** 日收益（Decimal字符串） */
  dailyIncome: string;
  /** 周期天数 */
  cycleDays: number;
  /** 总收益（Decimal字符串） */
  totalIncome: string;
  /** 购买后赠送VIP等级 */
  grantVipLevel: number;
  /** 购买后赠送SVIP等级 */
  grantSvipLevel: number;
  /** 购买所需VIP等级 */
  requireVipLevel: number;
  /** 限购数量（遗留字段，仅向后兼容） */
  purchaseLimit: number;
  /** 单用户限购数量（null=不限购） */
  userPurchaseLimit?: number | null;
  /** 前端显示的限购数（null=不显示） */
  displayUserLimit?: number | null;
  /** 全局库存（null=不限） */
  globalStock?: number | null;
  /** 全局剩余库存 */
  globalStockRemaining?: number | null;
  /** 产品主图URL */
  mainImage: string | null;
  /** 产品详情图列表（可选） */
  detailImages?: string[];
  /** 富文本详情内容（可选） */
  detailContent?: string;
  /** 是否显示推荐角标 */
  showRecommendBadge: boolean;
  /** 自定义角标文案 */
  customBadgeText: string | null;
  /** 状态：ACTIVE=上架 | INACTIVE=下架 */
  status: 'ACTIVE' | 'INACTIVE';
  /** 是否已购买 */
  purchased: boolean;
  /** 是否可购买 */
  canPurchase: boolean;
  /** 锁定原因 */
  lockReason: ProductLockReason;
  /** 产品销售状态：OPEN=正常销售 | COMING_SOON=即将推出 */
  productStatus?: ProductSaleStatus;
  
  // === 兼容旧字段名（渐进迁移） ===
  /** @deprecated 使用 mainImage */
  image?: string;
  /** @deprecated 使用 dailyIncome */
  dailyRate?: string;
  /** @deprecated 使用 totalIncome */
  totalReturn?: string;
  /** @deprecated 使用 requireVipLevel */
  requiredVipLevel?: number;
  /** @deprecated 使用 status === 'ACTIVE' */
  isActive?: boolean;
  /** 产品描述 */
  description?: string;
  /** 排序权重 */
  sortOrder?: number;
}

// ========================================
// 持仓相关类型
// ========================================

/**
 * 持仓状态
 */
export type PositionStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

/**
 * 持仓信息
 */
export interface Position {
  /** 持仓ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 产品信息 */
  product: Product;
  /** 购买金额 */
  amount: string;
  /** 日收益率 */
  dailyRate: string;
  /** 每日收益金额 */
  dailyIncome: string;
  /** 已获收益 */
  earnedIncome: string;
  /** 预计总收益 */
  expectedTotalIncome: string;
  /** 收益周期（天） */
  cycleDays: number;
  /** 已完成天数 */
  completedDays: number;
  /** 持仓状态 */
  status: PositionStatus;
  /** 购买时间 */
  createdAt: string;
  /** 到期时间 */
  expireAt: string;
}

// ========================================
// 订单相关类型
// ========================================

/**
 * 充值订单状态
 */
export type RechargeStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';

/**
 * 充值订单
 */
export interface RechargeOrder {
  /** 订单ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 充值金额 */
  amount: string;
  /** 支付通道 */
  payChannel: string;
  /** 订单状态 */
  status: RechargeStatus;
  /** 支付链接 */
  payUrl: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt: string | null;
}

/**
 * 提现订单状态
 */
export type WithdrawStatus = 'PENDING_REVIEW' | 'APPROVED' | 'PAYOUT_FAILED' | 'COMPLETED' | 'FAILED' | 'REJECTED';

/**
 * 提现订单
 */
export interface WithdrawOrder {
  /** 订单ID */
  id: number;
  /** 订单号 */
  orderNo: string;
  /** 提现金额 */
  amount: string;
  /** 手续费 */
  fee: string;
  /** 实际到账金额 */
  actualAmount: string;
  /** 银行卡信息 */
  bankCard: BankCard;
  /** 订单状态 */
  status: WithdrawStatus;
  /** 审核备注 */
  remark: string | null;
  /** 创建时间 */
  createdAt: string;
  /** 完成时间 */
  completedAt: string | null;
}

// ========================================
// 银行卡相关类型
// ========================================

/**
 * 银行卡信息
 */
export interface BankCard {
  /** 银行卡ID */
  id: number;
  /** 银行名称 */
  bankName: string;
  /** 银行代码 */
  bankCode: string;
  /** 卡号 */
  cardNumber: string;
  /** 持卡人姓名 */
  holderName: string;
  /** 是否默认卡 */
  isDefault: boolean;
}

// ========================================
// 文案配置类型
// ========================================

/**
 * 文案配置键值对
 */
export interface TextConfig {
  [key: string]: string;
}

/**
 * 文案 API 响应结构
 * @description GET /api/texts 返回的完整结构
 */
export interface TextsApiResponse {
  /** 版本号 */
  version: number;
  /** 最后更新时间 */
  updatedAt: string;
  /** 文案键值对 */
  texts: TextConfig;
}

// ========================================
// SVIP 类型
// ========================================

/**
 * SVIP 等级资格
 * @description GET /api/svip/status 中的单个资格项
 */
export interface SvipQualification {
  productId: number;
  productCode: string;
  svipLevel: number;
  dailyReward: string;
  activeCount: number;
  requiredCount: number;
  /** 今日是否已领取 */
  claimedToday: boolean;
}

/**
 * SVIP 状态响应
 * @description GET /api/svip/status 完整响应（含领取状态）
 */
export interface SvipStatusResponse {
  currentMaxLevel: number;
  qualifications: SvipQualification[];
  totalDailyReward: string;
  /** 今日已领金额 */
  todayClaimedAmount: string;
  /** 今日未领金额 */
  todayUnclaimedAmount: string;
  /** 今日是否还可领取 */
  canClaimToday: boolean;
}

/**
 * SVIP 领取响应
 * @description POST /api/svip/claim 响应
 */
export interface SvipClaimResponse {
  claimedRewards: { svipLevel: number; productCode: string; amount: string }[];
  totalAmount: string;
  newBalance: string;
}

/**
 * SVIP 奖励记录
 * @description GET /api/svip/rewards 中的单条记录
 */
export interface SvipRewardRecord {
  id: number;
  svipLevel: number;
  amount: string;
  rewardDate: string;
  status: string;
  productName: string;
  productCode: string;
  createdAt: string;
}

/**
 * SVIP 奖励历史响应
 */
export interface SvipRewardsResponse {
  list: SvipRewardRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// 动画配置类型
// ========================================

/**
 * 动画配置
 */
export interface AnimationConfig {
  /** 是否启用动画 */
  enabled: boolean;
  /** 弹簧刚度 */
  stiffness: number;
  /** 弹簧阻尼 */
  damping: number;
  /** 弹簧质量 */
  mass: number;
  /** 持续时间倍数 */
  durationMultiplier: number;
}

// ========================================
// API 响应类型
// ========================================

/**
 * API 成功响应
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API 错误响应
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * API 响应联合类型
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * 分页数据
 */
export interface PaginatedData<T> {
  list: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 分页响应
 */
export type PaginatedResponse<T> = ApiSuccessResponse<PaginatedData<T>>;

// ========================================
// 首页配置类型
// ========================================

/**
 * 轮播图
 */
export interface Banner {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
}

/**
 * 公告
 */
export interface Announcement {
  id: number;
  content: string;
  isActive: boolean;
}

/**
 * 首页配置
 */
export interface HomeConfig {
  banners: Banner[];
  announcement: Announcement | null;
  products: Product[];
}

// ========================================
// 邀请相关类型
// ========================================

/**
 * 邀请信息
 */
export interface InviteInfo {
  /** 邀请码 */
  inviteCode: string;
  /** 邀请链接 */
  inviteLink: string;
  /** 已邀请人数 */
  inviteCount: number;
  /** 已获返佣 */
  totalCommission: string;
}

/**
 * 被邀请人信息
 */
export interface Invitee {
  /** 用户ID */
  id: number;
  /** 手机号（脱敏） */
  phone: string;
  /** 昵称 */
  nickname: string | null;
  /** 注册时间 */
  createdAt: string;
  /** 是否已产生返佣 */
  hasCommission: boolean;
}

// ========================================
// 流水记录类型
// ========================================

/**
 * 流水类型
 * 依据：02.1-数据库设计.md 2.5节 TransactionType 枚举
 * 依据：02.3-前端API接口清单.md 9.1节
 */
export type TransactionType = 
  | 'RECHARGE'              // 充值
  | 'WITHDRAW_FREEZE'       // 提现冻结
  | 'WITHDRAW_SUCCESS'      // 提现成功
  | 'WITHDRAW_REFUND'       // 提现退回
  | 'PURCHASE'              // 购买产品
  | 'INCOME'                // 收益到账
  | 'REFERRAL_COMMISSION'   // 推荐返佣
  | 'SIGN_IN'               // 签到奖励
  | 'ACTIVITY_REWARD'       // 活动奖励
  | 'REGISTER_BONUS'        // 注册奖励
  | 'ADMIN_ADD'             // 后台增加
  | 'ADMIN_DEDUCT'          // 后台扣减
  | 'SVIP_DAILY_REWARD'     // SVIP每日奖励
  | 'WEEKLY_SALARY'         // 周薪奖励
  | 'PRIZE_POOL'            // 奖池奖励
  | 'SPIN_WHEEL'            // 转盘奖励
  | 'FINANCIAL_PRINCIPAL'   // 理财产品本金返还
  | 'COMMUNITY_REWARD'      // 社区凭证奖励
  | 'GIFT_CODE';            // 礼品码兑换

/**
 * 流水记录
 */
export interface Transaction {
  /** 流水ID */
  id: number;
  /** 流水类型 */
  type: TransactionType;
  /** 金额（正数为收入，负数为支出） */
  amount: string;
  /** 交易后余额 */
  balanceAfter: string;
  /** 备注（对应数据库 remark 字段） */
  remark: string;
  /** 关联订单号 */
  relatedOrderNo: string | null;
  /** 创建时间 */
  createdAt: string;
}

// ========================================
// 活动相关类型
// ========================================

/**
 * 活动数据结构
 * @description 依据：开发文档.md 第9节 - Activity 表结构 + 02.3-前端API接口清单 第11.1节
 */
export interface Activity {
  /** 活动标识码 */
  code: string;
  /** 活动名称（后台配置） */
  name: string;
  /** 活动描述（后台配置） */
  description: string;
  /** 图标URL（后台配置） */
  icon: string;
  /** 是否启用 */
  isActive: boolean;
  /** 是否有可领取奖励（用于红点提示） */
  hasClaimable: boolean;
  /** 排序权重（数字越小越靠前） */
  sortOrder: number;
}

/**
 * 活动列表响应
 * @description 依据：02.3-前端API接口清单 第11.1节
 */
export interface ActivitiesResponse {
  list: Activity[];
}

// ========================================
// 活动模块类型导出
// ========================================

export * from './activity';
