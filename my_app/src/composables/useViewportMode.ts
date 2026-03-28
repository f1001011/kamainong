import { onMounted, onUnmounted, ref } from 'vue'

const DESKTOP_MEDIA = '(min-width: 1100px)'

export function useViewportMode() {
  const mediaQuery = typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MEDIA) : null
  const isDesktop = ref(mediaQuery?.matches ?? false)

  const sync = (event?: MediaQueryListEvent) => {
    isDesktop.value = event?.matches ?? mediaQuery?.matches ?? false
  }

  onMounted(() => {
    if (!mediaQuery) return
    sync()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync)
      return
    }

    mediaQuery.addListener(sync)
  })

  onUnmounted(() => {
    if (!mediaQuery) return

    if (typeof mediaQuery.removeEventListener === 'function') {
      mediaQuery.removeEventListener('change', sync)
      return
    }

    mediaQuery.removeListener(sync)
  })

  return { isDesktop }
}
