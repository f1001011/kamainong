<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div class="profile-hero-overlay"></div>
      <div class="profile-card identity-card">
        <div class="avatar-block">{{ initials }}</div>
        <div class="identity-copy">
          <p class="section-kicker">Profile Center</p>
          <h1>{{ profile.nickname || `User ${profile.id || ''}` }}</h1>
          <span>ID: {{ profile.id || '--' }}</span>
        </div>
      </div>

      <div class="profile-card balance-card">
        <div>
          <span>الرصيد المتاح</span>
          <strong>{{ CURRENCY }} {{ profile.availableBalance }}</strong>
        </div>
        <div class="balance-grid">
          <div>
            <span>المجمّد</span>
            <strong>{{ CURRENCY }} {{ profile.frozenBalance }}</strong>
          </div>
          <div>
            <span>دخل اليوم</span>
            <strong>{{ CURRENCY }} {{ profile.todayIncome }}</strong>
          </div>
          <div>
            <span>الإجمالي</span>
            <strong>{{ CURRENCY }} {{ profile.totalIncome }}</strong>
          </div>
        </div>
      </div>
    </section>

    <main class="profile-content">
      <section class="menu-card">
        <button v-for="item in menuItems" :key="item.path" class="menu-item" @click="router.push(item.path)">
          <div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </div>
          <span>›</span>
        </button>
      </section>

      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { useAuth } from '@/hooks/useAuth'
import { CURRENCY } from '@/config'

const router = useRouter()
const { logout } = useAuth()

const profile = ref({
  id: 0,
  nickname: '',
  availableBalance: '0.00',
  frozenBalance: '0.00',
  todayIncome: '0.00',
  totalIncome: '0.00',
})

const menuItems = [
  { path: '/settings', title: '设置中心', desc: '账户设置与偏好' },
  { path: '/security', title: '安全中心', desc: '密码、登录与防护' },
  { path: '/bank-cards', title: '银行卡', desc: '收付款方式管理' },
  { path: '/messages', title: '消息通知', desc: '系统消息与更新' },
  { path: '/profile/app-download', title: 'APP 下载', desc: '下载与安装移动端' },
]

const initials = computed(() => (profile.value.nickname || 'LL').slice(0, 2).toUpperCase())

async function loadProfile() {
  try {
    const res = await request.get('/user/profile')
    profile.value = {
      id: Number(res.id || 0),
      nickname: String(res.nickname || ''),
      availableBalance: String(res.availableBalance || '0.00'),
      frozenBalance: String(res.frozenBalance || '0.00'),
      todayIncome: String(res.todayIncome || '0.00'),
      totalIncome: String(res.totalIncome || '0.00'),
    }
  } catch {
    profile.value = {
      id: 0,
      nickname: '',
      availableBalance: '0.00',
      frozenBalance: '0.00',
      todayIncome: '0.00',
      totalIncome: '0.00',
    }
  }
}

function handleLogout() {
  logout()
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #fafaf7;
}

.profile-hero {
  position: relative;
  padding: 18px 16px 0;
}

.profile-hero-overlay {
  position: absolute;
  inset: 0 0 auto;
  height: 280px;
  background: linear-gradient(135deg, #17392a 0%, #0d6b3d 100%);
  border-bottom-left-radius: 34px;
  border-bottom-right-radius: 34px;
}

.profile-card {
  position: relative;
  z-index: 1;
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
}

.identity-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 22px;
  color: #fff;
}

.avatar-block {
  width: 84px;
  height: 84px;
  border-radius: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(208, 172, 115, 0.92), rgba(143, 108, 58, 0.92));
  color: #111;
  font-size: 28px;
  font-weight: 800;
}

.section-kicker {
  margin: 0 0 10px;
  color: rgba(208, 172, 115, 0.9);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.identity-copy h1 {
  margin: 0;
  font-size: 32px;
}

.identity-copy span {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.64);
}

.balance-card {
  margin-top: 16px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
}

.balance-card > div > span,
.balance-grid span,
.menu-item small {
  color: rgba(23, 57, 42, 0.54);
}

.balance-card > div > strong {
  display: block;
  margin-top: 10px;
  color: #17392a;
  font-size: 34px;
}

.balance-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.balance-grid strong {
  display: block;
  margin-top: 6px;
  color: #0d6b3d;
}

.profile-content {
  padding: 18px 16px 100px;
}

.menu-card {
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border: 0;
  background: transparent;
  text-align: right;
}

.menu-item + .menu-item {
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-item strong,
.menu-item span {
  color: #17392a;
}

.menu-item small {
  display: block;
  margin-top: 6px;
}

.logout-btn {
  width: 100%;
  margin-top: 18px;
  height: 54px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #b63a3a, #8f1f1f);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

@media (max-width: 640px) {
  .balance-grid {
    grid-template-columns: 1fr;
  }
}
</style>
