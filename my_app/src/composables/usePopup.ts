import { reactive } from 'vue'
import { popupPresets } from '@/config/popupPresets'

export interface PopupOptions {
  showClose?: boolean
  autoCloseDuration?: number
  width?: string
  minHeight?: string
  bgColor?: string
  textColor?: string
  borderRadius?: string
  closeOnOverlay?: boolean
  breathing?: boolean
  zIndex?: number
}

interface PopupState {
  visible: boolean
  message: string
  options: PopupOptions
}

// 模块级单例 —— 在组件外（axios拦截器、工具函数）同样可用
const state = reactive<PopupState>({
  visible: false,
  message: '',
  options: {},
})

export function usePopup() {
  const showPopup = (message: string, options: string | PopupOptions = {}) => {
    const resolved = typeof options === 'string'
      ? (popupPresets[options] ?? {})
      : options
    state.message = message
    state.options = resolved
    state.visible = true
  }

  const hidePopup = () => {
    state.visible = false
  }

  return { state, showPopup, hidePopup }
}
