<template>
  <div class="income-page">
    <!-- Orbs background -->
    <div class="bg-canvas">
      <div class="orb orb-red"></div>
      <div class="orb orb-cyan"></div>
      <div class="orb orb-amber"></div>
    </div>

    <div class="income-content">
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
  background:
    radial-gradient(900px 520px at 20% 10%, color-mix(in srgb, var(--color-red) 12%, transparent), transparent 60%),
    radial-gradient(820px 520px at 90% 25%, color-mix(in srgb, var(--color-cyan) 10%, transparent), transparent 60%),
    radial-gradient(720px 520px at 45% 95%, color-mix(in srgb, var(--color-amber) 10%, transparent), transparent 60%),
    var(--bg-base);
  padding: 20px 20px 80px;
  position: relative;
  overflow: hidden;
}

.income-content { position: relative; z-index: 1; }

.bg-canvas { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.orb { position: absolute; border-radius: 50%; filter: blur(85px); opacity: 0.95; }
.orb-red  { width:480px; height:480px; top:-100px; left:-80px; background:var(--orb-red);  animation:drift 16s ease-in-out infinite; }
.orb-cyan { width:400px; height:400px; top:28%;    right:-60px; background:var(--orb-cyan); animation:drift 20s ease-in-out infinite reverse; }
.orb-amber{ width:340px; height:340px; bottom:8%; left:15%; background:var(--orb-amber); animation:drift 24s ease-in-out infinite 5s; }
@keyframes drift {
  0%,100% { transform: translate(0,0) scale(1); }
  40%     { transform: translate(24px,-18px) scale(1.05); }
  70%     { transform: translate(-16px,14px) scale(0.96); }
}

.header h1 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.stats-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
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
  color: var(--text-primary);
}

.stat-item .value.highlight {
  color: var(--color-lime);
}

.income-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.income-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
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
  color: var(--text-primary);
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
  color: var(--color-lime);
}

.income-amount button {
  padding: 6px 16px;
  background: linear-gradient(135deg, var(--color-cyan), var(--color-red));
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
