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
        <p class="product-category">{{ product.category }}</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">{{ t('product.dailyReturn') }}</span>
          <span class="stat-value">{{ product.dailyRate }}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('product.cycle') }}</span>
          <span class="stat-value">{{ product.cycle }}{{ t('common.days') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">{{ t('product.totalReturn') }}</span>
          <span class="stat-value">{{ totalReturn }}%</span>
        </div>
      </div>

      <div class="amount-section">
        <label>{{ t('product.investAmount') }}</label>
        <div class="amount-input">
          <span class="currency">{{ CURRENCY }}</span>
          <input v-model="amount" type="number" :placeholder="String(product.minAmount)" />
        </div>
        <div class="amount-info">
          <span>{{ t('product.min') }}: {{ CURRENCY }}{{ product.minAmount }}</span>
          <span>{{ t('product.max') }}: {{ CURRENCY }}{{ product.maxAmount }}</span>
        </div>
      </div>

      <div class="return-preview">
        <div class="preview-row">
          <span>{{ t('product.expectedReturn') }}</span>
          <span class="preview-value">{{ CURRENCY }}{{ expectedReturn }}</span>
        </div>
      </div>

      <button class="buy-btn" :disabled="!canBuy" @click="handleBuy">
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

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const product = ref<any>(null)
const amount = ref('')

const totalReturn = computed(() => product.value ? product.value.dailyRate * product.value.cycle : 0)
const expectedReturn = computed(() => {
  const amt = Number(amount.value) || 0
  return (amt * totalReturn.value / 100).toFixed(2)
})

const canBuy = computed(() => {
  const amt = Number(amount.value)
  return amt >= (product.value?.minAmount || 0) && amt <= (product.value?.maxAmount || 0)
})

const iconGradient = computed(() => {
  if (!product.value) return ''
  const rate = product.value.dailyRate
  if (rate >= 3) return 'linear-gradient(135deg, #ff4d4d, #ff6b6b)'
  if (rate >= 2) return 'linear-gradient(135deg, #ffa500, #ffb347)'
  return 'linear-gradient(135deg, #6366f1, #8b5cf6)'
})

const handleBuy = async () => {
  try {
    await createOrder({ productId: product.value.id, amount: Number(amount.value) })
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
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
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
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.loading {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
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
  color: #fff;
  margin-bottom: 8px;
}

.product-category {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.amount-section {
  margin-bottom: 20px;
}

.amount-section label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.amount-input {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 14px 16px;
  gap: 8px;
}

.currency {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.4);
}

.amount-input input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 20px;
  font-weight: 600;
  color: #fff;
}

.amount-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.return-preview {
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.preview-value {
  font-size: 20px;
  font-weight: 700;
  color: #4ade80;
}

.buy-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
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
