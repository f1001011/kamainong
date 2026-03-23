<template>
  <div class="vip-root">
    <div class="bg-canvas">
      <div class="orb orb-cyan"></div>
    </div>

    <div class="page-scroll">
      <header class="page-header">
        <button class="back-btn" @click="router.back()">
          <ArrowLeft :size="18" />
        </button>
        <h1 class="page-title">VIP会员</h1>
        <div style="width:40px"></div>
      </header>

      <div v-if="loading" class="loading-state">
        <Loader2 :size="32" class="spinner" />
      </div>

      <div v-else>
        <!-- VIP等级卡片 -->
        <div class="vip-card glass-card">
          <div class="card-bar"></div>
          <div class="vip-level">
            <Crown :size="32" class="vip-icon" />
            <div class="vip-info">
              <div class="vip-name">SVIP{{ userVip }}</div>
              <div class="vip-desc">每日奖励: {{ dailyReward }} XAF</div>
            </div>
          </div>
        </div>

        <!-- VIP等级列表 -->
        <div class="section-title">VIP等级</div>
        <div class="vip-list">
          <div v-for="vip in vipList" :key="vip.id" 
            class="vip-item glass-card" :class="{ active: vip.vip === userVip }">
            <div class="vip-item-level">SVIP{{ vip.vip }}</div>
            <div class="vip-item-reward">{{ vip.reward_money }} XAF/天</div>
            <div class="vip-item-req">需购买{{ vip.buy_goods_num }}个产品</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Crown } from 'lucide-vue-next'
import { userApi } from '@/api/services'

const router = useRouter()
const loading = ref(true)
const userVip = ref(0)
const dailyReward = ref(0)
const vipList = ref([])

onMounted(async () => {
  try {
    const user = await userApi.getInfo()
    userVip.value = user.level_vip || 0
    
    // 模拟VIP配置数据
    vipList.value = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      vip: i + 1,
      reward_money: [50, 80, 120, 160, 200, 240, 280, 320, 360, 500][i],
      buy_goods_num: 2
    }))
    
    dailyReward.value = vipList.value.find(v => v.vip === userVip.value)?.reward_money || 0
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.vip-root {
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

.vip-card { padding: 24px; margin-bottom: 24px; }
.card-bar {
  height: 3px; background: linear-gradient(90deg, #ffd700, #ff8c00);
  border-radius: 2px; margin-bottom: 20px;
}
.vip-level { display: flex; align-items: center; gap: 16px; }
.vip-icon { color: #ffd700; }
.vip-info { flex: 1; }
.vip-name { font-size: 24px; font-weight: 700; color: #ffd700; margin-bottom: 4px; }
.vip-desc { font-size: 14px; color: rgba(255,255,255,0.6); }

.section-title {
  font-size: 18px; font-weight: 600; color: rgba(255,255,255,0.9);
  margin-bottom: 16px;
}

.vip-list { display: flex; flex-direction: column; gap: 12px; }
.vip-item {
  padding: 16px; display: flex; justify-content: space-between; align-items: center;
  transition: transform 0.2s;
}
.vip-item.active {
  border: 2px solid #ffd700;
  background: rgba(255,215,0,0.05);
}
.vip-item-level { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.9); }
.vip-item-reward { font-size: 14px; color: #00e5ff; font-weight: 600; }
.vip-item-req { font-size: 12px; color: rgba(255,255,255,0.5); }

.glass-card {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; backdrop-filter: blur(10px);
}
</style>
