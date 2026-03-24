<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">提现记录</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="records-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="records.length === 0" class="empty">
        暂无提现记录
      </div>
      <template v-else>
        <div v-for="record in records" :key="record.id" class="record-item" @click="router.push(`/withdraw/records/${record.id}`)">
          <div class="record-info">
            <div class="record-amount">-${{ record.amount }}</div>
            <div class="record-time">{{ record.createdAt }}</div>
            <div class="record-bank">{{ record.bankName }} ({{ record.cardNumber }})</div>
          </div>
          <div class="record-status" :class="record.status">
            {{ record.statusText }}
          </div>
        </div>
      </template>
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
const records = ref<any[]>([])

async function loadRecords() {
  try {
    isLoading.value = true
    const res = await request.get('/withdraw/records')
    records.value = res.list || []
  } catch (e) {
    console.error('加载提现记录失败', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadRecords()
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

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.record-amount {
  font-size: 18px;
  font-weight: 700;
  color: #f44336;
}

.record-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.record-bank {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.record-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  align-self: center;
}

.record-status.success {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.record-status.pending {
  background: rgba(255, 152, 0, 0.1);
  color: #ff9800;
}

.record-status.failed {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}
</style>
