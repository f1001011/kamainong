<template>
  <div class="team-page">
    <div class="header">
      <h1>{{ t('nav.team') }}</h1>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="label">{{ t('team.totalMembers') }}</span>
        <span class="value">{{ teamData.total }}</span>
      </div>
      <div class="stat-card">
        <span class="label">{{ t('team.lv1Members') }}</span>
        <span class="value">{{ teamData.lv1 }}</span>
      </div>
      <div class="stat-card">
        <span class="label">{{ t('team.totalRecharge') }}</span>
        <span class="value">{{ teamData.recharge.toLocaleString() }}</span>
      </div>
    </div>

    <div class="level-tabs">
      <button v-for="lv in [1, 2, 3]" :key="lv" :class="{ active: level === lv }" @click="level = lv">
        LV{{ lv }}
      </button>
    </div>

    <div v-if="members.length" class="members-list">
      <div v-for="member in members" :key="member.id" class="member-card">
        <div class="member-info">
          <span class="name">{{ member.username }}</span>
          <span class="date">{{ formatDate(member.created_at) }}</span>
        </div>
        <div class="member-stats">
          <span>{{ t('team.recharge') }}: {{ member.recharge }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty">{{ t('team.empty') }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTeamData, getTeamMembers } from '@/api/agent'

const { t } = useI18n()

const teamData = ref({ total: 0, lv1: 0, recharge: 0 })
const level = ref(1)
const members = ref<any[]>([])

const formatDate = (date: string) => new Date(date).toLocaleDateString()

watch(level, async (lv) => {
  members.value = await getTeamMembers(lv)
})

onMounted(async () => {
  teamData.value = await getTeamData()
  members.value = await getTeamMembers(1)
})
</script>

<style scoped>
.team-page {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
}

.stat-card .label {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.stat-card .value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.level-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: 12px;
}

.level-tabs button {
  flex: 1;
  padding: 10px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
}

.level-tabs button.active {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
}

.member-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.member-info .name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.member-info .date {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.member-stats {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.empty {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
}
</style>
