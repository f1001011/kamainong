<template>
  <div class="product-card" @click="$emit('click', product)">
    <div class="card-glow" :style="{ background: glowColor }"></div>
    
    <div class="card-content">
      <div class="product-header">
        <h3 class="product-name">{{ product.name }}</h3>
        <div v-if="product.status" class="status-badge">{{ product.status }}</div>
      </div>

      <div class="price-section">
        <span class="currency">XAF</span>
        <span class="price">{{ product.price.toLocaleString() }}</span>
      </div>
      
      <div class="product-stats">
        <div class="stat-item">
          <span class="stat-label">{{ t('product.dailyIncome') }}</span>
          <span class="stat-value">{{ product.daily_income }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('product.totalIncome') }}</span>
          <span class="stat-value highlight">{{ product.total_income.toLocaleString() }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('product.cycle') }}</span>
          <span class="stat-value">{{ product.cycle }}{{ t('common.days') }}</span>
        </div>
      </div>
    </div>

    <div class="shimmer-border"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Product {
  id: number
  name: string
  price: number
  daily_income: number
  total_income: number
  cycle: number
  status?: string
}

const props = defineProps<{ product: Product }>()
defineEmits<{ click: [product: Product] }>()

const { t } = useI18n()

const glowColor = computed(() => {
  const price = props.product.price
  if (price >= 1000000) return 'rgba(255, 77, 77, 0.15)'
  if (price >= 100000) return 'rgba(255, 165, 0, 0.15)'
  return 'rgba(99, 102, 241, 0.15)'
})
</script>

<style scoped>
.product-card {
  position: relative;
  background: rgba(14, 14, 18, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 18px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}

.card-glow {
  position: absolute;
  top: -50%;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  opacity: 0.6;
}

.card-content {
  position: relative;
  z-index: 1;
}

.product-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-badge {
  padding: 4px 10px;
  background: rgba(255, 165, 0, 0.15);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
  font-size: 11px;
  color: #ffa500;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.price-section {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 12px 0;
}

.currency {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
}

.product-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.stat-value.highlight {
  color: #ff6b6b;
}



.shimmer-border {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover .shimmer-border {
  opacity: 1;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
