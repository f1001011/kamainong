/**
 * @file 银行卡表单组件
 * @description 添加银行卡的完整表单，包含所有必填字段
 * @reference 开发文档/03-前端页面/03.6.2-添加编辑银行卡页.md
 * @reference 开发文档/02-数据层/02.3-前端API接口清单.md 第7.2节
 * 
 * 2026高端美学设计要点：
 * - 清晰的表单分组
 * - 银行选择器组件
 * - 账户类型/证件类型选择
 * - 实时校验和友好错误提示
 */

'use client';

import { useState, useCallback, useEffect, type FormEvent } from 'react';
import { m } from 'motion/react';
import {
  RiUserLine,
  RiPhoneLine,
  RiBankCardLine,
} from '@remixicon/react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { BankSelector, type BankOption } from './bank-selector';
import { cn } from '@/lib/utils';
import { useText } from '@/hooks/use-text';
import { useGlobalConfig } from '@/hooks/use-global-config';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { SPRINGS } from '@/lib/animation';
import { get, post, ApiError } from '@/lib/api';

/**
 * 银行卡表单数据
 * 摩洛哥961通道仅需银行+账号+姓名+手机号
 */
export interface BankCardFormData {
  bankCode: string;
  accountNo: string;
  accountName: string;
  phone: string;
}

/**
 * 银行卡表单属性
 */
export interface BankCardFormProps {
  /** 提交成功回调 */
  onSuccess?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
}

/**
 * 银行卡表单组件
 * @description 完整的银行卡添加表单
 * 
 * @example
 * ```tsx
 * <BankCardForm
 *   onSuccess={() => router.back()}
 *   onCancel={() => router.back()}
 * />
 * ```
 */
