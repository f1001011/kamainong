<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-mark">L</div>
      <div>
        <div class="sidebar-brand-title">lendlease</div>
        <div class="sidebar-brand-sub">wealth architecture</div>
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
import { Home, Package, Gift, Bell, Users, User, Wallet, Shield } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/products', label: 'المنتجات', icon: Package },
  { path: '/activities', label: 'الأنشطة', icon: Gift },
  { path: '/messages', label: 'الرسائل', icon: Bell },
  { path: '/team', label: 'الفريق', icon: Users },
  { path: '/profile', label: 'الملف الشخصي', icon: User },
  { path: '/transactions', label: 'المعاملات', icon: Wallet },
  { path: '/security', label: 'الأمان', icon: Shield },
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
    right: 0;
    z-index: 40;
    width: 240px;
    min-height: 100vh;
    padding: 28px 18px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(24px);
    border-left: 1px solid rgba(0, 0, 0, 0.06);
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
    background: linear-gradient(135deg, #d0ac73, #8f6c3a);
    color: #111;
    font-weight: 800;
  }

  .sidebar-brand-title {
    color: #163b2a;
    font-size: 19px;
    font-weight: 700;
  }

  .sidebar-brand-sub {
    color: rgba(22, 59, 42, 0.52);
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
    color: rgba(22, 59, 42, 0.68);
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .sidebar-link.active {
    color: #163b2a;
    background: rgba(13, 107, 61, 0.08);
    box-shadow: inset 0 0 0 1px rgba(208, 172, 115, 0.26);
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    right: 0;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #d0ac73, #b38743);
  }
}
</style>
