/**
 * @file 全局配置状态管理
 * @description 管理系统全局配置，支持自动同步
 * @depends 开发文档/04-后台管理端/04.0-后台架构.md 第9节 - 全局配置管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAdminToken } from '@/stores/admin';
import { DEFAULT_TIMEZONE, DEFAULT_TIMEZONE_DISPLAY_NAME } from '@/utils/timezone-defaults';

/**
 * 全局配置类型
 * @description 依据：02.1-数据库设计.md GlobalConfig 表结构
 */
export interface GlobalConfig {
  // === 基础信息 ===
  siteName: string;
  siteDomain: string;
  siteLogoUrl: string;
  currencySymbol: string;
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
 * 默认配置值
 */
const defaultConfig: GlobalConfig = {
  siteName: 'lendlease',
  siteDomain: '',
  siteLogoUrl: '/logo.png',
  currencySymbol: 'MAD',
  currencySpace: true,
  phoneAreaCode: '+212',
  systemTimezone: DEFAULT_TIMEZONE,
  timezoneDisplayName: DEFAULT_TIMEZONE_DISPLAY_NAME,
  withdrawFeePercent: 10,
  withdrawLimitDaily: 1,
  withdrawTimeRange: '10:00-17:00',
  withdrawMinAmount: '12000',
  withdrawMaxAmount: '50000000',
  withdrawQuickAmounts: [12000, 25000, 50000, 100000],
  registerBonus: '3000',
  registerIpLimit: 5,
  rechargePresets: [50000, 100000, 200000, 500000, 1000000],
  rechargeMinAmount: '50000',
  rechargeMaxAmount: '50000000',
  rechargeTimeoutMinutes: 30,
  rechargeMaxPending: 3,
  rechargePageTips: '',
  withdrawPageTips: '',
  maxBindcardCount: 5,
  commissionLevel1Rate: 8,
  commissionLevel2Rate: 3,
  commissionLevel3Rate: 2,
  tokenExpiresDays: 7,
  tokenRenewThresholdDays: 1,
  passwordMinLength: 6,
  passwordComplexityRequired: false,
  passwordStrengthIndicator: true,
  rateLimitGlobal: 60,
  rateLimitLogin: 5,
  rateLimitRegister: 3,
  rateLimitRecharge: 10,
  rateLimitWithdraw: 10,
  rateLimitSignin: 1,
  toastDuration: 3000,
  toastPosition: 'top',
  avatarMaxSize: 2,
  avatarFormats: 'jpg,png,jpeg',
  nicknameMaxLength: 20,
  sensitiveWordFilterEnabled: true,
  transactionTimeFilterEnabled: true,
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  signinStreakDisplayEnabled: true,
  signinStreakRewardEnabled: false,
  signinStreak7DaysReward: '0',
  signinStreak30DaysReward: '0',
  heartbeatInterval: 60,
  heartbeatTimeout: 120,
  incomeMaxRetryCount: 3,
  // === 提示文案配置（用户端默认值使用阿拉伯语）===
  withdrawThresholdNotMetTip: '',
  insufficientBalanceTip: '',
  vipLevelRequiredTip: '',
  logoutConfirmTip: 'هل أنت متأكد من تسجيل الخروج؟',
  // === 空状态配置（用户端默认值使用阿拉伯语）===
  emptyStatePositions: {
    imageUrl: '/images/empty/positions.png',
    title: 'لا توجد مراكز',
    description: 'لم تقم بشراء أي منتج بعد',
    buttonText: 'شراء',
    buttonLink: '/products',
  },
  emptyStateRecharge: {
    imageUrl: '/images/empty/recharge.png',
    title: 'لا توجد سجلات إيداع',
    description: 'لم تقم بأي إيداع بعد',
  },
  emptyStateWithdraw: {
    imageUrl: '/images/empty/withdraw.png',
    title: 'لا توجد سجلات سحب',
    description: 'لم تقم بأي سحب بعد',
  },
  emptyStateTransaction: {
    imageUrl: '/images/empty/transaction.png',
    title: 'لا توجد معاملات',
    description: 'لا يوجد لديك أي سجل معاملات بعد',
  },
  emptyStateTeam: {
    imageUrl: '/images/empty/team.png',
    title: 'لا يوجد أعضاء في الفريق',
    description: 'ادعُ أصدقاءك للانضمام إلى فريقك',
    buttonText: 'دعوة',
    buttonLink: '/invite',
  },
  emptyStateMessage: {
    imageUrl: '/images/empty/message.png',
    title: 'لا توجد رسائل',
    description: 'لم تتلقَ أي رسائل بعد',
  },
  globalConfigVersion: 1,
  globalConfigUpdatedAt: new Date().toISOString(),
};

interface ConfigState {
  /** 全局配置 */
  config: GlobalConfig;
  /** 配置版本号 */
  version: number;
  /** 最后更新时间 */
  updatedAt: string;
  /** 是否加载中 */
  isLoading: boolean;
  /** 是否已初始化 */
  isInitialized: boolean;

