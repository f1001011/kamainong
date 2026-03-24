/**
 * @file 系统设置服务
 * @description 处理全局配置、文案管理、银行管理、动画配置、页面配置等系统设置业务逻辑
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12、13节
 * @depends 开发文档/04-后台管理端/04.9-系统设置/ 下所有页面文档
 */

import { prisma, Prisma } from '@/lib/prisma';
import { DEFAULT_CONFIG } from '@honeywell/config';
import {
  CACHE_KEYS,
  CACHE_TTL,
  deleteCache,
  deleteCaches,
  clearBankCache,
} from '@/lib/redis';
import { BusinessError } from '@/lib/errors';
import {
  clearGlobalConfigCache,
  clearTextsCache,
  incrementGlobalConfigVersion,
  incrementTextsVersion,
} from './config.service';
import { Decimal } from '@prisma/client/runtime/library';

// ================================
// 类型定义
// ================================

/**
 * 后台全局配置响应（比前端多更多配置项）
 * @description 依据：02.4-后台API接口清单.md 第12.1节
 */
export interface AdminGlobalConfigResponse {
  // === 基础信息 ===
  siteName: string;
  siteDomain: string;
  siteLogoUrl: string;
  currencySymbol: string;
  currencyCode: string;
  currencySpace: boolean;
  phoneAreaCode: string;
  
  // === 时区配置 ===
  systemTimezone: string;
  timezoneDisplayName: string;
  
  // === 财务配置 ===
  withdrawFeePercent: number;
  withdrawLimitDaily: number;
  withdrawTimeRange: string;
  withdrawMinAmount: string;
  withdrawMaxAmount: string;
  withdrawQuickAmounts: number[];
  registerBonus: string;
  registerIpLimit: number;
  
  // === 充值配置 ===
  rechargePresets: number[];
  rechargeMinAmount: string;
  rechargeMaxAmount: string;
  rechargeTimeoutMinutes: number;
  rechargeMaxPending: number;
  rechargePageTips: string;
  withdrawPageTips: string;
  
  // === 银行卡配置 ===
  maxBindcardCount: number;
  
  // === 返佣配置 ===
  commissionLevel1Rate: number;
  commissionLevel2Rate: number;
  commissionLevel3Rate: number;
  
  // === 安全配置 ===
  tokenExpiresDays: number;
  tokenRenewThresholdDays: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordComplexityRequired: boolean;
  passwordStrengthIndicator: boolean;
  
  // === API速率限制 ===
  rateLimitGlobal: number;
  rateLimitLogin: number;
  rateLimitRegister: number;
  rateLimitRecharge: number;
  rateLimitWithdraw: number;
  rateLimitSignin: number;
  
  // === Toast配置 ===
  toastDuration: number;
  toastPosition: string;
  
  // === 用户头像/昵称配置 ===
  avatarMaxSize: number;
  avatarFormats: string;
  nicknameMinLength: number;
  nicknameMaxLength: number;
  sensitiveWordFilterEnabled: boolean;
  
  // === 列表与筛选配置 ===
  transactionTimeFilterEnabled: boolean;
  defaultPageSize: number;
  pageSizeOptions: number[];
  
  // === 连续签到配置 ===
  signinStreakDisplayEnabled: boolean;
  signinStreakRewardEnabled: boolean;
  signinStreak7DaysReward: string;
  signinStreak30DaysReward: string;
  
  // === 心跳配置 ===
  heartbeatInterval: number;
  heartbeatTimeout: number;
  
  // === 收益发放配置 ===
  incomeMaxRetryCount: number;
  
  // === 定时任务告警配置 ===
  taskFailureAlertEnabled: boolean;
  taskConsecutiveFailureThreshold: number;
  taskExecutionTimeoutThreshold: number;
  taskAlertMethod: string[];
  
  // === 文件上传限制配置 ===
  productImageMaxSize: number;
  bannerMaxSize: number;
  posterBgMaxSize: number;
  allowedImageTypes: string;
  
  // === 提示文案配置 ===
  withdrawThresholdNotMetTip: string;
  insufficientBalanceTip: string;
  vipLevelRequiredTip: string;
  logoutConfirmTip: string;
  
  // === 空状态配置 ===
  emptyStatePositions: EmptyStateConfig;
  emptyStateRecharge: EmptyStateConfig;
  emptyStateWithdraw: EmptyStateConfig;
  emptyStateTransaction: EmptyStateConfig;
  emptyStateTeam: EmptyStateConfig;
  emptyStateMessage: EmptyStateConfig;
  
  // === 新功能开关配置 ===
  svipRewardEnabled: boolean;
  weeklySalaryEnabled: boolean;
  prizePoolEnabled: boolean;
  spinWheelEnabled: boolean;
  communityEnabled: boolean;
  financialProductEnabled: boolean;
  
  // === 转盘配置 ===
  spinMaxDaily: number;
  spinInviteThreshold: number;
  
  // === 提现条件配置 ===
  withdrawRequireRecharge: boolean;
  withdrawRequirePurchase: boolean;
  
  // === 客服与手机配置 ===
  serviceTimeRange: string;
  phoneDigitCount: number;
  
  // === 货币显示配置 ===
  currencyDecimals: number;
  currencyThousandsSep: string;
  
  // === 版本信息 ===
  globalConfigVersion: number;
  globalConfigUpdatedAt: string;
}

/**
 * 空状态配置
 */
interface EmptyStateConfig {
  imageUrl: string;
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}

/**
 * 文案列表查询参数
 */
export interface TextListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
}

/**
 * 文案项
 */
