/**
 * @file 全局配置类型定义
 * @description 全局配置页相关类型定义
 * @depends 开发文档/04-后台管理端/04.9-系统设置/04.9.1-全局配置页.md
 */

/**
 * 空状态配置
 */
export interface EmptyStateConfig {
  /** 图片URL */
  imageUrl: string;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description: string;
  /** 按钮文字（可选） */
  buttonText?: string;
  /** 按钮跳转链接（可选） */
  buttonLink?: string;
}

/**
 * 全局配置数据结构
 * @description 依据：开发文档.md 第2节、第3节、第13.11节
 */
export interface GlobalConfigData {
  // === 基础信息（2.1节）===
  siteName: string;
  siteDomain: string;
  siteLogoUrl: string;
  currencySymbol: string;
  currencySpace: boolean;
  phoneAreaCode: string;

  // === 时区配置（3.1节）===
  systemTimezone: string;
  timezoneDisplayName: string;

  // === 客服时间（2.1节）===
  serviceTimeRange: string;

  // === 财务配置（2.2节）===
  withdrawFeePercent: number;
  withdrawLimitDaily: number;
  withdrawTimeRange: string;
  withdrawMinAmount: string;
  withdrawMaxAmount: string;
  withdrawQuickAmounts: number[];
  registerBonus: string;
  registerIpLimit: number;

  // === 充值配置（2.3节）===
  rechargePresets: number[];
  rechargeMinAmount: string;
  rechargeMaxAmount: string;
  rechargeTimeoutMinutes: number;
  rechargeMaxPending: number;
  rechargePageTips: string;
  withdrawPageTips: string;

  // === 银行卡配置（2.4节）===
  maxBindcardCount: number;

  // === 返佣配置（4.5节）===
  commissionLevel1Rate: number;
  commissionLevel2Rate: number;
  commissionLevel3Rate: number;

  // === 安全配置（2.7节）===
  tokenExpiresDays: number;
  tokenRenewThresholdDays: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordComplexityRequired: boolean;
  passwordStrengthIndicator: boolean;

  // === API速率限制（2.8节）===
  rateLimitGlobal: number;
  rateLimitLogin: number;
  rateLimitRegister: number;
  rateLimitRecharge: number;
  rateLimitWithdraw: number;
  rateLimitSignin: number;

  // === Toast配置（13.11.8节）===
  toastDuration: number;
  toastPosition: string;

  // === 用户头像/昵称配置（13.11.9节）===
  avatarMaxSize: number;
  avatarFormats: string;
  nicknameMinLength: number;
  nicknameMaxLength: number;
  sensitiveWordFilterEnabled: boolean;

  // === 列表与筛选配置（13.11.13节）===
  transactionTimeFilterEnabled: boolean;
  defaultPageSize: number;
  pageSizeOptions: number[];

  // === 连续签到配置（13.11.14节）===
  signinStreakDisplayEnabled: boolean;
  signinStreakRewardEnabled: boolean;
  signinStreak7DaysReward: string;
  signinStreak30DaysReward: string;

  // === 心跳配置（13.23节）===
  heartbeatInterval: number;
  heartbeatTimeout: number;

  // === 收益发放配置（8.5节）===
  incomeMaxRetryCount: number;

  // === 定时任务告警配置（13.20.3节）===
  taskFailureAlertEnabled: boolean;
  taskConsecutiveFailureThreshold: number;
  taskExecutionTimeoutThreshold: number;
  taskAlertMethod: string[];

  // === 文件上传限制配置（19.2节）===
  productImageMaxSize: number;
  bannerMaxSize: number;
  posterBgMaxSize: number;
  allowedImageTypes: string;

  // === 提示文案配置（13.11.6节）===
  withdrawThresholdNotMetTip: string;
  insufficientBalanceTip: string;
  vipLevelRequiredTip: string;
  logoutConfirmTip: string;