  /** 设置配置 */
  setConfig: (config: Partial<GlobalConfig>) => void;
  /** 获取配置 */
  fetchConfig: () => Promise<void>;
  /** 检查版本更新 */
  checkVersion: () => Promise<boolean>;
  /** 重置为默认配置 */
  reset: () => void;
}

/**
 * 全局配置 Store
 * @description 使用 persist 中间件持久化到 localStorage
 */
export const useGlobalConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: defaultConfig,
      version: 0,
      updatedAt: '',
      isLoading: false,
      isInitialized: false,

      setConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },

      fetchConfig: async () => {
        set({ isLoading: true });
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const token = getAdminToken();
          
          const response = await fetch(`${apiUrl}/api/admin/config`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          });
          
          if (!response.ok) {
            throw new Error('获取配置失败');
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            set({
              config: { ...defaultConfig, ...result.data },
              version: result.data.globalConfigVersion || 1,
              updatedAt: result.data.globalConfigUpdatedAt || new Date().toISOString(),
              isLoading: false,
              isInitialized: true,
            });
          } else {
            set({ isLoading: false, isInitialized: true });
          }
        } catch (error) {
          console.error('获取全局配置失败:', error);
          set({ isLoading: false, isInitialized: true });
        }
      },

      checkVersion: async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
          const token = getAdminToken();
          
          const response = await fetch(`${apiUrl}/api/config/versions`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
          });
          
          if (!response.ok) {
            return false;
          }
          
          const result = await response.json();
          
          if (result.success && result.data) {
            const { globalConfigVersion, globalConfigUpdatedAt } = result.data;
            const { version, updatedAt } = get();

            // 双重校验：版本号或更新时间变化则需要刷新
            const needRefresh =
              globalConfigVersion !== version ||
              new Date(globalConfigUpdatedAt) > new Date(updatedAt);

            if (needRefresh) {
              await get().fetchConfig();
            }

            return needRefresh;
          }

          return false;
        } catch (error) {
          console.error('检查配置版本失败:', error);
          return false;
        }
      },

      reset: () => {
        set({
          config: defaultConfig,
          version: 0,
          updatedAt: '',
          isLoading: false,
          isInitialized: false,
        });
      },
    }),
    {
      name: 'admin-config',
      partialize: (state) => ({
        config: state.config,
        version: state.version,
        updatedAt: state.updatedAt,
      }),
    }
  )
);

/**
 * 获取货币符号配置
 */
export function getCurrencyConfig(): { symbol: string; space: boolean } {
  const { config } = useGlobalConfigStore.getState();
  return {
    symbol: config.currencySymbol,
    space: config.currencySpace,
  };
}

/**
 * 获取时区配置
 */
export function getTimezoneConfig(): { timezone: string; displayName: string } {
  const { config } = useGlobalConfigStore.getState();
  return {
    timezone: config.systemTimezone,
    displayName: config.timezoneDisplayName,
  };
}
