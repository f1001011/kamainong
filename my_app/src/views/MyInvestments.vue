<template>
  <div class="investments-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-scroll">
      <header class="page-header">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft :size="18" />
        </button>
        <h1 class="page-title">我的投资</h1>
        <div style="width:40px"></div>
      </header>

      <div v-if="loading" class="loading-state">
        <Loader2 :size="32" class="spinner" />
      </div>

      <div v-else-if="orders.length === 0" class="empty-state">
        <Package :size="48" class="empty-icon" />
        <div class="empty-text">暂无投资记录</div>
        <button class="go-btn" @click="router.push('/products')">去投资</button>
      </div>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const investments = ref([])

onMounted(async () => {
  // API调用
  investments.value = []
})
</script>

<style scoped>
.my-investments {
  padding: 20px;
}

.investment-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}
</style>

      <div v-else class="orders-list">
        <div v-for="order in orders" :key="order.id" class="order-card glass-card">
          <div class="card-bar"></div>
          <div class="order-header">
            <div class="order-name">{{ order.goods_name }}</div>
            <div class="order-status">进行中</div>
          </div>
          <div class="order-info">
            <div class="info-row">
              <span class="info-label">投资金额</span>
              <span class="info-value">{{ order.goods_money }} XAF</span>
            </div>
            <div class="info-row">
              <span class="info-label">总收益</span>
              <span class="info-value">{{ order.total_red_money }} XAF</span>
            </div>
            <div class="info-row">
              <span class="info-label">已获收益</span>
              <span class="info-value highlight">{{ order.already_red_money }} XAF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Package } from 'lucide-vue-next'
import { orderApi } from '@/api/services'

const router = useRouter()
const orders = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    orders.value = await orderApi.getMyOrders()
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.investments-root {
  min-height: 100vh;
  background: #0a0e27;
  font-family: 'Inter','PingFang SC',sans-serif;
  position: relative;
  overflow: hidden;
}
.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-cyan { width:400px; height:400px; top:20%; right:-60px; background: rgba(0,229,255,0.15); }

.page-scroll {
  position: relative;
  z-index: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.back-btn {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.7); cursor: pointer;
}
.page-title { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.9); }

.loading-state { display: flex; justify-content: center; padding: 60px 0; }
.spinner { animation: spin 1s linear infinite; color: #00e5ff; }
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  display: flex; flex-direction: column; align-items: center;
  padding: 80px 20px;
}
.empty-icon { color: rgba(255,255,255,0.2); margin-bottom: 16px; }
.empty-text { font-size: 14px; color: rgba(255,255,255,0.4); margin-bottom: 24px; }
.go-btn {
  padding: 12px 32px; border-radius: 8px;
  background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.3);
  color: #00e5ff; font-weight: 600; cursor: pointer;
}

.orders-list { display: flex; flex-direction: column; gap: 16px; }
.order-card { padding: 20px; }
.card-bar {
  height: 3px; background: linear-gradient(90deg, #00e5ff, #7c3aed);
  border-radius: 2px; margin-bottom: 16px;
}
.order-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.order-name { font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.9); }
.order-status {
  padding: 4px 12px; border-radius: 12px;
  background: rgba(105,255,71,0.1); color: #69ff47;
  font-size: 12px; font-weight: 600;
}
.order-info { display: flex; flex-direction: column; gap: 12px; }
.info-row { display: flex; justify-content: space-between; }
.info-label { font-size: 13px; color: rgba(255,255,255,0.5); }
.info-value { font-size: 14px; color: rgba(255,255,255,0.7); }
.info-value.highlight { color: #00e5ff; font-weight: 600; }

.glass-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; backdrop-filter: blur(10px);
}
</style>