export interface TextItem {
  id: number;
  key: string;
  value: string;
  category: string;
  description: string | null;
  variables: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 文案版本记录
 */
export interface TextVersionRecord {
  id: number;
  version: number;
  textKey: string;
  oldValue: string | null;
  newValue: string;
  operatorId: number;
  operatorName: string;
  createdAt: Date;
}

/**
 * 银行列表查询参数
 */
export interface BankListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  isActive?: boolean;
}

/**
 * 银行项（带关联统计）
 */
export interface BankItem {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  bankCardCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建银行参数
 */
export interface CreateBankParams {
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

/**
 * 更新银行参数
 */
export interface UpdateBankParams {
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ================================
// 辅助函数
// ================================

/**
 * 格式化金额为两位小数字符串
 */
function formatAmount(value: number | Decimal | undefined | null): string {
  if (value === undefined || value === null) return '0.00';
  return Number(value).toFixed(2);
}

/**
 * 从数据库获取所有全局配置值
 */
async function getAllConfigValues(): Promise<Record<string, unknown>> {
  const configs = await prisma.globalConfig.findMany();
  const result: Record<string, unknown> = {};
  for (const config of configs) {
    result[config.key] = config.value;
  }
  return result;
}

// ================================
// 全局配置服务
// ================================

/**
 * 获取后台全局配置
 * @description 依据：02.4-后台API接口清单.md 第12.1节
 */
export async function getAdminGlobalConfig(): Promise<AdminGlobalConfigResponse> {
  const configs = await getAllConfigValues();
  
  return {
    // === 基础信息 ===
    siteName: (configs['site_name'] as string) ?? 'lendlease',
    siteDomain: (configs['site_domain'] as string) ?? 'LLES-MA.com',
    siteLogoUrl: (configs['site_logo_url'] as string) ?? '',
    currencySymbol: (configs['currency_symbol'] as string) ?? 'MAD',
    currencyCode: (configs['currency_code'] as string) ?? 'MAD',
    currencySpace: (configs['currency_space'] as boolean) ?? true,
    phoneAreaCode: (configs['phone_area_code'] as string) ?? '+212',
    
    // === 时区配置 ===
    systemTimezone: (configs['system_timezone'] as string) ?? DEFAULT_CONFIG.SYSTEM_TIMEZONE,
    timezoneDisplayName: (configs['timezone_display_name'] as string) ?? DEFAULT_CONFIG.TIMEZONE_DISPLAY_NAME,
    
    // === 财务配置 ===
    withdrawFeePercent: (configs['withdraw_fee_percent'] as number) ?? 5,
    withdrawLimitDaily: (configs['withdraw_limit_daily'] as number) ?? 1,
    withdrawTimeRange: (configs['withdraw_time_range'] as string) ?? '10:00-17:00',
    withdrawMinAmount: formatAmount(configs['withdraw_min_amount'] as number),
    withdrawMaxAmount: formatAmount(configs['withdraw_max_amount'] as number),
    withdrawQuickAmounts: (configs['withdraw_quick_amounts'] as number[]) ?? [100, 500, 1000, 5000],
    registerBonus: formatAmount(configs['register_bonus'] as number),
    registerIpLimit: (configs['register_ip_limit'] as number) ?? 5,
    
    // === 充值配置 ===
    rechargePresets: (configs['recharge_presets'] as number[]) ?? [50, 100, 200, 500, 1000, 2000, 5000, 10000],
    rechargeMinAmount: formatAmount(configs['recharge_min_amount'] as number),
    rechargeMaxAmount: formatAmount(configs['recharge_max_amount'] as number),
    rechargeTimeoutMinutes: (configs['recharge_timeout_minutes'] as number) ?? 30,
    rechargeMaxPending: (configs['recharge_max_pending'] as number) ?? 5,
    rechargePageTips: (configs['recharge_page_tips'] as string) ?? '',
    withdrawPageTips: (configs['withdraw_page_tips'] as string) ?? '',
    
    // === 银行卡配置 ===
    maxBindcardCount: (configs['max_bindcard_count'] as number) ?? 3,
    
    // === 返佣配置 ===
    commissionLevel1Rate: (configs['commission_level1_rate'] as number) ?? 20,
    commissionLevel2Rate: (configs['commission_level2_rate'] as number) ?? 2,
    commissionLevel3Rate: (configs['commission_level3_rate'] as number) ?? 1,
    
    // === 安全配置 ===
    tokenExpiresDays: (configs['token_expires_days'] as number) ?? 7,
    tokenRenewThresholdDays: (configs['token_renew_threshold_days'] as number) ?? 1,
    passwordMinLength: (configs['password_min_length'] as number) ?? 6,
    passwordMaxLength: (configs['password_max_length'] as number) ?? 32,
    passwordComplexityRequired: (configs['password_complexity_required'] as boolean) ?? true,
    passwordStrengthIndicator: (configs['password_strength_indicator'] as boolean) ?? true,
    
    // === API速率限制 ===
    rateLimitGlobal: (configs['rate_limit_global'] as number) ?? 120,
    rateLimitLogin: (configs['rate_limit_login'] as number) ?? 10,
    rateLimitRegister: (configs['rate_limit_register'] as number) ?? 5,
    rateLimitRecharge: (configs['rate_limit_recharge'] as number) ?? 10,
    rateLimitWithdraw: (configs['rate_limit_withdraw'] as number) ?? 5,
    rateLimitSignin: (configs['rate_limit_signin'] as number) ?? 5,
    
    // === Toast配置 ===
    toastDuration: (configs['toast_duration'] as number) ?? 3000,
    toastPosition: (configs['toast_position'] as string) ?? 'top-center',
    
    // === 用户头像/昵称配置 ===
    avatarMaxSize: (configs['avatar_max_size'] as number) ?? 2097152,
    avatarFormats: (configs['avatar_formats'] as string) ?? 'JPG,PNG,GIF',
    nicknameMinLength: (configs['nickname_min_length'] as number) ?? 2,
    nicknameMaxLength: (configs['nickname_max_length'] as number) ?? 20,
    sensitiveWordFilterEnabled: (configs['sensitive_word_filter_enabled'] as boolean) ?? true,
    
    // === 列表与筛选配置 ===
    transactionTimeFilterEnabled: (configs['transaction_time_filter_enabled'] as boolean) ?? true,
    defaultPageSize: (configs['default_page_size'] as number) ?? 20,
    pageSizeOptions: (configs['page_size_options'] as number[]) ?? [10, 20, 50, 100],
    
    // === 连续签到配置 ===
    signinStreakDisplayEnabled: (configs['signin_streak_display_enabled'] as boolean) ?? true,
    signinStreakRewardEnabled: (configs['signin_streak_reward_enabled'] as boolean) ?? false,
    signinStreak7DaysReward: formatAmount(configs['signin_streak_7_days_reward'] as number),
    signinStreak30DaysReward: formatAmount(configs['signin_streak_30_days_reward'] as number),
    
    // === 心跳配置 ===
    heartbeatInterval: (configs['heartbeat_interval'] as number) ?? 60,
    heartbeatTimeout: (configs['heartbeat_timeout'] as number) ?? 120,
    
    // === 收益发放配置 ===
    incomeMaxRetryCount: (configs['income_max_retry_count'] as number) ?? 3,
    
    // === 定时任务告警配置 ===
    taskFailureAlertEnabled: (configs['task_failure_alert_enabled'] as boolean) ?? true,
    taskConsecutiveFailureThreshold: (configs['task_consecutive_failure_threshold'] as number) ?? 3,
    taskExecutionTimeoutThreshold: (configs['task_execution_timeout_threshold'] as number) ?? 300,
    taskAlertMethod: (configs['task_alert_method'] as string[]) ?? ['admin_notification'],
    
    // === 文件上传限制配置 ===
    productImageMaxSize: (configs['product_image_max_size'] as number) ?? 5242880,
    bannerMaxSize: (configs['banner_max_size'] as number) ?? 5242880,
    posterBgMaxSize: (configs['poster_bg_max_size'] as number) ?? 10485760,
    allowedImageTypes: (configs['allowed_image_types'] as string) ?? 'JPG,PNG,GIF,WEBP',
    
    // === 提示文案配置（用户端默认值使用阿拉伯语）===
    withdrawThresholdNotMetTip: (configs['withdraw_threshold_not_met_tip'] as string) ?? '',
    insufficientBalanceTip: (configs['insufficient_balance_tip'] as string) ?? '',
    vipLevelRequiredTip: (configs['vip_level_required_tip'] as string) ?? '',
    logoutConfirmTip: (configs['logout_confirm_tip'] as string) ?? 'هل أنت متأكد من تسجيل الخروج؟',
    
    // === 空状态配置（用户端默认值使用阿拉伯语）===
    emptyStatePositions: (configs['empty_state_positions'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/positions.png',
      title: 'لا توجد مراكز',
      description: 'لم تقم بشراء أي منتج بعد',
      buttonText: 'شراء',
      buttonLink: '/products',
    },
    emptyStateRecharge: (configs['empty_state_recharge'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/recharge.png',
      title: 'لا توجد سجلات إيداع',
      description: 'لم تقم بأي إيداع بعد',
    },
    emptyStateWithdraw: (configs['empty_state_withdraw'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/withdraw.png',
      title: 'لا توجد سجلات سحب',
      description: 'لم تقم بأي سحب بعد',
    },
    emptyStateTransaction: (configs['empty_state_transaction'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/transaction.png',
      title: 'لا توجد معاملات',
      description: 'لا يوجد لديك أي سجل معاملات بعد',
    },
    emptyStateTeam: (configs['empty_state_team'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/team.png',
      title: 'لا يوجد أعضاء في الفريق',
      description: 'ادعُ أصدقاءك للانضمام إلى فريقك',
      buttonText: 'دعوة',
      buttonLink: '/invite',
    },
    emptyStateMessage: (configs['empty_state_message'] as EmptyStateConfig) ?? {
      imageUrl: '/images/empty/message.png',
      title: 'لا توجد رسائل',
      description: 'لم تتلقَ أي رسائل بعد',
    },
    
    // === 新功能开关配置 ===
    svipRewardEnabled: (configs['svip_reward_enabled'] as boolean) ?? true,
    weeklySalaryEnabled: (configs['weekly_salary_enabled'] as boolean) ?? true,
    prizePoolEnabled: (configs['prize_pool_enabled'] as boolean) ?? true,
    spinWheelEnabled: (configs['spin_wheel_enabled'] as boolean) ?? true,
    communityEnabled: (configs['community_enabled'] as boolean) ?? true,
    financialProductEnabled: (configs['financial_product_enabled'] as boolean) ?? true,
    
    // === 转盘配置 ===
    spinMaxDaily: (configs['spin_max_daily'] as number) ?? 5,
    spinInviteThreshold: (configs['spin_invite_threshold'] as number) ?? 5,
    
    // === 提现条件配置 ===
    withdrawRequireRecharge: (configs['withdraw_require_recharge'] as boolean) ?? true,
    withdrawRequirePurchase: (configs['withdraw_require_purchase'] as boolean) ?? true,
    
    // === 客服与手机配置 ===
    serviceTimeRange: (configs['service_time_range'] as string) ?? '09:00-19:00',
    phoneDigitCount: (configs['phone_digit_count'] as number) ?? 9,
    
    // === 货币显示配置 ===
    currencyDecimals: (configs['currency_decimals'] as number) ?? 0,
    currencyThousandsSep: (configs['currency_thousands_sep'] as string) ?? ',',
    
    // === 版本信息 ===
    globalConfigVersion: (configs['global_config_version'] as number) ?? 1,
    globalConfigUpdatedAt: (configs['global_config_updated_at'] as string) ?? new Date().toISOString(),
  };
}

/**
 * 数据库key到API字段的映射
 */
const CONFIG_KEY_MAP: Record<string, string> = {
  siteName: 'site_name',
  siteDomain: 'site_domain',
  siteLogoUrl: 'site_logo_url',
  currencySymbol: 'currency_symbol',
  currencyCode: 'currency_code',
  currencySpace: 'currency_space',
  phoneAreaCode: 'phone_area_code',
  systemTimezone: 'system_timezone',
  timezoneDisplayName: 'timezone_display_name',
  withdrawFeePercent: 'withdraw_fee_percent',
  withdrawLimitDaily: 'withdraw_limit_daily',
  withdrawTimeRange: 'withdraw_time_range',
  withdrawMinAmount: 'withdraw_min_amount',
  withdrawMaxAmount: 'withdraw_max_amount',
  withdrawQuickAmounts: 'withdraw_quick_amounts',
  registerBonus: 'register_bonus',
  registerIpLimit: 'register_ip_limit',
  rechargePresets: 'recharge_presets',
  rechargeMinAmount: 'recharge_min_amount',
  rechargeMaxAmount: 'recharge_max_amount',
  rechargeTimeoutMinutes: 'recharge_timeout_minutes',
  rechargeMaxPending: 'recharge_max_pending',
  rechargePageTips: 'recharge_page_tips',
  withdrawPageTips: 'withdraw_page_tips',
  maxBindcardCount: 'max_bindcard_count',
  commissionLevel1Rate: 'commission_level1_rate',
  commissionLevel2Rate: 'commission_level2_rate',
  commissionLevel3Rate: 'commission_level3_rate',
  tokenExpiresDays: 'token_expires_days',
  tokenRenewThresholdDays: 'token_renew_threshold_days',
  passwordMinLength: 'password_min_length',
  passwordMaxLength: 'password_max_length',
  passwordComplexityRequired: 'password_complexity_required',
  passwordStrengthIndicator: 'password_strength_indicator',
  rateLimitGlobal: 'rate_limit_global',
  rateLimitLogin: 'rate_limit_login',
  rateLimitRegister: 'rate_limit_register',
  rateLimitRecharge: 'rate_limit_recharge',
  rateLimitWithdraw: 'rate_limit_withdraw',
  rateLimitSignin: 'rate_limit_signin',
  toastDuration: 'toast_duration',
  toastPosition: 'toast_position',
  avatarMaxSize: 'avatar_max_size',
  avatarFormats: 'avatar_formats',
  nicknameMinLength: 'nickname_min_length',
  nicknameMaxLength: 'nickname_max_length',
  sensitiveWordFilterEnabled: 'sensitive_word_filter_enabled',
  transactionTimeFilterEnabled: 'transaction_time_filter_enabled',
  defaultPageSize: 'default_page_size',
  pageSizeOptions: 'page_size_options',
  signinStreakDisplayEnabled: 'signin_streak_display_enabled',
  signinStreakRewardEnabled: 'signin_streak_reward_enabled',
  signinStreak7DaysReward: 'signin_streak_7_days_reward',
  signinStreak30DaysReward: 'signin_streak_30_days_reward',
  heartbeatInterval: 'heartbeat_interval',
  heartbeatTimeout: 'heartbeat_timeout',
  incomeMaxRetryCount: 'income_max_retry_count',
  // === 定时任务告警配置 ===
  taskFailureAlertEnabled: 'task_failure_alert_enabled',
  taskConsecutiveFailureThreshold: 'task_consecutive_failure_threshold',
  taskExecutionTimeoutThreshold: 'task_execution_timeout_threshold',
  taskAlertMethod: 'task_alert_method',
  // === 文件上传限制配置 ===
  productImageMaxSize: 'product_image_max_size',
  bannerMaxSize: 'banner_max_size',
  posterBgMaxSize: 'poster_bg_max_size',
  allowedImageTypes: 'allowed_image_types',
  // === 提示文案配置 ===
  withdrawThresholdNotMetTip: 'withdraw_threshold_not_met_tip',
  insufficientBalanceTip: 'insufficient_balance_tip',
  vipLevelRequiredTip: 'vip_level_required_tip',
  logoutConfirmTip: 'logout_confirm_tip',
  // === 空状态配置 ===
  emptyStatePositions: 'empty_state_positions',
  emptyStateRecharge: 'empty_state_recharge',
  emptyStateWithdraw: 'empty_state_withdraw',
  emptyStateTransaction: 'empty_state_transaction',
  emptyStateTeam: 'empty_state_team',
  emptyStateMessage: 'empty_state_message',
  // === 新功能开关配置 ===
  svipRewardEnabled: 'svip_reward_enabled',
  weeklySalaryEnabled: 'weekly_salary_enabled',
  prizePoolEnabled: 'prize_pool_enabled',
  spinWheelEnabled: 'spin_wheel_enabled',
  communityEnabled: 'community_enabled',
  financialProductEnabled: 'financial_product_enabled',
  // === 转盘配置 ===
  spinMaxDaily: 'spin_max_daily',
  spinInviteThreshold: 'spin_invite_threshold',
  // === 提现条件配置 ===
  withdrawRequireRecharge: 'withdraw_require_recharge',
  withdrawRequirePurchase: 'withdraw_require_purchase',
  // === 客服与手机配置 ===
  serviceTimeRange: 'service_time_range',
  phoneDigitCount: 'phone_digit_count',
  // === 货币显示配置 ===
  currencyDecimals: 'currency_decimals',
  currencyThousandsSep: 'currency_thousands_sep',
};

/**
 * 更新全局配置
 * @description 依据：02.4-后台API接口清单.md 第12.2节
 */
export async function updateGlobalConfig(
  data: Partial<Record<string, unknown>>
): Promise<{ globalConfigVersion: number; globalConfigUpdatedAt: string }> {
  // 将 API 字段名转换为数据库 key
  const updates: Array<{ key: string; value: unknown }> = [];
  
  for (const [apiKey, value] of Object.entries(data)) {
    const dbKey = CONFIG_KEY_MAP[apiKey];
    if (dbKey && value !== undefined) {
      // 处理金额字段：转换字符串为数字
      let processedValue = value;
      if (typeof value === 'string' && /^\d+\.?\d*$/.test(value)) {
        // 对于金额字段，存储为数字
        const amountFields = [
          'withdraw_min_amount', 'withdraw_max_amount', 'register_bonus',
          'recharge_min_amount', 'recharge_max_amount',
          'signin_streak_7_days_reward', 'signin_streak_30_days_reward',
        ];
        if (amountFields.includes(dbKey)) {
          processedValue = parseFloat(value);
        }
      }
      updates.push({ key: dbKey, value: processedValue });
    }
  }
  
  if (updates.length === 0) {
    throw new BusinessError('VALIDATION_ERROR', '没有有效的配置更新', 400);
  }
  
  // 批量更新配置
  await prisma.$transaction(
    updates.map(({ key, value }) =>
      prisma.globalConfig.upsert({
        where: { key },
        update: { value: value as any },
        create: { key, value: value as any },
      })
    )
  );
  
  // 递增版本号并清除缓存
  await incrementGlobalConfigVersion();
  
  // 清除密码/注册相关缓存（密码规则更改需要立即生效）
  await deleteCaches(['config:register', 'config:password']);
  
  // 获取新的版本号
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'global_config_version' },
  });
  const updatedAtConfig = await prisma.globalConfig.findUnique({
    where: { key: 'global_config_updated_at' },
  });
  
  return {
    globalConfigVersion: (versionConfig?.value as number) ?? 1,
    globalConfigUpdatedAt: (updatedAtConfig?.value as string) ?? new Date().toISOString(),
  };
}

// ================================
// 文案管理服务
// ================================

/**
 * 获取文案列表
 * @description 依据：02.4-后台API接口清单.md 第12.3节
 */
export async function getTextList(params: TextListParams): Promise<{
  list: TextItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;
  const skip = (page - 1) * pageSize;
  
  // 构建查询条件
  const where: any = {};
  
  if (params.keyword) {
    where.OR = [
      { key: { contains: params.keyword } },
      { value: { contains: params.keyword } },
    ];
  }
  
  if (params.category) {
    where.category = params.category;
  }
  
  // 查询总数
  const total = await prisma.textConfig.count({ where });
  
  // 查询列表
  const list = await prisma.textConfig.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });
  
  return {
    list: list.map(item => ({
      id: item.id,
      key: item.key,
      value: item.value,
      category: item.category,
      description: item.description,
      variables: item.variables as string[] | null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 更新单条文案
 * @description 依据：02.4-后台API接口清单.md 第12.4节
 */
export async function updateText(
  key: string,
  value: string,
  adminId: number,
  adminName: string
): Promise<{ key: string; value: string; version: number }> {
  // 查找文案
  const text = await prisma.textConfig.findUnique({
    where: { key },
  });
  
  if (!text) {
    throw new BusinessError('TEXT_NOT_FOUND', '文案不存在', 404);
  }
  
  const oldValue = text.value;
  
  // 获取当前版本号
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_version' },
  });
  const currentVersion = (versionConfig?.value as number) ?? 0;
  const newVersion = currentVersion + 1;
  
  // 使用事务更新文案并记录版本历史
  await prisma.$transaction([
    // 更新文案
    prisma.textConfig.update({
      where: { key },
      data: { value },
    }),
    // 记录版本历史
    prisma.textConfigVersion.create({
      data: {
        version: newVersion,
        textKey: key,
        oldValue,
        newValue: value,
        operatorId: adminId,
        operatorName: adminName,
      },
    }),
  ]);
  
  // 递增版本号并清除缓存
  await incrementTextsVersion();
  
  return { key, value, version: newVersion };
}

/**
 * 批量更新文案
 * @description 依据：02.4-后台API接口清单.md 第12.5节
 */
export async function batchUpdateTexts(
  texts: Record<string, string>,
  adminId: number,
  adminName: string
): Promise<{ updated: number; version: number }> {
  const entries = Object.entries(texts);
  if (entries.length === 0) {
    throw new BusinessError('VALIDATION_ERROR', '没有需要更新的文案', 400);
  }
  
  // 获取当前版本号
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_version' },
  });
  const currentVersion = (versionConfig?.value as number) ?? 0;
  const newVersion = currentVersion + 1;
  
  // 获取原有文案值
  const existingTexts = await prisma.textConfig.findMany({
    where: { key: { in: entries.map(([k]) => k) } },
  });
  const oldValueMap = new Map(existingTexts.map(t => [t.key, t.value]));
  
  // 使用事务批量更新
  const operations: any[] = [];
  const versionRecords: any[] = [];
  
  for (const [key, value] of entries) {
    operations.push(
      prisma.textConfig.updateMany({
        where: { key },
        data: { value },
      })
    );
    
    // 记录版本历史
    const oldValue = oldValueMap.get(key);
    if (oldValue !== undefined) {
      versionRecords.push({
        version: newVersion,
        textKey: key,
        oldValue,
        newValue: value,
        operatorId: adminId,
        operatorName: adminName,
      });
    }
  }
  
  await prisma.$transaction([
    ...operations,
    prisma.textConfigVersion.createMany({
      data: versionRecords,
    }),
  ]);
  
  // 递增版本号并清除缓存
  await incrementTextsVersion();
  
  return { updated: entries.length, version: newVersion };
}

/**
 * 导出文案
 * @description 依据：02.4-后台API接口清单.md 第12.6节
 */
export async function exportTexts(
  categories?: string[]
): Promise<Record<string, { value: string; description: string | null }>> {
  const where: any = {};
  if (categories && categories.length > 0) {
    where.category = { in: categories };
  }
  
  const texts = await prisma.textConfig.findMany({
    where,
    orderBy: [{ category: 'asc' }, { key: 'asc' }],
  });
  
  const result: Record<string, { value: string; description: string | null }> = {};
  for (const text of texts) {
    result[text.key] = {
      value: text.value,
      description: text.description,
    };
  }
  
  return result;
}

/**
 * 导入文案
 * @description 依据：02.4-后台API接口清单.md 第12.7节
 */
export async function importTexts(
  texts: Record<string, string>,
  conflictStrategy: 'OVERWRITE' | 'SKIP',
  adminId: number,
  adminName: string
): Promise<{ total: number; updated: number; skipped: number }> {
  const entries = Object.entries(texts);
  const total = entries.length;
  
  if (total === 0) {
    return { total: 0, updated: 0, skipped: 0 };
  }
  
  // 获取现有文案
  const existingTexts = await prisma.textConfig.findMany({
    where: { key: { in: entries.map(([k]) => k) } },
  });
  const existingKeySet = new Set(existingTexts.map(t => t.key));
  const oldValueMap = new Map(existingTexts.map(t => [t.key, t.value]));
  
  let updated = 0;
  let skipped = 0;
  
  // 获取当前版本号
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_version' },
  });
  const currentVersion = (versionConfig?.value as number) ?? 0;
  const newVersion = currentVersion + 1;
  