export function BankCardForm({
  onSuccess,
  onCancel,
}: BankCardFormProps) {
  const t = useText();
  const { config } = useGlobalConfig();
  const { isAnimationEnabled } = useAnimationConfig();

  // === 银行列表状态 ===
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [isBanksLoading, setIsBanksLoading] = useState(true);

  // === 表单数据 ===
  const [formData, setFormData] = useState<BankCardFormData>({
    bankCode: '',
    accountNo: '',
    accountName: '',
    phone: '',
  });

  // === 表单错误 ===
  const [errors, setErrors] = useState<Partial<Record<keyof BankCardFormData, string>>>({});

  // === 提交状态 ===
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================
  // 数据加载
  // ============================================

  /**
   * 加载银行列表
   * 依据：02.3-前端API接口清单 第1.5节
   */
  useEffect(() => {
    const loadBanks = async () => {
      try {
        setIsBanksLoading(true);
        const response = await get<{ list: BankOption[] }>('/banks');
        setBanks(response.list || []);
      } catch (error) {
        console.error('加载银行列表失败:', error);
        toast.error(t('error.load_banks_failed', 'خطأ في تحميل البنوك'));
      } finally {
        setIsBanksLoading(false);
      }
    };

    loadBanks();
  }, [t]);

  // ============================================
  // 表单处理
  // ============================================

  /**
   * 更新表单字段
   */
  const updateField = useCallback(<K extends keyof BankCardFormData>(
    field: K,
    value: BankCardFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  /**
   * 校验表单
   * 注意：已移除所有输入框的数字长度限制，仅保留必填校验
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof BankCardFormData, string>> = {};

    // 银行必填
    if (!formData.bankCode) {
      newErrors.bankCode = t('error.bank_required', 'اختر بنكًا');
    }

    // 账号必填（不限制长度）
    if (!formData.accountNo) {
      newErrors.accountNo = t('error.account_no_required', 'أدخل رقم الحساب');
    }

    // 持卡人姓名必填（不限制长度）
    if (!formData.accountName.trim()) {
      newErrors.accountName = t('error.account_name_required', 'أدخل اسم صاحب الحساب');
    }

    // 手机号必填（不限制长度）
    if (!formData.phone) {
      newErrors.phone = t('error.phone_required', 'أدخل رقم الهاتف');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  /**
   * 提交表单
   */
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();

    // 校验
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      await post('/bank-cards', {
        bankCode: formData.bankCode,
        accountNo: formData.accountNo,
        accountName: formData.accountName.trim(),
        phone: formData.phone,
      });

      // 成功提示
      toast.success(t('toast.bank_card_added', 'تمت إضافة البطاقة بنجاح'));

      // 回调
      onSuccess?.();
    } catch (error) {
      console.error('添加银行卡失败:', error);

      if (error instanceof ApiError) {
        switch (error.code) {
          case 'BANK_CARD_LIMIT_EXCEEDED':
            toast.error(t('error.bank_card_limit', 'لقد وصلت إلى الحد الأقصى للبطاقات'));
            break;
          case 'BANK_DISABLED':
            toast.error(t('error.bank_disabled', 'هذا البنك غير متاح'));
            break;
          case 'BLACKLIST_BANK_CARD':
            toast.error(t('error.bank_card_blacklisted', 'هذه البطاقة غير مسموح بها'));
            break;
          case 'ACCOUNT_PHONE_LOCKED':
            toast.error(t('error.account_phone_locked', 'هذا الحساب مسجل بالفعل برقم آخر'));
            break;
          default:
            toast.error(error.message || t('error.add_card_failed', 'خطأ في إضافة البطاقة'));
        }
      } else {
        toast.error(t('error.network', 'خطأ في الشبكة'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, t, onSuccess]);

  // ============================================
  // 渲染
  // ============================================

  return (
    <m.form
      onSubmit={handleSubmit}
      className="space-y-6"
      {...(isAnimationEnabled && {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: SPRINGS.gentle,
      })}
    >
      {/* 银行选择 */}
      <BankSelector
        banks={banks}
        value={formData.bankCode}
        onChange={(code) => updateField('bankCode', code)}
        isLoading={isBanksLoading}
        label={t('label.bank', 'البنك')}
        placeholder={t('placeholder.select_bank', 'اختر بنكًا')}
        error={errors.bankCode}
        required
      />

      {/* 账号 - 不限制长度 */}
      <FormField
        label={t('label.account_no', 'رقم الحساب')}
        error={errors.accountNo}
        required
      >
        <Input
          type="text"
          inputMode="numeric"
          value={formData.accountNo}
          onChange={(e) => updateField('accountNo', e.target.value.replace(/\D/g, ''))}
          placeholder={t('placeholder.account_no', 'أدخل رقم الحساب')}
          leftElement={<RiBankCardLine className="w-5 h-5 text-neutral-400" />}
          disabled={isSubmitting}
        />
      </FormField>

      {/* 持卡人姓名 - 不限制长度 */}
      <FormField
        label={t('label.account_name', 'اسم صاحب الحساب')}
        error={errors.accountName}
        required
      >
        <Input
          type="text"
          value={formData.accountName}
          onChange={(e) => updateField('accountName', e.target.value)}
          placeholder={t('placeholder.account_name', 'أدخل الاسم الكامل')}
          leftElement={<RiUserLine className="w-5 h-5 text-neutral-400" />}
          disabled={isSubmitting}
        />
      </FormField>

      {/* 手机号 - 不限制长度 */}
      <FormField
        label={t('label.phone', 'الهاتف')}
        error={errors.phone}
        required
      >
        <Input
          type="tel"
          inputMode="numeric"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
          placeholder={t('placeholder.phone', '6XXXXXXXX')}
          leftElement={
            <div className="flex items-center gap-1 text-neutral-400">
              <RiPhoneLine className="w-5 h-5" />
              <span className="text-sm">{t('label.phone_prefix', '+212')}</span>
            </div>
          }
          disabled={isSubmitting}
        />
      </FormField>

      {/* 提交按钮 */}
      <div className="pt-4 space-y-3">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          loadingText={t('btn.adding', 'جارٍ الإضافة...')}
          className="h-14 rounded-xl shadow-glow text-lg"
        >
          {t('btn.add_card', 'إضافة بطاقة')}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-12"
          >
            {t('btn.cancel', 'إلغاء')}
          </Button>
        )}
      </div>
    </m.form>
  );
}

BankCardForm.displayName = 'BankCardForm';
