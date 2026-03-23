<template>
  <div class="products-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-scroll">
      <header class="page-header">
        <h1 class="page-title">{{ t('products.title') }}</h1>
      </header>

      <div v-if="loading" class="loading-state">
        <Loader2 :size="32" class="spinner" />
      </div>

      <div v-else class="products-grid">
        <div v-for="product in products" :key="product.id" 
          class="product-card glass-card" @click="buyProduct(product)">
          <div class="card-bar"></div>
          <div class="product-name">{{ product.goods_name }}</div>
          <div class="product-price">{{ product.goods_money }} XAF</div>
          <div class="product-info">
            <div class="info-item">
              <TrendingUp :size="14" />
              <span>{{ product.revenue_lv }}%</span>
            </div>
            <div class="info-item">
              <Calendar :size="14" />
              <span>{{ product.period }}{{ t('products.days') }}</span>
            </div>
          </div>
          <div class="product-income">
            {{ t('products.dailyIncome') }}: {{ product.day_red }} XAF
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Package } from 'lucide-vue-next'
</script>

<style scoped>
.placeholder-root {
  min-height: 100vh; background: var(--bg-base);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Inter','PingFang SC',sans-serif;
  position: relative; overflow: hidden;
}
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-cyan { width:400px; height:400px; top:20%; right:-60px; background:var(--orb-cyan); }
.placeholder-body {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.ph-icon { color: #00e5ff; opacity: 0.5; }
.ph-title { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.7); }
.ph-sub   { font-size: 13px; color: rgba(255,255,255,0.25); }
</style>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, TrendingUp, Calendar } from 'lucide-vue-next'
import { productApi, orderApi } from '@/api/services'
import { usePopup } from '@/composables/usePopup'

const { t } = useI18n()
const { showPopup } = usePopup()

const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    products.value = await productApi.getList()
  } catch (err: any) {
    showPopup(err.message || t('products.loadError'))
  } finally {
    loading.value = false
  }
})

async function buyProduct(product: any) {
  if (confirm(`${t('products.confirmBuy')} ${product.goods_name}?`)) {
    try {
      await orderApi.buy(product.id)
      showPopup(t('products.buySuccess'))
    } catch (err: any) {
      showPopup(err.message || t('products.buyError'))
    }
  }
}
</script>

<style scoped>
.products-root {
  min-height: 100vh;
  background: var(--bg-base);
  font-family: 'Inter','PingFang SC',sans-serif;
  position: relative;
  overflow: hidden;
}
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-cyan { width:400px; height:400px; top:20%; right:-60px; background:var(--orb-cyan); }

.page-scroll {
  position: relative;
  z-index: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
.spinner { animation: spin 1s linear infinite; color: #00e5ff; }
@keyframes spin { to { transform: rotate(360deg); } }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}
.product-card:hover { transform: translateY(-4px); }

.card-bar {
  height: 3px;
  background: linear-gradient(90deg, #00e5ff, #7c3aed);
  border-radius: 2px;
  margin-bottom: 16px;
}

.product-name {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-bottom: 8px;
}

.product-price {
  font-size: 24px;
  font-weight: 700;
  color: #00e5ff;
  margin-bottom: 12px;
}

.product-info {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.product-income {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
}
</style>
