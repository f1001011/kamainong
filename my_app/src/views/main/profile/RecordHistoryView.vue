<template>
  <div class="sub-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <div>
        <p>历史记录</p>
        <h1>{{ pageTitle }}</h1>
      </div>
    </header>

    <section class="record-panel">
      <article v-for="item in items" :key="item.id" class="record-item">
        <div>
          <strong>{{ item.title }}</strong>
          <small>{{ item.time }}</small>
        </div>
        <div class="record-meta">
          <span>{{ item.amount }}</span>
          <em :class="statusClass(item.status)">{{ item.status }}</em>
        </div>
      </article>

      <div v-if="isLoading" class="list-state">加载中...</div>
      <div v-else-if="isFinished" class="list-state">已经到底了</div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RecordItem } from '@/config/worldCup'
import { fetchRecordPages, getRecordTitle } from '@/services/worldCupContent'

const route = useRoute()
const router = useRouter()
const items = ref<RecordItem[]>([])
const pages = ref<RecordItem[][]>([])
const page = ref(0)
const isLoading = ref(false)
const isFinished = ref(false)

const recordType = computed(() => String(route.params.type || 'recharge'))
const pageTitle = computed(() => getRecordTitle(recordType.value))

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
</script>

<style scoped>
.sub-page {
  min-height: 100vh;
  padding: 12px 12px calc(112px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, var(--wc-bg) 0 160px, var(--wc-surface) 160px 100%);
}

.page-header,
.record-panel {
  border-radius: var(--wc-radius-xl);
  box-shadow: var(--wc-shadow-card);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(11, 31, 23, 0.94);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  color: var(--wc-text-on-dark);
  font-size: 28px;
}

.page-header p {
  margin: 0 0 4px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.page-header h1 {
  margin: 0;
  color: var(--wc-text-on-dark);
  font-size: 24px;
}

.record-panel {
  margin-top: 16px;
  padding: 12px 16px;
  background: var(--wc-surface-elevated);
  border: 1px solid var(--wc-border);
}

.record-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
}

.record-item + .record-item {
  border-top: 1px solid var(--wc-border);
}

.record-item strong,
.record-item small {
  display: block;
}

.record-item strong {
  color: var(--wc-text);
  font-size: 16px;
}

.record-item small {
  margin-top: 6px;
  color: var(--wc-text-soft);
}

.record-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.record-meta span {
  color: var(--wc-text);
  font-weight: 700;
}

.record-meta em {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}

.record-meta em.ok {
  color: #1f8a4d;
}

.record-meta em.pending {
  color: #2f82bd;
}

.record-meta em.warn {
  color: #ba7a2c;
}

.list-state {
  padding: 20px 0 10px;
  text-align: center;
  color: var(--wc-text-soft);
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }
}
</style>
