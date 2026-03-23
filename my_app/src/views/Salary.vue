<template>
  <div class="salary-page">
    <div class="header">
      <h1>{{ t('nav.salary') }}</h1>
    </div>

    <div class="salary-list">
      <div v-for="item in salaryConfig" :key="item.id" class="salary-item">
        <div class="salary-info">
          <span class="level">{{ item.level }}</span>
          <span class="condition">{{ t('salary.condition') }}: {{ item.condition }}</span>
        </div>
        <div class="salary-reward">
          <span class="amount">{{ item.reward }} XAF</span>
          <button v-if="canClaim(item)" @click="handleClaim(item.id)">
            {{ t('salary.claim') }}
          </button>
          <span v-else class="status">{{ getStatus(item) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSalaryConfig, claimSalary } from '@/api/salary'

const { t } = useI18n()
const salaryConfig = ref<any[]>([])

const canClaim = (item: any) => item.can_claim && !item.claimed
const getStatus = (item: any) => item.claimed ? t('salary.claimed') : t('salary.notReached')

const handleClaim = async (id: number) => {
  await claimSalary(id)
  salaryConfig.value = await getSalaryConfig()
}

onMounted(async () => {
  salaryConfig.value = await getSalaryConfig()
})
</script>

<style scoped>
.salary-page {
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

.salary-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.salary-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
}

.salary-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.salary-info .level {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.salary-info .condition {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.salary-reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.salary-reward .amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-lime);
}

.salary-reward button {
  padding: 8px 20px;
  background: linear-gradient(135deg, var(--color-cyan), var(--color-red));
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.salary-reward .status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
