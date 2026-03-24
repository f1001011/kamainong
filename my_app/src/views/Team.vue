<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">我的团队</h1>
      <div class="nav-btn"></div>
    </div>

    <!-- 团队统计卡片 -->
    <div class="stats-card">
      <div class="stat-item">
        <div class="stat-value">{{ teamCount }}</div>
        <div class="stat-label">团队人数</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">{{ formatNumber(teamPerformance) }}</div>
        <div class="stat-label">团队业绩</div>
      </div>
    </div>

    <!-- 团队列表 -->
    <div class="team-section">
      <div class="section-title">团队成员</div>
      <div v-if="isLoading" class="loading">
        <LoadingSpinner />
      </div>
      <div v-else-if="teamMembers.length === 0" class="empty">
        <p>暂无团队成员</p>
        <p class="tip">邀请好友加入获得奖励</p>
      </div>
      <div v-else class="team-list">
        <div v-for="member in teamMembers" :key="member.id" class="member-item">
          <div class="member-avatar">
            <img v-if="member.avatar" :src="member.avatar" alt="" />
            <User v-else :size="20" />
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.nickname || '用户' + member.id }}</div>
            <div class="member-time">加入时间: {{ member.joinTime }}</div>
          </div>
          <div class="member-performance">
            业绩: ${{ formatNumber(member.performance) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请按钮 -->
    <button class="invite-btn" @click="router.push('/invite-task')">
      <UserPlus :size="20" />
      邀请好友
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, UserPlus } from 'lucide-vue-next'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import request from '@/api/request'

const router = useRouter()

// 状态
const isLoading = ref(true)
const teamCount = ref(0)
const teamPerformance = ref(0)
const teamMembers = ref<any[]>([])

// 格式化数字
function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN')
}

// 加载团队数据
async function loadTeamData() {
  try {
    isLoading.value = true
    const res = await request.get('/team/stats')
    teamCount.value = res.count || 0
    teamPerformance.value = parseFloat(res.performance) || 0
  } catch (e) {
    console.error('加载团队统计失败', e)
  }

  try {
    const res = await request.get('/team/list')
    teamMembers.value = res.list || []
  } catch (e) {
    console.error('加载团队列表失败', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTeamData()
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

.stats-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
  margin: 16px;
  padding: 24px;
  border-radius: 16px;
  color: white;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255,255,255,0.3);
}

.team-section {
  padding: 0 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.empty .tip {
  font-size: 12px;
  margin-top: 8px;
}

.team-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.member-item:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #999;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.member-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.member-performance {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

.invite-btn {
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 16px;
  cursor: pointer;
}
</style>
