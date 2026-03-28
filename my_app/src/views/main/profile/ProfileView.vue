<template>
  <div class="profile-page">
    <section class="profile-hero">
      <div class="hero-avatar">球迷</div>
      <div class="hero-copy">
        <p>我的</p>
        <h1>个人中心更像入口页，不像后台设置页</h1>
        <span>把高频动作放到前面，把历史记录放到下面，单手操作更直接。</span>
      </div>
    </section>

    <section class="action-grid">
      <button
        v-for="item in actionItems"
        :key="item.path"
        class="action-card"
        @click="router.push(item.path)"
      >
        <div class="action-icon">{{ item.title.slice(0, 1) }}</div>
        <strong>{{ item.title }}</strong>
        <small>{{ item.desc }}</small>
      </button>
    </section>

    <section class="record-panel">
      <div class="section-head">
        <div>
          <p>记录</p>
          <h2>继续查看历史数据</h2>
        </div>
      </div>

      <button
        v-for="item in historyItems"
        :key="item.path"
        class="record-link"
        @click="router.push(item.path)"
      >
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
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/hooks/useAuth'
import { fetchProfileContent } from '@/services/worldCupContent'

interface MenuItem {
  title: string
  desc: string
  path: string
}

const router = useRouter()
const { logout } = useAuth()
const menuItems = ref<MenuItem[]>([])

const actionItems = computed(() => menuItems.value.slice(0, 2))
const historyItems = computed(() => menuItems.value.slice(2))

function handleLogout() {
  logout()
}

onMounted(async () => {
  const data = await fetchProfileContent()
  menuItems.value = data.menuItems
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 12px 12px calc(112px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, var(--wc-bg) 0 220px, var(--wc-surface) 220px 100%);
}

.profile-hero,
.record-panel,
.action-card {
  border-radius: var(--wc-radius-xl);
  box-shadow: var(--wc-shadow-card);
}

.profile-hero {
  padding: 22px 18px;
  display: flex;
  gap: 16px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.96), rgba(20, 52, 41, 0.92));
  color: var(--wc-text-on-dark);
}

.hero-avatar {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--wc-gold-soft), #f4dfb5);
  color: var(--wc-bg);
  font-size: 18px;
  font-weight: 800;
}

.hero-copy p {
  margin: 0 0 8px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.hero-copy h1 {
  margin: 0;
  font-size: 28px;
  line-height: 1.18;
}

.hero-copy span {
  display: block;
  margin-top: 10px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.7;
}

.action-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.action-card {
  padding: 18px;
  border: 1px solid var(--wc-border);
  background: var(--wc-surface-elevated);
  text-align: left;
}

.action-icon {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-green);
  font-size: 16px;
  font-weight: 800;
}

.action-card strong,
.action-card small {
  display: block;
}

.action-card strong {
  margin-top: 18px;
  color: var(--wc-text);
  font-size: 18px;
}

.action-card small {
  margin-top: 8px;
  color: var(--wc-text-soft);
  line-height: 1.6;
}

.record-panel {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid var(--wc-border);
  background: var(--wc-surface-elevated);
}

.section-head p {
  margin: 0 0 8px;
  color: var(--wc-green-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

.section-head h2 {
  margin: 0;
  color: var(--wc-text);
  font-size: 24px;
}

.record-link {
  width: 100%;
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border: 0;
  border-top: 1px solid var(--wc-border);
  background: transparent;
  text-align: left;
}

.record-link strong,
.record-link small {
  display: block;
}

.record-link strong {
  color: var(--wc-text);
  font-size: 16px;
}

.record-link small {
  margin-top: 6px;
  color: var(--wc-text-soft);
  line-height: 1.6;
}

.record-link span {
  color: var(--wc-text-soft);
  font-size: 24px;
}

.logout-btn {
  width: 100%;
  margin-top: 16px;
  height: 54px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #d94a45, #b82f2a);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}

@media (min-width: 768px) {
  .profile-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 24px 40px;
  }
}
</style>
