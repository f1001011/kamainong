/**
 * @file 密码强度指示器组件
 * @description 三段式渐变进度条，颜色渐变（弱-红/中-黄/强-绿）
 * @reference 开发文档/03-前端用户端/03.1-登录注册/03.1.2-注册页.md
 */

'use client';

import { useMemo } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { useText } from '@/hooks/use-text';
import { useAnimationConfig } from '@/hooks/use-animation-config';
import { useGlobalConfig } from '@/hooks/use-global-config';

/**
 * 密码强度等级
 */
export type PasswordStrengthLevel = 'none' | 'weak' | 'medium' | 'strong';

interface PasswordStrengthProps {
  /** 密码值 */
  password: string;
  /** 密码最小长度（可选，默认从全局配置读取） */
  minLength?: number;
}

/**
 * 密码强度配置
 */
/**
 * 密码强度配置
 * @description 依据：03.1.2-注册页.md 第2.3节 - 视觉规范
 * - 弱：bg-red-400 w-1/3
 * - 中：bg-yellow-400 w-2/3
 * - 强：bg-green-400 w-full（注意：不是green-500）
 */
const STRENGTH_CONFIG = {
  none: {
    width: 'w-0',
    bgColor: 'bg-neutral-200',
    textColor: 'text-neutral-400',
    textKey: '',
  },
  weak: {
    width: 'w-1/3',
    bgColor: 'bg-error',
    textColor: 'text-error',
    textKey: 'password.weak',
  },
  medium: {
    width: 'w-2/3',
    bgColor: 'bg-warning',
    textColor: 'text-warning',
    textKey: 'password.medium',
  },
  strong: {
    width: 'w-full',
    bgColor: 'bg-success',
    textColor: 'text-success',
    textKey: 'password.strong',
  },
} as const;

/**
 * 计算密码强度
 * @description 依据：开发文档.md 密码强度规则
 * - 弱：仅满足长度>=8
 * - 中：长度>=8 + 字母数字组合
 * - 强：长度>=10 + 字母数字 + 特殊字符
 */
export function calculatePasswordStrength(password: string, minLen: number = 6): PasswordStrengthLevel {
  if (!password || password.length === 0) {
    return 'none';
  }

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password);
  const isLong = password.length >= minLen + 4;
  const isMinLength = password.length >= minLen;

  // 强：长度>=minLen+4 + 字母数字 + 特殊字符
  if (isLong && hasLetter && hasNumber && hasSpecial) {
    return 'strong';
  }

  // 中：长度>=minLen + 字母数字组合
  if (isMinLength && hasLetter && hasNumber) {
    return 'medium';
  }

  // 弱：仅满足长度>=minLen
  if (isMinLength) {
    return 'weak';
  }

  // 不满足最小长度
  return 'none';
}

/**
 * 密码强度指示器
 * @description 2026高端美学 - 三段式进度条，颜色渐变过渡动画
 */
export function PasswordStrength({ password, minLength }: PasswordStrengthProps) {
  const t = useText();
  const { isAnimationEnabled } = useAnimationConfig();
  const { config: globalConfig } = useGlobalConfig();

  const effectiveMinLength = minLength ?? globalConfig.passwordMinLength ?? 6;

  // 计算密码强度 - 使用 useMemo 防止闪烁
  const strength = useMemo(() => calculatePasswordStrength(password, effectiveMinLength), [password, effectiveMinLength]);

  // 获取当前强度配置
  const strengthCfg = STRENGTH_CONFIG[strength];

  // 如果没有输入密码，不显示
  if (strength === 'none' && password.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <m.div
        initial={isAnimationEnabled ? { opacity: 0, y: -4 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className="space-y-1.5 mt-2"
      >
        {/* 强度进度条背景 - 依据：03.1.2-注册页.md h-1 */}
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          {/* 强度指示条 - 平滑宽度和颜色过渡 */}
          <m.div
            className={`h-full rounded-full ${strengthCfg.bgColor}`}
            initial={false}
            animate={{
              width: strength === 'none' ? '0%' : strength === 'weak' ? '33.33%' : strength === 'medium' ? '66.67%' : '100%',
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
        </div>

        {/* 强度文字提示 */}
        {strength !== 'none' && (
          <m.div
            initial={isAnimationEnabled ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <p className={`text-xs ${strengthCfg.textColor} transition-colors duration-300`}>
              {t('password.strength')}: {t(strengthCfg.textKey)}
            </p>
          </m.div>
        )}
      </m.div>
    </AnimatePresence>
  );
}
