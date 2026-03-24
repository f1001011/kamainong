/**
 * 数据库模型类型（与 Prisma Schema 对应）
 * 用于业务逻辑中的类型标注
 */

import { Decimal } from 'decimal.js';

// ================================
// 用户相关类型
// ================================

export interface User {
  id: number;
  phone: string;
  password: string;
  nickname: string | null;
  avatar: string | null;
  inviteCode: string;
  inviterId: number | null;
  level2InviterId: number | null;
  level3InviterId: number | null;
  vipLevel: number;
  svipLevel: number;
  availableBalance: Decimal;
  frozenBalance: Decimal;
  signInWindowStart: Date | null;
  signInWindowExpired: boolean;
  signInCurrentStreak: number;
  signInMaxStreak: number;
  signInCompleted: boolean;
  lastSignInDate: Date | null;
  hasPurchasedAfterRecharge: boolean;
  firstPurchaseDone: boolean;
  hasPurchasedPo0: boolean;
  hasPurchasedOther: boolean;
  hasRecharged: boolean;
  hasPurchasedPaid: boolean;
  status: UserStatus;
  registerIp: string | null;
  lastLoginIp: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'ACTIVE' | 'BANNED';

export interface BankCard {
  id: number;
  userId: number;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNo: string;
  accountNoMask: string;
  documentType: string | null;
  documentNo: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// 产品相关类型
// ================================

export interface Product {
  id: number;
  code: string;
  name: string;
  type: ProductType;
  series: ProductSeries;
  price: Decimal;
  dailyIncome: Decimal;
  cycleDays: number;
  totalIncome: Decimal;
  requireVipLevel: number | null;
  grantVipLevel: number | null;
  grantSvipLevel: number | null;
  purchaseLimit: number;
  globalStock: number | null;
  globalSold: number;
  userPurchaseLimit: number | null;
  displayUserLimit: number | null;
  svipDailyReward: Decimal | null;
  svipRequireCount: number | null;
  returnPrincipal: boolean;
  productStatus: string;
  detailContent: string | null;
  mainImage: string | null;
  detailImages: unknown | null;
  showRecommendBadge: boolean;
  customBadgeText: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductType = 'TRIAL' | 'PAID' | 'FINANCIAL';
export type ProductSeries = 'PO' | 'VIP' | 'VIC' | 'NWS' | 'QLD' | 'FINANCIAL';

// ================================
// 订单相关类型
// ================================

export interface RechargeOrder {
  id: number;
  orderNo: string;
  userId: number;
  channelId: number;
  thirdOrderNo: string | null;
  amount: Decimal;
  actualAmount: Decimal | null;
  payUrl: string | null;
  status: RechargeStatus;
  expireAt: Date | null;
  paidAt: Date | null;
  callbackData: unknown | null;
  callbackAt: Date | null;
  createIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RechargeStatus = 'PENDING_PAYMENT' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface WithdrawOrder {
  id: number;
  orderNo: string;
  userId: number;
  bankCardId: number;
  channelId: number | null;
  channelOrderNo: string | null;
  thirdOrderNo: string | null;
  amount: Decimal;
  fee: Decimal;
  actualAmount: Decimal;
  status: WithdrawStatus;
  isAutoApproved: boolean;
  autoApproveReason: string | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  reviewRemark: string | null;
  paidAt: Date | null;
  callbackData: unknown | null;
  callbackAt: Date | null;
  rejectReason: string | null;
  bankCardSnapshot: unknown | null;
  retryCount: number;
  payoutFailReason: string | null;
  payoutAttempts: unknown | null;
  createIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WithdrawStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'PAYOUT_FAILED'
  | 'COMPLETED'
  | 'FAILED'
  | 'REJECTED';

export interface PositionOrder {
  id: number;
  orderNo: string;
  userId: number;
  productId: number;
  purchaseAmount: Decimal;
  dailyIncome: Decimal;
  cycleDays: number;
  totalIncome: Decimal;
  paidDays: number;
  earnedIncome: Decimal;
  isGift: boolean;
  giftedBy: number | null;
  principalReturned: boolean;
  status: PositionStatus;
  startAt: Date;
  endAt: Date | null;
  nextSettleAt: Date;
  terminatedBy: number | null;
  terminatedAt: Date | null;
  terminateReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PositionStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export interface IncomeRecord {
  id: number;
  positionId: number;
  userId: number;
  amount: Decimal;
  settleSequence: number;
  scheduleAt: Date;
  status: IncomeStatus;
  settledAt: Date | null;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IncomeStatus = 'PENDING' | 'SETTLED' | 'FAILED' | 'CANCELLED';

export interface Transaction {
  id: number;
  userId: number;
  type: TransactionType;
  amount: Decimal;
  balanceAfter: Decimal;
  relatedOrderNo: string | null;
  remark: string | null;
  createdAt: Date;
}

export type TransactionType =
  | 'RECHARGE'
  | 'WITHDRAW'
  | 'WITHDRAW_FREEZE'
  | 'WITHDRAW_SUCCESS'
  | 'WITHDRAW_REFUND'
  | 'PURCHASE'
  | 'INCOME'
  | 'COMMISSION'
  | 'REFERRAL_COMMISSION'
  | 'REGISTER_BONUS'
  | 'SIGNIN_BONUS'
  | 'SIGN_IN'
  | 'ACTIVITY_BONUS'
  | 'ACTIVITY_REWARD'
  | 'ADMIN_ADJUST'
  | 'ADMIN_ADD'
  | 'ADMIN_DEDUCT'
  | 'SVIP_DAILY_REWARD'
  | 'WEEKLY_SALARY'
  | 'PRIZE_POOL'
  | 'SPIN_WHEEL'
  | 'FINANCIAL_PRINCIPAL'
  | 'COMMUNITY_REWARD';

export interface Commission {
  id: number;
  userId: number;
  fromUserId: number;
  level: number;
  rate: Decimal;
  amount: Decimal;
  sourceAmount: Decimal;
  sourceOrderNo: string;
  createdAt: Date;
}

// ================================
// 支付通道类型
// ================================

export interface PaymentChannel {
  id: number;
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
  minAmount: Decimal | null;
  maxAmount: Decimal | null;
  sortOrder: number;
  remark: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// 配置相关类型
// ================================

export interface GlobalConfig {
  id: number;
  key: string;
  value: unknown;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextConfig {
  id: number;
  key: string;
  value: string;
  category: string | null;
  variables: unknown | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bank {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// 内容管理类型
// ================================

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkType: string;
  linkUrl: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceLink {
  id: number;
  name: string;
  type: string;
  url: string;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageConfig {
  id: number;
  pageId: string;
  title: string;
  content: unknown;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// 活动相关类型
// ================================

export interface Activity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  config: unknown;
  isActive: boolean;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityReward {
  id: number;
  userId: number;
  activityCode: string;
  rewardType: string;
  rewardLevel: number | null;
  amount: Decimal;
  createdAt: Date;
}

// ================================
// 通知相关类型
// ================================

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// ================================
// 管理员相关类型
// ================================

export interface Admin {
  id: number;
  username: string;
  password: string;
  nickname: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLoginLog {
  id: number;
  adminId: number;
  ip: string;
  userAgent: string | null;
  status: string;
  failReason: string | null;
  createdAt: Date;
}

export interface UserLoginLog {
  id: number;
  userId: number;
  ip: string;
  userAgent: string | null;
  device: string | null;
  status: string;
  failReason: string | null;
  createdAt: Date;
}

export interface OperationLog {
  id: number;
  adminId: number;
  module: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  beforeData: unknown | null;
  afterData: unknown | null;
  ip: string;
  createdAt: Date;
}

// ================================
// 安全相关类型
// ================================

export interface Blacklist {
  id: number;
  type: string;
  value: string;
  reason: string | null;
  expireAt: Date | null;
  createdAt: Date;
}

export interface SensitiveWord {
  id: number;
  word: string;
  replaceWith: string | null;
  isActive: boolean;
  createdAt: Date;
}

// ================================
// 定时任务相关类型
// ================================

export interface ScheduledTask {
  id: number;
  taskCode: string;
  taskName: string;
  cronExpression: string;
  isEnabled: boolean;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  lastRunDuration: number | null;
  nextRunAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskRunLog {
  id: number;
  taskCode: string;
  startAt: Date;
  endAt: Date | null;
  duration: number | null;
  status: string;
  processedCount: number | null;
  errorMessage: string | null;
  createdAt: Date;
}

// ================================
// 统计相关类型
// ================================

export interface DailyStats {
  id: number;
  date: Date;
  newUsers: number;
  activeUsers: number;
  rechargeCount: number;
  rechargeAmount: Decimal;
  withdrawCount: number;
  withdrawAmount: Decimal;
  purchaseCount: number;
  purchaseAmount: Decimal;
  incomeAmount: Decimal;
  commissionAmount: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

// ================================
// Lendlease 重构新增类型
// ================================

export interface SvipRewardRecord {
  id: number;
  userId: number;
  productId: number;
  svipLevel: number;
  amount: Decimal;
  rewardDate: string;
  status: string;
  createdAt: Date;
}

export interface WeeklySalary {
  id: number;
  minRecharge: Decimal;
  rewardAmount: Decimal;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklySalaryClaim {
  id: number;
  userId: number;
  weekStart: Date;
  weekEnd: Date;
  teamRecharge: Decimal;
  salaryId: number;
  amount: Decimal;
  status: string;
  createdAt: Date;
}

export interface PrizePool {
  id: number;
  dailyTotal: Decimal;
  remainToday: Decimal;
  lastResetDate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrizePoolTier {
  id: number;
  requiredInvites: number;
  rewardAmount: Decimal;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface PrizePoolClaim {
  id: number;
  userId: number;
  tierId: number;
  amount: Decimal;
  claimDate: string;
  createdAt: Date;
}

export interface SpinWheelPrize {
  id: number;
  name: string;
  amount: Decimal;
  probability: Decimal;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface SpinRecord {
  id: number;
  userId: number;
  prizeId: number;
  amount: Decimal;
  spinDate: string;
  sourceType: string;
  createdAt: Date;
}

export interface SpinChance {
  id: number;
  userId: number;
  chanceDate: string;
  rechargeChances: number;
  inviteChances: number;
  usedChances: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityPost {
  id: number;
  userId: number;
  withdrawOrderId: number | null;
  withdrawAmount: Decimal | null;
  platformImage: string | null;
  receiptImage: string | null;
  content: string | null;
  status: string;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  rewardAmount: Decimal | null;
  rewardedAt: Date | null;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: Date;
}

export interface CommunityLike {
  id: number;
  postId: number;
  userId: number;
  createdAt: Date;
}

export interface CommunityRewardTier {
  id: number;
  minAmount: Decimal;
  maxAmount: Decimal;
  rewardAmount: Decimal;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}
