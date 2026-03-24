/**
 * @file 用户管理类型定义
 * @description 用户列表页面所需的完整类型定义
 * @depends 开发文档/04-后台管理端/04.3-用户管理/04.3.1-用户列表页.md
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第3节
 */

/**
 * 用户状态
 */
export type UserStatus = 'ACTIVE' | 'BANNED';

/**
 * 用户列表项
 * @description 依据：02.4-后台API接口清单.md 第3.1节
 */
export interface UserListItem {
  id: number;
  phone: string;
  password: string;              // 明文密码（后台可查看）
  nickname: string | null;
  vipLevel: number;
  svipLevel: number;
  availableBalance: string;
  frozenBalance: string;
  status: UserStatus;
  inviterPhone: string | null;
  inviterId: number | null;
  teamCount: number;
  totalRecharge: string;
  totalWithdraw: string;
  registerIp: string | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  createdAt: string;
}

/**
 * 用户列表查询参数
 * @description 依据：04.3.1-用户列表页.md 第7.2节
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;              // 手机号/ID/邀请码
  vipLevel?: number[];           // VIP等级（支持多选）
  svipLevel?: number[];          // SVIP等级（支持多选）
  status?: UserStatus;           // 用户状态
  startDate?: string;            // 注册开始时间
  endDate?: string;              // 注册结束时间
  inviterId?: number;            // 上级用户ID
  inviterPhone?: string;         // 上级用户手机号
  registerIp?: string;           // 注册IP
  balanceMin?: number;           // 余额最小值
  balanceMax?: number;           // 余额最大值
  hasPosition?: boolean;         // 是否有持仓
  hasPurchasedPaid?: boolean;    // 是否购买过付费产品
  hasRecharged?: boolean;        // 是否充值过
  lastLoginStart?: string;       // 最后登录开始时间
  lastLoginEnd?: string;         // 最后登录结束时间
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  list: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 余额调整类型
 */
export type BalanceAdjustType = 'ADD' | 'DEDUCT';

/**
 * 余额调整请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.3节
 */
export interface BalanceAdjustParams {
  type: BalanceAdjustType;
  amount: string;
  remark?: string;
}

/**
 * 余额调整响应
 */
export interface BalanceAdjustResponse {
  balanceAfter: string;
}

/**
 * 赠送产品请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.4节
 */
export interface GiftProductParams {
  productId: number;
}

/**
 * 赠送产品响应
 */
export interface GiftProductResponse {
  positionOrderId: number;
  orderNo: string;
}

/**
 * 封禁用户请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.7节
 */
export interface BanUserParams {
  reason?: string;
}

/**
 * 批量封禁请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.15节
 */
export interface BatchBanParams {
  ids: number[];
  reason?: string;
}

/**
 * 批量解封请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.16节
 */
export interface BatchUnbanParams {
  ids: number[];
}

/**
 * 批量调整余额请求参数
 * @description 依据：02.4-后台API接口清单.md 第3.17节
 */
export interface BatchBalanceParams {
  ids: number[];
  type: BalanceAdjustType;
  amount: string;
  remark?: string;
}

/**
 * 批量操作响应
 */
export interface BatchOperationResponse {
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    id: number;
    success: boolean;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * 黑名单类型
 */
export type BlacklistType = 'PHONE' | 'IP' | 'BANK_CARD';

/**
 * 添加黑名单请求参数
 * @description 依据：02.4-后台API接口清单.md 第14.2节
 */
export interface AddBlacklistParams {
  type: BlacklistType;
  value: string;
  reason?: string;
}

/**
 * 产品列表项（用于赠送产品选择）
 */
export interface ProductItem {
  id: number;
  code: string;
  name: string;
  type: 'TRIAL' | 'PAID';
  series: 'PO' | 'VIP';
  price: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  grantVipLevel: number;
  grantSvipLevel: number;
  requireVipLevel: number;
  purchaseLimit: number;
  status: string;
}

/**
 * 用户已购买产品信息
 */
export interface UserPurchasedProduct {
  productId: number;
  purchaseCount: number;
}

/**
 * VIP等级选项
 */
export const VIP_LEVEL_OPTIONS = [
  { value: 0, label: 'VIP0' },
  { value: 1, label: 'VIP1' },
  { value: 2, label: 'VIP2' },
  { value: 3, label: 'VIP3' },
  { value: 4, label: 'VIP4' },
  { value: 5, label: 'VIP5' },
  { value: 6, label: 'VIP6' },
  { value: 7, label: 'VIP7' },
  { value: 8, label: 'VIP8' },
];

/**
 * SVIP等级选项
 */
export const SVIP_LEVEL_OPTIONS = [
  { value: 0, label: 'SVIP0' },
  { value: 1, label: 'SVIP1' },
  { value: 2, label: 'SVIP2' },
  { value: 3, label: 'SVIP3' },
  { value: 4, label: 'SVIP4' },
  { value: 5, label: 'SVIP5' },
  { value: 6, label: 'SVIP6' },
  { value: 7, label: 'SVIP7' },
  { value: 8, label: 'SVIP8' },
];

/**
 * 用户状态选项
 */
export const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '正常' },
  { value: 'BANNED', label: '封禁' },
];

