/**
 * @file 触觉反馈工具
 * @description 为移动端关键操作提供触觉振动反馈，提升高端交互体验
 * @depends 开发文档/01-设计系统/01.2-动画系统.md
 * 
 * 使用 Navigator.vibrate API，仅在支持的设备上生效
 * 不支持的设备静默降级，不影响功能
 */

/**
 * 触觉反馈强度类型
 */
type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * 振动模式配置（毫秒）
 * 数组格式：[振动, 暂停, 振动, ...]
 */
const HAPTIC_PATTERNS: Record<HapticStyle, number | number[]> = {
  /** 轻触 - 按钮点击、切换 */
  light: 10,
  /** 中等 - 操作确认 */
  medium: 25,
  /** 重击 - 重要操作完成 */
  heavy: 50,
  /** 成功 - 签到成功、购买成功、提现提交 */
  success: [30, 50, 30],
  /** 警告 - 余额不足、表单错误 */
  warning: [20, 30, 20, 30, 20],
  /** 错误 - 操作失败 */
  error: [50, 30, 50],
  /** 选择 - 列表项选择、Tab切换 */
  selection: 5,
};

/**
 * 检测是否支持触觉反馈
 */
function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * 触发触觉反馈
 * @param style - 反馈强度类型
 * 
 * @example
 * ```tsx
 * // 按钮点击
 * <Button onClick={() => { haptic('light'); handleClick(); }}>
 * 
 * // 签到成功
 * haptic('success');
 * 
 * // Tab切换
 * haptic('selection');
 * ```
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (!isHapticSupported()) return;

  try {
    const pattern = HAPTIC_PATTERNS[style];
    navigator.vibrate(pattern);
  } catch {
    // 静默降级 - 不影响功能
  }
}

/**
 * 停止触觉反馈
 */
export function hapticStop(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(0);
  } catch {
    // 静默降级
  }
}
