/**
 * 常量定义
 */

// 订单号规则
export const ORDER_NO = {
  LENGTH: 20,
  PREFIX: {
    RECHARGE: 'RC',
    WITHDRAW: 'WD',
    POSITION: 'PO',
  },
} as const;

// 默认配置值
export const DEFAULT_CONFIG = {
  // 基础信息
  SITE_NAME: 'lendlease',
  SITE_DOMAIN: 'lles-ma.com',
  CURRENCY_SYMBOL: 'MAD',
  CURRENCY_SPACE: true,
  PHONE_AREA_CODE: '+212',
  SYSTEM_TIMEZONE: 'Africa/Casablanca',
  TIMEZONE_DISPLAY_NAME: 'توقيت المغرب (UTC+1)',

  // 财务配置
  WITHDRAW_FEE_PERCENT: 12,
  WITHDRAW_LIMIT_DAILY: 1,
  WITHDRAW_TIME_RANGE: '10:00-17:00',
  WITHDRAW_MIN_AMOUNT: 50,
  WITHDRAW_MAX_AMOUNT: 500000,
  REGISTER_BONUS: 30,
  REGISTER_IP_LIMIT: 5,
  RECHARGE_PRESETS: [100, 300, 500, 1000, 3000],
  RECHARGE_MIN_AMOUNT: 100,
  RECHARGE_MAX_AMOUNT: 500000,
  RECHARGE_TIMEOUT_MINUTES: 30,
  RECHARGE_MAX_PENDING: 5,
  MAX_BINDCARD_COUNT: 3,

  // 返佣配置
  COMMISSION_LEVEL1_RATE: 20,
  COMMISSION_LEVEL2_RATE: 3,
  COMMISSION_LEVEL3_RATE: 2,

  // 安全配置
  TOKEN_EXPIRE_DAYS: 7,
  PASSWORD_MIN_LENGTH: 8,
  RATE_LIMIT_GLOBAL: 120,
  RATE_LIMIT_LOGIN: 10,
  RATE_LIMIT_REGISTER: 5,

  // 免审核提现配置
  AUTO_APPROVE_ENABLED: false,
  AUTO_APPROVE_AMOUNT: 100,
  AUTO_APPROVE_DAILY_LIMIT: 1,
  AUTO_APPROVE_TIME_RANGE: '00:00-23:59',
  AUTO_APPROVE_COOLDOWN_DAYS: 0,

  // 动画配置
  ANIMATION_ENABLED: true,
  ANIMATION_SPEED: 1,
  REDUCED_MOTION: false,
  CELEBRATION_EFFECT: true,
  PAGE_TRANSITION: true,
} as const;

// 用户等级
export const USER_LEVELS = {
  VIP: {
    MIN: 0,
    MAX: 12,
  },
  SVIP: {
    MIN: 0,
    MAX: 12,
  },
} as const;

// 缓存键前缀
export const CACHE_KEYS = {
  // 配置缓存
  CONFIG_GLOBAL: 'config:global',
  CONFIG_VERSION: 'config:version',
  CONFIG_TEXT_VERSION: 'config:text_version',
  TEXT: 'text:ar',

  // 用户缓存
  USER_INFO: 'user:{id}:info',

  // 产品缓存
  PRODUCT_LIST: 'product:list',

  // 银行缓存
  BANK_LIST: 'bank:list',

  // 页面配置缓存
  PAGE_HOME: 'page:home',
  PAGE_PROFILE: 'page:profile',
  PAGE_PRODUCT: 'page:product',

  // 动画配置缓存
  ANIMATION_CONFIG: 'animation:config',

  // 在线用户
  ONLINE_USERS: 'online:users',
  ONLINE_COUNT: 'online:count',

  // 限流键
  RATE_LIMIT: 'rate_limit:{key}:{type}:{id}',

  // 分布式锁
  LOCK_WITHDRAW: 'lock:withdraw:{userId}',
  LOCK_PURCHASE: 'lock:purchase:{userId}:{productId}',
  LOCK_SIGNIN: 'lock:signin:{userId}',
  LOCK_REWARD: 'lock:reward:{userId}:{activityCode}',
} as const;

// 缓存过期时间（秒）
export const CACHE_TTL = {
  CONFIG_GLOBAL: 300, // 5分钟
  CONFIG_TEXT: 300, // 5分钟
  USER_INFO: 600, // 10分钟
  PRODUCT_LIST: 300, // 5分钟
  BANK_LIST: 3600, // 1小时
  PAGE_CONFIG: 300, // 5分钟
  ANIMATION_CONFIG: 600, // 10分钟
  ONLINE_COUNT: 60, // 1分钟
} as const;

// 活动代码（必须与数据库 Activity.code 一致）
export const ACTIVITY_CODES = {
  NORMAL_SIGNIN: 'NORMAL_SIGNIN',
  SVIP_SIGNIN: 'SVIP_SIGNIN',
  INVITE_REWARD: 'INVITE_REWARD',
  COLLECTION_BONUS: 'COLLECTION_BONUS',
} as const;