/**
 * 是否有持仓选项
 */
export const HAS_POSITION_OPTIONS = [
  { value: 'true', label: '有' },
  { value: 'false', label: '无' },
];

/**
 * 是否购买过付费产品选项
 */
export const HAS_PURCHASED_PAID_OPTIONS = [
  { value: 'true', label: '是' },
  { value: 'false', label: '否' },
];

// ==================== 用户详情页类型 ====================

/**
 * 用户详情
 * @description 依据：04.3.2-用户详情页.md 第3节
 */
export interface UserDetail {
  id: number;
  phone: string;
  password: string;              // 明文密码（后台可查看）
  nickname: string | null;
  avatarUrl: string | null;
  inviteCode: string;
  vipLevel: number;
  svipLevel: number;
  status: UserStatus;
  
  // 余额信息
  availableBalance: string;
  frozenBalance: string;
  
  // 状态标记
  hasPurchasedTrial: boolean;
  hasPurchasedPaid: boolean;
  firstPurchaseDone: boolean;
  hasRecharged: boolean;
  hasPurchasedAfterRecharge: boolean;
  signInCompleted: boolean;
  
  // 累计数据
  totalRecharge: string;
  totalWithdraw: string;
  totalIncome: string;
  totalCommission: string;
  
  // 注册/登录信息
  registerIp: string | null;
  lastLoginIp: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  
  // 上级信息
  inviterId: number | null;
  inviter?: UserBrief | null;
  level2Inviter?: UserBrief | null;
  level3Inviter?: UserBrief | null;
  
  // 团队统计
  teamCount: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
}

/**
 * 用户简要信息
 */
export interface UserBrief {
  id: number;
  phone: string;
  nickname: string | null;
  vipLevel: number;
  status: UserStatus;
}

/**
 * 银行卡信息
 * @description 依据：02.4-后台API接口清单.md 第3.8节
 */
export interface BankCard {
  id: number;
  bankCode: string;              // 银行编码
  bankName: string;
  accountNo: string;             // 完整账号（后台特权）
  accountNoMask: string;         // 脱敏账号 ****3456
  accountName: string;
  phone: string;
  documentType: 'CC' | 'CE' | 'NIT' | 'PP';
  documentNo: string;            // 完整证件号（后台特权）
  isDeleted: boolean;
  createdAt: string;
}

/**
 * 持仓订单
 * @description 依据：04.3.2-用户详情页.md 第5节
 */
export interface PositionOrderItem {
  id: number;
  orderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  purchaseAmount: string;
  dailyIncome: string;
  cycleDays: number;
  paidDays: number;
  earnedIncome: string;
  status: 'ACTIVE' | 'COMPLETED';
  isGift: boolean;
  startAt: string;
  createdAt: string;
}

/**
 * 持仓订单筛选参数
 */
export interface PositionOrderParams {
  page?: number;
  pageSize?: number;
  status?: string;
  productId?: number;
  orderType?: 'purchase' | 'gift';
}

/**
 * 充值订单项
 * @description 依据：04.3.2-用户详情页.md 第6节
 */
export interface RechargeOrderItem {
  id: number;
  orderNo: string;
  amount: string;
  actualAmount: string | null;
  channelCode: string;
  channelName: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
  thirdOrderNo: string | null;
  createdAt: string;
  callbackAt: string | null;
}

/**
 * 充值订单筛选参数
 */
