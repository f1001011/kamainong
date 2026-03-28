import type { PopupOptions } from '@/composables/usePopup'

/**
 * 弹窗预设配置
 * 在这里统一管理所有弹窗的样式和行为
 * 使用：showPopup(message, 'loginSuccess')
 */
export const popupPresets: Record<string, PopupOptions> = {
  // ── 通用 ──────────────────────────────────────
  success: {
    width: '380px',            // 弹窗宽度，支持 px / % / vw
    minHeight: 'auto',         // 弹窗最小高度，auto = 由内容撑开
    showClose: false,          // 不显示叉按钮，自动关闭
    autoCloseDuration: 1500,   // 1.5秒后自动关闭（单位：毫秒）
    bgColor: 'linear-gradient(135deg, #064e3b, #065f46)', // 深绿渐变
  },
  error: {
    width: '380px',
    minHeight: 'auto',
    showClose: true,           // 显示叉按钮，需手动关闭
    bgColor: 'linear-gradient(135deg, #450a0a, #7f1d1d)', // 深红渐变
  },
  warning: {
    width: '380px',
    minHeight: 'auto',
    showClose: true,           // 显示叉按钮，需手动关闭
    bgColor: 'linear-gradient(135deg, #78350f, #92400e)', // 深橙渐变
  },
  info: {
    width: '380px',
    minHeight: 'auto',
    showClose: false,          // 不显示叉按钮，自动关闭
    autoCloseDuration: 2000,   // 2秒后自动关闭（单位：毫秒）
    bgColor: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)', // 深蓝渐变（默认风格）
  },

  // ── 登录 ──────────────────────────────────────
  loginSuccess: {
    width: '360px',
    minHeight: 'auto',
    showClose: false,          // 不显示叉按钮，自动关闭
    autoCloseDuration: 1500,   // 1.5秒后自动关闭（单位：毫秒）
    bgColor: 'linear-gradient(135deg, #064e3b, #065f46)', // 深绿渐变
  },
  loginFailed: {
    width: '360px',
    minHeight: 'auto',
    showClose: false,          // 不显示叉按钮，自动关闭
    autoCloseDuration: 1500,   // 1.5秒后自动关闭（单位：毫秒）
    bgColor: 'linear-gradient(135deg, #450a0a, #7f1d1d)', // 深红渐变
  },
}
