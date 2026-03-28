<template>
  <div class="page-container">
    <div class="top-nav">
      <button class="nav-btn" @click="router.back()">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="nav-title">安全中心</h1>
      <div class="nav-btn"></div>
    </div>

    <div class="security-list">
      <div class="security-item">
        <Lock :size="20" />
        <div class="security-info">
          <span>登录密码</span>
          <span class="security-status">已设置</span>
        </div>
        <button class="security-btn" @click="router.push('/settings/password')">修改</button>
      </div>
      <div class="security-item">
        <Shield :size="20" />
        <div class="security-info">
          <span>支付密码</span>
          <span class="security-status" :class="{ warning: !hasPayPassword }">
            {{ hasPayPassword ? '已设置' : '未设置' }}
          </span>
        </div>
        <button class="security-btn">{{ hasPayPassword ? '修改' : '设置' }}</button>
      </div>
      <div class="security-item">
        <Smartphone :size="20" />
        <div class="security-info">
          <span>手机绑定</span>
          <span class="security-status">{{ phoneMask }}</span>
        </div>
        <button class="security-btn">修改</button>
      </div>
      <div class="security-item">
        <Mail :size="20" />
        <div class="security-info">
          <span>邮箱绑定</span>
          <span class="security-status" :class="{ warning: !email }">
            {{ email || '未绑定' }}
          </span>
        </div>
        <button class="security-btn">绑定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Lock, Shield, Smartphone, Mail } from 'lucide-vue-next'
import request from '@/api/request'

const router = useRouter()

const hasPayPassword = ref(false)
const phone = ref('')
const email = ref('')

const phoneMask = computed(() => {
  if (!phone.value) return '未绑定'
  return phone.value.slice(0, 3) + '****' + phone.value.slice(-4)
})

async function loadSecurityInfo() {
  try {
    const res = await request.get('/user/profile')
    phone.value = res.phone || ''
    email.value = res.email || ''
    hasPayPassword.value = res.hasPayPassword || false
  } catch (e) {
    console.error('加载安全信息失败', e)
  }
}

onMounted(() => {
  loadSecurityInfo()
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

.security-list {
  margin: 16px;
  background: white;
  border-radius: 12px;
}

.security-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.security-info span:first-child {
  font-size: 14px;
  color: #333;
}

.security-status {
  font-size: 12px;
  color: #4caf50;
}

.security-status.warning {
  color: #ff9800;
}

.security-btn {
  padding: 6px 16px;
  border-radius: 16px;
  border: 1px solid #667eea;
  background: white;
  color: #667eea;
  font-size: 12px;
  cursor: pointer;
}
</style>
