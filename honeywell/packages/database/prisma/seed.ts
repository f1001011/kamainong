/**
 * @file 种子数据初始化脚本
 * @description 初始化系统运行所需的基础数据
 * @depends 开发文档/02-数据层/02.1-数据库设计.md - 所有表的初始化数据要求
 * @depends 开发文档/05-服务架构/05.3-定时任务.md - 第4节 初始化数据
 *
 * 运行方式：pnpm db:seed
 */

import { PrismaClient } from '../generated/prisma';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

// 产品类型枚举（与 Prisma Schema 一致）
const ProductType = {
  TRIAL: 'TRIAL',
  PAID: 'PAID',
  FINANCIAL: 'FINANCIAL',
} as const;

// 产品系列枚举（与 Prisma Schema 一致）
const ProductSeries = {
  PO: 'PO',
  VIP: 'VIP',
  VIC: 'VIC',
  NWS: 'NWS',
  QLD: 'QLD',
  FINANCIAL: 'FINANCIAL',
} as const;

/**
 * 产品种子数据类型定义
 * 用于确保所有产品属性的类型安全
 */
interface ProductSeedData {
  code: string;
  name: string;
  type: typeof ProductType[keyof typeof ProductType];
  series: typeof ProductSeries[keyof typeof ProductSeries];
  price: Decimal;
  dailyIncome: Decimal;
  cycleDays: number;
  totalIncome: Decimal;
  grantVipLevel: number;
  grantSvipLevel: number;
  requireVipLevel: number;
  purchaseLimit: number;
  showRecommendBadge?: boolean;
  customBadgeText?: string | null;
  mainImage?: string | null;
  sortOrder: number;
  globalStock?: number | null;
  globalSold?: number;
  userPurchaseLimit?: number | null;
  displayUserLimit?: number | null;
  svipDailyReward?: Decimal | null;
  svipRequireCount?: number | null;
  returnPrincipal?: boolean;
  productStatus?: string;
}

async function main() {
  console.log('🌱 开始初始化种子数据...\n');

  // 1. 初始化银行列表（10家摩洛哥银行）
  await seedBanks();

  // 2. 初始化定时任务配置（6个任务）
  await seedScheduledTasks();

  // 3. 初始化全局配置
  await seedGlobalConfig();

  // 4. 初始化默认管理员
  await seedAdmin();

  // 5. 初始化活动配置
  await seedActivities();

  // 6. 初始化页面配置
  await seedPageConfigs();

  // 7. 初始化动画配置
  await seedAnimationConfig();

  // 8. 初始化页面内容
  await seedPageContents();

  // 9. 初始化产品数据（开发测试用）
  await seedProducts();

  // 10. 初始化文案配置
  await seedTexts();

  // 11. 初始化轮播图（Banner）
  await seedBanners();

  // 12. 初始化系统公告
  await seedAnnouncements();

  // 13. 初始化客服链接
  await seedServiceLinks();

  // 14. 初始化周薪档位
  await seedWeeklySalaryTiers();

  // 15. 初始化奖池
  await seedPrizePool();

  // 16. 初始化转盘奖品
  await seedSpinWheelPrizes();

  // 17. 初始化社区奖励档位
  await seedCommunityRewardTiers();

  console.log('\n✅ 种子数据初始化完成！');
}

// ================================
// 1. 银行列表初始化
// ================================

/**
 * 初始化银行列表
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.12节 - 初始化银行列表（10家摩洛哥银行）
 */
async function seedBanks() {
  console.log('🏦 初始化银行列表...');

  // 摩洛哥银行编码表（LWPAY 961通道仅支持 ATT/BMCE/CIH/AL 四家银行）
  const banks = [
    { code: 'MAD001', name: 'Attijariwafa Bank', sortOrder: 1, isActive: true },
    { code: 'MAD002', name: 'BMCE Bank of Africa', sortOrder: 2, isActive: true },
    { code: 'MAD003', name: 'Banque Populaire', sortOrder: 3, isActive: false },
    { code: 'MAD004', name: 'CIH Bank', sortOrder: 4, isActive: true },
    { code: 'MAD005', name: 'BMCI', sortOrder: 5, isActive: false },
    { code: 'MAD006', name: 'Crédit du Maroc', sortOrder: 6, isActive: false },
    { code: 'MAD007', name: 'Société Générale Maroc', sortOrder: 7, isActive: false },
    { code: 'MAD008', name: 'Al Barid Bank', sortOrder: 8, isActive: true },
    { code: 'MAD009', name: 'CDG Capital', sortOrder: 9, isActive: false },
    { code: 'MAD010', name: 'Crédit Agricole du Maroc', sortOrder: 10, isActive: false },
  ];

  for (const bank of banks) {
    await prisma.bank.upsert({
      where: { code: bank.code },
      update: { name: bank.name, sortOrder: bank.sortOrder, isActive: bank.isActive },
      create: bank,
    });
  }

  console.log(`  ✓ 已创建 ${banks.length} 个摩洛哥银行`);
}

// ================================
// 2. 定时任务配置初始化
// ================================

/**
 * 初始化定时任务配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.10节 定时任务清单
 * @description 依据：开发文档/05-服务架构/05.3-定时任务.md 第4节 初始化数据
 */
async function seedScheduledTasks() {
  console.log('⏰ 初始化定时任务配置...');

  // 依据：开发文档.md 第14.4节 - 定时任务清单
  const tasks = [
    {
      taskCode: 'income_settlement',
      taskName: '收益发放',
      description: '扫描待发放的收益记录，执行收益发放。最后一笔收益发放时同步完结持仓订单',
      cronExpression: '* * * * *', // 每分钟执行
      isEnabled: true,
    },
    {
      taskCode: 'recharge_timeout',
      taskName: '充值超时取消',
      description: '扫描超时未支付的充值订单，自动取消。超时时间从 GlobalConfig.recharge_timeout_minutes 读取',
      cronExpression: '* * * * *', // 每分钟执行
      isEnabled: true,
    },
    {
      taskCode: 'signin_window_expire',
      taskName: '签到窗口期过期检查',
      description: '检查并标记签到窗口期已过期的用户（注册后7天）',
      cronExpression: '0 0 * * *', // 每日00:00执行（系统时区）
      isEnabled: true,
    },
    {
      taskCode: 'channel_health_check',
      taskName: '支付通道状态检测',
      description: '检测支付通道的健康状态，更新成功率和响应时间',
      cronExpression: '*/5 * * * *', // 每5分钟执行
      isEnabled: true,
    },
    {
      taskCode: 'daily_stats',
      taskName: '数据统计汇总',
      description: '统计前一天的业务数据：新增用户、充值、提现、购买、收益、返佣等',
      cronExpression: '5 0 * * *', // 每日00:05执行（系统时区）
      isEnabled: true,
    },
    {
      taskCode: 'stats_archive',
      taskName: '统计数据归档',
      description: '归档历史统计数据，清理过期的临时数据',
      cronExpression: '30 0 * * *', // 每日00:30执行（系统时区）
      isEnabled: true,
    },
    {
      taskCode: 'svip_daily_reward',
      taskName: 'SVIP每日奖励',
      description: '每日为符合条件的SVIP用户发放每日奖励',
      cronExpression: '0 0 * * *', // 每日00:00执行
      isEnabled: true,
    },
    {
      taskCode: 'svip_level_update',
      taskName: 'SVIP等级更新',
      description: '检查并更新用户的SVIP等级',
      cronExpression: '5 0 * * *', // 每日00:05执行
      isEnabled: true,
    },
    {
      taskCode: 'prize_pool_reset',
      taskName: '奖池每日重置',
      description: '每日重置奖池剩余金额',
      cronExpression: '0 0 * * *', // 每日00:00执行
      isEnabled: true,
    },
  ];

  for (const task of tasks) {
    await prisma.scheduledTask.upsert({
      where: { taskCode: task.taskCode },
      update: {
        taskName: task.taskName,
        description: task.description,
        cronExpression: task.cronExpression,
      },
      create: task,
    });
  }

  console.log(`  ✓ 已创建 ${tasks.length} 个定时任务配置`);
}

// ================================
// 3. 全局配置初始化
// ================================

/**
 * 初始化全局配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.7节 GlobalConfig 核心配置项清单
 */
async function seedGlobalConfig() {
  console.log('⚙️ 初始化全局配置...');

  // 依据：开发文档.md 第2节 - 全局与基础配置
  const configs = [
    // === 基础配置（依据：第2.1节）===
    { key: 'site_name', value: 'lendlease', description: '网站名称' },
    { key: 'site_domain', value: 'LLES-MA.com', description: '网站域名' },
    { key: 'site_logo_url', value: '/images/logo.png', description: 'Logo图片URL' },
    { key: 'currency_symbol', value: 'MAD', description: '货币符号（摩洛哥迪拉姆）' },
    { key: 'currency_code', value: 'MAD', description: '货币代码' },
    { key: 'currency_space', value: true, description: '货币符号后是否有空格' },
    { key: 'phone_area_code', value: '+212', description: '手机区号（摩洛哥）' },

    // === 时区配置（依据：第3.1节）===
    { key: 'system_timezone', value: 'Africa/Casablanca', description: '系统时区' },
    { key: 'timezone_display_name', value: 'UTC+1 المغرب', description: '时区显示名称' },

    // === 提现配置（依据：第2.2节）===
    { key: 'withdraw_fee_percent', value: 12, description: '提现手续费率（百分比）' },
    { key: 'withdraw_limit_daily', value: 1, description: '每日提现次数限制' },
    { key: 'withdraw_time_range', value: '10:00-17:00', description: '提现时间窗口' },
    { key: 'withdraw_min_amount', value: 50, description: '最低提现金额' },
    { key: 'withdraw_max_amount', value: 500000, description: '最高提现金额' },
    { key: 'withdraw_quick_amounts', value: [50, 100, 300, 500], description: '提现快捷金额按钮' },
    { key: 'withdraw_page_tips', value: '<p>سيتم إيداع السحب خلال 1 إلى 3 أيام عمل</p>', description: '提现页提示文案（富文本）' },

    // === 充值配置（依据：第2.3节）===
    { key: 'recharge_presets', value: [100, 300, 500, 1000, 3000], description: '充值档位' },
    { key: 'recharge_min_amount', value: 100, description: '最小充值金额' },
    { key: 'recharge_max_amount', value: 500000, description: '最大充值金额（与充值档位最大值一致）' },
    { key: 'recharge_timeout_minutes', value: 30, description: '充值超时分钟数' },
    { key: 'recharge_max_pending', value: 5, description: '最大待支付订单数' },
    { key: 'recharge_page_tips', value: '<p>أكمل الدفع خلال 30 دقيقة</p>', description: '充值页提示文案（富文本）' },

    // === 注册配置（依据：第2.2节）===
    { key: 'register_bonus', value: 30, description: '注册奖励金额' },
    { key: 'register_ip_limit', value: 5, description: '同IP注册限制数量' },

    // === 银行卡配置（依据：第2.4节）===
    { key: 'max_bindcard_count', value: 3, description: '最大绑卡数量' },

    // === 返佣配置（依据：第4.5节）===
    { key: 'commission_level1_rate', value: 20, description: '一级返佣比例（百分比）' },
    { key: 'commission_level2_rate', value: 3, description: '二级返佣比例（百分比）' },
    { key: 'commission_level3_rate', value: 2, description: '三级返佣比例（百分比）' },

    // === 版本管理配置（依据：第1.0.2节）===
    { key: 'global_config_version', value: 1, description: '全局配置版本号' },
    { key: 'global_config_updated_at', value: new Date().toISOString(), description: '全局配置更新时间' },
    { key: 'texts_version', value: 1, description: '文案版本号' },
    { key: 'texts_updated_at', value: new Date().toISOString(), description: '文案更新时间' },
    { key: 'timezone_version', value: 1, description: '时区配置版本号' },
    { key: 'timezone_updated_at', value: new Date().toISOString(), description: '时区配置更新时间' },

    // === 心跳配置（依据：第13.23节）===
    { key: 'heartbeat_interval', value: 60, description: '心跳上报间隔（秒）' },
    { key: 'heartbeat_timeout', value: 120, description: '心跳超时时间（秒）' },

    // === 收益发放配置（依据：第8.5节）===
    { key: 'income_max_retry_count', value: 3, description: '收益发放最大重试次数' },

    // === Token配置（依据：第2.7节）===
    { key: 'token_expires_days', value: 7, description: 'Token有效期（天）' },
    { key: 'token_renew_threshold_days', value: 1, description: 'Token续期阈值（天）' },

    // === API速率限制配置（依据：第2.8节）===
    { key: 'rate_limit_global', value: 120, description: '单IP每分钟最大请求数' },
    { key: 'rate_limit_login', value: 10, description: '单IP每分钟最大登录尝试' },
    { key: 'rate_limit_register', value: 5, description: '单IP每分钟最大注册尝试' },
    { key: 'rate_limit_recharge', value: 10, description: '单用户每分钟最大充值请求' },
    { key: 'rate_limit_withdraw', value: 5, description: '单用户每分钟最大提现请求' },
    { key: 'rate_limit_signin', value: 5, description: '单用户每分钟最大签到请求' },

    // === 免审核提现配置（依据：第13.9.4节）===
    { key: 'auto_approve_enabled', value: false, description: '免审核开关' },
    { key: 'auto_approve_threshold', value: 100, description: '免审核金额阈值' },
    { key: 'auto_approve_daily_limit', value: 1, description: '每用户每日最多免审核次数' },
    { key: 'auto_approve_time_range', value: '00:00-23:59', description: '免审核时间窗口' },
    { key: 'auto_approve_new_user_days', value: 0, description: '新用户冷却期（天）' },

    // === 定时任务告警配置（依据：第13.20.3节）===
    { key: 'task_failure_alert_enabled', value: true, description: '任务失败告警开关' },
    { key: 'task_consecutive_failure_threshold', value: 3, description: '连续失败N次后告警' },
    { key: 'task_execution_timeout_threshold', value: 300, description: '执行超过N秒视为超时' },
    { key: 'task_alert_method', value: ['admin_notification'], description: '告警方式' },

    // === 文件上传限制配置（依据：第19.2节）===
    { key: 'avatar_max_size', value: 2097152, description: '用户头像最大尺寸（字节，2MB）' },
    { key: 'product_image_max_size', value: 5242880, description: '产品图片最大尺寸（字节，5MB）' },
    { key: 'banner_max_size', value: 5242880, description: 'Banner图片最大尺寸（字节，5MB）' },
    { key: 'poster_bg_max_size', value: 10485760, description: '邀请海报背景最大尺寸（字节，10MB）' },
    { key: 'allowed_image_types', value: 'JPG,PNG,GIF,WEBP', description: '支持的图片格式' },

    // === Toast配置（依据：第13.11.8节）===
    { key: 'toast_duration', value: 3000, description: 'Toast显示时长（毫秒）' },
    { key: 'toast_position', value: 'top-center', description: 'Toast显示位置' },

    // === 列表配置（依据：第13.11.13节）===
    { key: 'transaction_time_filter_enabled', value: true, description: '资金明细时间筛选开关' },
    { key: 'default_page_size', value: 20, description: '列表默认每页条数' },
    { key: 'page_size_options', value: [10, 20, 50, 100], description: '可选的分页大小' },

    // === 连续签到配置（依据：第13.11.14节）===
    { key: 'signin_streak_display_enabled', value: true, description: '连续签到展示开关' },
    { key: 'signin_streak_reward_enabled', value: false, description: '连续签到额外奖励开关' },
    { key: 'signin_streak_7_days_reward', value: 5, description: '7天连续签到奖励' },
    { key: 'signin_streak_30_days_reward', value: 20, description: '30天连续签到奖励' },

    // === 用户头像/昵称配置（依据：第13.11.9节）===
    { key: 'avatar_formats', value: 'JPG,PNG,GIF', description: '头像支持格式' },
    { key: 'nickname_min_length', value: 2, description: '昵称最小长度（字符数）' },
    { key: 'nickname_max_length', value: 20, description: '昵称最大长度（字符数）' },
    { key: 'sensitive_word_filter_enabled', value: true, description: '敏感词过滤开关' },

    // === 密码安全配置（依据：第13.11.4节）===
    { key: 'password_strength_indicator', value: true, description: '密码强度指示器开关' },
    { key: 'password_min_length', value: 6, description: '密码最小长度' },
    { key: 'password_max_length', value: 32, description: '密码最大长度' },
    { key: 'password_complexity_required', value: true, description: '密码复杂度要求（字母+数字）' },

    // === 客服配置（依据：第2.5节）===
    {
      key: 'service_links',
      value: [
        { name: 'خدمة العملاء', icon: '/images/icons/support.png', action: 'link', url: 'https://example.com/support' },
        { name: 'Telegram', icon: '/images/icons/telegram.png', action: 'link', url: 'https://t.me/honeywell_support' },
        { name: 'WhatsApp', icon: '/images/icons/whatsapp.png', action: 'link', url: 'https://wa.me/212608732761' },
      ],
      description: '客服链接配置',
    },

    // === 邀请海报配置（依据：第2.6节 + 02.3-API接口清单 第13.2节）===
    // 背景图配置
    { key: 'invite_poster_bg', value: '/images/poster/invite_bg.png', description: '海报背景图URL（建议尺寸：750x1334px）' },
    // 二维码位置配置（相对于海报尺寸的百分比位置）
    { key: 'invite_qr_position_x', value: 50, description: '二维码X坐标（百分比，50=居中）' },
    { key: 'invite_qr_position_y', value: 62, description: '二维码Y坐标（百分比，黄金分割位置）' },
    { key: 'invite_qr_size', value: 180, description: '二维码尺寸（像素，适合扫描识别）' },
    // 邀请码文字位置配置（依据：02.3-API接口清单 第13.2节 inviteCodePosition）
    { key: 'invite_code_position_x', value: 50, description: '邀请码X坐标（百分比，50=居中）' },
    { key: 'invite_code_position_y', value: 82, description: '邀请码Y坐标（百分比，二维码下方）' },
    { key: 'invite_code_font_size', value: 24, description: '邀请码字体大小（像素）' },
    { key: 'invite_code_color', value: '#C9A962', description: '邀请码字体颜色（金色，高端感）' },

    // === 空状态配置（依据：第13.11.7节）===
    {
      key: 'empty_state_positions',
      value: {
        imageUrl: '/images/empty/positions.png',
        title: 'لا توجد استثمارات',
        description: 'ليس لديك استثمارات نشطة بعد',
        buttonText: 'استكشاف المنتجات',
        buttonLink: '/products',
      },
      description: '持仓列表空状态配置',
    },
    {
      key: 'empty_state_recharge',
      value: {
        imageUrl: '/images/empty/recharge.png',
        title: 'لا توجد سجلات',
        description: 'ليس لديك سجلات إيداع بعد',
      },
      description: '充值记录空状态配置',
    },
    {
      key: 'empty_state_withdraw',
      value: {
        imageUrl: '/images/empty/withdraw.png',
        title: 'لا توجد سجلات',
        description: 'ليس لديك سجلات سحب بعد',
      },
      description: '提现记录空状态配置',
    },
    {
      key: 'empty_state_transaction',
      value: {
        imageUrl: '/images/empty/transaction.png',
        title: 'لا توجد معاملات',
        description: 'ليس لديك معاملات بعد',
      },
      description: '资金明细空状态配置',
    },
    {
      key: 'empty_state_team',
      value: {
        imageUrl: '/images/empty/team.png',
        title: 'لا يوجد أعضاء',
        description: 'ادعُ أصدقاءك لكسب عمولات',
        buttonText: 'ادعُ الآن',
        buttonLink: '/invite',
      },
      description: '团队成员空状态配置',
    },
    {
      key: 'empty_state_message',
      value: {
        imageUrl: '/images/empty/message.png',
        title: 'لا توجد رسائل',
        description: 'ليس لديك رسائل حالياً',
      },
      description: '消息列表空状态配置',
    },

    // === 页面提示文案配置（依据：第13.11.6节）===
    { key: 'withdraw_threshold_not_met_tip', value: 'يجب عليك الإيداع وشراء منتج لتتمكن من السحب', description: '提现门槛未满足提示（需充值+购买付费产品）' },
    { key: 'insufficient_balance_tip', value: 'رصيد غير كافٍ', description: '余额不足提示' },
    { key: 'logout_confirm_tip', value: 'هل أنت متأكد من تسجيل الخروج؟', description: '退出登录确认文案' },

    // === 签到配置 ===
    { key: 'signin_daily_reward', value: 5, description: '每日签到奖励金额' },

    // === 手机号配置 ===
    { key: 'phone_digit_count', value: 9, description: '手机号位数' },

    // === 客服时间配置 ===
    { key: 'service_time_range', value: '09:00-19:00', description: '客服服务时间' },

    // === 提现前置条件 ===
    { key: 'withdraw_require_recharge', value: true, description: '提现需先充值' },
    { key: 'withdraw_require_purchase', value: true, description: '提现需先购买产品' },

    // === 功能开关配置 ===
    { key: 'svip_reward_enabled', value: true, description: 'SVIP奖励功能开关' },
    { key: 'weekly_salary_enabled', value: true, description: '周薪功能开关' },
    { key: 'prize_pool_enabled', value: true, description: '奖池功能开关' },
    { key: 'spin_wheel_enabled', value: true, description: '转盘功能开关' },
    { key: 'community_enabled', value: true, description: '社区功能开关' },
    { key: 'financial_product_enabled', value: true, description: '理财产品功能开关' },

    // === 转盘配置 ===
    { key: 'spin_max_daily', value: 5, description: '每日最大转盘次数' },
    { key: 'spin_invite_threshold', value: 5, description: '转盘邀请门槛' },

    // === 货币格式化配置 ===
    { key: 'currency_decimals', value: 0, description: '货币小数位数' },
    { key: 'currency_thousands_sep', value: ',', description: '千位分隔符' },
  ];

  for (const config of configs) {
    await prisma.globalConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
  }

  console.log(`  ✓ 已创建 ${configs.length} 个全局配置项`);
}

