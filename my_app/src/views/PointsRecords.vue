<template>
  <div class="points-page">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="content">
      <header class="page-header glass-card">
        <button class="icon-btn" @click="router.back()">
          <ChevronLeft :size="18" />
        </button>
        <h1>积分记录</h1>
        <div class="placeholder"></div>
      </header>

      <div class="record-list" v-if="list.length">
        <div v-for="item in list" :key="item.id" class="record-item glass-card">
          <div class="left">
            <div class="title">{{ item.title }}</div>
            <div class="time">{{ item.createdAt }}</div>
          </div>
          <div class="right" :class="item.type">
            {{ item.type === 'income' ? '+' : '-' }}{{ formatAmount(item.amount, 0) }}
          </div>
        </div>
      </div>

      <div v-else class="empty glass-card">暂无积分记录</div>

      <div class="loading" v-if="loadingMore">加载中...</div>
      <div ref="bottomRef" class="bottom-anchor"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { fetchMoneyLogs } from '@/api/balance'
import type { MoneyLogItem } from '@/types/balance'

const router = useRouter()

const page = ref(1)
const hasMore = ref(false)
const loadingMore = ref(false)
const list = ref<MoneyLogItem[]>([])
const bottomRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const formatAmount = (value: unknown, digits = 2) => {
  const n = Number(value || 0)
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

const loadData = async (reset = false) => {
  if (loadingMore.value) return
  loadingMore.value = true

  try {
    if (reset) page.value = 1

    const result = await fetchMoneyLogs({
      page: page.value,
      pageSize: 10,
      moneyType: 2,
    })

    if (reset) {
      list.value = result.list
    } else {
      list.value = [...list.value, ...result.list]
    }

    hasMore.value = result.hasMore
  } finally {
    loadingMore.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  page.value += 1
  await loadData(false)
}

onMounted(async () => {
  await loadData(true)

  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting) {
      loadMore()
    }
  }, { threshold: 0.1 })

  if (bottomRef.value) observer.observe(bottomRef.value)
})

onUnmounted(() => {
  if (observer && bottomRef.value) {
    observer.unobserve(bottomRef.value)
  }
  observer?.disconnect()
})
</script>

<style scoped>
.points-page {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  padding-bottom: 86px;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red { width: 440px; height: 440px; top: -120px; left: -70px; background: var(--orb-red); }
.orb-cyan { width: 400px; height: 400px; top: 30%; right: -70px; background: var(--orb-cyan); }
.orb-amber { width: 320px; height: 320px; bottom: 6%; left: 15%; background: var(--orb-amber); }

.content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  margin: 0 auto;
  padding: 14px 20px 0;
}

.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

.page-header {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.page-header h1 {
  text-align: center;
  font-size: 16px;
  color: var(--text-primary);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.title {
  color: var(--text-primary);
  font-size: 13px;
}

.time {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.42);
  font-size: 11px;
}

.right {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.right.income { color: var(--color-cyan); }
.right.expense { color: var(--color-red); }

.empty {
  padding: 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.46);
}

.loading {
  margin-top: 10px;
  text-align: center;
  color: rgba(255, 255, 255, 0.56);
  font-size: 12px;
}

.bottom-anchor {
  height: 1px;
}
</style>
