import { cssVarMap } from '@/config/colors'

export function useTheme() {
  const root = document.documentElement
  Object.entries(cssVarMap).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
}
