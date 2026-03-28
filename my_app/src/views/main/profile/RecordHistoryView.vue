<template>
  <div class="sub-page">
    <header class="page-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <div>
        <p>历史记录</p>
        <h1>{{ pageTitle }}</h1>
      </div>
    </header>

    <section class="record-list">
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
import { recordMockMap, type RecordItem } from '@/config/worldCup'

const route = useRoute()
const router = useRouter()
const items = ref<RecordItem[]>([])
const page = ref(0)
const isLoading = ref(false)
const isFinished = ref(false)

const titleMap: Record<string, string> = {
  recharge: '我的充值历史',
  withdraw: '我的提现历史',
  bet: '我的下注历史',
}

const recordType = computed(() => String(route.params.type || 'recharge'))
const pageTitle = computed(() => titleMap[recordType.value] ?? '历史记录')

function loadNextPage() {
  if (isLoading.value || isFinished.value) return

  const pageList = recordMockMap[recordType.value] ?? []
  if (page.value >= pageList.length) {
    isFinished.value = true
    return
  }

  isLoading.value = true
  window.setTimeout(() => {
    items.value = [...items.value, ...pageList[page.value]]
    page.value += 1
    isLoading.value = false
    isFinished.value = page.value >= pageList.length
  }, 500)
}

function resetList() {
  items.value = []
  page.value = 0
  isLoading.value = false
  isFinished.value = false
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

watch(() => route.params.type, () => {
  resetList()
})

onMounted(() => {
  resetList()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.sub-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.page-header,
.record-list {
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: rgba(8, 44, 28, 0.92);
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 28px;
}

.page-header p {
  margin: 0 0 4px;
  color: #9ae6b4;
  font-size: 12px;
  letter-spacing: 0.12em;
}

.page-header h1 {
  margin: 0;
  color: #fff;
  font-size: 24px;
}

.record-list {
  margin-top: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.96);
}

.record-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 10px;
}

.record-item + .record-item {
  border-top: 1px solid rgba(8, 44, 28, 0.08);
}

.record-item strong {
  display: block;
  color: #0d3b23;
  font-size: 16px;
}

.record-item small {
  display: block;
  margin-top: 6px;
  color: rgba(13, 59, 35, 0.58);
}

.record-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.record-meta span {
  color: #0d3b23;
  font-weight: 700;
}

.record-meta em {
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
}

.record-meta em.ok {
  color: #15803d;
}

.record-meta em.pending {
  color: #0284c7;
}

.record-meta em.warn {
  color: #b45309;
}

.list-state {
  padding: 20px 10px 10px;
  text-align: center;
  color: rgba(13, 59, 35, 0.62);
}

@media (min-width: 768px) {
  .sub-page {
    max-width: 720px;
    padding: 24px 24px 40px;
  }
}
</style>
