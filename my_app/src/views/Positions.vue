<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">我的投资</h1>
      <div class="nav-btn"></div>
    </div>

    <!-- 投资摘要 -->
    <div class="summary-card">
      <div class="summary-item">
        <div class="summary-value">${{ formatNumber(totalInvested) }}</div>
        <div class="summary-label">累计投资</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${{ formatNumber(totalEarning) }}</div>
        <div class="summary-label">累计收益</div>
      </div>
    </div>

    <div class="positions-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="positions.length === 0" class="empty">
        暂无投资记录
      </div>
      <div
        v-else
        v-for="pos in positions"
        :key="pos.id"
        class="position-card"
        @click="router.push(`/positions/${pos.id}`)"
      >
        <div class="pos-header">
          <span class="pos-name">{{ pos.productName }}</span>
          <span class="pos-status" :class="pos.status">{{ pos.statusText }}</span>
        </div>
        <div class="pos-info">
          <div class="pos-item">
            <span>投资金额</span>
            <span>${{ formatNumber(pos.amount) }}</span>
          </div>
          <div class="pos-item">
            <span>每日收益</span>
            <span class="earning">+${{ formatNumber(pos.dailyEarning) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

const isLoading = ref(true)
const positions = ref<any[]>([])
const totalInvested = ref(0)
const totalEarning = ref(0)

function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN')
}

async function loadPositions() {
  try {
    isLoading.value = true
    const res = await request.get('/positions')
    positions.value = res.list || []
    totalInvested.value = parseFloat(res.summary?.totalInvested) || 0
    totalEarning.value = parseFloat(res.summary?.totalEarning) || 0
  } catch (e) {
    console.error('加载投资记录失败', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPositions()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.top-nav {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  z-index: 10;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.summary-card {
  display: flex;
  margin: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 16px;
  padding: 24px;
  color: white;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
}

.summary-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.position-card {
  margin: 16px;
  background: white;
  border-radius: 16px;
  padding: 16px;
}

.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pos-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.pos-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.pos-status.active {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.pos-status.completed {
  background: rgba(158, 158, 158, 0.1);
  color: #999;
}

.pos-info {
  margin-top: 12px;
}

.pos-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.earning {
  color: #4caf50;
  font-weight: 600;
}
</style>
