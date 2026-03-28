<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">产品详情</h1>
      <div class="nav-btn"></div>
    </div>

    <div v-if="isLoading" class="loading">
      <LoadingSpinner />
    </div>
    <template v-else-if="product">
      <div class="product-image" :style="{ background: product.gradient }">
        <img v-if="product.imageUrl" :src="product.imageUrl" alt="" />
      </div>

      <div class="product-content">
        <div class="product-name">{{ product.name }}</div>
        <div class="product-price">${{ product.price }}</div>
        
        <div class="product-stats">
          <div class="stat-item">
            <span class="stat-value">{{ product.dailyIncome }}</span>
            <span class="stat-label">每日收益</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ product.days }}</span>
            <span class="stat-label">周期(天)</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ product.maxPurchase }}</span>
            <span class="stat-label">可购次数</span>
          </div>
        </div>

        <div class="product-desc">
          <div class="desc-title">产品说明</div>
          <div class="desc-content">{{ product.description }}</div>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="price-display">
          <span class="label">总价</span>
          <span class="value">${{ product.price }}</span>
        </div>
        <button class="buy-btn" @click="handleBuy">
          立即购买
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()
const route = useRoute()

const isLoading = ref(true)
const product = ref<any>(null)

async function loadProduct() {
  try {
    isLoading.value = true
    const res = await request.get(`/products/${route.params.id}`)
    product.value = res
  } catch (e) {
    console.error('加载产品失败', e)
  } finally {
    isLoading.value = false
  }
}

function handleBuy() {
  // 跳转购买页面或直接购买
  router.push(`/product/${route.params.id}/buy`)
}

onMounted(() => {
  loadProduct()
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

.loading {
  text-align: center;
  padding: 40px;
}

.product-image {
  height: 250px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-content {
  background: white;
  margin-top: -20px;
  border-radius: 24px 24px 0 0;
  padding: 24px;
  position: relative;
}

.product-name {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.product-price {
  font-size: 28px;
  font-weight: 700;
  color: #ff4d4d;
  margin-top: 8px;
}

.product-stats {
  display: flex;
  margin-top: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.product-desc {
  margin-top: 24px;
}

.desc-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.desc-content {
  font-size: 14px;
  color: #666;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
}

.price-display {
  flex: 1;
}

.price-display .label {
  font-size: 12px;
  color: #999;
}

.price-display .value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.buy-btn {
  padding: 16px 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 24px;
  cursor: pointer;
}
</style>
