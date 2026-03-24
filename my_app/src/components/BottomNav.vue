<template>
  <nav v-if="showNav" class="bottom-nav">
    <div class="nav-inner">
      <button
        v-for="item in navItems"
        :key="item.name"
        :class="['nav-item', { active: isActive(item) }]"
        :style="isActive(item) ? { '--nc': item.color } : {}"
        @click="router.push(item.path)"
      >
        <div class="nav-icon-wrap">
          <component :is="item.icon" :size="22" />
          <span v-if="isActive(item)" class="nav-dot"></span>
        </div>
        <span class="nav-label">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Home, Package, Gift, Users, User } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()

const navItems = [
  { name: 'Home', path: '/', icon: Home, color: '#ff4d4d', label: '首页' },
  { name: 'Products', path: '/products', icon: Package, color: '#00e5ff', label: '产品' },
  { name: 'Activities', path: '/activities', icon: Gift, color: '#ffb800', label: '活动' },
  { name: 'Team', path: '/team', icon: Users, color: '#69ff47', label: '团队' },
  { name: 'Profile', path: '/profile', icon: User, color: '#ff6b6b', label: '我的' },
]

const showNav = computed(() => {
  const hideNavRoutes = ['Login', 'Register']
  return !hideNavRoutes.includes(route.name as string)
})

function isActive(item: typeof navItems[0]) {
  return route.path === item.path || route.path.startsWith(item.path + '/')
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: stretch;
  height: 64px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(20, 20, 20, 0.85);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
}

.nav-inner {
  width: 100%;
  max-width: 460px;
  display: flex;
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.nav-item:active { transform: scale(0.88); }

.nav-item.active {
  color: var(--nc);
}

.nav-icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-dot {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--nc);
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 1;
}
</style>
