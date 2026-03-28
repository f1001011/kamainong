<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div class="avatar">球迷</div>
      <div class="hero-copy">
        <p>我的</p>
        <h1>世界杯个人中心</h1>
        <span>统一为中文、静态入口与赛事风格视觉。</span>
      </div>
    </section>

    <section class="menu-card">
      <button v-for="item in profileMenuItems" :key="item.path" class="menu-item" @click="router.push(item.path)">
        <div>
          <strong>{{ item.title }}</strong>
          <small>{{ item.desc }}</small>
        </div>
        <span>›</span>
      </button>
    </section>

    <button class="logout-btn" @click="handleLogout">退出登录</button>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/hooks/useAuth'
import { profileMenuItems } from '@/config/worldCup'

const router = useRouter()
const { logout } = useAuth()

function handleLogout() {
  logout()
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 16px 14px 110px;
}

.profile-hero,
.menu-card {
  border-radius: 28px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.14);
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 18px;
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.14), transparent 22%),
    linear-gradient(180deg, rgba(8, 44, 28, 0.96), rgba(8, 44, 28, 0.88));
  color: #fff;
}

.avatar {
  width: 74px;
  height: 74px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f4d66d, #2dd4bf);
  color: #07321d;
  font-size: 20px;
  font-weight: 800;
}

.hero-copy p {
  margin: 0 0 8px;
  color: #9ae6b4;
  letter-spacing: 0.12em;
  font-size: 12px;
}

.hero-copy h1 {
  margin: 0;
  font-size: 28px;
}

.hero-copy span {
  display: block;
  margin-top: 8px;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.6;
}

.menu-card {
  margin-top: 16px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.96);
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 0;
  background: transparent;
  text-align: left;
}

.menu-item + .menu-item {
  border-top: 1px solid rgba(8, 44, 28, 0.08);
}

.menu-item strong {
  display: block;
  color: #0d3b23;
  font-size: 16px;
}

.menu-item small {
  display: block;
  margin-top: 6px;
  color: rgba(13, 59, 35, 0.62);
  line-height: 1.6;
}

.menu-item span {
  color: #0d3b23;
  font-size: 24px;
}

.logout-btn {
  width: 100%;
  margin-top: 16px;
  height: 54px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

@media (min-width: 768px) {
  .profile-page {
    max-width: 720px;
    padding: 24px 24px 40px;
  }
}
</style>