  // === 空状态配置（13.11.7节）===
  emptyStatePositions: EmptyStateConfig;
  emptyStateRecharge: EmptyStateConfig;
  emptyStateWithdraw: EmptyStateConfig;
  emptyStateTransaction: EmptyStateConfig;
  emptyStateTeam: EmptyStateConfig;
  emptyStateMessage: EmptyStateConfig;

  // === 功能开关（13.24节）===
  svipRewardEnabled: boolean;
  weeklySalaryEnabled: boolean;
  prizePoolEnabled: boolean;
  spinWheelEnabled: boolean;
  communityEnabled: boolean;
  financialProductEnabled: boolean;

  // === 提现前置条件（2.5节）===
  withdrawRequireRecharge: boolean;
  withdrawRequirePurchase: boolean;

  // === 转盘配置（13.25节）===
  spinMaxDaily: number;
  spinInviteThreshold: number;

  // === 货币格式化（2.1.2节）===
  currencyDecimals: number;
  currencyThousandsSep: string;
  currencyCode: string;

  // === 版本信息 ===
  globalConfigVersion: number;
  globalConfigUpdatedAt: string;
}

/**
 * 全局配置表单值类型
 * @description 用于表单数据处理，部分字段需转换
 */
export interface GlobalConfigFormValues extends Omit<GlobalConfigData, 'withdrawTimeRange' | 'avatarMaxSize'> {
  /** 提现开始时间（从 withdrawTimeRange 拆分） */
  withdrawStartTime: string;
  /** 提现结束时间（从 withdrawTimeRange 拆分） */
  withdrawEndTime: string;
  /** 头像大小限制（MB，需要从 bytes 转换） */
  avatarMaxSizeMB: number;
}

/**
 * 更新配置响应
 */
export interface UpdateConfigResponse {
  /** 新版本号 */
  globalConfigVersion: number;
  /** 更新时间 */
  globalConfigUpdatedAt: string;
}

/**
 * 时区选项
 */
export interface TimezoneOption {
  value: string;
  label: string;
}

/**
 * 预置时区选项
 * @description 依据：04.9.1-全局配置页.md 第2节 - 时区配置
 */
export const TIMEZONE_OPTIONS: TimezoneOption[] = [
  { value: 'Africa/Casablanca', label: '摩洛哥时间 (UTC+1)' },
  { value: 'America/Mexico_City', label: '墨西哥时间 (UTC-6)' },
  { value: 'America/Sao_Paulo', label: '巴西时间 (UTC-3)' },
  { value: 'America/Buenos_Aires', label: '阿根廷时间 (UTC-3)' },
  { value: 'America/Santiago', label: '智利时间 (UTC-3)' },
  { value: 'Asia/Shanghai', label: '中国时间 (UTC+8)' },
  { value: 'Asia/Tokyo', label: '日本时间 (UTC+9)' },
  { value: 'Asia/Singapore', label: '新加坡时间 (UTC+8)' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0)' },
  { value: 'Europe/Paris', label: '巴黎时间 (UTC+1)' },
  { value: 'UTC', label: 'UTC 标准时间' },
];

/**
 * Toast位置选项
 */
export const TOAST_POSITION_OPTIONS = [
  { value: 'top-left', label: '左上角' },
  { value: 'top-center', label: '顶部居中' },
  { value: 'top-right', label: '右上角' },
  { value: 'bottom-left', label: '左下角' },
  { value: 'bottom-center', label: '底部居中' },
  { value: 'bottom-right', label: '右下角' },
];

/**
 * 关键配置字段（修改需二次确认）
 * @description 依据：04.9.1-全局配置页.md 交互规范第3节
 */
export const CRITICAL_CONFIG_FIELDS = [
  'withdrawFeePercent',
  'commissionLevel1Rate',
  'commissionLevel2Rate',
  'commissionLevel3Rate',
  'registerBonus',
  'systemTimezone',
] as const;
