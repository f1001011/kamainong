<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">WC</div>
      <div>
        <div class="sidebar-brand-title">World Cup H5</div>
        <div class="sidebar-brand-sub">football showcase</div>
      </div>
    </div>

    <nav class="sidebar-nav">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="sidebar-link"
        :class="{ active: isActive(item.path) }"
        @click="router.push(item.path)"
      >
        <component :is="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, Home, Trophy, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/sports', label: '体育', icon: Trophy },
  { path: '/activities', label: '活动', icon: CalendarDays },
  { path: '/profile', label: '我的', icon: User },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.sidebar {
  display: none;
}

@media (min-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 40;
    width: 240px;
    min-height: 100vh;
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    background: rgba(8, 26, 18, 0.9);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sidebar-brand-mark {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f4d66d, #2dd4bf);
    color: #052f1b;
    font-size: 12px;
    font-weight: 800;
  }

  .sidebar-brand-title {
    color: #ffffff;
    font-size: 19px;
    font-weight: 700;
  }

  .sidebar-brand-sub {
    color: rgba(255, 255, 255, 0.5);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sidebar-link {
    position: relative;
    border: 0;
    border-radius: 16px;
    padding: 13px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    background: transparent;
    color: rgba(255, 255, 255, 0.72);
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .sidebar-link.active {
    color: #f4d66d;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(244, 214, 109, 0.18);
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #f4d66d, #38bdf8);
  }
}
</style>
