<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">WC</div>
      <div>
        <div class="sidebar-brand-title">Football H5</div>
        <div class="sidebar-brand-sub">match center</div>
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
import { Gamepad2, Home, Trophy, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/games', label: '游戏', icon: Gamepad2 },
  { path: '/sports', label: '体育', icon: Trophy },
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
    background: rgba(11, 31, 23, 0.92);
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
    background: linear-gradient(135deg, var(--wc-gold-soft), var(--wc-blue));
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
    color: var(--wc-gold-soft);
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(231, 203, 148, 0.18);
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, var(--wc-gold), var(--wc-blue));
  }
}
</style>
