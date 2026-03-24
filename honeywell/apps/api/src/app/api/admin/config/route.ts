/**
 * @file 全局配置 API
 * @description GET /api/admin/config - 获取全局配置
 *              PUT /api/admin/config - 更新全局配置
 * @depends 开发文档/02-数据层/02.4-后台API接口清单.md 第12.1~12.2节
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAdminAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/response';
import { BusinessError } from '@/lib/errors';
import {
  getAdminGlobalConfig,
  updateGlobalConfig,
} from '@/services/system-settings.service';

// ================================
// 辅助函数
// ================================

/**
 * 可选数字字段的 Zod 类型
 * @description Ant Design 的 InputNumber 空值时返回 null，需要同时接受 null 和 undefined
 *              将 null 转换为 undefined，让 Zod 的 .optional() 正常工作
 */
const optionalNumber = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().optional()
  );

/**
 * 可选整数字段的 Zod 类型
 */
const optionalInt = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().int().optional()
  );

/**
 * 可选字符串字段的 Zod 类型
 * @description 将 null 转换为 undefined
 */
const optionalString = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.string().optional()
  );

/**
 * 可选金额字段的 Zod 类型
 * @description 金额字段在 API 中是字符串（如 "20.00"），但前端 InputNumber 可能发送数字
 *              同时接受 string 和 number，统一转为字符串
 */
const optionalAmount = () =>
  z.preprocess(
    (val) => {
      if (val === null || val === undefined) return undefined;
      if (typeof val === 'number') return String(val);
      return val;
    },
    z.string().optional()
  );

/**
 * 可选布尔字段的 Zod 类型
 */
const optionalBoolean = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.boolean().optional()
  );

/**
 * 可选数组字段的 Zod 类型
 */
const optionalNumberArray = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.array(z.number()).optional()
  );

/**
 * 可选字符串数组字段的 Zod 类型
 */
const optionalStringArray = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.array(z.string()).optional()
  );

/**
 * 可选空状态对象的 Zod 类型
 */
const optionalEmptyState = () =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.object({
      imageUrl: z.string(),
      title: z.string(),
      description: z.string(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
    }).optional()
  );

/**
 * 从请求体中移除 null/undefined 值和只读字段
 * @description 前端 Ant Design 表单中空字段返回 null，需要清理后再验证
 */
