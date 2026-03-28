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
import { CalendarDays, Gamepad2, Home, Trophy, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = computed(() => [
  { path: '/', label: '首页', icon: Home },
  { path: '/games', label: '游戏', icon: Gamepad2 },
  { path: '/sports', label: '体育', icon: Trophy },
  { path: '/activities', label: '活动', icon: CalendarDays },
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
  bottom: 12px;
  z-index: 50;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding: 8px;
  border-radius: 26px;
  background: rgba(6, 31, 19, 0.88);
  backdrop-filter: blur(24px) saturate(1.4);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.26);
  border: 1px solid rgba(255, 255, 255, 0.08);
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
  color: #f4d66d;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(19, 101, 60, 0.12)),
    rgba(255, 255, 255, 0.04);
}

.nav-dot {
  position: absolute;
  bottom: 6px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(90deg, #f4d66d, #38bdf8);
  opacity: 0;
}

.bottom-nav-item.active .nav-dot {
  opacity: 1;
}

@media (min-width: 768px) {
  .bottom-nav {
    display: none;
  }
}
</style>
