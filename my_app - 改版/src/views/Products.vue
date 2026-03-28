<template>
  <div class="page-container">
    <!-- 返回按钮 -->
    <button class="back-btn" @click="router.back()">
      <ArrowLeft :size="24" />
    </button>

    <!-- 标题 -->
    <h1 class="page-title">استثمارات</h1>
    <h1 class="page-title">عقارية</h1>

    <!-- Tab 栏 -->
    <div class="tabs-wrapper" :class="{ scrolled: isScrolled }">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab', { active: activeTab === tab.value }]"
          @click="handleTabChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 产品列表 -->
    <div class="products-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="products.length === 0" class="empty">
        <p>暂无产品</p>
      </div>
      <div v-else class="product-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="router.push(`/product/${product.id}`)"
        >
          <div class="product-image" :style="{ background: product.gradient }">
            <img v-if="product.imageUrl" :src="product.imageUrl" alt="" />
            <div v-else class="product-icon">
              <Wifi :size="26" />
            </div>
          </div>
          <div class="product-info">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-price">${{ product.price }}</div>
            <div class="product-stock">
              <ShoppingBag :size="12" />
              可购 {{ product.maxPurchase }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Wifi, ShoppingBag } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()

// 状态
const isScrolled = ref(false)
const isLoading = ref(true)
const activeTab = ref('1')
const products = ref<any[]>([])

// Tab 配置
const tabs = [
  { value: '1', label: '全部' },
  { value: '2', label: '数据' },
  { value: '3', label: '手机' },
  { value: '4', label: '会员' },
  { value: '5', label: '游戏' },
  { value: '6', label: '生活' },
]

// 滚动监听
function handleScroll() {
  isScrolled.value = window.scrollY > 80
}

// 加载产品
async function loadProducts() {
  try {
    isLoading.value = true
    const res = await request.get('/products', {
      params: { series: activeTab.value }
    })
    products.value = res.list || []
  } catch (e) {
    console.error('加载产品失败', e)
  } finally {
    isLoading.value = false
  }
}

// Tab 切换
function handleTabChange(tab: string) {
  activeTab.value = tab
  loadProducts()
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  loadProducts()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: var(--bg-base, #f5f5f5);
  padding: 16px;
}

.back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 40;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
  margin-top: 40px;
}

.tabs-wrapper {
  margin-top: 20px;
  position: sticky;
  top: 0;
  z-index: 30;
  background: transparent;
  transition: background 0.3s;
}

.tabs-wrapper.scrolled {
  background: rgba(250, 250, 248, 0.88);
  backdrop-filter: blur(20px);
}

.tabs {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 12px;
}

.tab {
  font-size: 14px;
  font-weight: 500;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  padding: 8px 0;
  position: relative;
}

.tab.active {
  color: #333;
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 184, 0, 0.5), transparent);
}

.products-list {
  padding-top: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:active {
  transform: scale(0.97);
}

.product-image {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.product-icon {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #ff4d4d;
  margin-bottom: 4px;
}

.product-stock {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
