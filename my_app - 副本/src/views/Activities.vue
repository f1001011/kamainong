<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">活动</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="activities-list">
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="activities.length === 0" class="empty">
        暂无活动
      </div>
      <template v-else>
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="activity-card"
          @click="handleActivityClick(activity)"
        >
          <div class="activity-image" :style="{ background: activity.bgColor }">
            <img v-if="activity.imageUrl" :src="activity.imageUrl" alt="" />
          </div>
          <div class="activity-info">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-desc">{{ activity.description }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Gift, Ticket, Zap } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

const isLoading = ref(true)
const activities = ref<any[]>([])

async function loadActivities() {
  try {
    isLoading.value = true
    const res = await request.get('/activities')
    activities.value = res.list || []
  } catch (e) {
    console.error('加载活动失败', e)
  } finally {
    isLoading.value = false
  }
}

function handleActivityClick(activity: any) {
  switch (activity.type) {
    case 'weekly_salary':
      router.push('/activities/weekly-salary')
      break
    case 'invite':
      router.push('/activities/invite-reward')
      break
    case 'collection':
      router.push('/activities/collection')
      break
    default:
      break
  }
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.top-nav {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  z-index: 10;
}

.nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.activities-list {
  padding: 16px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.activity-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
}

.activity-image {
  height: 160px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-info {
  padding: 16px;
}

.activity-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.activity-desc {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}
</style>
