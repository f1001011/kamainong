<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">交易记录</h1>
      <button class="nav-btn" @click="handleRefresh" :class="{ spinning: isValidating }">
        <RefreshCw :size="20" />
      </button>
    </div>

    <!-- 类型筛选 -->
    <div class="filter-tabs">
      <button
        v-for="tab in typeTabs"
        :key="tab.value"
        :class="['tab', { active: activeType === tab.value }]"
        @click="handleTypeChange(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 交易列表 -->
    <div class="transactions-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="error" class="error">
        <p>加载失败</p>
        <button @click="handleRefresh">重试</button>
      </div>
      <div v-else-if="transactions.length === 0" class="empty">
        <p>暂无交易记录</p>
      </div>
      <template v-else>
        <!-- 按日期分组 -->
        <div v-for="(group, date) in groupedTransactions" :key="date" class="date-group">
          <div class="date-header">{{ date }}</div>
          <div
            v-for="item in group"
            :key="item.id"
            class="transaction-item"
          >
            <div class="tx-icon" :class="item.type">
              <component :is="getTypeIcon(item.type)" :size="20" />
            </div>
            <div class="tx-info">
              <div class="tx-title">{{ item.title }}</div>
              <div class="tx-time">{{ item.time }}</div>
            </div>
            <div class="tx-amount" :class="item.type">
              {{ item.type === 'income' ? '+' : '-' }}${{ formatNumber(item.amount) }}
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="isLoadingMore" class="loading-more">
          <LoadingSpinner />
        </div>
        <div v-else-if="!hasMore && transactions.length > 0" class="no-more">
          没有更多了
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, computedAsync } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw, ArrowUpRight, ArrowDownLeft, ShoppingCart, Wallet } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

// 状态
const isLoading = ref(true)
const isValidating = ref(false)
const isLoadingMore = ref(false)
const error = ref(false)
const activeType = ref('ALL')
const transactions = ref<any[]>([])
const page = ref(1)
const hasMore = ref(true)
const PAGE_SIZE = 20

// 类型筛选
const typeTabs = [
  { value: 'ALL', label: '全部' },
  { value: 'INCOME', label: '收入' },
  { value: 'EXPENSE', label: '支出' },
  { value: 'RECHARGE', label: '充值' },
  { value: 'WITHDRAW', label: '提现' },
]

// 按日期分组
const groupedTransactions = computed(() => {
  const groups: Record<string, any[]> = {}
  transactions.value.forEach(item => {
    const date = item.date || '未知日期'
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  })
  return groups
})

// 获取类型图标
function getTypeIcon(type: string) {
  switch (type) {
    case 'income': return ArrowDownLeft
    case 'expense': return ArrowUpRight
    case 'recharge': return Wallet
    case 'withdraw': return ArrowUpRight
    default: return ShoppingCart
  }
}

// 格式化数字
function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN')
}

// 加载交易记录
async function loadTransactions(reset = false) {
  if (reset) {
    page.value = 1
    transactions.value = []
    hasMore.value = true
  }

  try {
    if (reset) isLoading.value = true
    else isLoadingMore.value = true

    const params: any = {
      page: page.value,
      pageSize: PAGE_SIZE
    }
    if (activeType.value !== 'ALL') {
      params.type = activeType.value
    }

    const res = await request.get('/transactions', { params })
    
    const list = res.list || []
    if (reset) {
      transactions.value = list
    } else {
      transactions.value = [...transactions.value, ...list]
    }
    
    hasMore.value = list.length === PAGE_SIZE
    page.value++
    error.value = false
  } catch (e) {
    console.error('加载交易记录失败', e)
    error.value = true
  } finally {
    isLoading.value = false
    isLoadingMore.value = false
  }
}

// 刷新
async function handleRefresh() {
  isValidating.value = true
  await loadTransactions(true)
  isValidating.value = false
}

// 加载更多
function handleLoadMore() {
  if (!isLoadingMore.value && hasMore.value) {
    loadTransactions(false)
  }
}

// 类型切换
function handleTypeChange(type: string) {
  activeType.value = type
  loadTransactions(true)
}

// 滚动加载更多
function handleScroll() {
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop
  const clientHeight = document.documentElement.clientHeight
  
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    handleLoadMore()
  }
}

onMounted(() => {
  loadTransactions(true)
  window.addEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
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

.nav-btn.spinning .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  overflow-x: auto;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.tab {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: #f5f5f5;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.tab.active {
  background: #667eea;
  color: white;
}

.transactions-list {
  padding: 16px;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.error button {
  margin-top: 12px;
  padding: 8px 24px;
  border-radius: 20px;
  border: none;
  background: #667eea;
  color: white;
  cursor: pointer;
}

.date-group {
  margin-bottom: 20px;
}

.date-header {
  font-size: 14px;
  color: #999;
  padding: 8px 0;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: white;
  border-radius: 12px;
  margin-bottom: 8px;
}

.tx-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tx-icon.income {
  background: rgba(76, 175, 80, 0.1);
  color: #4caf50;
}

.tx-icon.expense, .tx-icon.withdraw {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.tx-icon.recharge {
  background: rgba(33, 150, 243, 0.1);
  color: #2196f3;
}

.tx-info {
  flex: 1;
}

.tx-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.tx-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.tx-amount {
  font-size: 16px;
  font-weight: 700;
}

.tx-amount.income {
  color: #4caf50;
}

.tx-amount.expense, .tx-amount.withdraw {
  color: #f44336;
}

.loading-more, .no-more {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
