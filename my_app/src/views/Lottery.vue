<template>
  <div class="lottery-page">
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="content">
      <header class="page-header glass-card">
        <button class="back-btn" @click="router.back()">
          <ChevronLeft :size="18" />
        </button>
        <h1>转盘</h1>
        <div class="chance">今日剩余 {{ chance.todayRemaining }} 次</div>
      </header>

      <section class="spin-card glass-card">
        <div class="wheel-placeholder">\n          <div class="wheel-dot"></div>
          <div class="wheel-center">LUCKY</div>
        </div>
        <button class="spin-btn" :disabled="spinning || chance.remaining <= 0" @click="handleSpin">
          {{ spinning ? '抽奖中...' : '立即抽奖' }}
        </button>
      </section>

      <section class="rules-card glass-card">
        <h3>转盘规则</h3>
        <ul>
          <li>每次抽奖消耗 1 次机会。</li>
          <li>每日抽奖次数有上限，请以页面显示为准。</li>
          <li>抽中奖励会自动发放到账户余额。</li>
          <li>活动解释权归平台所有。</li>
        </ul>
      </section>

      <section class="prize-card glass-card" v-if="prizes.length">
        <h3>奖品列表</h3>
        <div class="prize-list">
          <div v-for="item in prizes" :key="item.id" class="prize-item">
            <span class="name">{{ item.name }}</span>
            <span class="amount">{{ CURRENCY }} {{ item.amount.toLocaleString('zh-CN') }}</span>
          </div>
        </div>
      </section>

      <section class="history-card glass-card" v-if="history.length">
        <h3>中奖记录</h3>
        <div class="history-list">
          <div v-for="item in history" :key="item.id" class="history-item">
            <span>{{ item.prizeName }}</span>
            <span class="amt">+{{ CURRENCY }}{{ item.amount.toLocaleString('zh-CN') }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { CURRENCY } from '@/config'
import {
  getLotteryChance,
  getLotteryConfig,
  getLotteryHistory,
  spinLottery,
  type LotteryPrize,
  type LotteryHistoryItem,
} from '@/api/lottery'
import { usePopup } from '@/composables/usePopup'

const router = useRouter()
const { showPopup } = usePopup()

const spinning = ref(false)
const chance = ref({ remaining: 0, todayRemaining: 0 })
const prizes = ref<LotteryPrize[]>([])
const history = ref<LotteryHistoryItem[]>([])

const loadData = async () => {
  const [chanceData, configData, historyData] = await Promise.all([
    getLotteryChance(),
    getLotteryConfig(),
    getLotteryHistory(),
  ])
  chance.value = chanceData
  prizes.value = configData.prizes
  history.value = historyData
}

const handleSpin = async () => {
  if (spinning.value || chance.value.remaining <= 0) return
  spinning.value = true
  try {
    const result = await spinLottery()
    showPopup(`恭喜获得 ${CURRENCY} ${result.amount.toLocaleString('zh-CN')}`, 'success')
    await loadData()
  } finally {
    spinning.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.lottery-page {
  min-height: 100vh;
  background: var(--bg-base);
  position: relative;
  padding-bottom: 90px;
}

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(90px); }
.orb-red { width: 480px; height: 480px; top: -120px; left: -70px; background: var(--orb-red); }
.orb-cyan { width: 420px; height: 420px; top: 35%; right: -90px; background: var(--orb-cyan); }
.orb-amber { width: 340px; height: 340px; bottom: 5%; left: 20%; background: var(--orb-amber); }

.content {
  position: relative;
  z-index: 1;
  max-width: 460px;
  margin: 0 auto;
  padding: 16px 20px 0;
}

.glass-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 18px;
  backdrop-filter: blur(20px);
}

.page-header {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.page-header h1 {
  font-size: 17px;
  color: var(--text-primary);
}

.back-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-primary);
}

.chance {
  font-size: 12px;
  color: var(--color-lime);
}

.spin-card {
  padding: 16px;
  margin-bottom: 14px;
}

.wheel-placeholder {
  width: 220px;
  height: 220px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: conic-gradient(var(--color-red), var(--color-cyan), var(--color-amber), var(--color-red));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.wheel-dot {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 14px solid #fff;
}

.wheel-center {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fff;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.spin-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--color-red), var(--color-cyan));
}

.spin-btn:disabled {
  opacity: .45;
}

.rules-card,
.prize-card,
.history-card {
  padding: 14px;
  margin-bottom: 12px;
}

.rules-card h3,
.prize-card h3,
.history-card h3 {
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.rules-card ul {
  padding-left: 16px;
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  line-height: 1.7;
}

.prize-item,
.history-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
}

.prize-item:last-child,
.history-item:last-child {
  border-bottom: none;
}

.amount,
.amt {
  color: var(--color-amber);
}
</style>