// ================================
// 4. 默认管理员初始化
// ================================

/**
 * 初始化默认管理员
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.9节 - Admin表
 * @description 密码使用 bcrypt 哈希存储
 */
async function seedAdmin() {
  console.log('👤 初始化管理员账号...');

  // 使用 bcrypt 哈希密码（不可逆）
  const bcryptModule = await import('bcryptjs');
  const bcrypt = bcryptModule.default || bcryptModule;
  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nickname: '超级管理员',
      isActive: true,
    },
  });

  console.log('  ✓ 已创建管理员账号: admin / admin123');
  console.log('  ⚠️ 请在生产环境中修改默认密码！');
}

// ================================
// 5. 活动配置初始化
// ================================

/**
 * 初始化活动配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.13节 Activity表
 */
async function seedActivities() {
  console.log('🎉 初始化活动配置...');

  // 依据：开发文档.md 第9节 - 营销活动系统
  const activities = [
    // 普通用户3天签到（依据：活动2-普通用户签到规则）
    {
      code: 'NORMAL_SIGNIN',
      name: 'تسجيل الدخول اليومي',
      description: 'سجّل الدخول لمدة 3 أيام متتالية خلال 7 أيام من التسجيل للحصول على مكافآت',
      icon: '/images/activities/signin.png',
      config: {
        dailyReward: 5,     // 每日签到奖励金额（从GlobalConfig.signin_daily_reward读取）
        description: 'سجّل دخولك يومياً للحصول على مكافآت',
      },
      isActive: true,
      sortOrder: 1,
    },
    // SVIP每日签到（依据：活动1）
    {
      code: 'SVIP_SIGNIN',
      name: 'تسجيل دخول SVIP',
      description: 'مكافأة يومية إضافية لمستخدمي SVIP، قابلة للتراكم مع التسجيل العادي',
      icon: '/images/activities/svip-signin.png',
      config: {
        rewards: {
          SVIP1: 2,
          SVIP2: 4,
          SVIP3: 8,
          SVIP4: 15,
          SVIP5: 30,
          SVIP6: 50,
          SVIP7: 80,
          SVIP8: 120,
        },
      },
      isActive: false,
      sortOrder: 2,
    },
    // 拉新裂变活动（依据：活动2）
    {
      code: 'INVITE_REWARD',
      name: 'مكافأة الدعوة',
      description: 'ادعُ أصدقاءك للتسجيل وإكمال المتطلبات للحصول على مكافآت متدرجة',
      icon: '/images/activities/invite.png',
      config: {
        tiers: [
          { count: 1, reward: 10 },
          { count: 10, reward: 58 },
          { count: 30, reward: 198 },
          { count: 60, reward: 498 },
          { count: 100, reward: 998 },
        ],
      },
      isActive: true,
      sortOrder: 3,
    },
    // 连单奖励活动（依据：活动3）
    {
      code: 'COLLECTION_BONUS',
      name: 'مكافأة المجموعة',
      description: 'أكمل مجموعة منتجات VIP للحصول على مكافآت إضافية',
      icon: '/images/activities/collection.png',
      config: {
        // 前置条件描述（后台可配置）
        prerequisiteDescription: 'قم بالإيداع وشراء منتج',
        // 产品编码：VIC1-VIC5, NWS6-NWS9, QLD10-QLD12（与原始 7 档结构对应）
        tiers: [
          { products: ['VIC1', 'VIC2'], reward: 58, name: 'مبتدئ' },
          { products: ['VIC1', 'VIC2', 'VIC3'], reward: 168, name: 'متوسط' },
          { products: ['VIC1', 'VIC2', 'VIC3', 'VIC4'], reward: 388, name: 'متقدم' },
          { products: ['VIC1', 'VIC2', 'VIC3', 'VIC4', 'VIC5'], reward: 688, name: 'خبير' },
          { products: ['VIC1', 'VIC2', 'VIC3', 'VIC4', 'VIC5', 'NWS6'], reward: 1288, name: 'محترف' },
          { products: ['VIC1', 'VIC2', 'VIC3', 'VIC4', 'VIC5', 'NWS6', 'NWS7'], reward: 2588, name: 'أسطورة' },
          { products: ['VIC1', 'VIC2', 'VIC3', 'VIC4', 'VIC5', 'NWS6', 'NWS7', 'NWS8'], reward: 5888, name: 'أعلى' },
        ],
      },
      isActive: false,
      sortOrder: 4,
    },
    // 周薪活动
    {
      code: 'WEEKLY_SALARY',
      name: 'الراتب الأسبوعي',
      description: 'مكافأة أسبوعية بناءً على مبلغ الإيداع المتراكم',
      icon: '/images/activities/weekly-salary.png',
      config: {
        description: 'احصل على راتب أسبوعي حسب مستوى إيداعك',
      },
      isActive: true,
      sortOrder: 5,
    },
    // 奖池活动
    {
      code: 'PRIZE_POOL',
      name: 'الجائزة المتراكمة',
      description: 'ادعُ أصدقاءك للمشاركة في الجائزة المتراكمة اليومية',
      icon: '/images/activities/prize-pool.png',
      config: {
        description: 'جائزة يومية توزع بين المشاركين المؤهلين',
      },
      isActive: true,
      sortOrder: 6,
    },
    // 转盘活动
    {
      code: 'SPIN_WHEEL',
      name: 'عجلة الحظ',
      description: 'أدر العجلة للفوز بجوائز. ادعُ أصدقاءك للحصول على المزيد من المحاولات',
      icon: '/images/activities/spin-wheel.png',
      config: {
        description: 'أدر العجلة واربح جوائز رائعة',
      },
      isActive: true,
      sortOrder: 7,
    },
    // 社区活动
    {
      code: 'COMMUNITY',
      name: 'المجتمع',
      description: 'انضم إلى المجتمع واربح مكافآت من خلال المشاركة',
      icon: '/images/activities/community.png',
      config: {
        description: 'شارك في المجتمع واربح مكافآت',
      },
      isActive: true,
      sortOrder: 8,
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { code: activity.code },
      update: {
        name: activity.name,
        description: activity.description,
        icon: activity.icon,
        config: activity.config,
        sortOrder: activity.sortOrder,
      },
      create: activity,
    });
  }

  console.log(`  ✓ 已创建 ${activities.length} 个活动配置`);
}

// ================================
// 6. 页面配置初始化
// ================================

/**
 * 初始化页面配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.14节 PageConfig表
 */
