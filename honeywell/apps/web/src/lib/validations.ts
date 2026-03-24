/**
 * @file 表单验证 Schema
 * @description 使用 Zod 定义表单验证规则
 * @reference 开发文档/01-设计系统/01.3-组件规范.md
 */

import { z } from 'zod';

// ========================================
// 基础验证规则
// ========================================

/**
 * 手机号验证 Schema
 * @description 摩洛哥手机号：9位纯数字，以5/6/7开头
 */
export const phoneSchema = z
  .string()
  .length(9, 'يجب أن يتكون الرقم من 9 أرقام')
  .regex(/^[567]\d{8}$/, 'رقم الهاتف غير صالح');

/**
 * 密码验证 Schema
 * @description 默认密码验证，使用全局配置的最小长度
 * @deprecated 请使用 createPasswordSchema() 代替，以支持动态配置
 */
export const passwordSchema = z
  .string()
  .min(6, 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل')
  .regex(
    /^(?=.*[a-zA-Z])(?=.*\d)/,
    'يجب أن تحتوي كلمة المرور على أحرف وأرقام'
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
    .min(minLen, `يجب أن تتكون كلمة المرور من ${minLen} أحرف على الأقل`)
    .max(maxLen, `لا يمكن أن تتجاوز كلمة المرور ${maxLen} حرفاً`);

  if (config.requireLetter !== false) {
    schema = schema.regex(/[a-zA-Z]/, 'يجب أن تحتوي كلمة المرور على حرف واحد على الأقل');
  }
  if (config.requireNumber !== false) {
    schema = schema.regex(/\d/, 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل');
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
  .regex(/^\d+(\.\d{1,2})?$/, 'مبلغ غير صالح')
  .refine((val) => parseFloat(val) > 0, 'يجب أن يكون المبلغ أكبر من 0');

/**
 * 银行卡号验证 Schema
 * @description 摩洛哥银行账号通常为13-24位数字
 */
export const cardNumberSchema = z
  .string()
  .min(13, 'يجب أن يتكون رقم الحساب من 13 رقماً على الأقل')
  .max(24, 'لا يمكن أن يتجاوز رقم الحساب 24 رقماً')
  .regex(/^\d+$/, 'يجب أن يحتوي رقم الحساب على أرقام فقط');

/**
 * 持卡人姓名验证 Schema
 * @description 2-50个字符，仅允许字母和空格
 */
export const holderNameSchema = z
  .string()
  .min(2, 'يجب أن يتكون الاسم من حرفين على الأقل')
  .max(50, 'لا يمكن أن يتجاوز الاسم 50 حرفاً')
  .regex(/^[\p{L}\s]+$/u, 'يجب أن يحتوي الاسم على أحرف فقط');

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
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmPassword'],
});

/**
 * 登录表单 Schema
 */
export const loginSchema = z.object({
  /** 手机号 */
  phone: phoneSchema,
  /** 密码 */
  password: z.string().min(1, 'الرجاء إدخال كلمة المرور'),
});

/**
 * 提现表单 Schema
 */
export const withdrawSchema = z.object({
  /** 提现金额 */
  amount: amountSchema,
  /** 银行卡ID */
  bankCardId: z.number().positive('الرجاء اختيار بطاقة بنكية'),
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
      .regex(/^\d+(\.\d{1,2})?$/, 'مبلغ غير صالح')
      .refine(
        (val) => parseFloat(val) >= minAmount,
        `الحد الأدنى للسحب هو ${minAmount}`
      )
      .refine(
        (val) => parseFloat(val) <= maxAmount,
        `الحد الأقصى للسحب هو ${maxAmount}`
      ),
    bankCardId: z.number().positive('الرجاء اختيار بطاقة بنكية'),
  });

/**
 * 银行卡绑定表单 Schema
 */
export const bankCardSchema = z.object({
  /** 银行代码 */
  bankCode: z.string().min(1, 'الرجاء اختيار بنك'),
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
      .regex(/^\d+(\.\d{1,2})?$/, 'مبلغ غير صالح')
      .refine(
        (val) => parseFloat(val) >= minAmount,
        `الحد الأدنى للإيداع هو ${minAmount}`
      )
      .refine(
        (val) => parseFloat(val) <= maxAmount,
        `الحد الأقصى للإيداع هو ${maxAmount}`
      ),
  });

/**
 * 修改密码表单 Schema
 */
export const changePasswordSchema = z.object({
  /** 当前密码 */
  currentPassword: z.string().min(1, 'الرجاء إدخال كلمة المرور الحالية'),
  /** 新密码 */
  newPassword: passwordSchema,
  /** 确认新密码 */
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'يجب أن تكون كلمة المرور الجديدة مختلفة عن الحالية',
  path: ['newPassword'],
});

/**
 * 修改昵称表单 Schema
 */
export const nicknameSchema = z.object({
  /** 昵称 */
  nickname: z
    .string()
    .min(2, 'يجب أن يتكون الاسم المستعار من حرفين على الأقل')
    .max(20, 'لا يمكن أن يتجاوز الاسم المستعار 20 حرفاً'),
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