  const operations: any[] = [];
  const versionRecords: any[] = [];
  
  for (const [key, value] of entries) {
    if (existingKeySet.has(key)) {
      if (conflictStrategy === 'SKIP') {
        skipped++;
        continue;
      }
      // OVERWRITE
      operations.push(
        prisma.textConfig.update({
          where: { key },
          data: { value },
        })
      );
      versionRecords.push({
        version: newVersion,
        textKey: key,
        oldValue: oldValueMap.get(key),
        newValue: value,
        operatorId: adminId,
        operatorName: adminName,
      });
      updated++;
    } else {
      // 新文案（跳过，不自动创建）
      skipped++;
    }
  }
  
  if (operations.length > 0) {
    await prisma.$transaction([
      ...operations,
      prisma.textConfigVersion.createMany({
        data: versionRecords,
      }),
    ]);
    
    // 递增版本号并清除缓存
    await incrementTextsVersion();
  }
  
  return { total, updated, skipped };
}

/**
 * 获取文案版本历史
 * @description 依据：02.4-后台API接口清单.md 第12.8节
 */
export async function getTextVersions(params: {
  page?: number;
  pageSize?: number;
  textKey?: string;
  operatorId?: number;
  startDate?: string;
  endDate?: string;
}): Promise<{
  list: TextVersionRecord[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  
  if (params.textKey) {
    where.textKey = params.textKey;
  }
  
  if (params.operatorId) {
    where.operatorId = params.operatorId;
  }
  
  if (params.startDate || params.endDate) {
    where.createdAt = {};
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate);
    }
    if (params.endDate) {
      where.createdAt.lte = new Date(params.endDate);
    }
  }
  
