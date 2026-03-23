<template>
  <AppLayout>
    <div class="home-page">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <div class="greeting">Buenas noches</div>
        <button class="notif-btn">
          <Bell :size="20" />
        </button>
      </header>

      <!-- 余额卡片 -->
      <div class="balance-card">
        <div class="balance-header">
          <span>Saldo disponible</span>
          <button class="hide-btn">
            <Eye :size="16" />
          </button>
        </div>
        <div class="balance-amount">$ {{ balance }}</div>
        <div class="balance-stats">
          <div class="stat">
            <span class="stat-label">Saldo congelado</span>
            <span class="stat-value">$0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Ganancias de hoy</span>
            <span class="stat-value">0</span>
          </div>
          <div class="stat">
            <span class="stat-label">Ganancias totales</span>
            <span class="stat-value">0</span>
          </div>
        </div>
        <div class="balance-actions">
          <button class="action-btn recharge">
            <ArrowDownCircle :size="16" />
            Recargar
          </button>
          <button class="action-btn withdraw">
            <ArrowUpCircle :size="16" />
            Retirar
          </button>
        </div>
      </div>

      <!-- 产品区域 -->
      <div class="section">
        <div class="section-header">
          <h2>Propiedades Destacadas</h2>
        </div>
        
        <div v-if="loading" class="loading">
          <Loader2 :size="32" class="spinner" />
        </div>

        <div v-else class="products-scroll">
          <div v-for="product in products" :key="product.id" 
            class="product-card" @click="buyProduct(product)">
            <div class="product-name">{{ product.goods_name }}</div>
            <div class="product-daily">$ {{ product.day_red }}/día</div>
            <div class="product-period">{{ product.period }} días</div>
            <div class="product-price">$ {{ product.goods_money }}</div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { Bell, Eye, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-vue-next'
import { userApi, productApi, orderApi } from '@/api/services'

const balance = ref('3,000')
const products = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const [bal, prods] = await Promise.all([
      userApi.getBalance(),
      productApi.getList()
    ])
    balance.value = (bal.balance || 0).toLocaleString()
    products.value = prods.slice(0, 6)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

async function buyProduct(product: any) {
  if (confirm(`Comprar ${product.goods_name}?`)) {
    try {
      await orderApi.buy(product.id)
      alert('Compra exitosa')
    } catch (err: any) {
      alert(err.message || 'Error')
    }
  }
}
</script>

<style scoped>
.home-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.greeting {
  font-size: 18px;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
}

.notif-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
}

.balance-card {
  background: linear-gradient(135deg, rgba(0,229,255,0.1), rgba(124,58,237,0.1));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 32px;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: rgba(255,255,255,0.6);
}

.hide-btn {
  background: none;
  border: none;
  color: rgba(255,255,255,0.6);
  cursor: pointer;
}

.balance-amount {
  font-size: 36px;
  font-weight: 700;
  color: #00e5ff;
  margin-bottom: 20px;
}

.balance-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
}

.stat-value {
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  font-weight: 600;
}

.balance-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn.recharge {
  background: rgba(0,229,255,0.15);
  color: #00e5ff;
}

.action-btn.withdraw {
  background: rgba(255,255,255,0.05);
  color: rgba(255,255,255,0.8);
}

.section {
  margin-bottom: 32px;
}

.section-header {
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.spinner {
  animation: spin 1s linear infinite;
  color: #00e5ff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.products-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 16px;
}

.products-scroll::-webkit-scrollbar {
  height: 6px;
}

.products-scroll::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
}

.product-card {
  min-width: 280px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: rgba(0,229,255,0.3);
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-bottom: 8px;
}

.product-daily {
  font-size: 14px;
  color: #00e5ff;
  margin-bottom: 4px;
}

.product-period {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 12px;
}

.product-price {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255,255,255,0.9);
}
</style>