async function seedPageConfigs() {
  console.log('📄 初始化页面配置...');

  const pageConfigs = [
    // 首页配置（与生产环境同步 2026-02-10）
    {
      pageType: 'home',
      config: {
        recommendEnabled: true,
        recommendTitle: 'المُوصى بها',
        recommendDisplayMode: 'scroll',
        recommendProductIds: [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
        recommendMaxCount: 6,
        quickEntries: [
          { key: 'telegram', icon: 'RiTelegramFill', label: 'Telegram', visible: true, sortOrder: 1 },
          { key: 'whatsapp', icon: 'RiWhatsappFill', label: 'WhatsApp', visible: true, sortOrder: 2 },
          { key: 'team', icon: 'RiTeamFill', label: 'فريقي', visible: true, sortOrder: 3 },
          { key: 'invite', icon: 'RiGiftFill', label: 'دعوة', visible: true, sortOrder: 4 },
          { key: 'activities', icon: 'RiCalendarEventFill', label: 'الأنشطة', visible: true, sortOrder: 5 },
          { key: 'positions', icon: 'RiPieChartFill', label: 'أصولي', visible: true, sortOrder: 6 },
        ],
        todayIncomeVisible: true,
        signInEntryVisible: true,
        bannerVisible: false,
        marqueeVisible: false,
      },
      version: 1,
    },
    // 个人中心配置
    {
      pageType: 'profile',
      config: {
        menuEntries: [
          { key: 'recharge', icon: 'RiWallet3Fill', label: 'سجل الإيداع', link: '/recharge/history', visible: true },
          { key: 'withdraw', icon: 'RiBankFill', label: 'سجل السحب', link: '/withdraw/history', visible: true },
          { key: 'positions', icon: 'RiStockFill', label: 'استثماراتي', link: '/positions', visible: true },
          { key: 'transactions', icon: 'RiFileList3Fill', label: 'تفاصيل الأموال', link: '/transactions', visible: true },
          { key: 'team', icon: 'RiTeamFill', label: 'فريقي', link: '/team', visible: true },
          { key: 'bankCards', icon: 'RiBankCardFill', label: 'البطاقات البنكية', link: '/bank-cards', visible: true },
          { key: 'community', icon: 'RiMessage3Fill', label: 'منشوراتي', link: '/community/my', visible: true },
          { key: 'svipRewards', icon: 'RiVipCrownFill', label: 'مكافآت SVIP', link: '/svip/rewards', visible: true },
          { key: 'settings', icon: 'RiSettings4Fill', label: 'الإعدادات', link: '/settings', visible: true },
          { key: 'about', icon: 'RiInformationFill', label: 'حول', link: '/about', visible: true },
        ],
      },
      version: 1,
    },
    // 产品页配置
    {
      pageType: 'product',
      config: {
        tab1Name: 'المنتجات',
        tab1Filter: 'VIC,NWS,QLD',
        tab2Name: 'المنتجات المالية',
        tab2Filter: 'FINANCIAL',
        defaultTab: 1,
        listLayout: 'auto',           // single/double/auto
        cardStyle: 'standard',        // standard/compact/large
        vipBadgeColor: '#f97316',
        purchasedBadge: 'تم الشراء',
        lockedTip: 'يتطلب VIP{level}',
      },
      version: 1,
    },
  ];

  for (const config of pageConfigs) {
    await prisma.pageConfig.upsert({
      where: { pageType: config.pageType },
      update: { config: config.config, version: config.version },
      create: config,
    });
  }

  console.log(`  ✓ 已创建 ${pageConfigs.length} 个页面配置`);
}

// ================================
// 7. 动画配置初始化
// ================================

/**
 * 初始化动画配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.15节 AnimationConfig表
 */
async function seedAnimationConfig() {
  console.log('✨ 初始化动画配置...');

  // 检查是否已存在配置
  const existingConfig = await prisma.animationConfig.findFirst();
  
  if (!existingConfig) {
    await prisma.animationConfig.create({
      data: {
        animationEnabled: true,
        animationSpeed: new Decimal(1),    // 1.0x 正常速度
        reducedMotion: false,              // 不减弱动画
        celebrationEffect: true,           // 开启庆祝效果
        pageTransition: true,              // 开启页面过渡
        skeletonLoading: true,             // 开启骨架屏
        pullToRefresh: true,               // 开启下拉刷新动画
      },
    });
    console.log('  ✓ 已创建动画配置');
  } else {
    console.log('  ✓ 动画配置已存在，跳过创建');
  }
}

// ================================
// 8. 页面内容初始化
// ================================

/**
 * 初始化页面内容
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md PageContent表
 * @description 依据：开发文档/02-数据层/02.3-前端API接口清单.md 第16节 - 页面内容接口
 */
async function seedPageContents() {
  console.log('📖 初始化页面内容...');

  const pageContents = [
    // 关于我们页面
    // 依据：开发文档/03-功能模块/03.13.1-关于我们页.md
    {
      pageId: 'about_us',
      content: {
        hero: {
          title: 'شريكك الموثوق في الاستثمارات',
          subtitle: 'نقدم خدمات مالية عالية الجودة منذ 2024',
          logoUrl: '/images/logo.png',
          backgroundImage: '/images/about-bg.jpg',
        },
        sections: [
          {
            id: 'intro',
            type: 'text',
            content: '<p>نحن منصة رائدة في الاستثمارات الرقمية في المغرب، ملتزمون بتقديم فرص نمو مالي متاحة وآمنة للجميع.</p>',
          },
          {
            id: 'mission',
            type: 'quote',
            content: 'مهمتنا هي إتاحة الاستثمارات للجميع، مما يسمح لكل شخص بتنمية ثروته بطريقة بسيطة وشفافة.',
          },
          {
            id: 'team-image',
            type: 'image',
            imageUrl: '/images/about-team.jpg',
            imageAlt: 'فريقنا المحترف',
          },
          {
            id: 'values',
            type: 'text',
            content: '<p><strong>قيمنا:</strong></p><ul><li>الشفافية في جميع عملياتنا</li><li>أمان وحماية استثماراتك</li><li>خدمة عملاء من الدرجة الأولى</li><li>ابتكار مستمر في المنتجات المالية</li></ul>',
          },
        ],
        // 版本信息 - 底部居中显示
        appVersion: '1.0.0',
      },
    },
  ];

  for (const pageContent of pageContents) {
    await prisma.pageContent.upsert({
      where: { pageId: pageContent.pageId },
      update: { content: pageContent.content },
      create: pageContent,
    });
  }

  console.log(`  ✓ 已创建 ${pageContents.length} 个页面内容`);
}

// ================================
// 9. 产品数据初始化（开发测试用）
// ================================

/**
 * 初始化产品数据
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.2节 Product表
 * @description 产品分为 Po系列（体验+付费）和 VIP系列（需对应VIP等级）
 */
async function seedProducts() {
  console.log('📦 初始化产品数据...');

  // 体验产品
  const trialProducts: ProductSeedData[] = [
    {
      code: 'TRIAL',
      name: 'جرب المنتج',
      type: ProductType.TRIAL,
      series: ProductSeries.VIC,
      price: new Decimal(30),
      dailyIncome: new Decimal(2),
      cycleDays: 15,
      totalIncome: new Decimal(30),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 3,
      userPurchaseLimit: 3,
      globalSold: 0,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/trial.jpg',
      sortOrder: 0,
    },
  ];

  // VIC系列产品（PAID, 365天, grantVipLevel=0, requireVipLevel=0）
  const vicProducts: ProductSeedData[] = [
    {
      code: 'VIC1',
      name: 'VIC1',
      type: ProductType.PAID,
      series: ProductSeries.VIC,
      price: new Decimal(100),
      dailyIncome: new Decimal(8),
      cycleDays: 365,
      totalIncome: new Decimal(2920),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      userPurchaseLimit: null,
      globalSold: 0,
      svipDailyReward: new Decimal(8.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/vic1.jpg',
      sortOrder: 1,
    },
    {
      code: 'VIC2',
      name: 'VIC2',
      type: ProductType.PAID,
      series: ProductSeries.VIC,
      price: new Decimal(200),
      dailyIncome: new Decimal(15),
      cycleDays: 365,
      totalIncome: new Decimal(5475),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      userPurchaseLimit: null,
      globalSold: 0,
      svipDailyReward: new Decimal(12.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/vic2.jpg',
      sortOrder: 2,
    },
    {
      code: 'VIC3',
      name: 'VIC3',
      type: ProductType.PAID,
      series: ProductSeries.VIC,
      price: new Decimal(500),
      dailyIncome: new Decimal(32),
      cycleDays: 365,
      totalIncome: new Decimal(11680),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      userPurchaseLimit: null,
      globalSold: 0,
      svipDailyReward: new Decimal(15.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/vic3.jpg',
      sortOrder: 3,
    },
    {
      code: 'VIC4',
      name: 'VIC4',
      type: ProductType.PAID,
      series: ProductSeries.VIC,
      price: new Decimal(1000),
      dailyIncome: new Decimal(55),
      cycleDays: 365,
      totalIncome: new Decimal(20075),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      userPurchaseLimit: null,
      globalSold: 0,
      svipDailyReward: new Decimal(18.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/vic4.jpg',
      sortOrder: 4,
    },
    {
      code: 'VIC5',
      name: 'VIC5',
      type: ProductType.PAID,
      series: ProductSeries.VIC,
      price: new Decimal(3000),
      dailyIncome: new Decimal(158),
      cycleDays: 365,
      totalIncome: new Decimal(57670),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      userPurchaseLimit: null,
      globalSold: 0,
      svipDailyReward: new Decimal(28.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/vic5.jpg',
      sortOrder: 5,
    },
  ];

  // NWS系列产品（PAID, 365天）
  const nwsProducts: ProductSeedData[] = [
    {
      code: 'NWS6',
      name: 'NWS6',
      type: ProductType.PAID,
      series: ProductSeries.NWS,
      price: new Decimal(6000),
      dailyIncome: new Decimal(288),
      cycleDays: 365,
      totalIncome: new Decimal(105120),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 50,
      globalSold: 0,
      userPurchaseLimit: 10,
      displayUserLimit: 10,
      svipDailyReward: new Decimal(38.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/nws6.jpg',
      sortOrder: 6,
    },
    {
      code: 'NWS7',
      name: 'NWS7',
      type: ProductType.PAID,
      series: ProductSeries.NWS,
      price: new Decimal(15000),
      dailyIncome: new Decimal(678),
      cycleDays: 365,
      totalIncome: new Decimal(247470),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 30,
      globalSold: 0,
      userPurchaseLimit: 10,
      displayUserLimit: 10,
      svipDailyReward: new Decimal(48.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/nws7.jpg',
      sortOrder: 7,
    },
    {
      code: 'NWS8',
      name: 'NWS8',
      type: ProductType.PAID,
      series: ProductSeries.NWS,
      price: new Decimal(30000),
      dailyIncome: new Decimal(1295),
      cycleDays: 365,
      totalIncome: new Decimal(472675),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 30,
      globalSold: 0,
      userPurchaseLimit: 5,
      displayUserLimit: 5,
      svipDailyReward: new Decimal(58.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/nws8.jpg',
      sortOrder: 8,
    },
    {
      code: 'NWS9',
      name: 'NWS9',
      type: ProductType.PAID,
      series: ProductSeries.NWS,
      price: new Decimal(50000),
      dailyIncome: new Decimal(2075),
      cycleDays: 365,
      totalIncome: new Decimal(757375),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 20,
      globalSold: 0,
      userPurchaseLimit: 5,
      displayUserLimit: 5,
      svipDailyReward: new Decimal(68.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/nws9.jpg',
      sortOrder: 9,
    },
  ];

  // QLD系列产品（PAID, 365天）
  const qldProducts: ProductSeedData[] = [
    {
      code: 'QLD10',
      name: 'QLD10',
      type: ProductType.PAID,
      series: ProductSeries.QLD,
      price: new Decimal(100000),
      dailyIncome: new Decimal(4008),
      cycleDays: 365,
      totalIncome: new Decimal(1462920),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 20,
      globalSold: 0,
      userPurchaseLimit: 2,
      displayUserLimit: 2,
      svipDailyReward: new Decimal(88.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/qld10.jpg',
      sortOrder: 10,
    },
    {
      code: 'QLD11',
      name: 'QLD11',
      type: ProductType.PAID,
      series: ProductSeries.QLD,
      price: new Decimal(200000),
      dailyIncome: new Decimal(7758),
      cycleDays: 365,
      totalIncome: new Decimal(2831670),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 10,
      globalSold: 0,
      userPurchaseLimit: 2,
      displayUserLimit: 2,
      svipDailyReward: new Decimal(128.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/qld11.jpg',
      sortOrder: 11,
    },
    {
      code: 'QLD12',
      name: 'QLD12',
      type: ProductType.PAID,
      series: ProductSeries.QLD,
      price: new Decimal(500000),
      dailyIncome: new Decimal(18828),
      cycleDays: 365,
      totalIncome: new Decimal(6872220),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 1,
      globalStock: 10,
      globalSold: 0,
      userPurchaseLimit: 2,
      displayUserLimit: 2,
      svipDailyReward: new Decimal(158.8),
      svipRequireCount: 2,
      returnPrincipal: false,
      productStatus: 'OPEN',
      mainImage: '/images/products/qld12.jpg',
      sortOrder: 12,
    },
  ];

  // 理财产品（FINANCIAL, 15天, returnPrincipal=true）
  const financialProducts: ProductSeedData[] = [
    {
      code: 'FIN1',
      name: 'المنتجات المالية 1',
      type: ProductType.FINANCIAL,
      series: ProductSeries.FINANCIAL,
      price: new Decimal(100),
      dailyIncome: new Decimal(11),
      cycleDays: 15,
      totalIncome: new Decimal(165),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 5,
      globalSold: 0,
      returnPrincipal: true,
      productStatus: 'OPEN',
      mainImage: '/images/products/fin1.jpg',
      sortOrder: 13,
    },
    {
      code: 'FIN2',
      name: 'المنتجات المالية 2',
      type: ProductType.FINANCIAL,
      series: ProductSeries.FINANCIAL,
      price: new Decimal(300),
      dailyIncome: new Decimal(25),
      cycleDays: 15,
      totalIncome: new Decimal(375),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 5,
      globalSold: 0,
      returnPrincipal: true,
      productStatus: 'COMING_SOON',
      mainImage: '/images/products/fin2.jpg',
      sortOrder: 14,
    },
    {
      code: 'FIN3',
      name: 'المنتجات المالية 3',
      type: ProductType.FINANCIAL,
      series: ProductSeries.FINANCIAL,
      price: new Decimal(500),
      dailyIncome: new Decimal(45),
      cycleDays: 15,
      totalIncome: new Decimal(675),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 5,
      globalSold: 0,
      returnPrincipal: true,
      productStatus: 'COMING_SOON',
      mainImage: '/images/products/fin3.jpg',
      sortOrder: 15,
    },
    {
      code: 'FIN4',
      name: 'المنتجات المالية 4',
      type: ProductType.FINANCIAL,
      series: ProductSeries.FINANCIAL,
      price: new Decimal(1000),
      dailyIncome: new Decimal(68),
      cycleDays: 15,
      totalIncome: new Decimal(1020),
      grantVipLevel: 0,
      grantSvipLevel: 0,
      requireVipLevel: 0,
      purchaseLimit: 5,
      globalSold: 0,
      returnPrincipal: true,
      productStatus: 'COMING_SOON',
      mainImage: '/images/products/fin4.jpg',
      sortOrder: 16,
    },
  ];

  const allProducts = [...trialProducts, ...vicProducts, ...nwsProducts, ...qldProducts, ...financialProducts];

  // 插入产品数据
  for (const product of allProducts) {
    const createData: Record<string, unknown> = {
      code: product.code,
      name: product.name,
      type: product.type,
      series: product.series,
      price: product.price,
      dailyIncome: product.dailyIncome,
      cycleDays: product.cycleDays,
      totalIncome: product.totalIncome,
      grantVipLevel: product.grantVipLevel,
      grantSvipLevel: product.grantSvipLevel,
      requireVipLevel: product.requireVipLevel,
      purchaseLimit: product.purchaseLimit,
      showRecommendBadge: product.showRecommendBadge ?? false,
      customBadgeText: product.customBadgeText ?? null,
      mainImage: product.mainImage ?? null,
      sortOrder: product.sortOrder,
    };

    if (product.globalStock != null) createData.globalStock = product.globalStock;
    if (product.globalSold != null) createData.globalSold = product.globalSold;
    if (product.userPurchaseLimit != null) createData.userPurchaseLimit = product.userPurchaseLimit;
    if (product.displayUserLimit != null) createData.displayUserLimit = product.displayUserLimit;
    if (product.svipDailyReward != null) createData.svipDailyReward = product.svipDailyReward;
    if (product.svipRequireCount != null) createData.svipRequireCount = product.svipRequireCount;
    if (product.returnPrincipal != null) createData.returnPrincipal = product.returnPrincipal;
    if (product.productStatus != null) createData.productStatus = product.productStatus;

    await prisma.product.upsert({
      where: { code: product.code },
      update: createData,
      create: createData as any,
    });
  }

  console.log(`  ✓ 已创建 ${allProducts.length} 个产品（体验 ${trialProducts.length}，VIC ${vicProducts.length}，NWS ${nwsProducts.length}，QLD ${qldProducts.length}，理财 ${financialProducts.length}）`);
}

// ================================
// 10. 文案配置初始化
// ================================

/**
 * 初始化文案配置
 * @description 依据：开发文档/02-数据层/02.1-数据库设计.md 第2.16节 TextConfig表
 * @description 与前端 apps/web/src/stores/text.ts 中的 defaultTexts 保持同步
 * 
 * 文案分类说明：
 * - btn: 按钮文案
 * - nav: 导航文案
 * - status: 状态文案
 * - tag: 标签文案
 * - empty: 空状态文案
 * - error: 错误提示
 * - time: 时间相关
 * - balance: 余额相关
 * - recharge: 充值相关
 * - withdraw: 提现相关
 * - home: 首页相关
 * - biz: 业务相关
 * - tip: 提示文案
 * - unit: 单位文案
 * - common: 通用文案
 * - announcement: 公告相关
 * - label: 标签文案
 * - aria: 无障碍标签
 * - a11y: 无障碍辅助文案
 */
async function seedTexts() {
  console.log('📝 初始化文案配置...');

  // 文案数据与前端 defaultTexts 保持同步
  // 依据：开发规范.md 第2.7节 - 用户前端文案默认值使用阿拉伯语
  const texts: Array<{ key: string; value: string; category: string; description?: string }> = [
    // === 通用按钮 ===
    { key: 'btn.confirm', value: 'تأكيد', category: 'btn', description: '确认按钮' },
    { key: 'btn.cancel', value: 'إلغاء', category: 'btn', description: '取消按钮' },
    { key: 'btn.submit', value: 'إرسال', category: 'btn', description: '提交按钮' },
    { key: 'btn.close', value: 'إغلاق', category: 'btn', description: '关闭按钮' },
    { key: 'btn.back', value: 'رجوع', category: 'btn', description: '返回按钮' },
    { key: 'btn.next', value: 'التالي', category: 'btn', description: '下一步按钮' },
    { key: 'btn.save', value: 'حفظ', category: 'btn', description: '保存按钮' },
    { key: 'btn.delete', value: 'حذف', category: 'btn', description: '删除按钮' },
    { key: 'btn.edit', value: 'تعديل', category: 'btn', description: '编辑按钮' },
    { key: 'btn.retry', value: 'إعادة المحاولة', category: 'btn', description: '重试按钮' },
    { key: 'btn.loading', value: 'جارٍ التحميل...', category: 'btn', description: '加载中按钮' },
    { key: 'btn.recharge', value: 'إيداع', category: 'btn', description: '充值按钮' },
    { key: 'btn.withdraw', value: 'سحب', category: 'btn', description: '提现按钮' },
    { key: 'btn.buy', value: 'شراء', category: 'btn', description: '购买按钮' },

    // === 导航 ===
    { key: 'nav.home', value: 'الرئيسية', category: 'nav', description: '首页导航' },
    { key: 'nav.products', value: 'المنتجات', category: 'nav', description: '产品导航' },
    { key: 'nav.recharge', value: 'إيداع', category: 'nav', description: '充值导航' },
    { key: 'nav.positions', value: 'استثماراتي', category: 'nav', description: '我的投资导航' },
    { key: 'nav.profile', value: 'الملف الشخصي', category: 'nav', description: '个人中心导航' },
    { key: 'nav.activities', value: 'الأنشطة', category: 'nav', description: '活动导航' },
    { key: 'nav.messages', value: 'الرسائل', category: 'nav', description: '消息导航' },
    { key: 'nav.notifications', value: 'الإشعارات', category: 'nav', description: '通知导航' },
    { key: 'nav.support', value: 'الدعم', category: 'nav', description: '客服导航' },

    // === 状态 ===
    { key: 'status.success', value: 'نجاح', category: 'status', description: '成功状态' },
    { key: 'status.failed', value: 'فشل', category: 'status', description: '失败状态' },
    { key: 'status.pending', value: 'معلّق', category: 'status', description: '待处理状态' },
    { key: 'status.processing', value: 'قيد المعالجة', category: 'status', description: '处理中状态' },
    { key: 'status.completed', value: 'مكتمل', category: 'status', description: '已完成状态' },
    { key: 'status.cancelled', value: 'ملغى', category: 'status', description: '已取消状态' },
    { key: 'status.warning', value: 'تحذير', category: 'status', description: '警告状态' },
    { key: 'status.info', value: 'معلومات', category: 'status', description: '信息状态' },

    // === 标签 ===
    { key: 'tag.new', value: 'جديد', category: 'tag', description: '新品标签' },
    { key: 'tag.verified', value: 'موثّق', category: 'tag', description: '已验证标签' },
    { key: 'tag.popular', value: 'شائع', category: 'tag', description: '热门标签' },
    { key: 'tag.new_user', value: 'موصى به', category: 'tag', description: '新用户推荐标签' },
    { key: 'tag.owned', value: 'أملكه', category: 'tag', description: '已拥有标签' },
    { key: 'tag.vip_required', value: 'يتطلب VIP {level}', category: 'tag', description: 'VIP等级要求标签（{level}为变量）' },

    // === 空状态 ===
    { key: 'empty.noData', value: 'لا توجد بيانات', category: 'empty', description: '无数据' },
    { key: 'empty.noProducts', value: 'لا توجد منتجات متاحة', category: 'empty', description: '无产品' },
    { key: 'empty.noProducts_desc', value: 'لا توجد منتجات متاحة حالياً', category: 'empty', description: '无产品描述' },
    { key: 'empty.noPositions', value: 'ليس لديك استثمارات بعد', category: 'empty', description: '无持仓' },
    { key: 'empty.noTransactions', value: 'لا توجد معاملات', category: 'empty', description: '无交易记录' },
    { key: 'empty.default', value: 'لا توجد بيانات', category: 'empty', description: '默认空状态' },
    { key: 'empty.default_desc', value: 'لا توجد بيانات للعرض حالياً', category: 'empty', description: '默认空状态描述' },
    { key: 'empty.recharge_record', value: 'لا يوجد سجل إيداعات', category: 'empty', description: '无充值记录' },
    { key: 'empty.withdraw_record', value: 'لا يوجد سجل سحوبات', category: 'empty', description: '无提现记录' },
    { key: 'empty.positions', value: 'ليس لديك استثمارات بعد', category: 'empty', description: '无持仓' },
    { key: 'empty.positions_guide', value: 'استكشف منتجاتنا وابدأ بالاستثمار', category: 'empty', description: '无持仓引导' },
    { key: 'empty.transactions', value: 'لا توجد معاملات', category: 'empty', description: '无交易' },
    { key: 'empty.transactions_desc', value: 'ليس لديك سجل معاملات', category: 'empty', description: '无交易描述' },
    { key: 'empty.messages', value: 'لا توجد رسائل', category: 'empty', description: '无消息' },
    { key: 'empty.team', value: 'ليس لديك فريق بعد', category: 'empty', description: '无团队' },
    { key: 'empty.team_guide', value: 'ادعُ أصدقاءك واكسب عمولات', category: 'empty', description: '无团队引导' },
    { key: 'empty.bank_cards', value: 'لا توجد بطاقات بنكية', category: 'empty', description: '无银行卡' },
    { key: 'empty.search', value: 'لم يتم العثور على نتائج', category: 'empty', description: '无搜索结果' },
    { key: 'empty.search_desc', value: 'لم يتم العثور على نتائج لبحثك', category: 'empty', description: '无搜索结果描述' },
    { key: 'empty.user', value: 'لا يوجد مستخدمون', category: 'empty', description: '无用户' },
    { key: 'empty.user_desc', value: 'لا يوجد مستخدمون متاحون', category: 'empty', description: '无用户描述' },

    // === 错误提示 ===
    { key: 'error.network', value: 'خطأ في الاتصال', category: 'error', description: '网络错误' },
    { key: 'error.timeout', value: 'انتهت مهلة الطلب', category: 'error', description: '请求超时' },
    { key: 'error.unknown', value: 'حدث خطأ', category: 'error', description: '未知错误' },
    { key: 'error.unauthorized', value: 'يرجى تسجيل الدخول', category: 'error', description: '未授权错误' },

    // === 时间 ===
    { key: 'time.today', value: 'اليوم', category: 'time', description: '今天' },
    { key: 'time.yesterday', value: 'أمس', category: 'time', description: '昨天' },
    { key: 'time.days', value: 'أيام', category: 'time', description: '天（复数）' },
    { key: 'time.oneDay', value: 'يوم واحد', category: 'time', description: '1天' },
    { key: 'time.justNow', value: 'الآن', category: 'time', description: '刚刚' },
    { key: 'time.minutesAgo', value: 'د', category: 'time', description: '分钟前' },
    { key: 'time.hoursAgo', value: 'س', category: 'time', description: '小时前' },
    { key: 'time.daysAgo', value: 'ي', category: 'time', description: '天前' },

    // === 余额 ===
    { key: 'balance.available', value: 'الرصيد المتاح', category: 'balance', description: '可用余额' },
    { key: 'balance.frozen', value: 'الرصيد المجمّد', category: 'balance', description: '冻结余额' },
    { key: 'balance.total', value: 'الرصيد الإجمالي', category: 'balance', description: '总余额' },

    // === 充值提现 ===
    { key: 'recharge.title', value: 'إيداع', category: 'recharge', description: '充值标题' },
    { key: 'recharge.amount', value: 'مبلغ الإيداع', category: 'recharge', description: '充值金额' },
    { key: 'withdraw.title', value: 'سحب', category: 'withdraw', description: '提现标题' },
    { key: 'withdraw.amount', value: 'مبلغ السحب', category: 'withdraw', description: '提现金额' },
    { key: 'withdraw.fee', value: 'عمولة', category: 'withdraw', description: '手续费' },
    { key: 'withdraw.actualAmount', value: 'المبلغ المستلم', category: 'withdraw', description: '实际到账金额' },

    // === 首页 ===
    { key: 'home.subtitle', value: 'منصتك الاستثمارية الموثوقة', category: 'home', description: '首页副标题' },
    { key: 'home.earnings', value: 'أرباح اليوم', category: 'home', description: '今日收益' },
    { key: 'home.signIn', value: 'تسجيل الحضور', category: 'home', description: '签到按钮' },
    { key: 'home.availableBalance', value: 'الرصيد المتاح', category: 'home', description: '可用余额' },
    { key: 'home.frozenBalance', value: 'الرصيد المجمّد', category: 'home', description: '冻结余额' },
    { key: 'home.todayIncome', value: 'أرباح اليوم', category: 'home', description: '今日收益' },
    { key: 'home.totalIncome', value: 'إجمالي الأرباح', category: 'home', description: '总收益' },
    { key: 'home.hideBalance', value: 'إخفاء الرصيد', category: 'home', description: '隐藏余额' },
    { key: 'home.showBalance', value: 'إظهار الرصيد', category: 'home', description: '显示余额' },
    { key: 'home.recommendProducts', value: 'منتجات موصى بها', category: 'home', description: '推荐产品' },
    { key: 'home.noProducts', value: 'لا توجد منتجات متاحة', category: 'home', description: '无产品提示' },
    { key: 'home.features', value: 'المميزات', category: 'home', description: '特性标题' },
    { key: 'home.feature_design_title', value: 'تصميم 2026', category: 'home', description: '设计特性标题' },
    { key: 'home.feature_design_desc', value: 'تصميم فاخر بألوان فاتحة ومساحات واسعة', category: 'home', description: '设计特性描述' },
    { key: 'home.feature_security_title', value: 'أمان مضمون', category: 'home', description: '安全特性标题' },
    { key: 'home.feature_security_desc', value: 'حماية البيانات ومعاملات آمنة', category: 'home', description: '安全特性描述' },
    { key: 'home.feature_return_title', value: 'عوائد مرتفعة', category: 'home', description: '收益特性标题' },
    { key: 'home.feature_return_desc', value: 'عوائد يومية جذابة لاستثمارك', category: 'home', description: '收益特性描述' },
    { key: 'home.design_system', value: 'نظام التصميم', category: 'home', description: '设计系统标题' },
    { key: 'home.color_palette', value: 'لوحة الألوان', category: 'home', description: '颜色面板标题' },
    { key: 'home.color_subtitle', value: 'ألوان ناعمة وأنيقة', category: 'home', description: '颜色面板副标题' },
    { key: 'home.primary_orange', value: 'برتقالي أنيق (أساسي)', category: 'home', description: '主色橙色' },
    { key: 'home.warm_neutral', value: 'رمادي دافئ (محايد)', category: 'home', description: '暖灰色' },
    { key: 'home.trend_colors', value: 'ألوان رائجة 2026', category: 'home', description: '2026趋势色' },
    { key: 'home.lavender', value: 'لافندر', category: 'home', description: '薰衣草紫' },
    { key: 'home.mint', value: 'نعناع', category: 'home', description: '薄荷绿' },
    { key: 'home.button_variants', value: 'أنواع الأزرار', category: 'home', description: '按钮变体标题' },
    { key: 'home.btn_primary', value: 'أساسي', category: 'home', description: '主要按钮' },
    { key: 'home.btn_secondary', value: 'ثانوي', category: 'home', description: '次要按钮' },
    { key: 'home.btn_ghost', value: 'شبحي', category: 'home', description: '幽灵按钮' },
    { key: 'home.btn_destructive', value: 'خطر', category: 'home', description: '危险按钮' },
    { key: 'home.btn_link', value: 'رابط', category: 'home', description: '链接按钮' },
    { key: 'home.btn_loading', value: 'تحميل', category: 'home', description: '加载按钮' },
    { key: 'home.status_badges', value: 'شارات الحالة', category: 'home', description: '状态徽章标题' },
    { key: 'home.badge_primary', value: 'أساسي', category: 'home', description: '主要徽章' },

    // === 业务相关 ===
    { key: 'biz.daily_income', value: 'الدخل اليومي', category: 'biz', description: '日收益' },
    { key: 'biz.cycle_days', value: 'الدورة', category: 'biz', description: '周期' },
    { key: 'biz.available_balance', value: 'الرصيد المتاح', category: 'biz', description: '可用余额' },
    { key: 'biz.frozen_balance', value: 'الرصيد المجمّد', category: 'biz', description: '冻结余额' },
    { key: 'biz.frozen_balance_tip', value: 'يتم فتح الرصيد المجمّد تلقائياً عند اكتمال الدورة', category: 'biz', description: '冻结余额提示' },
    { key: 'biz.today_income', value: 'أرباح اليوم', category: 'biz', description: '今日收益' },

    // === 提示 ===
    { key: 'tip.no_more_data', value: 'لا مزيد من البيانات', category: 'tip', description: '无更多数据' },
    { key: 'tip.refreshing', value: 'جارٍ التحديث...', category: 'tip', description: '刷新中' },
    { key: 'tip.release_to_refresh', value: 'اترك للتحديث', category: 'tip', description: '释放刷新' },
    { key: 'tip.pull_to_refresh', value: 'اسحب للتحديث', category: 'tip', description: '下拉刷新' },
    { key: 'tip.phone_format', value: 'يجب أن يتكون الرقم من 9 أرقام', category: 'tip', description: '手机格式提示' },
    { key: 'tip.password_min', value: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل', category: 'tip', description: '密码最小长度提示' },
    { key: 'tip.password_format', value: 'يجب أن تحتوي كلمة المرور على أحرف وأرقام', category: 'tip', description: '密码格式提示' },

    // === 单位 ===
    { key: 'unit.days', value: ' أيام', category: 'unit', description: '天数单位' },

    // === 通用 ===
    { key: 'common.close', value: 'إغلاق', category: 'common', description: '关闭' },
    { key: 'common.confirm', value: 'تأكيد', category: 'common', description: '确认' },

    // === 公告 ===
    { key: 'announcement.dontShowAgain', value: 'لا تعرض مرة أخرى', category: 'announcement', description: '不再显示' },
    { key: 'announcement.type.important', value: 'مهم', category: 'announcement', description: '重要公告' },
    { key: 'announcement.type.urgent', value: 'عاجل', category: 'announcement', description: '紧急公告' },

    // === 标签 (labels) ===
    { key: 'label.secure', value: 'آمن', category: 'label', description: '安全标签' },

    // === 无障碍标签 (aria-labels) ===
    { key: 'aria.close', value: 'إغلاق', category: 'aria', description: '关闭按钮无障碍标签' },
    { key: 'aria.close_preview', value: 'إغلاق المعاينة', category: 'aria', description: '关闭预览无障碍标签' },
    { key: 'aria.zoom_in', value: 'تكبير', category: 'aria', description: '放大无障碍标签' },
    { key: 'aria.zoom_out', value: 'تصغير', category: 'aria', description: '缩小无障碍标签' },
    { key: 'aria.prev_slide', value: 'السابق', category: 'aria', description: '上一张无障碍标签' },
    { key: 'aria.next_slide', value: 'التالي', category: 'aria', description: '下一张无障碍标签' },
    { key: 'aria.go_to_slide', value: 'الانتقال للشريحة {number}', category: 'aria', description: '跳转到幻灯片（{number}为变量）' },

    // === 无障碍辅助文案 (a11y) ===
    { key: 'a11y.modal', value: 'نافذة حوار', category: 'a11y', description: '模态窗口无障碍文案' },
    { key: 'a11y.modal_content', value: 'محتوى نافذة الحوار', category: 'a11y', description: '模态窗口内容无障碍文案' },

    // === 图片预览提示 ===
    { key: 'tip.image_drag', value: 'اسحب للعرض · انقر مرتين لإعادة التعيين', category: 'tip', description: '图片拖拽提示' },
    { key: 'tip.image_zoom', value: 'انقر مرتين للتكبير · انقر خارجاً للإغلاق', category: 'tip', description: '图片缩放提示' },

    // === 签到相关 ===
    { key: 'signin.title', value: 'تسجيل الحضور', category: 'signin', description: '签到弹窗标题' },
    { key: 'signin.daily.reward', value: 'مكافأة يومية', category: 'signin', description: '每日奖励标签' },
    { key: 'signin.btn.checkin', value: 'تسجيل الحضور', category: 'signin', description: '签到按钮文案' },
    { key: 'signin.done', value: 'مكتمل', category: 'signin', description: '已签到状态' },
    { key: 'signin.success', value: 'تم تسجيل الحضور بنجاح', category: 'signin', description: '签到成功标题' },
    { key: 'signin.normal_completed', value: 'لقد أكملت تسجيل الحضور لمدة 3 أيام! اشترِ منتجاً للمتابعة.', category: 'signin', description: '普通用户签到完成提示' },
    { key: 'signin.window_expired', value: 'انتهت فترة تسجيل الحضور. اشترِ منتجاً للمتابعة.', category: 'signin', description: '签到窗口期过期提示' },
    { key: 'signin.window_remaining', value: 'متبقي {remaining} أيام لإكمال تسجيل الحضور', category: 'signin', description: '签到窗口期剩余天数（{remaining}为变量）' },
    { key: 'signin.continuous_days', value: 'اليوم {n} من تسجيل الحضور المتتالي', category: 'signin', description: '连续签到天数（{n}为变量）' },
    { key: 'signin.total_reward', value: 'إجمالي المكافآت', category: 'signin', description: '总奖励标签' },
    { key: 'signin.go_activities', value: 'عرض المزيد من الأنشطة', category: 'signin', description: '前往活动中心链接' },
    { key: 'signin.btn_go_buy', value: 'اذهب للشراء', category: 'signin', description: '前往购买按钮' },
    { key: 'signin.error.load', value: 'خطأ في تحميل حالة تسجيل الحضور', category: 'signin', description: '签到状态加载失败提示' },
    { key: 'signin.calendar.title', value: 'تقويم تسجيل الحضور', category: 'signin', description: '签到日历标题' },
    { key: 'signin.days', value: 'أيام', category: 'signin', description: '天数单位' },
    { key: 'signin.today', value: 'اليوم', category: 'signin', description: '今日标签' },
    { key: 'signin.day', value: 'يوم', category: 'signin', description: '第X天标签' },
    { key: 'signin.progress.title', value: 'تقدم تسجيل الحضور', category: 'signin', description: '签到进度标题' },
    { key: 'signin.svip.title', value: 'تسجيل حضور حصري', category: 'signin', description: 'SVIP签到标题' },
    { key: 'signin.svip.subtitle', value: 'مكافأة مضاعفة يومياً', category: 'signin', description: 'SVIP签到副标题' },
    { key: 'signin.svip.reward', value: 'مكافأة', category: 'signin', description: 'SVIP奖励标签' },
    { key: 'signin.svip.upgrade', value: 'SVIP يحصل على الضعف', category: 'signin', description: 'SVIP升级提示' },
    { key: 'signin.claimed', value: 'تم المطالبة', category: 'signin', description: '已领取状态' },
    { key: 'signin.available', value: 'متاح', category: 'signin', description: '可领取状态' },
    { key: 'signin.btn.claim', value: 'مطالبة', category: 'signin', description: 'SVIP领取按钮' },

    // === 签到 Toast 提示 ===
    { key: 'toast.signin_success', value: 'تم تسجيل الحضور بنجاح! +{amount}', category: 'toast', description: '签到成功提示（{amount}为奖励金额变量）' },

    // === 首页签到（已签到状态） ===
    { key: 'home.signedIn', value: 'تم التسجيل', category: 'home', description: '已签到按钮文案' },

    // === 邀请活动页（/activities/invite）===
    { key: 'invite.hero_count_label', value: 'دعوات صالحة', category: 'invite', description: '邀请活动-Hero区数字下方标签' },
    { key: 'invite.hero_cta', value: 'دعوة أصدقاء', category: 'invite', description: '邀请活动-Hero区CTA按钮' },
    { key: 'invite.stat_valid', value: 'صالحة', category: 'invite', description: '邀请活动-统计栏有效邀请标签' },
    { key: 'invite.stat_earned', value: 'المكتسب', category: 'invite', description: '邀请活动-统计栏已领奖励标签' },
    { key: 'invite.stat_next', value: 'التالي', category: 'invite', description: '邀请活动-统计栏距下一档标签' },
    { key: 'invite.section_levels', value: 'مستويات المكافآت', category: 'invite', description: '邀请活动-奖励阶梯区块标题' },
    { key: 'invite.section_rules', value: 'القواعد', category: 'invite', description: '邀请活动-规则区块标题' },
    { key: 'invite.tier_level', value: 'المستوى {n}', category: 'invite', description: '邀请活动-阶梯等级（{n}为变量）' },
    { key: 'invite.tier_requirement', value: 'دعوة {n} أصدقاء', category: 'invite', description: '邀请活动-阶梯需求（{n}为变量）' },
    { key: 'invite.status_locked', value: 'لم يتحقق', category: 'invite', description: '邀请活动-锁定状态' },
    { key: 'invite.status_claimable', value: 'مطالبة', category: 'invite', description: '邀请活动-可领取按钮' },
    { key: 'invite.status_claimed', value: 'تم المطالبة', category: 'invite', description: '邀请活动-已领取标签' },
    { key: 'invite.all_completed', value: 'لقد أكملت جميع المستويات!', category: 'invite', description: '邀请活动-全部完成提示' },
    { key: 'invite.next_goal_need', value: 'متبقي {n}', category: 'invite', description: '邀请活动-距下一目标差值（{n}为变量）' },
    { key: 'invite.rule_title', value: 'قواعد النشاط', category: 'invite', description: '邀请活动-规则标题' },
    { key: 'invite.rule_valid_1', value: 'دعوة صالحة: صديقك يودع ويشتري أي منتج', category: 'invite', description: '邀请活动-规则1' },
    { key: 'invite.rule_valid_2', value: 'أو صديقك يكمل 3 أيام متتالية من تسجيل الحضور', category: 'invite', description: '邀请活动-规则2' },
    { key: 'invite.rule_claim', value: 'يجب المطالبة بالمكافآت يدوياً', category: 'invite', description: '邀请活动-规则3' },
    { key: 'invite.rule_expire', value: 'المكافآت غير المطالب بها ستنتهي صلاحيتها إذا انتهى النشاط', category: 'invite', description: '邀请活动-规则4' },

    // === 奖励弹窗相关 ===
    { key: 'reward.register_title', value: 'تم التسجيل بنجاح!', category: 'reward', description: '注册奖励标题' },
    { key: 'reward.register_subtitle', value: 'لقد حصلت على {amount} كمكافأة ترحيب', category: 'reward', description: '注册奖励副标题（{amount}为奖金变量）' },
    { key: 'reward.register_primary', value: 'ابدأ بالاستكشاف', category: 'reward', description: '注册奖励主按钮' },
    { key: 'reward.register_secondary', value: 'عرض أصولي', category: 'reward', description: '注册奖励次按钮' },
    { key: 'reward.purchase_title', value: 'تم الشراء بنجاح!', category: 'reward', description: '购买成功标题' },
    { key: 'reward.purchase_subtitle', value: 'تمت إضافة المنتج إلى استثماراتك', category: 'reward', description: '购买成功副标题' },
    { key: 'reward.purchase_primary', value: 'عرض استثماراتي', category: 'reward', description: '购买成功主按钮' },
    { key: 'reward.purchase_secondary', value: 'متابعة الشراء', category: 'reward', description: '购买成功次按钮' },
    { key: 'reward.signin_title', value: 'تم تسجيل الحضور بنجاح!', category: 'reward', description: '签到成功标题' },
    { key: 'reward.signin_subtitle', value: 'مكافأة تسجيل الحضور: {amount}', category: 'reward', description: '签到成功副标题（{amount}为奖励变量）' },
    { key: 'reward.signin_primary', value: 'رائع', category: 'reward', description: '签到成功按钮' },
    { key: 'reward.invite_title', value: 'مكافأة الدعوة!', category: 'reward', description: '邀请奖励标题' },
    { key: 'reward.invite_subtitle', value: 'لقد حصلت على مكافأة مقابل دعوتك', category: 'reward', description: '邀请奖励副标题' },
    { key: 'reward.invite_primary', value: 'دعوة المزيد من الأصدقاء', category: 'reward', description: '邀请奖励主按钮' },
    { key: 'reward.invite_secondary', value: 'إغلاق', category: 'reward', description: '邀请奖励次按钮' },
    { key: 'reward.vip_title', value: 'تهانينا!', category: 'reward', description: 'VIP升级标题' },
    { key: 'reward.vip_subtitle', value: 'تم تحديث مستوى VIP الخاص بك', category: 'reward', description: 'VIP升级副标题' },
    { key: 'reward.vip_primary', value: 'عرض المزايا', category: 'reward', description: 'VIP升级按钮' },
    { key: 'reward.default_title', value: 'نجاح!', category: 'reward', description: '默认奖励标题' },

    // === 对话框相关 ===
    { key: 'dialog.cancel_order_title', value: 'إلغاء الطلب', category: 'dialog', description: '取消订单对话框标题' },
    { key: 'dialog.cancel_order_message', value: 'هل أنت متأكد من إلغاء هذا الطلب؟', category: 'dialog', description: '取消订单确认消息' },
    { key: 'dialog.logout_title', value: 'تسجيل الخروج', category: 'dialog', description: '退出登录对话框标题' },
    { key: 'dialog.logout_desc', value: 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', category: 'dialog', description: '退出登录确认消息' },
    { key: 'dialog.delete_card_title', value: 'حذف البطاقة', category: 'dialog', description: '删除银行卡对话框标题' },
    { key: 'dialog.delete_card_msg', value: 'هل أنت متأكد من حذف هذه البطاقة البنكية؟', category: 'dialog', description: '删除银行卡确认消息' },
    { key: 'dialog.withdraw_threshold_title', value: 'لا يمكن السحب', category: 'dialog', description: '提现门槛不足对话框标题' },
    { key: 'dialog.withdraw_threshold_msg', value: 'يجب عليك الإيداع وشراء منتج مدفوع لتفعيل السحب', category: 'dialog', description: '提现门槛不足消息（需充值+购买付费产品）' },
    { key: 'dialog.bind_card_first', value: 'أضف بطاقة أولاً', category: 'dialog', description: '需先绑卡对话框标题' },
    { key: 'dialog.bind_card_first_msg', value: 'يرجى إضافة بطاقة بنكية قبل السحب', category: 'dialog', description: '需先绑卡消息' },
    { key: 'dialog.stock_exhausted_title', value: 'المنتج نفد', category: 'dialog', description: '库存不足对话框标题' },
    { key: 'dialog.stock_exhausted_msg', value: 'هذا المنتج نفد مؤقتاً.', category: 'dialog', description: '库存不足消息' },
    { key: 'dialog.personal_limit_title', value: 'تم بلوغ الحد', category: 'dialog', description: '个人限购对话框标题' },
    { key: 'dialog.personal_limit_msg', value: 'لقد بلغت حد الشراء لهذا المنتج.', category: 'dialog', description: '个人限购消息' },

    // === 表单验证相关 ===
    { key: 'validation.required', value: 'هذا الحقل مطلوب', category: 'validation', description: '必填字段验证' },
    { key: 'validation.password_min_length', value: 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل', category: 'validation', description: '密码最小长度验证（{min}为变量）' },
    { key: 'validation.password_max_length', value: 'لا يمكن أن تتجاوز كلمة المرور {max} حرف', category: 'validation', description: '密码最大长度验证（{max}为变量）' },
    { key: 'validation.password_require_letter', value: 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل', category: 'validation', description: '密码需包含字母验证' },
    { key: 'validation.password_require_number', value: 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل', category: 'validation', description: '密码需包含数字验证' },
    { key: 'validation.password_not_match', value: 'كلمات المرور غير متطابقة', category: 'validation', description: '密码不匹配验证' },
    { key: 'validation.password_same_as_old', value: 'كلمة المرور الجديدة لا يمكن أن تكون مثل السابقة', category: 'validation', description: '新旧密码相同验证' },

    // === 产品相关 ===
    { key: 'product.recommend', value: 'موصى به', category: 'product', description: '推荐标签' },
    { key: 'product.detail', value: 'التفاصيل', category: 'product', description: '产品详情标签' },
    { key: 'product.price', value: 'السعر', category: 'product', description: '价格标签' },
    { key: 'product.cycle', value: 'الدورة', category: 'product', description: '周期标签' },
    { key: 'product.grant_vip_desc', value: 'اشترِ هذا المنتج واحصل على مزايا VIP', category: 'product', description: '赠送VIP描述' },
    { key: 'product.income_calc', value: 'حاسبة الأرباح', category: 'product', description: '收益计算器标题' },
    { key: 'product.daily', value: 'يومي', category: 'product', description: '日收益标签' },
    { key: 'product.days', value: 'أيام', category: 'product', description: '天数标签' },
    { key: 'product.total', value: 'الإجمالي', category: 'product', description: '总收益标签' },

    // === 额外的错误提示 ===
    { key: 'error.user_not_found', value: 'المستخدم غير موجود', category: 'error', description: '用户不存在' },
    { key: 'error.bank_disabled', value: 'هذا البنك غير متاح', category: 'error', description: '银行不可用' },
    { key: 'error.bank_card_blacklisted', value: 'هذه البطاقة غير مسموح بها', category: 'error', description: '银行卡被拉黑' },
    { key: 'error.document_type_required', value: 'اختر نوع الوثيقة', category: 'error', description: '需选择证件类型' },
    { key: 'error.document_no_required', value: 'أدخل رقم الوثيقة', category: 'error', description: '需输入证件号码' },
    { key: 'error.account_type_required', value: 'اختر نوع الحساب', category: 'error', description: '需选择账户类型' },
    { key: 'error.cci_required', value: 'أدخل رمز CCI', category: 'error', description: '需输入CCI码' },
    { key: 'error.pay_url_invalid', value: 'رابط الدفع غير صالح', category: 'error', description: '支付链接无效' },
    { key: 'error.order_not_found_desc', value: 'الطلب الذي تبحث عنه غير موجود أو تم حذفه', category: 'error', description: '订单不存在描述' },
    { key: 'error.password_min_length', value: 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل', category: 'error', description: '密码最小长度错误（{min}为变量）' },
    { key: 'error.password_max_length', value: 'لا يمكن أن تتجاوز كلمة المرور {max} حرف', category: 'error', description: '密码最大长度错误（{max}为变量）' },

    // === 额外的空状态 ===
    { key: 'empty.no_banks_found', value: 'لم يتم العثور على بنوك', category: 'empty', description: '无银行搜索结果' },
    { key: 'empty.position_active', value: 'ليس لديك استثمارات نشطة', category: 'empty', description: '无活跃持仓' },
    { key: 'empty.position_completed', value: 'ليس لديك استثمارات مكتملة', category: 'empty', description: '无完成持仓' },
    { key: 'empty.position_active_desc', value: 'استكشف منتجاتنا لبدء الاستثمار', category: 'empty', description: '无活跃持仓引导' },
    { key: 'empty.position_completed_desc', value: 'ستظهر الاستثمارات المكتملة هنا', category: 'empty', description: '无完成持仓说明' },
    { key: 'empty.income_records', value: 'لا توجد سجلات أرباح بعد', category: 'empty', description: '无收益记录' },
    { key: 'empty.withdraw_record_desc', value: 'قم بإجراء سحب لرؤية السجل هنا', category: 'empty', description: '无提现记录描述' },
    { key: 'empty.recharge_record_desc', value: 'قم بإجراء إيداع لرؤية السجل هنا', category: 'empty', description: '无充值记录描述' },

    // === 额外的标签 ===
    { key: 'label.password', value: 'كلمة المرور', category: 'label', description: '密码标签' },
    { key: 'tag.trial', value: 'تجربة', category: 'tag', description: '体验产品标签' },

    // === 额外的提示 ===
    { key: 'tip.countdown', value: 'الوقت المتبقي: {time}', category: 'tip', description: '倒计时提示（{time}为变量）' },
    { key: 'tip.cci_format', value: 'رمز الحساب البنكي المشترك', category: 'tip', description: 'CCI码格式提示' },
    { key: 'tip.password_rule', value: 'يجب أن تتكون كلمة المرور من {min} أحرف على الأقل، وتشمل أحرفاً وأرقاماً', category: 'tip', description: '密码规则提示（{min}为变量）' },

    // === 额外的占位符 ===
    { key: 'placeholder.document_no', value: 'أدخل رقم الوثيقة', category: 'placeholder', description: '证件号码占位符' },
    { key: 'placeholder.cci_code', value: 'أدخل رمز CCI', category: 'placeholder', description: 'CCI码占位符' },

    // === 额外的业务字段 ===
    { key: 'biz.price', value: 'السعر', category: 'biz', description: '价格' },
    { key: 'biz.total_return', value: 'إجمالي العائد', category: 'biz', description: '总收益' },

    // === 额外的标题 ===
    { key: 'title.income_records', value: 'سجل الأرباح', category: 'title', description: '收益记录标题' },

    // === 额外的状态 ===
    { key: 'status.settled', value: 'تمت التسوية', category: 'status', description: '已结算状态' },
    { key: 'status.copied', value: 'تم النسخ', category: 'status', description: '已复制状态' },
    { key: 'status.rejected', value: 'مرفوض', category: 'status', description: '已拒绝状态（提现）' },
    { key: 'status.pending_review', value: 'قيد المراجعة', category: 'status', description: '待审核状态（提现）' },
    { key: 'status.approved', value: 'قيد المعالجة', category: 'status', description: '已批准/处理中状态（提现，用户端显示为处理中）' },
    { key: 'status.pending_payment', value: 'في انتظار الدفع', category: 'status', description: '待支付状态（充值）' },
    { key: 'status.paid', value: 'ناجح', category: 'status', description: '已支付状态（充值）' },
    { key: 'status.active', value: 'نشط', category: 'status', description: '活跃状态（持仓）' },

    // === 选项文案（银行卡表单） ===
    { key: 'option.cc', value: 'بطاقة الهوية الوطنية', category: 'option', description: '证件类型-بطاقة الهوية الوطنية（摩洛哥）' },
    { key: 'option.ce', value: 'بطاقة الإقامة', category: 'option', description: '证件类型-بطاقة الإقامة' },
    { key: 'option.nit', value: 'الرقم الضريبي', category: 'option', description: '证件类型-الرقم الضريبي' },
    { key: 'option.pp', value: 'جواز السفر', category: 'option', description: '证件类型-جواز السفر' },
    { key: 'option.ahorros', value: 'توفير', category: 'option', description: '账户类型-储蓄' },
    { key: 'option.corriente', value: 'جاري', category: 'option', description: '账户类型-活期' },

    // === 密码强度 ===
    { key: 'password.strength', value: 'الأمان', category: 'password', description: '密码强度标签' },
    { key: 'password.weak', value: 'ضعيفة', category: 'password', description: '密码强度-弱' },
    { key: 'password.medium', value: 'متوسطة', category: 'password', description: '密码强度-中' },
    { key: 'password.strong', value: 'قوية', category: 'password', description: '密码强度-强' },

    // === 页面标题 ===
    { key: 'page.transactions', value: 'المعاملات', category: 'page', description: '资金明细页标题' },
    { key: 'page.recharge', value: 'إيداع', category: 'page', description: '充值页标题' },
    { key: 'page.withdraw', value: 'سحب', category: 'page', description: '提现页标题' },
    { key: 'page.products', value: 'المنتجات', category: 'page', description: '产品页标题' },
    { key: 'page.product_detail', value: 'تفاصيل المنتج', category: 'page', description: '产品详情页标题' },
    { key: 'page.my_positions', value: 'استثماراتي', category: 'page', description: '我的持仓页标题' },
    { key: 'page.position_detail', value: 'تفاصيل الاستثمار', category: 'page', description: '持仓详情页标题' },
    { key: 'page.recharge_record', value: 'سجل الإيداعات', category: 'page', description: '充值记录页标题' },
    { key: 'page.recharge_detail', value: 'تفاصيل الإيداع', category: 'page', description: '充值详情页标题' },
    { key: 'page.withdraw_record', value: 'سجل السحوبات', category: 'page', description: '提现记录页标题' },
    { key: 'page.withdraw_detail', value: 'تفاصيل السحب', category: 'page', description: '提现详情页标题' },
    { key: 'page.bank_cards', value: 'بطاقاتي', category: 'page', description: '银行卡页标题' },
    { key: 'page.add_bank_card', value: 'إضافة بطاقة', category: 'page', description: '添加银行卡页标题' },
    { key: 'page.security', value: 'إعدادات الأمان', category: 'page', description: '安全设置页标题' },
    { key: 'page.change_password', value: 'تغيير كلمة المرور', category: 'page', description: '修改密码页标题' },
    { key: 'page.about', value: 'من نحن', category: 'page', description: '关于页标题' },
    { key: 'page.activities', value: 'مركز الأنشطة', category: 'page', description: '活动中心页标题' },
    { key: 'page.activity_collection', value: 'مكافأة المجموعة', category: 'page', description: '连单奖励页标题' },
    { key: 'page.login_title', value: 'تسجيل الدخول', category: 'page', description: '登录页标题' },
    { key: 'page.login_subtitle', value: 'أدخل حسابك للمتابعة', category: 'page', description: '登录页副标题' },
    { key: 'page.register_title', value: 'إنشاء حساب', category: 'page', description: '注册页标题' },
    { key: 'page.register_subtitle', value: 'سجّل للبدء', category: 'page', description: '注册页副标题' },

    // === 标签页筛选 ===
    { key: 'tab.all', value: 'الكل', category: 'tab', description: '全部标签' },
    { key: 'tab.pending_payment', value: 'معلّق', category: 'tab', description: '待支付标签' },
    { key: 'tab.pending_review', value: 'قيد المراجعة', category: 'tab', description: '待审核标签' },
    { key: 'tab.processing', value: 'قيد المعالجة', category: 'tab', description: '处理中标签' },
    { key: 'tab.completed', value: 'مكتمل', category: 'tab', description: '已完成标签' },
    { key: 'tab.rejected', value: 'مرفوض', category: 'tab', description: '已拒绝标签' },
    { key: 'tab.failed', value: 'فشل', category: 'tab', description: '失败标签' },
    { key: 'tab.cancelled', value: 'ملغى', category: 'tab', description: '已取消标签' },
    { key: 'tab.active', value: 'قيد التنفيذ', category: 'tab', description: '进行中标签' },

    // === 交易类型筛选 ===
    { key: 'filter.all', value: 'الكل', category: 'filter', description: '全部筛选' },
    { key: 'filter.select_date', value: 'اختيار التاريخ', category: 'filter', description: '选择日期' },
    { key: 'filter.select_date_range', value: 'اختيار نطاق التاريخ', category: 'filter', description: '选择日期范围' },
    { key: 'trans.recharge', value: 'إيداع', category: 'trans', description: '交易类型-充值' },
    { key: 'trans.withdraw_freeze', value: 'سحب مجمّد', category: 'trans', description: '交易类型-提现冻结' },
    { key: 'trans.withdraw_success', value: 'سحب ناجح', category: 'trans', description: '交易类型-提现成功' },
    { key: 'trans.withdraw_refund', value: 'استرداد', category: 'trans', description: '交易类型-提现退款' },
    { key: 'trans.purchase', value: 'شراء', category: 'trans', description: '交易类型-购买' },
    { key: 'trans.income', value: 'دخل', category: 'trans', description: '交易类型-收益' },
    { key: 'trans.commission', value: 'عمولة', category: 'trans', description: '交易类型-返佣' },
    { key: 'trans.sign_in', value: 'تسجيل حضور', category: 'trans', description: '交易类型-签到' },
    { key: 'trans.activity', value: 'نشاط', category: 'trans', description: '交易类型-活动' },
    { key: 'trans.register', value: 'تسجيل', category: 'trans', description: '交易类型-注册' },
    { key: 'trans.admin_add', value: 'تعديل إيجابي', category: 'trans', description: '交易类型-后台加款' },
    { key: 'trans.admin_deduct', value: 'تعديل سلبي', category: 'trans', description: '交易类型-后台扣款' },

    // === 日期分组 ===
    { key: 'date.today', value: 'اليوم', category: 'date', description: '今日分组' },
    { key: 'date.yesterday', value: 'أمس', category: 'date', description: '昨日分组' },
    { key: 'date.last_7_days', value: 'آخر 7 أيام', category: 'date', description: '近7天分组' },
    { key: 'date.last_30_days', value: 'آخر 30 يوم', category: 'date', description: '近30天分组' },
    { key: 'date.this_month', value: 'هذا الشهر', category: 'date', description: '本月分组' },

    // === 额外的按钮 ===
    { key: 'btn.login', value: 'تسجيل الدخول', category: 'btn', description: '登录按钮' },
    { key: 'btn.login_to_buy', value: 'تسجيل الدخول', category: 'btn', description: '登录后购买按钮' },
    { key: 'btn.logging_in', value: 'جارٍ الدخول...', category: 'btn', description: '登录中按钮' },
    { key: 'btn.register', value: 'تسجيل حساب', category: 'btn', description: '注册按钮' },
    { key: 'btn.registering', value: 'جارٍ التسجيل...', category: 'btn', description: '注册中按钮' },
    { key: 'btn.logout', value: 'تسجيل الخروج', category: 'btn', description: '退出登录按钮' },
    { key: 'btn.refresh', value: 'تحديث', category: 'btn', description: '刷新按钮' },
    { key: 'btn.load_more', value: 'تحميل المزيد', category: 'btn', description: '加载更多按钮' },
    { key: 'btn.processing', value: 'جارٍ المعالجة...', category: 'btn', description: '处理中按钮' },
    { key: 'btn.purchasing', value: 'جارٍ المعالجة...', category: 'btn', description: '购买中按钮' },
    { key: 'btn.submitting', value: 'جارٍ المعالجة...', category: 'btn', description: '提交中按钮' },
    { key: 'btn.adding', value: 'جارٍ الإضافة...', category: 'btn', description: '添加中按钮' },
    { key: 'btn.confirm_purchase', value: 'تأكيد الشراء', category: 'btn', description: '确认购买按钮' },
    { key: 'btn.buy_now', value: 'اشترِ الآن', category: 'btn', description: '立即购买按钮' },
    { key: 'btn.bought', value: 'تم الشراء', category: 'btn', description: '已购买按钮' },
    { key: 'btn.vip_required', value: 'يتطلب VIP', category: 'btn', description: '需要VIP按钮' },
    { key: 'btn.insufficient_balance', value: 'رصيد غير كافٍ', category: 'btn', description: '余额不足按钮' },
    { key: 'btn.view_products', value: 'عرض المنتجات', category: 'btn', description: '查看产品按钮' },
    { key: 'btn.view_record', value: 'عرض السجل', category: 'btn', description: '查看记录按钮' },
    { key: 'btn.view_recharge_history', value: 'عرض سجل الإيداعات', category: 'btn', description: '查看充值记录按钮' },
    { key: 'btn.add_card', value: 'إضافة بطاقة', category: 'btn', description: '添加银行卡按钮' },
    { key: 'btn.add_new_card', value: 'إضافة بطاقة جديدة', category: 'btn', description: '添加新银行卡按钮' },
    { key: 'btn.bind_card', value: 'إضافة بطاقة', category: 'btn', description: '绑定银行卡按钮' },
    { key: 'btn.cancel_order', value: 'إلغاء الطلب', category: 'btn', description: '取消订单按钮' },
    { key: 'btn.continue_pay', value: 'متابعة الدفع', category: 'btn', description: '继续支付按钮' },
    { key: 'btn.copy', value: 'نسخ', category: 'btn', description: '复制按钮' },
    { key: 'btn.change_password', value: 'تغيير كلمة المرور', category: 'btn', description: '修改密码按钮' },
    { key: 'btn.clear_filter', value: 'مسح التصفية', category: 'btn', description: '清除筛选按钮' },
    { key: 'btn.back_to_list', value: 'العودة للقائمة', category: 'btn', description: '返回列表按钮' },
    { key: 'btn.back_to_positions', value: 'العودة لاستثماراتي', category: 'btn', description: '返回持仓按钮' },
    { key: 'btn.explore_products', value: 'استكشاف المنتجات', category: 'btn', description: '浏览产品按钮' },
    { key: 'btn.withdraw_all', value: 'الكل', category: 'btn', description: '全部提现按钮' },
    { key: 'btn.participate', value: 'مشاركة', category: 'btn', description: '参与按钮' },

    // === Toast 提示 ===
    { key: 'toast.network_error', value: 'خطأ في الشبكة، حاول مرة أخرى', category: 'toast', description: '网络错误提示' },
    { key: 'toast.register_success', value: 'تم التسجيل بنجاح', category: 'toast', description: '注册成功提示' },
    { key: 'toast.register_failed', value: 'خطأ في التسجيل', category: 'toast', description: '注册失败提示' },
    { key: 'toast.login_success', value: 'تم تسجيل الدخول بنجاح', category: 'toast', description: '登录成功提示' },
    { key: 'toast.login_failed', value: 'خطأ في تسجيل الدخول', category: 'toast', description: '登录失败提示' },
    { key: 'toast.logout_success', value: 'تم تسجيل الخروج', category: 'toast', description: '退出成功提示' },
    { key: 'toast.redirect_login', value: 'يرجى تسجيل الدخول مرة أخرى', category: 'toast', description: '重新登录提示' },
    { key: 'toast.bank_card_added', value: 'تمت إضافة البطاقة بنجاح', category: 'toast', description: '银行卡添加成功' },
    { key: 'toast.withdraw_success', value: 'تم إرسال طلب السحب', category: 'toast', description: '提现申请成功' },
    { key: 'toast.claim_success', value: 'تم المطالبة بالمكافأة', category: 'toast', description: '领取奖励成功' },
    { key: 'toast.update_success', value: 'تم التحديث بنجاح', category: 'toast', description: '更新成功提示' },
    { key: 'toast.update_failed', value: 'خطأ في التحديث', category: 'toast', description: '更新失败提示' },
    { key: 'toast.password_changed', value: 'تم تغيير كلمة المرور بنجاح', category: 'toast', description: '密码修改成功' },
    { key: 'toast.order_cancelled', value: 'تم إلغاء الطلب', category: 'toast', description: '订单取消成功' },
    { key: 'toast.cancel_failed', value: 'خطأ في الإلغاء', category: 'toast', description: '取消失败提示' },
    { key: 'toast.copy_success', value: 'تم النسخ بنجاح', category: 'toast', description: '复制成功提示' },
    { key: 'toast.copy_failed', value: 'خطأ في النسخ', category: 'toast', description: '复制失败提示' },
    { key: 'toast.card_deleted', value: 'تم حذف البطاقة', category: 'toast', description: '银行卡删除成功' },
    { key: 'toast.saveSuccess', value: 'تم الحفظ بنجاح', category: 'toast', description: '保存成功提示' },
    { key: 'toast.saveFailed', value: 'خطأ في الحفظ', category: 'toast', description: '保存失败提示' },
    { key: 'toast.downloadSuccess', value: 'تم التنزيل بنجاح', category: 'toast', description: '下载成功提示' },
    { key: 'toast.copyFailed', value: 'خطأ في النسخ', category: 'toast', description: '复制失败提示（重复key）' },

    // === 个人中心菜单 ===
    { key: 'menu.positions', value: 'استثماراتي', category: 'menu', description: '我的持仓菜单' },
    { key: 'menu.recharge_history', value: 'سجل الإيداعات', category: 'menu', description: '充值记录菜单' },
    { key: 'menu.withdraw_history', value: 'سجل السحوبات', category: 'menu', description: '提现记录菜单' },
    { key: 'menu.transactions', value: 'المعاملات', category: 'menu', description: '资金明细菜单' },
    { key: 'menu.team', value: 'فريقي', category: 'menu', description: '我的团队菜单' },
    { key: 'menu.bank_cards', value: 'البطاقات البنكية', category: 'menu', description: '银行卡菜单' },
    { key: 'menu.security', value: 'الأمان', category: 'menu', description: '安全设置菜单' },
    { key: 'menu.about', value: 'من نحن', category: 'menu', description: '关于我们菜单' },
    { key: 'menu.support', value: 'الدعم', category: 'menu', description: '客服菜单' },
    { key: 'menu.settings', value: 'الإعدادات', category: 'menu', description: '设置菜单' },
    { key: 'menu.messages', value: 'الرسائل', category: 'menu', description: '消息菜单' },
    { key: 'menu.invite', value: 'دعوة أصدقاء', category: 'menu', description: '邀请好友菜单' },
    { key: 'menu.gift_code', value: 'رمز الهدية', category: 'menu', description: '礼品码兑换菜单' },

    // === 额外的标签字段 ===
    { key: 'label.amount', value: 'المبلغ', category: 'label', description: '金额标签' },
    { key: 'label.custom_amount', value: 'مبلغ مخصص', category: 'label', description: '自定义金额标签' },
    { key: 'label.available_balance', value: 'الرصيد المتاح', category: 'label', description: '可用余额标签' },
    { key: 'label.frozen_balance', value: 'الرصيد المجمّد', category: 'label', description: '冻结余额标签' },
    { key: 'label.bank', value: 'البنك', category: 'label', description: '银行标签' },
    { key: 'label.account_no', value: 'رقم الحساب', category: 'label', description: '账号标签' },
    { key: 'label.account_name', value: 'اسم صاحب الحساب', category: 'label', description: '账户名标签' },
    { key: 'label.phone', value: 'الهاتف', category: 'label', description: '手机号标签' },
    { key: 'label.document_type', value: 'نوع الوثيقة', category: 'label', description: '证件类型标签' },
    { key: 'label.document_no', value: 'رقم الوثيقة', category: 'label', description: '证件号码标签' },
    { key: 'label.account_type', value: 'نوع الحساب', category: 'label', description: '账户类型标签' },
    { key: 'label.cci_code', value: 'رمز CCI', category: 'label', description: 'CCI码标签' },
    { key: 'label.card_holder', value: 'صاحب الحساب', category: 'label', description: '持卡人标签' },
    { key: 'label.order_no', value: 'رقم الطلب', category: 'label', description: '订单号标签' },
    { key: 'label.select_channel', value: 'اختيار القناة', category: 'label', description: '选择通道标签' },
    { key: 'label.available', value: 'متاح', category: 'label', description: '可用标签' },
    { key: 'label.old_password', value: 'كلمة المرور الحالية', category: 'label', description: '当前密码标签' },
    { key: 'label.new_password', value: 'كلمة المرور الجديدة', category: 'label', description: '新密码标签' },
    { key: 'label.confirm_password', value: 'تأكيد كلمة المرور', category: 'label', description: '确认密码标签' },
    { key: 'label.invite_code', value: 'رمز الدعوة', category: 'label', description: '邀请码标签' },
    { key: 'label.new_user', value: 'جديد', category: 'label', description: '新用户标签' },
    { key: 'label.balance_after', value: 'الرصيد بعد', category: 'label', description: '交易后余额标签' },
    { key: 'label.related_order', value: 'طلب مرتبط', category: 'label', description: '关联订单标签' },
    { key: 'label.remark', value: 'ملاحظة', category: 'label', description: '备注标签' },
    { key: 'label.or', value: 'أو', category: 'label', description: '或标签' },
    { key: 'label.optional', value: 'اختياري', category: 'label', description: '可选标签' },
    { key: 'label.custom_range', value: 'نطاق مخصص', category: 'label', description: '自定义范围标签' },
    { key: 'label.bound_cards', value: 'البطاقات المرتبطة', category: 'label', description: '已绑定银行卡标签' },
    { key: 'label.total_records', value: 'الإجمالي', category: 'label', description: '总记录数标签' },
    { key: 'label.days', value: 'أيام', category: 'label', description: '天数标签' },
    { key: 'label.days_remaining', value: 'أيام متبقية', category: 'label', description: '剩余天数标签' },
    { key: 'label.day_n', value: 'يوم', category: 'label', description: '第N天标签' },
    { key: 'label.gift', value: 'هدية', category: 'label', description: '赠送标签' },
    { key: 'label.next_income', value: 'الدخل القادم', category: 'label', description: '下次收益标签' },
    { key: 'label.earned_income', value: 'الأرباح المحققة', category: 'label', description: '已获收益标签' },
    { key: 'label.pending_income', value: 'أرباح معلقة', category: 'label', description: '待发放收益标签' },
    { key: 'label.total_income', value: 'إجمالي الأرباح', category: 'label', description: '总收益标签' },
    { key: 'label.purchase_time', value: 'تاريخ الشراء', category: 'label', description: '购买时间标签' },
    { key: 'label.complete_time', value: 'تاريخ الانتهاء', category: 'label', description: '完成时间标签' },
    { key: 'label.purchase_amount', value: 'مبلغ الاستثمار', category: 'label', description: '投资金额标签' },
    { key: 'label.daily_income', value: 'الدخل اليومي', category: 'label', description: '日收益标签' },
    { key: 'label.cycle_days', value: 'مدة الدورة', category: 'label', description: '周期天数标签' },
    { key: 'label.all_income_received', value: 'تم استلام جميع الأرباح', category: 'label', description: '所有收益已发放标签' },
    { key: 'label.total_earned', value: 'إجمالي الأرباح', category: 'label', description: '累计收益标签' },
    { key: 'label.active_positions', value: 'نشطة', category: 'label', description: '活跃持仓标签' },
    { key: 'label.today_income', value: 'اليوم', category: 'label', description: '今日收益标签' },
    { key: 'label.total_invested', value: 'الاستثمار', category: 'label', description: '累计投资标签' },
    { key: 'label.completed_positions', value: 'مكتملة', category: 'label', description: '已完成持仓标签' },
    { key: 'label.next_income_countdown', value: 'الدخل القادم خلال', category: 'label', description: '下次收益倒计时标签' },
    { key: 'label.settle_time', value: 'وقت التسوية', category: 'label', description: '结算时间标签' },
    { key: 'label.expected_income', value: 'الدخل المتوقع', category: 'label', description: '预期收益标签' },
    { key: 'label.phone_prefix', value: '+212', category: 'label', description: '手机号区号标签（摩洛哥）' },

    // === 额外的占位符 ===
    { key: 'placeholder.phone', value: '6XXXXXXXX', category: 'placeholder', description: '手机号占位符（摩洛哥9位）' },
    { key: 'placeholder.password', value: 'أدخل كلمة المرور', category: 'placeholder', description: '密码占位符' },
    { key: 'placeholder.password_register', value: 'أحرف + أرقام، 6 كحد أدنى', category: 'placeholder', description: '注册密码占位符' },
    { key: 'placeholder.confirm_password', value: 'أكّد كلمة المرور الجديدة', category: 'placeholder', description: '确认密码占位符' },
    { key: 'placeholder.invite_code', value: 'أدخل رمزاً من 8 أحرف', category: 'placeholder', description: '邀请码占位符' },
    { key: 'placeholder.old_password', value: 'أدخل كلمة المرور الحالية', category: 'placeholder', description: '当前密码占位符' },
    { key: 'placeholder.new_password', value: 'أدخل كلمة المرور الجديدة', category: 'placeholder', description: '新密码占位符' },
    { key: 'placeholder.nickname', value: 'أدخل اسمك', category: 'placeholder', description: '昵称占位符' },
    { key: 'placeholder.select_bank', value: 'اختيار البنك', category: 'placeholder', description: '选择银行占位符' },
    { key: 'placeholder.search_bank', value: 'بحث عن بنك...', category: 'placeholder', description: '搜索银行占位符' },
    { key: 'placeholder.account_no', value: 'أدخل رقم الحساب', category: 'placeholder', description: '账号占位符' },
    { key: 'placeholder.account_name', value: 'أدخل الاسم الكامل', category: 'placeholder', description: '账户名占位符' },

    // === 额外的错误提示 ===
    { key: 'error.load_failed', value: 'خطأ في التحميل', category: 'error', description: '加载失败' },
    { key: 'error.load_failed_tip', value: 'تعذر تحميل البيانات', category: 'error', description: '加载失败提示' },
    { key: 'error.server', value: 'خطأ في الخادم', category: 'error', description: '服务器错误' },
    { key: 'error.try_again', value: 'تعذر التحميل. حاول مرة أخرى.', category: 'error', description: '重试提示' },
    { key: 'error.insufficient_balance', value: 'رصيد غير كافٍ', category: 'error', description: '余额不足' },
    { key: 'error.already_purchased', value: 'لقد اشتريت هذا المنتج بالفعل', category: 'error', description: '已购买该产品' },
    { key: 'error.vip_required', value: 'مستوى VIP غير كافٍ', category: 'error', description: 'VIP等级不足' },
    { key: 'error.vip_required_desc', value: 'يتطلب VIP', category: 'error', description: 'VIP等级不足描述' },
    { key: 'error.amount_out_of_range', value: 'يجب أن يكون المبلغ بين {min} و {max}', category: 'error', description: '金额超范围（{min}{max}为变量）' },
    { key: 'error.amount_min', value: 'الحد الأدنى للمبلغ هو {min}', category: 'error', description: '最小金额（{min}为变量）' },
    { key: 'error.amount_max', value: 'الحد الأقصى للمبلغ هو {max}', category: 'error', description: '最大金额（{max}为变量）' },
    { key: 'error.select_channel', value: 'يرجى اختيار قناة الدفع', category: 'error', description: '请选择支付通道' },
    { key: 'error.pending_order_limit', value: 'لديك طلبات معلقة كثيرة جداً', category: 'error', description: '待处理订单过多' },
    { key: 'error.phone_required', value: 'أدخل رقم الهاتف', category: 'error', description: '请输入手机号' },
    { key: 'error.phone_invalid', value: 'رقم الهاتف غير صالح (9 أرقام)', category: 'error', description: '手机号格式错误' },
    { key: 'error.phone_already_exists', value: 'هذا الرقم مسجل بالفعل', category: 'error', description: '手机号已注册' },
    { key: 'error.invalid_invite_code', value: 'رمز الدعوة غير صالح', category: 'error', description: '邀请码无效' },
    { key: 'error.register_ip_limit', value: 'عدد كبير جداً من التسجيلات من هذا العنوان', category: 'error', description: '同IP注册过多' },
    { key: 'error.rate_limited', value: 'محاولات كثيرة جداً. انتظر لحظة.', category: 'error', description: '请求频率限制' },
    { key: 'error.invalid_credentials', value: 'رقم الهاتف أو كلمة المرور غير صحيحة', category: 'error', description: '手机号或密码错误' },
    { key: 'error.user_banned', value: 'تم تعليق حسابك. اتصل بالدعم.', category: 'error', description: '账号被封禁' },
    { key: 'error.login_required', value: 'يرجى تسجيل الدخول', category: 'error', description: '请登录' },
    { key: 'error.old_password_wrong', value: 'كلمة المرور الحالية غير صحيحة', category: 'error', description: '当前密码错误' },
    { key: 'error.old_password_required', value: 'يرجى إدخال كلمة المرور الحالية', category: 'error', description: '请输入当前密码' },
    { key: 'error.same_password', value: 'كلمة المرور الجديدة لا يمكن أن تكون مثل السابقة', category: 'error', description: '新旧密码不能相同' },
    { key: 'error.password_validation', value: 'كلمة المرور لا تستوفي المتطلبات', category: 'error', description: '密码不符合要求' },
    { key: 'error.password_letter', value: 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل', category: 'error', description: '密码需包含字母' },
    { key: 'error.password_number', value: 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل', category: 'error', description: '密码需包含数字' },
    { key: 'error.confirm_password_required', value: 'يرجى تأكيد كلمة المرور الجديدة', category: 'error', description: '请确认密码' },
    { key: 'error.password_mismatch', value: 'كلمات المرور غير متطابقة', category: 'error', description: '密码不一致' },
    { key: 'error.bank_required', value: 'اختر بنكاً', category: 'error', description: '请选择银行' },
    { key: 'error.account_no_required', value: 'أدخل رقم الحساب', category: 'error', description: '请输入账号' },
    { key: 'error.account_no_invalid', value: 'رقم الحساب غير صالح (8-20 رقم)', category: 'error', description: '账号格式错误' },
    { key: 'error.account_name_required', value: 'أدخل اسم صاحب الحساب', category: 'error', description: '请输入持卡人姓名' },
    { key: 'error.account_name_too_short', value: 'الاسم قصير جداً', category: 'error', description: '姓名过短' },
    { key: 'error.bank_card_limit', value: 'لقد بلغت الحد الأقصى للبطاقات', category: 'error', description: '银行卡数量达上限' },
    { key: 'error.add_card_failed', value: 'خطأ في إضافة البطاقة', category: 'error', description: '添加银行卡失败' },
    { key: 'error.load_banks_failed', value: 'خطأ في تحميل البنوك', category: 'error', description: '加载银行列表失败' },
    { key: 'error.load_cards_failed', value: 'خطأ في تحميل البطاقات', category: 'error', description: '加载银行卡失败' },
    { key: 'error.delete_failed', value: 'خطأ في الحذف', category: 'error', description: '删除失败' },
    { key: 'error.claim_failed', value: 'خطأ في المطالبة', category: 'error', description: '领取失败' },
    { key: 'error.product_not_found', value: 'المنتج غير موجود', category: 'error', description: '产品不存在' },
    { key: 'error.order_not_found', value: 'الطلب غير موجود', category: 'error', description: '订单不存在' },
    { key: 'error.position_not_found', value: 'الاستثمار غير موجود', category: 'error', description: '持仓不存在' },

    // === 额外的提示 ===
    { key: 'tip.loading', value: 'جارٍ التحميل...', category: 'tip', description: '加载中' },
    { key: 'tip.loading_more', value: 'جارٍ تحميل المزيد...', category: 'tip', description: '加载更多中' },
    { key: 'tip.amount_range', value: 'النطاق: {min} - {max}', category: 'tip', description: '金额范围提示（{min}{max}为变量）' },
    { key: 'tip.no_account', value: 'ليس لديك حساب؟', category: 'tip', description: '无账号提示' },
    { key: 'tip.has_account', value: 'لديك حساب بالفعل؟', category: 'tip', description: '有账号提示' },
    { key: 'tip.frozen_balance', value: 'الرصيد المجمّد يشمل السحوبات قيد المعالجة', category: 'tip', description: '冻结余额说明' },
    { key: 'tip.countdown_label', value: 'الوقت المتبقي', category: 'tip', description: '倒计时标签' },
    { key: 'tip.withdraw_outside_time', value: 'خارج أوقات السحب', category: 'tip', description: '非提现时间段提示' },
    { key: 'tip.withdraw_limit_reached', value: 'لقد بلغت الحد الأقصى للسحوبات اليومية', category: 'tip', description: '每日提现次数已达上限' },
    { key: 'tip.withdraw_bank_note', value: 'يمكنك السحب فقط إلى البطاقات المسجلة', category: 'tip', description: '只能提现到已绑定银行卡' },
    { key: 'tip.enter_amount_to_calculate', value: 'أدخل المبلغ للحساب', category: 'tip', description: '输入金额后计算' },
    { key: 'tip.cards_secure_title', value: 'بياناتك آمنة', category: 'tip', description: '银行卡安全标题' },
    { key: 'tip.cards_secure_desc', value: 'جميع المعلومات البنكية مشفرة ومحمية', category: 'tip', description: '银行卡安全描述' },
    { key: 'tip.max_cards_reached', value: 'تم بلوغ الحد الأقصى', category: 'tip', description: '银行卡数量达上限' },
    { key: 'tip.add_card_hint', value: 'اضغط لإضافة بطاقة بنكية', category: 'tip', description: '添加银行卡引导' },

    // === 额外的余额 ===
    { key: 'balance.current', value: 'الرصيد الحالي', category: 'balance', description: '当前余额' },
    { key: 'balance.deduct', value: 'خصم', category: 'balance', description: '扣除金额' },
    { key: 'balance.after', value: 'الرصيد بعد', category: 'balance', description: '交易后余额' },

    // === 额外的通用文案 ===
    { key: 'common.viewMore', value: 'عرض المزيد', category: 'common', description: '查看更多' },
    { key: 'common.or_above', value: 'أو أعلى', category: 'common', description: '或以上' },
    { key: 'common.retry', value: 'إعادة المحاولة', category: 'common', description: '重试' },

    // === 额外的业务字段 ===
    { key: 'biz.withdraw_time', value: 'أوقات السحب', category: 'biz', description: '提现时间段' },
    { key: 'biz.withdraw_limit', value: 'الحد اليومي', category: 'biz', description: '每日提现限制' },
    { key: 'biz.withdraw_remaining', value: 'المتبقية', category: 'biz', description: '剩余提现次数' },
    { key: 'biz.withdraw_range', value: 'نطاق المبلغ', category: 'biz', description: '提现金额范围' },
    { key: 'biz.apply_amount', value: 'المبلغ المطلوب', category: 'biz', description: '申请金额' },
    { key: 'biz.fee', value: 'عمولة', category: 'biz', description: '手续费' },
    { key: 'biz.actual_amount', value: 'المبلغ الفعلي', category: 'biz', description: '实际到账金额' },
    { key: 'biz.order_no', value: 'رقم الطلب', category: 'biz', description: '订单号' },
    { key: 'biz.status', value: 'الحالة', category: 'biz', description: '状态' },
    { key: 'biz.channel_name', value: 'قناة الدفع', category: 'biz', description: '支付通道名称' },
    { key: 'biz.bank_name', value: 'البنك', category: 'biz', description: '银行名称' },
    { key: 'biz.account_no', value: 'رقم الحساب', category: 'biz', description: '银行账号' },
    { key: 'biz.account_name', value: 'صاحب الحساب', category: 'biz', description: '持卡人姓名' },
    { key: 'biz.reject_reason', value: 'سبب الرفض', category: 'biz', description: '拒绝原因' },
    { key: 'biz.create_time', value: 'تاريخ الإنشاء', category: 'biz', description: '创建时间' },
    { key: 'biz.expire_time', value: 'وقت الانتهاء', category: 'biz', description: '过期时间' },
    { key: 'biz.complete_time', value: 'تاريخ الدفع', category: 'biz', description: '完成时间' },
    { key: 'biz.review_time', value: 'تاريخ المراجعة', category: 'biz', description: '审核时间' },

    // === 忘记密码页 ===
    { key: 'page.forgot_password_title', value: 'نسيت كلمة المرور؟', category: 'page', description: '忘记密码页标题' },
    { key: 'page.forgot_password_subtitle', value: 'لا تقلق، نحن هنا لمساعدتك', category: 'page', description: '忘记密码页副标题' },
    { key: 'page.forgot_password_desc', value: 'لاسترداد حسابك، يرجى التواصل مع فريق الدعم لدينا عبر القنوات التالية:', category: 'page', description: '忘记密码页说明文案' },
    { key: 'link.forgot_password', value: 'نسيت كلمة المرور؟', category: 'link', description: '忘记密码链接文案' },
    { key: 'link.back_to_login', value: 'العودة لتسجيل الدخول', category: 'link', description: '返回登录链接文案' },

    // === 额外的链接 ===
    { key: 'link.go_login', value: 'تسجيل الدخول', category: 'link', description: '登录链接文案' },
    { key: 'link.go_register', value: 'سجّل حسابك', category: 'link', description: '注册链接文案' },

    // === 额外的空状态 ===
    { key: 'empty.transactions_filtered', value: 'لا توجد نتائج', category: 'empty', description: '无筛选结果' },
    { key: 'empty.transactions_filtered_tip', value: 'لم يتم العثور على معاملات بالتصفية المحددة', category: 'empty', description: '无筛选结果提示' },
    { key: 'empty.transactions_tip', value: 'ليس لديك سجل معاملات بعد', category: 'empty', description: '无交易记录提示' },

    // === 时段问候 ===
    { key: 'greeting.morning', value: 'صباح الخير', category: 'greeting', description: '早安问候' },
    { key: 'greeting.afternoon', value: 'مساء الخير', category: 'greeting', description: '下午问候' },
    { key: 'greeting.evening', value: 'مساء الخير', category: 'greeting', description: '晚间问候' },

    // === 首页模块补充 ===
    { key: 'home.dailySignin', value: 'حضور يومي', category: 'home', description: '每日签到入口' },
    { key: 'home.myTeam', value: 'فريقي', category: 'home', description: '我的团队' },
    { key: 'home.inviteAndEarn', value: 'ادعُ واكسب', category: 'home', description: '邀请得奖励' },
    { key: 'home.commission', value: 'عمولة', category: 'home', description: '佣金' },
    { key: 'home.inviteNow', value: 'ادعُ الآن', category: 'home', description: '立即邀请' },
    { key: 'home.members', value: 'أعضاء', category: 'home', description: '成员' },
    { key: 'home.totalCommission', value: 'إجمالي العمولة', category: 'home', description: '总佣金' },
    { key: 'home.discoverNext', value: 'اكتشف استثمارك', category: 'home', description: '发现下一项' },
    { key: 'home.realEstateInvestment', value: 'العقاري القادم', category: 'home', description: '房地产投资' },
    { key: 'home.exploreProducts', value: 'استكشاف المنتجات', category: 'home', description: '探索产品' },
    { key: 'home.myInvestments', value: 'استثماراتي', category: 'home', description: '我的投资' },
    { key: 'home.activePositions', value: 'نشطة', category: 'home', description: '活跃持仓数' },
    { key: 'home.invested', value: 'مستثمر', category: 'home', description: '已投资' },
    { key: 'home.todayLabel', value: 'اليوم', category: 'home', description: '今日标签' },
    { key: 'home.totalLabel', value: 'الإجمالي', category: 'home', description: '总计标签' },
    { key: 'home.myPortfolio', value: 'محفظتي', category: 'home', description: '我的组合' },
    { key: 'home.featuredProperties', value: 'عقارات مميزة', category: 'home', description: '精选房产' },

    // === 首页签到补充 ===
    { key: 'signin.completed', value: 'مكتمل', category: 'signin', description: '签到完成' },
    { key: 'signin.todayDone', value: 'تم التسجيل اليوم', category: 'signin', description: '今日已签' },
    { key: 'signin.dailyReward', value: 'حضور يومي', category: 'signin', description: '每日签到奖励' },
    { key: 'signin.allCompleted', value: 'مكتمل', category: 'signin', description: '全部完成' },
    { key: 'signin.signed', value: 'تم التسجيل', category: 'signin', description: '已签到' },
    { key: 'signin.signNow', value: 'تسجيل الحضور', category: 'signin', description: '立即签到' },

    // === 通用补充 ===
    { key: 'common.of', value: 'من', category: 'common', description: '连词' },

    // === 理财产品 ===
    { key: 'financial.maturity', value: 'عند الاستحقاق', category: 'financial', description: '到期' },
    { key: 'financial.invest_now', value: 'استثمر الآن', category: 'financial', description: '立即投资' },

    // === 产品详情补充 ===
    { key: 'product.roi_title', value: 'عائد الاستثمار', category: 'product', description: 'ROI标题' },
    { key: 'product.limit', value: 'الحد', category: 'product', description: '限购' },
    { key: 'product.per_user', value: 'لكل مستخدم', category: 'product', description: '每人' },
    { key: 'product.income_tip', value: 'يتم إضافة الأرباح يومياً إلى رصيدك المتاح', category: 'product', description: '收益提示' },
    { key: 'product.coming_soon', value: 'قريباً', category: 'product', description: '即将推出' },

    // === 单位补充 ===
    { key: 'unit.day', value: 'يوم', category: 'unit', description: '天（单数）' },

    // === 分享 ===
    { key: 'share.link_copied', value: 'تم نسخ الرابط', category: 'share', description: '链接已复制' },

    // === 奖池活动 ===
    { key: 'pool.title', value: 'صندوق الجوائز اليومي', category: 'pool', description: '奖池标题' },
    { key: 'pool.remaining', value: 'المتبقي', category: 'pool', description: '剩余' },
    { key: 'pool.next_reset', value: 'إعادة التعيين القادمة', category: 'pool', description: '下次重置' },

    // === 产品列表页标题 ===
    { key: 'products.title_line1', value: 'استثمارات', category: 'products', description: '产品页标题行1' },
    { key: 'products.title_line2', value: 'عقارية', category: 'products', description: '产品页标题行2' },

    // === 导航补充 ===
    { key: 'nav.team', value: 'الفريق', category: 'nav', description: '团队导航' },
    { key: 'nav.community', value: 'المجتمع', category: 'nav', description: '社区导航' },
    { key: 'nav.spin_wheel', value: 'عجلة الحظ', category: 'nav', description: '转盘导航' },
    { key: 'nav.settings', value: 'الإعدادات', category: 'nav', description: '设置导航' },

    // === 社区状态 ===
    { key: 'community.status.pending', value: 'قيد المراجعة', category: 'community', description: '社区帖子待审核' },
    { key: 'community.status.approved', value: 'تمت الموافقة', category: 'community', description: '社区帖子已通过' },
    { key: 'community.status.rejected', value: 'مرفوض', category: 'community', description: '社区帖子已拒绝' },
    { key: 'community.share_withdraw', value: 'شارك سحبك في الساحة', category: 'community', description: '分享提现到广场' },
    { key: 'community.share_proof', value: 'مشاركة في الساحة', category: 'community', description: '分享凭证到广场' },

    // === 充值页补充 ===
    { key: 'recharge.new_balance', value: 'الرصيد الجديد', category: 'recharge', description: '充值后新余额' },
    { key: 'recharge.secure', value: 'دفع آمن', category: 'recharge', description: '安全支付标识' },
    { key: 'recharge.processing_time', value: 'المعالجة ~5 دقائق', category: 'recharge', description: '处理时间' },

    // === 操作按钮 ===
    { key: 'action.show', value: 'إظهار', category: 'action', description: '显示' },
    { key: 'action.hide', value: 'إخفاء', category: 'action', description: '隐藏' },

    // === 空状态补充 ===
    { key: 'empty.no_bank_card', value: 'لا توجد بطاقات مرتبطة', category: 'empty', description: '无绑定银行卡' },
    { key: 'empty.add_bank_card_tip', value: 'أضف بطاقة للسحب', category: 'empty', description: '添加银行卡提示' },

    // === 标签补充 ===
    { key: 'tag.recommend', value: 'موصى به', category: 'tag', description: '推荐标签' },
    { key: 'tag.vip_upgrade', value: 'ترقية إلى VIP{level}', category: 'tag', description: 'VIP升级标签（{level}为变量）' },
  ];

  // 使用 upsert 确保幂等性
  for (const text of texts) {
    await prisma.textConfig.upsert({
      where: { key: text.key },
      update: {
        value: text.value,
        category: text.category,
        description: text.description,
      },
      create: {
        key: text.key,
        value: text.value,
        category: text.category,
        description: text.description,
      },
    });
  }

  console.log(`  ✓ 已创建 ${texts.length} 条文案配置`);
}

// ================================
// 初始化轮播图（Banner）
// ================================

/**
 * 初始化默认轮播图
 * @description 创建西班牙语默认轮播图
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.8节 - Banner表
 */
async function seedBanners() {
  console.log('📸 初始化轮播图...');

  const banners = [
    {
      imageUrl: '/images/banners/welcome.jpg',
      linkType: 'NONE' as const,
      isActive: true,
      sortOrder: 1,
    },
    {
      imageUrl: '/images/banners/promotion.jpg',
      linkType: 'NONE' as const,
      isActive: true,
      sortOrder: 2,
    },
    {
      imageUrl: '/images/banners/investment.jpg',
      linkType: 'NONE' as const,
      isActive: true,
      sortOrder: 3,
    },
  ];

  // 使用 createMany 或逐条创建
  for (const banner of banners) {
    const existingBanner = await prisma.banner.findFirst({
      where: { imageUrl: banner.imageUrl },
    });

    if (!existingBanner) {
      await prisma.banner.create({
        data: banner,
      });
    }
  }

  console.log(`  ✓ 已创建 ${banners.length} 条轮播图`);
}

// ================================
// 初始化系统公告
// ================================

/**
 * 初始化默认系统公告
 * @description 创建阿拉伯语默认系统公告
 * @depends 开发文档/02-数据层/02.1-数据库设计.md 第2.8节 - Announcement表
 */
async function seedAnnouncements() {
  console.log('📢 初始化系统公告...');

  const announcements = [
    {
      title: 'مرحباً بك في منصتنا!',
      content: `
        <div style="padding: 16px;">
          <h3 style="color: #f97316; margin-bottom: 12px;">عزيزي المستخدم:</h3>
          <p style="margin-bottom: 8px;">شكراً لانضمامك إلى منصتنا الاستثمارية. نقدم لك:</p>
          <ul style="margin-left: 20px; margin-bottom: 16px;">
            <li>منتجات استثمارية عالية العائد</li>
            <li>إيداع وسحب سريع وآمن</li>
            <li>خدمة عملاء على مدار الساعة</li>
            <li>مكافآت لدعوة الأصدقاء</li>
          </ul>
          <p style="color: #666;">ابدأ رحلتك الاستثمارية الآن!</p>
        </div>
      `,
      targetType: 'ALL' as const,
      popupFrequency: 'ONCE' as const,
      buttons: JSON.stringify([
        { text: 'فهمت', type: 'primary', action: 'close' }
      ]),
      isActive: true,
      sortOrder: 1,
    },
    {
      title: 'منتج VIP جديد متاح',
      content: `
        <div style="padding: 16px;">
          <h3 style="color: #f97316; margin-bottom: 12px;">أخبار رائعة!</h3>
          <p style="margin-bottom: 12px;">لقد أطلقنا منتجات جديدة بعوائد أعلى:</p>
          <ul style="margin-left: 20px; margin-bottom: 16px;">
            <li>VIC1: عائد يومي 8 MAD</li>
            <li>VIC2: عائد يومي 15 MAD</li>
            <li>VIC3 وأعلى: فوائد أكبر</li>
          </ul>
          <p style="color: #888; font-size: 14px;">قم بترقية مستوى VIP الخاص بك للحصول على المزيد من الفوائد.</p>
        </div>
      `,
      targetType: 'ALL' as const,
      popupFrequency: 'ONCE' as const,
      buttons: JSON.stringify([
        { text: 'عرض المنتجات', type: 'primary', action: 'navigate', url: '/products' },
        { text: 'إغلاق', type: 'default', action: 'close' }
      ]),
      isActive: false,
      sortOrder: 2,
    },
  ];

  for (const announcement of announcements) {
    const existing = await prisma.announcement.findFirst({
      where: { title: announcement.title },
    });

    if (!existing) {
      await prisma.announcement.create({
        data: {
          title: announcement.title,
          content: announcement.content,
          targetType: announcement.targetType,
          popupFrequency: announcement.popupFrequency,
          buttons: JSON.parse(announcement.buttons),
          isActive: announcement.isActive,
          sortOrder: announcement.sortOrder,
        },
      });
    }
  }

  console.log(`  ✓ 已创建 ${announcements.length} 条系统公告`);
}

// ================================
// 初始化客服链接
// ================================

/**
 * 初始化默认客服链接
 * @description 创建阿拉伯语默认客服链接
 * @depends 开发文档/02-数据层/02.1-数据库设计.md - ServiceLink表
 */
async function seedServiceLinks() {
  console.log('💬 初始化客服链接...');

  const serviceLinks = [
    {
      name: 'WhatsApp',
      type: 'whatsapp',
      url: 'https://wa.me/212608732761',
      iconUrl: '/images/icons/whatsapp.png',
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Telegram',
      type: 'telegram',
      url: 'https://t.me/support_bot',
      iconUrl: '/images/icons/telegram.png',
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'الدعم عبر الإنترنت',
      type: 'online',
      url: '/support',
      iconUrl: '/images/icons/support.png',
      sortOrder: 3,
      isActive: false,
    },
  ];

  for (const link of serviceLinks) {
    const existing = await prisma.serviceLink.findFirst({
      where: { type: link.type },
    });

    if (!existing) {
      await prisma.serviceLink.create({
        data: link,
      });
    }
  }

  console.log(`  ✓ 已创建 ${serviceLinks.length} 条客服链接`);
}

// ================================
// 14. 周薪档位初始化
// ================================

async function seedWeeklySalaryTiers() {
  console.log('💰 初始化周薪档位...');
  const existingCount = await prisma.weeklySalary.count();
  if (existingCount > 0) {
    console.log('周薪档位已存在，跳过');
    return;
  }
  const tiers = [
    { minRecharge: 15000, rewardAmount: 88, sortOrder: 1 },
    { minRecharge: 30000, rewardAmount: 388, sortOrder: 2 },
    { minRecharge: 50000, rewardAmount: 588, sortOrder: 3 },
    { minRecharge: 100000, rewardAmount: 888, sortOrder: 4 },
    { minRecharge: 200000, rewardAmount: 1288, sortOrder: 5 },
    { minRecharge: 500000, rewardAmount: 1888, sortOrder: 6 },
  ];
  for (const tier of tiers) {
    await prisma.weeklySalary.create({
      data: {
        minRecharge: new Decimal(tier.minRecharge),
        rewardAmount: new Decimal(tier.rewardAmount),
        sortOrder: tier.sortOrder,
      },
    });
  }
  console.log(`  ✓ 已创建 ${tiers.length} 个周薪档位`);
}

// ================================
// 15. 奖池初始化
// ================================

async function seedPrizePool() {
  console.log('🎯 初始化奖池...');
  const existingPool = await prisma.prizePool.count();
  if (existingPool > 0) {
    console.log('奖池已存在，跳过');
    return;
  }
  const existingTiers = await prisma.prizePoolTier.count();
  if (existingTiers > 0) {
    console.log('奖池档位已存在，跳过');
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  await prisma.prizePool.create({
    data: {
      dailyTotal: new Decimal(1000),
      remainToday: new Decimal(1000),
      lastResetDate: today,
    },
  });
  const tiers = [
    { requiredInvites: 10, rewardAmount: 18, sortOrder: 1 },
    { requiredInvites: 20, rewardAmount: 28, sortOrder: 2 },
    { requiredInvites: 50, rewardAmount: 38, sortOrder: 3 },
  ];
  for (const tier of tiers) {
    await prisma.prizePoolTier.create({
      data: {
        requiredInvites: tier.requiredInvites,
        rewardAmount: new Decimal(tier.rewardAmount),
        sortOrder: tier.sortOrder,
      },
    });
  }
  console.log(`  ✓ 已创建奖池及 ${tiers.length} 个奖池档位`);
}

// ================================
// 16. 转盘奖品初始化
// ================================

async function seedSpinWheelPrizes() {
  console.log('🎡 初始化转盘奖品...');
  const existingCount = await prisma.spinWheelPrize.count();
  if (existingCount > 0) {
    console.log('转盘奖品已存在，跳过');
    return;
  }
  const prizes = [
    { name: '3 MAD', amount: 3, probability: 20.00, sortOrder: 1 },
    { name: '5 MAD', amount: 5, probability: 15.00, sortOrder: 2 },
    { name: '8 MAD', amount: 8, probability: 10.00, sortOrder: 3 },
    { name: 'شكراً', amount: 0, probability: 40.00, sortOrder: 4 },
    { name: '15 MAD', amount: 15, probability: 6.00, sortOrder: 5 },
    { name: '30 MAD', amount: 30, probability: 4.00, sortOrder: 6 },
    { name: '50 MAD', amount: 50, probability: 2.00, sortOrder: 7 },
    { name: '80 MAD', amount: 80, probability: 1.00, sortOrder: 8 },
    { name: '150 MAD', amount: 150, probability: 0.80, sortOrder: 9 },
    { name: '300 MAD', amount: 300, probability: 0.50, sortOrder: 10 },
    { name: '500 MAD', amount: 500, probability: 0.40, sortOrder: 11 },
    { name: '1000 MAD', amount: 1000, probability: 0.30, sortOrder: 12 },
  ];
  for (const prize of prizes) {
    await prisma.spinWheelPrize.create({
      data: {
        name: prize.name,
        amount: new Decimal(prize.amount),
        probability: new Decimal(prize.probability),
        sortOrder: prize.sortOrder,
      },
    });
  }
  console.log(`  ✓ 已创建 ${prizes.length} 个转盘奖品`);
}

// ================================
// 17. 社区奖励档位初始化
// ================================

async function seedCommunityRewardTiers() {
  console.log('👥 初始化社区奖励档位...');
  const existingCount = await prisma.communityRewardTier.count();
  if (existingCount > 0) {
    console.log('社区奖励档位已存在，跳过');
    return;
  }
  const tiers = [
    { minAmount: 30, maxAmount: 150, rewardAmount: 3, sortOrder: 1 },
    { minAmount: 150, maxAmount: 300, rewardAmount: 5, sortOrder: 2 },
    { minAmount: 300, maxAmount: 500, rewardAmount: 8, sortOrder: 3 },
    { minAmount: 500, maxAmount: 1000, rewardAmount: 12.8, sortOrder: 4 },
    { minAmount: 1000, maxAmount: 3000, rewardAmount: 15.8, sortOrder: 5 },
    { minAmount: 3000, maxAmount: 5000, rewardAmount: 18.8, sortOrder: 6 },
    { minAmount: 5000, maxAmount: 20000, rewardAmount: 28.8, sortOrder: 7 },
  ];
  for (const tier of tiers) {
    await prisma.communityRewardTier.create({
      data: {
        minAmount: new Decimal(tier.minAmount),
        maxAmount: new Decimal(tier.maxAmount),
        rewardAmount: new Decimal(tier.rewardAmount),
        sortOrder: tier.sortOrder,
      },
    });
  }
  console.log(`  ✓ 已创建 ${tiers.length} 个社区奖励档位`);
}

// ================================
// 执行种子数据初始化
// ================================

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 种子数据初始化失败:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