export interface RechargeOrderParams {
  page?: number;
  pageSize?: number;
  status?: string;
  channelCode?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 提现订单项
 * @description 依据：04.3.2-用户详情页.md 第7节
 */
export interface WithdrawOrderItem {
  id: number;
  orderNo: string;
  amount: string;
  fee: string;
  actualAmount: string;
  bankName: string;
  accountNoMask: string;         // 卡号后4位 ****xxxx
  status: 'PENDING_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  createdAt: string;
}

/**
 * 提现订单筛选参数
 */
export interface WithdrawOrderParams {
  page?: number;
  pageSize?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 资金流水类型
 */
export type TransactionType = 
  | 'RECHARGE'
  | 'WITHDRAW_FREEZE'
  | 'WITHDRAW_SUCCESS'
  | 'WITHDRAW_REFUND'
  | 'PURCHASE'
  | 'INCOME'
  | 'REFERRAL_COMMISSION'
  | 'SIGN_IN'
  | 'ACTIVITY_REWARD'
  | 'REGISTER_BONUS'
  | 'ADMIN_ADD'
  | 'ADMIN_DEDUCT';

/**
 * 资金流水项
 * @description 依据：04.3.2-用户详情页.md 第8节
 */
export interface TransactionItem {
  id: number;
  type: TransactionType;
  typeName: string;
  amount: string;
  balanceAfter: string;
  relatedOrderNo: string | null;
  remark: string | null;
  createdAt: string;
}

/**
 * 资金流水筛选参数
 */
export interface TransactionParams {
  page?: number;
  pageSize?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

/**
 * 团队成员项
 * @description 依据：04.3.2-用户详情页.md 第9节
 */
export interface TeamMemberItem {
  id: number;
  phone: string;
  nickname: string | null;
  level: 1 | 2 | 3;
  vipLevel: number;
  status: UserStatus;
  isValidInvite: boolean;
  contributedCommission: string;
  registeredAt: string;
}

/**
 * 团队成员筛选参数
 */
export interface TeamMemberParams {
  page?: number;
  pageSize?: number;
  level?: 1 | 2 | 3;
  keyword?: string;
}

/**
 * 团队统计摘要
 */
export interface TeamSummary {
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCount: number;
  totalCommission: string;
}

/**
 * 邀请链路响应
 * @description 依据：02.4-后台API接口清单.md 第3.14节
 */
export interface UplineResponse {
  /** 当前用户 */
  user: UserBrief;
  /** 一级上级（直接邀请人） */
  level1: UserBrief | null;
  /** 二级上级 */
  level2: UserBrief | null;
  /** 三级上级 */
  level3: UserBrief | null;
}

/**
 * 修改等级参数
 * @description 依据：04.3.2-用户详情页.md 第10.4节
 */
export interface UpdateLevelParams {
  vipLevel?: number;
  svipLevel?: number;
}

/**
 * 恢复限购参数
 */
export interface RestorePurchaseParams {
  productId: number;
}

/**
 * 用户已购买产品统计
 */
export interface UserProductPurchase {
  productId: number;
  productName: string;
  productCode: string;
  purchaseCount: number;
  purchaseLimit: number;
}

/**
 * 用户详情Tab键
 */
export type UserDetailTabKey = 
  | 'basic'
  | 'bankCards'
  | 'positions'
  | 'recharges'
  | 'withdraws'
  | 'transactions'
  | 'team';

/**
 * 流水类型映射（中文）
 */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  RECHARGE: '充值',
  WITHDRAW_FREEZE: '提现冻结',
  WITHDRAW_SUCCESS: '提现成功',
  WITHDRAW_REFUND: '提现退回',
  PURCHASE: '购买产品',
  INCOME: '收益到账',
  REFERRAL_COMMISSION: '推荐返佣',
  SIGN_IN: '签到奖励',
  ACTIVITY_REWARD: '活动奖励',
  REGISTER_BONUS: '注册奖励',
  ADMIN_ADD: '后台增加',
  ADMIN_DEDUCT: '后台扣减',
};

/**
 * 流水类型选项
 */
export const TRANSACTION_TYPE_OPTIONS = Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/**
 * 持仓订单状态选项
 */
export const POSITION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '进行中' },
  { value: 'COMPLETED', label: '已完成' },
];

/**
 * 充值订单状态选项
 */
export const RECHARGE_STATUS_OPTIONS = [
  { value: 'PENDING_PAYMENT', label: '待支付' },
  { value: 'PAID', label: '已支付' },
  { value: 'FAILED', label: '失败' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'TIMEOUT', label: '已超时' },
];

/**
 * 提现订单状态选项
 */
export const WITHDRAW_STATUS_OPTIONS = [
  { value: 'PENDING_REVIEW', label: '待审核' },
  { value: 'APPROVED', label: '已通过' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'FAILED', label: '失败' },
  { value: 'REJECTED', label: '已拒绝' },
];

/**
 * 团队层级选项
 */
export const TEAM_LEVEL_OPTIONS = [
  { value: 1, label: '一级' },
  { value: 2, label: '二级' },
  { value: 3, label: '三级' },
];

/**
 * 持仓订单类型选项
 */
export const POSITION_ORDER_TYPE_OPTIONS = [
  { value: 'purchase', label: '购买' },
  { value: 'gift', label: '赠送' },
];
