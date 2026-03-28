import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { RecordItem } from '@/config/worldCup'
import { fetchRecordPages, getRecordTitle } from '@/services/worldCupContent'

export function useRecordHistory() {
  const route = useRoute()
  const items = ref<RecordItem[]>([])
  const pages = ref<RecordItem[][]>([])
  const page = ref(0)
  const isLoading = ref(false)
  const isFinished = ref(false)

  const recordType = computed(() => String(route.params.type || 'recharge'))
  const pageTitle = computed(() => getRecordTitle(recordType.value))
  const loadedCount = computed(() => items.value.length)
  const totalCount = computed(() => pages.value.reduce((sum, current) => sum + current.length, 0))

  async function primePages() {
    pages.value = await fetchRecordPages(recordType.value)
  }

  function loadNextPage() {
    if (isLoading.value || isFinished.value) return
    if (page.value >= pages.value.length) {
      isFinished.value = true
      return
    }

    isLoading.value = true
    window.setTimeout(() => {
      items.value = [...items.value, ...pages.value[page.value]]
      page.value += 1
      isLoading.value = false
      isFinished.value = page.value >= pages.value.length
    }, 420)
  }

  async function resetList() {
    items.value = []
    page.value = 0
    isLoading.value = false
    isFinished.value = false
    await primePages()
    loadNextPage()
  }

  function handleScroll() {
    const scrollBottom = window.innerHeight + window.scrollY
    const threshold = document.documentElement.scrollHeight - 140
    if (scrollBottom >= threshold) loadNextPage()
  }

  function statusClass(status: string) {
    if (status.includes('完成') || status.includes('到账') || status.includes('结算')) return 'ok'
    if (status.includes('中') || status.includes('进行')) return 'pending'
    return 'warn'
  }

  watch(() => route.params.type, async () => {
    await resetList()
  })

  onMounted(async () => {
    await resetList()
    window.addEventListener('scroll', handleScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    items,
    isLoading,
    isFinished,
    recordType,
    pageTitle,
    loadedCount,
    totalCount,
    loadNextPage,
    statusClass,
  }
}
