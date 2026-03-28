<template>
  <div class="page-container">
    <!-- 顶部导航 -->
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">个人资料</h1>
      <div class="nav-btn"></div>
    </div>

    <!-- 头像和信息 -->
    <div class="profile-header">
      <div class="avatar-section">
        <div class="avatar">
          <img v-if="userInfo.avatarUrl" :src="userInfo.avatarUrl" alt="" />
          <User v-else :size="40" />
        </div>
        <div class="edit-avatar">编辑头像</div>
      </div>
      <div class="user-info">
        <div class="nickname">{{ userInfo.nickname || '用户' + userInfo.id }}</div>
        <div class="user-id">ID: {{ userInfo.id }}</div>
      </div>
    </div>

    <!-- VIP 信息 -->
    <div class="vip-card" v-if="userInfo.vipLevel">
      <div class="vip-info">
        <Crown :size="20" />
        <span>VIP {{ userInfo.vipLevel }}</span>
      </div>
      <div class="vip-progress">
        <div class="progress-bar" :style="{ width: vipProgress + '%' }"></div>
      </div>
      <div class="vip-tip">再消费 ${{ formatNumber(nextLevelAmount) }} 升级</div>
    </div>

    <!-- 资产概览 -->
    <div class="assets-card">
      <div class="assets-title">资产</div>
      <div class="assets-grid">
        <div class="asset-item">
          <div class="asset-value">${{ formatNumber(availableBalance) }}</div>
          <div class="asset-label">可用余额</div>
        </div>
        <div class="asset-item">
          <div class="asset-value">${{ formatNumber(frozenBalance) }}</div>
          <div class="asset-label">冻结余额</div>
        </div>
        <div class="asset-item">
          <div class="asset-value">${{ formatNumber(todayIncome) }}</div>
          <div class="asset-label">今日收益</div>
        </div>
        <div class="asset-item">
          <div class="asset-value">${{ formatNumber(totalIncome) }}</div>
          <div class="asset-label">累计收益</div>
        </div>
      </div>
    </div>

    <!-- 设置项 -->
    <div class="settings-section">
      <div class="setting-item" @click="router.push('/settings')">
        <Settings :size="20" />
        <span>设置</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item" @click="router.push('/security')">
        <Shield :size="20" />
        <span>安全中心</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item" @click="router.push('/bank-cards')">
        <CreditCard :size="20" />
        <span>银行卡</span>
        <ArrowRight :size="16" />
      </div>
      <div class="setting-item" @click="router.push('/messages')">
        <MessageCircle :size="20" />
        <span>消息</span>
        <ArrowRight :size="16" />
      </div>
    </div>

    <!-- 退出登录 -->
    <button class="logout-btn" @click="handleLogout">
      退出登录
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, User, Settings, Shield, CreditCard, MessageCircle, ArrowRight, Crown } from 'lucide-vue-next'
import request from '@/api/request'

const router = useRouter()

// 状态
const isLoading = ref(true)
const userInfo = ref<any>({
  id: 0,
  nickname: '',
  avatarUrl: '',
  vipLevel: 0
})
const availableBalance = ref(0)
const frozenBalance = ref(0)
const todayIncome = ref(0)
const totalIncome = ref(0)
const vipProgress = ref(0)
const nextLevelAmount = ref(0)

// 格式化数字
function formatNumber(num: number): string {
  return Math.floor(num).toLocaleString('zh-CN')
}

// 加载用户资料
async function loadProfile() {
  try {
    isLoading.value = true
    const res = await request.get('/user/profile')
    
    userInfo.value = {
      id: res.id,
      nickname: res.nickname,
      avatarUrl: res.avatarUrl,
      vipLevel: res.vipLevel || 0
    }
    availableBalance.value = parseFloat(res.availableBalance) || 0
    frozenBalance.value = parseFloat(res.frozenBalance) || 0
    todayIncome.value = parseFloat(res.todayIncome) || 0
    totalIncome.value = parseFloat(res.totalIncome) || 0
    
    // VIP 进度
    if (res.vipLevel !== undefined && res.vipLevel < 10) {
      vipProgress.value = Math.min((res.vipProgress || 0) * 100, 100)
      nextLevelAmount.value = res.nextLevelAmount || 0
    }
  } catch (e) {
    console.error('加载用户资料失败', e)
  } finally {
    isLoading.value = false
  }
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(() => {
  loadProfile()
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

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px;
  background: white;
  margin-bottom: 12px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: #999;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-avatar {
  font-size: 12px;
  color: #667eea;
  margin-top: 8px;
  cursor: pointer;
}

.user-info {
  flex: 1;
}

.nickname {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.user-id {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.vip-card {
  background: linear-gradient(135deg, #ffd700, #ffb800);
  margin: 0 16px 12px;
  padding: 16px;
  border-radius: 12px;
  color: #333;
}

.vip-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.vip-progress {
  height: 6px;
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #333;
  border-radius: 3px;
  transition: width 0.3s;
}

.vip-tip {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.8;
}

.assets-card {
  background: white;
  margin: 0 16px 12px;
  padding: 16px;
  border-radius: 12px;
}

.assets-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.assets-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.asset-item {
  text-align: center;
}

.asset-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.asset-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.settings-section {
  background: white;
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item span {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.setting-item svg:last-child {
  color: #ccc;
}

.logout-btn {
  display: block;
  width: calc(100% - 32px);
  margin: 24px 16px;
  padding: 14px;
  background: white;
  border: 1px solid #ff4d4d;
  border-radius: 12px;
  color: #ff4d4d;
  font-size: 14px;
  cursor: pointer;
}
</style>
