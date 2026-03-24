<template>
  <div class="products-page">
    <header class="products-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <div>
        <h1>استثمارات</h1>
        <h1>عقارية</h1>
      </div>
    </header>

    <div class="tabs-shell" :class="{ elevated: isScrolled }">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <main class="products-content">
      <div class="hero-card">
        <p>Architectural Product Gallery</p>
        <h2>نسخة Vue من صفحة منتجات Honeywell مع تبويبات ثابتة وبطاقات هادئة.</h2>
      </div>

      <div v-if="isLoading" class="grid-skeleton">
        <div v-for="item in 4" :key="item" class="skeleton-card"></div>
      </div>

      <div v-else class="products-grid">
        <article v-for="product in products" :key="product.id" class="product-card" @click="router.push(`/products/${product.id}`)">
          <div class="product-image" :style="{ backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined }">
            <span v-if="product.tag">{{ product.tag }}</span>
          </div>
          <div class="product-info">
            <strong>{{ product.name }}</strong>
            <p>{{ CURRENCY }} {{ product.price }}</p>
            <small>可购 {{ product.maxPurchase }}</small>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { CURRENCY } from '@/config'
import type { ProductItem } from '@/types/product'

const router = useRouter()
const isScrolled = ref(false)
const isLoading = ref(true)
const activeTab = ref('1')
const products = ref<ProductItem[]>([])

const tabs = [
  { value: '1', label: '全部' },
  { value: '2', label: '数据' },
  { value: '3', label: '手机' },
  { value: '4', label: '会员' },
  { value: '5', label: '游戏' },
  { value: '6', label: '生活' },
]

function normalizeProduct(raw: Record<string, unknown>): ProductItem {
  return {
    id: raw.id ?? '',
    name: String(raw.name ?? raw.goods_name ?? raw.title ?? ''),
    price: Number(raw.price ?? raw.goods_money ?? 0),
    maxPurchase: Number(raw.maxPurchase ?? raw.max_purchase ?? raw.stock ?? 0),
    category: String(raw.category ?? raw.series ?? 'data'),
    iconKey: String(raw.iconKey ?? raw.icon_key ?? 'wifi'),
    tag: String(raw.tag ?? raw.label ?? ''),
    imageUrl: String(raw.imageUrl ?? raw.image_url ?? raw.cover ?? ''),
    dailyIncome: Number(raw.dailyIncome ?? raw.day_red ?? 0),
    days: Number(raw.days ?? raw.period ?? 0),
    description: String(raw.description ?? raw.goods_desc ?? ''),
  }
}

async function loadProducts() {
  try {
    isLoading.value = true
    const res = await request.get('/products', { params: { series: activeTab.value } })
    const list = Array.isArray(res?.list) ? res.list : Array.isArray(res) ? res : []
    products.value = list.map(item => normalizeProduct((item ?? {}) as Record<string, unknown>))
  } catch {
    products.value = []
  } finally {
    isLoading.value = false
  }
}

function handleTabChange(tab: string) {
  activeTab.value = tab
  loadProducts()
}

function handleScroll() {
  isScrolled.value = window.scrollY > 80
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  loadProducts()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.products-page {
  min-height: 100vh;
  background: #fafaf7;
}

.products-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px 16px 8px;
}

.back-btn {
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
  color: #17392a;
  font-size: 30px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
}

.products-header h1 {
  margin: 0;
  color: #17392a;
  line-height: 1.1;
  font-size: 32px;
}

.tabs-shell {
  position: sticky;
  top: 0;
  z-index: 18;
  display: flex;
  gap: 22px;
  overflow-x: auto;
  padding: 12px 16px 14px;
}

.tabs-shell.elevated {
  background: rgba(250, 250, 247, 0.88);
  backdrop-filter: blur(20px);
}

.tab-btn {
  position: relative;
  border: 0;
  background: transparent;
  color: rgba(23, 57, 42, 0.42);
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
}

.tab-btn.active {
  color: #17392a;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  right: 0;
  left: 0;
  bottom: -8px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(208, 172, 115, 0.8), transparent);
}

.products-content {
  padding: 10px 16px 100px;
}

.hero-card,
.product-card,
.skeleton-card {
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
}

.hero-card {
  padding: 24px;
}

.hero-card p {
  margin: 0 0 10px;
  color: #8f6c3a;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.hero-card h2 {
  margin: 0;
  color: #17392a;
  font-size: 26px;
  line-height: 1.2;
}

.products-grid,
.grid-skeleton {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.product-card {
  overflow: hidden;
}

.product-image {
  height: 180px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 12px;
  background: linear-gradient(135deg, rgba(13, 107, 61, 0.12), rgba(208, 172, 115, 0.14));
  background-size: cover;
  background-position: center;
}

.product-image span {
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.84);
  color: #17392a;
  font-size: 12px;
  font-weight: 700;
}

.product-info {
  padding: 16px;
}

.product-info strong,
.product-info p,
.product-info small {
  display: block;
}

.product-info strong {
  color: #17392a;
}

.product-info p {
  margin: 8px 0 6px;
  color: #0d6b3d;
  font-size: 20px;
  font-weight: 700;
}

.product-info small {
  color: rgba(23, 57, 42, 0.54);
}

.skeleton-card {
  height: 260px;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 240% 100%;
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  to {
    background-position: -240% 0;
  }
}

@media (max-width: 640px) {
  .products-grid,
  .grid-skeleton {
    gap: 12px;
  }
}
</style>
