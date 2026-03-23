<template>
  <div class="home-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-scroll">
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <div class="avatar"><User :size="17" /></div>
          <div class="header-info">
            <span class="greeting">{{ greeting }}</span>
            <span class="username">{{ userInfo.phone || 'User' }}</span>
          </div>
        </div>
        <button class="glass-icon-btn" @click="router.push('/balance')">
          <Wallet :size="18" />
        </button>
      </header>

      <!-- Balance Card -->
      <div class="balance-card glass-card">
        <div class="card-bar"></div>
        <div class="balance-label">可用余额</div>
        <div class="balance-amount">{{ balance }} XAF</div>
        <div class="balance-stats">
          <div class="stat-item">
            <span class="stat-label">冻结余额</span>
            <span class="stat-value">0 XAF</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">今日收益</span>
            <span class="stat-value">0 XAF</span>
          </div>
        </div>
        <div class="balance-actions">
          <button class="action-btn">充值</button>
          <button class="action-btn">提现</button>
        </div>
      </div>

      <!-- Products Section -->
      <div class="section-header">
        <h2 class="section-title">投资产品</h2>
        <button class="view-all-btn" @click="router.push('/products')">
          查看全部 <ArrowRight :size="14" />
        </button>
      </div>

      <div v-if="loading" class="loading-state">
        <Loader2 :size="32" class="spinner" />
      </div>

      <div v-else class="products-scroll">
        <div v-for="product in products" :key="product.id" 
          class="product-card glass-card" @click="router.push('/products')">
          <div class="product-name">{{ product.goods_name }}</div>
          <div class="product-price">{{ product.goods_money }} XAF</div>
          <div class="product-daily">日收益: {{ product.day_red }} XAF</div>
          <div class="product-period">{{ product.period }}天</div>
        </div>
      </div>

      <div style="height:40px"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Wallet, ArrowRight, Loader2 } from 'lucide-vue-next'
import { userApi, productApi } from '@/api/services'

const router = useRouter()
const userInfo = ref<any>({})
const balance = ref('0')
const products = ref([])
const loading = ref(true)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

onMounted(async () => {
  try {
    const [user, bal, prods] = await Promise.all([
      userApi.getInfo(),
      userApi.getBalance(),
      productApi.getList()
    ])
    userInfo.value = user
    balance.value = bal.balance || '0'
    products.value = prods.slice(0, 4)
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.home-root {
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
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0,229,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00e5ff;
}
.header-info { display: flex; flex-direction: column; }
.greeting { font-size: 13px; color: rgba(255,255,255,0.5); }
.username { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9); }
.glass-icon-btn {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.7); cursor: pointer;
}

.balance-card {
  padding: 24px; margin-bottom: 24px;
}
.card-bar {
  height: 3px; background: linear-gradient(90deg, #00e5ff, #7c3aed);
  border-radius: 2px; margin-bottom: 16px;
}
.balance-label { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 8px; }
.balance-amount { font-size: 32px; font-weight: 700; color: #00e5ff; margin-bottom: 16px; }
.balance-stats { display: flex; gap: 24px; margin-bottom: 16px; }
.stat-item { display: flex; flex-direction: column; }
.stat-label { font-size: 12px; color: rgba(255,255,255,0.4); }
.stat-value { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 4px; }
.balance-actions { display: flex; gap: 12px; }
.action-btn {
  flex: 1; padding: 12px; border-radius: 8px;
  background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.3);
  color: #00e5ff; font-weight: 600; cursor: pointer;
}

.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.section-title { font-size: 20px; font-weight: 700; color: rgba(255,255,255,0.9); }
.view-all-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 13px; color: rgba(255,255,255,0.5); cursor: pointer;
}

.loading-state { display: flex; justify-content: center; padding: 40px 0; }
.spinner { animation: spin 1s linear infinite; color: #00e5ff; }
@keyframes spin { to { transform: rotate(360deg); } }

.products-scroll {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}
.product-card {
  padding: 16px; cursor: pointer;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  transition: transform 0.2s;
}
.product-card:hover { transform: translateY(-4px); }
.product-name { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 8px; }
.product-price { font-size: 20px; font-weight: 700; color: #00e5ff; margin-bottom: 8px; }
.product-daily { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 4px; }
.product-period { font-size: 12px; color: rgba(255,255,255,0.4); }

.glass-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
</style>