function cleanRequestBody(body: Record<string, unknown>): Record<string, unknown> {
  // 只读字段列表 - 这些字段不应该被客户端修改
  const readonlyFields = ['globalConfigVersion', 'globalConfigUpdatedAt'];
  
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    // 跳过只读字段
    if (readonlyFields.includes(key)) continue;
    // 跳过 null 和 undefined 值
    if (value === null || value === undefined) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

// ================================
// 更新配置请求体校验 Schema
// @description 所有字段都是可选的，只需传入要修改的字段
//              使用 preprocess 处理 null 值（Ant Design 表单兼容）
//              使用 .passthrough() 替代 .strict()，忽略未知字段
// ================================
const updateConfigSchema = z.object({
  // === 基础信息 ===
  siteName: optionalString(),
  siteDomain: optionalString(),
  siteLogoUrl: optionalString(),
  currencySymbol: optionalString(),
  currencySpace: optionalBoolean(),
  currencyCode: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.string().max(10).optional()
  ),
  currencyDecimals: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().int().min(0).max(4).optional()
  ),
  currencyThousandsSep: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.string().max(1).optional()
  ),
  phoneAreaCode: optionalString(),
  phoneDigitCount: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().int().min(7).max(15).optional()
  ),
  
  // === 时区配置 ===
  systemTimezone: optionalString(),
  timezoneDisplayName: optionalString(),
  
  // === 财务配置 ===
  withdrawFeePercent: optionalNumber(),
  withdrawLimitDaily: optionalInt(),
  withdrawTimeRange: optionalString(),
  serviceTimeRange: optionalString(),
  withdrawRequireRecharge: optionalBoolean(),
  withdrawRequirePurchase: optionalBoolean(),
  withdrawMinAmount: optionalAmount(),
  withdrawMaxAmount: optionalAmount(),
  withdrawQuickAmounts: optionalNumberArray(),
  registerBonus: optionalAmount(),
  registerIpLimit: optionalInt(),
  
  // === 充值配置 ===
  rechargePresets: optionalNumberArray(),
  rechargeMinAmount: optionalAmount(),
  rechargeMaxAmount: optionalAmount(),
  rechargeTimeoutMinutes: optionalInt(),
  rechargeMaxPending: optionalInt(),
  rechargePageTips: optionalString(),
  withdrawPageTips: optionalString(),
  
  // === 银行卡配置 ===
  maxBindcardCount: optionalInt(),
  
  // === 返佣配置 ===
  commissionLevel1Rate: optionalNumber(),
  commissionLevel2Rate: optionalNumber(),
  commissionLevel3Rate: optionalNumber(),
  
  // === 安全配置 ===
  tokenExpiresDays: optionalInt(),
  tokenRenewThresholdDays: optionalInt(),
  passwordMinLength: optionalInt(),
  passwordMaxLength: optionalInt(),
  passwordComplexityRequired: optionalBoolean(),
  passwordStrengthIndicator: optionalBoolean(),
  
  // === API速率限制 ===
  rateLimitGlobal: optionalInt(),
  rateLimitLogin: optionalInt(),
  rateLimitRegister: optionalInt(),
  rateLimitRecharge: optionalInt(),
  rateLimitWithdraw: optionalInt(),
  rateLimitSignin: optionalInt(),
  
  // === Toast配置 ===
  toastDuration: optionalInt(),
  toastPosition: optionalString(),
  
  // === 用户头像/昵称配置 ===
  avatarMaxSize: optionalInt(),
  avatarFormats: optionalString(),
  nicknameMinLength: optionalInt(),
  nicknameMaxLength: optionalInt(),
  sensitiveWordFilterEnabled: optionalBoolean(),
  
  // === 列表与筛选配置 ===
  transactionTimeFilterEnabled: optionalBoolean(),
  defaultPageSize: optionalInt(),
  pageSizeOptions: optionalNumberArray(),
  
  // === 连续签到配置 ===
  signinStreakDisplayEnabled: optionalBoolean(),
  signinStreakRewardEnabled: optionalBoolean(),
  signinStreak7DaysReward: optionalAmount(),
  signinStreak30DaysReward: optionalAmount(),
  
  // === 心跳配置 ===
  heartbeatInterval: optionalInt(),
  heartbeatTimeout: optionalInt(),
  
  // === 收益发放配置 ===
  incomeMaxRetryCount: optionalInt(),
  
  // === 功能开关 ===
  svipRewardEnabled: optionalBoolean(),
  weeklySalaryEnabled: optionalBoolean(),
  prizePoolEnabled: optionalBoolean(),
  spinWheelEnabled: optionalBoolean(),
  communityEnabled: optionalBoolean(),
  financialProductEnabled: optionalBoolean(),
  
  // === 转盘抽奖配置 ===
  spinMaxDaily: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().int().min(0).optional()
  ),
  spinInviteThreshold: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : val),
    z.number().int().min(0).optional()
  ),
  
  // === 定时任务告警配置 ===
  taskFailureAlertEnabled: optionalBoolean(),
  taskConsecutiveFailureThreshold: optionalInt(),
  taskExecutionTimeoutThreshold: optionalInt(),
  taskAlertMethod: optionalStringArray(),
  
  // === 文件上传限制配置 ===
  productImageMaxSize: optionalInt(),
  bannerMaxSize: optionalInt(),
  posterBgMaxSize: optionalInt(),
  allowedImageTypes: optionalString(),
  
  // === 提示文案配置 ===
  withdrawThresholdNotMetTip: optionalString(),
  insufficientBalanceTip: optionalString(),
  vipLevelRequiredTip: optionalString(),
  logoutConfirmTip: optionalString(),
  
  // === 空状态配置 ===
  emptyStatePositions: optionalEmptyState(),
  emptyStateRecharge: optionalEmptyState(),
  emptyStateWithdraw: optionalEmptyState(),
  emptyStateTransaction: optionalEmptyState(),
  emptyStateTeam: optionalEmptyState(),
  emptyStateMessage: optionalEmptyState(),
}).passthrough();

// ================================
// GET /api/admin/config - 获取全局配置
// ================================
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    try {
      const config = await getAdminGlobalConfig();
      return successResponse(config, '获取全局配置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[GET /api/admin/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}

// ================================
// PUT /api/admin/config - 更新全局配置
// ================================
export async function PUT(request: NextRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const rawBody = await req.json();
      
      // ========================================
      // 步骤1: 预处理请求体
      // 清除 null/undefined 值和只读字段（globalConfigVersion, globalConfigUpdatedAt）
      // Ant Design 表单中空 InputNumber 返回 null，需要统一清理
      // ========================================
      const body = cleanRequestBody(rawBody);
      
      // ========================================
      // 步骤2: 校验请求体
      // 使用 z.preprocess 处理剩余的 null 值兼容
      // ========================================
      const parseResult = updateConfigSchema.safeParse(body);
      if (!parseResult.success) {
        console.error('[PUT /api/admin/config] 验证失败:', JSON.stringify(parseResult.error.errors, null, 2));
        return errorResponse(
          'VALIDATION_ERROR',
          parseResult.error.errors[0]?.message || '参数校验失败',
          400
        );
      }
      
      // ========================================
      // 步骤3: 过滤掉 undefined 值，只保留有效字段传给服务层
      // ========================================
      const validData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(parseResult.data)) {
        if (value !== undefined) {
          validData[key] = value;
        }
      }
      
      if (Object.keys(validData).length === 0) {
        return errorResponse('VALIDATION_ERROR', '没有有效的配置更新', 400);
      }
      
      const result = await updateGlobalConfig(validData);
      
      return successResponse(result, '更新全局配置成功');
    } catch (error) {
      if (error instanceof BusinessError) {
        return errorResponse(error.code, error.message, error.httpStatus);
      }
      console.error('[PUT /api/admin/config] 错误:', error);
      return errorResponse('INTERNAL_ERROR', '服务器内部错误', 500);
    }
  });
}
