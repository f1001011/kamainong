<template>
  <div class="prize-page">
    <div class="header">
      <h1>{{ t('nav.prize') }}</h1>
    </div>

    <div class="prize-pool">
      <div class="pool-amount">
        <span class="label">{{ t('prize.poolAmount') }}</span>
        <span class="amount">XAF {{ poolAmount.toLocaleString() }}</span>
      </div>
      <div class="draw-time">{{ t('prize.drawTime') }}: 05:00</div>
    </div>

    <div class="prize-rules">
      <div class="rule-item">
        <span class="rank">🥇 {{ t('prize.first') }}</span>
        <span class="reward">1,388 XAF</span>
        <span class="condition">{{ t('prize.condition1') }}</span>
      </div>
      <div class="rule-item">
        <span class="rank">🥈 {{ t('prize.second') }}</span>
        <span class="reward">888 XAF</span>
        <span class="condition">{{ t('prize.condition2') }}</span>
      </div>
      <div class="rule-item">
        <span class="rank">🥉 {{ t('prize.third') }}</span>
        <span class="reward">688 XAF</span>
        <span class="condition">{{ t('prize.condition3') }}</span>
      </div>
    </div>

    <div class="tabs">
      <button :class="{ active: tab === 'rank' }" @click="tab = 'rank'">
        {{ t('prize.todayRank') }}
      </button>
      <button :class="{ active: tab === 'winners' }" @click="tab = 'winners'">
        {{ t('prize.winners') }}
      </button>
    </div>

    <div v-if="tab === 'rank'" class="rank-list">
      <div v-for="(item, i) in rankList" :key="i" class="rank-item">
        <span class="position">{{ i + 1 }}</span>
        <span class="username">{{ item.username }}</span>
        <span class="value">{{ item.value }}</span>
      </div>
    </div>

    <div v-else class="winners-list">
      <div v-for="item in winners" :key="item.id" class="winner-item">
        <div class="winner-info">
          <span class="rank">{{ item.rank }}</span>
          <span class="username">{{ item.username }}</span>
        </div>
        <div class="winner-reward">
          <span class="amount">+{{ item.amount }}</span>
          <span class="date">{{ formatDate(item.created_at) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPrizeConfig, getTodayRank, getWinners } from '@/api/prize'

const { t } = useI18n()

const poolAmount = ref(3000)
const tab = ref('rank')
const rankList = ref<any[]>([])
const winners = ref<any[]>([])

const formatDate = (date: string) => new Date(date).toLocaleDateString()

watch(tab, async (val) => {
  if (val === 'rank') {
    rankList.value = await getTodayRank()
  } else {
    winners.value = await getWinners()
  }
})

onMounted(async () => {
  const config = await getPrizeConfig()
  poolAmount.value = config.amount
  rankList.value = await getTodayRank()
})
</script>

<style scoped>
.prize-page {
  min-height: 100vh;
  background: var(--bg-base);
  padding: 20px 20px 80px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.prize-pool {
  background: linear-gradient(135deg, var(--color-red), var(--color-amber));
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  margin-bottom: 20px;
}

.pool-amount .label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.pool-amount .amount {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.draw-time {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.prize-rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.rule-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rule-item .rank {
  font-size: 14px;
  color: var(--text-primary);
}

.rule-item .reward {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-amber);
}

.rule-item .condition {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: 12px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
}

.tabs button.active {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.rank-list, .winners-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rank-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rank-item .position {
  width: 30px;
  height: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-primary);
}

.rank-item .username {
  flex: 1;
  margin-left: 12px;
  color: var(--text-primary);
}

.rank-item .value {
  color: rgba(255, 255, 255, 0.6);
}

.winner-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
}

.winner-info {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.winner-info .rank {
  font-size: 14px;
  color: var(--color-amber);
}

.winner-info .username {
  color: var(--text-primary);
}

.winner-reward {
  display: flex;
  justify-content: space-between;
}

.winner-reward .amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-lime);
}

.winner-reward .date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