  const total = await prisma.textConfigVersion.count({ where });
  
  const list = await prisma.textConfigVersion.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: { createdAt: 'desc' },
  });
  
  return {
    list: list.map(item => ({
      id: item.id,
      version: item.version,
      textKey: item.textKey,
      oldValue: item.oldValue,
      newValue: item.newValue,
      operatorId: item.operatorId,
      operatorName: item.operatorName,
      createdAt: item.createdAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 回滚文案版本
 * @description 依据：02.4-后台API接口清单.md 第12.9节
 */
export async function rollbackTextVersion(
  versionId: number,
  adminId: number,
  adminName: string
): Promise<{ textKey: string; restoredValue: string; newVersion: number }> {
  // 查找版本记录
  const versionRecord = await prisma.textConfigVersion.findUnique({
    where: { id: versionId },
  });
  
  if (!versionRecord) {
    throw new BusinessError('VERSION_NOT_FOUND', '版本记录不存在', 404);
  }
  
  // 回滚到此版本的旧值
  const restoredValue = versionRecord.oldValue ?? '';
  const textKey = versionRecord.textKey;
  
  // 获取当前文案值
  const currentText = await prisma.textConfig.findUnique({
    where: { key: textKey },
  });
  
  if (!currentText) {
    throw new BusinessError('TEXT_NOT_FOUND', '文案不存在', 404);
  }
  
  // 获取当前版本号
  const versionConfig = await prisma.globalConfig.findUnique({
    where: { key: 'texts_version' },
  });
  const currentVersion = (versionConfig?.value as number) ?? 0;
  const newVersion = currentVersion + 1;
  
  // 使用事务回滚文案
  await prisma.$transaction([
    prisma.textConfig.update({
      where: { key: textKey },
      data: { value: restoredValue },
    }),
    prisma.textConfigVersion.create({
      data: {
        version: newVersion,
        textKey,
        oldValue: currentText.value,
        newValue: restoredValue,
        operatorId: adminId,
        operatorName: adminName,
      },
    }),
  ]);
  
  // 递增版本号并清除缓存
  await incrementTextsVersion();
  
  return { textKey, restoredValue, newVersion };
}

// ================================
// 银行管理服务
// ================================

/**
 * 获取银行列表
 * @description 依据：02.4-后台API接口清单.md 第12.11节
 */
export async function getBankList(params: BankListParams): Promise<{
  list: BankItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const skip = (page - 1) * pageSize;
  
  const where: any = {};
  
  if (params.keyword) {
    where.OR = [
      { code: { contains: params.keyword } },
      { name: { contains: params.keyword } },
    ];
  }
  
  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }
  
  const total = await prisma.bank.count({ where });
  
  // 查询银行列表，并统计关联的银行卡数量
  const banks = await prisma.bank.findMany({
    where,
    skip,
    take: pageSize,
    orderBy: [{ sortOrder: 'desc' }, { id: 'asc' }],
    include: {
      _count: {
        select: { bankCards: true },
      },
    },
  });
  
  return {
    list: banks.map(bank => ({
      id: bank.id,
      code: bank.code,
      name: bank.name,
      isActive: bank.isActive,
      sortOrder: bank.sortOrder,
      bankCardCount: bank._count.bankCards,
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取银行详情
 */
export async function getBankDetail(id: number): Promise<BankItem> {
  const bank = await prisma.bank.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bankCards: true },
      },
    },
  });
  
  if (!bank) {
    throw new BusinessError('BANK_NOT_FOUND', '银行不存在', 404);
  }
  
  return {
    id: bank.id,
    code: bank.code,
    name: bank.name,
    isActive: bank.isActive,
    sortOrder: bank.sortOrder,
    bankCardCount: bank._count.bankCards,
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
  };
}

/**
 * 创建银行
 * @description 依据：02.4-后台API接口清单.md 第12.12节
 */
export async function createBank(params: CreateBankParams): Promise<BankItem> {
  // 检查编码唯一性
  const existing = await prisma.bank.findUnique({
    where: { code: params.code },
  });
  
  if (existing) {
    throw new BusinessError('BANK_CODE_EXISTS', '银行编码已存在', 400);
  }
  
  const bank = await prisma.bank.create({
    data: {
      code: params.code.toUpperCase(),
      name: params.name,
      sortOrder: params.sortOrder ?? 0,
      isActive: params.isActive ?? true,
    },
  });
  
  // 清除缓存
  await clearBankCache();
  
  return {
    id: bank.id,
    code: bank.code,
    name: bank.name,
    isActive: bank.isActive,
    sortOrder: bank.sortOrder,
    bankCardCount: 0,
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
  };
}

/**
 * 更新银行
 * @description 依据：02.4-后台API接口清单.md 第12.13节
 */
export async function updateBank(id: number, params: UpdateBankParams): Promise<BankItem> {
  const bank = await prisma.bank.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bankCards: true },
      },
    },
  });
  
  if (!bank) {
    throw new BusinessError('BANK_NOT_FOUND', '银行不存在', 404);
  }
  
  const updated = await prisma.bank.update({
    where: { id },
    data: {
      name: params.name,
      sortOrder: params.sortOrder,
      isActive: params.isActive,
    },
    include: {
      _count: {
        select: { bankCards: true },
      },
    },
  });
  
  // 清除缓存
  await clearBankCache();
  
  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    isActive: updated.isActive,
    sortOrder: updated.sortOrder,
    bankCardCount: updated._count.bankCards,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

