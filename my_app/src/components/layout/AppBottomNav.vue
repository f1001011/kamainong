<template>
  <nav class="bottom-nav">
    <button
      v-for="item in navItems"
      :key="item.path"
      class="bottom-nav-item"
      :class="{ active: isActive(item.path) }"
      @click="router.push(item.path)"
    >
      <component :is="item.icon" :size="20" />
      <span>{{ item.label }}</span>
      <i class="nav-dot"></i>
    </button>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Gamepad2, Home, Trophy, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = computed(() => [
  { path: '/', label: '首页', icon: Home },
  { path: '/games', label: '游戏', icon: Gamepad2 },
  { path: '/sports', label: '体育', icon: Trophy },
  { path: '/profile', label: '我的', icon: User },
])

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  border-radius: 26px;
  background: rgba(11, 31, 23, 0.88);
  backdrop-filter: blur(24px) saturate(1.4);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.bottom-nav-item {
  position: relative;
  min-height: 58px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
}

.bottom-nav-item.active {
  color: var(--wc-gold-soft);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(45, 116, 86, 0.12)),
    rgba(255, 255, 255, 0.04);
}

.nav-dot {
  position: absolute;
  bottom: 6px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--wc-gold), var(--wc-blue));
  opacity: 0;
}

.bottom-nav-item.active .nav-dot {
  opacity: 1;
}

@media (min-width: 1100px) {
  .bottom-nav {
    display: none;
  }
}
</style>
