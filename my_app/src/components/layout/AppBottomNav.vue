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
import { Home, Package, Gift, Users, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = computed(() => [
  { path: '/', label: 'الرئيسية', icon: Home },
  { path: '/products', label: 'المنتجات', icon: Package },
  { path: '/activities', label: 'الأنشطة', icon: Gift },
  { path: '/team', label: 'الفريق', icon: Users },
  { path: '/profile', label: 'حسابي', icon: User },
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
  background: rgba(10, 22, 16, 0.9);
  backdrop-filter: blur(24px) saturate(1.4);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
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
  color: #d0ac73;
  background: rgba(255, 255, 255, 0.06);
}

.nav-dot {
  position: absolute;
  bottom: 6px;
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #d0ac73;
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
