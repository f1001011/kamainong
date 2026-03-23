<template>
  <div class="invite-task-page">
    <div class="header">
      <h1>{{ t('nav.inviteTask') }}</h1>
    </div>

    <div class="task-group">
      <h3>{{ t('task.group1') }} - LV2</h3>
      <div v-for="task in group1" :key="task.id" class="task-item">
        <div class="task-info">
          <span class="target">{{ task.target }}{{ t('common.people') }}</span>
          <span class="reward">{{ task.reward }} XAF</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: getProgress(task, progress1) + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress1 }}/{{ task.target }}</span>
        <button v-if="canClaim(task, progress1)" @click="handleClaim(task.id)">
          {{ t('task.claim') }}
        </button>
      </div>
    </div>

    <div class="task-group">
      <h3>{{ t('task.group2') }} - LV1</h3>
      <div v-for="task in group2" :key="task.id" class="task-item">
        <div class="task-info">
          <span class="target">{{ task.target }}{{ t('common.people') }}</span>
          <span class="reward">{{ task.reward }} XAF</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: getProgress(task, progress2) + '%' }"></div>
        </div>
        <span class="progress-text">{{ progress2 }}/{{ task.target }}</span>
        <button v-if="canClaim(task, progress2)" @click="handleClaim(task.id)">
          {{ t('task.claim') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getTaskConfig, getTaskProgress, claimTask } from '@/api/inviteTask'

const { t } = useI18n()

const group1 = ref<any[]>([])
const group2 = ref<any[]>([])
const progress1 = ref(0)
const progress2 = ref(0)

const getProgress = (task: any, current: number) => Math.min((current / task.target) * 100, 100)
const canClaim = (task: any, current: number) => current >= task.target && !task.claimed

const handleClaim = async (id: number) => {
  await claimTask(id)
  const data = await getTaskProgress()
  progress1.value = data.lv2_count
  progress2.value = data.lv1_count
}

onMounted(async () => {
  const config = await getTaskConfig()
  group1.value = config.group1
  group2.value = config.group2
  const data = await getTaskProgress()
  progress1.value = data.lv2_count
  progress2.value = data.lv1_count
})
</script>

<style scoped>
.invite-task-page {
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

.task-group {
  margin-bottom: 30px;
}

.task-group h3 {
  font-size: 16px;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.task-item {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
}

.task-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.task-info .target {
  font-size: 14px;
  color: var(--text-primary);
}

.task-info .reward {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-amber);
}

.progress-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-red), var(--color-cyan));
  transition: width 0.3s;
}

.progress-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.task-item button {
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, var(--color-red), var(--color-cyan));
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
</style>
