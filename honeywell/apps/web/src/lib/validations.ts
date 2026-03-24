/**
 * @file 表单验证 Schema
 * @description 使用 Zod 定义表单验证规则
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

import { z } from 'zod';
import { getLocaleText, getLocaleTextWithVars } from '@/locales';

// ========================================
// 基础验证规则
// ========================================

/**
 * 手机号验证 Schema
 * @description 摩洛哥手机号：9位纯数字，以5/6/7开头
 */
export const phoneSchema = z
  .string()
  .length(9, 'validation.phone_length')
  .regex(/^[567]\d{8}$/, 'validation.phone_invalid');

/**
 * 密码验证 Schema
 * @description 默认密码验证，使用全局配置的最小长度
 * @deprecated 请使用 createPasswordSchema() 代替，以支持动态配置
 */
export const passwordSchema = z
  .string()
  .min(6, getLocaleTextWithVars('validation.password_min_length', { min: 6 }))
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)/,
    'validation.password_alphanumeric'
  );

/**
 * 创建动态密码验证 Schema
 * @description 根据全局配置动态生成密码验证规则
 * @param config - 密码配置
 */
export function createPasswordSchema(config: {
  minLength?: number;
  maxLength?: number;
  requireLetter?: boolean;
  requireNumber?: boolean;
}) {
  const minLen = config.minLength ?? 6;
  const maxLen = config.maxLength ?? 32;
  let schema = z.string()
    .min(minLen, getLocaleTextWithVars('validation.password_min_length', { min: minLen }))
    .max(maxLen, getLocaleTextWithVars('validation.password_max_length', { max: maxLen }));

  if (config.requireLetter !== false) {
    schema = schema.regex(/[a-zA-Z]/, 'validation.password_require_letter');
  }
  if (config.requireNumber !== false) {
    schema = schema.regex(/\d/, 'validation.password_require_number');
  }

  return schema;
}

/**
 * 邀请码验证 Schema
 * @description 8位字符，排除易混淆字符（可选）
 * @reference 开发文档/03-前端用户端/03.1-登录注册/03.1.2-注册页.md
 */
export const inviteCodeSchema = z
  .string()
  .length(8, 'error.invite_code_format')
  .regex(/^[A-Za-z0-9]+$/, 'error.invite_code_invalid')
  .optional()
  .or(z.literal(''));

/**
 * 金额验证 Schema
 * @description 正数，最多两位小数
 */
export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'validation.amount_invalid')
  .refine((val) => parseFloat(val) > 0, 'validation.amount_positive');

/**
 * 银行卡号验证 Schema
 * @description 摩洛哥银行账号通常为13-24位数字
 */
export const cardNumberSchema = z
  .string()
  .min(13, 'validation.card_number_min')
  .max(24, 'validation.card_number_max')
  .regex(/^\d+$/, 'validation.card_number_numeric');

/**
 * 持卡人姓名验证 Schema
 * @description 2-50个字符，仅允许字母和空格
 */
export const holderNameSchema = z
  .string()
  .min(2, 'validation.holder_name_min')
  .max(50, 'validation.holder_name_max')
  .regex(/^[\p{L}\s]+$/u, 'validation.holder_name_letters');

// ========================================
// 表单验证 Schema
// ========================================

/**
 * 注册表单 Schema
 */
export const registerSchema = z.object({
  /** 手机号 */
  phone: phoneSchema,
  /** 密码 */
  password: passwordSchema,
  /** 确认密码 */
  confirmPassword: z.string(),
  /** 邀请码（可选） */
  inviteCode: inviteCodeSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.password_not_match',
  path: ['confirmPassword'],
});

/**
 * 登录表单 Schema
 */
export const loginSchema = z.object({
  /** 手机号 */
  phone: phoneSchema,
  /** 密码 */
  password: z.string().min(1, 'validation.password_required'),
});

/**
 * 提现表单 Schema
 */
export const withdrawSchema = z.object({
  /** 提现金额 */
  amount: amountSchema,
  /** 银行卡ID */
  bankCardId: z.number().positive('validation.bank_card_required'),
});

/**
 * 动态提现表单 Schema（带范围限制）
 * @param minAmount - 最小提现金额
 * @param maxAmount - 最大提现金额（可用余额）
 */
export const createWithdrawSchema = (minAmount: number, maxAmount: number) =>
  z.object({
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'validation.amount_invalid')
      .refine(
        (val) => parseFloat(val) >= minAmount,
        getLocaleTextWithVars('error.amount_min', { min: minAmount })
      )
      .refine(
        (val) => parseFloat(val) <= maxAmount,
        getLocaleTextWithVars('error.amount_max', { max: maxAmount })
      ),
    bankCardId: z.number().positive('validation.bank_card_required'),
  });

/**
 * 银行卡绑定表单 Schema
 */
export const bankCardSchema = z.object({
  /** 银行代码 */
  bankCode: z.string().min(1, 'validation.bank_required'),
  /** 银行卡号 */
  cardNumber: cardNumberSchema,
  /** 持卡人姓名 */
  holderName: holderNameSchema,
});

/**
 * 充值表单 Schema
 */
export const rechargeSchema = z.object({
  /** 充值金额 */
  amount: amountSchema,
});

/**
 * 动态充值表单 Schema（带范围限制）
 * @param minAmount - 最小充值金额
 * @param maxAmount - 最大充值金额
 */
export const createRechargeSchema = (minAmount: number, maxAmount: number) =>
  z.object({
    amount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'validation.amount_invalid')
      .refine(
        (val) => parseFloat(val) >= minAmount,
        getLocaleTextWithVars('error.amount_min', { min: minAmount })
      )
      .refine(
        (val) => parseFloat(val) <= maxAmount,
        getLocaleTextWithVars('error.amount_max', { max: maxAmount })
      ),
  });

/**
 * 修改密码表单 Schema
 */
export const changePasswordSchema = z.object({
  /** 当前密码 */
  currentPassword: z.string().min(1, 'validation.current_password_required'),
  /** 新密码 */
  newPassword: passwordSchema,
  /** 确认新密码 */
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'validation.password_not_match',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'validation.new_password_different',
  path: ['newPassword'],
});

/**
 * 修改昵称表单 Schema
 */
export const nicknameSchema = z.object({
  /** 昵称 */
  nickname: z
    .string()
    .min(2, 'validation.nickname_min')
    .max(20, 'validation.nickname_max'),
});

// ========================================
// 类型导出
// ========================================

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type WithdrawFormData = z.infer<typeof withdrawSchema>;
export type BankCardFormData = z.infer<typeof bankCardSchema>;
export type RechargeFormData = z.infer<typeof rechargeSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type NicknameFormData = z.infer<typeof nicknameSchema>;