/**
 * 删除银行
 * @description 依据：02.4-后台API接口清单.md 第12.14节
 */
export async function deleteBank(id: number): Promise<void> {
  const bank = await prisma.bank.findUnique({
    where: { id },
    include: {
      _count: {
        select: { bankCards: true },
      },
    },
  });
  
  if (!bank) {
    throw new BusinessError('BANK_NOT_FOUND', '银行不存在', 404);
  }
  
  // 检查是否有关联的银行卡
  if (bank._count.bankCards > 0) {
    throw new BusinessError(
      'BANK_HAS_CARDS',
      `该银行有 ${bank._count.bankCards} 张关联的银行卡，无法删除`,
      400
    );
  }
  
  await prisma.bank.delete({
    where: { id },
  });
  
  // 清除缓存
  await clearBankCache();
}

/**
 * 启用/禁用银行
 * @description 依据：02.4-后台API接口清单.md 第12.10节
 */
export async function updateBankStatus(
  id: number,
  isActive: boolean
): Promise<{ id: number; isActive: boolean }> {
  const bank = await prisma.bank.findUnique({
    where: { id },
  });
  
  if (!bank) {
    throw new BusinessError('BANK_NOT_FOUND', '银行不存在', 404);
  }
  
  await prisma.bank.update({
    where: { id },
    data: { isActive },
  });
  
  // 清除缓存
  await clearBankCache();
  
  return { id, isActive };
}

