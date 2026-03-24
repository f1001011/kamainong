<template>
  <div class="product-detail">
    <div class="header">
      <button class="back-btn" @click="$router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h1>{{ t('product.detail') }}</h1>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>

    <div v-else-if="product" class="content">
      <div class="product-hero">
        <div class="hero-icon" :style="{ background: iconGradient }">
          <TrendingUp :size="32" />
        </div>
        <h2 class="product-name">{{ product.name }}</h2>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">{{ t('product.dailyIncome') }}</span>
          <span class="stat-value">{{ CURRENCY }}{{ product.dailyIncome.toLocaleString() }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('product.cycle') }}</span>
          <span class="stat-value">{{ product.cycle }} {{ t('common.days') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('product.totalIncome') }}</span>
          <span class="stat-value">{{ CURRENCY }}{{ product.totalIncome.toLocaleString() }}</span>
        </div>
      </div>

      <div class="amount-section">
        <label>{{ t('product.investAmount') }}</label>
        <div class="amount-fixed">{{ CURRENCY }} {{ product.price.toLocaleString() }}</div>
      </div>

      <button class="buy-btn" :disabled="product.status !== 1" @click="handleBuy">
        {{ t('product.buyNow') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, TrendingUp } from 'lucide-vue-next'
import { CURRENCY } from '@/config'
import { getProductDetail } from '@/api/product'
import { createOrder } from '@/api/order'
import type { ProductDetailData } from '@/types/product'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const product = ref<ProductDetailData | null>(null)
const amount = ref('')

const iconGradient = computed(() => {
  if (!product.value) return ''
  if (product.value.status === 2) return 'linear-gradient(135deg, #ff9800, #ffb347)'
  return 'linear-gradient(135deg, #00c853, #00e676)'
})

const handleBuy = async () => {
  if (!product.value || product.value.status !== 1) return
  try {
    await createOrder(product.value.id)
    router.push('/investments')
  } catch (err) {
    console.error(err)
  }
}

onMounted(async () => {
  try {
    product.value = await getProductDetail(Number(route.params.id))
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading {
  text-align: center;
  color: color-mix(in srgb, var(--text-primary) 50%, transparent);
  padding: 40px;
}

.product-hero {
  text-align: center;
  margin-bottom: 24px;
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto 16px;
}

.product-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: color-mix(in srgb, var(--text-primary) 55%, transparent);
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.amount-section {
  margin-bottom: 20px;
}

.amount-section label {
  display: block;
  font-size: 14px;
  color: color-mix(in srgb, var(--text-primary) 75%, transparent);
  margin-bottom: 10px;
}

.amount-fixed {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.buy-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--color-cyan), var(--color-red));
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.buy-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.buy-btn:not(:disabled):hover {
  opacity: 0.9;
}
</style>
