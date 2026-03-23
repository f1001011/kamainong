<template>
  <div class="income-page">
    <div class="header">
      <h1>{{ t('nav.income') }}</h1>
    </div>

    <div class="stats-card">
      <div class="stat-item">
        <span class="label">{{ t('income.total') }}</span>
        <span class="value">XAF {{ stats.total.toLocaleString() }}</span>
      </div>
      <div class="stat-item">
        <span class="label">{{ t('income.available') }}</span>
        <span class="value highlight">XAF {{ stats.available.toLocaleString() }}</span>
      </div>
    </div>

    <div v-if="incomes.length" class="income-list">
      <div v-for="item in incomes" :key="item.id" class="income-item">
        <div class="income-info">
          <span class="type">{{ item.type }}</span>
          <span class="date">{{ formatDate(item.created_at) }}</span>
        </div>
        <div class="income-amount">
          <span class="amount">+{{ item.amount }}</span>
          <button v-if="item.status === 'pending'" @click="handleClaim(item.id)">
            {{ t('income.claim') }}
          </button>
          <span v-else class="claimed">{{ t('income.claimed') }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty">{{ t('income.empty') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getIncomeList, claimIncome, getIncomeStats } from '@/api/income'

const { t } = useI18n()

const stats = ref({ total: 0, available: 0 })
const incomes = ref<any[]>([])

const formatDate = (date: string) => new Date(date).toLocaleDateString()

const handleClaim = async (id: number) => {
  await claimIncome(id)
  incomes.value = await getIncomeList()
  stats.value = await getIncomeStats()
}

onMounted(async () => {
  stats.value = await getIncomeStats()
  incomes.value = await getIncomeList()
})
</script>

<style scoped>
.income-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
  padding: 20px 20px 80px;
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 20px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.stat-item .value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.stat-item .value.highlight {
  color: #4ade80;
}

.income-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.income-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
}

.income-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.income-info .type {
  font-size: 14px;
  color: #fff;
}

.income-info .date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.income-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.income-amount .amount {
  font-size: 18px;
  font-weight: 700;
  color: #4ade80;
}

.income-amount button {
  padding: 6px 16px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
}

.income-amount .claimed {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.empty {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
