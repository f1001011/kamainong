<template>
  <div class="product-detail">
    <div class="detail-card glass-card">
      <h2>{{ product.goods_name }}</h2>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Precio</span>
          <span class="value">{{ product.goods_money }} XAF</span>
        </div>
        <div class="info-item">
          <span class="label">Rendimiento</span>
          <span class="value">{{ product.revenue_lv }}%</span>
        </div>
        <div class="info-item">
          <span class="label">Período</span>
          <span class="value">{{ product.period }} días</span>
        </div>
        <div class="info-item">
          <span class="label">Ingreso Total</span>
          <span class="value">{{ product.total_money }} XAF</span>
        </div>
      </div>

      <button class="buy-btn" @click="handleBuy">Comprar Ahora</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const product = ref({})

onMounted(async () => {
  const res = await fetch(`/api/product/detail?id=${route.params.id}`)
  const data = await res.json()
  if (data.code === 200) {
    product.value = data.data
  }
})

const handleBuy = () => {
  // 购买逻辑
  console.log('购买产品')
}
</script>

<style scoped>
.product-detail {
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.detail-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
}

.info-grid {
  display: grid;
  gap: 16px;
  margin: 24px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 8px;
}

.buy-btn {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}
</style>