/**
 * 批量更新银行排序
 * @description 依据：02.4-后台API接口清单.md 第12.11节
 */
export async function updateBankSort(
  items: Array<{ id: number; sortOrder: number }>
): Promise<void> {
  await prisma.$transaction(
    items.map(item =>
      prisma.bank.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );
  
  // 清除缓存
  await clearBankCache();
}

/**
 * 批量启用/禁用银行
 * @description 依据：02.4-后台API接口清单.md 第12.12节
 */
export async function batchUpdateBankStatus(
  ids: number[],
  isActive: boolean
): Promise<{
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{ id: number; success: boolean; error?: { code: string; message: string } }>;
}> {
  const results: Array<{ id: number; success: boolean; error?: { code: string; message: string } }> = [];
  let succeeded = 0;
  let failed = 0;
  
  for (const id of ids) {
    try {
      await prisma.bank.update({
        where: { id },
        data: { isActive },
      });
      results.push({ id, success: true });
      succeeded++;
    } catch (error) {
      results.push({
        id,
        success: false,
        error: { code: 'UPDATE_FAILED', message: '更新失败' },
      });
      failed++;
    }
  }
  
  // 清除缓存
  await clearBankCache();
  
  return {
    total: ids.length,
    succeeded,
    failed,
    results,
  };
}

/**
 * 检查银行编码唯一性
 * @description 依据：02.4-后台API接口清单.md 第12.13节
 */
export async function checkBankCodeExists(code: string): Promise<boolean> {
  const bank = await prisma.bank.findUnique({
    where: { code: code.toUpperCase() },
  });
  return bank !== null;
}

// ================================
// 动画配置服务
// ================================

/**
 * 获取动画配置
 * @description 依据：02.4-后台API接口清单.md 第12.10节
 */
export async function getAnimationConfig(): Promise<{
  animationEnabled: boolean;
  animationSpeed: number;
  reducedMotion: boolean;
  celebrationEffect: boolean;
  pageTransition: boolean;
  skeletonLoading: boolean;
  pullToRefresh: boolean;
}> {
  const config = await prisma.animationConfig.findFirst();
  
  if (!config) {
    return {
      animationEnabled: true,
      animationSpeed: 1.0,
      reducedMotion: false,
      celebrationEffect: true,
      pageTransition: true,
      skeletonLoading: true,
      pullToRefresh: true,
    };
  }
  
  return {
    animationEnabled: config.animationEnabled,
    animationSpeed: Number(config.animationSpeed),
    reducedMotion: config.reducedMotion,
    celebrationEffect: config.celebrationEffect,
    pageTransition: config.pageTransition,
    skeletonLoading: config.skeletonLoading,
    pullToRefresh: config.pullToRefresh,
  };
}

/**
 * 更新动画配置
 * @description 依据：02.4-后台API接口清单.md 第12.10节
 */
export async function updateAnimationConfig(data: {
  animationEnabled?: boolean;
  animationSpeed?: number;
  reducedMotion?: boolean;
  celebrationEffect?: boolean;
  pageTransition?: boolean;
  skeletonLoading?: boolean;
  pullToRefresh?: boolean;
}): Promise<void> {
  // 查找现有配置
  const existing = await prisma.animationConfig.findFirst();
  
  if (existing) {
    await prisma.animationConfig.update({
      where: { id: existing.id },
      data: {
        animationEnabled: data.animationEnabled,
        animationSpeed: data.animationSpeed,
        reducedMotion: data.reducedMotion,
        celebrationEffect: data.celebrationEffect,
        pageTransition: data.pageTransition,
        skeletonLoading: data.skeletonLoading,
        pullToRefresh: data.pullToRefresh,
      },
    });
  } else {
    await prisma.animationConfig.create({
      data: {
        animationEnabled: data.animationEnabled ?? true,
        animationSpeed: data.animationSpeed ?? 1.0,
        reducedMotion: data.reducedMotion ?? false,
        celebrationEffect: data.celebrationEffect ?? true,
        pageTransition: data.pageTransition ?? true,
        skeletonLoading: data.skeletonLoading ?? true,
        pullToRefresh: data.pullToRefresh ?? true,
      },
    });
  }
  
  // 清除缓存
  await deleteCache(CACHE_KEYS.ANIMATION.CONFIG);
}

// ================================
// 页面配置服务
// ================================

/**
 * 获取页面配置
 * @description 依据：02.4-后台API接口清单.md 第13节
 */
export async function getPageConfig(pageType: string): Promise<{
  id: number;
  pageType: string;
  config: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  const config = await prisma.pageConfig.findUnique({
    where: { pageType },
  });
  
  if (!config) {
    return null;
  }
  
  return {
    id: config.id,
    pageType: config.pageType,
    config: config.config as Record<string, unknown>,
    version: config.version,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

/**
 * 更新页面配置
 * @description 依据：02.4-后台API接口清单.md 第13节
 */
export async function updatePageConfig(
  pageType: string,
  config: Record<string, unknown>
): Promise<{ version: number }> {
  // 查找现有配置
  const existing = await prisma.pageConfig.findUnique({
    where: { pageType },
  });
  
  if (existing) {
    // 合并配置
    const mergedConfig = {
      ...(existing.config as Record<string, unknown>),
      ...config,
    };
    
    const updated = await prisma.pageConfig.update({
      where: { pageType },
      data: {
        config: mergedConfig as Prisma.InputJsonValue,
        version: { increment: 1 },
      },
    });
    
    // 清除对应页面缓存
    await clearPageConfigCache(pageType);
    
    return { version: updated.version };
  } else {
    const created = await prisma.pageConfig.create({
      data: {
        pageType,
        config: config as Prisma.InputJsonValue,
        version: 1,
      },
    });
    
    // 清除对应页面缓存
    await clearPageConfigCache(pageType);
    
    return { version: created.version };
  }
}

/**
 * 清除页面配置缓存
 */
async function clearPageConfigCache(pageType: string): Promise<void> {
  const cacheKeyMap: Record<string, string> = {
    home: CACHE_KEYS.PAGE.HOME,
    profile: CACHE_KEYS.PAGE.PROFILE,
    product: CACHE_KEYS.PAGE.PRODUCT,
    products: CACHE_KEYS.PAGE.PRODUCT,
  };
  
  const cacheKey = cacheKeyMap[pageType];
  if (cacheKey) {
    await deleteCache(cacheKey);
  }
}
