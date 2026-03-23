<template>
  <div class="investments">
    <div class="header">
      <h1>{{ t('nav.investments') }}</h1>
    </div>

    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab" 
        :class="{ active: activeTab === tab }"
        @click="activeTab = tab"
      >
        {{ t(`order.${tab}`) }}
      </button>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <div v-else-if="filteredOrders.length" class="orders-list">
      <OrderCard 
        v-for="order in filteredOrders" 
        :key="order.id" 
        :order="order"
        @claim="handleClaim"
      />
    </div>

    <div v-else class="empty">
      <Package :size="48" />
      <p>{{ t('order.empty') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Package } from 'lucide-vue-next'
import OrderCard from '@/components/OrderCard.vue'
import { getOrderList } from '@/api/order'

const { t } = useI18n()

const loading = ref(true)
const orders = ref<any[]>([])
const activeTab = ref('all')
const tabs = ['all', 'active', 'completed']

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter(o => o.status === activeTab.value)
})

const handleClaim = async (order: any) => {
  console.log('Claim:', order)
}

onMounted(async () => {
  try {
    orders.value = await getOrderList()
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.investments {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 20px 20px 80px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: 12px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tabs button.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
