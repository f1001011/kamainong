<template>
  <div class="profile-desktop">
    <section
      v-motion
      class="profile-hero"
      :initial="{ opacity: 0, y: 18 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 400 } }"
    >
      <div class="hero-avatar">球迷</div>
      <div class="hero-copy">
        <p>Profile</p>
        <h1>桌面个人中心把高频动作、历史记录和退出路径拆成更清晰的控制区。</h1>
        <span>保留同一套 mock 数据，但在 PC 上重排层级，避免只是把手机卡片横向拉大。</span>
      </div>

      <div class="hero-stat-grid">
        <article>
          <strong>{{ actionItems.length }}</strong>
          <span>常用操作</span>
        </article>
        <article>
          <strong>{{ historyItems.length }}</strong>
          <span>记录入口</span>
        </article>
      </div>
    </section>

    <section class="profile-grid">
      <section
        v-motion
        class="panel actions-panel"
        :initial="{ opacity: 0, x: -18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 70 } }"
      >
        <div class="panel-head">
          <div>
            <p>操作</p>
            <h2>先处理充值和提现</h2>
          </div>
        </div>

        <div class="actions-grid">
          <button
            v-for="item in actionItems"
            :key="item.path"
            class="action-card"
            @click="router.push(item.path)"
          >
            <div class="action-icon">
              <component :is="iconFor(item.title)" :size="18" />
            </div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </button>
        </div>
      </section>

      <section
        v-motion
        class="panel history-panel"
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { duration: 420, delay: 100 } }"
      >
        <div class="panel-head">
          <div>
            <p>记录</p>
            <h2>继续查看历史数据</h2>
          </div>
        </div>

        <button
          v-for="item in historyItems"
          :key="item.path"
          class="history-link"
          @click="router.push(item.path)"
        >
          <div class="history-icon">
            <component :is="iconFor(item.title)" :size="18" />
          </div>
          <div class="history-copy">
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
          </div>
          <ChevronRight :size="18" />
        </button>

        <button class="logout-btn" @click="handleLogout">
          <LogOut :size="18" />
          <span>退出登录</span>
        </button>
      </section>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, History, LogOut, QrCode, Wallet } from 'lucide-vue-next'
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

function iconFor(title: string) {
  if (title.includes('充值')) return QrCode
  if (title.includes('提现')) return Wallet
  return History
}

function handleLogout() {
  logout()
}

onMounted(async () => {
  const data = await fetchProfileContent()
  menuItems.value = data.menuItems
})
</script>

<style scoped>
.profile-desktop {
  min-height: 100vh;
  padding: 28px 32px 40px;
  background:
    radial-gradient(circle at top right, rgba(125, 196, 244, 0.12), transparent 22%),
    linear-gradient(180deg, rgba(11, 31, 23, 0.06), transparent 240px),
    var(--wc-surface);
}

.profile-hero,
.profile-grid {
  max-width: 1400px;
  margin: 0 auto;
}

.profile-hero {
  padding: 28px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(260px, 0.46fr);
  gap: 22px;
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(11, 31, 23, 0.97), rgba(20, 52, 41, 0.93));
  color: var(--wc-text-on-dark);
  box-shadow: var(--wc-shadow-card);
}

.hero-avatar {
  width: 90px;
  height: 90px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--wc-gold-soft), #f4dfb5);
  color: var(--wc-bg);
  font-size: 22px;
  font-weight: 800;
}

.hero-copy p {
  margin: 0 0 10px;
  color: #a9dcc2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  max-width: 720px;
  font-size: 42px;
  line-height: 1.12;
}

.hero-copy span {
  display: block;
  margin-top: 14px;
  color: var(--wc-text-on-dark-soft);
  line-height: 1.75;
}

.hero-stat-grid {
  display: grid;
  gap: 12px;
}

.hero-stat-grid article {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.1);
}

.hero-stat-grid strong,
.hero-stat-grid span {
  display: block;
}

.hero-stat-grid strong {
  color: var(--wc-text-on-dark);
  font-size: 28px;
}

.hero-stat-grid span {
  margin-top: 8px;
  color: var(--wc-text-on-dark-soft);
  font-size: 13px;
}

.profile-grid {
  margin-top: 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.9fr);
  gap: 20px;
}

.panel {
  border-radius: 30px;
  border: 1px solid var(--wc-border);
  background: var(--wc-surface-elevated);
  box-shadow: var(--wc-shadow-card);
}

.actions-panel,
.history-panel {
  padding: 24px;
}

.panel-head p {
  margin: 0 0 10px;
  color: var(--wc-green-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 0;
  color: var(--wc-text);
  font-size: 30px;
  line-height: 1.2;
}

.actions-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.action-card,
.history-link {
  width: 100%;
  border: 0;
  background: rgba(27, 91, 65, 0.05);
}

.action-card {
  padding: 20px;
  border-radius: 24px;
  text-align: left;
}

.action-icon,
.history-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(27, 91, 65, 0.08);
  color: var(--wc-green);
}

.action-card strong,
.action-card small,
.history-copy strong,
.history-copy small {
  display: block;
}

.action-card strong {
  margin-top: 22px;
  color: var(--wc-text);
  font-size: 20px;
}

.action-card small {
  margin-top: 8px;
  color: var(--wc-text-soft);
  line-height: 1.65;
}

.history-link {
  margin-top: 14px;
  padding: 16px 18px;
  border-radius: 22px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  text-align: left;
}

.history-copy strong {
  color: var(--wc-text);
  font-size: 16px;
}

.history-copy small {
  margin-top: 6px;
  color: var(--wc-text-soft);
  line-height: 1.6;
}

.history-panel :deep(svg:last-child) {
  color: var(--wc-text-soft);
}

.logout-btn {
  width: 100%;
  margin-top: 18px;
  height: 56px;
  border: 0;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #d94a45, #b82f2a);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}
</style>
