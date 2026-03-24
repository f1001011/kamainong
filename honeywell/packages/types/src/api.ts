/**
 * API 请求/响应类型定义
 */

// 统一响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

// 分页参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[];
  pagination: PaginationInfo;
}

// 认证相关
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    phone: string;
    vipLevel: number;
    svipLevel: number;
    availableBalance: string;
    inviteCode: string;
  };
}

export interface RegisterRequest {
  phone: string;
  password: string;
  confirmPassword: string;
  inviteCode?: string;
}

// 用户相关
export interface UserProfile {
  id: number;
  phone: string;
  phoneMask: string;
  vipLevel: number;
  svipLevel: number;
  availableBalance: string;
  frozenBalance: string;
  inviteCode: string;
  signInCurrentStreak: number;
  signInCompleted: boolean;
  hasPurchasedPo0: boolean;
  hasOtherPurchase: boolean;
  hasPurchasedPaid: boolean;
  hasRecharged: boolean;
  createdAt: string;
}

// 产品相关
export interface ProductItem {
  id: number;
  code: string;
  name: string;
  type: string;
  series: string;
  price: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  annualRate: string;
  requireVipLevel: number | null;
  globalStock: number | null;
  globalSold: number;
  userPurchaseLimit: number | null;
  displayUserLimit: number | null;
  svipDailyReward: string | null;
  svipRequireCount: number | null;
  returnPrincipal: boolean;
  productStatus: string;
  description: string | null;
  imageUrl: string | null;
}

// 产品库存信息
export interface ProductStockInfo {
  userLimit: number | null;
  globalStock: number | null;
  globalRemaining: number;
  userPurchased: number;
  userRemaining: number;
}

// SVIP状态
export interface SvipQualification {
  productId: number;
  productCode: string;
  svipLevel: number;
  dailyReward: string;
  activeCount: number;
  requiredCount: number;
}

export interface SvipStatusResponse {
  currentMaxLevel: number;
  qualifications: SvipQualification[];
  totalDailyReward: string;
}

// 周薪奖励
export interface WeeklySalaryStatus {
  teamRecharge: string;
  currentTier: { minRecharge: string; rewardAmount: string } | null;
  allTiers: { minRecharge: string; rewardAmount: string }[];
  claimed: boolean;
  weekStart: string;
  weekEnd: string;
}

// 奖池
export interface PrizePoolStatus {
  dailyTotal: string;
  remainToday: string;
  tiers: { id: number; requiredInvites: number; rewardAmount: string; claimed: boolean; qualified: boolean }[];
  validInviteCount: number;
}

// 转盘
export interface SpinChanceInfo {
  totalChances: number;
  usedChances: number;
  remainingChances: number;
  maxDaily: number;
}

export interface SpinResult {
  prize: { id: number; name: string; amount: string };
  isWin: boolean;
}

// 社区帖子
export interface CommunityPostItem {
  id: number;
  userId: number;
  userNickname: string | null;
  userAvatar: string | null;
  withdrawAmount: string | null;
  platformImage: string | null;
  receiptImage: string | null;
  content: string | null;
  status: string;
  rewardAmount: string | null;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface CommunityCommentItem {
  id: number;
  userId: number;
  userNickname: string | null;
  content: string;
  createdAt: string;
}

// 充值相关
export interface RechargeChannelItem {
  code: string;
  name: string;
  minAmount: string | null;
  maxAmount: string | null;
}

export interface CreateRechargeRequest {
  amount: number;
  channelCode: string;
}

export interface CreateRechargeResponse {
  orderNo: string;
  payUrl: string;
}

// 提现相关
export interface WithdrawCheckResponse {
  canWithdraw: boolean;
  reason?: string;
  todayCount: number;
  dailyLimit: number;
  minAmount: string;
  maxAmount: string;
  feePercent: string;
  timeRange: string;
}

export interface CreateWithdrawRequest {
  amount: number;
  bankCardId: number;
}

// 银行卡相关
export interface BankCardItem {
  id: number;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNoMask: string;
  isDefault: boolean;
}

export interface AddBankCardRequest {
  bankCode: string;
  accountName: string;
  accountNo: string;
  documentType?: string;
  documentNo?: string;
  accountType?: string;
  cciCode?: string;
}

// 持仓相关
export interface PositionItem {
  id: number;
  orderNo: string;
  productId: number;
  productName: string;
  productCode: string;
  purchaseAmount: string;
  dailyIncome: string;
  cycleDays: number;
  totalIncome: string;
  paidDays: number;
  earnedIncome: string;
  status: string;
  startAt: string;
  nextSettleAt: string;
}

// 资金流水相关
export interface TransactionItem {
  id: number;
  type: string;
  amount: string;
  balanceAfter: string;
  relatedOrderNo: string | null;
  remark: string | null;
  createdAt: string;
}

// 签到相关（简化：所有用户每日100 COP）
export interface SignInStatus {
  canSignIn: boolean;
  todayReward: string | null;
  lastSignInAt: string | null;
  isWindowExpired?: boolean;
  currentStreak?: number;
  isCompleted?: boolean;
  windowDaysLeft?: number | null;
}

// 团队相关
export interface TeamStats {
  totalMembers: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalCommission: string;
  todayCommission: string;
}

// 配置相关
export interface GlobalConfigResponse {
  siteName: string;
  siteDomain: string;
  siteLogoUrl: string | null;
  currencySymbol: string;
  currencySpace: boolean;
  phoneAreaCode: string;
  systemTimezone: string;
  version: number;
  updatedAt: string;
}

export interface TextsResponse {
  version: number;
  updatedAt: string;
  texts: Record<string, string>;
}
