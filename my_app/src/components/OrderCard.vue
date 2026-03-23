<template>
  <div class="order-card" :class="statusClass">
    <div class="order-header">
      <div class="order-icon" :style="{ background: iconGradient }">
        <component :is="statusIcon" :size="18" />
      </div>
      <div class="order-info">
        <h4 class="order-title">{{ order.productName }}</h4>
        <span class="order-id">#{{ order.id }}</span>
      </div>
      <div class="order-status" :class="order.status">
        {{ t(`order.status.${order.status}`) }}
      </div>
    </div>

    <div class="order-body">
      <div class="order-row">
        <span class="label">{{ t('order.amount') }}</span>
        <span class="value">{{ CURRENCY }}{{ order.amount.toLocaleString() }}</span>
      </div>
      <div class="order-row">
        <span class="label">{{ t('order.dailyRate') }}</span>
        <span class="value highlight">{{ order.dailyRate }}%</span>
      </div>
      <div class="order-row">
        <span class="label">{{ t('order.earned') }}</span>
        <span class="value success">+{{ CURRENCY }}{{ order.earned.toLocaleString() }}</span>
      </div>
    </div>

    <div class="order-footer">
      <span class="order-date">{{ formatDate(order.createdAt) }}</span>
      <button v-if="order.status === 'active'" class="claim-btn" @click="$emit('claim', order)">
        {{ t('order.claim') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock, CheckCircle, XCircle } from 'lucide-vue-next'
import { CURRENCY } from '@/config'

interface Order {
  id: number
  productName: string
  amount: number
  dailyRate: number
  earned: number
  status: 'active' | 'completed' | 'expired'
  createdAt: string
}

const props = defineProps<{ order: Order }>()
defineEmits<{ claim: [order: Order] }>()

const { t } = useI18n()

const statusIcon = computed(() => {
  const icons = { active: Clock, completed: CheckCircle, expired: XCircle }
  return icons[props.order.status]
})

const iconGradient = computed(() => {
  const gradients = {
    active: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    completed: 'linear-gradient(135deg, #10b981, #34d399)',
    expired: 'linear-gradient(135deg, #ef4444, #f87171)'
  }
  return gradients[props.order.status]
})

const statusClass = computed(() => `status-${props.order.status}`)

const formatDate = (date: string) => new Date(date).toLocaleDateString()
</script>

<style scoped>
.order-card {
  background: rgba(14, 14, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.3s;
}

.order-card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.order-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.order-info {
  flex: 1;
}

.order-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.order-id {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.order-status {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.order-status.active {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.order-status.completed {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.order-status.expired {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.order-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.value {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.value.highlight {
  color: #fbbf24;
}

.value.success {
  color: #4ade80;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.order-date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.claim-btn {
  padding: 6px 16px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.claim-btn:hover {
  opacity: 0.9;
}
</style>
